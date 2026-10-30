import { getFolderRows, type WatchlistFolder } from '@repo/firebase/watchlist-tree';
import { cn } from '@repo/ui';
import { Link } from 'react-router-dom';
import { getFolderSearch } from './use-selected-folder';

const ROW_CLASS_NAME =
  'touch-target text-muted-foreground hover:text-foreground hover:bg-secondary aria-[current=page]:text-foreground aria-[current=page]:bg-secondary flex items-center rounded-md py-1.5 pr-3 text-sm aria-[current=page]:font-medium';

export type FolderTreeProps = {
  folders: WatchlistFolder[];
  selectedId: string | null;
};

export function FolderTree({ folders, selectedId }: FolderTreeProps) {
  return (
    <nav aria-label="Folders" className="max-h-64 overflow-y-auto md:max-h-none">
      <ul>
        <li>
          <Link
            to={{ search: getFolderSearch(null) }}
            aria-current={selectedId === null ? 'page' : undefined}
            className={cn(ROW_CLASS_NAME, 'pl-3')}
          >
            All titles
          </Link>
        </li>
        {getFolderRows(folders).map(({ folder, level }) => (
          <li key={folder.id}>
            <Link
              to={{ search: getFolderSearch(folder.id) }}
              aria-label={`${folder.name}, level ${level + 1}`}
              aria-current={folder.id === selectedId ? 'page' : undefined}
              className={ROW_CLASS_NAME}
              style={{ paddingInlineStart: `${level + 0.75}rem` }}
            >
              <span className="truncate">{folder.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
