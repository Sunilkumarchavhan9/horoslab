const fs = require('fs');
const path = require('path');

const dir = 'c:/projects/MemoryOS/memoryos-frontend/components/mission-control/institution';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const replacements = [
  { search: 'bg-[#0a0a0a]', replace: 'bg-[#FBFBFB] dark:bg-[#0a0a0a]' },
  { search: 'text-white', replace: 'text-black dark:text-white' },
  { search: 'border-white/', replace: 'border-black/dark:border-white/' }, // intermediate step
  { search: 'bg-white/', replace: 'bg-black/dark:bg-white/' },
  { search: 'text-white/', replace: 'text-black/dark:text-white/' },
  { search: 'bg-[#121212]', replace: 'bg-white dark:bg-[#121212]' },
  { search: 'bg-[#050505]', replace: 'bg-white dark:bg-[#050505]' },
  { search: 'border-[#222]', replace: 'border-[#eaeaea] dark:border-[#222]' },
  { search: 'hover:bg-white/', replace: 'hover:bg-black/dark:hover:bg-white/' },
  { search: 'hover:text-white', replace: 'hover:text-black dark:hover:text-white' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Specific regex replacements to safely handle `/10`, `/5`, `/40` etc.
  content = content.replace(/border-white\/(\d+)/g, 'border-black/$1 dark:border-white/$1');
  content = content.replace(/bg-white\/(\d+)/g, 'bg-black/$1 dark:bg-white/$1');
  content = content.replace(/text-white\/(\d+)/g, 'text-black/$1 dark:text-white/$1');
  content = content.replace(/hover:bg-white\/(\d+)/g, 'hover:bg-black/$1 dark:hover:bg-white/$1');
  content = content.replace(/ring-white\/(\d+)/g, 'ring-black/$1 dark:ring-white/$1');
  content = content.replace(/from-white\/(\d+)/g, 'from-black/$1 dark:from-white/$1');
  content = content.replace(/to-white\/(\d+)/g, 'to-black/$1 dark:to-white/$1');
  content = content.replace(/via-white\/(\d+)/g, 'via-black/$1 dark:via-white/$1');

  // Hardcoded replacements
  content = content.split('bg-[#0a0a0a]').join('bg-[#f4f4f4] dark:bg-[#0a0a0a]');
  content = content.split('bg-[#121212]').join('bg-white dark:bg-[#121212]');
  content = content.split('bg-[#1a1a1a]').join('bg-white dark:bg-[#1a1a1a]');
  
  // text-white is tricky because it matches text-white/50 too, but we already replaced text-white/50 above!
  // Wait, if we replace text-white/50 first, then text-white won't match it if we use boundaries, 
  // but split('text-white') WOULD match dark:text-white and text-white.
  // Better use regex with negative lookahead.
  content = content.replace(/text-white(?!\/)/g, 'text-black dark:text-white');
  
  // fix double replacements
  content = content.replace(/text-black dark:text-black dark:text-white/g, 'text-black dark:text-white');

  fs.writeFileSync(filePath, content, 'utf8');
}

files.forEach(f => {
  processFile(path.join(dir, f));
});

console.log('Done mapping themes!');
