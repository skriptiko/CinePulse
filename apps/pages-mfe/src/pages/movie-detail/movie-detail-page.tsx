import { movieQueries } from '@repo/api';
import {
  CastSection,
  getViewerRegion,
  MediaSection,
  MoreLikeThisSection,
  MovieDetailView,
  NotFound,
  ReviewsSection,
  toCreditsData,
  toMediaData,
  toMoreLikeThisData,
  toMovieCardData,
  toMovieDetailData,
  toReviewsData,
  toWatchProvidersData,
  usePageMeta,
  WatchProvidersSection,
} from '@repo/ui';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { AddToWatchlist, renderAddToWatchlist } from '../../components/add-to-watchlist';
import { parseRouteId } from '../../lib/parse-route-id';

/** An id TMDB does not know fails with a 404, which `PageBoundary` turns into `NotFound`. */
export function MovieDetail() {
  const { id } = useParams();
  const movieId = parseRouteId(id);

  if (movieId === null) return <NotFound />;
  return <MovieDetailContent id={movieId} />;
}

function MovieDetailContent({ id }: { id: number }) {
  const { data: movie } = useSuspenseQuery(movieQueries.detail(id));
  usePageMeta(movie.title);

  return (
    <MovieDetailView
      movie={toMovieDetailData(movie)}
      action={
        <AddToWatchlist
          showLabel={true}
          title={{
            mediaType: 'movie',
            tmdbId: movie.id,
            title: movie.title,
            posterPath: movie.poster_path,
          }}
        />
      }
    >
      <WatchProvidersSection
        providers={toWatchProvidersData(movie['watch/providers'], getViewerRegion())}
      />
      <CastSection credits={toCreditsData(movie.credits)} />
      <MediaSection media={toMediaData(movie)} />
      <MoreLikeThisSection
        titles={toMoreLikeThisData(movie.recommendations, movie.similar, toMovieCardData)}
        renderCardAction={renderAddToWatchlist}
      />
      <ReviewsSection reviews={toReviewsData(movie.reviews)} />
    </MovieDetailView>
  );
}
