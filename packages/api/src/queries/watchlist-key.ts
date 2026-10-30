/** Every watchlist query starts here, so sign-out can drop them (ADR-0010). */
export const watchlistKey = (uid: string) => ['watchlist', uid] as const;
