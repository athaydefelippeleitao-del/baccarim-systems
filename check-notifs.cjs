require('dotenv').config({path: '.env'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(5).then(res => console.log(JSON.stringify(res.data, null, 2)));
