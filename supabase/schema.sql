-- Mongames: saves for every game, one row per (user, game, slot).
-- Paste once into Supabase > SQL Editor > New query > Run. Safe to run again.

create table if not exists public.saves (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  game_id    text        not null check (game_id ~ '^[a-z0-9-]{1,64}$'),
  slot       text        not null default 'default' check (char_length(slot) between 1 and 64),
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id, slot)
);

-- updated_at follows every write, whatever the client sends.
create or replace function public.saves_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists saves_touch on public.saves;
create trigger saves_touch before insert or update on public.saves
  for each row execute function public.saves_touch();

-- Row Level Security: a signed-in user reads and writes only their own rows; anonymous gets nothing.
alter table public.saves enable row level security;

drop policy if exists "saves: read own" on public.saves;
drop policy if exists "saves: insert own" on public.saves;
drop policy if exists "saves: update own" on public.saves;
drop policy if exists "saves: delete own" on public.saves;

create policy "saves: read own" on public.saves for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "saves: insert own" on public.saves for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "saves: update own" on public.saves for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "saves: delete own" on public.saves for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.saves from anon;
grant select, insert, update, delete on public.saves to authenticated;
