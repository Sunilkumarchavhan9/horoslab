"use client";

import { Search, Filter, Clock, Box, Maximize, Command, Check } from "lucide-react";
import { useRealityStore } from "../runtime/store";
import { GlobalRealityRegistry } from "../runtime/RealityRegistry";
import {
 DropdownMenu,
 DropdownMenuTrigger,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuCheckboxItem,
 DropdownMenuSeparator,
} from "../../../components/ui/dropdown-menu";

export function RealityToolbar() {
 const { currentView, setView, searchQuery, setSearchQuery, timeRange, setTimeRange, filters, setFilter } = useRealityStore();

 const views = GlobalRealityRegistry.getAll();

 return (
 <div className="h-14 border-b border-border dark:border-[#333] flex items-center px-4 bg-card dark:bg-[#111] shrink-0 justify-between transition-colors">
 <div className="flex items-center gap-6">
 <div className="flex items-center gap-2">
 <Box className="size-5 text-foreground/80 dark:text-[#ccc]" />
 <span className="font-semibold text-[14px]">Reality Fabric</span>
 </div>

 {/* View Switcher Segmented Control */}
 <div className="flex bg-card dark:bg-[#1a1a1a] p-1 rounded-md">
 {views.map(view => (
 <button
 key={view.id}
 onClick={() => setView(view.id)}
 className={`px-3 py-1 text-[12px] font-bold rounded-md transition-all ${
 currentView === view.id 
 ? 'bg-card dark:bg-[#333] text-foreground dark:text-[#eee]' 
 : 'text-muted-foreground dark:text-muted-foreground hover:text-foreground/90 dark:hover:text-[#ccc]'
 }`}
 >
 {view.title}
 </button>
 ))}
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="relative group">
 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground dark:text-muted-foreground" />
 <input
 type="text"
 placeholder="Search..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="h-8 pl-8 pr-12 w-48 bg-card dark:bg-[#1a1a1a] rounded-md text-[13px] outline-none focus:bg-card dark:focus:bg-[#111] focus:ring-1 focus:ring-[#111] dark:focus:ring-[#eee] transition-all placeholder:text-muted-foreground dark:placeholder:text-muted-foreground text-foreground dark:text-[#eee]"
 />
 <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none opacity-50 group-focus-within:opacity-100 transition-opacity">
 <Command className="size-[10px] text-foreground dark:text-[#eee]" />
 <span className="text-[10px] font-bold text-foreground dark:text-[#eee]">K</span>
 </div>
 </div>
 
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button className="flex items-center gap-1.5 px-3 py-1.5 bg-card dark:bg-[#1a1a1a] hover:bg-[#eee] dark:hover:bg-[#222] rounded-md text-[13px] font-bold transition-colors text-muted-foreground dark:text-muted-foreground">
 <Clock className="size-3.5" />
 {timeRange === 'live' ? 'Live' : timeRange === '1h' ? 'Last 1h' : timeRange === '24h' ? 'Last 24h' : 'Last 7d'}
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-40 dark:bg-[#111] dark:border-[#333] dark:text-[#eee]">
 <DropdownMenuItem onClick={() => setTimeRange('live')} className="dark:focus:bg-[#1a1a1a]">Live</DropdownMenuItem>
 <DropdownMenuItem onClick={() => setTimeRange('1h')} className="dark:focus:bg-[#1a1a1a]">Last 1h</DropdownMenuItem>
 <DropdownMenuItem onClick={() => setTimeRange('24h')} className="dark:focus:bg-[#1a1a1a]">Last 24h</DropdownMenuItem>
 <DropdownMenuItem onClick={() => setTimeRange('7d')} className="dark:focus:bg-[#1a1a1a]">Last 7d</DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>

 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button className="flex items-center gap-1.5 px-3 py-1.5 bg-card dark:bg-[#1a1a1a] hover:bg-[#eee] dark:hover:bg-[#222] rounded-md text-[13px] font-bold transition-colors text-muted-foreground dark:text-muted-foreground">
 <Filter className="size-3.5" />
 Filter
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-48 dark:bg-[#111] dark:border-[#333] dark:text-[#eee]">
 <DropdownMenuCheckboxItem 
 checked={filters['healthy'] ?? true} 
 onCheckedChange={(c) => setFilter('healthy', c as boolean)}
 className="dark:focus:bg-[#1a1a1a]"
 >
 Healthy Systems
 </DropdownMenuCheckboxItem>
 <DropdownMenuCheckboxItem 
 checked={filters['warning'] ?? true} 
 onCheckedChange={(c) => setFilter('warning', c as boolean)}
 className="dark:focus:bg-[#1a1a1a]"
 >
 Warnings
 </DropdownMenuCheckboxItem>
 <DropdownMenuCheckboxItem 
 checked={filters['critical'] ?? true} 
 onCheckedChange={(c) => setFilter('critical', c as boolean)}
 className="dark:focus:bg-[#1a1a1a]"
 >
 Critical Incidents
 </DropdownMenuCheckboxItem>
 <DropdownMenuSeparator className="dark:bg-[#333]" />
 <DropdownMenuItem 
 onClick={() => {
 setFilter('healthy', true);
 setFilter('warning', true);
 setFilter('critical', true);
 }}
 className="dark:focus:bg-[#1a1a1a]"
 >
 Reset Filters
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>

 </div>
 </div>
 );
}
