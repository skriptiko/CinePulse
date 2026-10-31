import { createTypedListener, globalStore, type NotificationPayload } from '@repo/events';
import { renderWithProviders, screen, waitFor } from '@repo/test-utils';
import { expect, it, vi } from 'vitest';
import { AddToWatchlist } from '../add-to-watchlist';

// In a file of its own: the module system keeps a chunk once it has loaded.
const chunk = vi.hoisted(() => ({ fails: true }));
vi.mock('../watchlist-dialog', async (importOriginal) => {
  if (chunk.fails) {
    chunk.fails = false;
    throw new Error('Failed to fetch dynamically imported module');
  }
  return importOriginal();
});

const TITLE = { mediaType: 'movie', tmdbId: 1, title: 'Dune', posterPath: null } as const;

it('answers the next press after a failed download', async () => {
  globalStore.getState().setUser(null);
  const shown: NotificationPayload[] = [];
  const stopListening = createTypedListener('notification:show')((payload) => {
    shown.push(payload);
  });
  const { user } = renderWithProviders(<AddToWatchlist title={TITLE} />);
  const trigger = screen.getByRole('button', { name: 'Add Dune to your watchlist' });

  await user.click(trigger);
  await waitFor(() => expect(shown).toHaveLength(1));
  await user.click(trigger);

  expect(await screen.findByRole('dialog')).toBeInTheDocument();
  stopListening();
});
