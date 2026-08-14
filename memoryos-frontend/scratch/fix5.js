const fs = require('fs');
const file = 'components/mission-control/mission-control-workspace.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');

// Replace line 2175 (index 2174) with the correct string
lines[2174] = '                              "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] shrink-0",';

fs.writeFileSync(file, lines.join('\n'));
console.log('Fixed');
