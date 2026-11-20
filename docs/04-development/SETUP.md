🔗 Roadmap and tasks are in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# SETUP — Running locally

## Prerequisites

- **Node.js** >= 24
- **pnpm** >= 9.15.4 (the project is pinned to `pnpm@9.15.4` via `packageManager`)
- A TMDB API access token (read access token)
- For `pnpm emulators`, `pnpm test:e2e` and `pnpm test:rules`: Java and a global `firebase-tools`

## Installation

```bash
pnpm install
```

The `prepare` script sets up Husky (git hooks) automatically.

## Environment variables

Create a `.env` file in the **root** of the repository:

```bash
TMDB_API_READ_TOKEN=<your TMDB read access token>
```

- Get the token here: https://www.themoviedb.org/settings/api (API Read Access Token).
- `.env` is **not committed**. The token is used both in dev (the Vite proxy adds `Authorization` to requests to `/api/tmdb`) and in production (the Firebase Function `tmdbProxy` via `defineSecret`).
- For the Firebase emulators (`pnpm emulators`) the secret is read from `functions/.secret.local`: copy `functions/.secret.local.example` and put the token in it (not committed).

## Running the Firebase emulators

```bash
pnpm emulators   # build:deploy, then Hosting on http://127.0.0.1:5010, Functions on 5011, Firestore on 5012, Auth on 5013
```

This serves the merged `dist/` with the rewrites and headers from `firebase.json`, so use it to check those before a deploy. Requires a global `firebase-tools` and Java, which the Firestore emulator runs on.

It runs on the `demo` alias (`demo-cinepulse`), which cannot reach real Firebase resources. Without `functions/.secret.local`, `/api/tmdb/*` answers `500` with `no-store`; the static pages still work. Avoid `--project cinepulse-eec15` here: without that file the emulator would read the production secret from Secret Manager.

## Running in development mode

All apps at once (via Turborepo):

```bash
pnpm dev
```

Or individually:

```bash
pnpm --filter @repo/host dev       # Host (shell)      — port 5000
pnpm --filter @repo/pages-mfe dev  # Public catalog    — port 5001
pnpm --filter @repo/user-mfe dev   # User account      — port 5002
```

The app entry point is **http://localhost:5000** (host).

### Ports

| App | Package | Port |
|-----------|-------|:----:|
| Host (shell) | `@repo/host` | 5000 |
| Pages MFE | `@repo/pages-mfe` | 5001 |
| User MFE | `@repo/user-mfe` | 5002 |

Ports are fixed (`strictPort: true`): if a port is taken, the app does not start (it does not fall back to another port).

### MFE startup order

At runtime the host loads the `remoteEntry.js` of each remote module. So **the remotes (5001, 5002) must be reachable** when the host tries to load them. `pnpm dev` starts everything in parallel; if you start them manually, start the remotes before or together with the host. If a remote is unreachable, its paths show `RemoteUnavailable` with a "Try again" button, the other remote keeps working, and `mfe:error` is logged in development.

### Hybrid mode (remote from staging)

You can override a remote module's URL via env (e.g. so a local host works with the staging version of an MFE):

```bash
PAGES_MFE_URL=https://staging.example.com/pages-mfe/remoteEntry.js pnpm --filter @repo/host dev
USER_MFE_URL=https://staging.example.com/user-mfe/remoteEntry.js pnpm --filter @repo/host dev
```

## Build

```bash
pnpm build          # build all packages and apps (turbo)
pnpm build:deploy   # empty the dist folders, build, merge the dist of all MFEs into a single folder for Firebase
```

## Useful scripts

| Command | Purpose |
|---------|-------------|
| `pnpm lint` | Linting via Biome (turbo for the packages, then `e2e/` and `playwright.config.ts`) plus the JSX-spread/`asChild` check (`pnpm lint:jsx-spread`) |
| `pnpm format` | Formatting via Biome |
| `pnpm check` | Biome check with fixes applied automatically |
| `pnpm typecheck` | TypeScript type checking (turbo for the packages, then `e2e/` and `playwright.config.ts`) |
| `pnpm test` | Vitest over every project; `pnpm test:coverage` adds a merged report in `coverage/` |
| `pnpm test:e2e` | Playwright on the merged `dist/` with the Hosting, Auth and Firestore emulators (run `pnpm build:deploy` first) |
| `pnpm test:rules` | Firestore rules tests on the emulator |
| `pnpm size` | Host JS budget from `.size-limit.json` (run `pnpm build:deploy` first) |
| `pnpm emulators` | `build:deploy`, then Hosting, Functions, Firestore and Auth emulators |
| `pnpm build:deploy` | Empty the `dist/` folders, build + merge the MFE `dist/` folders |
| `pnpm run deploy` | Build, merge and deploy to Firebase Hosting (production) |

## Remote module types

The host type-checks a remote's `routes` against the declarations in `apps/host/src/@types/remotes/*.d.ts`, written by hand. After changing what a remote exposes, update its file there. The Module Federation plugin also writes `apps/host/@mf-types/` while the host runs; this folder is ignored by git, and `tsc` does not read it.

## Troubleshooting

- **Host does not see pages / "This section is unavailable"** — make sure `pages-mfe` (5001) and `user-mfe` (5002) are running and `remoteEntry.js` is reachable. The host logs the loading error in the dev console as `[mfe:error] <name>`.
- **Port is taken** — because of `strictPort: true` the app will crash; free the port (5000/5001/5002) or stop the previous process.
- **Empty data / 401 from TMDB** — check `TMDB_API_READ_TOKEN` in the (root) `.env` and that it is the Read Access Token, not the API Key v3.
- **Remote types out of sync** — update the remote's declaration in `apps/host/src/@types/remotes/`.
- **Unstyled remote in the integration** — only the host's CSS loads, and its `@source` must cover the remote (ADR-0009). Restart the host after adding a remote.
- **`vite build` of the host fails on `PAGES_MFE_URL` / `USER_MFE_URL`** — production builds read them from `apps/host/.env.production` (the host reads env from its own directory, TMDB variables from the repo root).
