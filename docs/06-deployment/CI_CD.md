🔗 Roadmap and tasks are in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# CI/CD

Automatic deployment to Firebase Hosting (+ Cloud Functions) via GitHub Actions. Stage status: **🟡 partial** — deployment and quality gates (lint + typecheck + test) work; there is no documented rollback.

## GitHub Actions

Pipeline: [`.github/workflows/firebase-deploy.yml`](../../.github/workflows/firebase-deploy.yml).

- **Triggers:** `push` to `main` and `develop`, any `pull_request`.
- **Runner:** `ubuntu-latest`, Node.js `24`, pnpm from `packageManager` in `package.json`.
- **Job `quality`** (on every trigger):
  1. checkout, pnpm, Node (`pnpm` cache).
  2. `pnpm install --frozen-lockfile` — fails if `pnpm-lock.yaml` is out of sync with `package.json`.
  3. `pnpm lint` (Biome + JSX-spread ban).
  4. `pnpm typecheck`.
  5. `pnpm test`.
- **Job `size`** (on every trigger, not required for merge): `pnpm turbo build --filter=@repo/host` → `pnpm size` (budget in `.size-limit.json`).
- **Job `rules`** (on every trigger): sets up Java 21 and runs the Firestore rules tests on the emulator.
- **Job `e2e`** (PRs into `main` only): `pnpm build:deploy`, then Playwright on the merged `dist/` with the Hosting and Auth emulators.
- **Job `build-and-deploy`** (`needs: [quality, rules]`, push to `main` only, no concurrent deploys):
  1. The same checkout / pnpm / Node / install.
  2. `pnpm build:deploy` — Turbo builds all apps and packages except the `apps/design` sandbox (it does not go to production), and `scripts/merge-dist.js` merges `dist/` (see below). Locally it is the same command.
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

Rewrites in `firebase.json` route `/pages-mfe/**` and `/user-mfe/**` to their respective `index.html`, and everything else to the SPA fallback `/index.html`.

**Local deploy scripts** (`package.json`):
- `pnpm build:deploy` = `turbo build --filter=!@repo/design && pnpm merge-dist` (same as in CI).
- `pnpm deploy` = `pnpm build:deploy && firebase deploy --only hosting:production`.

## Quality gates

🟢 **Lint, typecheck, tests** — job `quality`; deployment depends on it (`needs`), so a failure stops the deploy. On a PR the checks are visible in the Checks tab.

🟢 **Firestore rules** — job `rules`; deployment depends on it too.

🟢 **E2E** — job `e2e` on PRs into `main`.

🟡 **Bundle budget** — job `size` reports on every trigger but does not block the deploy.

⬜ **Branch protection** — to make sure a PR cannot be merged with a red `quality`, enable a required check in the repo settings (GitHub → Settings → Branches → `main`). See [TEST_STRATEGY → CI](../05-testing/TEST_STRATEGY.md#ci).

## Rollback

⬜ **Not documented.** Recommended approach via Firebase Hosting (each deploy = a separate release):

- **Via the console:** Firebase Console → Hosting → release history → pick the previous healthy one → "Rollback".
- **Via the CLI (approximate):**
  ```bash
  firebase hosting:clone cinepulse-eec15:live:<PREV_VERSION> cinepulse-eec15:live
  ```
- **Via Git:** `revert` the problematic commit in `main` → the pipeline deploys the previous state.

**TODO:** record a verified rollback procedure and add it to the [RUNBOOK](../07-operations/RUNBOOK.md).
