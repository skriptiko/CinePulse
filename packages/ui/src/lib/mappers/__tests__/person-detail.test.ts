import { buildPersonDetails } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { toPersonDetailData } from '../person-detail';

describe('toPersonDetailData', () => {
  it('maps a person with every field', () => {
    const person = buildPersonDetails({
      name: 'Zendaya',
      profile_path: '/zendaya.jpg',
      known_for_department: 'Acting',
      birthday: '1996-09-01',
      deathday: '2090-01-02',
      place_of_birth: 'Oakland, California, USA',
      biography: 'An actress.',
    });

    expect(toPersonDetailData(person)).toEqual({
      name: 'Zendaya',
      photoUrl: 'https://image.tmdb.org/t/p/h632/zendaya.jpg',
      department: 'Acting',
      born: 'Sep 1, 1996',
      died: 'Jan 2, 2090',
      birthplace: 'Oakland, California, USA',
      biography: 'An actress.',
    });
  });

  it('uses null for what TMDB does not know', () => {
    const data = toPersonDetailData(
      buildPersonDetails({
        profile_path: null,
        known_for_department: '',
        birthday: null,
        deathday: '',
        place_of_birth: ' ',
        biography: '',
      })
    );

    expect(data).toMatchObject({
      photoUrl: null,
      department: null,
      born: null,
      died: null,
      birthplace: null,
      biography: null,
    });
  });

  it('drops a date that is not a real date', () => {
    expect(toPersonDetailData(buildPersonDetails({ birthday: '1964-02-30' })).born).toBeNull();
  });

  it('keeps the paragraph breaks of a biography and trims its ends', () => {
    const { biography } = toPersonDetailData(
      buildPersonDetails({ biography: '\n  First.\n\nSecond.\n' })
    );

    expect(biography).toBe('First.\n\nSecond.');
  });
});
