import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const games = JSON.parse(readFileSync(new URL('src/games.json', root), 'utf8'));
const file = (p: string) => existsSync(new URL(`public${p}`, root));

test('catalogue has at least one game, Redentore first', () => {
  assert.ok(Array.isArray(games) && games.length > 0);
  assert.equal(games[0].id, 'redentore');
  assert.equal(games[0].playUrl, '/Redentore/');
});

test('ids are unique and valid save game_ids (see supabase/schema.sql)', () => {
  const ids = games.map((g: { id: string }) => g.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z0-9-]{1,64}$/);
});

for (const g of games) {
  test(`${g.id}: every field is filled and every image exists`, () => {
    for (const k of ['title', 'subtitle', 'short', 'long', 'icon', 'hero', 'playUrl']) {
      assert.equal(typeof g[k], 'string', k);
      assert.ok(g[k].trim(), `${k} empty`);
    }
    assert.ok(g.short.length <= 160, 'short description too long for a card');
    assert.match(g.playUrl, /^\/[^/].*\/$|^https:\/\//, 'playUrl is a same-origin path like /Gioco/');
    assert.ok(file(g.icon), `missing ${g.icon}`);
    assert.ok(file(g.hero), `missing ${g.hero}`);
    assert.ok(g.screenshots.length >= 1);
    for (const s of g.screenshots) {
      assert.ok(file(s.src), `missing ${s.src}`);
      assert.ok(s.alt?.trim(), `screenshot ${s.src} needs alt text`);
    }
    assert.ok(g.tags.length >= 1 && g.platforms.length >= 1);
    for (const n of g.news) {
      assert.match(n.date, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(!Number.isNaN(Date.parse(n.date)));
      assert.ok(n.title.trim() && n.text.trim());
    }
  });
}
