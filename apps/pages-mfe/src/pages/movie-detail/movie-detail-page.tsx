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
  toMovieDetailData,
  toReviewsData,
  toWatchProvidersData,
  usePageMeta,
  WatchProvidersSection,
} from '@repo/ui';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useLayoutEffect } from 'react';
import { NavigationType, useLocation, useNavigationType, useParams } from 'react-router-dom';
import { AddToWatchlist, renderAddToWatchlist } from '../../components/add-to-watchlist';

/** An id TMDB does not know fails with a 404, which `PageBoundary` turns into `NotFound`. */
export function MovieDetail() {
  const { id } = useParams();
  const movieId = parseMovieId(id);
  useOpenAtTop();

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
        titles={toMoreLikeThisData(movie.recommendations, movie.similar)}
        renderCardAction={renderAddToWatchlist}
      />
      <ReviewsSection reviews={toReviewsData(movie.reviews)} />
    </MovieDetailView>
  );
}

/**
 * A card far down the page opens another movie, which would inherit that scroll position and
 * start on its reviews. Only for a press: on Back the browser restores the position itself.
 */
function useOpenAtTop() {
  const { key } = useLocation();
  const navigationType = useNavigationType();

  // `key` marks a new visit, also to the same movie from its own recommendations.
  useLayoutEffect(() => {
    if (navigationType === NavigationType.Push) window.scrollTo(0, 0);
  }, [key, navigationType]);
}

function parseMovieId(id: string | undefined): number | null {
  return id !== undefined && /^[1-9]\d*$/.test(id) ? Number(id) : null;
}
