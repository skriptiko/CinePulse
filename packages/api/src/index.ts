export {
  API_CONFIG,
  ApiError,
  BACKDROP_SIZE_FEATURED,
  BACKDROP_SIZE_HERO,
  getErrorMessage,
  getImageUrl,
  isAbortError,
  isApiError,
  isNotFound,
  POSTER_SIZE_CARD,
  SEARCH_QUERY_MAX_LENGTH,
  TMDB_MAX_PAGES,
} from './core';
export type { ApiErrorKind, BackdropSize, ImageSize, ProfileSize } from './core';

export type { DiscoverSortBy, MovieCategory, TVCategory } from './endpoints';

export {
  genreQueries,
  movieQueries,
  personQueries,
  searchQueries,
  STALE_TIME_DEFAULT_MS,
  STALE_TIME_REFERENCE,
  trendingQueries,
  tvQueries,
} from './queries';
export type { DiscoverMovieFilters } from './queries';

export { useMoviesOrSearch } from './hooks';

export { createQueryClient, MAX_RETRIES, shouldRetry } from './query-client';
export type { ApiQueryMeta } from './query-client';
export { ApiProvider } from './provider/api-provider';
export type { ApiProviderProps } from './provider/api-provider';

export type {
  Collection,
  Creator,
  Episode,
  Genre,
  GenresResponse,
  KnownFor,
  MediaType,
  Movie,
  MovieDetails,
  MultiSearchResult,
  Network,
  PageParams,
  PaginatedResponse,
  Person,
  PersonDetails,
  ProductionCompany,
  ProductionCountry,
  SearchMovie,
  SearchPerson,
  SearchTV,
  Season,
  SpokenLanguage,
  TimeWindow,
  TrendingItem,
  TrendingMovie,
  TrendingPerson,
  TrendingTV,
  TV,
  TVDetails,
} from './types';
