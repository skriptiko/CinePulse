import type { TrendingItem, TrendingMovie, TrendingTV } from '@repo/api';

export function isTrendingMovie(item: TrendingItem): item is TrendingMovie {
  return item.media_type === 'movie';
}

/** People can trend too, but only movies and shows render as cards. */
export function isTrendingCard(item: TrendingItem): item is TrendingMovie | TrendingTV {
  return item.media_type !== 'person';
}
