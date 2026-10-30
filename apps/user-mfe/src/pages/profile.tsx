import { usePageMeta } from '@repo/ui';

export function Profile() {
  usePageMeta('Profile');

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">User Profile</h1>
      <p className="text-muted-foreground">Welcome, User!</p>
    </div>
  );
}
