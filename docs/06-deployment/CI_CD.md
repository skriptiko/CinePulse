🔗 Roadmap and tasks are in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# CI/CD

Automatic deployment to Firebase Hosting (+ Cloud Functions) via GitHub Actions. Stage status: **✅** — deployment, PR previews and quality gates (lint + typecheck + test, e2e for PRs into `main`) work; a verified rollback procedure is out of scope (see [Rollback](#rollback)).

## GitHub Actions

Pipeline: [`.github/workflows/firebase-deploy.yml`](../../.github/workflows/firebase-deploy.yml).

- **Triggers:** `push` to `main` and `develop`, any `pull_request`.
- **Runner:** `ubuntu-latest`, Node.js `24`, pnpm from `packageManager` in `package.json`.
- **Job `quality`** (on every trigger):
  1. checkout, pnpm, Node (`pnpm` cache).
  2. `pnpm install --frozen-lockfile` — fails if `pnpm-lock.yaml` is out of sync with `package.json`.
  3. `pnpm lint` (Biome, `e2e/` included, + JSX-spread ban).
  4. `pnpm typecheck` (`e2e/` included).
  5. `pnpm test`.
- **Job `size`** (on every trigger; required for a merge into `main`, and the deploy waits for it): `pnpm turbo build --filter=@repo/host` → `pnpm size` (budget in `.size-limit.json`).
- **Job `rules`** (on every trigger): sets up Java 25 and runs the Firestore rules tests on the emulator.
- **Job `e2e`** (PRs into `main` only): `pnpm build:deploy`, then Playwright on the merged `dist/` with the Hosting, Auth and Firestore emulators. Sets up Java 25 for Firestore.
- **Jobs `preview-build` and `preview`** (`needs: [quality, rules]`, PRs by a person from this repository only; a new push cancels the run of the one before it; not required checks):
  1. `preview-build` has no secrets and a read-only token: `pnpm build:deploy`, then uploads `dist/` as an artifact.
  2. `preview` holds the deploy key and runs no code of the PR: it checks out the base branch, for its `firebase.json`, downloads `dist/`, and calls `FirebaseExtended/action-hosting-deploy@v0` with no `channelId` and `expires: 7d`. The action names the channel after the PR and comments its link there.

  The two jobs keep install scripts, build plugins and a `predeploy` command in a PR away from the key. Forks are left out, as they get no secrets, and so are bots, whose updates nobody reads before they run. See [ENVIRONMENTS.md](./ENVIRONMENTS.md#pr-previews).
- **Job `build-and-deploy`** (`needs: [quality, rules, size]`, push to `main` only, no concurrent deploys):
  1. The same checkout / pnpm / Node / install.
  2. `pnpm build:deploy` — `scripts/clean-dist.js` empties the build folders (see below), Turbo builds all apps and packages, and `scripts/merge-dist.js` merges `dist/` (see below). Locally it is the same command.
  3. Functions deploy (`firebase deploy --only functions`) — first, because the `/api/tmdb/**` rewrite points to `tmdbProxy`.
  4. Firestore rules deploy (`firebase deploy --only firestore:rules`).
  5. `FirebaseExtended/action-hosting-deploy@v0` — deploys to `projectId: cinepulse-eec15`, `target: production`, `channelId: live`.

**GitHub secrets:**

| Secret | Purpose |
|--------|-------------|
| `FIREBASE_SERVICE_ACCOUNT` | Service account for deploying to Firebase |
| `GITHUB_TOKEN` | Standard Actions token (`repoToken`) |

## Functions

Firebase Function `tmdbProxy` ([`functions/src/index.ts`](../../functions/src/index.ts)) — a proxy to TMDB.

- Source: `functions` (from `firebase.json`), codebase `default`.
- **Predeploy hook:** `pnpm --filter @repo/functions build` — the functions are built before deployment.
- The `TMDB_API_READ_TOKEN` secret comes via `defineSecret` (Firebase Secret Manager), not from code.
- Rewrite `/api/tmdb/**` → the `tmdbProxy` function (from `firebase.json`).
- Read-only allowlisted proxy (GET/HEAD, fixed paths and query params, neutral `502`/`503` for upstream errors, CDN `Cache-Control` on 2xx); full rules in [ADR-0003](../03-architecture/decisions/ADR-0003-tmdb-proxy.md).
- Build: `tsc -p tsconfig.build.json` (tests in `src/**/__tests__` stay out of `dist/`); the rules are unit-tested by the `functions` Vitest project in `pnpm test`.

## Build and merge

Each app (`host`, `pages-mfe`, `user-mfe`) is built into its own `dist/`. Since Firebase Hosting serves a single `dist` folder (from `firebase.json`), the [`scripts/merge-dist.js`](../../scripts/merge-dist.js) script merges them:

- clears/creates the root `/dist`;
- `apps/host/dist` → the root of `/dist` (the shell app);
- `apps/pages-mfe/dist` → `/dist/pages-mfe`;
- `apps/user-mfe/dist` → `/dist/user-mfe`.

Rewrites in `firebase.json` are regexes that match only paths without a dot: `^/pages-mfe/[^.]*$` and `^/user-mfe/[^.]*$` go to their respective `index.html`, and `^/[^.]*$` to the SPA fallback `/index.html`. A file request (a path with a dot) is never rewritten, so a missing file is a 404.

Before the build, [`scripts/clean-dist.js`](../../scripts/clean-dist.js) empties `dist/` and the `dist/` of every app. A Turbo cache hit restores files over a folder without clearing it, so chunks of another build would stay, reach Hosting through the merge and count in `pnpm size`. CI starts from a clean checkout and is not affected; a local `turbo build` on its own still is.

**Local deploy scripts** (`package.json`):
- `pnpm build:deploy` = `pnpm clean-dist && turbo build && pnpm merge-dist` (same as in CI).
- `pnpm deploy` = `pnpm build:deploy && firebase deploy --only hosting:production`.

## Quality gates

🟢 **Lint, typecheck, tests** — job `quality`; deployment depends on it (`needs`), so a failure stops the deploy. On a PR the checks are visible in the Checks tab.

🟢 **Firestore rules** — job `rules`; deployment depends on it too.

🟢 **E2E** — job `e2e` on PRs into `main`.

🟢 **Bundle budget** — job `size` fails when the host is over `.size-limit.json`; it blocks the merge into `main` and the deploy.

🟢 **Rulesets** — `main` takes changes only through a PR with green `quality`, `rules`, `e2e`, `size` and `pr-title`, merged with a merge commit; no approval is required. `develop` keeps direct pushes. Both forbid force-pushes and deletion. Do not enable auto-delete of head branches: the head of a release PR is `develop`.

## Rollback

Out of scope: no verified procedure is planned, as Firebase Hosting can roll a release back from the console (see the [roadmap (Notion)](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)). Recommended approach via Firebase Hosting (each deploy = a separate release):

- **Via the console:** Firebase Console → Hosting → release history → pick the previous healthy one → "Rollback".
- **Via the CLI (approximate):**
  ```bash
  firebase hosting:clone cinepulse-eec15:live:<PREV_VERSION> cinepulse-eec15:live
  ```
- **Via Git:** `revert` the problematic commit in `main` → the pipeline deploys the previous state.
