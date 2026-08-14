const fs = require('fs');
const file = 'c:/projects/MemoryOS/memoryos-frontend/components/mission-control/account-home-dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = {
  'hover:bg-black/5': 'hover:bg-black/5 dark:hover:bg-white/5',
  'bg-black/5': 'bg-black/5 dark:bg-white/5',
  'bg-black/10': 'bg-black/10 dark:bg-white/10',
  'hover:bg-black/10': 'hover:bg-black/10 dark:hover:bg-white/10',
  'border-black/5': 'border-black/5 dark:border-white/5',
  'border-black/10': 'border-black/10 dark:border-white/10'
};

for (const [key, value] of Object.entries(replacements)) {
  content = content.split(key).join(value);
}

fs.writeFileSync(file, content);
console.log('Done');
