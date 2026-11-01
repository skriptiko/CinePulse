🔗 Roadmap and tasks are in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# Environments

Status: **🟡** — local dev, PR previews and production exist; there is no separate staging.

## Overview

| Environment | Where | Hosting | TMDB access | Status |
|-----------|-----|---------|-------------|:---:|
| **Local dev** | local machine | Vite dev servers (5000/5001/5002) | Vite proxy + `.env` | ✅ |
| **PR preview** | Firebase | A Hosting channel of `cinepulse-eec15`, for 7 days | The production `tmdbProxy` | ✅ |
| **Production** | Firebase | Firebase Hosting `cinepulse-eec15` | Cloud Function `tmdbProxy` + Secret | ✅ |
| **Staging / Preview** | — | — | — | ⬜ none |

## Local dev

Three Vite servers (Module Federation), started together via `pnpm dev` (Turbo):

| App | Role | Port |
|-----------|------|------|
| `@repo/host` | shell | 5000 |
| `@repo/pages-mfe` | remote: Home, Movies, TV Shows | 5001 |
| `@repo/user-mfe` | remote: Profile, Settings, Watchlist | 5002 |

- Ports are fixed (`strictPort: true`).
- **TMDB in dev:** the Vite proxy (`vite.config.ts`) intercepts `/api/tmdb` → `https://api.themoviedb.org/3`, adding the `Authorization: Bearer ${TMDB_API_READ_TOKEN}` header from the root `.env`.
- Hybrid mode: set staging URLs for the remotes via `PAGES_MFE_URL` / `USER_MFE_URL` (see [SETUP](../04-development/SETUP.md)).

## production

- **Firebase project:** `cinepulse-eec15` (from `.firebaserc`, default).
- **Hosting target:** `production` → site `cinepulse-eec15` (domain like `https://cinepulse-eec15.web.app`).
- **Public dir:** `dist` (merged via `merge-dist.js`).
- **TMDB in prod:** Cloud Function `tmdbProxy` with the token from Secret Manager (`defineSecret('TMDB_API_READ_TOKEN')`) — the token does **not** end up in the client bundle. The function only serves an allowlist of read-only TMDB paths and sets `Cache-Control` so Hosting's CDN caches successful responses (see [ADR-0003](../03-architecture/decisions/ADR-0003-tmdb-proxy.md)).

**Rewrites (`firebase.json`):**
| Pattern | Destination |
|--------|-------------|
| `/api/tmdb/**` | function `tmdbProxy` |
| `/pages-mfe/**` | `/pages-mfe/index.html` |
| `/user-mfe/**` | `/user-mfe/index.html` |
| `**` | `/index.html` (SPA fallback) |

**Headers:** the host and remotes are served from the same origin, so there are no CORS headers. All responses get security headers: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`. Firebase Hosting adds HSTS itself.

**Cache:** Hosting headers override those set by a function, so `Cache-Control` must not be set on `/api/**`, or `tmdbProxy`'s value is lost and the CDN stops caching TMDB responses. That is why the `no-cache` rule for SPA routes is a regex rather than `**`: it matches every path except `/api/*`, spelled out without lookahead because Hosting uses RE2. Later rules win: `**/assets/**` is `immutable`, `remoteEntry.js` and `index.html` are `no-cache`.

## Environment variables

| Variable | Local dev | Production |
|--------|-----------|-----------|
| `TMDB_API_READ_TOKEN` | root `.env`, used by the Vite proxy | Firebase Secret Manager (`defineSecret`) in the function |
| `PAGES_MFE_URL` | (optional) remote staging URL for hybrid dev | — |
| `USER_MFE_URL` | (optional) remote staging URL for hybrid dev | — |

> `.env` is not committed. An example/instructions are in the root `.env` (a template with a comment).

## PR previews

Every PR that a person opens from this repository gets a Firebase Hosting preview channel, built by the jobs `preview-build` and `preview`, with the link in a comment on the PR. A new push replaces it. The channel expires 7 days after the last push, and closing the PR does not remove it: a bad build stays up until then unless it is deleted with `firebase hosting:channel:delete`.

A preview replaces only the Hosting content. Everything behind it is production:

- **Firestore and Auth are the real ones.** The channel domain is added to the authorized domains by the deploy, so Google sign-in works, and a watchlist change on a preview writes to the real data with the code of the PR.
- **`tmdbProxy` is the deployed one.** A PR that adds a proxy endpoint gets a 400 or a 404 on its preview until that function reaches production.
- **`firestore.rules` are the deployed ones.** A PR that changes them is not covered.
- **`firebase.json` is the one of the base branch.** A PR that changes headers or rewrites does not show them on its preview.

## staging

⬜ **There is no separate staging environment.** Production deploys on `push` to `main`. A permanent `staging` channel would share the production data in the same way as a preview.
