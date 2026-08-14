import React from "react";
import { Search } from "lucide-react";

export function SearchBar({ onOpenCommandPalette }: { onOpenCommandPalette?: () => void }) {
 return (
 <div 
 onClick={onOpenCommandPalette}
 className="flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-black/10 transition-colors rounded-[6px] border border-border cursor-text w-64 group"
 >
 <Search className="size-3.5 text-foreground/40 group-hover:text-foreground/60 transition-colors" />
 <span className="text-[13px] text-foreground/40 flex-1 select-none group-hover:text-foreground/60 transition-colors">Search...</span>
 <div className="flex items-center gap-0.5 text-[10px] font-semibold text-foreground/40 bg-card border border-border rounded-sm px-1.5 py-0.5 ">
 <span className="text-xs">⌘</span><span>K</span>
 </div>
 </div>
 );
}
