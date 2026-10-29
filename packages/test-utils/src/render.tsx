import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type RenderOptions, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Initial URL of the in-memory router. */
  route?: string;
  queryClient?: QueryClient;
}

/**
 * Renders `ui` inside a fresh QueryClient and a MemoryRouter.
 * Returns a user-event instance that also works with `vi.useFakeTimers()`.
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    route = '/',
    queryClient = createTestQueryClient(),
    ...options
  }: RenderWithProvidersOptions = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  const user = userEvent.setup({ advanceTimers: advanceFakeTimers });

  return { user, queryClient, ...render(ui, { wrapper: Wrapper, ...options }) };
}

/** No retries, so error tests fail fast instead of waiting for backoff. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false },
    },
  });
}

// user-event hangs under fake timers unless it can advance them; with real timers it is a no-op.
function advanceFakeTimers(ms: number): void {
  if (vi.isFakeTimers()) vi.advanceTimersByTime(ms);
}
