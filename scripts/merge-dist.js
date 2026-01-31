const fs = require('node:fs');
const path = require('node:path');

const rootDist = path.resolve(__dirname, '../dist');

// Clean/create root dist
if (fs.existsSync(rootDist)) {
  fs.rmSync(rootDist, { recursive: true });
}
fs.mkdirSync(rootDist, { recursive: true });

// Copy host (shell app)
copyDir(path.resolve(__dirname, '../apps/host/dist'), rootDist);

// Copy MFEs to their respective subfolders
copyDir(path.resolve(__dirname, '../apps/pages-mfe/dist'), path.join(rootDist, 'pages-mfe'));

copyDir(path.resolve(__dirname, '../apps/user-mfe/dist'), path.join(rootDist, 'user-mfe'));

console.log('✅ Merged all apps into /dist');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`⚠️  Source not found: ${src}`);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
