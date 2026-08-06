require('dotenv').config({path: '.env'});
fetch(process.env.SUPABASE_URL + '/rest/v1/notifications?select=*&order=created_at.desc&limit=5', { 
  headers: { 
    'apikey': process.env.SUPABASE_ANON_KEY, 
    'Authorization': 'Bearer ' + process.env.SUPABASE_ANON_KEY 
  } 
}).then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2)));
