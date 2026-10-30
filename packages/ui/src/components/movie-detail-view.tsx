import { ImagePlaceholder } from './image-placeholder';

/** What `MovieDetailView` renders; build it with `toMovieDetailData`. */
export type MovieDetailData = {
  title: string;
  tagline: string | null;
  description: string | null;
  /** `null` → placeholder. */
  posterUrl: string | null;
  /** `null` hides the backdrop. */
  backdropUrl: string | null;
  backdropSrcSet: string | null;
  year: string | null;
  rating: string | null;
  runtime: string | null;
  genres: string[];
};

export type MovieDetailViewProps = {
  movie: MovieDetailData;
};

export function MovieDetailView({ movie }: MovieDetailViewProps) {
  const { title, tagline, description, posterUrl, backdropUrl, backdropSrcSet } = movie;
  const { year, rating, runtime, genres } = movie;

  return (
    <article className="relative">
      {backdropUrl !== null && (
        <div className="absolute inset-x-0 top-0 h-[60svh]">
          <img
            src={backdropUrl}
            srcSet={backdropSrcSet ?? undefined}
            sizes="100vw"
            alt=""
            fetchPriority="high"
            decoding="async"
            className="size-full object-cover"
          />
          <div className="from-background via-background/80 to-background/40 absolute inset-0 bg-linear-to-t" />
        </div>
      )}

      <div className="max-w-page relative mx-auto flex flex-col gap-6 px-4 pt-28 pb-16 sm:flex-row sm:gap-8 sm:px-6 sm:pt-36 lg:px-12">
        <div className="aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-lg md:w-64">
          {posterUrl === null ? (
            <ImagePlaceholder />
          ) : (
            <img src={posterUrl} alt="" decoding="async" className="size-full object-cover" />
          )}
        </div>

        <div className="max-w-2xl">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl">
            {title}
          </h1>
          {tagline !== null && <p className="text-muted-foreground mb-4 italic">{tagline}</p>}

          <div className="text-muted-foreground mb-4 flex flex-wrap items-center gap-2 text-sm sm:gap-3">
            {rating !== null && (
              <span className="bg-foreground text-background rounded px-2 py-1 font-medium">
                {rating}
              </span>
            )}
            {year !== null && <span>{year}</span>}
            {runtime !== null && <span>{runtime}</span>}
          </div>

          {genres.length > 0 && (
            <ul className="mb-6 flex flex-wrap gap-2">
              {genres.map((genre) => (
                <li key={genre} className="bg-secondary rounded-lg px-3 py-1 text-sm">
                  {genre}
                </li>
              ))}
            </ul>
          )}

          {description !== null && (
            <p className="text-muted-foreground leading-relaxed sm:text-lg">{description}</p>
          )}
        </div>
      </div>
    </article>
  );
}
