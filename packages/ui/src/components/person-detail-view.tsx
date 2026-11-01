import { Fragment, type ReactNode } from 'react';
import { BiographySection } from './biography-section';
import { ImagePlaceholder } from './image-placeholder';

/** What `PersonDetailView` renders; build it with `toPersonDetailData`. */
export type PersonDetailData = {
  name: string;
  /** `null` → placeholder. */
  photoUrl: string | null;
  /** What the person is known for, such as `Acting`. */
  department: string | null;
  born: string | null;
  died: string | null;
  birthplace: string | null;
  /** `null` → one muted line. */
  biography: string | null;
};

export type PersonDetailViewProps = {
  person: PersonDetailData;
  /** Sections below the hero block. */
  children?: ReactNode;
};

export function PersonDetailView({ person, children }: PersonDetailViewProps) {
  const { name, photoUrl, department, born, died, birthplace, biography } = person;
  const facts = [
    { label: 'Born', value: born },
    { label: 'Died', value: died },
    { label: 'Place of birth', value: birthplace },
  ].filter(({ value }) => value !== null);

  return (
    <article className="relative">
      <div className="max-w-page relative mx-auto flex flex-col gap-6 px-4 pt-28 pb-16 sm:flex-row sm:gap-8 sm:px-6 sm:pt-36 lg:px-12">
        <div className="aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-lg md:w-64">
          {photoUrl === null ? (
            <ImagePlaceholder />
          ) : (
            <img src={photoUrl} alt="" decoding="async" className="size-full object-cover" />
          )}
        </div>

        <div className="max-w-2xl min-w-0">
          <h1 className="fluid-heading mb-2 font-bold tracking-tight text-balance wrap-anywhere">
            {name}
          </h1>
          {department !== null && (
            <p className="text-muted-foreground mb-4 wrap-anywhere">{department}</p>
          )}

          {facts.length > 0 && (
            <dl className="mb-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              {facts.map(({ label, value }) => (
                <Fragment key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="min-w-0 wrap-anywhere">{value}</dd>
                </Fragment>
              ))}
            </dl>
          )}

          <BiographySection biography={biography} />
        </div>
      </div>

      {children !== undefined && (
        <div className="max-w-page relative mx-auto flex flex-col gap-12 pb-16">{children}</div>
      )}
    </article>
  );
}
