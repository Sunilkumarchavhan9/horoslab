const fs = require('fs');

const rawPaths = [
  "M447 0H508V330H471.918L447 311.5V0Z",
  "M390 751.5L357 668V338H393.5H415.5V374L418 668L390 751.5Z",
  "M715.789 544.354L669.06 583.564L478.5 360.5L551.986 354.812L715.789 544.354Z",
  "M157 69.21L203.729 30L387.789 249.354L320.803 258.752L157 69.21Z",
  "M836 330V269H506V305.082L507 330H524.5H836Z",
  "M83.5 277L0 305L83.5 338H415.5L413.5 306L407.704 297.5L378 277H83.5Z"
];
const fullPath = rawPaths.join(" ");

function parseSVGPath(d) {
  const parts = d.split(/(?=[MHLVZ])/i).map(s => s.trim()).filter(Boolean);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let currX = 0, currY = 0;
  const parsed = [];
  
  for (const part of parts) {
    const cmd = part[0].toUpperCase();
    if (cmd === 'Z') {
      parsed.push({ cmd: 'Z' });
      continue;
    }
    let args = part.substring(1).replace(/-/g, ' -').trim().split(/[\s,]+/).map(Number);
    if (cmd === 'H') {
      currX = args[0];
      parsed.push({ cmd: 'L', x: currX, y: currY });
    } else if (cmd === 'V') {
      currY = args[0];
      parsed.push({ cmd: 'L', x: currX, y: currY });
    } else if (cmd === 'M' || cmd === 'L') {
      currX = args[0];
      currY = args[1];
      parsed.push({ cmd, x: currX, y: currY });
    }
    minX = Math.min(minX, currX);
    maxX = Math.max(maxX, currX);
    minY = Math.min(minY, currY);
    maxY = Math.max(maxY, currY);
  }
  return { parsed, minX, maxX, minY, maxY };
}

const { parsed, minX, maxX, minY, maxY } = parseSVGPath(fullPath);

// Generate for memory-star-logo.tsx
const targetHeight = 56;
const scale = targetHeight / (maxY - minY);
const targetWidth = (maxX - minX) * scale;
const outCx = 2; // start a bit from the edge
const outCy = (27.65 - (targetHeight / 2)); // center vertically around 27.65

let logoPaths = [];
for (let i = 0; i < rawPaths.length; i++) {
  const { parsed: p } = parseSVGPath(rawPaths[i]);
  let d = "";
  for (const pt of p) {
    if (pt.cmd === 'Z') {
      d += "Z";
    } else {
      const sx = (pt.x - minX) * scale + outCx;
      const sy = (pt.y - minY) * scale + outCy;
      d += `${pt.cmd}${sx.toFixed(3)},${sy.toFixed(3)} `;
    }
  }
  logoPaths.push(d.trim());
}

// Generate for memoryos-logo-mark.tsx
const markScaleX = 22 / (maxX - minX);
const markScaleY = 26 / (maxY - minY);
const markScale = Math.min(markScaleX, markScaleY);
const markCx = (22 - (maxX - minX) * markScale) / 2;
const markCy = (26 - (maxY - minY) * markScale) / 2;

let finalMarkD = "";
for (const p of parsed) {
  if (p.cmd === 'Z') {
    finalMarkD += "Z ";
  } else {
    const sx = (p.x - minX) * markScale + markCx;
    const sy = (p.y - minY) * markScale + markCy;
    finalMarkD += `${p.cmd}${sx.toFixed(3)},${sy.toFixed(3)} `;
  }
}
finalMarkD = finalMarkD.trim();

function shiftPath(d, shiftX) {
  const parts = d.split(/(?=[MHLVZC])/i).map(s => s.trim()).filter(Boolean);
  let shifted = "";
  for (const part of parts) {
      const cmd = part[0];
      if (cmd.toUpperCase() === 'Z') {
          shifted += "Z ";
          continue;
      }
      let args = part.substring(1).replace(/-/g, ' -').trim().split(/[\s,]+/).map(Number);
      if (cmd === 'H' || cmd === 'h') {
          shifted += `${cmd}${args[0] + shiftX} `;
      } else if (cmd === 'V' || cmd === 'v') {
          shifted += `${cmd}${args[0]} `;
      } else if (cmd === 'M' || cmd === 'L' || cmd === 'm' || cmd === 'l') {
          shifted += `${cmd}${args[0] + shiftX},${args[1]} `;
      } else if (cmd === 'C' || cmd === 'c') {
          shifted += `${cmd}${args[0] + shiftX},${args[1]} ${args[2] + shiftX},${args[3]} ${args[4] + shiftX},${args[5]} `;
      }
  }
  return shifted.trim();
}

// Read memory-star-logo.tsx
let starLogo = fs.readFileSync('components/landing/memory-star-logo.tsx', 'utf8');
const pathsMatch = starLogo.match(/<path d="M[^"]+" fill="currentColor" \/>/g);

if (pathsMatch && pathsMatch.length === 6) {
  const wordPath = pathsMatch[4].match(/d="([^"]+)"/)[1];
  const tmPath = pathsMatch[5].match(/d="([^"]+)"/)[1];
  
  const shiftAmount = 30; // shift 30 to make room for big icon
  const shiftedWord = shiftPath(wordPath, shiftAmount);
  const shiftedTm = shiftPath(tmPath, shiftAmount);
  
  let newGroup = `<g transform="scale(1 0.5)">\n`;
  for (const p of logoPaths) {
    newGroup += `        <path d="${p}" fill="currentColor" />\n`;
  }
  newGroup += `        <path d="${shiftedWord}" fill="currentColor" />\n`;
  newGroup += `        <path d="${shiftedTm}" fill="currentColor" />\n`;
  newGroup += `      </g>`;
  
  starLogo = starLogo.replace(/<g transform="scale\(1 0\.5\)">[\s\S]*?<\/g>/, newGroup);
  
  // Update viewBox from "0 0 238 47" to "0 0 268 47"
  starLogo = starLogo.replace(/viewBox="0 0 238 47"/, 'viewBox="0 0 268 47"');
  starLogo = starLogo.replace(/width="210"/, 'width="235"');
  starLogo = starLogo.replace(/w-\[175px\] sm:w-\[210px\]/, 'w-[200px] sm:w-[235px]');
  
  fs.writeFileSync('components/landing/memory-star-logo.tsx', starLogo);
}

// Update memoryos-logo-mark.tsx
let markLogo = fs.readFileSync('components/continuity-lab/memoryos-logo-mark.tsx', 'utf8');
markLogo = markLogo.replace(/export const MEMORYOS_STAR_PATH =\s+"[^"]+";/, `export const MEMORYOS_STAR_PATH =\n  "${finalMarkD}";`);
fs.writeFileSync('components/continuity-lab/memoryos-logo-mark.tsx', markLogo);

console.log("Done updating both components!");
