import React from "react";
import { 
 MissionTimelineWidget,
 LeaderboardWidget,
 InstitutionFunnelWidget,
 KpiSummaryWidget,
 InstitutionHealthWidget
} from "../widgets/specialized-widgets";

const KPI_DATA = [
 { time: 'Mon', value: 120 },
 { time: 'Tue', value: 140 },
 { time: 'Wed', value: 110 },
 { time: 'Thu', value: 180 },
 { time: 'Fri', value: 240 },
];

const EXECUTION_TIMELINE = [
 { time: "00:00", total: 120, completed: 80, review: 20, running: 20 },
 { time: "04:00", total: 150, completed: 100, review: 30, running: 20 },
 { time: "08:00", total: 450, completed: 300, review: 50, running: 100 },
 { time: "12:00", total: 600, completed: 420, review: 80, running: 100 },
 { time: "16:00", total: 850, completed: 700, review: 100, running: 50 },
];

const PLANNER_PERFORMANCE = [
 { label: 'Agent Alpha', value: 98, color: '#4caf50' },
 { label: 'Agent Beta', value: 94, color: '#8bc34a' },
 { label: 'Agent Gamma', value: 88, color: '#cddc39' },
 { label: 'Agent Delta', value: 82, color: '#ffeb3b' },
 { label: 'Agent Epsilon', value: 75, color: '#ffc107' },
];

const EXECUTION_BOTTLENECKS = [
 { value: 1000, name: 'Tasks Created', fill: '#2196f3' },
 { value: 850, name: 'Planner Assigned', fill: '#03a9f4' },
 { value: 700, name: 'Executor Started', fill: '#00bcd4' },
 { value: 650, name: 'Review Complete', fill: '#009688' },
 { value: 600, name: 'Final Approval', fill: '#4caf50' },
];

export function ExecutionOverviewDashboard() {
 return (
 <div className="w-full flex flex-col gap-6 p-6">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <KpiSummaryWidget 
 title="Total Tasks Executed" 
 value="1,240"
 data={KPI_DATA}
 className="col-span-1" 
 />
 <InstitutionHealthWidget 
 title="Runtime Efficiency" 
 value={95}
 className="col-span-1" 
 />
 <KpiSummaryWidget 
 title="Average Retries" 
 value="1.2"
 data={KPI_DATA.map(d => ({ ...d, value: 5 - d.value * 0.01 }))}
 className="col-span-1" 
 />
 <InstitutionHealthWidget 
 title="Reviewer Performance" 
 value={88}
 className="col-span-1" 
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <LeaderboardWidget 
 title="Planner Performance (Success Rate)" 
 data={PLANNER_PERFORMANCE}
 className="col-span-1 md:col-span-1" 
 />
 <InstitutionFunnelWidget 
 title="Execution Pipeline Bottlenecks" 
 data={EXECUTION_BOTTLENECKS}
 className="col-span-1 md:col-span-2" 
 />
 </div>

 <div className="grid grid-cols-1 gap-6">
 <MissionTimelineWidget 
 title="Execution Timeline" 
 data={EXECUTION_TIMELINE}
 className="col-span-1" 
 />
 </div>
 </div>
 );
}
