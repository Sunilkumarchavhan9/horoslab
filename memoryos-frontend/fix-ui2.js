const fs = require('fs');
let file = fs.readFileSync('components/mission-control/mission-control-workspace.tsx', 'utf8');

const startIdx = file.indexOf('return (');
const endIdx = file.indexOf('</aside>');
if (startIdx === -1 || endIdx === -1) {
  console.log("Could not find start or end index.");
  process.exit(1);
}

let sidebar = file.slice(startIdx, endIdx + '</aside>'.length);

sidebar = sidebar.replace('bg-[#F0F0F0] text-black font-mono', 'bg-[#F0F0F0] text-black font-sans');
sidebar = sidebar.replace('bg-[#FAFAFA]', 'bg-[#0B0B0B]');
sidebar = sidebar.replace(/border-black\/5/g, 'border-white/10');
sidebar = sidebar.replace(/bg-black\/5/g, 'bg-white/5');
sidebar = sidebar.replace(/bg-black\/10/g, 'bg-white/10');
sidebar = sidebar.replace(/text-\[\#333\]/g, 'text-white');
sidebar = sidebar.replace(/text-\[\#555\]/g, 'text-white/80');
sidebar = sidebar.replace(/text-\[\#777\]/g, 'text-white/60');
sidebar = sidebar.replace(/text-\[\#888\]/g, 'text-white/40');
sidebar = sidebar.replace(/text-\[\#222\]/g, 'text-white');
sidebar = sidebar.replace(/text-\[\#aaa\]/g, 'text-white/30');
sidebar = sidebar.replace(/text-\[\#999\]/g, 'text-white/30');
sidebar = sidebar.replace(/text-black\/30/g, 'text-white/30');
sidebar = sidebar.replace(/text-black\/70/g, 'text-white/70');
sidebar = sidebar.replace(/text-black\/60/g, 'text-white/60');
sidebar = sidebar.replace(/text-black\/20/g, 'text-white/20');
sidebar = sidebar.replace(/fill-black\/10/g, 'fill-white/10');

const oldLogoStr = `<div className={cn("flex items-center gap-3 px-2 py-2 mb-2 rounded-lg transition-all duration-300", isSidebarExpanded ? "justify-start" : "justify-center")}>
            <div className="size-8 rounded-[8px] bg-white/5 flex items-center justify-center shrink-0 ring-1 ring-white/10 shadow-sm">
              <Compass className="size-4 text-white/70" />
            </div>
            <span className={cn("font-bold text-[15px] tracking-tight transition-all duration-300", isSidebarExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 hidden")}>
              MemoryOS
            </span>
          </div>`;

const newLogoStr = `<div className={cn("flex items-center gap-2 px-2 py-2 mb-2 transition-all duration-300", isSidebarExpanded ? "justify-start" : "justify-center")}>
            <MemoryOSIcon className="size-6 shrink-0" />
            <span className={cn("font-bold text-[14px] tracking-tight transition-all duration-300 text-white", isSidebarExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 hidden")}>
              Memoryostm@gmail.com
            </span>
          </div>
          {isSidebarExpanded && (
            <div className="px-2 pb-2">
              <div className="flex items-center gap-2 bg-white/5 rounded-md px-2.5 py-2 border border-white/5">
                <Search className="size-4 text-white/50 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Quick search..." 
                  className="bg-transparent text-[13px] w-full outline-none placeholder:text-white/60 text-white/90"
                />
                <span className="text-[11px] text-white/60 font-bold uppercase shrink-0">Ctrl K</span>
              </div>
            </div>
          )}`;

sidebar = sidebar.replace(oldLogoStr, newLogoStr);

file = file.slice(0, startIdx) + sidebar + file.slice(endIdx + '</aside>'.length);
fs.writeFileSync('components/mission-control/mission-control-workspace.tsx', file);
console.log("Done");
