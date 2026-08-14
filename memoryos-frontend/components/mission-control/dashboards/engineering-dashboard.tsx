import React from "react";
import { 
 MissionSankeyWidget,
 VerificationPercentageWidget,
 KpiSummaryWidget,
 TopInstitutionsBrushWidget
} from "../widgets/specialized-widgets";

const KPI_DATA = [
 { time: 'Mon', value: 85 },
 { time: 'Tue', value: 110 },
 { time: 'Wed', value: 95 },
 { time: 'Thu', value: 140 },
 { time: 'Fri', value: 160 },
];

const CODE_FLOW = {
 nodes: [
 { name: "Code Read" },
 { name: "Analysis" },
 { name: "Modifications" },
 { name: "Tests Passed" },
 { name: "Tests Failed" },
 { name: "Committed" },
 ],
 links: [
 { source: 0, target: 1, value: 500, fill: "#2196f3" },
 { source: 1, target: 2, value: 350, fill: "#00bcd4" },
 { source: 1, target: 3, value: 150, fill: "#4caf50" },
 { source: 2, target: 3, value: 300, fill: "#4caf50" },
 { source: 2, target: 4, value: 50, fill: "#f44336" },
 { source: 3, target: 5, value: 450, fill: "#9c27b0" },
 ]
};

const BUILD_HISTORY = [
 { time: "Mon", pass: 40, fail: 5 },
 { time: "Tue", pass: 55, fail: 8 },
 { time: "Wed", pass: 48, fail: 2 },
 { time: "Thu", pass: 65, fail: 10 },
 { time: "Fri", pass: 80, fail: 4 },
];

export function EngineeringDashboard() {
 return (
 <div className="w-full flex flex-col gap-6 p-6">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <KpiSummaryWidget 
 title="Total PRs Analyzed" 
 value="500"
 data={KPI_DATA}
 className="col-span-1" 
 />
 <VerificationPercentageWidget 
 title="Build Success" 
 data={[{ name: 'Success Rate', value: 92.0, fill: '#4caf50' }]}
 className="col-span-1" 
 />
 <KpiSummaryWidget 
 title="Avg Code Read Time" 
 value="45s"
 data={KPI_DATA.map(d => ({ ...d, value: 100 - d.value * 0.4 }))}
 className="col-span-1" 
 />
 <VerificationPercentageWidget 
 title="Test Coverage" 
 data={[{ name: 'Coverage', value: 85.5, fill: '#00bcd4' }]}
 className="col-span-1" 
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <MissionSankeyWidget 
 title="Code Modification Flow" 
 data={CODE_FLOW}
 className="col-span-1" 
 />
 <TopInstitutionsBrushWidget 
 title="Build History" 
 data={BUILD_HISTORY}
 className="col-span-1" 
 />
 </div>
 </div>
 );
}
