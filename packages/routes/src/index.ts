/** Every app path; `satisfies` checks at compile time that each one starts with `/`. */
export const ROUTE_PATHS = {
  HOME: '/',
  MOVIES: '/movies',
  USER: '/user',
  USER_PROFILE: '/user/profile',
  USER_SETTINGS: '/user/settings',
} as const satisfies Record<string, `/${string}`>;

export type RoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];
