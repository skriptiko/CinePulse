import { createTypedEmitter } from '@repo/events';

const emitErrorReport = createTypedEmitter('error:report');

/** `onError` of every boundary: the host listener decides what is worth reporting. */
export function reportBoundaryError(error: unknown): void {
  emitErrorReport({ error, source: 'boundary' });
}
