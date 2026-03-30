import { supabase } from './supabase';

/**
 * Moves a match from the active 'matches' table to the 'matches_archive' table.
 */
export async function moveMatchToArchive(matchId: string) {
  console.log(`[Archive] Moving match ${matchId} to archive...`);
  
  try {
    // 1. Fetch the complete match record
    const { data: match, error: fetchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (fetchError || !match) {
      console.warn(`[Archive] Could not find match ${matchId} or fetch error:`, fetchError);
      return false;
    }

    // 2. Check if it already exists in archive to avoid 409 console error
    const { data: existingArchive } = await supabase
      .from('matches_archive')
      .select('id')
      .eq('id', matchId)
      .maybeSingle();

    if (!existingArchive) {
      // 3. Insert into matches_archive
      const { error: insertError } = await supabase
        .from('matches_archive')
        .insert(match);

      if (insertError) {
        console.error(`[Archive] Failed to insert into matches_archive:`, insertError);
        return false;
      }
    } else {
      console.log(`[Archive] Match ${matchId} already in archive. Skipping insert.`);
    }

    // 4. Delete from live matches table
    const { error: deleteError } = await supabase
      .from('matches')
      .delete()
      .eq('id', matchId);

    if (deleteError) {
      console.error(`[Archive] Failed to delete from live matches:`, deleteError);
      return false;
    }

    console.log(`[Archive] Match ${matchId} archived successfully.`);
    return true;
  } catch (err) {
    console.error(`[Archive] Critical error moving match:`, err);
    return false;
  }
}

/**
 * Marks stale matches in the database and moves them to 'matches_archive'.
 */
export async function archiveStaleMatches() {
  console.log('[Matchmaking] Running archival cleanup...');
  
  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();

  try {
    // 1. Find all records that SHOULD be archived:
    // - status: 'done', 'no found', 'abended', 'canceled' (Instantly)
    // - status: 'pending' (Older than 5 min)
    // - status: 'matched' (Older than 10 min)
    
    const { data: recordsToArchive, error: fetchError } = await supabase
      .from('matches')
      .select('id, status, created_at');

    if (fetchError) throw fetchError;

    const toMove = recordsToArchive?.filter(m => {
      const isFinished = ['done', 'no found', 'abended', 'canceled'].includes(m.status);
      const isStalePending = m.status === 'pending' && m.created_at < fiveMinAgo;
      const isStaleMatched = m.status === 'matched' && m.created_at < tenMinAgo;
      return isFinished || isStalePending || isStaleMatched;
    }) || [];

    if (toMove.length > 0) {
      console.log(`[Archival] Moving ${toMove.length} matches to archive...`);
      // Use Batching: Process in small chunks to avoid overwhelming the connection
      for (const m of toMove) {
        await moveMatchToArchive(m.id);
      }
    }

    console.log('[Matchmaking] Archival complete.');
  } catch (err) {
    console.error('[Matchmaking] Archival failed:', err);
  }
}
