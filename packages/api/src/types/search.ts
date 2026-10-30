import type { TrendingMovie, TrendingPerson, TrendingTV } from './trending';

// Search and trending results carry the same `media_type` tag, so they share one shape.
export type SearchMovie = TrendingMovie;
export type SearchTV = TrendingTV;
export type SearchPerson = TrendingPerson;

export type MultiSearchResult = SearchMovie | SearchTV | SearchPerson;
