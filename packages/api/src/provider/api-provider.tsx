import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { createQueryClient } from '../query-client';

export type ApiProviderProps = {
  children: ReactNode;
};

/**
 * Gives the tree the app's `QueryClient`. Render it once in the host and in each remote's
 * standalone `main.tsx`, never around integrated remote routes: a nested provider would hide
 * the host's shared cache.
 */
export function ApiProvider({ children }: ApiProviderProps) {
  const [queryClient] = useState(createQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
