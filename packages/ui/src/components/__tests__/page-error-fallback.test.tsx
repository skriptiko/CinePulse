import { ApiError } from '@repo/api';
import { renderWithProviders, screen } from '@repo/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PageErrorFallback } from '../page-error-fallback';

const CHUNK_ERROR = new TypeError('Failed to fetch dynamically imported module');

describe('PageErrorFallback', () => {
  const reload = vi.fn();
  const resetErrorBoundary = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('location', { ...window.location, reload });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function pressTryAgain(error: unknown) {
    const { user } = renderWithProviders(
      <PageErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
    );
    await user.click(screen.getByRole('button', { name: 'Try again' }));
  }

  it('retries a failed request in place', async () => {
    await pressTryAgain(new ApiError('server', 'Failed'));

    expect(resetErrorBoundary).toHaveBeenCalledOnce();
    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads for a page chunk, as a failed `lazy` keeps its failure', async () => {
    await pressTryAgain(CHUNK_ERROR);

    expect(reload).toHaveBeenCalledOnce();
    expect(resetErrorBoundary).not.toHaveBeenCalled();
  });

  it('stays on the page offline, where a reload would lose it', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    await pressTryAgain(CHUNK_ERROR);

    expect(reload).not.toHaveBeenCalled();
    expect(resetErrorBoundary).toHaveBeenCalledOnce();
  });
});
