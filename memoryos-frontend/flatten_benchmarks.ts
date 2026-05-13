import * as fs from 'fs';

const path = 'c:\\projects\\MemoryOS\\memoryos-frontend\\components\\developer-console\\sections\\benchmarks-section.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix the header wrapper correctly
const headerPattern = /<div className="flex flex-wrap items-end justify-between gap-3">\s*<div>\s*<h1 className="text-\[16px\] font-semibold tracking-\[-0.04em\] sm:text-\[18px\]">Benchmarks<\/h1>\s*<p className="mt-1 text-\[12px\] leading-6 text-white\/46 sm:text-\[13px\]">\s*Track retrieve, resume, and contradiction quality with live benchmark evidence\.\s*<\/p>\s*<\/div>\s*<\/div>\s*<div className="mt-3 flex flex-wrap items-center gap-2\.5">/m;

const newHeader = `<div className="relative overflow-hidden border-b border-transparent bg-black px-6 py-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,121,255,0.06),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(38,120,255,0.04),transparent_50%)]" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-white shadow-black/50 drop-shadow-sm">Benchmarks</h1>
            <p className="mt-1.5 text-[14px] text-white/50 max-w-xl leading-relaxed">
              Track retrieve, resume, and contradiction quality with live benchmark evidence.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 mt-8 space-y-8 max-w-[1440px] pb-12">
        <div className="flex flex-wrap items-center gap-2.5">`;

content = content.replace(headerPattern, newHeader);

// Fix filter bars
content = content.replace(
  /<div className="flex items-center overflow-hidden rounded-\[8px\] border border-white\/10 bg-\[#111111\]">/g,
  '<div className="flex items-center gap-1">'
);

content = content.replace(
  /className={`px-3 py-1.5 text-\[11px\] font-medium tracking-\[0.08em\] transition \${(.*?)=== item \? "bg-\[#1e1e1e\] text-white" : "text-white\/42 hover:bg-white\/5 hover:text-white\/72"\n              }`/g,
  'className={`px-4 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-widest transition-colors ${$1=== item ? "border-white/40 bg-white/10 text-white" : "border-transparent bg-black text-white/40 hover:text-white/80 hover:bg-white/5"}`'
);

// Main grid
content = content.replace(
  /className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-6"/g,
  'className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6"'
);

// Top metric cards
content = content.replace(
  /className="rounded-\[8px\] border border-white\/10 bg-\[#161616\] px-3.5 py-3.5"/g,
  'className="rounded-none border border-transparent bg-black p-5 shadow-none relative overflow-hidden group hover:bg-[#161616] transition-colors"'
);
content = content.replace(/className="text-\[11px\] font-medium uppercase tracking-\[0.06em\] text-white\/34"/g, 'className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-1"');
content = content.replace(/className="mt-1.5 text-\[22px\] font-semibold tracking-\[-0.04em\]"/g, 'className="text-[32px] font-bold tracking-tight"');

// 3 breakdown columns
content = content.replace(
  /className="mt-3 grid gap-3 xl:grid-cols-3"/g,
  'className="grid gap-6 xl:grid-cols-3"'
);

// Generic container panels
content = content.replace(
  /className="rounded-\[10px\] border border-white\/10 bg-\[#181818\] px-4 py-4"/g,
  'className="rounded-none border border-transparent bg-black flex flex-col h-full overflow-hidden"'
);

// Panel Headers
content = content.replace(
  /<div className="flex items-center justify-between gap-3">\n                <p className="text-\[11px\] font-medium uppercase tracking-\[0.14em\] text-white\/34">/g,
  '<div className="px-5 py-4 border-b border-transparent bg-black flex items-center justify-between">\n                <h2 className="text-[12px] font-bold uppercase tracking-widest text-white">'
);
content = content.replace(
  /<p className="text-\[11px\] font-medium uppercase tracking-\[0.14em\] text-white\/34">(.*?)<\/p>/g,
  '<div className="px-5 py-4 border-b border-transparent bg-black flex items-center justify-between"><h2 className="text-[12px] font-bold uppercase tracking-widest text-white">$1</h2></div>'
);

// Fix inner padding for panels since we removed them
content = content.replace(
  /<div className="mt-2\.5 space-y-2">/g,
  '<div className="p-5 flex-1 bg-black space-y-2">'
);
content = content.replace(
  /<div className="mt-3 space-y-3">/g,
  '<div className="p-5 flex-1 bg-black space-y-5">'
);

// Inner list items (Run ID, mode, etc.)
content = content.replace(
  /className="flex items-center justify-between rounded-\[8px\] border border-white\/10 bg-\[#111111\] px-3 py-2"/g,
  'className="flex items-center justify-between border-b border-white/5 bg-transparent px-2 py-3"'
);

// Quality gate inner items
content = content.replace(
  /className="rounded-\[8px\] border border-white\/10 bg-\[#111111\] px-3 py-3"/g,
  'className="border-b border-white/5 bg-transparent px-2 py-3"'
);

// Failed cases container
content = content.replace(
  /className="mt-3 rounded-\[10px\] border border-white\/10 bg-\[#181818\] px-4 py-4"/g,
  'className="rounded-none border border-transparent bg-black flex flex-col overflow-hidden"'
);

// Failed case item
content = content.replace(
  /className="rounded-\[8px\] border border-\[#ff6d6d\]\/20 bg-\[#1a0e0e\] px-3 py-3"/g,
  'className="rounded-none border-l-2 border-[#ff6d6d] bg-black px-5 py-4 border-b border-b-white/5"'
);

// No failed cases item
content = content.replace(
  /className="rounded-\[8px\] border border-\[#14c38e\]\/20 bg-\[#0a1f18\] px-3 py-3 text-\[12px\] text-\[#8ce6c7\]"/g,
  'className="rounded-none border-l-2 border-[#14c38e] bg-black px-5 py-4 text-[12px] text-[#14c38e]"'
);

// Status tones (Remove bg and border)
content = content.replace(
  /border-\[#14c38e\]\/30 bg-\[#0a1f18\] text-\[#8ce6c7\]/g,
  'border-transparent bg-transparent text-[#14c38e]'
);
content = content.replace(
  /border-\[#4f93ff\]\/30 bg-\[#4f93ff\]\/8 text-\[#8bb5ff\]/g,
  'border-transparent bg-transparent text-[#4f93ff]'
);
content = content.replace(
  /border-\[#ff6d6d\]\/30 bg-\[#2a1111\] text-\[#ffb0b0\]/g,
  'border-transparent bg-transparent text-[#ff6d6d]'
);

// Empty state
content = content.replace(
  /className="mt-3 rounded-\[10px\] border border-white\/10 bg-\[#141414\] px-4 py-10 text-center"/g,
  'className="rounded-none border border-transparent bg-black px-4 py-16 text-center"'
);

// Add the closing tag for the wrapper
content = content.replace(
  /      \)}/g,
  '      )}\n      </div>'
);

fs.writeFileSync(path, content, 'utf8');
