-- session_snapshots: records a profit snapshot for each player each time the host closes a session.
-- This is separate from game_profit_history (which only records final End Game settlements).
-- One game can have many snapshots (multiple closes/reopens = multiple sessions).
create table public.session_snapshots (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  cash_in numeric not null default 0,
  cash_out numeric not null default 0,
  session_net numeric not null default 0,   -- cash_out - cash_in at close time
  snapshotted_at timestamptz not null default now()
);  

create index idx_session_snapshots_user on public.session_snapshots (user_id, snapshotted_at);
create index idx_session_snapshots_game on public.session_snapshots (game_id, snapshotted_at);

-- RLS: players can read snapshots for games they participate in; host can insert
alter table public.session_snapshots enable row level security;

create policy "Participants can view session snapshots"
  on public.session_snapshots for select
  using (
    auth.uid() in (
      select user_id from public.game_players where game_id = session_snapshots.game_id
    ) or
    auth.uid() in (
      select host_id from public.games where id = session_snapshots.game_id
    )
  );

create policy "Host can insert session snapshots"
  on public.session_snapshots for insert
  with check (
    auth.uid() in (
      select host_id from public.games where id = session_snapshots.game_id
    )
  );
