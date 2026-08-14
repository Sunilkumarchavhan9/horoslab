import React from "react";
import { WidgetCard } from "./widget-card";
import { Globe2 } from "lucide-react";

interface GeoWidgetProps {
 title: string;
 data: { label: string; value: number }[];
 color?: string;
 className?: string;
}

export function GeoWidget({ title, data, color = "#0f52ff", className }: GeoWidgetProps) {
 const maxVal = Math.max(...data.map(d => d.value), 1);

 return (
 <WidgetCard title={title} className={className}>
 <div className="flex h-full min-h-[160px] gap-6 items-center">
 {/* Globe side */}
 <div className="w-[40%] flex items-center justify-center border-r border-[#f0f0f0]">
 <div className="size-24 rounded-full bg-card border border-border shadow-inner flex items-center justify-center relative overflow-hidden">
 <Globe2 className="size-16 text-[#e2e2e2]" strokeWidth={1} />
 {/* Minimal dot overlay to look like a map */}
 <div className="absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:8px_8px] opacity-30 mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]" />
 </div>
 </div>

 {/* List side */}
 <div className="flex-1 flex flex-col gap-3 py-2">
 {data.map((item, i) => (
 <div key={i} className="flex items-center w-full group">
 <div className="w-[45%] text-[12px] font-medium text-foreground truncate pr-2">
 {item.label}
 </div>
 <div className="flex-1 flex items-center pr-4">
 <div 
 className="h-[4px] rounded-full transition-all duration-500" 
 style={{ width: `${(item.value / maxVal) * 100}%`, backgroundColor: color }} 
 />
 </div>
 <div className="w-[10%] text-right text-[12px] text-muted-foreground font-medium">
 {item.value}
 </div>
 </div>
 ))}
 </div>
 </div>
 </WidgetCard>
 );
}
