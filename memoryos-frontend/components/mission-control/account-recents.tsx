"use client";

import { useState } from "react";
import { History, Filter, MoreHorizontal, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type RecentItem = {
 id: string;
 title: string;
 sub: string;
 timestamp: number;
};

function filterTriggerClassName(active: boolean): string {
 return cn(
 "h-10 px-6 rounded-md border bg-card text-[13px] font-medium text-foreground/90 hover:bg-card flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors select-none whitespace-nowrap",
 active ? "border-[#0f52ff] bg-[#eef4ff] text-[#0f52ff]" : "border-border"
 );
}

function filterContentClassName(widthClass = "w-[220px]"): string {
 return cn(
 "z-50 rounded-md border border-border bg-card p-2 shadow-[0_12px_30px_rgba(0,0,0,0.1)]",
 widthClass
 );
}

export function AccountRecents({ items }: { items: RecentItem[] }) {
 const [searchQuery, setSearchQuery] = useState("");
 const [institutionFilter, setInstitutionFilter] = useState("all");
 const [missionTypeFilter, setMissionTypeFilter] = useState("all");
 const [resultFilter, setResultFilter] = useState("all");
 const [dateFilter, setDateFilter] = useState("all");

 const formatTime = (ts: number) => {
 const date = new Date(ts);
 return date.toLocaleString([], {
 month: "short",
 day: "numeric",
 hour: "numeric",
 minute: "2-digit",
 });
 };

 const filteredItems = items.filter((item) => {
 const q = searchQuery.toLowerCase();
 if (!q) return true;
 return item.title.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q);
 });

 return (
 <div className="w-full flex flex-col pt-2 font-sans">
 <div className="flex flex-wrap items-center justify-between gap-6 mb-5 px-2">
 <div className="flex items-center gap-2 text-[14px]">
 <History className="size-4 text-muted-foreground" />
 <span className="text-muted-foreground font-medium">Recents</span>
 </div>
 </div>

 <div className="px-2 mb-6">
 <div className="relative z-20 pointer-events-auto rounded-md border border-border bg-card px-6 py-6 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
 <div className="flex flex-col xl:flex-row xl:items-center gap-3">
 <div className="relative flex-1 min-w-[260px] pointer-events-auto">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
 <input
 type="text"
 placeholder="Search..."
 value={searchQuery}
 onChange={(event) => setSearchQuery(event.target.value)}
 className="w-full bg-card border border-border rounded-md pl-9 pr-4 py-2 text-[14px] focus:outline-none focus:border-[#0f52ff] focus:ring-1 focus:ring-[#0f52ff] pointer-events-auto"
 />
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button
 type="button"
 className={filterTriggerClassName(institutionFilter !== "all")}
 >
 <span>{institutionFilter === "all" ? "Institution" : institutionFilter}</span>
 <ChevronDown className="size-3.5 text-muted-foreground" />
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="start" className={filterContentClassName("w-[240px]")}>
 <DropdownMenuItem
 onSelect={() => setInstitutionFilter("all")}
 className={cn("rounded-md px-3 py-2 text-[13px]", institutionFilter === "all" && "bg-[#eef4ff] text-[#0f52ff]")}
 >
 All Institutions
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>

 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button
 type="button"
 className={filterTriggerClassName(missionTypeFilter !== "all")}
 >
 <span>{missionTypeFilter === "all" ? "Mission Type" : missionTypeFilter}</span>
 <ChevronDown className="size-3.5 text-muted-foreground" />
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="start" className={filterContentClassName("w-[260px]")}>
 <DropdownMenuItem
 onSelect={() => setMissionTypeFilter("all")}
 className={cn("rounded-md px-3 py-2 text-[13px]", missionTypeFilter === "all" && "bg-[#eef4ff] text-[#0f52ff]")}
 >
 All Mission Types
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>

 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button
 type="button"
 className={filterTriggerClassName(resultFilter !== "all")}
 >
 <span>{resultFilter === "all" ? "Result" : resultFilter}</span>
 <ChevronDown className="size-3.5 text-muted-foreground" />
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="start" className={filterContentClassName("w-[190px]")}>
 <DropdownMenuItem
 onSelect={() => setResultFilter("all")}
 className={cn("rounded-md px-3 py-2 text-[13px]", resultFilter === "all" && "bg-[#eef4ff] text-[#0f52ff]")}
 >
 All Results
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>

 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button
 type="button"
 className={filterTriggerClassName(dateFilter !== "all")}
 >
 <span>{dateFilter === "all" ? "Date added" : dateFilter}</span>
 <ChevronDown className="size-3.5 text-muted-foreground" />
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="start" className={filterContentClassName("w-[220px]")}>
 <DropdownMenuItem
 onSelect={() => setDateFilter("all")}
 className={cn("rounded-md px-3 py-2 text-[13px]", dateFilter === "all" && "bg-[#eef4ff] text-[#0f52ff]")}
 >
 All Dates
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>

 <button
 type="button"
 onClick={() => {
 setSearchQuery("");
 setInstitutionFilter("all");
 setMissionTypeFilter("all");
 setResultFilter("all");
 setDateFilter("all");
 }}
 className="h-10 px-6 rounded-md bg-card text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-card flex items-center gap-2 transition-colors select-none whitespace-nowrap ml-1"
 >
 <Filter className="size-3.5" />
 Reset
 </button>
 </div>
 </div>
 </div>
 </div>

 <div className="w-full overflow-hidden border border-border bg-card rounded-md mx-2 ">
 <table className="w-full text-left border-collapse min-w-[600px]">
 <thead className="border-b border-border bg-muted/50">
 <tr>
 <th className="px-6 py-3 text-[12px] font-semibold text-foreground/55">Page</th>
 <th className="px-6 py-3 text-[12px] font-semibold text-foreground/55">Category</th>
 <th className="px-6 py-3 text-[12px] font-semibold text-foreground/55">Time accessed</th>
 <th className="px-6 py-3 w-10"></th>
 </tr>
 </thead>
 <tbody>
 {filteredItems.length > 0 ? (
 filteredItems.map((item) => (
 <tr key={`${item.id}-${item.timestamp}`} className="border-b border-border last:border-0 hover:bg-black/[0.015]">
 <td className="px-6 py-3 text-[13.5px] font-medium text-foreground">{item.title}</td>
 <td className="px-6 py-3 text-[13px] text-foreground/60">{item.sub}</td>
 <td className="px-6 py-3 text-[13px] text-foreground/60">{formatTime(item.timestamp)}</td>
 <td className="px-6 py-3 text-right">
 <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-foreground/40 hover:text-foreground">
 <MoreHorizontal className="size-4" />
 </Button>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={4} className="px-6 py-12 text-center text-foreground/45">
 No recent activity found. Navigate around to see your history.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 );
}
