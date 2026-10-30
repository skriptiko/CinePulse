import type { MovieDetails } from '@repo/api';
import { buildMovie } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { toMovieDetailData } from '../movie-detail';

const DETAILS: Pick<
  MovieDetails,
  | 'title'
  | 'overview'
  | 'poster_path'
  | 'backdrop_path'
  | 'release_date'
  | 'vote_average'
  | 'genres'
  | 'runtime'
  | 'tagline'
> = {
  ...buildMovie({ id: 1, title: 'Dune', overview: 'A desert planet.' }),
  genres: [{ id: 878, name: 'Sci-Fi' }],
  runtime: 155,
  tagline: 'Beyond fear',
};

describe('toMovieDetailData', () => {
  it('maps the fields the page shows', () => {
    expect(toMovieDetailData(DETAILS)).toMatchObject({
      title: 'Dune',
      description: 'A desert planet.',
      tagline: 'Beyond fear',
      runtime: '2h 35m',
      genres: ['Sci-Fi'],
    });
  });

  it('drops empty optional text', () => {
    const data = toMovieDetailData({ ...DETAILS, tagline: '', overview: ' ' });

    expect(data.tagline).toBeNull();
    expect(data.description).toBeNull();
  });
});
