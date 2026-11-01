const countFormat = new Intl.NumberFormat('en-US');

const COUNT_CLASS = 'text-muted-foreground block text-sm';

export type CatalogCountProps = {
  total: number;
  /** `1 movie found`. */
  singular: string;
  /** `4 movies found`. */
  plural: string;
  /** Off on a page that keeps its own live region: there the count is plain text. */
  isLive?: boolean;
};

/** The words of `CatalogCount`, for a page that keeps its own live region. */
export function catalogCountText(total: number, singular: string, plural: string): string {
  return `${countFormat.format(total)} ${total === 1 ? singular : plural} found`;
}

export function CatalogCount({ total, singular, plural, isLive = true }: CatalogCountProps) {
  const text = catalogCountText(total, singular, plural);

  return isLive ? (
    <output className={COUNT_CLASS}>{text}</output>
  ) : (
    <p className={COUNT_CLASS}>{text}</p>
  );
}
