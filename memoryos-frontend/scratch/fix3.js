const fs = require('fs');
const file = 'components/mission-control/mission-control-workspace.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');

const start = 2180; // line 2181 is index 2180
const end = 2379;   // line 2379 is index 2378

const newLines = lines.slice(0, start).concat([
  '                              {isComplete ? "Done" : isActive ? "Done" : "Queued"}',
  '                            </div>',
  '                          </div>'
], lines.slice(end));

fs.writeFileSync(file, newLines.join('\n'));
console.log('Fixed');
