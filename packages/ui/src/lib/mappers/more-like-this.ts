import type { Movie, PaginatedResponse } from '@repo/api';
import type { MovieCardData } from '../../components/movie-card';
import { toMovieCardData } from './movie-card';

const TITLE_LIMIT = 12;

type TitleList = Partial<PaginatedResponse<Movie>> | undefined;

/** `similar` matches on genres alone, so it only stands in for missing recommendations. */
export function toMoreLikeThisData(
  recommendations: TitleList,
  similar: TitleList
): MovieCardData[] {
  const recommended = recommendations?.results ?? [];
  const titles = recommended.length > 0 ? recommended : (similar?.results ?? []);

  return titles.slice(0, TITLE_LIMIT).map(toMovieCardData);
}
