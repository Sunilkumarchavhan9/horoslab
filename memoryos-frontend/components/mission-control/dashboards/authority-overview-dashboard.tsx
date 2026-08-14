import React from "react";
import { 
 AuthorityDecisionsWidget,
 PolicyViolationsWidget,
 AuthorityRadarWidget,
 MissionStatusPieWidget,
 KpiSummaryWidget
} from "../widgets/specialized-widgets";

const DECISION_DATA = [
 { time: "Mon", approved: 120, denied: 15 },
 { time: "Tue", approved: 145, denied: 22 },
 { time: "Wed", approved: 110, denied: 8 },
 { time: "Thu", approved: 180, denied: 42 },
 { time: "Fri", approved: 240, denied: 56 },
 { time: "Sat", approved: 90, denied: 10 },
 { time: "Sun", approved: 60, denied: 5 },
];

const VIOLATIONS_DATA = [
 { severity: 1, frequency: 120, impact: 20 },
 { severity: 2, frequency: 80, impact: 40 },
 { severity: 3, frequency: 45, impact: 80 },
 { severity: 4, frequency: 12, impact: 140 },
 { severity: 5, frequency: 3, impact: 200 },
];

const RADAR_DATA = [
 { name: 'File Write', value: 85, fullMark: 100 },
 { name: 'Network', value: 65, fullMark: 100 },
 { name: 'Shell Exec', value: 45, fullMark: 100 },
 { name: 'API Call', value: 95, fullMark: 100 },
 { name: 'Data Read', value: 75, fullMark: 100 },
];

const APPROVAL_DATA = [
 { label: 'Auto-Approved', value: 650, color: '#4caf50' },
 { label: 'Human-Approved', value: 120, color: '#2196f3' },
 { label: 'Auto-Denied', value: 85, color: '#f44336' },
 { label: 'Human-Denied', value: 30, color: '#ff9800' },
];

const KPI_DATA = [
 { time: 'Mon', value: 120 },
 { time: 'Tue', value: 140 },
 { time: 'Wed', value: 110 },
 { time: 'Thu', value: 180 },
 { time: 'Fri', value: 240 },
];

export function AuthorityOverviewDashboard() {
 return (
 <div className="w-full flex flex-col gap-6 p-6">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <KpiSummaryWidget 
 title="Total Approvals" 
 value="8,405"
 data={KPI_DATA}
 className="col-span-1" 
 />
 <KpiSummaryWidget 
 title="Policy Violations" 
 value="142"
 data={KPI_DATA.map(d => ({ ...d, value: d.value * 0.1 }))}
 className="col-span-1" 
 />
 <KpiSummaryWidget 
 title="Blocked Actions" 
 value="56"
 data={KPI_DATA.map(d => ({ ...d, value: d.value * 0.05 }))}
 className="col-span-1" 
 />
 <KpiSummaryWidget 
 title="Human Reviews" 
 value="150"
 data={KPI_DATA.map(d => ({ ...d, value: d.value * 0.2 }))}
 className="col-span-1" 
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <AuthorityDecisionsWidget 
 title="Authority Decisions Timeline" 
 data={DECISION_DATA}
 className="col-span-1" 
 />
 <PolicyViolationsWidget 
 title="Policy Violations Analysis" 
 data={VIOLATIONS_DATA}
 className="col-span-1" 
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <AuthorityRadarWidget 
 title="Authority Action Types" 
 data={RADAR_DATA}
 className="col-span-1 md:col-span-1" 
 />
 <MissionStatusPieWidget 
 title="Approval Rate Distribution" 
 data={APPROVAL_DATA}
 className="col-span-1 md:col-span-2" 
 />
 </div>
 </div>
 );
}
