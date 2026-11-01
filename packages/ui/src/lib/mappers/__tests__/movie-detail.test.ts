import type { MovieDetails } from '@repo/api';
import { buildMovie, buildTvDetails } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { toMovieDetailData, toTvDetailData } from '../movie-detail';

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
      duration: '2h 35m',
      genres: ['Sci-Fi'],
    });
  });

  it('drops empty optional text', () => {
    const data = toMovieDetailData({ ...DETAILS, tagline: '', overview: ' ' });

    expect(data.tagline).toBeNull();
    expect(data.description).toBeNull();
  });
});

describe('toTvDetailData', () => {
  const SHOW = buildTvDetails({
    name: 'Severance',
    overview: 'Work and life, surgically divided.',
    tagline: 'Please enjoy each fact equally',
    poster_path: '/severance.jpg',
    backdrop_path: '/office.jpg',
    first_air_date: '2022-02-18',
    vote_average: 8.4,
    genres: [{ id: 18, name: 'Drama' }],
    number_of_seasons: 3,
    number_of_episodes: 24,
  });

  it('maps the fields the page shows, with seasons and episodes in place of a runtime', () => {
    expect(toTvDetailData(SHOW)).toEqual({
      title: 'Severance',
      tagline: 'Please enjoy each fact equally',
      description: 'Work and life, surgically divided.',
      posterUrl: 'https://image.tmdb.org/t/p/w342/severance.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/w1280/office.jpg',
      backdropSrcSet:
        'https://image.tmdb.org/t/p/w780/office.jpg 780w, https://image.tmdb.org/t/p/w1280/office.jpg 1280w',
      year: '2022',
      rating: '8.4',
      duration: '3 seasons, 24 episodes',
      genres: ['Drama'],
    });
  });

  it('uses singulars for a one-off', () => {
    const data = toTvDetailData({ ...SHOW, number_of_seasons: 1, number_of_episodes: 1 });

    expect(data.duration).toBe('1 season, 1 episode');
  });

  it('drops what TMDB does not know', () => {
    const data = toTvDetailData({
      ...SHOW,
      tagline: '',
      overview: ' ',
      first_air_date: '',
      number_of_seasons: 0,
      number_of_episodes: 0,
    });

    expect(data).toMatchObject({ tagline: null, description: null, year: null, duration: null });
  });
});
