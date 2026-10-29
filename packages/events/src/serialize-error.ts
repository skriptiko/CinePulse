import type { SerializedError } from './types';

/** Reduces any thrown value to `{ name, message }` for event payloads. */
export function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }
  return { name: 'Error', message: String(error) };
}
