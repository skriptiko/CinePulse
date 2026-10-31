import { watchlistQueries } from '@repo/firebase';
import { Button } from '@repo/ui';
import { useQueryClient } from '@tanstack/react-query';
import { focusOnMount } from './focus-on-mount';
import { useFolderWrite } from './use-folder-write';

export type RemoveTitleFormProps = {
  uid: string;
  titleId: string;
  title: string;
  onClose: () => void;
};

/** The removal rereads `items`, which is rare enough to cost a read of every title (ADR-0015). */
export function RemoveTitleForm({ uid, titleId, title, onClose }: RemoveTitleFormProps) {
  const queryClient = useQueryClient();
  const { queryKey } = watchlistQueries.items(uid);
  const remove = useFolderWrite({
    write: (store, _: undefined) => store.removeTitle(uid, titleId),
    invalidate: queryKey,
    // At once: the row must not wait for that read, which is slow on a long list.
    onDone: () =>
      queryClient.setQueryData(queryKey, (items) => items?.filter(({ id }) => id !== titleId)),
  });

  return (
    // A fieldset, so focus landing on Cancel announces the question.
    <fieldset className="relative z-10 mt-2 min-w-0">
      <legend className="mb-2 w-full text-sm break-words">
        Remove {title}? It leaves every folder.
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
          Remove title
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
