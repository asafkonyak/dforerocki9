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
