import type { SupabaseClient } from '@supabase/supabase-js';

export type Note = {
  category: 'bug' | 'nome' | 'grafica' | 'altro';
  text: string;
  zone?: string | null;
  level?: number | null;
  hero?: string | null;
  position?: Record<string, unknown> | null;
  gameVersion?: string | null;
  createdAt: string;
};
export type NoteInfo = Note & {
  id: string;
  serverCreatedAt: string;
  status: 'nuova' | 'approvata' | 'risolta' | 'scartata';
};

/** Logged out: no database requests. Errors propagate so games can retain local notes. */
export function createNotes(client: SupabaseClient) {
  async function userId() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session?.user.id;
  }

  return {
    async submit(gameId: string, note: Note): Promise<boolean> {
      const id = await userId();
      if (!id) return false;
      const { error } = await client.from('notes').insert({
        user_id: id, game_id: gameId, category: note.category, text: note.text,
        zone: note.zone ?? null, level: note.level ?? null, hero: note.hero ?? null,
        position: note.position ?? null, game_version: note.gameVersion ?? null,
        client_created_at: note.createdAt,
      });
      if (error) throw error;
      return true;
    },

    async list(gameId: string): Promise<NoteInfo[]> {
      const id = await userId();
      if (!id) return [];
      const { data, error } = await client.from('notes')
        .select('id, category, text, zone, level, hero, position, game_version, client_created_at, created_at, status')
        .eq('user_id', id).eq('game_id', gameId).order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id, category: r.category, text: r.text, zone: r.zone, level: r.level,
        hero: r.hero, position: r.position, gameVersion: r.game_version,
        createdAt: r.client_created_at, serverCreatedAt: r.created_at, status: r.status,
      }));
    },
  };
}
