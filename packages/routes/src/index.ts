/** Every app path; `satisfies` checks at compile time that each one starts with `/`. */
export const ROUTE_PATHS = {
  HOME: '/',
  MOVIES: '/movies',
  MOVIE_DETAIL: '/movies/:id',
  TV_DETAIL: '/tv/:id',
  PERSON_DETAIL: '/person/:id',
  USER: '/user',
  USER_PROFILE: '/user/profile',
  USER_SETTINGS: '/user/settings',
} as const satisfies Record<string, `/${string}`>;

export type RoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];

/** Links to the dynamic routes above; build them only here, never by hand. */
export const buildPath = {
  movie: (id: number) => generatePath(ROUTE_PATHS.MOVIE_DETAIL, id),
  tv: (id: number) => generatePath(ROUTE_PATHS.TV_DETAIL, id),
  person: (id: number) => generatePath(ROUTE_PATHS.PERSON_DETAIL, id),
};

function generatePath(pattern: string, id: number): string {
  return pattern.replace(':id', String(id));
}
