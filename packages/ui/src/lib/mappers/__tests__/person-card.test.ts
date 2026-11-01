import { describe, expect, it } from 'vitest';
import { toPersonCardData } from '../person-card';

const PERSON = {
  id: 42,
  name: 'Zendaya',
  profile_path: '/zendaya.jpg',
  known_for_department: 'Acting',
};

describe('toPersonCardData', () => {
  it('maps a person with every field', () => {
    expect(toPersonCardData(PERSON)).toEqual({
      id: 42,
      name: 'Zendaya',
      department: 'Acting',
      photoUrl: 'https://image.tmdb.org/t/p/w185/zendaya.jpg',
      href: '/person/42',
    });
  });

  it('uses null for what TMDB does not know', () => {
    const data = toPersonCardData({ ...PERSON, profile_path: null, known_for_department: ' ' });

    expect(data).toMatchObject({ photoUrl: null, department: null });
  });

  it('takes a person TMDB sent no department for', () => {
    const { known_for_department: _department, ...person } = PERSON;

    expect(toPersonCardData(person).department).toBeNull();
  });
});
