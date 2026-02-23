-- Allow a denied player to request to rejoin by setting their own status back to 'pending'
-- Uses a check on the existing row value (WITH CHECK only controls what can be written,
-- but USING controls which rows are visible/eligible for update)
-- We need: USING (user is the denied player) WITH CHECK (they can only set it to 'pending')

create policy "Denied players can request to rejoin (set status to pending)"
  on public.game_players for update
  using (auth.uid() = user_id and status = 'denied')
  with check (status = 'pending');
