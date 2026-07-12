import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';

const TMDB_API_READ_TOKEN = defineSecret('TMDB_API_READ_TOKEN');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export const tmdbProxy = onRequest(
  {
    secrets: [TMDB_API_READ_TOKEN],
    cors: true,
  },
  async (req, res) => {
    const token = TMDB_API_READ_TOKEN.value();

    if (!token) {
      res.status(500).json({ error: 'TMDB API token not configured' });
      return;
    }

    const originalPath = req.path.replace(/^\/api\/tmdb/, '') || '/';
    const queryString = req.url.includes('?') ? req.url.split('?')[1] : '';
    const tmdbUrl = `${TMDB_BASE_URL}${originalPath}${queryString ? `?${queryString}` : ''}`;

    try {
      const response = await fetch(tmdbUrl, {
        method: req.method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      res.status(response.status).json(data);
    } catch (error) {
      console.error('TMDB proxy error:', error);
      res.status(500).json({ error: 'Failed to fetch from TMDB' });
    }
  }
);
