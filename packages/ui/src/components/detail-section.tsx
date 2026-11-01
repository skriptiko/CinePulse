import { type ReactNode, useId } from 'react';

/** The hero's gutter; `ContentRow` takes it too, as it draws its own heading. */
export const DETAIL_SECTION_GUTTER = 'px-4 sm:px-6 lg:px-12';

export type DetailSectionProps = {
  title: string;
  children: ReactNode;
};

/** One section of a details page, under `MovieDetailView`. */
export function DetailSection({ title, children }: DetailSectionProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className={DETAIL_SECTION_GUTTER}>
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
