export type PaginatedResponse<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

/** Params of every paginated list request. No index signature: unknown keys are a type error. */
export type PageParams = {
  page?: number;
};

/** Same shape in movie and TV details. */
export type ProductionCompany = {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
};

/** One person can hold several credits, so only `credit_id` is unique in a list. */
export type CastMember = {
  id: number;
  credit_id: string;
  name: string;
  character: string;
  profile_path: string | null;
  /** Billing position; TMDB does not promise the list comes sorted by it. */
  order: number;
};

export type CrewMember = {
  id: number;
  credit_id: string;
  name: string;
  department: string;
  job: string;
  profile_path: string | null;
};

export type Credits = {
  cast: CastMember[];
  crew: CrewMember[];
};

export type Video = {
  id: string;
  /** The id on `site`. */
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
};

export type VideosResponse = {
  results: Video[];
};

export type MediaImage = {
  file_path: string;
  width: number;
  height: number;
};

export type ImagesResponse = {
  backdrops: MediaImage[];
  posters: MediaImage[];
  logos: MediaImage[];
};

export type Review = {
  id: string;
  author: string;
  author_details: {
    /** Out of 10; `null` when the author gave none. */
    rating: number | null;
  };
  content: string;
  /** ISO timestamp, unlike the calendar dates of a title. */
  created_at: string;
  url: string;
};

export type WatchProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
};

export type RegionWatchProviders = {
  /** The title's page on TMDB. */
  link: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
};

/** Keyed by ISO 3166-1 country code; a country with no data is left out. */
export type WatchProvidersResponse = {
  results: Partial<Record<string, RegionWatchProviders>>;
};

/** What `append_to_response` adds to a details response. `Title` is the list item of the media type. */
export type DetailSections<Title> = {
  credits: Credits;
  videos: VideosResponse;
  images: ImagesResponse;
  recommendations: PaginatedResponse<Title>;
  similar: PaginatedResponse<Title>;
  reviews: PaginatedResponse<Review>;
  'watch/providers': WatchProvidersResponse;
};
