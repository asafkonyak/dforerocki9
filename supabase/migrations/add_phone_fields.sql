-- SQL Migration: Add phone contact fields to players table
-- Run this in your Supabase SQL Editor

DO $$ 
BEGIN
    -- 1. Add phone_prefix column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'phone_prefix') THEN
        ALTER TABLE players ADD COLUMN phone_prefix TEXT DEFAULT '+49';
        COMMENT ON COLUMN players.phone_prefix IS 'Country prefix for player phone number';
    END IF;

    -- 2. Add phone_number column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'phone_number') THEN
        ALTER TABLE players ADD COLUMN phone_number TEXT;
        COMMENT ON COLUMN players.phone_number IS 'Player contact phone number';
    END IF;
END $$;
