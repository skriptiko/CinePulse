# @repo/typescript-config

Shared TypeScript settings.

- `base.json`: strict rules (including `jsx`) for every package; `functions/` keeps a standalone `tsconfig.json`, because Cloud Build installs it outside the monorepo.
- `react-library.json`: `base.json` plus composite library output (`outDir`, `rootDir`, `composite`).

```json
{ "extends": "@repo/typescript-config/react-library.json" }
```

No dependencies.
