import fs from 'fs';
import path from 'path';

function processFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Replace bg-baccarim-dark with bg-baccarim-dark (we will use CSS variables for baccarim-dark)
  // Instead of changing the classes in the TSX files, we will just change the Tailwind config in index.html to use CSS variables.
  // BUT we need to change text-baccarim-text to text-baccarim-text for the main text, and keep text-baccarim-text for buttons.
  
  // Replace text-baccarim-text with text-baccarim-text globally
  content = content.replace(/\btext-white\b/g, 'text-baccarim-text');
  
  // Now restore text-baccarim-text for elements that have specific colored backgrounds
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
    'bg-\\[#FF5A5A\\]',
    'bg-\\[#002D62\\]',
    'bg-\\[#3FA9F5\\]',
    'bg-gradient-to-r',
    'from-baccarim-green',
    'from-baccarim-navy'
  ];

  // We can use a regex to find class attributes containing both a colored background and text-baccarim-text
  // and replace text-baccarim-text with text-baccarim-text.
  // Since class attributes can be multiline or dynamic, we can just do a simple replacement:
  // For each line, if it contains a colored background and text-baccarim-text, replace text-baccarim-text with text-baccarim-text.
  
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.includes('text-baccarim-text')) {
      const hasColoredBg = coloredBackgrounds.some(bg => line.includes(bg));
      if (hasColoredBg) {
        // Restore text-baccarim-text
        line = line.replace(/\btext-baccarim-text\b/g, 'text-baccarim-text');
      }
    }
    lines[i] = line;
  }
  content = lines.join('\n');

  // Also replace border-baccarim-border with border-baccarim-border
  content = content.replace(/\bborder-white\/5\b/g, 'border-baccarim-border');
  content = content.replace(/\bborder-white\/10\b/g, 'border-baccarim-border-hover');
  
  // Replace bg-baccarim-hover with bg-baccarim-hover
  content = content.replace(/\bbg-white\/5\b/g, 'bg-baccarim-hover');
  content = content.replace(/\bbg-white\/10\b/g, 'bg-baccarim-active');
  
  // Replace text-baccarim-text-muted, /60, /80 with text-baccarim-text-muted etc.
  content = content.replace(/\btext-baccarim-text\/40\b/g, 'text-baccarim-text-muted');
  content = content.replace(/\btext-baccarim-text\/60\b/g, 'text-baccarim-text-subtle');
  content = content.replace(/\btext-baccarim-text\/80\b/g, 'text-baccarim-text-strong');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
}

function walk(dir: string) {
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

