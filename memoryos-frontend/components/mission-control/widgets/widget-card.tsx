import React from "react";
import { cn } from "@/lib/utils";
import { Bookmark, Globe, ChevronDown, MoreHorizontal } from "lucide-react";

interface WidgetCardProps {
 title: string;
 children: React.ReactNode;
 className?: string;
 hideHeaderControls?: boolean;
}

export function WidgetCard({ title, children, className, hideHeaderControls = false }: WidgetCardProps) {
 return (
 <div className={cn("flex flex-col bg-card border border-border rounded-md overflow-hidden", className)}>
 <div className="flex items-center justify-between px-6 py-3 border-b border-transparent group hover:border-[#f0f0f0]">
 <h3 className="text-[13px] font-medium text-foreground truncate pr-4">{title}</h3>
 
 {!hideHeaderControls && (
 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
 <button className="flex items-center gap-1 h-6 px-1.5 hover:bg-accent rounded text-muted-foreground transition-colors">
 <Globe className="size-3.5" />
 <ChevronDown className="size-3" />
 </button>
 <button className="flex items-center justify-center size-6 hover:bg-accent rounded text-muted-foreground transition-colors">
 <Bookmark className="size-3.5" />
 </button>
 <button className="flex items-center justify-center size-6 hover:bg-accent rounded text-muted-foreground transition-colors">
 <MoreHorizontal className="size-3.5" />
 </button>
 </div>
 )}
 </div>
 <div className="flex-1 flex flex-col p-6 pt-2">
 {children}
 </div>
 </div>
 );
}
