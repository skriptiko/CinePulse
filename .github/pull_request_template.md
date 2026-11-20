## What and why

<!-- One task per PR. Title format: `CIN-<N>: <imperative summary>`; the release PR `develop` → `main` is `Release: <summary>`. -->

Notion task: <!-- link to CIN-N -->

## How it was verified

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test`
- [ ] Manually checked: <!-- pages, flows, preview URL -->

<!-- Screenshots for visible UI changes. -->

## Definition of Done

- [ ] Task acceptance criteria in Notion are met
- [ ] Self-review of the full diff against the engineering standards checklist
- [ ] Local review (`/code-review`) for non-trivial changes; findings fixed or consciously declined
- [ ] UI text follows the [content guide checklist](../docs/02-design/CONTENT_GUIDE.md#13-review-checklist)
- [ ] ADR added if the architecture changed; package README / TSDoc updated if needed
- [ ] After merge: Notion task set to *Done*, merge commit hash and PR number in the "Commits" field
