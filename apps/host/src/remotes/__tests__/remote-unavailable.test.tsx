import { renderWithProviders, screen } from '@repo/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RemoteUnavailable } from '../remote-unavailable';

describe('RemoteUnavailable', () => {
  const reload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('location', { ...window.location, reload });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function pressTryAgain() {
    const { user } = renderWithProviders(<RemoteUnavailable />);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
  }

  it('reloads with a connection, as a failed remote import keeps its failure', async () => {
    await pressTryAgain();

    expect(reload).toHaveBeenCalledOnce();
  });

  it('stays on the page offline, where a reload would lose it', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    await pressTryAgain();

    expect(reload).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('This section is unavailable');
  });
});
