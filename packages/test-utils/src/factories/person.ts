import type { CreditedMovie, CreditedTV, PersonDetails } from '@repo/api';
import { buildMovie } from './movie';
import { buildTv } from './tv';

let nextId = 1;

/** Fits `CastCredit` and `CrewCredit` both; pass `character` or `job`. */
type CreditRole = { credit_id: string; character?: string; department?: string; job?: string };

/** A valid `/person/{id}` response with no credits; pass only what the test shows. */
export function buildPersonDetails(overrides: Partial<PersonDetails> = {}): PersonDetails {
  const id = nextId++;

  return {
    id,
    name: `Person ${id}`,
    biography: 'A biography.',
    birthday: null,
    deathday: null,
    gender: 0,
    homepage: null,
    imdb_id: null,
    known_for_department: 'Acting',
    place_of_birth: null,
    popularity: 10,
    profile_path: null,
    adult: false,
    also_known_as: [],
    combined_credits: { cast: [], crew: [] },
    ...overrides,
  };
}

/** A movie as a credit carries it; pass `undefined` for a field TMDB left out. */
export function buildMovieCredit(
  overrides: Partial<CreditedMovie & CreditRole> = {}
): CreditedMovie & CreditRole {
  return { ...buildMovie(), media_type: 'movie', credit_id: nextCreditId(), ...overrides };
}

/** A show as a credit carries it; pass `undefined` for a field TMDB left out. */
export function buildTvCredit(
  overrides: Partial<CreditedTV & CreditRole> = {}
): CreditedTV & CreditRole {
  return { ...buildTv(), media_type: 'tv', credit_id: nextCreditId(), ...overrides };
}

function nextCreditId(): string {
  return `credit-${nextId++}`;
}
