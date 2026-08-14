import React from "react";
import { WidgetCard } from "./widget-card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface TimeseriesWidgetProps {
 title: string;
 data: Array<Record<string, unknown>>;
 series: { key: string; name: string; color: string }[];
 xAxisKey?: string;
 className?: string;
}

export function TimeseriesWidget({
 title,
 data,
 series,
 xAxisKey = "time",
 className
}: TimeseriesWidgetProps) {
 return (
 <WidgetCard title={title} className={className}>
 <div className="w-full h-full min-h-[300px] mt-2">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
 <XAxis 
 dataKey={xAxisKey} 
 axisLine={false} 
 tickLine={false} 
 tick={{ fontSize: 11, fill: '#888' }} 
 dy={10} 
 />
 <YAxis 
 axisLine={false} 
 tickLine={false} 
 tick={{ fontSize: 11, fill: '#888' }} 
 />
 <Tooltip
 contentStyle={{ borderRadius: '8px', border: '1px solid #e2e2e2', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }}
 itemStyle={{ fontSize: '12px', fontWeight: 500 }}
 labelStyle={{ color: '#888', marginBottom: '4px' }}
 />
 <Legend 
 iconType="circle" 
 wrapperStyle={{ fontSize: '12px', color: '#555', paddingTop: '20px' }}
 />
 {series.map((s) => (
 <Line 
 key={s.key} 
 type="monotone" 
 dataKey={s.key} 
 name={s.name} 
 stroke={s.color} 
 strokeWidth={2} 
 dot={false}
 activeDot={{ r: 4, strokeWidth: 0 }}
 isAnimationActive={false}
 />
 ))}
 </LineChart>
 </ResponsiveContainer>
 </div>
 </WidgetCard>
 );
}
