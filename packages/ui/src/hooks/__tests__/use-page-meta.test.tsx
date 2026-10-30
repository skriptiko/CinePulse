import { renderWithProviders } from '@repo/test-utils';
import { describe, expect, it } from 'vitest';
import { usePageMeta } from '../use-page-meta';

function Page({ title }: { title?: string }) {
  usePageMeta(title);
  return null;
}

describe('usePageMeta', () => {
  it('prefixes the page title to the app name', () => {
    renderWithProviders(<Page title="Movies" />);

    expect(document.title).toBe('Movies · CinePulse');
  });

  it('uses the app name alone without a title', () => {
    renderWithProviders(<Page />);

    expect(document.title).toBe('CinePulse');
  });
});
