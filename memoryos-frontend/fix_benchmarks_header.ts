import * as fs from 'fs';

const path = 'c:\\projects\\MemoryOS\\memoryos-frontend\\components\\developer-console\\sections\\benchmarks-section.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix the header block
const headerPattern = /<div className="relative overflow-hidden border-b border-white\/5 bg-black pb-8 pt-2">\s*<div className="absolute inset-0 bg-\[radial-gradient[^>]+>\s*<div className="relative z-10 flex flex-wrap items-end justify-between gap-6 px-6">\s*<div>\s*<h1 className="text-\[16px\] font-semibold tracking-\[-0.04em\] sm:text-\[18px\]">Benchmarks<\/h1>\s*<p className="mt-1 text-\[12px\] leading-6 text-white\/46 sm:text-\[13px\]">/m;

const newHeader = `<div className="relative overflow-hidden border-b border-transparent bg-black px-6 py-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,121,255,0.06),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(38,120,255,0.04),transparent_50%)]" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-white shadow-black/50 drop-shadow-sm">Benchmarks</h1>
            <p className="mt-1.5 text-[14px] text-white/50 max-w-xl leading-relaxed">`;

content = content.replace(headerPattern, newHeader);

// Fix the closing div spacing
const divsPattern = /        <\/div>\s*<\/div>\s*<div className="mt-3 flex flex-wrap items-center gap-2\.5">/m;

const newDivs = `          </div>
        </div>
      </div>

      <div className="px-6 mt-8 space-y-8 max-w-[1440px] pb-12">
        <div className="flex flex-wrap items-center gap-2.5">`;

content = content.replace(divsPattern, newDivs);

fs.writeFileSync(path, content, 'utf8');
console.log("Done");
