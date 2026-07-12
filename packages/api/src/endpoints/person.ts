import { apiGet } from '../core';
import type { PersonDetails } from '../types';

export async function getPersonDetails(id: number): Promise<PersonDetails> {
  return apiGet<PersonDetails>(`/person/${id}`);
}
