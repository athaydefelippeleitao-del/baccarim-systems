const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  content = content.replace(/\btext-slate-400\b/g, 'text-baccarim-text-muted');
  content = content.replace(/\btext-slate-500\b/g, 'text-baccarim-text-muted');
  content = content.replace(/\btext-slate-600\b/g, 'text-baccarim-text-muted');
  content = content.replace(/\bbg-slate-50\b/g, 'bg-baccarim-hover');
  content = content.replace(/\bbg-slate-100\b/g, 'bg-baccarim-active');
  content = content.replace(/\bbg-slate-700\b/g, 'bg-baccarim-hover');
  content = content.replace(/\bbg-slate-800\b/g, 'bg-baccarim-active');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
}

function walk(dirOrFile) {
  if (!fs.existsSync(dirOrFile)) return;
  const stat = fs.statSync(dirOrFile);
  if (stat.isDirectory()) {
    const files = fs.readdirSync(dirOrFile);
    for (const file of files) {
      if (file === 'node_modules' || file === '.git' || file === 'dist') continue;
      const fullPath = path.join(dirOrFile, file);
      walk(fullPath);
    }
  } else if (dirOrFile.endsWith('.tsx') || dirOrFile.endsWith('.ts')) {
    processFile(dirOrFile);
  }
}

walk('./components');
walk('./App.tsx');
