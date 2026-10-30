import { genreQueries } from '@repo/api';
import { CategoryPills } from '@repo/ui';
import { useSuspenseQuery } from '@tanstack/react-query';
import { SectionBoundary } from './section-boundary';

export function GenresSection() {
  return (
    <SectionBoundary fallback={null}>
      <GenrePills />
    </SectionBoundary>
  );
}

function GenrePills() {
  const { data: genresResponse } = useSuspenseQuery(genreQueries.movie());
  const categories = ['All', ...genresResponse.genres.map((genre) => genre.name)];

  return <CategoryPills categories={categories} />;
}
