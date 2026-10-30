import { useGlobalStore } from '@repo/events';
import { signOutUser } from '@repo/firebase';
import { Button, usePageMeta } from '@repo/ui';
import { useMutation } from '@tanstack/react-query';

export function Profile() {
  usePageMeta('Profile');

  const user = useGlobalStore((state) => state.user);
  const signOut = useMutation({ mutationFn: signOutUser });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">User Profile</h1>
      <p className="text-muted-foreground mb-4">Welcome, {user?.displayName ?? user?.email}!</p>
      <Button variant="outline" onClick={() => signOut.mutate()} disabled={signOut.isPending}>
        Sign out
      </Button>
    </div>
  );
}
