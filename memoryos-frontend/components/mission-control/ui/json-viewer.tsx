import React, { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

export function JSONViewerPanel({ data, name = "root" }: { data: any, name?: string }) {
 const [expanded, setExpanded] = useState(true);
 const isObject = data !== null && typeof data === 'object';
 const isArray = Array.isArray(data);
 const isEmpty = isObject && Object.keys(data).length === 0;

 if (!isObject) {
 let colorClass = "text-[#0f52ff]"; // string
 if (typeof data === 'number') colorClass = "text-emerald-600";
 if (typeof data === 'boolean') colorClass = "text-amber-600";
 
 return (
 <div className="pl-4 font-mono text-[12px] whitespace-nowrap">
 <span className="text-foreground/60 mr-1">{name}:</span>
 <span className={colorClass}>{JSON.stringify(data)}</span>
 </div>
 );
 }

 return (
 <div className="font-mono text-[12px]">
 <div 
 className="flex items-center cursor-pointer hover:bg-muted/50 py-0.5 rounded px-1 select-none w-fit"
 onClick={() => setExpanded(!expanded)}
 >
 <span className="w-4 flex items-center justify-center mr-0.5 text-foreground/40">
 {!isEmpty && (expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />)}
 </span>
 <span className="text-foreground/70 font-medium mr-1">{name}:</span>
 <span className="text-foreground/40">{isArray ? '[' : '{'}</span>
 {!expanded && !isEmpty && <span className="text-foreground/40 px-1">...</span>}
 {!expanded && <span className="text-foreground/40">{isArray ? ']' : '}'}</span>}
 {isEmpty && <span className="text-foreground/40">{isArray ? ']' : '}'}</span>}
 </div>
 
 {expanded && !isEmpty && (
 <div className="pl-4 border-l border-border ml-2.5 my-0.5">
 {Object.entries(data).map(([key, val]) => (
 <JSONViewerPanel key={key} name={key} data={val} />
 ))}
 </div>
 )}
 
 {expanded && !isEmpty && (
 <div className="pl-1 text-foreground/40">
 {isArray ? ']' : '}'}
 </div>
 )}
 </div>
 );
}
