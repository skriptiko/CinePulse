import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const hostRoot = resolve(__dirname, '..');
const typesDir = resolve(hostRoot, 'src/@types/remotes');

const remotes = [
  {
    name: 'pagesMfe',
    typesSource: resolve(hostRoot, '../pages-mfe/dist/types'),
  },
  {
    name: 'userMfe',
    typesSource: resolve(hostRoot, '../user-mfe/dist/types'),
  },
];

if (!existsSync(typesDir)) {
  mkdirSync(typesDir, { recursive: true });
}

for (const remote of remotes) {
  if (existsSync(remote.typesSource)) {
    const targetDir = resolve(typesDir, remote.name);
    cpSync(remote.typesSource, targetDir, { recursive: true });
    console.log(`Synced types for ${remote.name}`);
  } else {
    console.log(`Types not found for ${remote.name}, skipping...`);
  }
}

console.log('Type sync complete!');
