create table if not exists public.game_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_act integer not null default 1 check (current_act >= 1),
  current_chapter integer not null default 1 check (current_chapter >= 1),
  current_scene text not null default 'cena1',
  dialogue_index integer not null default 0 check (dialogue_index >= 0),
  completed_acts integer[] not null default '{}',
  unlocked_acts integer[] not null default '{1}',
  is_finished boolean not null default false,
  save_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists game_saves_current_act_idx
on public.game_saves (current_act);

alter table public.game_saves enable row level security;

create policy "Saves podem ser lidos pelo proprio usuario"
on public.game_saves
for select
to authenticated
using (auth.uid() = user_id);

create policy "Saves podem ser criados pelo proprio usuario"
on public.game_saves
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Saves podem ser atualizados pelo proprio usuario"
on public.game_saves
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.set_game_saves_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = coalesce(new.updated_at, now());
  return new;
end;
$$;

drop trigger if exists set_game_saves_updated_at on public.game_saves;

create trigger set_game_saves_updated_at
before update on public.game_saves
for each row execute function public.set_game_saves_updated_at();
