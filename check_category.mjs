import { createClient } from '@supabase/supabase-js';

const s = createClient(
  'https://pertaeirboqtzbaqaluh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcnRhZWlyYm9xdHpiYXFhbHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDA0ODQsImV4cCI6MjA4ODY3NjQ4NH0.yXv9F4fhIPT1QHy9t0DDmsd2Ypq-fgOl5ByIbFmdjDs'
);

// 1. Test if category column exists
const { data, error } = await s.from('notifications').select('id, category').limit(3);
console.log('SELECT category result:');
console.log('error:', JSON.stringify(error));
console.log('data:', JSON.stringify(data));

// 2. Try upsert with category
const testRow = {
  id: 'test-cat-' + Date.now(),
  title: 'TESTE CATEGORIA',
  client_name: 'Teste',
  project_id: '',
  agency: 'SEMA',
  severity: 'Baixa',
  category: 'Licença',
  deadline: '',
  description: '',
  date_received: '15/06/2026',
  status: 'Open',
  attached_files: []
};

const { data: uData, error: uError } = await s.from('notifications').upsert([testRow], { onConflict: 'id' });
console.log('UPSERT with category:');
console.log('error:', JSON.stringify(uError));
console.log('data:', JSON.stringify(uData));
