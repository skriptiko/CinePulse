import { type MovieCategory, movieQueries } from '@repo/api';
import { ContentRow, ContentRowSkeleton, toMovieCardData } from '@repo/ui';
import { useSuspenseQuery } from '@tanstack/react-query';
import { SectionBoundary } from './section-boundary';

type MovieRowSectionProps = {
  category: MovieCategory;
  title: string;
};

export function MovieRowSection({ category, title }: MovieRowSectionProps) {
  return (
    <SectionBoundary fallback={<ContentRowSkeleton />}>
      <MovieRow category={category} title={title} />
    </SectionBoundary>
  );
}

function MovieRow({ category, title }: MovieRowSectionProps) {
  const { data: moviesPage } = useSuspenseQuery(movieQueries.row(category));
  const movies = moviesPage.results.map(toMovieCardData);

  if (movies.length === 0) return null;
  return <ContentRow title={title} movies={movies} />;
}
