-- Add 'closed' status to game_status enum
-- 'closed' = session paused by host (no edits allowed, but can be reopened)
-- 'ended'   = game permanently finalized with profit calculations
alter type game_status add value if not exists 'closed';
