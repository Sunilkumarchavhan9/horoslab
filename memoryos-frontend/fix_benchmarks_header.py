import re

with open('c:\\projects\\MemoryOS\\memoryos-frontend\\components\\developer-console\\sections\\benchmarks-section.tsx', 'r') as f:
    content = f.read()

# Fix the header block
header_pattern = re.compile(
    r'<div className="relative overflow-hidden border-b border-white/5 bg-black pb-8 pt-2">\s*'
    r'<div className="absolute inset-0 bg-\[radial-gradient[^>]+>\s*'
    r'<div className="relative z-10 flex flex-wrap items-end justify-between gap-6 px-6">\s*'
    r'<div>\s*'
    r'<h1 className="text-\[16px\] font-semibold tracking-\[-0.04em\] sm:text-\[18px\]">Benchmarks</h1>\s*'
    r'<p className="mt-1 text-\[12px\] leading-6 text-white/46 sm:text-\[13px\]">',
    re.MULTILINE
)

new_header = (
    '<div className="relative overflow-hidden border-b border-transparent bg-black px-6 py-8">\n'
    '        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,121,255,0.06),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(38,120,255,0.04),transparent_50%)]" />\n'
    '        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6 px-6">\n'
    '          <div>\n'
    '            <h1 className="text-[26px] font-bold tracking-tight text-white shadow-black/50 drop-shadow-sm">Benchmarks</h1>\n'
    '            <p className="mt-1.5 text-[14px] text-white/50 max-w-xl leading-relaxed">'
)

content = header_pattern.sub(new_header, content)

# Fix the closing div spacing
divs_pattern = re.compile(
    r'        </div>\s*</div>\s*<div className="mt-3 flex flex-wrap items-center gap-2\.5">',
    re.MULTILINE
)

new_divs = (
    '          </div>\n'
    '        </div>\n'
    '      </div>\n\n'
    '      <div className="px-6 mt-8 space-y-8 max-w-[1440px] pb-12">\n'
    '        <div className="flex flex-wrap items-center gap-2.5">'
)

content = divs_pattern.sub(new_divs, content)

with open('c:\\projects\\MemoryOS\\memoryos-frontend\\components\\developer-console\\sections\\benchmarks-section.tsx', 'w') as f:
    f.write(content)

print("Done")
