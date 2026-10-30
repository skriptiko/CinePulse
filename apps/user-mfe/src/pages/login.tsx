import { useGlobalStore } from '@repo/events';
import { getSignInErrorMessage, prepareSignIn, signInWithGoogle } from '@repo/firebase';
import { ROUTE_PATHS } from '@repo/routes';
import { Button, usePageMeta } from '@repo/ui';
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export function Login() {
  usePageMeta('Sign in');

  const isAuthenticated = useGlobalStore((state) => state.authStatus === 'authenticated');
  const { state } = useLocation();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void prepareSignIn();
  }, []);

  if (isAuthenticated) {
    return <Navigate to={state?.from ?? ROUTE_PATHS.USER_PROFILE} replace />;
  }

  const handleSignIn = async () => {
    setIsPending(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
    } catch (error) {
      setErrorMessage(getSignInErrorMessage(error));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 px-4 pt-32 pb-16 text-center">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <p className="text-muted-foreground">Keep your watchlist with your Google account.</p>
      <Button onClick={handleSignIn} disabled={isPending}>
        Continue with Google
      </Button>
      {errorMessage !== null && (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
