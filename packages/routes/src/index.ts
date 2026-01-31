export const ROUTE_PATHS = {
  HOME: '/',
  MOVIES: '/movies',
  USER: '/user',
  USER_PROFILE: '/user/profile',
  USER_SETTINGS: '/user/settings',
} as const;

export type RoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];

export function joinPaths(...paths: string[]): string {
  return paths
    .map((p, i) => {
      if (i === 0) return p.replace(/\/+$/, '');
      return p.replace(/^\/+/, '').replace(/\/+$/, '');
    })
    .filter(Boolean)
    .join('/');
}

export function createPath(base: string, ...segments: string[]): string {
  return joinPaths(base, ...segments);
}
