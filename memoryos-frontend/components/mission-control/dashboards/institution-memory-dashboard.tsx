import React from "react";
import { 
 KpiSummaryWidget,
 InstitutionHealthWidget,
 MissionTreemapWidget,
 MissionTimelineWidget
} from "../widgets/specialized-widgets";

const KPI_DATA = [
 { time: 'Mon', value: 1200 },
 { time: 'Tue', value: 1400 },
 { time: 'Wed', value: 1100 },
 { time: 'Thu', value: 1800 },
 { time: 'Fri', value: 2405 },
];

const KNOWLEDGE_GROWTH_TIMELINE = [
 { time: "Week 1", total: 100, completed: 80, review: 20, running: 0 },
 { time: "Week 2", total: 150, completed: 120, review: 30, running: 0 },
 { time: "Week 3", total: 250, completed: 210, review: 40, running: 0 },
 { time: "Week 4", total: 380, completed: 330, review: 50, running: 0 },
 { time: "Week 5", total: 520, completed: 460, review: 60, running: 0 },
];

const KNOWLEDGE_DISTRIBUTION = [
 { name: 'Browser Manipulation', size: 450, fill: '#2196f3' },
 { name: 'API Interaction', size: 320, fill: '#00bcd4' },
 { name: 'File System Parsing', size: 280, fill: '#9c27b0' },
 { name: 'Terminal Commands', size: 150, fill: '#ff9800' },
 { name: 'Data Extraction', size: 500, fill: '#4caf50' },
 { name: 'Error Handling', size: 120, fill: '#f44336' },
];

export function InstitutionMemoryDashboard() {
 return (
 <div className="w-full flex flex-col gap-6 p-6">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <KpiSummaryWidget 
 title="Total Institution Records" 
 value="12,405"
 data={KPI_DATA}
 className="col-span-1" 
 />
 <KpiSummaryWidget 
 title="Lessons Generated" 
 value="4,250"
 data={KPI_DATA.map(d => ({ ...d, value: d.value * 0.4 }))}
 className="col-span-1" 
 />
 <KpiSummaryWidget 
 title="Approved Improvements" 
 value="1,842"
 data={KPI_DATA.map(d => ({ ...d, value: d.value * 0.2 }))}
 className="col-span-1" 
 />
 <InstitutionHealthWidget 
 title="Knowledge Quality Score" 
 value={96}
 className="col-span-1" 
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <MissionTreemapWidget 
 title="Knowledge Distribution" 
 data={KNOWLEDGE_DISTRIBUTION}
 className="col-span-1 md:col-span-1" 
 />
 <MissionTimelineWidget 
 title="Knowledge Growth Timeline" 
 data={KNOWLEDGE_GROWTH_TIMELINE}
 className="col-span-1 md:col-span-2" 
 />
 </div>
 </div>
 );
}
