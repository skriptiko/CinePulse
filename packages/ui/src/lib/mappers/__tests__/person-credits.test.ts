import { buildMovieCredit, buildTv, buildTvCredit } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { toTvCardData } from '../movie-card';
import { toFilmographyData, toKnownForData } from '../person-credits';

const TALK = 10767;
const NEWS = 10763;

describe('toKnownForData', () => {
  it('puts the highest vote count first, across movies and shows and cast and crew', () => {
    const titles = toKnownForData({
      cast: [
        buildMovieCredit({ title: 'Few votes', vote_count: 10 }),
        buildTvCredit({ name: 'Most votes', vote_count: 900 }),
      ],
      crew: [buildMovieCredit({ title: 'Some votes', vote_count: 50, job: 'Director' })],
    });

    expect(titles.map((title) => title.title)).toEqual(['Most votes', 'Some votes', 'Few votes']);
  });

  it('shows at most 12, the ones with the most votes', () => {
    const cast = Array.from({ length: 14 }, (_, index) => buildMovieCredit({ vote_count: index }));

    const titles = toKnownForData({ cast, crew: [] });

    expect(titles).toHaveLength(12);
    expect(titles[11]?.title).toBe(cast[2]?.title);
  });

  it('shows a title once, whatever the number of credits on it', () => {
    const movie = { id: 5, title: 'Twice', vote_count: 10 };

    const titles = toKnownForData({
      cast: [
        buildMovieCredit({ ...movie, character: 'A' }),
        buildMovieCredit({ ...movie, character: 'B' }),
      ],
      crew: [buildMovieCredit({ ...movie, job: 'Director' })],
    });

    expect(titles.map((title) => title.title)).toEqual(['Twice']);
  });

  it('keeps a movie and a show that share an id', () => {
    const titles = toKnownForData({
      cast: [buildMovieCredit({ id: 5 }), buildTvCredit({ id: 5 })],
      crew: [],
    });

    expect(titles.map((title) => title.mediaType).sort()).toEqual(['movie', 'tv']);
  });

  it.each([
    ['a talk show', TALK],
    ['a news show', NEWS],
  ])('skips a cast credit on %s', (_label, genre) => {
    const titles = toKnownForData({
      cast: [
        buildTvCredit({ name: 'Guest spot', genre_ids: [35, genre], vote_count: 9000 }),
        buildMovieCredit({ title: 'A film', vote_count: 1 }),
      ],
      crew: [],
    });

    expect(titles.map((title) => title.title)).toEqual(['A film']);
  });

  it('keeps a talk show the person made, as that credit is crew', () => {
    const titles = toKnownForData({
      cast: [buildTvCredit({ id: 5, name: 'Late Show', genre_ids: [TALK] })],
      crew: [buildTvCredit({ id: 5, name: 'Late Show', genre_ids: [TALK], job: 'Creator' })],
    });

    expect(titles.map((title) => title.title)).toEqual(['Late Show']);
  });

  it.each(['Self', 'self', 'Himself', 'Herself', 'Self - Host'])(
    'skips a title whose only credit is the crew job %s',
    (job) => {
      const titles = toKnownForData({
        cast: [],
        crew: [buildMovieCredit({ title: 'About them', job })],
      });

      expect(titles).toEqual([]);
    }
  );

  it('keeps a self credit that has a cast credit beside it', () => {
    const movie = { id: 5, title: 'Their film' };

    const titles = toKnownForData({
      cast: [buildMovieCredit({ ...movie, character: 'Lead' })],
      crew: [buildMovieCredit({ ...movie, job: 'Self' })],
    });

    expect(titles.map((title) => title.title)).toEqual(['Their film']);
  });

  it('does not take a job that only starts like one for a self credit', () => {
    const titles = toKnownForData({
      cast: [],
      crew: [buildMovieCredit({ title: 'Kept', job: 'Selfie Consultant' })],
    });

    expect(titles.map((title) => title.title)).toEqual(['Kept']);
  });

  it('builds a movie card with the movie mapper', () => {
    const credit = buildMovieCredit({
      id: 5,
      title: 'Dune',
      poster_path: '/dune.jpg',
      release_date: '2021-09-15',
      vote_average: 7.84,
    });

    expect(toKnownForData({ cast: [credit], crew: [] })).toEqual([
      {
        id: 5,
        title: 'Dune',
        mediaType: 'movie',
        posterPath: '/dune.jpg',
        imageUrl: 'https://image.tmdb.org/t/p/w342/dune.jpg',
        year: '2021',
        rating: '7.8',
        href: '/movies/5',
      },
    ]);
  });

  it('builds a show card with the show mapper, which owns its link', () => {
    const fields = {
      id: 5,
      name: 'Severance',
      poster_path: '/sev.jpg',
      first_air_date: '2022-02-18',
      vote_average: 8.4,
    };

    expect(toKnownForData({ cast: [buildTvCredit(fields)], crew: [] })).toEqual([
      toTvCardData(buildTv(fields)),
    ]);
  });

  it('survives a credit with no date, no poster, no votes and no genres', () => {
    const credit = buildMovieCredit({
      title: 'Bare',
      release_date: undefined,
      poster_path: undefined,
      vote_average: undefined,
      vote_count: undefined,
      genre_ids: undefined,
    });

    const [card] = toKnownForData({ cast: [credit], crew: [] });

    // `undefined` would make Firestore refuse the title when it goes on a watchlist.
    expect(card).toMatchObject({ year: null, imageUrl: null, posterPath: null, rating: null });
  });

  it('puts a credit with no vote count last', () => {
    const titles = toKnownForData({
      cast: [
        buildMovieCredit({ title: 'Unknown', vote_count: undefined }),
        buildMovieCredit({ title: 'Known', vote_count: 1 }),
      ],
      crew: [],
    });

    expect(titles.map((title) => title.title)).toEqual(['Known', 'Unknown']);
  });

  it('falls back to the original title', () => {
    const titles = toKnownForData({
      cast: [
        buildMovieCredit({ title: undefined, original_title: 'Original film' }),
        buildTvCredit({ name: '', original_name: 'Original show' }),
      ],
      crew: [],
    });

    expect(titles.map((title) => title.title)).toEqual(['Original film', 'Original show']);
  });

  it('keeps a title when only one of its credits lacks the name', () => {
    const titles = toKnownForData({
      cast: [buildMovieCredit({ id: 5, title: 'Named' })],
      crew: [
        buildMovieCredit({ id: 5, title: undefined, original_title: undefined, job: 'Writer' }),
      ],
    });

    expect(titles.map((title) => title.title)).toEqual(['Named']);
  });

  it('leaves out a credit with no title at all, as it has no name to add to a watchlist', () => {
    const cast = [
      buildMovieCredit({ title: undefined, original_title: undefined, vote_count: 9 }),
      ...Array.from({ length: 12 }, () => buildMovieCredit({ vote_count: 1 })),
    ];

    expect(toKnownForData({ cast, crew: [] })).toHaveLength(12);
  });

  it('degrades to an empty list when TMDB leaves the block out', () => {
    expect(toKnownForData(undefined)).toEqual([]);
    expect(toKnownForData({})).toEqual([]);
  });
});

describe('toFilmographyData', () => {
  it('maps a movie to a row', () => {
    const rows = toFilmographyData({
      cast: [
        buildMovieCredit({
          id: 5,
          title: 'Dune',
          release_date: '2021-09-15',
          character: 'Chani',
        }),
      ],
      crew: [],
    });

    expect(rows).toEqual([
      { key: 'movie-5', year: '2021', title: 'Dune', roles: 'Chani', href: '/movies/5' },
    ]);
  });

  it('maps a show to a row with a link of its own', () => {
    const rows = toFilmographyData({
      cast: [],
      crew: [
        buildTvCredit({
          id: 5,
          name: 'Severance',
          first_air_date: '2022-02-18',
          job: 'Executive Producer',
        }),
      ],
    });

    expect(rows).toEqual([
      {
        key: 'tv-5',
        year: '2022',
        title: 'Severance',
        roles: 'Executive Producer',
        href: '/tv/5',
      },
    ]);
  });

  it('merges cast and crew into one row with all its roles, each once', () => {
    const movie = { id: 5, title: 'Both' };

    const rows = toFilmographyData({
      cast: [
        buildMovieCredit({ ...movie, character: 'Lead' }),
        buildMovieCredit({ ...movie, character: 'Twin' }),
      ],
      crew: [
        buildMovieCredit({ ...movie, job: 'Director' }),
        buildMovieCredit({ ...movie, job: 'Writer' }),
        buildMovieCredit({ ...movie, job: 'Writer' }),
      ],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.roles).toBe('Lead, Twin, Director, Writer');
  });

  it('keeps a movie and a show that share an id as two rows', () => {
    const rows = toFilmographyData({
      cast: [buildMovieCredit({ id: 5 }), buildTvCredit({ id: 5 })],
      crew: [],
    });

    expect(rows.map((row) => row.key).sort()).toEqual(['movie-5', 'tv-5']);
  });

  it('puts the newest first and the undated last', () => {
    const rows = toFilmographyData({
      cast: [
        buildMovieCredit({ title: 'No date', release_date: undefined }),
        buildMovieCredit({ title: 'Empty date', release_date: '' }),
        buildMovieCredit({ title: 'Bad date', release_date: '2024-13-45' }),
        buildMovieCredit({ title: 'Old', release_date: '1999-01-01' }),
        buildTvCredit({ name: 'Same year, later', first_air_date: '2024-06-01' }),
      ],
      crew: [buildMovieCredit({ title: 'Same year', release_date: '2024-01-01' })],
    });

    expect(rows.map((row) => row.title)).toEqual([
      'Same year, later',
      'Same year',
      'Old',
      'No date',
      'Empty date',
      'Bad date',
    ]);
    expect(rows.slice(3).map((row) => row.year)).toEqual([null, null, null]);
  });

  it('keeps every credit, talk shows and self credits too', () => {
    const rows = toFilmographyData({
      cast: [buildTvCredit({ genre_ids: [TALK] })],
      crew: [buildMovieCredit({ job: 'Self' })],
    });

    expect(rows).toHaveLength(2);
  });

  it('shows no role for an empty character or a missing job', () => {
    const rows = toFilmographyData({
      cast: [buildMovieCredit({ character: '' })],
      crew: [buildMovieCredit({ job: undefined })],
    });

    expect(rows.map((row) => row.roles)).toEqual([null, null]);
  });

  it('falls back to the original title, then to Untitled', () => {
    const rows = toFilmographyData({
      cast: [
        buildMovieCredit({ title: undefined, original_title: 'Original film' }),
        buildTvCredit({ name: undefined, original_name: undefined }),
      ],
      crew: [],
    });

    expect(rows.map((row) => row.title).sort()).toEqual(['Original film', 'Untitled']);
  });

  it('fills what one credit lacks from the next credit on the title', () => {
    const rows = toFilmographyData({
      cast: [
        buildMovieCredit({
          id: 5,
          title: undefined,
          original_title: undefined,
          release_date: undefined,
        }),
      ],
      crew: [buildMovieCredit({ id: 5, title: 'Found', release_date: '2020-01-01' })],
    });

    expect(rows).toMatchObject([{ title: 'Found', year: '2020' }]);
  });

  it('degrades to an empty list when TMDB leaves the block out', () => {
    expect(toFilmographyData(undefined)).toEqual([]);
    expect(toFilmographyData({})).toEqual([]);
  });
});
