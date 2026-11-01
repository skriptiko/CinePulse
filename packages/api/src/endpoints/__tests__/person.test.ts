import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { getPersonDetails } from '../person';

// @repo/api cannot use @repo/test-utils (that package depends on @repo/api), so it owns its server.
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('getPersonDetails', () => {
  it('asks for the person and every credit in one request', async () => {
    const requests: URL[] = [];
    server.use(
      http.get('*/api/tmdb/person/:id', ({ request }) => {
        requests.push(new URL(request.url));
        return HttpResponse.json({ id: 287, name: 'Brad Pitt' });
      })
    );

    await getPersonDetails(287);

    expect(requests.map((url) => url.pathname)).toEqual(['/api/tmdb/person/287']);
    expect(requests[0]?.searchParams.get('append_to_response')).toBe('combined_credits');
  });
});
