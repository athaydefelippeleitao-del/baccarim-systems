
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://klubieisjdxqgqnxbrig.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsdWJpZWlzamR4cWdxbnhicmlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNDY1ODgsImV4cCI6MjA5NzcyMjU4OH0.Ao7rvAEu0OFIMoop01XdU050Qi67UZvV0oOcjAqRq8k';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkConfig() {
  console.log('Checking SYSTEM_APP_CONFIG...');
  const { data, error } = await supabase
    .from('checklist_templates')
    .select('*')
    .eq('key', 'SYSTEM_APP_CONFIG')
    .single();

  if (error) {
    console.error('Error fetching config:', error);
  } else {
    console.log('Config found:', JSON.stringify({
      key: data.key,
      hasIcon: !!data.template?.appIcon,
      iconLength: data.template?.appIcon?.length
    }, null, 2));
  }
}

checkConfig();
