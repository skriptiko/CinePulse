import { server } from '@repo/test-utils';
import { HttpResponse, http } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase/app', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/app')>()),
  initializeApp: (options: object) => ({ options }),
}));

vi.mock('firebase/firestore/lite', () => ({
  collection: () => ({}),
  connectFirestoreEmulator: vi.fn(),
  getDocs: async () => ({ docs: [] }),
  getFirestore: () => ({}),
}));

async function countEmulatorConnections(projectId: string): Promise<number> {
  vi.resetModules();
  server.use(
    http.get('*/__/firebase/init.json', () => HttpResponse.json({ apiKey: 'key', projectId }))
  );
  const { getFolders } = await import('../watchlist-store');
  const { connectFirestoreEmulator } = await import('firebase/firestore/lite');

  await getFolders('u');

  return vi.mocked(connectFirestoreEmulator).mock.calls.length;
}

describe('watchlist store on a project', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stays off the emulator on a real project', async () => {
    await expect(countEmulatorConnections('cinepulse-eec15')).resolves.toBe(0);
  });

  it('uses the emulator on a demo project', async () => {
    await expect(countEmulatorConnections('demo-cinepulse')).resolves.toBe(1);
  });
});
