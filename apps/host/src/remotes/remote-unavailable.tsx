import { Button } from '@repo/ui';

/** Stands in for the routes of a remote that failed to load; the rest of the app keeps working. */
export function RemoteUnavailable() {
  return (
    <section
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 pt-24 text-center"
    >
      <h1 className="text-2xl font-semibold sm:text-3xl">This section is unavailable</h1>
      <p className="max-w-md text-muted-foreground">
        It could not be loaded. The rest of CinePulse still works.
      </p>
      <Button onClick={handleRetry}>Try again</Button>
    </section>
  );
}

// A failed remote import is cached by the module system, so retrying means reloading.
function handleRetry(): void {
  window.location.reload();
}
