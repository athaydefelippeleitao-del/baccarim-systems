import { createClient } from '@supabase/supabase-js';

const s = createClient(
  'https://pertaeirboqtzbaqaluh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcnRhZWlyYm9xdHpiYXFhbHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDA0ODQsImV4cCI6MjA4ODY3NjQ4NH0.yXv9F4fhIPT1QHy9t0DDmsd2Ypq-fgOl5ByIbFmdjDs'
);

// Fetch all notifications WITH attached_files to check their size
const { data, error } = await s
  .from('notifications')
  .select('id, title, attached_files');

if (error) {
  console.error('Error:', error);
} else {
  let totalBase64Bytes = 0;
  let notifWithFiles = 0;
  for (const row of data || []) {
    const files = row.attached_files || [];
    if (files.length > 0) {
      notifWithFiles++;
      for (const f of files) {
        if (f.fileData) {
          totalBase64Bytes += f.fileData.length;
        }
      }
    }
  }
  const totalMB = (totalBase64Bytes / 1024 / 1024).toFixed(2);
  console.log(`Total notifications: ${(data||[]).length}`);
  console.log(`Notifications with files: ${notifWithFiles}`);
  console.log(`Total base64 data in attached_files: ${totalMB} MB`);
  console.log(`Each page load transfers this data!`);
}
