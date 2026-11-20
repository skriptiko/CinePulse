# CinePulse

A movie and TV catalog on TMDB data with a personal watchlist, built as micro-frontends.

## Architecture

- **Monorepo orchestration**: Turborepo + pnpm
- **Apps**: Vite 8, React 19, React Router 7, TanStack Query 5
- **Federation mechanism**: `@module-federation/vite`
- **UI**: Tailwind 4 + shadcn/Radix
- **Backend**: Firebase Hosting, Cloud Functions (TMDB proxy), Auth and Firestore Lite (watchlist)
- **Static analysis**: Biome
- **Tests**: Vitest, Testing Library, MSW, Playwright

## Project structure

```
├── apps/
│   ├── host/           # Host application (shell) — port 5000
│   ├── pages-mfe/      # Public catalog MFE: Home, Movies, TV Shows, Movie and TV Detail, Person, Search (remote) — port 5001
│   └── user-mfe/       # Personal account MFE: Sign in, Profile, Settings, Watchlist (remote) — port 5002
├── packages/
│   ├── api/             # TMDB client: endpoints and queryOptions factories
│   ├── firebase/        # Auth session and the watchlist on Firestore Lite, loaded lazily
│   ├── routes/          # Shared routing path constants
│   ├── events/          # Typed event bus and global store
│   ├── ui/              # Design system, domain components and boundaries
│   ├── test-utils/      # Test helpers: providers, MSW server, factories, axe
│   └── typescript-config/  # Shared TypeScript configurations
├── functions/           # Firebase Cloud Functions (TMDB proxy)
├── firestore/           # Firestore security rules and their tests
└── e2e/                 # Playwright specs
```

## Documentation

Detailed technical documentation — architecture, the page catalog with implementation status, TMDB API coverage and the personal account specification — is in [`docs/`](./docs/README.md).

## Getting started

### Prerequisites

- Node.js >= 24
- pnpm 9.15.4 (pinned via `packageManager`)
- A TMDB read access token in the root `.env` as `TMDB_API_READ_TOKEN` (see [SETUP](./docs/04-development/SETUP.md))
- For the emulators and the e2e and rules tests: Java and a global `firebase-tools`

### Installation

```bash
pnpm install
```

### Development

Run all applications in development mode:

```bash
pnpm dev
```

Or run individual applications:

```bash
# Host (port 5000)
pnpm --filter @repo/host dev

# Pages MFE (port 5001)
pnpm --filter @repo/pages-mfe dev

# User MFE (port 5002)
pnpm --filter @repo/user-mfe dev
```

### Build

```bash
pnpm build
```

### Hybrid development mode

You can point to staging remote modules through environment variables:

```bash
PAGES_MFE_URL=https://staging.example.com/pages-mfe/remoteEntry.js pnpm --filter @repo/host dev
USER_MFE_URL=https://staging.example.com/user-mfe/remoteEntry.js pnpm --filter @repo/host dev
```

## Key features

### Type-safe events

All cross-MFE communication uses typed emitters/listeners from `@repo/events`:

```typescript
import { createTypedEmitter, createTypedListener } from '@repo/events';

const emitUserLogin = createTypedEmitter('user:login');
const onUserLogin = createTypedListener('user:login');
```

### Error boundaries

Failures stay as small as they can:

- **Remote**: a remote that fails to load shows "This section is unavailable" on its paths, and the other remotes keep working
- **Page**: `PageBoundary` shows a skeleton while loading and an error with Try again; a 404 shows `NotFound`
- **Shell**: `ShellBoundary` catches the rest, keeps the header and offers Reload

### Styles

One Tailwind 4 theme, `@repo/ui/theme.css`. In the integration only the host's CSS loads, and its `@source` covers `packages/ui` and both remotes, so host and remotes deploy together ([ADR-0009](./docs/03-architecture/decisions/ADR-0009-tailwind-4-style-isolation.md)).

## Scripts

- `pnpm dev` — start the development servers
- `pnpm build` — build all packages and applications
- `pnpm lint` — lint with Biome
- `pnpm format` — format the code with Biome
- `pnpm check` — run Biome checks and apply fixes automatically
- `pnpm typecheck` — TypeScript type checking
- `pnpm test` — unit and component tests (Vitest); `pnpm test:coverage` with a coverage report
- `pnpm test:e2e` — Playwright on the merged `dist/` with the Firebase emulators (run `pnpm build:deploy` first)
- `pnpm test:rules` — Firestore security rules tests
- `pnpm size` — host JS budget (run `pnpm build:deploy` first)
- `pnpm emulators` — `build:deploy`, then the Hosting, Functions, Firestore and Auth emulators
- `pnpm build:deploy` — empty the `dist/` folders, build all applications and merge their `dist/` for Firebase Hosting
- `pnpm run deploy` — build, merge and deploy to Firebase Hosting (production target)

## License

MIT
