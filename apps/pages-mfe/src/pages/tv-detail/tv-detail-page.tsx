import { tvQueries } from '@repo/api';
import {
  CastSection,
  getViewerRegion,
  MediaSection,
  MoreLikeThisSection,
  MovieDetailView,
  NotFound,
  ReviewsSection,
  SeasonsSection,
  toCreditsData,
  toMediaData,
  toMoreLikeThisData,
  toReviewsData,
  toSeasonsData,
  toTvCardData,
  toTvDetailData,
  toWatchProvidersData,
  usePageMeta,
  WatchProvidersSection,
} from '@repo/ui';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { AddToWatchlist, renderAddToWatchlist } from '../../components/add-to-watchlist';
import { parseRouteId } from '../../lib/parse-route-id';

/** An id TMDB does not know fails with a 404, which `PageBoundary` turns into `NotFound`. */
export function TVDetail() {
  const { id } = useParams();
  const tvId = parseRouteId(id);

  if (tvId === null) return <NotFound />;
  return <TVDetailContent id={tvId} />;
}

function TVDetailContent({ id }: { id: number }) {
  const { data: tv } = useSuspenseQuery(tvQueries.detail(id));
  usePageMeta(tv.name);

  return (
    <MovieDetailView
      movie={toTvDetailData(tv)}
      action={
        <AddToWatchlist
          showLabel={true}
          title={{
            mediaType: 'tv',
            tmdbId: tv.id,
            title: tv.name,
            posterPath: tv.poster_path,
          }}
        />
      }
    >
      <WatchProvidersSection
        providers={toWatchProvidersData(tv['watch/providers'], getViewerRegion())}
      />
      <SeasonsSection seasons={toSeasonsData(tv.seasons)} />
      <CastSection credits={toCreditsData(tv.credits, tv.created_by)} />
      <MediaSection media={toMediaData({ title: tv.name, videos: tv.videos, images: tv.images })} />
      <MoreLikeThisSection
        titles={toMoreLikeThisData(tv.recommendations, tv.similar, toTvCardData)}
        renderCardAction={renderAddToWatchlist}
      />
      <ReviewsSection reviews={toReviewsData(tv.reviews)} />
    </MovieDetailView>
  );
}
