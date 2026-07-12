import { AppLayout as SharedAppLayout } from '@repo/ui';
import type { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return <SharedAppLayout>{children}</SharedAppLayout>;
}
