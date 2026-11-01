import { Link } from 'react-router-dom';
import { DetailSection, DetailSectionEmpty } from './detail-section';
import { ImagePlaceholder } from './image-placeholder';

export type CastMemberData = {
  /** One person can hold two credits, so the person id is not unique here. */
  creditId: string;
  name: string;
  character: string | null;
  /** `null` → placeholder. */
  photoUrl: string | null;
  href: string;
};

export type CrewMemberData = {
  id: number;
  name: string;
  /** Every job of this person, already joined. */
  jobs: string;
  href: string;
};

/** What `CastSection` renders; build it with `toCreditsData`. */
export type CreditsData = {
  cast: CastMemberData[];
  crew: CrewMemberData[];
};

export type CastSectionProps = {
  credits: CreditsData;
};

export function CastSection({ credits }: CastSectionProps) {
  const { cast, crew } = credits;

  return (
    <DetailSection title="Cast">
      {crew.length > 0 && (
        <ul aria-label="Directors and writers" className="mb-6 flex flex-wrap gap-x-6 gap-y-1">
          {crew.map(({ id, name, jobs, href }) => (
            <li key={id} className="text-muted-foreground min-w-0 text-sm wrap-anywhere">
              <Link to={href} className="text-foreground font-medium hover:underline">
                {name}
              </Link>{' '}
              {jobs}
            </li>
          ))}
        </ul>
      )}

      {cast.length === 0 ? (
        <DetailSectionEmpty>No cast listed yet.</DetailSectionEmpty>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 md:gap-4 lg:grid-cols-8 2xl:grid-cols-12">
          {cast.map((member) => (
            <li key={member.creditId}>
              <CastCard member={member} />
            </li>
          ))}
        </ul>
      )}
    </DetailSection>
  );
}

function CastCard({ member }: { member: CastMemberData }) {
  const { name, character, photoUrl, href } = member;

  return (
    <Link to={href} className="group block">
      <div className="mb-2 aspect-[2/3] overflow-hidden rounded-lg">
        {photoUrl === null ? (
          <ImagePlaceholder />
        ) : (
          <img
            src={photoUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        )}
      </div>
      <span className="block text-sm font-medium wrap-anywhere group-hover:underline">{name}</span>
      {character !== null && (
        <span className="text-muted-foreground line-clamp-2 block text-xs wrap-anywhere">
          {character}
        </span>
      )}
    </Link>
  );
}
