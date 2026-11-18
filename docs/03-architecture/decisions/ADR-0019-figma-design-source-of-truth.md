🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# ADR-0019: Figma becomes the source of truth for the design

## Status

Accepted (2026-11-18, CIN-131).

## Context

The design lives only in code: `@repo/ui`, its tokens in `packages/ui/src/theme.css`, and the Next.js prototype in `docs/08-design-files/`, which the app outgrew long ago (it has no detail pages, Person, Search or watchlist). A redesign has to be sketched in code, and there is nothing to compare a page against.

The official Figma MCP server can now write to a Figma file (variables, components, frames) as well as read it, so Claude can build and change the design in Figma and then implement it.

## Decision

- **Figma owns how the product looks**: tokens, components, screens. Code owns behaviour, data and accessibility semantics.
- **The file is first built from the current code**, not from the prototype: tokens from `theme.css`, components from `@repo/ui`, screens from the running app. Until that is done, the code stays the reference.
- **Names match across the two sides**: Figma variables carry the CSS variable names and their `var(--color-…)` code syntax; Figma components and their variant properties carry the names of the code components and props.
- **A design change reaches the code through tickets split by area**: `@repo/ui` (tokens, components) first, then each MFE's screens. A visual change made in code alone is mirrored in Figma in the same ticket.
- The process is in [FIGMA_WORKFLOW](../../02-design/FIGMA_WORKFLOW.md). The prototype is removed once the screens are in Figma (CIN-136).

## Alternatives considered

- **Keep the code as the only source:** no tool to design before building, and no reference to review a page against.
- **Import the prototype into Figma as a Code Layer or Make file:** fast, but it gives no editable shapes or variables, and it would bring in the outdated prototype rather than the app.
- **Stay on the free Starter plan:** it allows three pages per file and one mode per variable collection, so there is no page per screen and no Dark/Light switch, and it caps MCP reads at about 20 a month. Professional with one Full seat lifts all three and adds Code Connect; a Dev seat cannot edit the file.

## Consequences

- Two places hold the tokens. They are kept identical by naming and by the rule that a token changes on both sides in one ticket.
- The team is on Figma Professional with a Full seat: 200 MCP reads a day, variable modes, a page per screen, and Code Connect once the components are published.
- Design work becomes tickets of its own (stage "2. Design and UX"), ahead of the code tickets that implement it.
