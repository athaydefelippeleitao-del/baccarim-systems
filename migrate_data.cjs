const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração Antiga (Lida do .env ou valores fixos)
const OLD_URL = 'https://pertaeirboqtzbaqaluh.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcnRhZWlyYm9xdHpiYXFhbHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDA0ODQsImV4cCI6MjA4ODY3NjQ4NH0.yXv9F4fhIPT1QHy9t0DDmsd2Ypq-fgOl5ByIbFmdjDs';

// COLOQUE AQUI AS CHAVES DO NOVO PROJETO (SPLINTIFY)
const NEW_URL = 'https://klubieisjdxqgqnxbrig.supabase.co';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsdWJpZWlzamR4cWdxbnhicmlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjE0NjU4OCwiZXhwIjoyMDk3NzIyNTg4fQ.bwh7AaFe3szxGhQvDd6TBtSIV-reUjT1Xo9kx_UXLoU';

if (NEW_URL === 'SUA_NOVA_URL_AQUI') {
  console.error("ERRO: Você precisa preencher a NEW_URL e NEW_KEY dentro deste arquivo antes de rodar.");
  process.exit(1);
}

const oldSupabase = createClient(OLD_URL, OLD_KEY);
const newSupabase = createClient(NEW_URL, NEW_KEY);

const TABLES = [
  'users',
  'projects',
  'licenses',
  'notifications',
  'contracts',
  'meetings',
  'videos',
  'reports',
  'audit_log',
  'checklist_templates'
];

async function migrateData() {
  console.log("Iniciando migração de dados...");
  
  for (const table of TABLES) {
    console.log(`\n--- Migrando tabela: ${table} ---`);
    
    // Ler da antiga
    const { data: rows, error: readError } = await oldSupabase.from(table).select('*');
    if (readError) {
      console.error(`Erro ao ler ${table}:`, readError.message);
      continue;
    }
    
    if (!rows || rows.length === 0) {
      console.log(`Tabela ${table} está vazia.`);
      continue;
    }
    
    console.log(`Copiando ${rows.length} registros para ${table}...`);
    
    // Inserir na nova (dividindo em chunks de 50 para não estourar payload)
    let successCount = 0;
    for (let i = 0; i < rows.length; i += 50) {
      const chunk = rows.slice(i, i + 50);
      const { error: writeError } = await newSupabase.from(table).insert(chunk);
      
      if (writeError) {
        console.error(`Erro ao inserir lote na ${table}:`, writeError.message);
      } else {
        successCount += chunk.length;
      }
    }
    
    console.log(`Concluído: ${successCount} registros copiados com sucesso na tabela ${table}.`);
  }
  
  console.log("\n✅ Migração de todos os dados concluída!");
}

migrateData();
