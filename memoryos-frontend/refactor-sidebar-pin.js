const fs = require('fs');

const file = 'c:/projects/MemoryOS/memoryos-frontend/components/mission-control/mission-control-workspace.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Insert state and helper
const stateInjection = `  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    institutions: false,
    missions: false,
    execution: false,
    verification: false,
    governance: false,
    memory: false,
    integrations: false,
    developer: false
  })

  const [pinnedItems, setPinnedItems] = useState<string[]>([])

  const togglePin = (title: string) => {
    setPinnedItems(prev => prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title])
  }

  const renderSectionItems = (items: {title: string, sub: string}[]) => {
    const sorted = [...items].sort((a, b) => {
      const aPinned = pinnedItems.includes(a.title);
      const bPinned = pinnedItems.includes(b.title);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
    return (
      <div className="pl-9 pr-3 py-1 flex flex-col gap-1 relative">
        <div className="absolute left-[21px] top-1 bottom-1 w-[1px] bg-black/10" />
        {sorted.map(item => {
          const isPinned = pinnedItems.includes(item.title);
          return (
            <button key={item.title} className="flex items-center justify-between group/item px-2 py-1.5 rounded-md hover:bg-black/5 transition-colors w-full text-left -ml-2">
              <div className="flex flex-col">
                <span className="text-[13.5px] text-[#222] font-medium leading-snug">{item.title}</span>
                <span className="text-[11.5px] text-[#888] font-normal leading-none mt-[2px]">{item.sub}</span>
              </div>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePin(item.title); }}
                className="focus:outline-none"
              >
                <Pin 
                  className={cn(
                    "size-[14px] shrink-0 -rotate-45 transition-all",
                    isPinned ? "text-black/60 opacity-100 fill-black/10" : "text-black/20 opacity-0 group-hover/item:opacity-100 hover:text-black/60"
                  )} 
                />
              </button>
            </button>
          );
        })}
      </div>
    );
  }`;

content = content.replace(/  const \[expandedSections, setExpandedSections\] = useState<Record<string, boolean>>\(\{\s+institutions: false,\s+missions: false,\s+execution: false,\s+verification: false,\s+governance: false,\s+memory: false,\s+integrations: false,\s+developer: false\s+\}\)/, stateInjection);


// 2. Map blocks to replace
const sections = {
  'institutions': [
    {title: 'All Institutions', sub: 'Overview'},
    {title: 'Templates', sub: 'Setup'}
  ],
  'missions': [
    {title: 'Active Missions', sub: 'Execution'},
    {title: 'Mission History', sub: 'Logs'}
  ],
  'execution': [
    {title: 'Live Runs', sub: 'Compute'},
    {title: 'Agent Timeline', sub: 'Analytics'}
  ],
  'verification': [
    {title: 'Evidence', sub: 'Security'},
    {title: 'Certificates', sub: 'Compliance'}
  ],
  'governance': [
    {title: 'Authority', sub: 'Access'},
    {title: 'Policies', sub: 'Rules'}
  ],
  'memory': [
    {title: 'Institution Records', sub: 'Storage'},
    {title: 'Lessons Learned', sub: 'AI'}
  ],
  'integrations': [
    {title: 'Repositories', sub: 'Code'},
    {title: 'Sources', sub: 'Data'}
  ],
  'developer': [
    {title: 'MCP', sub: 'Protocol'},
    {title: 'SDK', sub: 'Libraries'},
    {title: 'API Keys', sub: 'Auth'},
    {title: 'Webhooks', sub: 'Events'}
  ]
};

for (const [key, items] of Object.entries(sections)) {
  const regex = new RegExp(`\\{expandedSections\\.${key} && \\(\\s+<div className="pl-9 pr-3 py-1 flex flex-col gap-1 relative">[\\s\\S]*?<\\/div>\\s+\\)\\}`, 'g');
  const replacement = `{expandedSections.${key} && renderSectionItems(${JSON.stringify(items, null, 2).replace(/"([^"]+)":/g, '$1:')})}`;
  content = content.replace(regex, replacement);
}

fs.writeFileSync(file, content);
console.log('Refactor complete');
