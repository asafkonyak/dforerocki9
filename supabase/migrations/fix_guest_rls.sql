-- Fix RLS for Guest/Anon users in Matchmaking and Player profiles
-- This script is idempotent and can be run multiple times.

-- 1. CLEANUP: Drop all potential existing policies to avoid name conflicts
DROP POLICY IF EXISTS "Enable insert for all users" ON public.players;
DROP POLICY IF EXISTS "Enable update for owners and guests" ON public.players;
DROP POLICY IF EXISTS "Users can update own player record" ON public.players;
DROP POLICY IF EXISTS "Users can insert own player record" ON public.players;
DROP POLICY IF EXISTS "Players are viewable by everyone" ON public.players;

DROP POLICY IF EXISTS "Enable insert for all users in matches" ON public.matches;
DROP POLICY IF EXISTS "Enable update for all users in matches" ON public.matches;
DROP POLICY IF EXISTS "Authenticated users can create matches" ON public.matches;
DROP POLICY IF EXISTS "Authenticated users can update matches" ON public.matches;
DROP POLICY IF EXISTS "Matches are viewable by everyone" ON public.matches;


-- 2. PLAYERS TABLE POLICIES
-- Allow anyone to insert (Guests during onboarding / Registered users)
CREATE POLICY "Enable insert for all users" ON public.players 
FOR INSERT WITH CHECK (true);

-- Allow updates if you are the owner (user_id matches) OR if it's a guest record (user_id is NULL)
-- This allows guests to update their own record via the app logic.
CREATE POLICY "Enable update for owners and guests" ON public.players 
FOR UPDATE USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR (user_id IS NULL)
);

-- Ensure profiles are viewable by everyone
CREATE POLICY "Players are viewable by everyone" ON public.players
FOR SELECT USING (true);


-- 3. MATCHES TABLE POLICIES
-- Allow anyone to insert matches (Player 1 searching/creating)
CREATE POLICY "Enable insert for all users in matches" ON public.matches 
FOR INSERT WITH CHECK (true);

-- Allow anyone to update matches (Player 2 joining, status updates to matched/active/done)
CREATE POLICY "Enable update for all users in matches" ON public.matches 
FOR UPDATE USING (true);

-- Ensure matches are viewable by everyone (for realtime sync and leaderboard)
CREATE POLICY "Matches are viewable by everyone" ON public.matches 
FOR SELECT USING (true);
