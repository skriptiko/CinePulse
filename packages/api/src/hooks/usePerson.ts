import { useSuspenseQuery } from '@tanstack/react-query';
import { getPersonDetails } from '../endpoints';
import { queryKeys } from '../queries/keys';

export function usePersonDetails(id: number) {
  return useSuspenseQuery({
    queryKey: queryKeys.person.detail(id),
    queryFn: () => getPersonDetails(id),
  });
}
