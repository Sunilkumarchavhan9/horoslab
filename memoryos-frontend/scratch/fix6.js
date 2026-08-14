const fs = require('fs');
const file = 'components/mission-control/mission-control-workspace.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');

// Replace line 2195 (index 2194) with '            )}'
lines[2194] = '            )}';

fs.writeFileSync(file, lines.join('\n'));
console.log('Fixed');
