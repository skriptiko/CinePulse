import { ApiProvider, watchlistKey } from '@repo/api';
import { createTypedEmitter } from '@repo/events';
import { render } from '@repo/test-utils';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { describe, expect, it } from 'vitest';

function renderProvider(): QueryClient {
  let client: QueryClient | undefined;

  function Probe() {
    client = useQueryClient();
    return null;
  }

  render(
    <StrictMode>
      <ApiProvider>
        <Probe />
      </ApiProvider>
    </StrictMode>
  );
  if (!client) throw new Error('ApiProvider rendered no client');
  return client;
}

describe('ApiProvider', () => {
  it('drops the watchlist of a user who signed out', () => {
    const client = renderProvider();
    client.setQueryData([...watchlistKey('a'), 'folders'], []);

    createTypedEmitter('user:logout')({ uid: 'a' });

    expect(client.getQueryData([...watchlistKey('a'), 'folders'])).toBeUndefined();
  });
});
