import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { ImagePlaceholder } from './image-placeholder';

/** What a `PersonCard` renders; build it with `toPersonCardData`. */
export type PersonCardData = {
  id: number;
  name: string;
  /** What the person is known for; `null` hides the line. */
  department: string | null;
  /** `null` → placeholder. */
  photoUrl: string | null;
  /** The person's page. */
  href: string;
};

export type PersonCardProps = {
  person: PersonCardData;
  className?: string;
};

export function PersonCard({ person, className }: PersonCardProps) {
  const { name, department, photoUrl, href } = person;

  return (
    <Link to={href} className={cn('group block rounded-lg', className)}>
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
      <h3 className="line-clamp-2 text-sm font-medium wrap-anywhere group-hover:underline">
        {name}
      </h3>
      {department !== null && (
        <p className="text-muted-foreground truncate text-xs">{department}</p>
      )}
    </Link>
  );
}
