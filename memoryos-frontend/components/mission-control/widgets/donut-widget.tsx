import React from "react";
import { WidgetCard } from "./widget-card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DonutWidgetProps {
 title: string;
 data: { name: string; value: number; color: string }[];
 className?: string;
}

export function DonutWidget({ title, data, className }: DonutWidgetProps) {
 return (
 <WidgetCard title={title} className={className}>
 <div className="flex flex-col h-full">
 {/* Custom Legend */}
 <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6">
 {data.map((entry, index) => (
 <div key={`legend-${index}`} className="flex items-center gap-1.5">
 <div className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
 <span className="text-[12px] text-muted-foreground font-medium">{entry.name}</span>
 <span className="text-[12px] text-foreground font-semibold">{entry.value}</span>
 </div>
 ))}
 </div>
 
 {/* Chart */}
 <div className="flex-1 w-full min-h-[160px] flex items-center justify-center">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={data}
 cx="50%"
 cy="50%"
 innerRadius={60}
 outerRadius={80}
 paddingAngle={2}
 dataKey="value"
 stroke="none"
 isAnimationActive={false}
 >
 {data.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.color} />
 ))}
 </Pie>
 <Tooltip 
 contentStyle={{ borderRadius: '8px', border: '1px solid #e2e2e2', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }}
 itemStyle={{ fontSize: '12px', fontWeight: 500 }}
 />
 </PieChart>
 </ResponsiveContainer>
 </div>
 </div>
 </WidgetCard>
 );
}
