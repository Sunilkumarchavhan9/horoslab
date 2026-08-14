const fs = require('fs');
const path = require('path');
const file = 'c:\\projects\\MemoryOS\\memoryos-frontend\\components\\mission-control\\account-home-dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// The file got corrupted between:
// const verificationSeries = buildTimelineSeries(verifications, range);
// and
// changeType: institutionTrend.changeType,

const regex = /(const verificationSeries = buildTimelineSeries\(verifications, range\);[\s\S]*?)(changeType: institutionTrend\.changeType,)/;

const replacement = `
 const institutionTrend = summarizeSeriesTrend(institutionSeries);
 const missionTrend = summarizeSeriesTrend(missionSeries);
 const evidenceTrend = summarizeSeriesTrend(evidenceSeries);
 const verificationTrend = summarizeSeriesTrend(verificationSeries);

 return enforceGridPadding([
 {
 id: "active_institutions",
 title: "Active institutions",
 value: snapshot?.overview?.institutions ?? 0,
 change: institutionTrend.change,
 `;

content = content.replace(regex, (match, p1, p2) => {
    return ' const verificationSeries = buildTimelineSeries(verifications, range);' + replacement + p2;
});

fs.writeFileSync(file, content);
console.log("File repaired successfully.");
