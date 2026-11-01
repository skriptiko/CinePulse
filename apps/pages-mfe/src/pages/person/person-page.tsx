import { personQueries } from '@repo/api';
import {
  FilmographySection,
  KnownForSection,
  NotFound,
  PersonDetailView,
  toFilmographyData,
  toKnownForData,
  toPersonDetailData,
  usePageMeta,
} from '@repo/ui';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { renderAddToWatchlist } from '../../components/add-to-watchlist';

/** An id TMDB does not know fails with a 404, which `PageBoundary` turns into `NotFound`. */
export function PersonDetail() {
  const { id } = useParams();
  const personId = parsePersonId(id);

  if (personId === null) return <NotFound />;
  return <PersonDetailContent id={personId} />;
}

function PersonDetailContent({ id }: { id: number }) {
  const { data: person } = useSuspenseQuery(personQueries.detail(id));
  usePageMeta(person.name);

  return (
    <PersonDetailView person={toPersonDetailData(person)}>
      <KnownForSection
        titles={toKnownForData(person.combined_credits)}
        renderCardAction={renderAddToWatchlist}
      />
      <FilmographySection credits={toFilmographyData(person.combined_credits)} />
    </PersonDetailView>
  );
}

function parsePersonId(id: string | undefined): number | null {
  return id !== undefined && /^[1-9]\d*$/.test(id) ? Number(id) : null;
}
