# @repo/routes

The single source of truth for paths.

## Public API

- `ROUTE_PATHS`: every path of the app.
- `buildPath`: links to dynamic routes, such as `buildPath.movie(id)`. Never build them by hand.
- `RoutePath`: the union of all paths.

## Dependencies

None.
