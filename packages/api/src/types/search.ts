import type { Movie } from './movie';
import type { Person } from './person';
import type { TV } from './tv';

export type SearchMovie = Movie & { media_type: 'movie' };
export type SearchTV = TV & { media_type: 'tv' };
export type SearchPerson = Person & { media_type: 'person' };

export type MultiSearchResult = SearchMovie | SearchTV | SearchPerson;
