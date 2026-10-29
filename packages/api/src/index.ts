export {
  ApiError,
  apiGet,
  API_CONFIG,
  buildQueryString,
  getImageUrl,
  isAbortError,
  isApiError,
  isNotFound,
  toHttpError,
} from './core';
export type {
  ApiErrorKind,
  ApiErrorOptions,
  BackdropSize,
  EndpointOptions,
  ImageSize,
  ProfileSize,
  RequestOptions,
} from './core';
export { BACKDROP_SIZE_FEATURED, BACKDROP_SIZE_HERO, POSTER_SIZE_CARD } from './core';

export {
  getMovieDetails,
  getMovieGenres,
  getMovies,
  getPersonDetails,
  getTrending,
  getTVDetails,
  getTVGenres,
  getTVShows,
  searchMovies,
  searchMulti,
  searchPerson,
  searchTV,
} from './endpoints';
export type { MovieCategory, SearchParams, TVCategory } from './endpoints';

export {
  useMovieDetails,
  useMovieGenres,
  useMovies,
  useMoviesOrSearch,
  usePersonDetails,
  useSearchMovies,
  useSearchMulti,
  useSearchPerson,
  useSearchTV,
  useTrending,
  useTVDetails,
  useTVGenres,
  useTVShows,
} from './hooks';

export { ApiProvider } from './provider/api-provider';
export type { ApiProviderProps } from './provider/api-provider';

export { queryKeys } from './queries/keys';

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
