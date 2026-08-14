import React from "react";
import { 
 KpiSummaryWidget,
 InstitutionHealthWidget,
 MissionStatusPieWidget,
 AuthorityRadarWidget
} from "../widgets/specialized-widgets";

const KPI_DATA = [
 { time: 'Mon', value: 45 },
 { time: 'Tue', value: 52 },
 { time: 'Wed', value: 48 },
 { time: 'Thu', value: 65 },
 { time: 'Fri', value: 82 },
];

const RESEARCH_STATUS = [
 { label: 'Completed', value: 850, color: '#4caf50' },
 { label: 'In Progress', value: 120, color: '#2196f3' },
 { label: 'Failed Search', value: 45, color: '#f44336' },
 { label: 'Data Missing', value: 80, color: '#ff9800' },
];

const TOPIC_COVERAGE = [
 { name: 'Financials', value: 95, fullMark: 100 },
 { name: 'Leadership', value: 85, fullMark: 100 },
 { name: 'Competitors', value: 70, fullMark: 100 },
 { name: 'Recent News', value: 90, fullMark: 100 },
 { name: 'Product Lines', value: 65, fullMark: 100 },
];

export function SalesResearchDashboard() {
 return (
 <div className="w-full flex flex-col gap-6 p-6">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <KpiSummaryWidget 
 title="Total Companies Researched" 
 value="1,095"
 data={KPI_DATA}
 className="col-span-1" 
 />
 <InstitutionHealthWidget 
 title="Data Enrichment Quality" 
 value={92}
 className="col-span-1" 
 />
 <KpiSummaryWidget 
 title="Avg Search Time (sec)" 
 value="14.5"
 data={KPI_DATA.map(d => ({ ...d, value: 30 - d.value * 0.1 }))}
 className="col-span-1" 
 />
 <InstitutionHealthWidget 
 title="API Rate Limit Health" 
 value={98}
 className="col-span-1" 
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <MissionStatusPieWidget 
 title="Research Task Outcomes" 
 data={RESEARCH_STATUS}
 className="col-span-1" 
 />
 <AuthorityRadarWidget 
 title="Topic Coverage Depth" 
 data={TOPIC_COVERAGE}
 className="col-span-1" 
 />
 </div>
 </div>
 );
}
