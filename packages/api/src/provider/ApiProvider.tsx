import { QueryClientProvider } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

export interface ApiProviderProps {
  queryClient: QueryClient;
  children: ReactNode;
}

export function ApiProvider({ queryClient, children }: ApiProviderProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
