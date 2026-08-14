const fs = require('fs');
const file = 'c:\\projects\\MemoryOS\\memoryos-frontend\\components\\mission-control\\account-home-dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /      <\/div>\s*<input\s*type="text"/;
if (regex.test(content)) {
    const replacement = `      </div>

    {/* 3. Centered Search Input Bar */}
    <div className="max-w-3xl w-full mx-auto mb-12 relative z-50">
      <div className={cn(
        "relative flex items-center w-full bg-card dark:bg-[#121212] border rounded-md h-11 px-6 shadow-xs transition-all",
        isSearchFocused ? "border-[#0f52ff] ring-1 ring-[#0f52ff]/20 rounded-b-none" : "border-border dark:border-white/10"
      )}>
        <Search className="size-4 text-muted-foreground dark:text-white/40 pointer-events-none mr-3 shrink-0" />
        <input
          type="text"`;
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content);
    console.log("Fixed missing divs.");
} else {
    console.log("Could not find the target string!");
}
