import { useGlobalStore } from '@repo/events';
import { watchlistQueries } from '@repo/firebase';
import { usePageMeta } from '@repo/ui';
import { useSuspenseQueries } from '@tanstack/react-query';
import { useEffect, useId, useRef } from 'react';
import { FolderActions } from './folder-actions';
import { FolderTree } from './folder-tree';
import { TitleList } from './title-list';
import { useSelectedFolder } from './use-selected-folder';

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
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const selectedId = selected?.id;
  const previousIdRef = useRef(selectedId);
  const titles = selected
    ? items.filter(({ folderIds }) => folderIds.includes(selected.id))
    : items;

  // After the render, so the heading already names the new selection. Focus left on a control stays.
  useEffect(() => {
    if (selectedId === previousIdRef.current) return;
    previousIdRef.current = selectedId;
    // The form that held focus went with its folder.
    if (document.activeElement === document.body) headingRef.current?.focus();
  }, [selectedId]);

  return (
    <div className="max-w-page mx-auto px-4 pt-20 pb-16 sm:px-6 sm:pt-24 md:px-8">
      <h1 className="mb-6 text-2xl font-bold">Watchlist</h1>
      <div className="grid gap-8 md:grid-cols-[18rem_minmax(0,1fr)]">
        <FolderTree folders={folders} selectedId={selectedId ?? null} />
        <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-4">
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
          />
          <TitleList uid={uid} titles={titles} />
        </section>
      </div>
    </div>
  );
}
