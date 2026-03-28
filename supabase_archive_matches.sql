-- ==========================================================
-- Supabase Match Archival Strategy
-- Run this SQL in your Supabase SQL Editor.
-- No pg_cron required — call the function manually or
-- via a scheduled Supabase Edge Function / external cron.
-- ==========================================================

-- 1. Create the archive table with same schema
CREATE TABLE IF NOT EXISTS matches_archive (LIKE matches INCLUDING ALL);

-- 2. Function to archive old matches
CREATE OR REPLACE FUNCTION archive_old_matches()
RETURNS void AS $$
BEGIN
  -- Move completed/expired matches older than 1 hour to archive
  INSERT INTO matches_archive
  SELECT * FROM matches
  WHERE created_at < NOW() - INTERVAL '1 hour'
    AND status IN ('matched', 'done', 'no found', 'abended');

  -- Delete the archived rows from the active table
  DELETE FROM matches
  WHERE created_at < NOW() - INTERVAL '1 hour'
    AND status IN ('matched', 'done', 'no found', 'abended');

  -- Also clean up stale pending matches (no one joined in 10 minutes)
  DELETE FROM matches
  WHERE created_at < NOW() - INTERVAL '10 minutes'
    AND status = 'pending'
    AND player2_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- To run the cleanup manually:
-- SELECT archive_old_matches();
--
-- To automate, either:
--   A) Enable pg_cron in Supabase (Database > Extensions) and run:
--      SELECT cron.schedule('archive-old-matches', '0 * * * *', 'SELECT archive_old_matches()');
--   B) Set up a Supabase Edge Function or external cron job that calls:
--      POST https://<project>.supabase.co/rest/v1/rpc/archive_old_matches
