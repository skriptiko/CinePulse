import { movieQueries } from '@repo/api';
import { MovieDetailView, NotFound, toMovieDetailData, usePageMeta } from '@repo/ui';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

/** An id TMDB does not know fails with a 404, which `PageBoundary` turns into `NotFound`. */
export function MovieDetail() {
  const { id } = useParams();
  const movieId = parseMovieId(id);

  if (movieId === null) return <NotFound />;
  return <MovieDetailContent id={movieId} />;
}

function MovieDetailContent({ id }: { id: number }) {
  const { data: movie } = useSuspenseQuery(movieQueries.detail(id));
  usePageMeta(movie.title);

  return <MovieDetailView movie={toMovieDetailData(movie)} />;
}

function parseMovieId(id: string | undefined): number | null {
  return id !== undefined && /^[1-9]\d*$/.test(id) ? Number(id) : null;
}
