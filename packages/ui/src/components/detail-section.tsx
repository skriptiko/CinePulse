import { type ReactNode, useId } from 'react';

/** The hero's gutter; `ContentRow` takes it too, as it draws its own heading. */
export const DETAIL_SECTION_GUTTER = 'px-4 sm:px-6 lg:px-12';

export type DetailSectionProps = {
  title: string;
  children: ReactNode;
  /** Side padding; a section inside the column of the hero has none of its own. */
  gutterClassName?: string;
};

/** One section of a details page, under `MovieDetailView` or `PersonDetailView`. */
export function DetailSection({
  title,
  children,
  gutterClassName = DETAIL_SECTION_GUTTER,
}: DetailSectionProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className={gutterClassName}>
      <h2 id={titleId} className="mb-4 text-xl font-semibold tracking-tight md:text-2xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

export type DetailSectionEmptyProps = {
  children: ReactNode;
};

/** The one line a section keeps when TMDB has nothing for it. */
export function DetailSectionEmpty({ children }: DetailSectionEmptyProps) {
  return <p className="text-muted-foreground text-sm">{children}</p>;
}
