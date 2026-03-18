import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

if (urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  supabase.from('users').select('*').limit(1).then(({ data, error }) => {
    if (error) console.error(error);
    else console.log(JSON.stringify(data?.[0], null, 2));
  });
}
