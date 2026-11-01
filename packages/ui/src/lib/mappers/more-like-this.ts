import type { PaginatedResponse } from '@repo/api';
import type { MovieCardData } from '../../components/movie-card';

const TITLE_LIMIT = 12;

type TitleList<Title> = Partial<PaginatedResponse<Title>> | undefined;

/** `similar` matches on genres alone, so it only stands in for missing recommendations. */
export function toMoreLikeThisData<Title>(
  recommendations: TitleList<Title>,
  similar: TitleList<Title>,
  toCard: (title: Title) => MovieCardData
): MovieCardData[] {
  const recommended = recommendations?.results ?? [];
  const titles = recommended.length > 0 ? recommended : (similar?.results ?? []);

  return titles.slice(0, TITLE_LIMIT).map(toCard);
}
