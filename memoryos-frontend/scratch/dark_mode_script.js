const fs = require('fs');
const file = 'c:/projects/MemoryOS/memoryos-frontend/components/mission-control/account-home-dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = {
  'bg-[#FBFBFB]': 'bg-[#FBFBFB] dark:bg-[#0a0a0a]',
  'bg-white': 'bg-white dark:bg-[#121212]',
  'bg-[#f8f8fa]': 'bg-[#f8f8fa] dark:bg-white/5',
  'bg-[#f4f4f6]': 'bg-[#f4f4f6] dark:bg-white/10',
  'bg-[#fbfbfb]': 'bg-[#fbfbfb] dark:bg-[#0a0a0a]',
  'bg-[#1a1a1a]': 'bg-[#1a1a1a] dark:bg-white',
  'bg-[#f0f4ff]': 'bg-[#f0f4ff] dark:bg-[#0f52ff]/20',
  'bg-[#fbfbfd]': 'bg-[#fbfbfd] dark:bg-white/5',
  'bg-emerald-50': 'bg-emerald-50 dark:bg-emerald-500/10',
  'bg-blue-50': 'bg-blue-50 dark:bg-blue-500/10',
  'bg-[#eef4ff]': 'bg-[#eef4ff] dark:bg-[#0f52ff]/20',
  'bg-slate-50': 'bg-slate-50 dark:bg-slate-500/10',
  'bg-amber-50': 'bg-amber-50 dark:bg-amber-500/10',

  'border-[#e2e2e8]': 'border-[#e2e2e8] dark:border-white/10',
  'border-[#f0f0f2]': 'border-[#f0f0f2] dark:border-white/5',
  'border-[#e2e2e7]': 'border-[#e2e2e7] dark:border-white/10',
  'border-emerald-200/60': 'border-emerald-200/60 dark:border-emerald-500/20',
  'border-emerald-200': 'border-emerald-200 dark:border-emerald-500/20',
  'border-blue-200/60': 'border-blue-200/60 dark:border-blue-500/20',
  'border-blue-200': 'border-blue-200 dark:border-blue-500/20',
  'border-slate-200': 'border-slate-200 dark:border-white/10',
  'border-amber-200': 'border-amber-200 dark:border-amber-500/20',
  'border-[#0f52ff]/40': 'border-[#0f52ff]/40 dark:border-[#0f52ff]/60',

  'text-[#111]': 'text-[#111] dark:text-white',
  'text-[#333]': 'text-[#333] dark:text-white/90',
  'text-[#444]': 'text-[#444] dark:text-white/80',
  'text-[#555]': 'text-[#555] dark:text-white/70',
  'text-[#666]': 'text-[#666] dark:text-white/60',
  'text-[#777]': 'text-[#777] dark:text-white/50',
  'text-[#888]': 'text-[#888] dark:text-white/40',
  'text-[#999]': 'text-[#999] dark:text-white/30',
  'text-[#aaa]': 'text-[#aaa] dark:text-white/20',
  'text-[#ccc]': 'text-[#ccc] dark:text-white/10',
  'text-[#b0b0b8]': 'text-[#b0b0b8] dark:text-white/30',
  'text-emerald-700': 'text-emerald-700 dark:text-emerald-400',
  'text-emerald-600': 'text-emerald-600 dark:text-emerald-500',
  'text-rose-600': 'text-rose-600 dark:text-rose-500',
  'text-amber-600': 'text-amber-600 dark:text-amber-500'
};

for (const [key, value] of Object.entries(replacements)) {
  content = content.split(key).join(value);
}

fs.writeFileSync(file, content);
console.log('Done');
