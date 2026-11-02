import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createNotes } from '../src/notes-core.ts';

function mockClient(loggedIn = true, result: { data?: unknown; error?: unknown } = {}, sessionError?: unknown) {
  const calls: unknown[][] = [];
  const builder: Record<string, unknown> = {};
  for (const method of ['insert', 'select', 'eq', 'order']) {
    builder[method] = (...args: unknown[]) => { calls.push([method, ...args]); return builder; };
  }
  builder.then = (ok: (v: unknown) => unknown) => Promise.resolve({ data: null, error: null, ...result }).then(ok);
  const client = {
    auth: { getSession: async () => ({ data: { session: loggedIn ? { user: { id: 'alice' } } : null }, error: sessionError }) },
    from: (table: string) => { calls.push(['from', table]); return builder; },
  };
  return { notes: createNotes(client as never), calls };
}

const note = { category: 'bug' as const, text: 'Porta bloccata', createdAt: '2026-11-02T10:00:00Z' };

test('logged out: submit and list do not query the database', async () => {
  const { notes, calls } = mockClient(false);
  assert.equal(await notes.submit('redentore', note), false);
  assert.deepEqual(await notes.list('redentore'), []);
  assert.deepEqual(calls, []);
});

test('submit inserts metadata with session ownership and no client-controlled admin fields', async () => {
  const { notes, calls } = mockClient();
  const full = { ...note, zone: 'Cripta', level: 0, hero: 'Ada', position: { x: 1, y: 2 }, gameVersion: '1.2',
    user_id: 'mallory', game_id: 'other', status: 'risolta', id: 'fake', serverCreatedAt: 'fake' };
  assert.equal(await notes.submit('redentore', full), true);
  assert.deepEqual(calls, [['from', 'notes'], ['insert', {
    user_id: 'alice', game_id: 'redentore', category: 'bug', text: note.text,
    zone: 'Cripta', level: 0, hero: 'Ada', position: { x: 1, y: 2 }, game_version: '1.2', client_created_at: note.createdAt,
  }]]);
});

test('submit keeps optional metadata nullable', async () => {
  const { notes, calls } = mockClient();
  await notes.submit('another-game', note);
  assert.deepEqual(calls[1], ['insert', {
    user_id: 'alice', game_id: 'another-game', category: 'bug', text: note.text,
    zone: null, level: null, hero: null, position: null, game_version: null, client_created_at: note.createdAt,
  }]);
});

test('list scopes to current user and game, orders by server receipt and maps timestamps', async () => {
  const row = { id: 'n1', category: 'bug', text: note.text, zone: null, level: 2, hero: 'Ada', position: { x: 1 },
    game_version: '1.2', client_created_at: note.createdAt, created_at: '2026-11-02T11:00:00Z', status: 'approvata' };
  const { notes, calls } = mockClient(true, { data: [row] });
  assert.deepEqual(await notes.list('redentore'), [{ ...note, id: 'n1', zone: null, level: 2, hero: 'Ada',
    position: { x: 1 }, gameVersion: '1.2', serverCreatedAt: row.created_at, status: 'approvata' }]);
  assert.deepEqual(calls, [['from', 'notes'],
    ['select', 'id, category, text, zone, level, hero, position, game_version, client_created_at, created_at, status'],
    ['eq', 'user_id', 'alice'], ['eq', 'game_id', 'redentore'], ['order', 'created_at', { ascending: false }]]);
});

test('list returns an empty array when there are no notes', async () => {
  assert.deepEqual(await mockClient().notes.list('redentore'), []);
});

test('database and session errors propagate', async () => {
  const error = new Error('unavailable');
  for (const { notes } of [mockClient(true, { error }), mockClient(true, {}, error)]) {
    await assert.rejects(notes.submit('redentore', note), (e) => e === error);
    await assert.rejects(notes.list('redentore'), (e) => e === error);
  }
});
