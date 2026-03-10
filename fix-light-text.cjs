const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace text-white with text-baccarim-text
  content = content.replace(/\btext-white\b/g, 'text-baccarim-text');
  
  // Replace bg-white with bg-baccarim-card
  content = content.replace(/\bbg-white\b/g, 'bg-baccarim-card');
  
  // Replace some hardcoded white colors in icons and borders
  content = content.replace(/\btext-white\/([0-9]+)\b/g, 'text-baccarim-text/$1');
  content = content.replace(/\bbg-white\/([0-9]+)\b/g, 'bg-baccarim-card/$1');
  content = content.replace(/\bborder-white\/([0-9]+)\b/g, 'border-baccarim-border/$1');
  content = content.replace(/\bto-white\/([0-9]+)\b/g, 'to-baccarim-text/$1');
  content = content.replace(/\bfrom-white\/([0-9]+)\b/g, 'from-baccarim-text/$1');

  // Replace hardcoded semantic colors with theme-aware ones
  content = content.replace(/\bbg-rose-500\b/g, 'bg-baccarim-rose');
  content = content.replace(/\bbg-emerald-500\b/g, 'bg-baccarim-green');
  content = content.replace(/\bbg-emerald-600\b/g, 'bg-baccarim-green');
  content = content.replace(/\bto-emerald-600\b/g, 'to-baccarim-green');
  content = content.replace(/\bbg-amber-500\b/g, 'bg-baccarim-amber');
  content = content.replace(/\bbg-sky-500\b/g, 'bg-baccarim-sky');
  content = content.replace(/\bbg-indigo-500\b/g, 'bg-baccarim-indigo');
  
  // Also handle some text colors that might be hardcoded
  content = content.replace(/\btext-rose-500\b/g, 'text-baccarim-rose');
  content = content.replace(/\btext-emerald-500\b/g, 'text-baccarim-green');
  content = content.replace(/\btext-amber-500\b/g, 'text-baccarim-amber');
  content = content.replace(/\btext-sky-500\b/g, 'text-baccarim-sky');
  content = content.replace(/\btext-indigo-500\b/g, 'text-baccarim-indigo');

  // Fix some specific cases where white text is used in gradients or shadows
  content = content.replace(/\bshadow-white\/10\b/g, 'shadow-baccarim-text/10');
  content = content.replace(/\bborder-white\/10\b/g, 'border-baccarim-text/10');
  content = content.replace(/\bborder-white\/5\b/g, 'border-baccarim-text/5');

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
