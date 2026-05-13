import * as fs from 'fs';
import * as path from 'path';

const consolePath = String.raw`c:\projects\MemoryOS\memoryos-frontend\components\developer-console\console-experience.tsx`;
if (fs.existsSync(consolePath)) {
  let content = fs.readFileSync(consolePath, 'utf8');

  // Change background hexes to pure black
  content = content.replace(/bg-\[#070707\]/g, 'bg-black');
  content = content.replace(/bg-\[#080808\]/g, 'bg-black');
  content = content.replace(/bg-\[#111111\]/g, 'bg-black');
  content = content.replace(/bg-\[#181818\]/g, 'bg-black');
  content = content.replace(/bg-\[#151515\]/g, 'bg-black');
  content = content.replace(/bg-\[#0f0f0f\]/g, 'bg-black');
  content = content.replace(/bg-\[#1d1d1d\]/g, 'bg-black');

  // Change active sidebar item
  // from: ? "bg-[#232323] font-semibold text-white"
  // to:   ? "bg-transparent font-bold text-white border-l-2 border-white pl-[calc(1rem-2px)]"
  content = content.replace(/\? "bg-\[#232323\] font-semibold text-white"/g, 
    `? "bg-transparent font-bold text-white border-l-2 border-white"`);

  // Remove search bar border and background
  content = content.replace(/rounded-\[8px\] border border-white\/8 bg-\[#181818\]/g, 'border-b border-white/20 bg-transparent rounded-none');

  // Remove hover bg from sidebar items
  content = content.replace(/hover:bg-white\/5/g, 'hover:bg-transparent hover:text-white transition-colors duration-200');

  // Remove other general borders and rounding
  content = content.replace(/border-white\/12/g, 'border-transparent');
  content = content.replace(/border border-transparent/g, 'border-transparent');
  content = content.replace(/border-white\/8/g, 'border-transparent');
  
  fs.writeFileSync(consolePath, content, 'utf8');
}
