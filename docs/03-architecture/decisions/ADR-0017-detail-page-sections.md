🔗 Roadmap and tasks live in [Notion](https://app.notion.com/p/40880c5f7ed581f59f9fd2b85b8a8ebb)

# ADR-0017: Detail page sections come from one request

## Status

Accepted (2026-11-01).

## Context

Movie Detail gains five sections: where to watch, cast, videos and images, similar titles, and reviews. TMDB serves each of them from its own endpoint, or adds them to the details response through `append_to_response`. The proxy exists to keep traffic narrow ([ADR-0003](./ADR-0003-tmdb-proxy.md)), the CSP allows little ([ADR-0010](./ADR-0010-firebase-auth-firestore-watchlist.md)), and TV Detail will reuse all of this.

## Decision

- **One request.** `GET /movie/{id}?append_to_response=credits,videos,images,recommendations,similar,reviews,watch/providers`, through `movieQueries.detail`. The proxy accepts that exact string or no params, and rejects anything else with `400`, so the parameter cannot bust the CDN cache. The string lives in `functions/src/proxy-rules.ts` and `packages/api/src/core/config.ts`, and a test in `functions/` fails if they drift.
- **YouTube links, no iframe.** A video is a thumbnail that opens YouTube in a new tab. The CSP gains only `https://i.ytimg.com` in `img-src`.
- **The region comes from the browser, with no picker.** `new Intl.Locale(navigator.language).region`, falling back to `US`. A language with no region, such as `uk`, gets the fallback too. The empty line names the country with `Intl.DisplayNames`, so a wrong guess can be seen.

The sections live in `@repo/ui` as domain components with neutral names, and the shared response types in `types/common.ts`, so TV Detail takes them as they are.

## Alternatives considered

- **One request per section:** each section could load and fail on its own, as on Home, and the hero would not wait for reviews. It costs seven requests instead of one per page, seven more allowlist entries, and seven more cold entries in the CDN cache. All five sections render from data TMDB can return at once, so the gain is small.
- **An iframe for each video:** plays in place, but needs `frame-src` for YouTube and more in `img-src`, a third-party player on the page even before a press, and a click-to-load facade to keep that off the first paint. A link costs none of this.
- **A country picker:** gives the right answer to someone whose browser language is not their country, at the cost of a control, a stored choice and a state to keep across pages. The empty line covers the common failure until someone asks for more.

## Consequences

- A failure of the one request takes down the whole page, and `PageBoundary` offers a retry. No section has an error state of its own.
- The hero waits for the slowest appended block. The response is larger than it was, and the CDN caches it as one entry, which is what keeps the cost down.
- A section the response lacks degrades to its empty state in the mappers ([ADR-0012](./ADR-0012-no-runtime-validation-of-tmdb.md)), so the hero survives it.
- The old `/movie/{id}` with no params stays valid, so a client from the previous release keeps working after the function deploys. CI deploys Functions before Hosting, so the new client never meets the old rule.
- Viewers with no region in their browser language see the US. This is a known limit, not a bug.
- Changing the sections means changing both copies of the string in one commit, and every cached response under the old URL ages out on its own.
- CIN-17 needs the same rule on `/tv/{id}`, with its own exact string.
- The Person page follows this decision: `GET /person/{id}?append_to_response=combined_credits`, through `personQueries.detail`, with `PERSON_DETAIL_APPEND` kept in the same two files under the same drift test, and with the same consequences. A failure takes down the whole page, and a response without the block degrades to empty sections.
