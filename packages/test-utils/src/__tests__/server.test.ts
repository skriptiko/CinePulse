import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../msw/server';

describe('server', () => {
  it('serves the default movie list for relative /api/tmdb URLs', async () => {
    const response = await fetch('/api/tmdb/movie/popular?page=2');
    const body = await response.json();

    expect(response.ok).toBe(true);
    expect(body.page).toBe(2);
    expect(body.results).toHaveLength(3);
  });

  it('lets a test override a handler', async () => {
    server.use(
      http.get('*/api/tmdb/movie/:category', () => new HttpResponse(null, { status: 404 }))
    );

    const response = await fetch('/api/tmdb/movie/popular');

    expect(response.status).toBe(404);
  });

  it('fails on requests without a handler instead of reaching the network', async () => {
    const error = await fetch('/api/tmdb/unknown').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(TypeError);
    expect(String((error as TypeError).cause)).toMatch(/\[MSW\]/);
  });
});
