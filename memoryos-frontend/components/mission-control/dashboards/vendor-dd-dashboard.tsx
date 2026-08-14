import React from "react";
import { 
 MissionTimelineWidget,
 PolicyViolationsWidget,
 KpiSummaryWidget,
 VerificationPercentageWidget
} from "../widgets/specialized-widgets";

const KPI_DATA = [
 { time: 'Mon', value: 12 },
 { time: 'Tue', value: 18 },
 { time: 'Wed', value: 24 },
 { time: 'Thu', value: 16 },
 { time: 'Fri', value: 30 },
];

const ASSESSMENT_TIMELINE = [
 { time: "Week 1", total: 20, completed: 15, review: 5, running: 0 },
 { time: "Week 2", total: 35, completed: 25, review: 8, running: 2 },
 { time: "Week 3", total: 45, completed: 35, review: 10, running: 0 },
 { time: "Week 4", total: 60, completed: 48, review: 10, running: 2 },
 { time: "Week 5", total: 85, completed: 70, review: 12, running: 3 },
];

const RISK_MAPPING = [
 { severity: 5, frequency: 1, impact: 180 },
 { severity: 4, frequency: 3, impact: 140 },
 { severity: 3, frequency: 8, impact: 90 },
 { severity: 2, frequency: 25, impact: 40 },
 { severity: 1, frequency: 40, impact: 20 },
];

export function VendorDdDashboard() {
 return (
 <div className="w-full flex flex-col gap-6 p-6">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <KpiSummaryWidget 
 title="Vendors Screened" 
 value="245"
 data={KPI_DATA}
 className="col-span-1" 
 />
 <VerificationPercentageWidget 
 title="Passed Compliance" 
 data={[{ name: 'PASS Rate', value: 82.5, fill: '#4caf50' }]}
 className="col-span-1" 
 />
 <KpiSummaryWidget 
 title="High Risk Flags" 
 value="18"
 data={KPI_DATA.map(d => ({ ...d, value: d.value * 0.1 }))}
 className="col-span-1" 
 />
 <VerificationPercentageWidget 
 title="Automation Rate" 
 data={[{ name: 'Auto', value: 95.0, fill: '#2196f3' }]}
 className="col-span-1" 
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <MissionTimelineWidget 
 title="Assessment Volume Trends" 
 data={ASSESSMENT_TIMELINE}
 className="col-span-1" 
 />
 <PolicyViolationsWidget 
 title="Vendor Risk Matrix" 
 data={RISK_MAPPING}
 className="col-span-1" 
 />
 </div>
 </div>
 );
}
