import type { SupabaseClient } from '@supabase/supabase-js';

export type SaveUser = { id: string; email: string };
export type SaveInfo = { slot: string; updatedAt: string };

/**
 * Cloud saves for the logged-in user, one row per (game, slot) in the `saves` table.
 * Logged out: load → null, list → [], save/remove → false, nothing is sent.
 * Network or database errors are thrown, so the game can keep its on-device save.
 */
export function createSaves(client: SupabaseClient) {
  async function user(): Promise<SaveUser | null> {
    const { data } = await client.auth.getSession();
    const u = data.session?.user;
    return u ? { id: u.id, email: u.email ?? '' } : null;
  }

  return {
    user,

    async load<T = unknown>(gameId: string, slot = 'default'): Promise<T | null> {
      const u = await user();
      if (!u) return null;
      const { data, error } = await client.from('saves').select('data')
        .eq('user_id', u.id).eq('game_id', gameId).eq('slot', slot).maybeSingle();
      if (error) throw error;
      return (data?.data as T | undefined) ?? null;
    },

    async save(gameId: string, data: unknown, slot = 'default'): Promise<boolean> {
      const u = await user();
      if (!u) return false;
      const { error } = await client.from('saves')
        .upsert({ user_id: u.id, game_id: gameId, slot, data }, { onConflict: 'user_id,game_id,slot' });
      if (error) throw error;
      return true;
    },

    // Account-bound, optimistic writes for games that must never replace a
    // divergent save. Existing load/save callers keep their original contract.
    async loadVersioned(expectedUserId: string, gameId: string, slot = 'default') {
      const u = await user();
      if (!u || u.id !== expectedUserId) throw new Error('Account changed');
      const { data, error } = await client.from('saves').select('data, updated_at')
        .eq('user_id', u.id).eq('game_id', gameId).eq('slot', slot).maybeSingle();
      if (error) throw error;
      return data ? { data: data.data, version: data.updated_at as string } : null;
    },

    async saveVersioned(expectedUserId: string, gameId: string, data: unknown, expectedVersion: string | null, slot = 'default') {
      const u = await user();
      if (!u || u.id !== expectedUserId) return { status: 'account-changed' as const };
      const query = expectedVersion === null
        ? client.from('saves').insert({ user_id: u.id, game_id: gameId, slot, data })
        : client.from('saves').update({ data }).eq('user_id', u.id).eq('game_id', gameId).eq('slot', slot).eq('updated_at', expectedVersion);
      const { data: row, error } = await query.select('updated_at').maybeSingle();
      if (error?.code === '23505') return { status: 'conflict' as const };
      if (error) throw error;
      return row ? { status: 'saved' as const, version: row.updated_at as string } : { status: 'conflict' as const };
    },

    async list(gameId: string): Promise<SaveInfo[]> {
      const u = await user();
      if (!u) return [];
      const { data, error } = await client.from('saves').select('slot, updated_at')
        .eq('user_id', u.id).eq('game_id', gameId).order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: { slot: string; updated_at: string }) => ({ slot: r.slot, updatedAt: r.updated_at }));
    },

    async remove(gameId: string, slot = 'default'): Promise<boolean> {
      const u = await user();
      if (!u) return false;
      const { error } = await client.from('saves').delete()
        .eq('user_id', u.id).eq('game_id', gameId).eq('slot', slot);
      if (error) throw error;
      return true;
    },

    /** Called now and on every login / logout; returns an unsubscribe function. */
    onUserChange(cb: (u: SaveUser | null) => void): () => void {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        const u = session?.user;
        cb(u ? { id: u.id, email: u.email ?? '' } : null);
      });
      return () => data.subscription.unsubscribe();
    },
  };
}
