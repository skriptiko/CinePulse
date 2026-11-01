import type { Movie } from './movie';
import type { TV } from './tv';

export interface Person {
  id: number;
  name: string;
  original_name: string;
  profile_path: string | null;
  adult: boolean;
  popularity: number;
  gender: number;
  known_for_department: string;
  known_for: KnownFor[];
}

export interface KnownFor {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  gender: number;
  homepage: string | null;
  imdb_id: string | null;
  known_for_department: string;
  place_of_birth: string | null;
  popularity: number;
  profile_path: string | null;
  adult: boolean;
  also_known_as: string[];
  combined_credits: CombinedCredits;
}

/** The title of a credit: a list item with its media type, and TMDB can leave out all but the id. */
export type CreditedMovie = Partial<Movie> & Pick<Movie, 'id'> & { media_type: 'movie' };
export type CreditedTV = Partial<TV> & Pick<TV, 'id'> & { media_type: 'tv' };
export type CreditedTitle = CreditedMovie | CreditedTV;

/** One person can hold several credits on one title, so only `credit_id` is unique in a list. */
export type CastCredit = CreditedTitle & {
  credit_id: string;
  character?: string;
};

export type CrewCredit = CreditedTitle & {
  credit_id: string;
  department?: string;
  job?: string;
};

export type CombinedCredits = {
  cast: CastCredit[];
  crew: CrewCredit[];
};
