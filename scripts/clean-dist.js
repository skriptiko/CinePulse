// Empties the build folders of `pnpm build:deploy`. A Turbo cache hit restores files over
// `apps/*/dist` without clearing it, so chunks of another build would stay and reach root `dist/`.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const appsDir = path.join(root, 'apps');

// Outside `build:deploy`, so its own build stays.
const EXCLUDED_APP = 'design';

const appDists = fs
  .readdirSync(appsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== EXCLUDED_APP)
  .map((entry) => path.join(appsDir, entry.name, 'dist'));

for (const dist of [...appDists, path.join(root, 'dist')]) {
  fs.rmSync(dist, { recursive: true, force: true });
}

console.log('✅ Emptied the build folders');
