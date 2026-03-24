
import { supabase } from './src/lib/supabase';

async function inspectMatches() {
  console.log('--- Inspecting matches table ---');
  const { data: matches, error } = await supabase.from('matches').select('*').limit(1);
  if (error) {
    console.error('Matches Error:', error);
  } else {
    console.log('Matches columns:', Object.keys(matches[0] || {}));
    console.log('Sample match:', matches[0]);
  }
}

inspectMatches();
