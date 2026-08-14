import React from "react";
import { 
 MissionTreemapWidget,
 KpiSummaryWidget,
 InstitutionHealthWidget,
 TopInstitutionsBrushWidget
} from "../widgets/specialized-widgets";

const KPI_DATA = [
 { time: 'Mon', value: 240 },
 { time: 'Tue', value: 280 },
 { time: 'Wed', value: 260 },
 { time: 'Thu', value: 310 },
 { time: 'Fri', value: 450 },
];

const ACTIVE_MISSIONS_TREEMAP = [
 { name: 'Sales Research', size: 450, fill: '#2196f3' },
 { name: 'Vendor DD', size: 320, fill: '#00bcd4' },
 { name: 'Engineering', size: 280, fill: '#9c27b0' },
 { name: 'HR Review', size: 150, fill: '#ff9800' },
 { name: 'Legal Check', size: 80, fill: '#f44336' },
];

const MISSION_QUEUE = [
 { time: "08:00", pass: 15, fail: 5 },
 { time: "10:00", pass: 25, fail: 8 },
 { time: "12:00", pass: 45, fail: 12 },
 { time: "14:00", pass: 30, fail: 10 },
 { time: "16:00", pass: 60, fail: 15 },
 { time: "18:00", pass: 20, fail: 5 },
];

export function InstitutionOverviewDashboard() {
 return (
 <div className="w-full flex flex-col gap-6 p-6">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <KpiSummaryWidget 
 title="Active Missions" 
 value="450"
 data={KPI_DATA}
 className="col-span-1" 
 />
 <InstitutionHealthWidget 
 title="Memory Growth Rate" 
 value={82}
 className="col-span-1" 
 />
 <KpiSummaryWidget 
 title="Avg Mission Duration" 
 value="2m 14s"
 data={KPI_DATA.map(d => ({ ...d, value: d.value * 0.5 }))}
 className="col-span-1" 
 />
 <InstitutionHealthWidget 
 title="Institution Utilization" 
 value={94}
 className="col-span-1" 
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <MissionTreemapWidget 
 title="Active Missions by Institution" 
 data={ACTIVE_MISSIONS_TREEMAP}
 className="col-span-1" 
 />
 <TopInstitutionsBrushWidget 
 title="Mission Queue Volume" 
 data={MISSION_QUEUE}
 className="col-span-1" 
 />
 </div>
 </div>
 );
}
