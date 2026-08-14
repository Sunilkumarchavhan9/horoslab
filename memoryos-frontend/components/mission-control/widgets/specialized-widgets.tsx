import React from "react";
import { WidgetCard } from "./widget-card";
import { 
 Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, 
 BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, Sankey, FunnelChart, 
 Funnel, LabelList, ScatterChart, Scatter, ZAxis, Treemap, RadialBarChart, 
 RadialBar, ComposedChart, Radar, RadarChart, PolarGrid, PolarAngleAxis, 
 PolarRadiusAxis, SunburstChart, ReferenceLine, Label, Brush,
 type SankeyData,
 type SankeyLinkProps,
 type SankeyNodeProps,
 type SunburstData,
 type TreemapNode,
} from 'recharts';

interface BaseWidgetProps {
 title: string;
 className?: string;
 data?: unknown;
}

// 1. Verification Percentage (RadialBar)
export function VerificationPercentageWidget({ title, className, data = [{ name: 'Score', value: 100, fill: '#4caf50' }] }: BaseWidgetProps) {
 const chartData = data as Array<{ name: string; value: number; fill?: string }>;
 return (
 <WidgetCard title={title} className={className}>
 <div className="w-full h-full min-h-[160px] flex items-center justify-center relative">
 <div className="absolute inset-0 flex items-center justify-center flex-col">
 <span className="text-3xl font-semibold text-foreground">{chartData[0]?.value}%</span>
 <span className="text-xs text-muted-foreground">Validation Score</span>
 </div>
 <ResponsiveContainer width="100%" height="100%">
 <RadialBarChart innerRadius="150%" outerRadius="200%" data={chartData} startAngle={180} endAngle={0}>
 <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#f5f5f5' }} />
 </RadialBarChart>
 </ResponsiveContainer>
 </div>
 </WidgetCard>
 );
}

// 2. Institution Health (Progress Bar)
export function InstitutionHealthWidget({ title, className, value = 98 }: BaseWidgetProps & { value?: number }) {
 return (
 <WidgetCard title={title} className={className}>
 <div className="w-full h-full min-h-[120px] flex flex-col justify-center px-6">
 <div className="flex items-baseline gap-2 mb-4">
 <span className="text-4xl font-bold text-foreground">{value}</span>
 <span className="text-sm font-medium text-muted-foreground">/ 100 System Health</span>
 </div>
 <div className="w-full h-2 bg-card rounded-full overflow-hidden">
 <div className="h-full bg-green-500 rounded-full" style={{ width: `${value}%` }} />
 </div>
 </div>
 </WidgetCard>
 );
}

// 3. KPI Summary (Sparkline Area)
export function KpiSummaryWidget({ title, className, value = "2,405", data }: BaseWidgetProps & { value?: string }) {
 const chartData = (data ?? []) as Array<{ value: number }>;
 return (
 <WidgetCard title={title} className={className}>
 <div className="w-full h-full min-h-[160px] flex flex-col justify-between">
 <div className="px-6 pt-4">
 <span className="text-3xl font-bold text-foreground">{value}</span>
 <span className="text-xs font-medium text-green-600 ml-2">↑ 12%</span>
 </div>
 <div className="w-full h-[80px]">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
 <Area type="monotone" dataKey="value" stroke="#2196f3" fill="#2196f3" fillOpacity={0.1} strokeWidth={2} />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>
 </WidgetCard>
 );
}

// 4. Mission Timeline (ComposedChart)
export function MissionTimelineWidget({ title, className, data }: BaseWidgetProps) {
 const chartData = (data ?? []) as Array<Record<string, unknown>>;
 return (
 <WidgetCard title={title} className={className}>
 <div className="w-full h-full min-h-[300px] mt-2">
 <ResponsiveContainer width="100%" height="100%">
 <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
 <defs>
 <linearGradient id="colorTimeline" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#2196f3" stopOpacity={0.2}/>
 <stop offset="95%" stopColor="#2196f3" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
 <XAxis dataKey="time" axisLine={{ stroke: '#e2e2e2' }} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} dy={10} minTickGap={30} />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
 <Tooltip contentStyle={{ borderRadius: "6px", fontSize: "11px" }} />
 <Area type="monotone" dataKey="total" fill="url(#colorTimeline)" stroke="none" name="Total Activity" />
 <Bar dataKey="completed" barSize={12} fill="#ffb300" radius={[2, 2, 0, 0]} name="Completed" />
 <Line type="monotone" dataKey="review" stroke="#e91e63" strokeWidth={3} dot={{ r: 4, fill: "#fff" }} name="Waiting Review" />
 <Line type="step" dataKey="running" stroke="#2196f3" strokeWidth={2} dot={false} name="Running" />
 </ComposedChart>
 </ResponsiveContainer>
 </div>
 </WidgetCard>
 );
}

// 5. Institution Comparison (Bar with Target Line)
export function InstitutionComparisonWidget({ title, className, data }: BaseWidgetProps) {
 const chartData = (data ?? []) as Array<Record<string, unknown>>;
 return (
 <WidgetCard title={title} className={className}>
 <div className="w-full h-full min-h-[300px] mt-2">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={chartData} margin={{ top: 30, right: 10, left: -20, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e2e2" />
 <XAxis dataKey="time" axisLine={{ stroke: '#e2e2e2' }} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} dy={10} />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
 <Tooltip contentStyle={{ borderRadius: "6px", fontSize: "11px" }} />
 <ReferenceLine y={40} stroke="#e91e63" strokeDasharray="3 3">
 <Label value="Target Goal (40)" position="top" fill="#e91e63" fontSize={11} fontWeight={500} />
 </ReferenceLine>
 <Bar dataKey="pass" stackId="a" fill="#2196f3" name="PASS" />
 <Bar dataKey="fail" stackId="a" fill="#ffb300" name="FAIL" />
 <Bar dataKey="review" stackId="a" fill="#e91e63" name="Review" radius={[2, 2, 0, 0]} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </WidgetCard>
 );
}

// 6. Mission State Trends (Stacked Area)
export function MissionStateTrendsWidget({ title, className, data }: BaseWidgetProps) {
 const chartData = (data ?? []) as Array<Record<string, unknown>>;
 return (
 <WidgetCard title={title} className={className}>
 <div className="w-full h-full min-h-[300px] mt-2">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e2e2" />
 <XAxis dataKey="time" axisLine={{ stroke: '#e2e2e2' }} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} dy={10} />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
 <Tooltip contentStyle={{ borderRadius: "6px", fontSize: "11px" }} />
 <Area type="monotone" dataKey="pass" stackId="1" stroke="#2196f3" fill="#2196f3" fillOpacity={0.6} name="PASS" />
 <Area type="monotone" dataKey="fail" stackId="1" stroke="#ffb300" fill="#ffb300" fillOpacity={0.6} name="FAIL" />
 <Area type="monotone" dataKey="review" stackId="1" stroke="#e91e63" fill="#e91e63" fillOpacity={0.6} name="Review" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </WidgetCard>
 );
}

// 7. Leaderboard (Horizontal Bar with Labels)
export function LeaderboardWidget({ title, className, data }: BaseWidgetProps) {
 const rows = (data ?? []) as Array<{ label: string; value: number; color?: string }>;
 return (
 <WidgetCard title={title} className={className}>
 <div className="w-full h-full min-h-[300px] mt-2">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart layout="vertical" data={rows} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
 <XAxis type="number" hide />
 <YAxis type="category" dataKey="label" hide />
 <Tooltip contentStyle={{ borderRadius: "6px", fontSize: "11px" }} />
 <Bar dataKey="value" barSize={16} radius={[0, 4, 4, 0]}>
 <LabelList dataKey="label" position="insideLeft" fill="#fff" fontSize={11} fontWeight={600} />
 <LabelList dataKey="value" position="right" fill="#333" fontSize={11} fontWeight={600} />
 {rows.map((entry, index: number) => (
 <Cell key={`cell-${index}`} fill={entry.color || '#2196f3'} />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </div>
 </WidgetCard>
 );
}

// 8. Mission Status Distribution (Donut Pie)
export function MissionStatusPieWidget({ title, className, data }: BaseWidgetProps) {
 const rows = (data ?? []) as Array<{ label: string; value: number; color: string }>;
 return (
 <WidgetCard title={title} className={className}>
 <div className="w-full h-full min-h-[300px] mt-2">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Tooltip contentStyle={{ borderRadius: "6px", fontSize: "11px" }} />
 <Pie data={rows} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" nameKey="label" stroke="none">
 {rows.map((entry, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
 </Pie>
 </PieChart>
 </ResponsiveContainer>
 </div>
 </WidgetCard>
 );
}

// 9. Evidence Sources (Solid Pie)
export function EvidenceSourcesWidget({ title, className, data }: BaseWidgetProps) {
 const rows = (data ?? []) as Array<{ label: string; value: number; color: string }>;
 return (
 <WidgetCard title={title} className={className}>
 <div className="w-full h-full min-h-[300px] mt-2">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Tooltip contentStyle={{ borderRadius: "6px", fontSize: "11px" }} />
 <Pie data={rows} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="label" stroke="#fff" strokeWidth={2}>
 <LabelList dataKey="label" position="inside" fill="#fff" fontSize={10} fontWeight={600} />
 {rows.map((entry, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
 </Pie>
 </PieChart>
 </ResponsiveContainer>
 </div>
 </WidgetCard>
 );
}

// 10. Authority Access (Radar)
export function AuthorityRadarWidget({ title, className, data }: BaseWidgetProps) {
 const chartData = (data ?? []) as Array<Record<string, unknown>>;
 return (
 <WidgetCard title={title} className={className}>
 <div className="w-full h-full min-h-[300px] mt-2">
 <ResponsiveContainer width="100%" height="100%">
 <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
 <PolarGrid stroke="#e2e2e2" />
 <PolarAngleAxis dataKey="name" tick={{ fill: '#555', fontSize: 10, fontWeight: 500 }} />
 <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
 <Radar name="Usage" dataKey="value" stroke="#2196f3" fill="#2196f3" fillOpacity={0.4} />
 <Tooltip contentStyle={{ borderRadius: "6px", fontSize: "11px" }} />
 </RadarChart>
 </ResponsiveContainer>
 </div>
 </WidgetCard>
 );
}

// 11. Authority Decisions (Biaxial Composed Bar)
export function AuthorityDecisionsWidget({ title, className, data }: BaseWidgetProps) {
 const chartData = (data ?? []) as Array<Record<string, unknown>>;
 return (
 <WidgetCard title={title} className={className}>
 <div className="w-full h-full min-h-[300px] mt-2">
 <ResponsiveContainer width="100%" height="100%">
 <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e2e2" />
 <XAxis dataKey="time" axisLine={{ stroke: '#e2e2e2' }} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} dy={10} />
 <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
 <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
 <Tooltip contentStyle={{ borderRadius: "6px", fontSize: "11px" }} />
 <Bar yAxisId="left" dataKey="approved" fill="#4caf50" name="Approved" barSize={12} radius={[2, 2, 0, 0]} />
 <Bar yAxisId="right" dataKey="denied" fill="#f44336" name="Denied" barSize={12} radius={[2, 2, 0, 0]} />
 </ComposedChart>
 </ResponsiveContainer>
 </div>
 </WidgetCard>
 );
}

// 12. Policy Violations (Scatter 3D)
export function PolicyViolationsWidget({ title, className, data }: BaseWidgetProps) {
 const chartData = (data ?? []) as Array<Record<string, unknown>>;
 return (
 <WidgetCard title={title} className={className}>
 <div className="w-full h-full min-h-[300px] mt-2">
 <ResponsiveContainer width="100%" height="100%">
 <ScatterChart margin={{ top: 20, right: 20, bottom: 0, left: -20 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="#e2e2e2" />
 <XAxis dataKey="severity" type="number" name="Severity" axisLine={{ stroke: '#e2e2e2' }} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} dy={10} />
 <YAxis dataKey="frequency" type="number" name="Frequency" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
 <ZAxis dataKey="impact" type="number" range={[20, 200]} name="Impact" />
 <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: "6px", fontSize: "11px" }} />
 <Scatter name="Violations" data={chartData} fill="#e91e63" opacity={0.6} />
 </ScatterChart>
 </ResponsiveContainer>
 </div>
 </WidgetCard>
 );
}

// 13. Mission Breakdown (Treemap)
export function MissionTreemapWidget({ title, className, data }: BaseWidgetProps) {
 const rows = (data ?? []) as Array<Record<string, unknown>>;
 return (
 <WidgetCard title={title} className={className}>
 <div className="w-full h-full min-h-[300px] mt-2">
 <ResponsiveContainer width="100%" height="100%">
 <Treemap
 data={rows}
 dataKey="size"
 aspectRatio={4 / 3}
 stroke="#fff"
 fill="#8884d8"
 content={({ x, y, width, height, name, fill }: TreemapNode) => {
 if (!name) return <g />;
 return (
 <g>
 <rect x={x} y={y} width={width} height={height} fill={fill as string | undefined} stroke="#fff" />
 {width > 30 && height > 30 && (
 <text x={x + 4} y={y + 14} fontSize={10} fill="#fff">{name}</text>
 )}
 </g>
 );
 }}
 >
 <Tooltip contentStyle={{ borderRadius: "6px", fontSize: "11px" }} />
 </Treemap>
 </ResponsiveContainer>
 </div>
 </WidgetCard>
 );
}

// 14. Verification Breakdown (Sunburst)
export function VerificationSunburstWidget({ title, className, data }: BaseWidgetProps) {
 const tree = data as SunburstData;
 return (
 <WidgetCard title={title} className={className}>
 <div className="w-full h-full min-h-[300px] mt-2">
 <ResponsiveContainer width="100%" height="100%">
 <SunburstChart startAngle={90} endAngle={270} data={tree}>
 <Tooltip contentStyle={{ borderRadius: "6px", fontSize: "11px" }} />
 </SunburstChart>
 </ResponsiveContainer>
 </div>
 </WidgetCard>
 );
}

// 15. Top Institutions (Brush Bar)
export function TopInstitutionsBrushWidget({ title, className, data }: BaseWidgetProps) {
 const chartData = (data ?? []) as Array<Record<string, unknown>>;
 return (
 <WidgetCard title={title} className={className}>
 <div className="w-full h-full min-h-[300px] mt-2">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e2e2" />
 <XAxis dataKey="time" axisLine={{ stroke: '#e2e2e2' }} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} dy={10} minTickGap={30} />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#888" }} />
 <Tooltip contentStyle={{ borderRadius: "6px", fontSize: "11px" }} />
 <Brush dataKey="time" height={20} stroke="#e2e2e2" fill="#f9f9f9" tickFormatter={() => ''} />
 <Bar dataKey="pass" fill="#2196f3" radius={[2, 2, 0, 0]} name="Running" />
 <Bar dataKey="fail" fill="#ffb300" radius={[2, 2, 0, 0]} name="Completed" />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </WidgetCard>
 );
}

// 16. Mission Flow (Sankey)
export function MissionSankeyWidget({ title, className, data }: BaseWidgetProps) {
 const sankeyData = data as SankeyData;
 return (
 <WidgetCard title={title} className={className}>
 <div className="w-full h-full min-h-[300px] mt-2">
 <ResponsiveContainer width="100%" height="100%">
 <Sankey
 data={sankeyData}
 node={({ x, y, width, height, payload }: SankeyNodeProps) => {
 const nodePayload = payload as { fill?: string; name?: string };
 const isRight = x > 100;
 return (
 <g>
 <rect x={x} y={y} width={width} height={height} fill={nodePayload.fill || "#2196f3"} />
 <text x={isRight ? x + width + 8 : x + 8} y={y + height / 2} dy={4} fontSize={11} fill="#555">{nodePayload.name}</text>
 </g>
 );
 }}
 link={({ sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, payload }: SankeyLinkProps) => {
 const linkPayload = payload as { fill?: string };
 return (
 <path
 d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
 stroke={linkPayload.fill || "#2196f3"} strokeWidth={Math.max(linkWidth, 1)} strokeOpacity={0.4} fill="none"
 />
 );
 }}
 nodePadding={20} margin={{ left: 20, right: 100, top: 20, bottom: 20 }}
 >
 <Tooltip contentStyle={{ borderRadius: "6px", fontSize: "11px" }} />
 </Sankey>
 </ResponsiveContainer>
 </div>
 </WidgetCard>
 );
}

// 17. Institution Runtime Flow (Funnel)
export function InstitutionFunnelWidget({ title, className, data }: BaseWidgetProps) {
 const chartData = (data ?? []) as Array<Record<string, unknown>>;
 return (
 <WidgetCard title={title} className={className}>
 <div className="w-full h-full min-h-[300px] mt-2">
 <ResponsiveContainer width="100%" height="100%">
 <FunnelChart>
 <Tooltip contentStyle={{ borderRadius: "6px", fontSize: "11px" }} />
 <Funnel dataKey="value" data={chartData} isAnimationActive>
 <LabelList position="right" fill="#333" stroke="none" dataKey="name" fontSize={11} fontWeight={500} />
 </Funnel>
 </FunnelChart>
 </ResponsiveContainer>
 </div>
 </WidgetCard>
 );
}
