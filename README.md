# CinePulse

A Micro Frontend (MFE) application built with Turborepo, Vite, and React.

## Architecture

- **Monorepo Orchestrator**: Turborepo
- **Package Manager**: pnpm
- **Static Analysis**: Biome.js
- **Federation Engine**: @originjs/vite-plugin-federation
- **UI Library**: Shadcn UI + Radix

## Project Structure

```
├── apps/
│   ├── host/           # Host application (Shell)
│   └── hello-mfe/      # Hello World MFE (Remote)
├── packages/
│   ├── events/         # Type-safe event bus & global store
│   ├── ui/             # Shared UI components
│   └── typescript-config/  # Shared TypeScript configs
```

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9

### Installation

```bash
pnpm install
```

### Development

Run all apps in development mode:

```bash
pnpm dev
```

Or run individual apps:

```bash
# Host (port 5000)
pnpm --filter @repo/host dev

# Hello MFE (port 5001)
pnpm --filter @repo/hello-mfe dev
```

### Build

```bash
pnpm build
```

### Hybrid Development Mode

You can point to staging remote entries via environment variables:

```bash
HELLO_MFE_URL=https://staging.example.com/hello-mfe/assets/remoteEntry.js pnpm --filter @repo/host dev
```

## Key Features

### Type-Safe Events

All cross-MFE communication uses typed emitters/listeners from `@repo/events`:

```typescript
import { createTypedEmitter, createTypedListener } from '@repo/events';

const emitUserLogin = createTypedEmitter('user:login');
const onUserLogin = createTypedListener('user:login');
```

### Error Boundaries

Tiered error boundaries for graceful degradation:

- **Shell-level**: Catches total crashes, offers app reload
- **Module-level**: Allows individual MFEs to retry without full refresh

### Style Encapsulation

Each MFE uses Tailwind scoping with unique ID prefixes to prevent style conflicts.

## Scripts

- `pnpm dev` - Start development servers
- `pnpm build` - Build all packages and apps
- `pnpm lint` - Run Biome linting
- `pnpm format` - Format code with Biome
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm sync-types` - Sync remote MFE types to host

## License

MIT
