import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Third-party singletons: one instance per page, and a version mismatch fails loudly. */
const STRICT_SINGLETONS = [
  'react',
  'react-dom',
  'react-router-dom',
  '@tanstack/react-query',
  'react-error-boundary',
  'zustand',
];

/** Workspace packages: always the same source, so singleton is enough. */
const WORKSPACE_SINGLETONS = ['@repo/events', '@repo/routes', '@repo/api', '@repo/firebase'];

interface SharedConfig {
  singleton: true;
  requiredVersion?: string;
  strictVersion?: true;
}

/**
 * Module Federation `shared` map for host and remotes; every app must use the same one.
 * `requiredVersion` comes from the pnpm catalog, the single source of shared versions.
 * `without` lists packages the app does not depend on: the plugin must resolve every entry.
 */
export function createMfShared({
  without = [],
}: {
  without?: string[];
} = {}): Record<string, SharedConfig> {
  const catalog = readCatalog();

  const strict = STRICT_SINGLETONS.map((name) => {
    const requiredVersion = catalog[name];
    if (!requiredVersion) {
      throw new Error(
        `"${name}" is shared via Module Federation but missing from the pnpm catalog.`
      );
    }
    return [name, { singleton: true, requiredVersion, strictVersion: true }] as const;
  });
  const workspace = WORKSPACE_SINGLETONS.filter((name) => !without.includes(name)).map(
    (name) => [name, { singleton: true }] as const
  );

  return Object.fromEntries([...strict, ...workspace]);
}

/** Reads the flat `catalog:` block of pnpm-workspace.yaml (`name: range` per line). */
function readCatalog(): Record<string, string> {
  const yaml = readFileSync(resolve(__dirname, '../pnpm-workspace.yaml'), 'utf8');
  const block = yaml.split(/^catalog:\n/m)[1]?.split(/^\S/m)[0] ?? '';
  const entries = [...block.matchAll(/^\s+"?([^":\s]+)"?:\s*(\S+)/gm)];

  return Object.fromEntries(entries.map(([, name, range]) => [name, range]));
}
