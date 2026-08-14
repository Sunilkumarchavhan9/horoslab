import React from "react";
import { 
 EvidenceSourcesWidget,
 VerificationSunburstWidget,
 InstitutionHealthWidget,
 KpiSummaryWidget,
 InstitutionComparisonWidget
} from "../widgets/specialized-widgets";

const EVIDENCE_SOURCES = [
 { label: 'GitHub Repository', value: 450, color: '#2196f3' },
 { label: 'Browser Snapshots', value: 320, color: '#00bcd4' },
 { label: 'API Responses', value: 280, color: '#9c27b0' },
 { label: 'PDF Documents', value: 150, color: '#ff9800' },
 { label: 'Terminal Logs', value: 500, color: '#4caf50' },
];

const VALIDATION_STATUS = {
 name: 'Evidence',
 value: 1700,
 children: [
 {
 name: 'Valid',
 value: 1200,
 fill: '#4caf50',
 children: [
 { name: 'High Confidence', value: 800 },
 { name: 'Medium Confidence', value: 400 },
 ]
 },
 {
 name: 'Invalid',
 value: 200,
 fill: '#f44336',
 children: [
 { name: 'Corrupted', value: 50 },
 { name: 'Missing Metadata', value: 150 },
 ]
 },
 {
 name: 'Pending',
 value: 300,
 fill: '#ff9800'
 }
 ]
};

const COLLECTION_RATE = [
 { time: "Mon", pass: 400, fail: 20, review: 40 },
 { time: "Tue", pass: 450, fail: 30, review: 50 },
 { time: "Wed", pass: 420, fail: 25, review: 45 },
 { time: "Thu", pass: 500, fail: 40, review: 60 },
 { time: "Fri", pass: 600, fail: 50, review: 80 },
];

const KPI_DATA = [
 { time: 'Mon', value: 120 },
 { time: 'Tue', value: 140 },
 { time: 'Wed', value: 110 },
 { time: 'Thu', value: 180 },
 { time: 'Fri', value: 240 },
];

export function EvidenceOverviewDashboard() {
 return (
 <div className="w-full flex flex-col gap-6 p-6">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <KpiSummaryWidget 
 title="Total Evidence Collected" 
 value="1,700"
 data={KPI_DATA}
 className="col-span-1" 
 />
 <InstitutionHealthWidget 
 title="Evidence Quality" 
 value={94}
 className="col-span-1" 
 />
 <KpiSummaryWidget 
 title="Validation Failures" 
 value="200"
 data={KPI_DATA.map(d => ({ ...d, value: d.value * 0.1 }))}
 className="col-span-1" 
 />
 <InstitutionHealthWidget 
 title="Coverage" 
 value={87}
 className="col-span-1" 
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <EvidenceSourcesWidget 
 title="Evidence Sources" 
 data={EVIDENCE_SOURCES}
 className="col-span-1 md:col-span-1" 
 />
 <VerificationSunburstWidget 
 title="Validation Status Breakdown" 
 data={VALIDATION_STATUS}
 className="col-span-1 md:col-span-2" 
 />
 </div>

 <div className="grid grid-cols-1 gap-6">
 <InstitutionComparisonWidget 
 title="Collection & Validation Rate" 
 data={COLLECTION_RATE}
 className="col-span-1" 
 />
 </div>
 </div>
 );
}
