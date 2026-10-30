import { genreQueries } from '@repo/api';
import { ROUTE_PATHS } from '@repo/routes';
import { CategoryLinks } from '@repo/ui';
import { useSuspenseQuery } from '@tanstack/react-query';
import { moviesHrefForGenre } from '../movies/use-movie-filters';
import { SectionBoundary } from './section-boundary';

export function GenresSection() {
  return (
    <SectionBoundary fallback={null}>
      <GenreLinks />
    </SectionBoundary>
  );
}

/** Each genre opens Movies filtered by it; "All" opens the unfiltered list. */
function GenreLinks() {
  const { data: genresResponse } = useSuspenseQuery(genreQueries.movie());
  const links = [
    { label: 'All', href: ROUTE_PATHS.MOVIES },
    ...genresResponse.genres.map((genre) => ({
      label: genre.name,
      href: moviesHrefForGenre(genre.id),
    })),
  ];

  return <CategoryLinks links={links} label="Browse by genre" />;
}
