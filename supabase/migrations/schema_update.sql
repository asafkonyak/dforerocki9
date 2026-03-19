-- SQL Migration: Unified Players Table (V2)
-- Run this in your Supabase SQL Editor

-- 1. Add user_id column to players table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'user_id') THEN
        ALTER TABLE players ADD COLUMN user_id UUID REFERENCES auth.users(id);
        COMMENT ON COLUMN players.user_id IS 'Link to Supabase Auth User';
    END IF;
END $$;

-- 2. Add unique constraint to ensure one player per user
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'players' AND constraint_name = 'players_user_id_key') THEN
        ALTER TABLE players ADD CONSTRAINT players_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 3. Remove profiles table as requested
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 4. Enable Row Level Security (RLS) on players
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- 5. Create/Update basic policies for players
DO $$ 
BEGIN
    -- Anyone can read players (for leaderboard etc)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'players' AND policyname = 'Public players are viewable by everyone') THEN
        CREATE POLICY "Public players are viewable by everyone" ON public.players FOR SELECT USING (true);
    END IF;
    
    -- Users can only update their own player record
    -- We use a fresh policy name to avoid conflicts
    DROP POLICY IF EXISTS "Users can update own player record" ON public.players;
    CREATE POLICY "Users can update own player record" ON public.players FOR UPDATE USING (auth.uid() = user_id);

    -- Users can insert their own player record
    DROP POLICY IF EXISTS "Users can insert own player record" ON public.players;
    CREATE POLICY "Users can insert own player record" ON public.players FOR INSERT WITH CHECK (auth.uid() = user_id);
END $$;

-- 6. Update matches table for new Matchmaking Logic
DO $$
BEGIN
    -- Add reference_match_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'reference_match_id') THEN
        ALTER TABLE public.matches ADD COLUMN reference_match_id UUID REFERENCES public.matches(id);
        COMMENT ON COLUMN public.matches.reference_match_id IS 'Points to a previous match for Rematch logic';
    END IF;
END $$;

-- 7. Ensure status column can accept our values ('pending', 'in_progress', 'finished', 'canceled')
-- Assuming it's already a text column. We just remove any restrictive constraints if they existed, or ensure it's text.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'matches' AND column_name = 'status' AND data_type != 'text') THEN
       -- If it's an ENUM, altering it can be tricky without knowing its name. Assuming it's text based on JS insert patterns.
       RAISE NOTICE 'Please ensure matches.status is a TEXT column to accept pending, in_progress, finished, canceled.';
    END IF;
END $$;

-- 8. Drop the obsolete matchmaking_queue table as we now use pure DB matching
DROP TABLE IF EXISTS public.matchmaking_queue CASCADE;

-- 9. Enable RLS on matches and add policies for matchmaking
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Anyone can read matches (needed for matchmaking search)
    DROP POLICY IF EXISTS "Matches are viewable by everyone" ON public.matches;
    CREATE POLICY "Matches are viewable by everyone" ON public.matches FOR SELECT USING (true);

    -- Any authenticated user can create a match (Player 1 creates pending)
    DROP POLICY IF EXISTS "Authenticated users can create matches" ON public.matches;
    CREATE POLICY "Authenticated users can create matches" ON public.matches FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    -- Any authenticated user can update a match (Player 2 joins, status changes)
    DROP POLICY IF EXISTS "Authenticated users can update matches" ON public.matches;
    CREATE POLICY "Authenticated users can update matches" ON public.matches FOR UPDATE USING (auth.role() = 'authenticated');
END $$;

-- 10. Enable Supabase Realtime on the matches table (REQUIRED for postgres_changes subscriptions)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'matches already in supabase_realtime publication';
END $$;
