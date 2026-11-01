import type { ImageSize, Season } from '@repo/api';
import { getImageUrl } from '@repo/api';
import type { SeasonData } from '../../components/seasons-section';
import { formatEpisodeCount, formatYear, toOptionalText } from '../format';

const POSTER_SIZE = 'w185' satisfies ImageSize;

/** Specials are season 0, which TMDB lists first: they read better after the show itself. */
export function toSeasonsData(seasons: Season[] | undefined): SeasonData[] {
  const specialsLast = [...(seasons ?? [])].sort(
    (a, b) => Number(a.season_number === 0) - Number(b.season_number === 0)
  );

  return specialsLast.map(toSeasonData);
}

function toSeasonData(season: Season): SeasonData {
  return {
    id: season.id,
    name: toOptionalText(season.name) ?? `Season ${season.season_number}`,
    posterUrl: getImageUrl(season.poster_path, POSTER_SIZE),
    year: formatYear(season.air_date),
    episodes: formatEpisodeCount(season.episode_count),
    overview: toOptionalText(season.overview),
  };
}
