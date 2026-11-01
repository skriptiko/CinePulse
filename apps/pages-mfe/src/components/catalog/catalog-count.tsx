const countFormat = new Intl.NumberFormat('en-US');

export type CatalogCountProps = {
  total: number;
  /** `1 movie found`. */
  singular: string;
  /** `4 movies found`. */
  plural: string;
};

export function CatalogCount({ total, singular, plural }: CatalogCountProps) {
  return (
    <output className="text-muted-foreground block text-sm">
      {countFormat.format(total)} {total === 1 ? singular : plural} found
    </output>
  );
}
