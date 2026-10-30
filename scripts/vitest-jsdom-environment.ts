import { builtinEnvironments, type Environment } from 'vitest/environments';

/**
 * Globals of Node's fetch stack (undici). jsdom replaces them with its own classes, which undici
 * rejects ("Expected signal to be an instance of AbortSignal"), so fetch and MSW break.
 * Same approach as `jest-fixed-jsdom`.
 */
const NODE_FETCH_GLOBALS = [
  'fetch',
  'Request',
  'Response',
  'Headers',
  'FormData',
  'Blob',
  'File',
  'AbortController',
  'AbortSignal',
  'ReadableStream',
  'WritableStream',
  'TransformStream',
  'TextEncoder',
  'TextDecoder',
  'structuredClone',
  'BroadcastChannel',
] as const;

/** jsdom DOM with Node's fetch globals; projects point `environment` at this file. */
const jsdomWithNodeFetch: Environment = {
  ...builtinEnvironments.jsdom,
  name: 'jsdom-node-fetch',
  async setup(global, options) {
    const nodeGlobals = NODE_FETCH_GLOBALS.map((key) => [key, global[key]] as const);
    const environment = await builtinEnvironments.jsdom.setup(global, options);

    for (const [key, value] of nodeGlobals) {
      Object.defineProperty(global, key, { value, writable: true, configurable: true });
    }

    return environment;
  },
};

// biome-ignore lint/style/noDefaultExport: Vitest loads custom environments from the default export.
export default jsdomWithNodeFetch;
