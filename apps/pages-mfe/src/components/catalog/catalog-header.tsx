export type CatalogHeaderProps = {
  title: string;
  /** Plural noun of the page, e.g. `movies`. */
  noun: string;
};

export function CatalogHeader({ title, noun }: CatalogHeaderProps) {
  return (
    <div className="px-4 py-8 sm:px-6 sm:py-12 lg:px-12">
      <h1 className="fluid-heading mb-2 font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm sm:text-base">Explore our collection of {noun}</p>
    </div>
  );
}
