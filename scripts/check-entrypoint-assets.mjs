// SEYVEO static entrypoint dependency check.
// Run: node scripts/check-entrypoint-assets.mjs
// Purely diagnostic; it does not delete or rewrite anything.
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(resolve(root, 'index.html'), 'utf8');
const resourceTags = [...source.matchAll(/<(script|link)\b[^>]*>/gi)];
const referenced = [];
for (const match of resourceTags) {
  const tag = match[0];
  const attr = tag.match(/\b(?:src|href)\s*=\s*["']([^"']+)["']/i);
  if (!attr) continue;
  const url = attr[1];
  if (/^(?:https?:|\/\/|data:|#)/i.test(url)) continue;
  const path = decodeURIComponent(url.split(/[?#]/, 1)[0]);
  if (!path || path.startsWith('/')) continue;
  referenced.push({ path, tag: match[1].toLowerCase() });
}
const missing = [...new Set(referenced.map(x => x.path))].filter(p => !existsSync(resolve(root, p)));
const repeated = [];
const counts = new Map();
for (const item of referenced) {
  const key = item.tag + ':' + item.path;
  counts.set(key, (counts.get(key) ?? 0) + 1);
}
for (const [key, n] of counts) if (n > 1) repeated.push({ key, count: n });
console.log('SEYVEO entrypoint dependencies: ' + referenced.length + ' references');
if (missing.length) console.error('Missing local assets:\n' + missing.join('\n'));
if (repeated.length) console.error('Repeated script/link assets:\n' + repeated.map(x => x.key + ' ×' + x.count).join('\n'));
if (missing.length || repeated.length) process.exitCode = 1;
else console.log('PASS: all referenced local assets exist; no repeated script/link references.');
