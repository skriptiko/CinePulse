import { signOutUser } from '@repo/firebase';
import { Button } from '@repo/ui';
import { useMutation } from '@tanstack/react-query';

export function SignOutButton() {
  const signOut = useMutation({ mutationFn: signOutUser });

  return (
    <Button
      variant="outline"
      className="touch-target"
      onClick={() => signOut.mutate()}
      disabled={signOut.isPending}
    >
      Sign out
    </Button>
  );
}
