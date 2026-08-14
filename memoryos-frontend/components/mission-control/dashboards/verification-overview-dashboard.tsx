import React from "react";
import { 
 VerificationPercentageWidget,
 LeaderboardWidget,
 MissionTimelineWidget,
 InstitutionComparisonWidget
} from "../widgets/specialized-widgets";

const CERTIFICATE_TREND = [
 { time: "Week 1", pass: 85, fail: 15, review: 10 },
 { time: "Week 2", pass: 88, fail: 12, review: 8 },
 { time: "Week 3", pass: 92, fail: 8, review: 5 },
 { time: "Week 4", pass: 95, fail: 5, review: 3 },
 { time: "Week 5", pass: 97, fail: 3, review: 2 },
];

const CONFIDENCE_SCORES = [
 { label: 'Network Operations', value: 98.5, color: '#4caf50' },
 { label: 'File System Parsing', value: 96.2, color: '#8bc34a' },
 { label: 'Browser Automation', value: 91.0, color: '#cddc39' },
 { label: 'Terminal Commands', value: 85.5, color: '#ffc107' },
 { label: 'API Integrations', value: 78.0, color: '#ff9800' },
 { label: 'Database Queries', value: 65.5, color: '#f44336' },
];

const VERIFICATION_TIMELINE = [
 { time: "00:00", total: 120, completed: 80, review: 20, running: 20 },
 { time: "04:00", total: 150, completed: 100, review: 30, running: 20 },
 { time: "08:00", total: 450, completed: 300, review: 50, running: 100 },
 { time: "12:00", total: 600, completed: 420, review: 80, running: 100 },
 { time: "16:00", total: 850, completed: 700, review: 100, running: 50 },
];

export function VerificationOverviewDashboard() {
 return (
 <div className="w-full flex flex-col gap-6 p-6">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <VerificationPercentageWidget 
 title="Overall PASS Rate" 
 data={[{ name: 'PASS Rate', value: 95.8, fill: '#4caf50' }]}
 className="col-span-1" 
 />
 <VerificationPercentageWidget 
 title="FAIL Rate" 
 data={[{ name: 'FAIL Rate', value: 4.2, fill: '#f44336' }]}
 className="col-span-1" 
 />
 <VerificationPercentageWidget 
 title="Review Required Rate" 
 data={[{ name: 'Review Rate', value: 8.5, fill: '#ff9800' }]}
 className="col-span-1" 
 />
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <LeaderboardWidget 
 title="Confidence Scores by Domain" 
 data={CONFIDENCE_SCORES}
 className="col-span-1 md:col-span-1" 
 />
 <MissionTimelineWidget 
 title="Verification Latency Timeline" 
 data={VERIFICATION_TIMELINE}
 className="col-span-1 md:col-span-2" 
 />
 </div>

 <div className="grid grid-cols-1 gap-6">
 <InstitutionComparisonWidget 
 title="Policy Check Results" 
 data={CERTIFICATE_TREND}
 className="col-span-1" 
 />
 </div>
 </div>
 );
}
