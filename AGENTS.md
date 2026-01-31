
# CinePulse: Architecture + Working Guidelines

## Tech stack

- **Runtime**: Node.js `>=20`
- **Package manager**: `pnpm` (repo pinned to `pnpm@9.15.4`)
- **Monorepo/task runner**: Turborepo (`turbo`)
- **Language**: TypeScript (`^5.7.3`) with strict settings
- **Frontend**: React (`^18.3.1`)
- **Shell routing**: `react-router-dom` (`^7.13.0`) in `apps/host`
- **Bundler/dev server**: Vite (`^5.4.14`)
- **Micro-frontends**: Module Federation via `@originjs/vite-plugin-federation`
- **Styling**: Tailwind CSS (`^3.4.17`) + CSS variables theme tokens
- **Lint/format**: Biome (`@biomejs/biome`)
- **Git hooks**: Husky + lint-staged (Biome auto-fix on staged files)

## Repository layout

- **`apps/`**
  - **`apps/host`**: Shell app (React Router) that consumes MFEs.
  - **`apps/hello-mfe`**: Example remote MFE exposing `helloMfe/HelloWorld`.
- **`packages/`**
  - **`packages/ui`**: Shared UI primitives and shared Tailwind theme tokens.
  - **`packages/events`**: Cross-app communication primitives (typed event bus + small global store).
  - **`packages/typescript-config`**: Shared TS config (`base.json`) used by apps/packages.

## Key architectural concepts

### Micro-frontend integration (Module Federation)

- `apps/host` declares remote(s) in `apps/host/vite.config.ts`.
- `apps/hello-mfe` exposes modules in `apps/hello-mfe/vite.config.ts`:
  - Example: `./HelloWorld` exposed as `helloMfe/HelloWorld`
- Remotes are served as `remoteEntry.js` (dev default in host points to `http://localhost:5001/assets/remoteEntry.js`).
- Shared singletons include `react`, `react-dom`, and **`@repo/events`** to ensure a single shared event bus/store instance.

### Remote type syncing

- `apps/host/src/@types/remotes/*` contains `.d.ts` modules for remote imports (example: `helloMfe/HelloWorld`).
- Root turbo task `sync-types` produces outputs under:
  - `apps/host/src/@types/remotes/**`
- Implementation: `apps/host/scripts/sync-types.js` copies remote built types from:
  - `apps/hello-mfe/dist/types` -> `apps/host/src/@types/remotes/helloMfe`

Practical guidance:

- If you change remote exposed module names/paths, update:
  - `apps/hello-mfe/vite.config.ts` (exposes)
  - `apps/host/vite.config.ts` (remotes)
  - ensure `sync-types` still points at the right `dist/types` location
- After changes that affect remote public types:
  - run `pnpm build` then `pnpm sync-types`

### Shared UI (`@repo/ui`)

- Components are exported from `packages/ui/src/index.ts`.
- Pattern:
  - Tailwind-first styling
  - Utility `cn()` in `packages/ui/src/lib/utils.ts` (clsx + tailwind-merge)
  - Component variants via `class-variance-authority` (see `Button`)

### Shared events + state (`@repo/events`)

- **Typed Event Bus**: `eventBus` + helpers `createTypedEmitter` / `createTypedListener`.
  - Events are defined centrally in `packages/events/src/types.ts` as `EventMap`.
  - The bus is stored on `window.__CINEPULSE_EVENT_BUS__` in the browser so host/remotes share the same instance.
- **Global Store**: `globalStore` / `getGlobalStore()`.
  - Simple in-memory store stored on `window.__CINEPULSE_STORE__` in the browser.
  - Use it for small global cross-MFE state (user/theme/auth) and avoid turning it into a full app state framework.

## Styling conventions

- Tailwind config is present per app and in `packages/ui`.
  - Apps include `../../packages/ui/src/**/*` in `content` so UI classes are picked up.
- Theme tokens are CSS variables in each app’s `src/styles/globals.css` (and also in `packages/ui/src/styles/globals.css`).
- `apps/hello-mfe` sets `tailwind.config.js` `important: '#mfe-hello-root'` to scope specificity to the MFE root.

Practical guidance:

- Prefer using existing design tokens (`bg-background`, `text-foreground`, `border-border`, etc.).
- If you add new tokens, update:
  - relevant `globals.css`
  - and Tailwind `theme.extend.colors` mappings where needed.

## TypeScript conventions

- Apps extend `@repo/typescript-config/base.json`.
- Strict TS is enabled (including `noUnusedLocals`/`noUnusedParameters`).
- Apps use TS project references to packages (`references` in app `tsconfig.json`).

Practical guidance:

- Prefer exporting shared types from packages rather than duplicating them across apps.
- When you add a new internal package dependency, add a TS reference if appropriate.

## Tooling and commands

Run these from repo root:

- **Dev**: `pnpm dev` (runs `turbo dev`)
- **Build**: `pnpm build` (runs `turbo build`)
- **Typecheck**: `pnpm typecheck` (runs `turbo typecheck`)
- **Lint**: `pnpm lint` (runs `turbo lint`)
- **Format**: `pnpm format` (Biome format)
- **Check + apply fixes**: `pnpm check` (Biome check --apply)
- **Sync remote types**: `pnpm sync-types`

Notes:

- There is currently **no** test runner configured in this repo (no Vitest/Jest/Playwright config found).

## Biome (format/lint) expectations

- Formatting: 2 spaces, line width 100, single quotes, semicolons.
- Lint highlights:
  - `noUnusedImports`/`noUnusedVariables`: errors
  - `noNonNullAssertion`: warn
  - `noExplicitAny`: warn

Practical guidance:

- Prefer fixing via `pnpm check` rather than fighting the formatter.
- Keep imports clean; Biome will organize them.

## Adding a new MFE (high-level checklist)

- Create `apps/<new-mfe>` (Vite + React + federation plugin).
- In the remote:
  - configure federation `name`, `filename: 'remoteEntry.js'`, and `exposes`.
  - consider `tailwind.config.js` `important: '#mfe-<name>-root'` to scope styling.
  - emit lifecycle events (example pattern): `createTypedEmitter('mfe:ready')({ name })`.
- In the host:
  - add the remote in `apps/host/vite.config.ts`.
  - add/maintain `.d.ts` module declarations under `apps/host/src/@types/remotes`.
  - extend `apps/host/scripts/sync-types.js` to include the new remote.

## Adding/changing events

- Update `packages/events/src/types.ts` `EventMap`.
- Use `createTypedEmitter('<event>')` and `createTypedListener('<event>')` in apps.
- Keep payloads serializable where possible; avoid passing non-cloneable objects across boundaries.

