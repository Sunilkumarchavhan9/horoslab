const fs = require('fs');
const file = 'components/mission-control/mission-control-workspace.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');

const start = 2175; // line 2176 is index 2175
const end = 2376;   // line 2376 is index 2375, so we slice up to end (non-inclusive) meaning index 2376.

const newLines = lines.slice(0, start).concat([
  '                              isComplete',
  '                                ? "bg-[#eef3ff] text-[#0f52ff]"',
  '                                : isActive',
  '                                  ? "bg-[#fff1c9] text-[#8a6d1d]"',
  '                                  : "bg-black/5 text-black/35"',
  '                            )}>\\' // wait, we don't need \\
], lines.slice(end));

// Let's remove the \\ at the end of the last line
newLines[start + 5] = '                            )}>';

fs.writeFileSync(file, newLines.join('\n'));
console.log('Fixed');
