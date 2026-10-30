import '@tanstack/react-query';

// `error` holds programming errors too, not only `ApiError`, so it is `unknown` and is
// narrowed with `isApiError` (standards §8.3).
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: unknown;
  }
}
