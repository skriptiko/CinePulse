# CinePulse

A micro-frontend (MFE) application built with Turborepo, Vite and React.

## Architecture

- **Monorepo orchestration**: Turborepo
- **Package manager**: pnpm
- **Static analysis**: Biome.js
- **Federation mechanism**: `@module-federation/vite`
- **UI library**: Shadcn UI + Radix

## Project structure

```
├── apps/
│   ├── host/           # Host application (shell) — port 5000
│   ├── pages-mfe/      # Public catalog MFE: Home, Movies, ... (remote) — port 5001
│   └── user-mfe/       # Personal account MFE: Profile, Settings, ... (remote) — port 5002
├── packages/
│   ├── api/             # TMDB API client + React Query hooks
│   ├── routes/          # Shared routing path constants
│   ├── events/          # Typed event bus and global store
│   ├── ui/               # Shared UI components / design system
│   └── typescript-config/  # Shared TypeScript configurations
└── functions/           # Firebase Cloud Functions (TMDB proxy)
```

## Documentation

Detailed technical documentation — architecture, the page catalog with implementation status, TMDB API coverage and the personal account specification — is in [`docs/`](./docs/README.md).

## Getting started

### Prerequisites

- Node.js >= 20
- pnpm >= 9

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

Two-level error boundaries for graceful degradation:

- **Shell-level**: catches critical failures and offers to reload the application
- **Module-level**: a single MFE can retry without reloading the whole application

### Style isolation

Each MFE uses Tailwind scoping with unique ID prefixes to avoid style conflicts.

## Scripts

- `pnpm dev` — start the development servers
- `pnpm build` — build all packages and applications
- `pnpm lint` — lint with Biome
- `pnpm format` — format the code with Biome
- `pnpm check` — run Biome checks and apply fixes automatically
- `pnpm typecheck` — TypeScript type checking
- `pnpm sync-types` — sync remote module types into the host
- `pnpm build:deploy` — build all applications and merge their `dist/` for Firebase Hosting
- `pnpm deploy` — build, merge and deploy to Firebase Hosting (production target)

## License

MIT
