-- Fix host transfer issue caused by RLS on the games table.
--
-- The original "Host full access to own games" ALL policy uses its USING clause
-- as both the row-visibility check AND the WITH CHECK constraint on UPDATEs.
-- That means when transferHost() sets host_id = <new user>, the UPDATE is
-- rejected because the NEW row no longer satisfies auth.uid() = host_id.
--
-- Fix: drop the ALL policy and replace with four targeted policies.
-- The UPDATE policy uses USING (current host) but WITH CHECK (true) so the
-- host_id column can be changed freely once we've verified the caller is host.

drop policy if exists "Host full access to own games" on public.games;

create policy "Host can select own games"
  on public.games for select
  using (auth.uid() = host_id);

create policy "Host can insert games"
  on public.games for insert
  with check (auth.uid() = host_id);

create policy "Host can delete own games"
  on public.games for delete
  using (auth.uid() = host_id);

-- USING restricts WHICH rows the caller can update (must currently be host).
-- WITH CHECK (true) allows the NEW row to have any host_id value (e.g. the transferred host).
create policy "Host can update own games"
  on public.games for update
  using (auth.uid() = host_id)
  with check (true);
