import { ApiError } from '@repo/api';
import { createTypedListener } from '@repo/events';
import { renderWithProviders, screen } from '@repo/test-utils';
import { useSuspenseQuery } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AsyncBoundary } from '../async-boundary';

const onErrorReport = createTypedListener('error:report');

function Movie({ queryFn }: { queryFn: () => Promise<string> }) {
  const { data } = useSuspenseQuery({ queryKey: ['movie'], queryFn });
  return <p>{data}</p>;
}

function renderBoundary(queryFn: () => Promise<string>) {
  return renderWithProviders(
    <AsyncBoundary fallback={<p>Loading movie</p>}>
      <Movie queryFn={queryFn} />
    </AsyncBoundary>
  );
}

describe('AsyncBoundary', () => {
  beforeEach(() => {
    // React logs every error a boundary catches; the tests assert the UI instead.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it('shows the fallback while loading, then the content', async () => {
    renderBoundary(async () => 'Dune');

    expect(screen.getByText('Loading movie')).toBeInTheDocument();
    expect(await screen.findByText('Dune')).toBeInTheDocument();
  });

  it('shows a generic error without the raw message and reports it', async () => {
    const reports: unknown[] = [];
    const unsubscribe = onErrorReport(({ error, source }) => reports.push({ error, source }));

    renderBoundary(() => Promise.reject(new ApiError('server', 'HTTP 500 from /movie/1')));

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.queryByText(/HTTP 500/)).not.toBeInTheDocument();
    expect(reports).toEqual([{ error: expect.any(ApiError), source: 'boundary' }]);
    unsubscribe();
  });

  it('refetches the failed query on Try again', async () => {
    const queryFn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new ApiError('network', 'Network request failed'))
      .mockResolvedValue('Dune');
    const { user } = renderBoundary(queryFn);

    await user.click(await screen.findByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Dune')).toBeInTheDocument();
    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it('shows NotFound for a 404 instead of a retry', async () => {
    renderBoundary(() => Promise.reject(new ApiError('not_found', 'Not found', { status: 404 })));

    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });
});
