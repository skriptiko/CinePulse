import type { MediaType, TimeWindow } from '../types';

export const queryKeys = {
  movies: {
    all: ['movies'] as const,
    lists: () => [...queryKeys.movies.all, 'list'] as const,
    list: (category: string, page?: number) =>
      [...queryKeys.movies.lists(), category, { page }] as const,
    details: () => [...queryKeys.movies.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.movies.details(), id] as const,
  },

  tv: {
    all: ['tv'] as const,
    lists: () => [...queryKeys.tv.all, 'list'] as const,
    list: (category: string, page?: number) =>
      [...queryKeys.tv.lists(), category, { page }] as const,
    details: () => [...queryKeys.tv.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.tv.details(), id] as const,
  },

  search: {
    all: ['search'] as const,
    multi: (query: string, page?: number) =>
      [...queryKeys.search.all, 'multi', query, { page }] as const,
    movies: (query: string, page?: number) =>
      [...queryKeys.search.all, 'movies', query, { page }] as const,
    tv: (query: string, page?: number) => [...queryKeys.search.all, 'tv', query, { page }] as const,
    person: (query: string, page?: number) =>
      [...queryKeys.search.all, 'person', query, { page }] as const,
  },

  trending: {
    all: ['trending'] as const,
    byType: (mediaType: MediaType, timeWindow: TimeWindow, page?: number) =>
      [...queryKeys.trending.all, mediaType, timeWindow, { page }] as const,
  },

  genres: {
    all: ['genres'] as const,
    movies: () => [...queryKeys.genres.all, 'movies'] as const,
    tv: () => [...queryKeys.genres.all, 'tv'] as const,
  },

  person: {
    all: ['person'] as const,
    details: () => [...queryKeys.person.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.person.details(), id] as const,
  },
} as const;
