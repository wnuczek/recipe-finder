#!/usr/bin/env node
// Cloudflare Pages refuses to upload any path containing "node_modules",
// but `expo export --platform web` emits vendor assets (icon fonts, nav
// icons) under dist/assets/node_modules/. Rename that directory and rewrite
// every reference in the exported output so the assets actually deploy.
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const FROM_DIR = path.join(DIST, 'assets', 'node_modules');
const TO_DIR = path.join(DIST, 'assets', 'vendor-modules');
const FROM_REF = 'assets/node_modules/';
const TO_REF = 'assets/vendor-modules/';
const REWRITE_EXTENSIONS = new Set(['.js', '.html', '.css', '.json', '.map']);

if (!fs.existsSync(FROM_DIR)) {
  console.log('fix-cloudflare-pages-assets: nothing to do (no dist/assets/node_modules)');
  process.exit(0);
}

fs.renameSync(FROM_DIR, TO_DIR);

let rewritten = 0;
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (REWRITE_EXTENSIONS.has(path.extname(entry.name))) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes(FROM_REF)) {
        fs.writeFileSync(full, content.split(FROM_REF).join(TO_REF));
        rewritten += 1;
      }
    }
  }
};
walk(DIST);

console.log(
  `fix-cloudflare-pages-assets: renamed assets/node_modules -> assets/vendor-modules, rewrote ${rewritten} file(s)`
);
