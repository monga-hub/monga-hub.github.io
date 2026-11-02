-- Mongames: player notes for every game.
-- Paste into Supabase > SQL Editor > New query > Run. Safe to run again.
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  game_id text not null check (game_id ~ '^[a-z0-9-]{1,64}$'),
  category text not null check (category in ('bug', 'nome', 'grafica', 'altro')),
  text text not null check (char_length(text) between 1 and 5000 and char_length(btrim(text)) > 0),
  zone text check (char_length(zone) <= 200),
  level integer check (level >= 0),
  hero text check (char_length(hero) <= 200),
  position jsonb check (jsonb_typeof(position) = 'object'),
  game_version text check (char_length(game_version) <= 100),
  client_created_at timestamptz not null,
  created_at timestamptz not null default now(),
  status text not null default 'nuova' check (status in ('nuova', 'approvata', 'risolta', 'scartata'))
);

alter table public.notes enable row level security;

drop policy if exists "notes: read own" on public.notes;
drop policy if exists "notes: insert own" on public.notes;
create policy "notes: read own" on public.notes for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "notes: insert own" on public.notes for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- Only the dashboard/admin can assign ids, server timestamps or review status.
revoke all on public.notes from public, anon, authenticated;
grant select on public.notes to authenticated;
grant insert (user_id, game_id, category, text, zone, level, hero, position, game_version, client_created_at)
  on public.notes to authenticated;
