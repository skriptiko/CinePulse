import { queryOptions } from '@tanstack/react-query';
import { getPersonDetails } from '../endpoints';

/** Query options for people. Render with `useSuspenseQuery`. */
export const personQueries = {
  all: () => ['person'] as const,
  details: () => [...personQueries.all(), 'detail'] as const,

  detail: (id: number) =>
    queryOptions({
      queryKey: [...personQueries.details(), id],
      queryFn: ({ signal }) => getPersonDetails(id, { signal }),
    }),
};
