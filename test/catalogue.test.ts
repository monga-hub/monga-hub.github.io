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

const LANGS = ['en', 'it'];
/** A localized value: `{ en, it }`, every language filled. */
function localized(v: Record<string, unknown>, what: string) {
  assert.deepEqual(Object.keys(v ?? {}).sort(), [...LANGS].sort(), `${what}: needs exactly ${LANGS.join(', ')}`);
  for (const l of LANGS) {
    const x = v[l];
    if (Array.isArray(x)) assert.ok(x.length && x.every((s) => typeof s === 'string' && s.trim()), `${what}.${l} empty`);
    else assert.ok(typeof x === 'string' && x.trim(), `${what}.${l} empty`);
  }
}

for (const g of games) {
  test(`${g.id}: every field is filled in English and Italian, every image exists`, () => {
    for (const k of ['title', 'icon', 'hero', 'playUrl']) {
      assert.equal(typeof g[k], 'string', k);
      assert.ok(g[k].trim(), `${k} empty`);
    }
    for (const k of ['subtitle', 'short', 'long', 'tags', 'platforms']) localized(g[k], k);
    for (const l of LANGS) assert.ok(g.short[l].length <= 160, `short.${l} too long for a card`);
    assert.match(g.playUrl, /^\/[^/].*\/$|^https:\/\//, 'playUrl is a same-origin path like /Gioco/');
    assert.ok(file(g.icon), `missing ${g.icon}`);
    assert.ok(file(g.hero), `missing ${g.hero}`);
    assert.ok(g.screenshots.length >= 1);
    for (const s of g.screenshots) {
      assert.ok(file(s.src), `missing ${s.src}`);
      localized(s.alt, `alt of ${s.src}`);
    }
    for (const n of g.news) {
      assert.match(n.date, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(!Number.isNaN(Date.parse(n.date)));
      localized(n.title, `news ${n.date} title`);
      localized(n.text, `news ${n.date} text`);
    }
  });
}
