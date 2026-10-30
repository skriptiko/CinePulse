import '@tanstack/react-query';

/** Per-query options read by `QueryCache.onError`. */
export type ApiQueryMeta = {
  /** The component shows this query's errors inline (e.g. "Load more"), so no toast. */
  inlineErrors?: boolean;
  /** Overrides the toast text from `getErrorMessage`. */
  errorMessage?: string;
};

// `error` holds programming errors too, not only `ApiError`, so it is `unknown` and is
// narrowed with `isApiError` (standards §8.3).
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: unknown;
    queryMeta: ApiQueryMeta;
  }
}
