import React from "react";
import { WidgetCard } from "./widget-card";

interface HorizontalBarWidgetProps {
 title: string;
 data: { label: string; value: number }[];
 color?: string;
 className?: string;
}

export function HorizontalBarWidget({ title, data, color = "#0f52ff", className }: HorizontalBarWidgetProps) {
 // Find max value to calculate percentage width for bars
 const maxVal = Math.max(...data.map(d => d.value), 1);

 return (
 <WidgetCard title={title} className={className}>
 <div className="flex flex-col gap-6 w-full h-full">
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
 <div className="w-[15%] text-right text-[12px] text-muted-foreground font-medium">
 {item.value}
 </div>
 </div>
 ))}
 </div>
 </WidgetCard>
 );
}
