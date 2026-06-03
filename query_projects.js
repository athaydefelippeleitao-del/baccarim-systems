const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('projects').select('id, name, specs');
  if (error) {
    console.error("Error fetching projects:", error);
    return;
  }
  console.log("Projects loaded successfully:");
  console.log(JSON.stringify(data, null, 2));
}

main();
