const fs = require('fs');
const path = require('path');
const dir = 'c:/projects/MemoryOS/memoryos-frontend/components/mission-control/institution';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.split('bg-[#050505]').join('bg-white dark:bg-[#050505]');
  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Fixed bg-[#050505]!');
