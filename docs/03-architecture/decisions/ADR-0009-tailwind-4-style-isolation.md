🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# ADR-0009: Tailwind 4 and MFE style delivery

## Status

Accepted (2026-10-30).

## Context

The design prototype and the styling standard use Tailwind 4: the theme lives in CSS (`@theme`, `@utility`, `@custom-variant`) with oklch tokens. The apps were on Tailwind 3 with a copy of the same JS config in each app, three copies of the CSS variables, and an hsl palette that differs from the design.

Isolation relied on `important: '#mfe-…-root'`, which Tailwind 4 does not have. That option only ever worked in standalone development: `main.tsx` is the only importer of a remote's CSS, and the host takes `./routes` alone. In the integration the host already builds the CSS for every remote, because its `content` scans `../pages-mfe/src` and `../user-mfe/src`.

## Decision

- **One theme.** `packages/ui/src/theme.css`, exported as `@repo/ui/theme.css`, holds the oklch tokens, `@theme inline`, `@custom-variant dark`, custom utilities and base styles. The per-app JS configs and the PostCSS setup are removed in favour of `@tailwindcss/vite`.
- **Each app has a thin stylesheet**: `@import 'tailwindcss'`, the theme, and `@source` for what it renders. The host's sources cover `@repo/ui` and both remotes.
- **The host stays the only CSS builder in the integration.** Remotes ship no CSS through federation, so no prefix, `@scope` or layer scheme is needed: there is one stylesheet and no second copy of preflight to conflict with. `important` goes away.
- **`hover:` keeps its Tailwind 3 behaviour.** Tailwind 4 limits it to `(hover: hover)`. Card overlays and titles appear on hover, so on touch screens they would never appear; `@custom-variant hover (&:hover)` keeps the tap behaviour.
- **Buttons keep `cursor: pointer`.** Tailwind 4's preflight drops it; a base rule keeps the current look.

## Alternatives considered

- **Remote exposes its own CSS** (theme and utilities without preflight): independent remote deploys would be styled, but every page would load duplicate utilities, and the cascade order between stylesheets would depend on load order.
- **`prefix()` per app:** rewrites every class in `@repo/ui`, which all apps share, and adds nothing while one stylesheet is in use.

## Consequences

- A remote deployed alone with classes the host has never seen renders unstyled. Host and remotes must deploy together, which CI already does in one job. If independent deploys become a goal, this ADR must be revisited.
- Standalone remotes use the same theme and differ from the integration only in being built separately.
- Tailwind 4 needs Chrome 111, Safari 16.4 or Firefox 128; older browsers lose the theme.
- `tailwind-merge` moves to v3 to understand Tailwind 4 classes.
- The palette changes from the hsl placeholder to the design's oklch tokens: this is an intended visual change.
- `apps/design` is not part of the build and stays on Tailwind 3 with its own pinned version.
