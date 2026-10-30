import { apiGet, type EndpointOptions } from '../core';
import type { PersonDetails } from '../types';

export async function getPersonDetails(
  id: number,
  { signal }: EndpointOptions = {}
): Promise<PersonDetails> {
  return apiGet<PersonDetails>(`/person/${id}`, { signal });
}
