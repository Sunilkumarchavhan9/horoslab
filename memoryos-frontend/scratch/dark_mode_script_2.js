const fs = require('fs');
const file = 'c:/projects/MemoryOS/memoryos-frontend/components/mission-control/account-home-dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = {
  'stroke="#f0f0f4"': 'className="stroke-[#f0f0f4] dark:stroke-white/5"',
  'stroke="#cbd5e1"': 'className="stroke-[#cbd5e1] dark:stroke-white/20"',
  'stroke="#ffffff"': 'className="stroke-white dark:stroke-black"',
  'border-t border-[#f0f0f2]': 'border-t border-[#f0f0f2] dark:border-white/5',
  'bg-white/95': 'bg-white/95 dark:bg-[#121212]/95',
  'border-white/95': 'border-white/95 dark:border-black/95',
  'bg-white border': 'bg-white dark:bg-[#121212] border',
  'bg-white text-[#111]': 'bg-white dark:bg-[#0a0a0a] text-[#111] dark:text-white',
  'from-gray-200 via-gray-100 to-gray-200': 'from-gray-200 dark:from-white/5 via-gray-100 dark:via-white/10 to-gray-200 dark:to-white/5',
  'bg-white border border-[#e2e2e8]': 'bg-white dark:bg-[#121212] border border-[#e2e2e8] dark:border-white/10'
};

for (const [key, value] of Object.entries(replacements)) {
  content = content.split(key).join(value);
}

fs.writeFileSync(file, content);
console.log('Done');
