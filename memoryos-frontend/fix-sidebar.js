const fs = require('fs');
const file = 'c:/projects/MemoryOS/memoryos-frontend/components/mission-control/mission-control-workspace.tsx';
let content = fs.readFileSync(file, 'utf8');

const mapping = {
  'All Institutions': 'Overview',
  'Templates': 'Setup',
  'Active Missions': 'Execution',
  'Mission History': 'Logs',
  'Live Runs': 'Compute',
  'Agent Timeline': 'Analytics',
  'Evidence': 'Security',
  'Certificates': 'Compliance',
  'Authority': 'Access',
  'Policies': 'Rules',
  'Institution Records': 'Storage',
  'Lessons Learned': 'AI',
  'Repositories': 'Code',
  'Sources': 'Data',
  'MCP': 'Protocol',
  'SDK': 'Libraries',
  'API Keys': 'Auth',
  'Webhooks': 'Events'
};

for (const [title, sub] of Object.entries(mapping)) {
  const oldBtn = `<button className="text-[13px] text-left text-[#666] hover:text-[#222] py-1 transition-colors">${title}</button>`;
  const newBtn = `
                <button className="flex items-center justify-between group/item px-2 py-1.5 rounded-md hover:bg-black/5 transition-colors w-full text-left -ml-2">
                  <div className="flex flex-col">
                    <span className="text-[13.5px] text-[#222] font-medium leading-snug">${title}</span>
                    <span className="text-[11.5px] text-[#888] font-normal leading-none mt-[2px]">${sub}</span>
                  </div>
                  <Pin className="size-[14px] text-black/20 opacity-0 group-hover/item:opacity-100 hover:text-black/60 transition-all shrink-0 -rotate-45" />
                </button>`.trim();
  content = content.replace(oldBtn, newBtn);
}

fs.writeFileSync(file, content);
console.log('Replaced successfully');
