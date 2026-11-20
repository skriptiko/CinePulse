🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# ADR-0020: Theme tokens live in DTCG files, and the CSS is built from them

## Status

Accepted (2026-11-20, CIN-158).

## Context

The colour and radius tokens of both themes are kept by hand in two places: the Figma variables and the `:root` / `.dark` blocks of `packages/ui/src/theme.css` (ADR-0019). Nothing checks that the two agree, so a value changed on one side only goes unnoticed. CIN-165 changed two colours, and keeping Figma in step took a separate pass.

In October 2025 the W3C Design Tokens Community Group published the first stable format, Design Tokens Format Module 2025.10 (DTCG). Figma can export and import variables in this format, one file per mode. The format has no modes of its own, and Figma's export does not yet cover composite tokens such as typography and shadows.

## Decision

- **Two token files are the source for the code:** `packages/ui/tokens/light.tokens.json` and `dark.tokens.json`, in DTCG 2025.10, one file per Figma mode. They hold the tokens that differ by theme: the colours (`$type: color`, in `oklch`, as the code uses) and `radius` (`$type: dimension`, Light file only, as it is the same in both themes).
- **`packages/ui/src/tokens.css` is generated** by `scripts/tokens.js` (`pnpm tokens`): the Light file fills `:root`, the Dark file fills `.dark`. `theme.css` imports it. The file is committed, so the apps build without a step of their own.
- **`pnpm lint` fails when `tokens.css` is out of date** (`pnpm lint:tokens`), so CI catches a hand edit of the CSS or a token file changed without a rebuild.
- **Figma is checked against the files by hand, not in CI:** `node scripts/tokens.js --figma <light export> <dark export>` compares every colour after converting both sides to sRGB, and allows 1 of 255 per channel, as Figma stores sRGB. A check in CI would need a Figma API token as a secret. A design ticket that changes a variable runs this check before it is closed.
- **Everything else stays in `theme.css`:** the `@theme inline` mapping, `rating`, `--container-page`, the type utilities. These do not change by theme, and Figma's export does not cover type.

## Alternatives considered

- **Keep both sides by hand:** no extra tool, but drift stays invisible until someone compares the values.
- **Style Dictionary or a similar build tool:** it reads DTCG, but it adds a dependency and a config for 50 values and one CSS output. A 150-line script covers it and has no dependency to update.
- **One file with both modes (DTCG Resolver module):** closer to how the code thinks about themes, but Figma exports one file per mode, so the Figma check would need a conversion step.
- **Check Figma in CI through the REST API:** it would catch drift on every push, but needs a Figma token stored as a secret, and the Variables REST API is only on the Enterprise plan. It can be added later if drift happens in practice.

## Consequences

- A token change edits a `.tokens.json` file and runs `pnpm tokens`. Editing `tokens.css` by hand fails lint.
- A new themed token is added to both files, to the `@theme inline` mapping in `theme.css` and to Figma in the same ticket.
- The Figma check is a manual step; it is listed in the design ticket workflow in [FIGMA_WORKFLOW](../../02-design/FIGMA_WORKFLOW.md).
- On 2026-11-20 the check passed: the 25 Figma colours of each mode match the token files.
