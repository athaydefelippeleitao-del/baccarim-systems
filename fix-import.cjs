const fs = require('fs');

let content = fs.readFileSync('components/ImportView.tsx', 'utf8');

content = content.replace(/\bbg-white\b/g, 'bg-baccarim-card');
content = content.replace(/\bborder-slate-100\b/g, 'border-baccarim-border');
content = content.replace(/\btext-slate-400\b/g, 'text-baccarim-text-muted');
content = content.replace(/\btext-slate-500\b/g, 'text-baccarim-text-subtle');
content = content.replace(/\btext-slate-800\b/g, 'text-baccarim-text');
content = content.replace(/\btext-slate-900\b/g, 'text-baccarim-text');

fs.writeFileSync('components/ImportView.tsx', content, 'utf8');
console.log('ImportView updated');
