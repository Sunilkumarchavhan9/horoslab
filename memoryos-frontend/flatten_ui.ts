import * as fs from 'fs';
import * as path from 'path';

const sectionsDir = String.raw`c:\projects\MemoryOS\memoryos-frontend\components\developer-console\sections`;
const filesToUpdate = ['memories-section.tsx', 'live-build-nodes-section.tsx'];

filesToUpdate.forEach(file => {
  const filepath = path.join(sectionsDir, file);
  if (!fs.existsSync(filepath)) return;
  
  let content = fs.readFileSync(filepath, 'utf8');

  // Replace background colors with transparent or pure black
  content = content.replace(/bg-\[#0b0d12\]/g, 'bg-black');
  content = content.replace(/bg-\[#07090d\]/g, 'bg-black');
  content = content.replace(/bg-\[#11131a\]/g, 'bg-black');
  content = content.replace(/bg-\[#111111\]\/50/g, 'bg-black');
  content = content.replace(/bg-\[#111111\]/g, 'bg-black');
  
  // Remove borders and rounded corners from panels
  content = content.replace(/border-white\/10/g, 'border-transparent');
  content = content.replace(/border border-white\/5/g, 'border-transparent');
  content = content.replace(/rounded-\[12px\]/g, 'rounded-none');
  content = content.replace(/rounded-\[8px\]/g, 'rounded-none');
  content = content.replace(/rounded-\[10px\]/g, 'rounded-none');
  content = content.replace(/shadow-lg/g, 'shadow-none');
  content = content.replace(/shadow-inner/g, 'shadow-none');
  
  fs.writeFileSync(filepath, content, 'utf8');
});

// Also do console-experience.tsx
const consolePath = String.raw`c:\projects\MemoryOS\memoryos-frontend\components\developer-console\console-experience.tsx`;
if (fs.existsSync(consolePath)) {
  let content = fs.readFileSync(consolePath, 'utf8');
  content = content.replace(/bg-\[#07090d\]/g, 'bg-black');
  content = content.replace(/bg-\[#0b0d12\]/g, 'bg-black');
  content = content.replace(/bg-\[#11131a\]/g, 'bg-black');
  content = content.replace(/bg-\[#161b22\]/g, 'bg-black');
  content = content.replace(/bg-\[#0d1117\]/g, 'bg-black');
  content = content.replace(/border-white\/10/g, 'border-transparent');
  content = content.replace(/border-white\/5/g, 'border-transparent');
  fs.writeFileSync(consolePath, content, 'utf8');
}
