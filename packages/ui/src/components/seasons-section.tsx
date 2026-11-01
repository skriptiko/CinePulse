import { DetailSection, DetailSectionEmpty } from './detail-section';
import { ImagePlaceholder } from './image-placeholder';

/** What `SeasonsSection` renders; build the list with `toSeasonsData`. */
export type SeasonData = {
  id: number;
  name: string;
  /** `null` → placeholder. */
  posterUrl: string | null;
  year: string | null;
  /** Formatted count; `null` hides it. */
  episodes: string | null;
  overview: string | null;
};

export type SeasonsSectionProps = {
  seasons: SeasonData[];
};

export function SeasonsSection({ seasons }: SeasonsSectionProps) {
  return (
    <DetailSection title="Seasons">
      {seasons.length === 0 ? (
        <DetailSectionEmpty>No seasons listed.</DetailSectionEmpty>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {seasons.map((season) => (
            <li key={season.id} className="flex min-w-0 gap-3">
              <SeasonItem season={season} />
            </li>
          ))}
        </ul>
      )}
    </DetailSection>
  );
}

function SeasonItem({ season }: { season: SeasonData }) {
  const { name, posterUrl, year, episodes, overview } = season;

  return (
    <>
      <div className="aspect-[2/3] w-20 shrink-0 self-start overflow-hidden rounded-lg sm:w-24">
        {posterUrl === null ? (
          <ImagePlaceholder />
        ) : (
          <img
            src={posterUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        )}
      </div>
      <div className="min-w-0">
        <h3 className="mb-1 text-sm font-medium wrap-anywhere">{name}</h3>
        {(year !== null || episodes !== null) && (
          <p className="text-muted-foreground mb-1 flex flex-wrap gap-x-2 text-xs">
            {year !== null && <span>{year}</span>}
            {episodes !== null && <span>{episodes}</span>}
          </p>
        )}
        {overview !== null && (
          <p className="text-muted-foreground line-clamp-3 text-sm wrap-anywhere">{overview}</p>
        )}
      </div>
    </>
  );
}
