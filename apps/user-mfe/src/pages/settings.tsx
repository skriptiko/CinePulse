import { usePageMeta } from '@repo/ui';

export function Settings() {
  usePageMeta('Settings');

  return (
    <div className="max-w-page mx-auto px-4 pt-20 pb-16 sm:px-6 sm:pt-24 md:px-8">
      <h1 className="mb-4 text-2xl font-bold">User Settings</h1>
      <p className="text-muted-foreground">Manage your account settings here.</p>
    </div>
  );
}
