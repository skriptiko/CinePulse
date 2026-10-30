import { ROUTE_PATHS } from '@repo/routes';
import type { RemoteDefinition } from './load-remote-routes';

export const REMOTES: readonly RemoteDefinition[] = [
  {
    name: 'pagesMfe',
    load: () => import('pagesMfe/routes'),
    paths: [ROUTE_PATHS.HOME, ROUTE_PATHS.MOVIES, ROUTE_PATHS.MOVIE_DETAIL],
  },
  {
    name: 'userMfe',
    load: () => import('userMfe/routes'),
    paths: [ROUTE_PATHS.AUTH_LOGIN, ROUTE_PATHS.USER_PROFILE, ROUTE_PATHS.USER_SETTINGS],
  },
];
