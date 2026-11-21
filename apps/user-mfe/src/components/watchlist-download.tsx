import { useGlobalStore } from '@repo/events';
import { watchlistQueries } from '@repo/firebase';
import { Button } from '@repo/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { type ExportFile, toCsvExport, toJsonExport } from './watchlist-export';

const FORMATS = {
  json: { label: 'Download JSON', build: toJsonExport },
  csv: { label: 'Download CSV', build: toCsvExport },
} as const;

type Format = keyof typeof FORMATS;

/** Builds the file in the browser from the watchlist, read fresh if the cache has none. */
export function WatchlistDownload() {
  const uid = useGlobalStore((state) => state.user?.uid);
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<Format | null>(null);
  const [hasFailed, setHasFailed] = useState(false);

  const handleDownload = async (format: Format) => {
    if (!uid) return;
    setPending(format);
    setHasFailed(false);
    try {
      const [folders, items] = await Promise.all([
        queryClient.ensureQueryData(watchlistQueries.folders(uid)),
        queryClient.ensureQueryData(watchlistQueries.items(uid)),
      ]);
      saveFile(FORMATS[format].build(folders, items, new Date()));
    } catch {
      setHasFailed(true);
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-3">
        {(Object.keys(FORMATS) as Format[]).map((format) => (
          <Button
            key={format}
            variant="outline"
            className="touch-target"
            onClick={() => handleDownload(format)}
            disabled={pending !== null}
          >
            {FORMATS[format].label}
          </Button>
        ))}
      </div>
      <output className="sr-only">{pending ? 'Preparing your file…' : ''}</output>
      {hasFailed && (
        <p role="alert" className="text-destructive text-sm">
          Your watchlist could not be downloaded. Try again.
        </p>
      )}
    </div>
  );
}

function saveFile({ name, type, content }: ExportFile): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  // In the document: an older Firefox ignores a click on a detached link.
  document.body.append(link);
  link.click();
  link.remove();
  // After the click has started the download, which reads the URL synchronously.
  setTimeout(() => URL.revokeObjectURL(url));
}
