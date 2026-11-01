import { apiGet, DETAIL_APPEND, type EndpointOptions, toIsoDate } from '../core';
import type { PageParams, PaginatedResponse, TV, TVDetails } from '../types';
import { DISCOVER_MIN_VOTE_COUNT } from './movie';

export type TVCategory = 'popular' | 'top_rated' | 'on_the_air' | 'airing_today';

/** `sort_by` values the app sends to `/discover/tv` (the proxy allows only these). */
export type DiscoverTVSortBy = 'popularity.desc' | 'first_air_date.desc' | 'vote_average.desc';

export type DiscoverTVParams = PageParams & {
  /** TMDB genre id; `null` or omitted means every genre. */
  genreId?: number | null;
  sortBy: DiscoverTVSortBy;
};

export async function getTVShows(
  category: TVCategory,
  params: PageParams = {},
  { signal }: EndpointOptions = {}
): Promise<PaginatedResponse<TV>> {
  return apiGet<PaginatedResponse<TV>>(`/tv/${category}`, { params, signal });
}

export async function getTVDetails(
  id: number,
  { signal }: EndpointOptions = {}
): Promise<TVDetails> {
  return apiGet<TVDetails>(`/tv/${id}`, {
    params: { append_to_response: DETAIL_APPEND },
    signal,
  });
}

/** `GET /discover/tv`: as `discoverMovies`, with "first aired by today" for newest. */
export async function discoverTV(
  { genreId, sortBy, page }: DiscoverTVParams,
  { signal }: EndpointOptions = {}
): Promise<PaginatedResponse<TV>> {
  return apiGet<PaginatedResponse<TV>>('/discover/tv', {
    params: {
      page,
      with_genres: genreId ?? undefined,
      sort_by: sortBy,
      'vote_count.gte': sortBy === 'vote_average.desc' ? DISCOVER_MIN_VOTE_COUNT : undefined,
      'first_air_date.lte': sortBy === 'first_air_date.desc' ? toIsoDate(new Date()) : undefined,
    },
    signal,
  });
}
