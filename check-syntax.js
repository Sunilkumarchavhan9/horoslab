const swc = require('@swc/core');
const fs = require('fs');
const file = 'c:\\projects\\MemoryOS\\memoryos-frontend\\components\\mission-control\\account-home-dashboard.tsx';
const content = fs.readFileSync(file, 'utf8');

try {
    swc.parseSync(content, { syntax: 'typescript', tsx: true });
    console.log('SWC Parsed successfully!');
} catch (e) {
    console.error('SWC Parse error:', e.message);
}
