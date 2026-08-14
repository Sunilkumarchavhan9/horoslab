import React from "react";
import { WidgetCard } from "./widget-card";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { ArrowDown, ArrowUp } from "lucide-react";

interface SparklineWidgetProps {
 title: string;
 value: string | number;
 change?: number; // percentage change
 changeDirection?: "up" | "down";
 data: number[];
 color?: string;
 className?: string;
}

export function SparklineWidget({ 
 title, 
 value, 
 change, 
 changeDirection,
 data, 
 color = "#0f52ff",
 className 
}: SparklineWidgetProps) {
 const chartData = data.map((v, i) => ({ value: v, index: i }));
 
 return (
 <WidgetCard title={title} className={className}>
 <div className="flex flex-col h-full justify-between">
 <div className="flex items-baseline gap-2 mb-4">
 <span className="text-[24px] font-semibold text-foreground">{value}</span>
 {change !== undefined && (
 <span className={`text-[12px] font-medium flex items-center ${changeDirection === 'down' ? 'text-red-500' : 'text-emerald-500'}`}>
 {changeDirection === 'down' ? <ArrowDown className="size-3 mr-0.5" /> : <ArrowUp className="size-3 mr-0.5" />}
 {Math.abs(change)}%
 </span>
 )}
 </div>
 
 <div className="h-[40px] w-full mt-auto">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
 <defs>
 <linearGradient id={`gradient-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor={color} stopOpacity={0.2} />
 <stop offset="95%" stopColor={color} stopOpacity={0} />
 </linearGradient>
 </defs>
 <Area 
 type="monotone" 
 dataKey="value" 
 stroke={color} 
 strokeWidth={1.5}
 fillOpacity={1} 
 fill={`url(#gradient-${title.replace(/\s+/g, '')})`} 
 isAnimationActive={false}
 />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>
 </WidgetCard>
 );
}
