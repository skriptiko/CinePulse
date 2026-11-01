import { apiGet, type EndpointOptions, PERSON_DETAIL_APPEND } from '../core';
import type { PersonDetails } from '../types';

export async function getPersonDetails(
  id: number,
  { signal }: EndpointOptions = {}
): Promise<PersonDetails> {
  return apiGet<PersonDetails>(`/person/${id}`, {
    params: { append_to_response: PERSON_DETAIL_APPEND },
    signal,
  });
}
