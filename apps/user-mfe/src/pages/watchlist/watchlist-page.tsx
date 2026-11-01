import { useGlobalStore } from '@repo/events';
import { type WatchStatus, watchlistQueries } from '@repo/firebase';
import { cn, usePageMeta } from '@repo/ui';
import { useSuspenseQueries } from '@tanstack/react-query';
import { useEffect, useId, useRef } from 'react';
import { FolderActions } from './folder-actions';
import { FolderTree } from './folder-tree';
import { StatusFilter } from './status-filter';
import { TitleList } from './title-list';
import { useDoublePressHold } from './use-double-press-hold';
import { useSelectedFolder } from './use-selected-folder';
import { STATUS_LABELS, useKeptRows, useStatusFilter } from './use-status-filter';

export function WatchlistPage() {
  usePageMeta('Watchlist');

  const uid = useGlobalStore((state) => state.user?.uid);
  // `RequireAuth` guards the route; this covers the one render in which sign-out lands.
  return uid ? <WatchlistContent uid={uid} /> : null;
}

type WatchlistContentProps = {
  uid: string;
};

function WatchlistContent({ uid }: WatchlistContentProps) {
  const [{ data: folders }, { data: items }] = useSuspenseQueries({
    queries: [watchlistQueries.folders(uid), watchlistQueries.items(uid)],
  });
  const { selected, replaceSelection } = useSelectedFolder(folders);
  const { statusFilter, setStatusFilter } = useStatusFilter();
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const selectedId = selected?.id;
  const view = `${selectedId}/${statusFilter}`;
  const previousViewRef = useRef(view);
  const previousCountRef = useRef(0);
  const { keptIds, keepRow } = useKeptRows(view);
  const { isHolding, hold } = useDoublePressHold();
  const folderTitles = selected
    ? items.filter(({ folderIds }) => folderIds.includes(selected.id))
    : items;
  const titles = statusFilter
    ? folderTitles.filter(({ id, status }) => status === statusFilter || keptIds.includes(id))
    : folderTitles;

  const count = titles.length;

  // After the render, so the heading already names the new selection. Focus left on a control stays.
  useEffect(() => {
    const isNewView = view !== previousViewRef.current;
    const isShorter = count < previousCountRef.current;
    previousViewRef.current = view;
    previousCountRef.current = count;
    if (!isNewView && !isShorter) return;
    // The form that held focus went with its folder, or the row that held it left. Within a view
    // the page keeps its place, for someone working down a long list with a mouse.
    if (document.activeElement === document.body) {
      headingRef.current?.focus({ preventScroll: !isNewView });
    }
  }, [view, count]);

  return (
    <div className="max-w-page mx-auto px-4 pt-20 pb-16 sm:px-6 sm:pt-24 md:px-8">
      <h1 className="mb-6 text-2xl font-bold">Watchlist</h1>
      <div className="grid gap-8 md:grid-cols-[18rem_minmax(0,1fr)]">
        <FolderTree folders={folders} selectedId={selectedId ?? null} />
        {/* Held as a whole: a form that closes moves the filter and the rows up under the finger,
            and a toolbar that wraps comes back under it. Focus still returns to the toolbar. */}
        <section
          aria-labelledby={headingId}
          className={cn('flex min-w-0 flex-col gap-4', isHolding && 'pointer-events-none')}
        >
          <h2
            ref={headingRef}
            id={headingId}
            tabIndex={-1}
            className="truncate text-lg font-semibold outline-hidden"
          >
            {selected?.name ?? 'All titles'}
          </h2>
          <FolderActions
            key={selectedId}
            uid={uid}
            folders={folders}
            selected={selected}
            onDeleted={replaceSelection}
            onFormClosed={hold}
          />
          <StatusFilter value={statusFilter} onChange={setStatusFilter} />
          {/* Always in the DOM: a live region announces a change only once it is already there. */}
          <output className="text-muted-foreground">{getSummary(count, statusFilter)}</output>
          <TitleList uid={uid} titles={titles} onStatusChange={keepRow} />
        </section>
      </div>
    </div>
  );
}

function getSummary(count: number, statusFilter: WatchStatus | null): string {
  if (count > 0) return count === 1 ? '1 title' : `${count} titles`;
  if (statusFilter === null) return 'No titles here yet.';
  return `No ${STATUS_LABELS[statusFilter].toLowerCase()} titles here.`;
}
