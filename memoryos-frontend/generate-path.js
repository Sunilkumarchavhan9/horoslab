const { readFileSync } = require('fs');

const cx = 12;
const cy = 12;
const angle = -20 * (Math.PI / 180); // -20 degrees

function rotate(x, y) {
  const dx = x - cx;
  const dy = y - cy;
  const rx = dx * Math.cos(angle) - dy * Math.sin(angle);
  const ry = dx * Math.sin(angle) + dy * Math.cos(angle);
  return [Number((rx + cx).toFixed(3)), Number((ry + cy).toFixed(3))];
}

function processPath(d) {
  const parts = d.split(' ');
  const rotatedParts = parts.map(part => {
    if (part === 'Z' || part === 'z') return part;
    const cmd = part[0];
    const coords = part.slice(1).split(',').map(Number);
    if (coords.length === 2) {
      const [nx, ny] = rotate(coords[0], coords[1]);
      return `${cmd}${nx},${ny}`;
    }
    return part;
  });
  return rotatedParts.join(' ');
}

// Base untilded path
// We use commands separated by spaces for easier parsing
const baseD = "M13,11 L13,2 L16,2 L16,8 L22,8 L22,11 Z M11,13 L11,22 L8,22 L8,16 L2,16 L2,13 Z M11,11 L11,9 L5,3 L3,5 L9,11 Z M13,13 L15,13 L21,19 L19,21 L13,15 Z";

// Parse and format properly
const commands = baseD.split(/(?=[MLZ])/).map(s => s.trim()).filter(Boolean);
let formattedD = "";
for (const cmdStr of commands) {
  if (cmdStr === 'Z') {
    formattedD += 'Z ';
  } else {
    const cmd = cmdStr[0];
    const [x, y] = cmdStr.slice(1).split(',').map(Number);
    const [nx, ny] = rotate(x, y);
    formattedD += `${cmd}${nx},${ny} `;
  }
}

console.log(formattedD.trim());
