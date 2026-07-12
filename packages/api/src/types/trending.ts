import type { Movie } from './movie';
import type { Person } from './person';
import type { TV } from './tv';

export type MediaType = 'movie' | 'tv' | 'person' | 'all';
export type TimeWindow = 'day' | 'week';

export type TrendingMovie = Movie & { media_type: 'movie' };
export type TrendingTV = TV & { media_type: 'tv' };
export type TrendingPerson = Person & { media_type: 'person' };

export type TrendingItem = TrendingMovie | TrendingTV | TrendingPerson;
