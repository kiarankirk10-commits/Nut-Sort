// Rewrite app/service-worker.js PRECACHE (every shipped file) and VERSION (content hash).
//   node tools/stamp-sw.js          (run before every deploy)
//   node tools/stamp-sw.js --dev    (back to the network-first dev mode)
// The cache name changes whenever any file changes, so phones pick up the new version on the
// next launch, while the old cache keeps working offline until then.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../app/', import.meta.url));
const swPath = path.join(root, 'service-worker.js');
const skip = (p) => p === 'service-worker.js' || p.startsWith('dev') || p.endsWith('.DS_Store') || p.endsWith('OFL.txt') || p === 'icons/icon.svg';

function walk(dir, base = '') {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walk(path.join(dir, e.name), rel));
    else if (!skip(rel)) out.push(rel);
  }
  return out;
}

const dev = process.argv.includes('--dev');
const files = walk(root).sort();
const hash = crypto.createHash('sha256');
for (const f of files) hash.update(f).update(fs.readFileSync(path.join(root, f)));
const cfg = fs.readFileSync(path.join(root, 'js/config.js'), 'utf8');
const appVersion = (cfg.match(/APP_VERSION = '([^']+)'/) || [])[1] || '0';
const version = dev ? 'dev' : `${appVersion}-${hash.digest('hex').slice(0, 10)}`;
let sw = fs.readFileSync(swPath, 'utf8');
sw = sw.replace(/const VERSION = '[^']*';/, `const VERSION = '${version}';`);
sw = sw.replace(/const PRECACHE = \[[\s\S]*?\];/, `const PRECACHE = [\n  './',\n${files.map((f) => `  '${f}',`).join('\n')}\n];`);
fs.writeFileSync(swPath, sw);
const bytes = files.reduce((a, f) => a + fs.statSync(path.join(root, f)).size, 0);
console.log(`service worker: VERSION ${version}, ${files.length} files precached (${(bytes / 1024).toFixed(0)} KB)`);
