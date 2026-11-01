import type { RegionWatchProviders, WatchProvider, WatchProvidersResponse } from '@repo/api';
import { describe, expect, it } from 'vitest';
import { toWatchProvidersData } from '../watch-providers';

function provider(id: number, name: string, logo: string | null = `/${name}.png`): WatchProvider {
  return { provider_id: id, provider_name: name, logo_path: logo };
}

function inRegion(region: string, providers: RegionWatchProviders): WatchProvidersResponse {
  return { results: { [region]: providers } };
}

const LINK = 'https://www.themoviedb.org/movie/42/watch?locale=UA';

describe('toWatchProvidersData', () => {
  it('groups the providers of the region into Stream, Rent and Buy', () => {
    const data = toWatchProvidersData(
      inRegion('UA', {
        link: LINK,
        buy: [provider(3, 'Apple')],
        rent: [provider(2, 'Google')],
        flatrate: [provider(1, 'Netflix')],
      }),
      'UA'
    );

    expect(data).toEqual({
      country: 'Ukraine',
      link: LINK,
      groups: [
        {
          label: 'Stream',
          providers: [
            { id: 1, name: 'Netflix', logoUrl: 'https://image.tmdb.org/t/p/w92/Netflix.png' },
          ],
        },
        {
          label: 'Rent',
          providers: [
            { id: 2, name: 'Google', logoUrl: 'https://image.tmdb.org/t/p/w92/Google.png' },
          ],
        },
        {
          label: 'Buy',
          providers: [
            { id: 3, name: 'Apple', logoUrl: 'https://image.tmdb.org/t/p/w92/Apple.png' },
          ],
        },
      ],
    });
  });

  it('reads only the region of the viewer', () => {
    const response = inRegion('US', { link: LINK, flatrate: [provider(1, 'Netflix')] });

    expect(toWatchProvidersData(response, 'UA')).toEqual({
      country: 'Ukraine',
      link: null,
      groups: [],
    });
  });

  it('leaves out a group with no providers', () => {
    const { groups } = toWatchProvidersData(
      inRegion('US', { link: LINK, rent: [], buy: [provider(3, 'Apple')] }),
      'US'
    );

    expect(groups.map((group) => group.label)).toEqual(['Buy']);
  });

  it('has no groups for a region with only the kinds the page does not show', () => {
    const adsOnly = { link: LINK, ads: [provider(4, 'Tubi')] } as RegionWatchProviders;

    expect(toWatchProvidersData(inRegion('US', adsOnly), 'US').groups).toEqual([]);
  });

  it('keeps a provider with no logo, with null for a placeholder', () => {
    const { groups } = toWatchProvidersData(
      inRegion('US', { link: LINK, flatrate: [provider(1, 'Netflix', null)] }),
      'US'
    );

    expect(groups[0]?.providers[0]?.logoUrl).toBeNull();
  });

  it('drops a link that is not https', () => {
    const data = toWatchProvidersData(
      inRegion('US', { link: 'http://example.com', flatrate: [provider(1, 'Netflix')] }),
      'US'
    );

    expect(data.link).toBeNull();
  });

  it('degrades to no groups when TMDB leaves the block out', () => {
    expect(toWatchProvidersData(undefined, 'US')).toEqual({
      country: 'United States',
      link: null,
      groups: [],
    });
  });
});
