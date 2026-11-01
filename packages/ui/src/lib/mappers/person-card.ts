import type { Person, ProfileSize } from '@repo/api';
import { getImageUrl } from '@repo/api';
import { buildPath } from '@repo/routes';
import type { PersonCardData } from '../../components/person-card';
import { toOptionalText } from '../format';

const PHOTO_SIZE = 'w185' satisfies ProfileSize;

/** What TMDB can leave out of a result is optional here (ADR-0012). */
type PersonCardFields = Pick<Person, 'id' | 'name' | 'profile_path'> &
  Partial<Pick<Person, 'known_for_department'>>;

export function toPersonCardData(person: PersonCardFields): PersonCardData {
  return {
    id: person.id,
    name: person.name,
    department: toOptionalText(person.known_for_department),
    photoUrl: getImageUrl(person.profile_path, PHOTO_SIZE),
    href: buildPath.person(person.id),
  };
}
