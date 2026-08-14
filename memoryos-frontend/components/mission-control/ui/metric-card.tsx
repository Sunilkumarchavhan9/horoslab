import React from "react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { HoverLift } from "./animations";

export type MetricCardProps = {
 title: string;
 value: string;
 trend: "up" | "down" | "neutral";
 trendValue: string;
 data: number[]; // simple array of numbers for the sparkline
 className?: string;
};

export function MetricCard({
 title,
 value,
 trend,
 trendValue,
 data,
 className = "",
}: MetricCardProps) {
 const chartData = data.map((val, i) => ({ val, i }));
 const trendColor = trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-foreground/40 dark:text-white/40";
 const strokeColor = trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : "#999";

 return (
 <HoverLift className={`group relative w-full bg-card dark:bg-[#121212] border border-border dark:border-white/10 rounded-[6px] overflow-hidden flex flex-col ${className}`}>
 <div className="p-6 flex-1">
 <h4 className="text-[12px] font-medium text-foreground/50 dark:text-white/50 mb-1">{title}</h4>
 <div className="flex items-end gap-3">
 <span className="text-2xl font-bold text-foreground dark:text-white leading-none tracking-tight">{value}</span>
 <span className={`text-[11px] font-semibold mb-0.5 ${trendColor}`}>{trendValue}</span>
 </div>
 </div>
 <div className="h-[50px] w-full mt-auto opacity-100">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
 <defs>
 <linearGradient id={`color-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3}/>
 <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
 </linearGradient>
 </defs>
 <Area 
 type="monotone" 
 dataKey="val" 
 stroke={strokeColor} 
 strokeWidth={2}
 fillOpacity={1} 
 fill={`url(#color-${title.replace(/\s+/g, '')})`} 
 isAnimationActive={false}
 />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </HoverLift>
 );
}
