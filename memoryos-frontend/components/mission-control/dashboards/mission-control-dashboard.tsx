import React from "react";
import { 
 KpiSummaryWidget, 
 VerificationPercentageWidget,
 MissionTreemapWidget,
 MissionStateTrendsWidget,
 TopInstitutionsBrushWidget
} from "../widgets/specialized-widgets";

const MOCK_TIMELINE = [
 { time: "00:00", pass: 12, fail: 2, review: 8 },
 { time: "04:00", pass: 15, fail: 3, review: 10 },
 { time: "08:00", pass: 45, fail: 5, review: 30 },
 { time: "12:00", pass: 60, fail: 8, review: 42 },
 { time: "16:00", pass: 85, fail: 12, review: 70 },
 { time: "20:00", pass: 50, fail: 6, review: 45 },
 { time: "24:00", pass: 20, fail: 4, review: 18 },
];

const HEALTH_DATA = [
 { label: "Sales Research", value: 98, color: "#2196f3" },
 { label: "Vendor DD", value: 92, color: "#00bcd4" },
 { label: "Engineering", value: 85, color: "#9c27b0" },
 { label: "HR Review", value: 78, color: "#ff9800" },
 { label: "Legal Check", value: 65, color: "#f44336" },
];

const KPI_DATA = [
 { time: 'Mon', value: 1200 },
 { time: 'Tue', value: 1400 },
 { time: 'Wed', value: 1100 },
 { time: 'Thu', value: 1800 },
 { time: 'Fri', value: 2405 },
];

export function MissionControlDashboard() {
 return (
 <div className="w-full flex flex-col gap-6 p-6">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <KpiSummaryWidget 
 title="Running Missions" 
 value="2,405"
 data={KPI_DATA}
 className="col-span-1" 
 />
 <VerificationPercentageWidget 
 title="PASS Rate" 
 data={[{ name: 'PASS', value: 92.4, fill: '#4caf50' }]}
 className="col-span-1" 
 />
 <KpiSummaryWidget 
 title="Waiting Review" 
 value="452"
 data={KPI_DATA.map(d => ({ ...d, value: d.value * 0.2 }))}
 className="col-span-1" 
 />
 <VerificationPercentageWidget 
 title="System Health" 
 data={[{ name: 'Health', value: 88, fill: '#2196f3' }]}
 className="col-span-1" 
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <MissionTreemapWidget 
 title="Mission Breakdown" 
 data={HEALTH_DATA.map(d => ({ name: d.label, size: d.value, fill: d.color }))}
 className="col-span-2" 
 />
 <MissionStateTrendsWidget 
 title="Mission State Trends" 
 data={MOCK_TIMELINE}
 className="col-span-1" 
 />
 </div>

 <div className="grid grid-cols-1 gap-6">
 <TopInstitutionsBrushWidget 
 title="Top Institutions by Activity" 
 data={MOCK_TIMELINE}
 className="col-span-1" 
 />
 </div>
 </div>
 );
}
