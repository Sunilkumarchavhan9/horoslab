const fs = require('fs');

const baseD = [
  "M 53 47 L 53 10 L 65 10 L 65 35 L 90 35 L 90 47 Z",
  "M 47 53 L 47 90 L 35 90 L 35 65 L 10 65 L 10 53 Z",
  "M 47 47 L 47 38.5 L 10 1.5 L 10 18.5 L 38.5 47 Z",
  "M 53 53 L 61.5 53 L 90 81.5 L 90 98.5 L 53 61.5 Z"
].join(" ");

const cx = 50;
const cy = 50;
const angle = -18 * (Math.PI / 180);

function rotate(x, y) {
  const dx = x - cx;
  const dy = y - cy;
  const rx = dx * Math.cos(angle) - dy * Math.sin(angle);
  const ry = dx * Math.sin(angle) + dy * Math.cos(angle);
  return [rx + cx, ry + cy];
}

// 1. Parse and rotate
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
const commands = baseD.split(/(?=[MLZ])/).map(s => s.trim()).filter(Boolean);
const rotatedPoints = [];

for (const cmdStr of commands) {
  if (cmdStr === 'Z') {
    rotatedPoints.push({ cmd: 'Z' });
  } else {
    const cmd = cmdStr[0];
    const [x, y] = cmdStr.substring(1).trim().split(' ').map(Number);
    const [nx, ny] = rotate(x, y);
    minX = Math.min(minX, nx);
    maxX = Math.max(maxX, nx);
    minY = Math.min(minY, ny);
    maxY = Math.max(maxY, ny);
    rotatedPoints.push({ cmd, x: nx, y: ny });
  }
}

// 2. Scale and translate to fit in a 22x22 box (since original was roughly 22x22)
// We want it centered in 22x26, so let's put it in 22x22 and shift down slightly if needed.
// Actually original star was centered around x=11, y=12.5.
// Let's scale to width = 22.
const scale = 22 / (maxX - minX);
const outCx = 11;
const outCy = 12.5;
const rCx = (minX + maxX) / 2;
const rCy = (minY + maxY) / 2;

let finalD = "";
for (const p of rotatedPoints) {
  if (p.cmd === 'Z') {
    finalD += "Z ";
  } else {
    const sx = (p.x - rCx) * scale + outCx;
    const sy = (p.y - rCy) * scale + outCy;
    finalD += `${p.cmd}${sx.toFixed(3)},${sy.toFixed(3)} `;
  }
}

console.log(finalD.trim());
