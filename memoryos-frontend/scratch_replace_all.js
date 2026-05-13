const fs = require('fs');
const path = require('path');

const dir = 'c:\\projects\\MemoryOS\\memoryos-frontend\\components\\landing';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx')).map(f => path.join(dir, f));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Regex replacements for Tailwind classes
  content = content.replace(/text-rose-[456]00/g, 'text-destructive');
  content = content.replace(/bg-rose-[456]00\/(\d+)/g, 'bg-destructive/$1');
  content = content.replace(/bg-rose-[456]00/g, 'bg-destructive');
  content = content.replace(/border-rose-[456]00\/(\d+)/g, 'border-destructive/$1');
  content = content.replace(/border-rose-[456]00/g, 'border-destructive');
  content = content.replace(/ring-rose-[456]00\/(\d+)/g, 'ring-destructive/$1');
  content = content.replace(/ring-rose-[456]00/g, 'ring-destructive');

  content = content.replace(/text-emerald-[456]00/g, 'text-chart-2');
  content = content.replace(/bg-emerald-[456]00\/(\d+)/g, 'bg-chart-2/$1');
  content = content.replace(/bg-emerald-[456]00/g, 'bg-chart-2');
  content = content.replace(/border-emerald-[456]00\/(\d+)/g, 'border-chart-2/$1');
  content = content.replace(/border-emerald-[456]00/g, 'border-chart-2');
  content = content.replace(/ring-emerald-[456]00\/(\d+)/g, 'ring-chart-2/$1');
  content = content.replace(/ring-emerald-[456]00/g, 'ring-chart-2');

  // Blue / Primary specific hardcoded hex replacements
  content = content.replace(/#2166f3/g, 'hsl(var(--primary))');
  content = content.replace(/rgba\(33,102,243,0\.6\)/g, 'hsl(var(--primary) / 0.6)');
  content = content.replace(/rgba\(33,102,243,0\.5\)/g, 'hsl(var(--primary) / 0.5)');
  content = content.replace(/rgba\(33,102,243,0\.4\)/g, 'hsl(var(--primary) / 0.4)');
  content = content.replace(/rgba\(33,102,243,0\.3\)/g, 'hsl(var(--primary) / 0.3)');
  content = content.replace(/rgba\(33,102,243,0\.25\)/g, 'hsl(var(--primary) / 0.25)');
  content = content.replace(/rgba\(33,102,243,0\.2\)/g, 'hsl(var(--primary) / 0.2)');

  // Success / Emerald specific hardcoded hex replacements
  content = content.replace(/#10b981/g, 'hsl(var(--chart-2))');
  content = content.replace(/rgba\(16,185,129,0\.6\)/g, 'hsl(var(--chart-2) / 0.6)');
  content = content.replace(/rgba\(16,185,129,0\.5\)/g, 'hsl(var(--chart-2) / 0.5)');

  // Destructive / Rose specific hardcoded hex replacements
  content = content.replace(/#f43f5e/g, 'hsl(var(--destructive))');
  content = content.replace(/rgba\(244,63,94,0\.6\)/g, 'hsl(var(--destructive) / 0.6)');
  
  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${path.basename(file)}`);
  }
});
console.log('Done mapping all files.');
