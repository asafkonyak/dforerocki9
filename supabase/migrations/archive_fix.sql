-- SQL Fix: Enable RLS and Policies for Archive Table
-- Paste this into your Supabase SQL Editor and click RUN

-- 1. Enable Row Level Security on matches_archive
ALTER TABLE public.matches_archive ENABLE ROW LEVEL SECURITY;

-- 2. Allow authenticated users to move records into the archive
DROP POLICY IF EXISTS "Authenticated users can insert into matches_archive" ON public.matches_archive;
CREATE POLICY "Authenticated users can insert into matches_archive" ON public.matches_archive 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Allow everyone to view the archive (useful for match history)
DROP POLICY IF EXISTS "Matches archive are viewable by everyone" ON public.matches_archive;
CREATE POLICY "Matches archive are viewable by everyone" ON public.matches_archive 
FOR SELECT USING (true);

-- 4. Allow authenticated users to delete (required if a move fails)
DROP POLICY IF EXISTS "Authenticated users can delete from matches_archive" ON public.matches_archive;
CREATE POLICY "Authenticated users can delete from matches_archive" ON public.matches_archive 
FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Enable Realtime on the archive table (optional but recommended)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.matches_archive;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'matches_archive already in supabase_realtime publication';
END $$;
