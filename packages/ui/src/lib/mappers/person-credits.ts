import type { CastCredit, CombinedCredits, CreditedTitle, CrewCredit } from '@repo/api';
import { buildPath } from '@repo/routes';
import type { FilmographyCreditData } from '../../components/filmography-section';
import type { MovieCardData } from '../../components/movie-card';
import { formatYear, toOptionalText } from '../format';
import { toMovieCardData, toTvCardData } from './movie-card';

const KNOWN_FOR_LIMIT = 12;

/** Talk and News: a guest spot says little about what someone is known for. */
const APPEARANCE_GENRE_IDS = [10767, 10763];

const SELF_JOB_PATTERN = /^(self|himself|herself)\b/i;

const UNTITLED = 'Untitled';

type CreditLists = Partial<CombinedCredits> | undefined;

/** One title, with what its credits say about it. */
type MergedTitle = {
  /** Media type and id: a movie and a show can share an id. */
  key: string;
  credit: CreditedTitle;
  title: string | null;
  date: string | null;
  roles: Set<string>;
};

export function toKnownForData(credits: CreditLists): MovieCardData[] {
  const cast = (credits?.cast ?? []).filter((credit) => !isAppearance(credit));
  const crew = (credits?.crew ?? []).filter((credit) => !isSelfJob(credit));

  return mergeCredits(cast, crew)
    .sort((a, b) => (b.credit.vote_count ?? 0) - (a.credit.vote_count ?? 0))
    .flatMap(toCards)
    .slice(0, KNOWN_FOR_LIMIT);
}

export function toFilmographyData(credits: CreditLists): FilmographyCreditData[] {
  return (
    mergeCredits(credits?.cast ?? [], credits?.crew ?? [])
      // An undated title compares as an empty string, which sorts below any date.
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
      .map(toFilmographyCreditData)
  );
}

function mergeCredits(cast: CastCredit[], crew: CrewCredit[]): MergedTitle[] {
  const credits = [
    ...cast.map((credit) => ({ credit, role: credit.character })),
    ...crew.map((credit) => ({ credit, role: credit.job })),
  ];

  const titles = new Map<string, MergedTitle>();
  for (const { credit, role } of credits) {
    const key = `${credit.media_type}-${credit.id}`;
    const merged = titles.get(key) ?? {
      key,
      credit,
      title: null,
      date: null,
      roles: new Set<string>(),
    };
    merged.title ??= toTitleText(credit);
    merged.date ??= toTitleDate(credit);
    const roleText = toOptionalText(role);
    if (roleText !== null) merged.roles.add(roleText);
    titles.set(key, merged);
  }

  return [...titles.values()];
}

function isAppearance(credit: CastCredit): boolean {
  return credit.genre_ids?.some((id) => APPEARANCE_GENRE_IDS.includes(id)) ?? false;
}

function isSelfJob(credit: CrewCredit): boolean {
  return SELF_JOB_PATTERN.test(credit.job ?? '');
}

function toTitleText(credit: CreditedTitle): string | null {
  return credit.media_type === 'movie'
    ? (toOptionalText(credit.title) ?? toOptionalText(credit.original_title))
    : (toOptionalText(credit.name) ?? toOptionalText(credit.original_name));
}

/** The raw date, for sorting; `null` unless `formatYear` can read it. */
function toTitleDate(credit: CreditedTitle): string | null {
  const date = credit.media_type === 'movie' ? credit.release_date : credit.first_air_date;
  return formatYear(date) === null ? null : (date ?? null);
}

/** A list, so that a title with no name, which a card could not show, drops out before the limit. */
function toCards({ credit, title }: MergedTitle): MovieCardData[] {
  if (title === null) return [];

  return [
    credit.media_type === 'movie'
      ? toMovieCardData({ ...credit, title })
      : toTvCardData({ ...credit, name: title }),
  ];
}

function toFilmographyCreditData(merged: MergedTitle): FilmographyCreditData {
  const { key, credit, title, date, roles } = merged;

  return {
    key,
    year: formatYear(date),
    title: title ?? UNTITLED,
    roles: roles.size > 0 ? [...roles].join(', ') : null,
    href: credit.media_type === 'movie' ? buildPath.movie(credit.id) : buildPath.tv(credit.id),
  };
}
