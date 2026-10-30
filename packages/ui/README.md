# @repo/ui

The design system: primitives, domain components, layout and error boundaries.

## Public API

- **Primitives:** `Button`, `buttonVariants`, `Input`, `DropdownMenu`, `Skeleton`, `ToggleGroup`.
- **Domain components:** `MovieCard`, `Hero`, `ContentRow`, `FeaturedGrid`, `MovieDetailView`. Each takes one UI model.
- **Mappers:** `toMovieCardData`, `toHeroData`, `toFeaturedItemData` and others turn TMDB data into UI models.
- **Layout:** `AppLayout`, `Header`, `Footer`.
- **Boundaries:** `AsyncBoundary`, `PageBoundary`, `ShellBoundary`, `NotFound` and page skeletons.
- **Theme:** `@repo/ui/theme.css`, imported after `tailwindcss`.

```tsx
import { MovieCard, toMovieCardData } from '@repo/ui';

<MovieCard movie={toMovieCardData(movie)} />;
```

JSX spread and `asChild` are forbidden: a primitive lists its attributes, and a new attribute goes into both the type and the JSX.

This package is not a Module Federation singleton: it holds no state of its own, and each app bundles what it uses.

## Dependencies

`@repo/api`, `@repo/events`, `@repo/routes`, Radix. `react`, `react-router-dom` and `@tanstack/react-query` are peers.
