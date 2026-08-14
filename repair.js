const fs = require('fs');
const path = require('path');
const file = 'c:\\projects\\MemoryOS\\memoryos-frontend\\components\\mission-control\\account-home-dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /(id: "evidence_collected",[\s\S]*?spanSize: "1x1",[\s\r\n]*)(const timestamp = institution\.updatedAt \?\? institution\.createdAt;)/;

const replacement = ` },
 {
 id: "human_reviews",
 title: "Human reviews / verifications",
 value: snapshot?.overview?.verifications ?? 0,
 change: verificationTrend.change,
 changeType: verificationTrend.changeType,
 points: verificationSeries,
 metricName: "Verifications",
 spanSize: "1x1",
 },
 { ...AVAILABLE_METRICS_CATALOG.find(m => m.id === "cache_rate"), spanSize: "1x1" },
 { ...AVAILABLE_METRICS_CATALOG.find(m => m.id === "total_bw"), spanSize: "1x1" },
 { ...AVAILABLE_METRICS_CATALOG.find(m => m.id === "build_mins"), spanSize: "1x1" },
 { ...AVAILABLE_METRICS_CATALOG.find(m => m.id === "cpu_time"), spanSize: "1x1" },
 ];
}

function buildRecentActivityItems(snapshot) {
 const institutions = snapshot?.recent?.institutions ?? [];
 const missions = snapshot?.recent?.missions ?? [];
 const evidence = flattenMissionEvidence(missions);

 const items = [];

 for (const institution of institutions) {
 `;

content = content.replace(regex, (match, p1, p2) => {
    return p1 + replacement + p2;
});

// Since we lost the TypeScript types in the replace, let's fix them too:
content = content.replace('function buildRecentActivityItems(snapshot) {', 'function buildRecentActivityItems(snapshot: EpochMissionControlSnapshot | null): RecentActivityItem[] {');
content = content.replace('const items = [];', 'const items: RecentActivityItem[] = [];');

fs.writeFileSync(file, content);
console.log("File repaired successfully.");
