import { ApiError, toHttpError } from '@repo/api';
import type { FirebaseApp, FirebaseOptions } from 'firebase/app';

/** Served by Firebase Hosting for the project, so the repository holds no Firebase keys. */
const CONFIG_URL = '/__/firebase/init.json';

let app: Promise<FirebaseApp> | undefined;

/** One app per page. A failed start is forgotten, so the next call tries again. */
export function getFirebaseApp(): Promise<FirebaseApp> {
  app ??= startApp().catch((error: unknown) => {
    app = undefined;
    throw error;
  });
  return app;
}

async function startApp(): Promise<FirebaseApp> {
  const [{ initializeApp }, options] = await Promise.all([import('firebase/app'), fetchOptions()]);
  return initializeApp(options);
}

async function fetchOptions(): Promise<FirebaseOptions> {
  const response = await fetch(CONFIG_URL).catch((cause: unknown) => {
    throw new ApiError('network', 'Could not load the Firebase config', { cause });
  });
  if (!response.ok) throw toHttpError(response);

  return response.json().catch((cause: unknown) => {
    throw new ApiError('validation', 'The Firebase config is not JSON', { cause });
  });
}
