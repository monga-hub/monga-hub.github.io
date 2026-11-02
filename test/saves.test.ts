import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSaves } from '../src/saves-core.ts';

// Minimal stand-in for a supabase client: records every query-builder call, resolves to `result`.
function mockClient(session: { user: { id: string; email?: string } } | null, result: { data?: unknown; error?: unknown } = {}) {
  const calls: unknown[][] = [];
  let listener: ((e: string, s: unknown) => void) | null = null;
  let unsubscribed = false;
  const builder: Record<string, unknown> = {};
  for (const m of ['select', 'upsert', 'delete', 'eq', 'order', 'maybeSingle']) {
    builder[m] = (...args: unknown[]) => { calls.push([m, ...args]); return builder; };
  }
  builder.then = (ok: (v: unknown) => unknown) => Promise.resolve({ data: null, error: null, ...result }).then(ok);
  const client = {
    auth: {
      getSession: async () => ({ data: { session } }),
      onAuthStateChange: (cb: typeof listener) => {
        listener = cb;
        return { data: { subscription: { unsubscribe: () => { unsubscribed = true; } } } };
      },
    },
    from: (table: string) => { calls.push(['from', table]); return builder; },
  };
  return { saves: createSaves(client as never), calls, fire: (s: unknown) => listener!('SIGNED_IN', s), unsubscribed: () => unsubscribed };
}

const alice = { user: { id: 'u-alice', email: 'alice@example.com' } };

test('logged out: nothing is read or written', async () => {
  const { saves, calls } = mockClient(null);
  assert.equal(await saves.user(), null);
  assert.equal(await saves.load('redentore'), null);
  assert.deepEqual(await saves.list('redentore'), []);
  assert.equal(await saves.save('redentore', { hp: 1 }), false);
  assert.equal(await saves.remove('redentore'), false);
  assert.deepEqual(calls, []);
});

test('save upserts the row of this user, game and slot', async () => {
  const { saves, calls } = mockClient(alice);
  assert.equal(await saves.save('redentore', { level: 3 }), true);
  assert.deepEqual(calls, [
    ['from', 'saves'],
    ['upsert', { user_id: 'u-alice', game_id: 'redentore', slot: 'default', data: { level: 3 } }, { onConflict: 'user_id,game_id,slot' }],
  ]);
  await saves.save('redentore', { level: 4 }, 'hero-2');
  assert.equal((calls[3][1] as { slot: string }).slot, 'hero-2');
});

test('load filters by user, game and slot and returns the data', async () => {
  const { saves, calls } = mockClient(alice, { data: { data: { level: 7 } } });
  assert.deepEqual(await saves.load('redentore', 'a'), { level: 7 });
  assert.deepEqual(calls, [
    ['from', 'saves'], ['select', 'data'],
    ['eq', 'user_id', 'u-alice'], ['eq', 'game_id', 'redentore'], ['eq', 'slot', 'a'], ['maybeSingle'],
  ]);
});

test('load returns null when there is no row', async () => {
  const { saves } = mockClient(alice, { data: null });
  assert.equal(await saves.load('redentore'), null);
});

test('list returns slots newest first with camelCase dates', async () => {
  const { saves, calls } = mockClient(alice, { data: [{ slot: 'b', updated_at: '2026-11-02T10:00:00Z' }, { slot: 'a', updated_at: '2026-11-01T10:00:00Z' }] });
  assert.deepEqual(await saves.list('redentore'), [
    { slot: 'b', updatedAt: '2026-11-02T10:00:00Z' },
    { slot: 'a', updatedAt: '2026-11-01T10:00:00Z' },
  ]);
  assert.deepEqual(calls.at(-1), ['order', 'updated_at', { ascending: false }]);
});

test('remove deletes only the row of this user, game and slot', async () => {
  const { saves, calls } = mockClient(alice);
  assert.equal(await saves.remove('redentore', 'a'), true);
  assert.deepEqual(calls, [['from', 'saves'], ['delete'], ['eq', 'user_id', 'u-alice'], ['eq', 'game_id', 'redentore'], ['eq', 'slot', 'a']]);
});

test('database errors are thrown so the game can keep its local save', async () => {
  const err = { message: 'relation "saves" does not exist', code: '42P01' };
  const { saves } = mockClient(alice, { error: err });
  await assert.rejects(saves.load('redentore'), (e) => e === err);
  await assert.rejects(saves.save('redentore', {}), (e) => e === err);
  await assert.rejects(saves.list('redentore'), (e) => e === err);
  await assert.rejects(saves.remove('redentore'), (e) => e === err);
});

test('onUserChange reports login and logout, and unsubscribes', async () => {
  const m = mockClient(null);
  const seen: unknown[] = [];
  const off = m.saves.onUserChange((u) => seen.push(u));
  m.fire(alice);
  m.fire(null);
  assert.deepEqual(seen, [{ id: 'u-alice', email: 'alice@example.com' }, null]);
  off();
  assert.equal(m.unsubscribed(), true);
});
