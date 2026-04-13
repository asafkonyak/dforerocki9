-- SQL Migration: Recalculate Player Statistics (Multiplayer Only)
-- This script hardens the leaderboard data by resetting win/loss records 
-- and recalculating them purely from the history of matches against human opponents.

DO $$
DECLARE
    p_rec RECORD;
    m_rec RECORD;
    v_win_count INTEGER;
    v_loss_count INTEGER;
    v_results_array TEXT[];
    v_start_index INTEGER;
    v_end_index INTEGER;
BEGIN
    -- Informational notice
    RAISE NOTICE 'Starting leaderboard stats recalculation...';

    FOR p_rec IN SELECT id, username FROM players LOOP
        v_win_count := 0;
        v_loss_count := 0;
        v_results_array := ARRAY[]::TEXT[];
        
        -- Loop through all completed matches involving this player with a human opponent
        -- player2_id IS NOT NULL ensures we exclude bot/gauntlet matches
        FOR m_rec IN 
            SELECT winner_id, player1_id, player2_id 
            FROM matches 
            WHERE status = 'done' 
              AND (player1_id = p_rec.id OR player2_id = p_rec.id)
              AND player2_id IS NOT NULL 
            ORDER BY created_at ASC
        LOOP
            IF m_rec.winner_id = p_rec.id THEN
                v_win_count := v_win_count + 1;
                v_results_array := v_results_array || 'W';
            ELSE
                v_loss_count := v_loss_count + 1;
                v_results_array := v_results_array || 'L';
            END IF;
        END LOOP;
        
        -- Cap last_results at 10
        v_end_index := array_length(v_results_array, 1);
        IF v_end_index > 10 THEN
           v_start_index := v_end_index - 9;
           v_results_array := v_results_array[v_start_index : v_end_index];
        END IF;

        -- Update the player record
        UPDATE players 
        SET win_count = v_win_count,
            loss_count = v_loss_count,
            last_results = COALESCE(array_to_string(v_results_array, ','), '')
        WHERE id = p_rec.id;
        
        RAISE NOTICE 'Updated stats for user: % (Wins: %, Losses: %)', p_rec.username, v_win_count, v_loss_count;
    END LOOP;

    RAISE NOTICE 'Recalculation complete.';
END $$;
