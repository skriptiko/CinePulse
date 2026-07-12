export { ApiError, apiGet, API_CONFIG, buildQueryString, getImageUrl } from './core';
export type { BackdropSize, ImageSize, ProfileSize, RequestOptions } from './core';

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
export type {
  MovieCategory,
  MovieListParams,
  SearchParams,
  TrendingParams,
  TVCategory,
  TVListParams,
} from './endpoints';

export {
  useMovieDetails,
  useMovieGenres,
  useMovies,
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

export { ApiProvider } from './provider/ApiProvider';
export type { ApiProviderProps } from './provider/ApiProvider';

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
  TVProductionCompany,
} from './types';
