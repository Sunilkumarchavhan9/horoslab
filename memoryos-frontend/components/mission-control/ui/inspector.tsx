import React from "react";
import { Info, Settings2 } from "lucide-react";
import { JSONViewerPanel } from "./json-viewer";

export function Inspector({ 
 title, 
 subtitle, 
 data 
}: { 
 title: string, 
 subtitle?: string, 
 data: any 
}) {
 return (
 <div className="w-full bg-card border border-border rounded-[6px] overflow-hidden flex flex-col h-full">
 <div className="px-6 py-3 border-b border-border flex items-center justify-between bg-black/[0.01]">
 <div className="flex items-center gap-2">
 <Settings2 className="size-4 text-foreground/60" />
 <span className="font-semibold text-[13px] text-foreground">{title}</span>
 </div>
 {subtitle && <span className="text-[11px] font-mono text-foreground/40">{subtitle}</span>}
 </div>
 <div className="flex-1 overflow-y-auto p-6 bg-black/[0.01] shadow-inner">
 <JSONViewerPanel data={data} name="properties" />
 </div>
 </div>
 );
}
