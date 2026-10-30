import { genreQueries, movieQueries } from '@repo/api';
import { FeaturedGrid, FeaturedGridSkeleton, toFeaturedItemData } from '@repo/ui';
import { useSuspenseQueries } from '@tanstack/react-query';
import { SectionBoundary } from './section-boundary';

const FEATURED_ITEMS_COUNT = 5;

export function FeaturedSection() {
  return (
    <SectionBoundary fallback={<FeaturedGridSkeleton />}>
      <EditorsPicks />
    </SectionBoundary>
  );
}

function EditorsPicks() {
  const [topRatedQuery, genresQuery] = useSuspenseQueries({
    queries: [movieQueries.row('top_rated'), genreQueries.movie()],
  });
  const featuredItems = topRatedQuery.data.results
    .slice(0, FEATURED_ITEMS_COUNT)
    .map((movie) => toFeaturedItemData(movie, genresQuery.data.genres));

  if (featuredItems.length === 0) return null;
  return (
    <FeaturedGrid title="Editor's Picks" items={featuredItems} className="max-w-[1800px] mx-auto" />
  );
}
