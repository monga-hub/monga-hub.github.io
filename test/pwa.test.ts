import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

// Runs on the build output: `npm run check` builds first.
const dist = new URL('../dist/', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, dist), 'utf8');

test('build emits the web app manifest, scoped to the whole site (hub and every game under it)', () => {
  assert.ok(existsSync(new URL('manifest.webmanifest', dist)), 'dist/manifest.webmanifest missing: run npm run build');
  const m = JSON.parse(read('manifest.webmanifest'));
  assert.equal(m.scope, '/');
  assert.equal(m.start_url, '/');
  assert.equal(m.display, 'standalone');
  assert.equal(m.name, 'Mongames');
  const sizes = m.icons.map((i: { sizes: string }) => i.sizes);
  assert.ok(sizes.includes('192x192') && sizes.includes('512x512'));
  assert.ok(m.icons.some((i: { purpose?: string }) => i.purpose === 'maskable'));
  for (const i of m.icons) assert.ok(existsSync(new URL(i.src.slice(1), dist)), `missing ${i.src}`);
  assert.ok(existsSync(new URL('apple-touch-icon.png', dist)));
});

test('build emits the service worker at the site root, and it caches nothing', () => {
  assert.ok(existsSync(new URL('sw.js', dist)), 'dist/sw.js missing');
  const sw = read('sw.js');
  assert.match(sw, /addEventListener\('fetch'/);
  assert.doesNotMatch(sw, /caches\./, 'a cache would serve stale game builds');
  for (const page of ['index', 'gioco', 'accedi', 'nuova-password']) {
    const html = read(`${page}.html`);
    assert.match(html, /<link rel="manifest" href="\/manifest.webmanifest"/, page);
    assert.match(html, /<meta name="apple-mobile-web-app-capable" content="yes"/, page);
    assert.match(html, /<link rel="apple-touch-icon" href="\/apple-touch-icon.png"/, page);
  }
  assert.match(readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8'), /serviceWorker\?\.register\('\/sw.js'\)/);
});
