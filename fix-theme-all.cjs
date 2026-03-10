const fs = require('fs');
const path = require('path');

const replacements = [
  { from: /\bbg-white\b/g, to: 'bg-baccarim-card' },
  { from: /\bbg-slate-50\b/g, to: 'bg-baccarim-hover' },
  { from: /\bbg-slate-100\b/g, to: 'bg-baccarim-active' },
  { from: /\bborder-slate-50\b/g, to: 'border-baccarim-border' },
  { from: /\bborder-slate-100\b/g, to: 'border-baccarim-border' },
  { from: /\bborder-slate-200\b/g, to: 'border-baccarim-border-hover' },
  { from: /\btext-slate-400\b/g, to: 'text-baccarim-text-muted' },
  { from: /\btext-slate-500\b/g, to: 'text-baccarim-text-muted' },
  { from: /\btext-slate-600\b/g, to: 'text-baccarim-text-muted' },
  { from: /\btext-slate-700\b/g, to: 'text-baccarim-text' },
  { from: /\btext-baccarim-navy\b/g, to: 'text-baccarim-text' },
  { from: /\bdivide-slate-50\b/g, to: 'divide-baccarim-border' },
  { from: /\bdivide-slate-100\b/g, to: 'divide-baccarim-border' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  for (const r of replacements) {
    content = content.replace(r.from, r.to);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated theme in', filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist') continue;
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

walk('./components');
walk('./App.tsx');
