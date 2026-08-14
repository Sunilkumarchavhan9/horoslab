const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'runtime/developer');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

const replacements = [
    { regex: /bg-\[#0a0a0a\]/g, replace: "bg-background" },
    { regex: /bg-\[#0f0f11\]/g, replace: "bg-background" },
    { regex: /bg-\[#09090b\]/g, replace: "bg-muted/20" },
    { regex: /bg-\[#121212\]/g, replace: "bg-card" },
    { regex: /bg-\[#18181b\]/g, replace: "bg-muted/30" },
    { regex: /bg-\[#1e1e1e\]/g, replace: "bg-muted/10" },
    { regex: /bg-\[#050505\]/g, replace: "bg-muted/50" },
    { regex: /border-\[#27272a\]/g, replace: "border-border" },
    { regex: /border-\[#2b2b2b\]/g, replace: "border-border" },
    { regex: /border-\[#3f3f46\]/g, replace: "border-border/80 hover:border-border" },
    { regex: /text-\[#ededed\]/g, replace: "text-foreground" },
    { regex: /text-white/g, replace: "text-foreground" },
    { regex: /text-black/g, replace: "text-background" },
    { regex: /text-\[#a1a1aa\]/g, replace: "text-muted-foreground" },
    { regex: /text-\[#71717a\]/g, replace: "text-muted-foreground" },
    { regex: /text-\[#d4d4d8\]/g, replace: "text-foreground" },
    { regex: /bg-[#27272a]/g, replace: "bg-muted" },
    { regex: /bg-[#3f3f46]/g, replace: "bg-muted/80" },
    { regex: /hover:bg-\[#3f3f46\]/g, replace: "hover:bg-muted" },
    { regex: /hover:bg-\[#18181b\]/g, replace: "hover:bg-muted/50" },
    { regex: /hover:bg-[#27272a]/g, replace: "hover:bg-muted" },
    { regex: /bg-white\/5/g, replace: "bg-foreground/5" },
    { regex: /hover:bg-white\/5/g, replace: "hover:bg-foreground/5" },
    { regex: /hover:bg-white\/10/g, replace: "hover:bg-foreground/10" },
    { regex: /border-white\/5/g, replace: "border-foreground/5" },
    { regex: /border-white\/10/g, replace: "border-foreground/10" },
    { regex: /bg-white/g, replace: "bg-foreground" },
    { regex: /text-white/g, replace: "text-foreground" },
    { regex: /border-white/g, replace: "border-foreground" }
];

walk(dir, function(filePath) {
    if (filePath.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;
        replacements.forEach(r => {
            newContent = newContent.replace(r.regex, r.replace);
        });
        
        // Also update Monaco Editor theme based on a generic 'resolvedTheme' 
        // We'll replace `theme="vs-dark"` with `theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}`
        // But since we don't have resolvedTheme in scope, let's just inject `const { resolvedTheme } = useTheme();`
        // Actually, easiest way is to let the user see it fixed without changing monaco theme, but Monaco in light mode would look bad vs-dark.
        // Let's just fix the tailwind classes first.
        
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log("Updated", filePath);
        }
    }
});
