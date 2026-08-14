const rawPaths = [
  "M447 0H508V330H471.918L447 311.5V0Z",
  "M390 690.5L357 607V277H393.5L418 312.5V607L390 690.5Z",
  "M715.789 544.354L669.06 583.564L478.5 360.5L551.986 354.812L715.789 544.354Z",
  "M157 69.21L203.729 30L387.789 249.354L320.803 258.752L157 69.21Z",
  "M787 330V269H457V305.082L475.5 330H787Z",
  "M83.5 277L0 305L83.5 338H413.5V306L407.704 297.5L378 277H83.5Z"
];

const fullPath = rawPaths.join(" ");

function parsePath(d) {
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
    
    // We only have M, H, V, L based on the string provided.
    // However, some cmds might have multiple numbers. 
    // The provided path: M447 0H508V330H471.918L447 311.5V0Z
    let args = part.substring(1).replace(/-/g, ' -').trim().split(/[\s,]+/).map(Number);
    
    if (cmd === 'H') {
      currX = args[0];
      parsed.push({ cmd: 'L', x: currX, y: currY });
    } else if (cmd === 'V') {
      currY = args[0];
      parsed.push({ cmd: 'L', x: currX, y: currY });
    } else {
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

const { parsed, minX, maxX, minY, maxY } = parsePath(fullPath);

// Original star bounding box approx width 22, height 25.
// We want to scale it so max width = 22, max height = 25.
const scaleX = 22 / (maxX - minX);
const scaleY = 25 / (maxY - minY);
const scale = Math.min(scaleX, scaleY);

let finalD = "";
for (const p of parsed) {
  if (p.cmd === 'Z') {
    finalD += "Z ";
  } else {
    const sx = (p.x - minX) * scale;
    const sy = (p.y - minY) * scale;
    finalD += `${p.cmd}${sx.toFixed(3)},${sy.toFixed(3)} `;
  }
}

console.log(finalD.trim());
