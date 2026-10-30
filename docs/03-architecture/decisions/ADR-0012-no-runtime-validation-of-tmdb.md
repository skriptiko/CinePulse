🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# ADR-0012: No runtime validation of TMDB responses

## Status

Accepted (2026-10-30).

## Context

`@repo/api` casts parsed JSON to TypeScript types. A schema library at that boundary would catch contract drift early and make the types honest. The cost is bundle size, CPU time on lists of 20 items per page, and the risk that a harmless change in TMDB takes a page down. The host's JS budget has less than 1 kB left, and the API has one consumer.

## Decision

- **No schema validation of TMDB responses.** No zod or valibot in `@repo/api`.
- **Mappers in `@repo/ui` are the defence.** They turn missing values into `null`, and components render a placeholder. A missing optional field degrades one card, not the page.
- **`kind: 'validation'` stays for bodies that are not JSON.** That is the one malformed response the transport can detect for free.

## Alternatives considered

- **Full schemas for every response:** the strongest guarantee, and the most likely to fail on a new enum value or a field that turns nullable, for data we only display.
- **Schemas for the fields the UI reads, in a non-strict mode:** a fair compromise, but it still adds a library to the shared bundle to guard against a failure we have not seen.
- **Validation in development only:** free in production, but it reports drift only when a developer happens to hit that endpoint.

## Consequences

- A contract change shows up as an empty or broken field, not as an error report. Tests with `buildMovie` do not detect it, because they share the same types.
- Types in `packages/api/src/types` describe the documented contract, not what was received.
- Revisit this if the project starts storing TMDB data or acting on it. The watchlist copies only `title` and `posterPath`, which Firestore rules validate.
