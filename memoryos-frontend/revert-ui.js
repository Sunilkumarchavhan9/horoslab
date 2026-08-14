const fs = require('fs');
let file = fs.readFileSync('components/mission-control/mission-control-workspace.tsx', 'utf8');

const startIdx = file.indexOf('return (');
const endIdx = file.indexOf('</aside>');
if (startIdx !== -1 && endIdx !== -1) {
  let sidebar = file.slice(startIdx, endIdx + '</aside>'.length);

  sidebar = sidebar.replace('bg-[#F0F0F0] text-black font-sans', 'bg-[#F0F0F0] text-black font-mono');
  sidebar = sidebar.replace('bg-[#0B0B0B]', 'bg-[#FAFAFA]');
  sidebar = sidebar.replaceAll('border-white/10', 'border-black/5');
  sidebar = sidebar.replaceAll('bg-white/5', 'bg-black/5');
  sidebar = sidebar.replaceAll('bg-white/10', 'bg-black/10');
  sidebar = sidebar.replaceAll('text-white/80', 'text-[#555]');
  sidebar = sidebar.replaceAll('text-white/60', 'text-[#777]');
  sidebar = sidebar.replaceAll('text-white/40', 'text-[#888]');
  sidebar = sidebar.replaceAll('text-white/30', 'text-[#999]');
  sidebar = sidebar.replaceAll('text-white/70', 'text-black/70');
  sidebar = sidebar.replaceAll('text-white/20', 'text-black/20');
  sidebar = sidebar.replaceAll('fill-white/10', 'fill-black/10');
  sidebar = sidebar.replaceAll('text-white', 'text-[#333]'); // Generic map back for #333 and #222

  const newLogoStrReversed = `<div className={cn("flex items-center gap-2 px-2 py-2 mb-2 transition-all duration-300", isSidebarExpanded ? "justify-start" : "justify-center")}>
            <MemoryOSIcon className="size-6 shrink-0" />
            <span className={cn("font-bold text-[14px] tracking-tight transition-all duration-300 text-[#333]", isSidebarExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 hidden")}>
              Memoryostm@gmail.com
            </span>
          </div>
          {isSidebarExpanded && (
            <div className="px-2 pb-2">
              <div className="flex items-center gap-2 bg-black/5 rounded-md px-2.5 py-2 border border-black/5">
                <Search className="size-4 text-[#555] shrink-0" />
                <input 
                  type="text" 
                  placeholder="Quick search..." 
                  className="bg-transparent text-[13px] w-full outline-none placeholder:text-[#777] text-[#333]"
                />
                <span className="text-[11px] text-[#777] font-bold uppercase shrink-0">Ctrl K</span>
              </div>
            </div>
          )}`;

  const oldLogoStr = `<div className={cn("flex items-center gap-3 px-2 py-2 mb-2 rounded-lg transition-all duration-300", isSidebarExpanded ? "justify-start" : "justify-center")}>
            <div className="size-8 rounded-[8px] bg-black/5 flex items-center justify-center shrink-0 ring-1 ring-black/5 shadow-sm">
              <Compass className="size-4 text-black/70" />
            </div>
            <span className={cn("font-bold text-[15px] tracking-tight transition-all duration-300", isSidebarExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 hidden")}>
              MemoryOS
            </span>
          </div>`;

  sidebar = sidebar.replace(newLogoStrReversed, oldLogoStr);

  file = file.slice(0, startIdx) + sidebar + file.slice(endIdx + '</aside>'.length);
  fs.writeFileSync('components/mission-control/mission-control-workspace.tsx', file);
  console.log("Done");
} else {
  console.log("Could not find bounds");
}
