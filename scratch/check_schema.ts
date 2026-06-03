import { supabase } from '../services/supabaseService.js';

async function checkSubscriptions() {
  const { data, error } = await supabase
    .from('checklist_templates')
    .select('*')
    .eq('key', 'USER_PUSH_SUBSCRIPTIONS')
    .single();

  if (error) {
    console.error('Error fetching USER_PUSH_SUBSCRIPTIONS:', error);
  } else {
    console.log('USER_PUSH_SUBSCRIPTIONS row:', data);
  }
}

checkSubscriptions();
