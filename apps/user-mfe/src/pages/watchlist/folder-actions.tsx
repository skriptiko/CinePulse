import { watchlistQueries } from '@repo/firebase';
import {
  canAddSubfolder,
  canMoveFolder,
  getBranch,
  getFolderRows,
  MAX_FOLDER_DEPTH,
  type WatchlistFolder,
} from '@repo/firebase/watchlist-tree';
import { Button, Input } from '@repo/ui';
import { useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useId, useState } from 'react';
import { focusOnMount } from './focus-on-mount';
import { useFolderWrite, type WatchlistStore } from './use-folder-write';

const MAX_NAME_LENGTH = 100;
const TOP_LEVEL = '';

type FolderAction = 'create' | 'createChild' | 'rename' | 'move' | 'delete';

export type FolderActionsProps = {
  uid: string;
  folders: WatchlistFolder[];
  selected: WatchlistFolder | null;
  onDeleted: (parentId: string | null) => void;
};

/** One toolbar for the selected folder. A form takes its place; the delete question goes below. */
export function FolderActions({ uid, folders, selected, onDeleted }: FolderActionsProps) {
  const [action, setAction] = useState<FolderAction | null>(null);
  const [returnFocusTo, setReturnFocusTo] = useState<FolderAction | null>(null);
  const queryClient = useQueryClient();

  function open(name: FolderAction): void {
    setAction(name);
    setReturnFocusTo(null);
    // Both act on the server's tree, and nothing else refreshes a long-open tab.
    if (name === 'move' || name === 'delete') {
      void queryClient.invalidateQueries({ queryKey: watchlistQueries.folders(uid).queryKey });
    }
  }

  function close(): void {
    setReturnFocusTo(action);
    setAction(null);
  }

  if (action === 'create' || (action === 'createChild' && selected)) {
    const parent = action === 'create' ? null : selected;
    return (
      <NameForm
        uid={uid}
        label={parent ? `New folder in ${parent.name}` : 'New folder'}
        write={(store, name) => store.createFolder(uid, name, parent)}
        onClose={close}
      />
    );
  }
  if (action === 'rename' && selected) {
    return (
      <NameForm
        uid={uid}
        label={`Rename ${selected.name}`}
        initialName={selected.name}
        write={(store, name) => store.renameFolder(uid, selected.id, name)}
        onClose={close}
      />
    );
  }
  if (action === 'move' && selected) {
    return <MoveForm uid={uid} folders={folders} folder={selected} onClose={close} />;
  }

  function renderButton(name: FolderAction, label: string, disabled = false) {
    return (
      <Button
        ref={returnFocusTo === name ? focusOnMount : undefined}
        size="sm"
        variant="outline"
        disabled={disabled || action === 'delete'}
        className="touch-target"
        onClick={() => open(name)}
      >
        {label}
      </Button>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {renderButton('create', 'New folder')}
        {selected && (
          <>
            {renderButton('createChild', 'New subfolder', !canAddSubfolder(selected))}
            {renderButton('rename', 'Rename')}
            {renderButton('move', 'Move')}
            {renderButton('delete', 'Delete')}
            {!canAddSubfolder(selected) && (
              <p className="text-muted-foreground w-full text-sm">
                Folders go {MAX_FOLDER_DEPTH} levels deep, so this one cannot hold subfolders.
              </p>
            )}
          </>
        )}
      </div>
      {/* Below the toolbar, not in its place: a double tap must not reach the confirming button. */}
      {action === 'delete' && selected && (
        <DeleteForm
          uid={uid}
          folders={folders}
          folder={selected}
          onClose={close}
          onDeleted={() => onDeleted(selected.parentId)}
        />
      )}
    </>
  );
}

type NameFormProps = {
  uid: string;
  label: string;
  initialName?: string;
  write: (store: WatchlistStore, name: string) => Promise<void>;
  onClose: () => void;
};

function NameForm({ uid, label, initialName = '', write, onClose }: NameFormProps) {
  const [name, setName] = useState(initialName);
  const inputId = useId();
  const save = useFolderWrite({
    write,
    invalidate: watchlistQueries.folders(uid).queryKey,
    onDone: onClose,
  });
  const trimmed = name.trim();

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    if (trimmed) save.submit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium break-words">
        {label}
      </label>
      <Input
        ref={focusOnMount}
        id={inputId}
        value={name}
        maxLength={MAX_NAME_LENGTH}
        className="touch-target"
        onChange={(event) => setName(event.target.value)}
      />
      <div className="flex gap-2">
        <Button
          ref={save.submitRef}
          type="submit"
          size="sm"
          disabled={!trimmed || save.isPending}
          className="touch-target"
        >
          Save
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={save.isPending}
          className="touch-target"
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

type MoveFormProps = {
  uid: string;
  folders: WatchlistFolder[];
  folder: WatchlistFolder;
  onClose: () => void;
};

function MoveForm({ uid, folders, folder, onClose }: MoveFormProps) {
  const selectId = useId();
  const [choice, setChoice] = useState(TOP_LEVEL);
  const targets = getFolderPaths(folders).filter(({ id }) => canMoveFolder(folders, folder.id, id));
  const canMoveToTop = canMoveFolder(folders, folder.id, null);
  const options = [...(canMoveToTop ? [TOP_LEVEL] : []), ...targets.map(({ id }) => id)];
  // Derived, not stored: a refetch can remove the chosen folder, and the browser then shows another.
  const target = options.includes(choice) ? choice : (options[0] ?? null);
  const move = useFolderWrite({
    write: (store, parentId: string | null) => store.moveFolder(uid, folder.id, parentId),
    invalidate: watchlistQueries.folders(uid).queryKey,
    onDone: onClose,
  });

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    if (target !== null) move.submit(target === TOP_LEVEL ? null : target);
  }

  if (target === null) {
    return (
      <fieldset className="min-w-0">
        <legend className="text-muted-foreground mb-2 text-sm">
          There is nowhere to move this folder.
        </legend>
        <Button
          ref={focusOnMount}
          size="sm"
          variant="ghost"
          className="touch-target"
          onClick={onClose}
        >
          Cancel
        </Button>
      </fieldset>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor={selectId} className="text-sm font-medium break-words">
        Move {folder.name} to
      </label>
      <select
        ref={focusOnMount}
        id={selectId}
        value={target}
        onChange={(event) => setChoice(event.target.value)}
        className="touch-target border-input bg-background h-9 w-full rounded-md border px-3 text-base md:text-sm"
      >
        {canMoveToTop && <option value={TOP_LEVEL}>Top level</option>}
        {targets.map(({ id, path }) => (
          <option key={id} value={id}>
            {path}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <Button
          ref={move.submitRef}
          type="submit"
          size="sm"
          disabled={move.isPending}
          className="touch-target"
        >
          Move
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={move.isPending}
          className="touch-target"
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

type DeleteFormProps = MoveFormProps & {
  onDeleted: () => void;
};

function DeleteForm({ uid, folders, folder, onClose, onDeleted }: DeleteFormProps) {
  const remove = useFolderWrite({
    write: (store, _: undefined) => store.deleteFolder(uid, folder.id),
    invalidate: watchlistQueries.all(uid),
    onDone: onDeleted,
  });

  return (
    // A fieldset, so focus landing on Cancel announces the question.
    <fieldset className="min-w-0">
      <legend className="mb-2 w-full text-sm break-words">
        {getDeleteQuestion(folder, getBranch(folders, folder.id).length - 1)}
      </legend>
      <div className="flex gap-2">
        <Button
          ref={remove.submitRef}
          size="sm"
          variant="destructive"
          disabled={remove.isPending}
          className="touch-target"
          onClick={() => remove.submit(undefined)}
        >
          Delete folder
        </Button>
        <Button
          ref={focusOnMount}
          size="sm"
          variant="ghost"
          disabled={remove.isPending}
          className="touch-target"
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </fieldset>
  );
}

/** Each folder with its path: two folders can share a name, and hierarchy must not rely on sight. */
function getFolderPaths(folders: WatchlistFolder[]) {
  const trail: string[] = [];

  return getFolderRows(folders).map(({ folder, level }) => {
    trail[level] = folder.name;
    return { id: folder.id, path: trail.slice(0, level + 1).join(' / ') };
  });
}

function getDeleteQuestion({ name }: WatchlistFolder, subfolders: number): string {
  const branch =
    subfolders === 0 ? '' : ` and ${subfolders} subfolder${subfolders === 1 ? '' : 's'}`;
  return `Delete ${name}${branch}? Titles stay in your watchlist.`;
}
