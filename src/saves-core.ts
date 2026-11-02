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
