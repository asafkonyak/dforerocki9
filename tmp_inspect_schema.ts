
import { supabase } from './src/lib/supabase';

async function inspectSchema() {
  console.log('--- Inspecting players table ---');
  const { data: players, error: playersError } = await supabase.from('players').select('*').limit(1);
  if (playersError) console.error('Players Error:', playersError);
  else console.log('Players columns:', Object.keys(players[0] || {}));

  console.log('--- Inspecting profiles table ---');
  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*').limit(1);
  if (profilesError) console.error('Profiles Error:', profilesError);
  else console.log('Profiles columns:', Object.keys(profiles[0] || {}));

  console.log('--- Inspecting matchmaking_queue table ---');
  const { data: queue, error: queueError } = await supabase.from('matchmaking_queue').select('*').limit(1);
  if (queueError) console.error('Queue Error:', queueError);
  else console.log('Queue columns:', Object.keys(queue[0] || {}));
}

inspectSchema();
