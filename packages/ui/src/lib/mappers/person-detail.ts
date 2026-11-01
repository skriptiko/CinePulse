import type { PersonDetails, ProfileSize } from '@repo/api';
import { getImageUrl } from '@repo/api';
import type { PersonDetailData } from '../../components/person-detail-view';
import { formatDate, toOptionalText } from '../format';

/** Rendered up to 256 px wide, which `w185` does not cover. */
const PHOTO_SIZE = 'h632' satisfies ProfileSize;

type PersonDetailFields = Pick<
  PersonDetails,
  | 'name'
  | 'profile_path'
  | 'known_for_department'
  | 'birthday'
  | 'deathday'
  | 'place_of_birth'
  | 'biography'
>;

export function toPersonDetailData(person: PersonDetailFields): PersonDetailData {
  return {
    name: person.name,
    photoUrl: getImageUrl(person.profile_path, PHOTO_SIZE),
    department: toOptionalText(person.known_for_department),
    born: formatDate(person.birthday),
    died: formatDate(person.deathday),
    birthplace: toOptionalText(person.place_of_birth),
    biography: toOptionalText(person.biography)?.trim() ?? null,
  };
}
