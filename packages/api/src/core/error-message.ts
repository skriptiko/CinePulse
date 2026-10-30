import { isApiError } from './errors';

/** The one place that turns an error into words for users: no status codes, no internals. */
export function getErrorMessage(error: unknown): string {
  if (!isApiError(error)) return 'Something went wrong. Please try again.';

  switch (error.kind) {
    case 'network':
      return 'Could not reach the server. Check your connection.';
    case 'server':
      return 'The movie service is having trouble. Please try again later.';
    case 'not_found':
      return 'We could not find what you were looking for.';
    case 'client':
    case 'validation':
      return 'Something went wrong. Please try again.';
    default: {
      const unhandled: never = error.kind;
      return unhandled;
    }
  }
}
