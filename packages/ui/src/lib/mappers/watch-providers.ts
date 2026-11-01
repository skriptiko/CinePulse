import type { ImageSize, WatchProvider, WatchProvidersResponse } from '@repo/api';
import { getImageUrl } from '@repo/api';
import type {
  WatchProviderData,
  WatchProvidersData,
} from '../../components/watch-providers-section';
import { formatCountry } from '../format';
import { toHttpsUrl } from './https-url';

const LOGO_SIZE = 'w92' satisfies ImageSize;

const GROUPS = [
  { kind: 'flatrate', label: 'Stream' },
  { kind: 'rent', label: 'Rent' },
  { kind: 'buy', label: 'Buy' },
] as const;

/** `region` is a key of `results`, see `getViewerRegion`. */
export function toWatchProvidersData(
  response: Partial<WatchProvidersResponse> | undefined,
  region: string
): WatchProvidersData {
  const providers = response?.results?.[region];
  const groups = GROUPS.map(({ kind, label }) => ({
    label,
    providers: (providers?.[kind] ?? []).map(toWatchProviderData),
  })).filter((group) => group.providers.length > 0);

  return {
    country: formatCountry(region),
    groups,
    link: toHttpsUrl(providers?.link),
  };
}

function toWatchProviderData(provider: WatchProvider): WatchProviderData {
  return {
    id: provider.provider_id,
    name: provider.provider_name,
    logoUrl: getImageUrl(provider.logo_path, LOGO_SIZE),
  };
}
