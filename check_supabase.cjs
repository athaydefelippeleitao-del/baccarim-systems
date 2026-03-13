
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pertaeirboqtzbaqaluh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcnRhZWlyYm9xdHpiYXFhbHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDA0ODQsImV4cCI6MjA4ODY3NjQ4NH0.yXv9F4fhIPT1QHy9t0DDmsd2Ypq-fgOl5ByIbFmdjDs';

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
