import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321', // typical dummy/local url
  process.env.VITE_SUPABASE_ANON_KEY || 'dummy'
);

async function test() {
  const { data, error } = await supabase.from('players').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else if (data && data.length > 0) {
    console.log("Columns:", Object.keys(data[0]));
  } else {
    console.log("Table 'players' is empty but structure can be viewed if we send invalid query maybe?");
  }
}

test();
