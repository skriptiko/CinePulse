import type { CastMember, Creator, CrewMember } from '@repo/api';
import { describe, expect, it } from 'vitest';
import { toCreditsData } from '../credits';

function castMember(overrides: Partial<CastMember> = {}): CastMember {
  return {
    id: 1,
    credit_id: 'credit-1',
    name: 'Zendaya',
    character: 'Chani',
    profile_path: '/zendaya.jpg',
    order: 0,
    ...overrides,
  };
}

function crewMember(overrides: Partial<CrewMember> = {}): CrewMember {
  return {
    id: 10,
    credit_id: 'crew-10',
    name: 'Denis Villeneuve',
    department: 'Directing',
    job: 'Director',
    profile_path: null,
    ...overrides,
  };
}

function creator(overrides: Partial<Creator> = {}): Creator {
  return {
    id: 20,
    credit_id: 'creator-20',
    name: 'Dan Erickson',
    gender: 2,
    profile_path: null,
    ...overrides,
  };
}

describe('toCreditsData', () => {
  it('maps a cast member to a person link with a w185 photo', () => {
    const { cast } = toCreditsData({ cast: [castMember({ id: 7 })], crew: [] });

    expect(cast).toEqual([
      {
        creditId: 'credit-1',
        name: 'Zendaya',
        character: 'Chani',
        photoUrl: 'https://image.tmdb.org/t/p/w185/zendaya.jpg',
        href: '/person/7',
      },
    ]);
  });

  it('takes the first 12 by billing order, whatever order the list comes in', () => {
    const shuffled = Array.from({ length: 14 }, (_, index) =>
      castMember({ credit_id: `credit-${index}`, name: `Actor ${index}`, order: 13 - index })
    );

    const { cast } = toCreditsData({ cast: shuffled, crew: [] });

    expect(cast).toHaveLength(12);
    expect(cast[0]?.name).toBe('Actor 13');
    expect(cast[11]?.name).toBe('Actor 2');
    expect(shuffled[0]?.name).toBe('Actor 0');
  });

  it('keeps a person who holds two credits, told apart by the credit id', () => {
    const { cast } = toCreditsData({
      cast: [
        castMember({ credit_id: 'a', character: 'Mario' }),
        castMember({ credit_id: 'b', character: 'Luigi', order: 1 }),
      ],
      crew: [],
    });

    expect(cast.map((member) => member.creditId)).toEqual(['a', 'b']);
  });

  it('turns a missing photo or an empty character into null', () => {
    const { cast } = toCreditsData({
      cast: [castMember({ profile_path: null, character: ' ' })],
      crew: [],
    });

    expect(cast[0]).toMatchObject({ photoUrl: null, character: null });
  });

  it('lists directors first, then writers, and leaves the rest of the crew out', () => {
    const { crew } = toCreditsData({
      cast: [],
      crew: [
        crewMember({ id: 1, name: 'Writer', job: 'Writer', department: 'Writing' }),
        crewMember({ id: 2, name: 'Scripter', job: 'Screenplay', department: 'Writing' }),
        crewMember({ id: 3, name: 'Editor', job: 'Editor', department: 'Editing' }),
        crewMember({ id: 4, name: 'Director' }),
      ],
    });

    expect(crew.map((member) => member.name)).toEqual(['Director', 'Writer', 'Scripter']);
  });

  it('shows a person once, with every job and a link', () => {
    const { crew } = toCreditsData({
      cast: [],
      crew: [
        crewMember({ id: 5, job: 'Screenplay', department: 'Writing' }),
        crewMember({ id: 5, job: 'Director' }),
        crewMember({ id: 5, job: 'Screenplay', department: 'Writing' }),
      ],
    });

    expect(crew).toEqual([
      { id: 5, name: 'Denis Villeneuve', jobs: 'Director, Screenplay', href: '/person/5' },
    ]);
  });

  it('puts the creators of a show first, each linked to the person', () => {
    const { crew } = toCreditsData({ cast: [], crew: [crewMember()] }, [creator()]);

    expect(crew).toEqual([
      { id: 20, name: 'Dan Erickson', jobs: 'Creator', href: '/person/20' },
      { id: 10, name: 'Denis Villeneuve', jobs: 'Director', href: '/person/10' },
    ]);
  });

  it('shows a creator who also directs once, with both jobs', () => {
    const { crew } = toCreditsData({ cast: [], crew: [crewMember({ id: 20 })] }, [creator()]);

    expect(crew).toEqual([
      { id: 20, name: 'Dan Erickson', jobs: 'Creator, Director', href: '/person/20' },
    ]);
  });

  it('keeps the creators when TMDB leaves the credits out', () => {
    expect(toCreditsData(undefined, [creator()]).crew).toHaveLength(1);
  });

  it('degrades to empty lists when TMDB leaves the block out', () => {
    expect(toCreditsData(undefined)).toEqual({ cast: [], crew: [] });
    expect(toCreditsData(undefined, undefined)).toEqual({ cast: [], crew: [] });
  });
});
