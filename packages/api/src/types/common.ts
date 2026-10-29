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
