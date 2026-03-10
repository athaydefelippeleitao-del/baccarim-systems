const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  const coloredBackgrounds = [
    'bg-baccarim-blue',
    'bg-baccarim-green',
    'bg-baccarim-navy',
    'bg-emerald-500',
    'bg-red-500',
    'bg-amber-500',
    'bg-sky-500',
    'bg-indigo-500',
    'bg-rose-500',
    'bg-slate-800',
    'bg-[#FF5A5A]',
    'bg-[#002D62]',
    'bg-[#3FA9F5]',
    'bg-gradient-to-r',
    'from-baccarim-green',
    'from-baccarim-navy'
  ];

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.includes('text-baccarim-text')) {
      const hasColoredBg = coloredBackgrounds.some(bg => line.includes(bg));
      if (hasColoredBg) {
        line = line.replace(/\btext-baccarim-text\b/g, 'text-white');
      }
    }
    lines[i] = line;
  }
  content = lines.join('\n');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist') continue;
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.html')) {
      processFile(fullPath);
    }
  }
}

walk('.');
