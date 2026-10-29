// Fails when a .tsx file under apps/*/src or packages/*/src spreads props in JSX (`{...x}`).
// Standards §5.2 forbid it and Biome has no rule for it yet. Object spread (`{ ...x }`)
// is formatted with a space by Biome, so it does not match.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const JSX_SPREAD = /\{\.\.\./;

function listTsxFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listTsxFiles(fullPath);
    return entry.name.endsWith('.tsx') ? [fullPath] : [];
  });
}

const sourceDirs = ['apps', 'packages'].flatMap((group) =>
  fs
    .readdirSync(path.join(root, group))
    .map((name) => path.join(root, group, name, 'src'))
    .filter((dir) => fs.existsSync(dir))
);

const violations = sourceDirs.flatMap(listTsxFiles).flatMap((file) =>
  fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .flatMap((line, index) =>
      JSX_SPREAD.test(line) ? [`${path.relative(root, file)}:${index + 1}: ${line.trim()}`] : []
    )
);

if (violations.length > 0) {
  console.error('JSX prop spreading is not allowed (standards §5.2):');
  for (const violation of violations) console.error(`  ${violation}`);
  process.exit(1);
}
