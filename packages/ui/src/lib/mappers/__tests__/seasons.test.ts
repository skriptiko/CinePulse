import type { Season } from '@repo/api';
import { describe, expect, it } from 'vitest';
import { toSeasonsData } from '../seasons';

function season(overrides: Partial<Season> = {}): Season {
  return {
    id: 1,
    name: 'Season 1',
    overview: 'The first one.',
    air_date: '2022-02-18',
    episode_count: 9,
    poster_path: '/season-1.jpg',
    season_number: 1,
    ...overrides,
  };
}

describe('toSeasonsData', () => {
  it('maps a season to its poster, name, air year, episode count and overview', () => {
    expect(toSeasonsData([season()])).toEqual([
      {
        id: 1,
        name: 'Season 1',
        posterUrl: 'https://image.tmdb.org/t/p/w185/season-1.jpg',
        year: '2022',
        episodes: '9 episodes',
        overview: 'The first one.',
      },
    ]);
  });

  it('keeps the order of TMDB, with season 0 last', () => {
    const seasons = [
      season({ id: 10, name: 'Specials', season_number: 0 }),
      season({ id: 12, name: 'Season 2', season_number: 2 }),
      season({ id: 11, name: 'Season 1', season_number: 1 }),
      season({ id: 13, name: 'Season 3', season_number: 3 }),
    ];

    expect(toSeasonsData(seasons).map(({ name }) => name)).toEqual([
      'Season 2',
      'Season 1',
      'Season 3',
      'Specials',
    ]);
    expect(seasons[0]?.name).toBe('Specials');
  });

  it('uses a singular for one episode', () => {
    expect(toSeasonsData([season({ episode_count: 1 })])[0]?.episodes).toBe('1 episode');
  });

  it('turns what TMDB does not know into null', () => {
    const [data] = toSeasonsData([
      season({ poster_path: null, air_date: null, episode_count: 0, overview: ' ' }),
    ]);

    expect(data).toMatchObject({ posterUrl: null, year: null, episodes: null, overview: null });
  });

  it('names a season by its number when TMDB sends no name', () => {
    expect(toSeasonsData([season({ name: '', season_number: 4 })])[0]?.name).toBe('Season 4');
  });

  it('degrades to an empty list when TMDB leaves the list out', () => {
    expect(toSeasonsData(undefined)).toEqual([]);
  });
});
