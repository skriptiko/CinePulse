import type { CastMember, Credits, CrewMember, ProfileSize } from '@repo/api';
import { getImageUrl } from '@repo/api';
import { buildPath } from '@repo/routes';
import type { CastMemberData, CreditsData, CrewMemberData } from '../../components/cast-section';
import { toOptionalText } from '../format';

const CAST_LIMIT = 12;
const PHOTO_SIZE = 'w185' satisfies ProfileSize;

/** Directing, then the writing jobs: most films list `Screenplay` and no `Writer`. */
const CREW_JOBS = ['Director', 'Writer', 'Screenplay', 'Story'];

export function toCreditsData(credits: Partial<Credits> | undefined): CreditsData {
  const byBilling = [...(credits?.cast ?? [])].sort((a, b) => a.order - b.order);

  return {
    cast: byBilling.slice(0, CAST_LIMIT).map(toCastMemberData),
    crew: toCrewData(credits?.crew ?? []),
  };
}

function toCastMemberData(member: CastMember): CastMemberData {
  return {
    creditId: member.credit_id,
    name: member.name,
    character: toOptionalText(member.character),
    photoUrl: getImageUrl(member.profile_path, PHOTO_SIZE),
    href: buildPath.person(member.id),
  };
}

/** One entry per person, as a director who also wrote the film has a credit for each job. */
function toCrewData(crew: CrewMember[]): CrewMemberData[] {
  const credited = crew
    .filter((member) => CREW_JOBS.includes(member.job))
    .sort((a, b) => CREW_JOBS.indexOf(a.job) - CREW_JOBS.indexOf(b.job));

  const people = new Map<number, { name: string; jobs: Set<string> }>();
  for (const { id, name, job } of credited) {
    const person = people.get(id) ?? { name, jobs: new Set<string>() };
    person.jobs.add(job);
    people.set(id, person);
  }

  return [...people].map(([id, { name, jobs }]) => ({
    id,
    name,
    jobs: [...jobs].join(', '),
    href: buildPath.person(id),
  }));
}
