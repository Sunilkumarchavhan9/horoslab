"use client";

import { Search, Clock, Filter, Maximize, Command, Rocket } from "lucide-react";
import { useMissionStore } from "../runtime/store";
import { GlobalMissionRegistry } from "../runtime/MissionRegistry";
import {
 DropdownMenu,
 DropdownMenuTrigger,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuCheckboxItem,
 DropdownMenuSeparator,
} from "../../../components/ui/dropdown-menu";

export function MissionToolbar() {
 const { currentView, setView, searchQuery, setSearchQuery, timeRange, setTimeRange, filters, setFilter } = useMissionStore();
 const views = GlobalMissionRegistry.getAll();

 return (
 <div className="h-14 border-b border-border flex items-center px-4 bg-card shrink-0 justify-between">
 <div className="flex items-center gap-6">
 <div className="flex items-center gap-2">
 <Rocket className="size-5 text-foreground/80" />
 <span className="font-semibold text-[14px]">Missions Runtime</span>
 </div>

 {/* View Switcher Segmented Control */}
 <div className="flex bg-muted p-1 rounded-md">
 {views.map(view => (
 <button
 key={view.id}
 onClick={() => setView(view.id)}
 className={`px-3 py-1 text-[12px] font-medium rounded-md transition-all ${currentView === view.id ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground/90'}`}
 >
 {view.title}
 </button>
 ))}
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="relative group">
 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
 <input
 type="text"
 placeholder="Search..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="h-8 pl-8 pr-12 w-48 bg-muted rounded-md text-[13px] outline-none focus:bg-card focus:ring-1 focus:ring-black/20 transition-all placeholder:text-muted-foreground"
 />
 <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none opacity-50 group-focus-within:opacity-100 transition-opacity">
 <Command className="size-[10px]" />
 <span className="text-[10px] font-medium">K</span>
 </div>
 </div>
 
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-black/10 rounded-md text-[13px] font-medium transition-colors text-muted-foreground">
 <Clock className="size-3.5" />
 {timeRange === 'live' ? 'Live' : timeRange === '1h' ? 'Last 1h' : timeRange === '24h' ? 'Last 24h' : 'Last 7d'}
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-40">
 <DropdownMenuItem onClick={() => setTimeRange('live')}>Live</DropdownMenuItem>
 <DropdownMenuItem onClick={() => setTimeRange('1h')}>Last 1h</DropdownMenuItem>
 <DropdownMenuItem onClick={() => setTimeRange('24h')}>Last 24h</DropdownMenuItem>
 <DropdownMenuItem onClick={() => setTimeRange('7d')}>Last 7d</DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>

 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-black/10 rounded-md text-[13px] font-medium transition-colors text-muted-foreground">
 <Filter className="size-3.5" />
 Filter
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-48">
 <DropdownMenuCheckboxItem 
 checked={filters['healthy'] ?? true} 
 onCheckedChange={(c) => setFilter('healthy', c as boolean)}
 >
 Healthy Systems
 </DropdownMenuCheckboxItem>
 <DropdownMenuCheckboxItem 
 checked={filters['warning'] ?? true} 
 onCheckedChange={(c) => setFilter('warning', c as boolean)}
 >
 Warnings
 </DropdownMenuCheckboxItem>
 <DropdownMenuCheckboxItem 
 checked={filters['critical'] ?? true} 
 onCheckedChange={(c) => setFilter('critical', c as boolean)}
 >
 Critical Incidents
 </DropdownMenuCheckboxItem>
 <DropdownMenuSeparator />
 <DropdownMenuItem onClick={() => {
 setFilter('healthy', true);
 setFilter('warning', true);
 setFilter('critical', true);
 }}>
 Reset Filters
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 <button className="flex items-center justify-center p-1.5 bg-muted hover:bg-black/10 rounded-md transition-colors text-muted-foreground">
 <Maximize className="size-3.5" />
 </button>
 </div>
 </div>
 );
}
