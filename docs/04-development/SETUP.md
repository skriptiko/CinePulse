🔗 Roadmap and tasks are in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# SETUP — Running locally

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9.15.4 (the project is pinned to `pnpm@9.15.4` via `packageManager`)
- A TMDB API access token (read access token)

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
- For the Functions emulator (`pnpm --filter @repo/functions serve`) the secret is read from `functions/.secret.local`: copy `functions/.secret.local.example` and put the token in it (not committed).

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

At runtime the host loads the `remoteEntry.js` of each remote module. So **the remotes (5001, 5002) must be reachable** when the host tries to load them. `pnpm dev` starts everything in parallel; if you start them manually, start the remotes before or together with the host. If a remote is unreachable, the host logs a route loading error and shows an empty set of routes.

### Hybrid mode (remote from staging)

You can override a remote module's URL via env (e.g. so a local host works with the staging version of an MFE):

```bash
PAGES_MFE_URL=https://staging.example.com/pages-mfe/remoteEntry.js pnpm --filter @repo/host dev
USER_MFE_URL=https://staging.example.com/user-mfe/remoteEntry.js pnpm --filter @repo/host dev
```

## Build

```bash
pnpm build          # build all packages and apps (turbo)
pnpm build:deploy   # build + merge the dist of all MFEs into a single folder for Firebase
```

## Useful scripts

| Command | Purpose |
|---------|-------------|
| `pnpm lint` | Linting via Biome (turbo) |
| `pnpm format` | Formatting via Biome |
| `pnpm check` | Biome check with fixes applied automatically |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm sync-types` | Sync remote module types into the host |
| `pnpm build:deploy` | Build + merge the MFE `dist/` folders |
| `pnpm deploy` | Build, merge and deploy to Firebase Hosting (production) |

## Remote module types

The host gets the remote types in `apps/host/src/@types/remotes/` and `apps/host/@mf-types/`. After changing a remote module's exposed API, update the types:

```bash
pnpm sync-types
```

## Troubleshooting

- **Host does not see pages / "Failed to load remote routes"** — make sure `pages-mfe` (5001) and `user-mfe` (5002) are running and `remoteEntry.js` is reachable. The host logs the loading error in the dev console.
- **Port is taken** — because of `strictPort: true` the app will crash; free the port (5000/5001/5002) or stop the previous process.
- **Empty data / 401 from TMDB** — check `TMDB_API_READ_TOKEN` in the (root) `.env` and that it is the Read Access Token, not the API Key v3.
- **Remote types out of sync** — run `pnpm sync-types` (requires the remote modules to be built first).
- **CORS / conflicting styles** — make sure each MFE started on its own port with its own style scope prefix.
