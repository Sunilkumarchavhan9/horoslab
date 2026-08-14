const fs = require('fs');
const path = require('path');
const file = 'c:\\projects\\MemoryOS\\memoryos-frontend\\components\\mission-control\\account-home-dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update props
content = content.replace(
    'export function AccountHomeDashboard() {',
    'export function AccountHomeDashboard({ onNavigate }: { onNavigate?: (section: string) => void }) {'
);

// Update col1 buttons
content = content.replace(
    '<button className="w-full text-left px-3 py-2 rounded-md hover:bg-card dark:bg-white/10 flex items-center gap-2">\n <Plus className="size-3.5" /> Add institution\n </button>',
    '<button onClick={() => onNavigate?.("workspace-institutions")} className="w-full text-left px-3 py-2 rounded-md hover:bg-card dark:bg-white/10 flex items-center gap-2">\n <Plus className="size-3.5" /> Add institution\n </button>'
);
content = content.replace(
    '<button className="w-full text-left px-3 py-2 rounded-md hover:bg-card dark:bg-white/10 flex items-center gap-2">\n <MoreHorizontal className="size-3.5" /> Show all\n </button>',
    '<button onClick={() => onNavigate?.("workspace-institutions")} className="w-full text-left px-3 py-2 rounded-md hover:bg-card dark:bg-white/10 flex items-center gap-2">\n <MoreHorizontal className="size-3.5" /> Show all\n </button>'
);

// Update col2 buttons
content = content.replace(
    '<button className="w-full text-left px-3 py-2 rounded-md hover:bg-card dark:bg-white/10 flex items-center gap-2">\n <Plus className="size-3.5" /> Start mission\n </button>',
    '<button onClick={() => onNavigate?.("workspace-missions")} className="w-full text-left px-3 py-2 rounded-md hover:bg-card dark:bg-white/10 flex items-center gap-2">\n <Plus className="size-3.5" /> Start mission\n </button>'
);
// Make sure to replace the second "Show all" - we will just do global replace since the labels are the same
// Wait, col2 "Show all" is identical to col1 "Show all" except it's in a different block.
// A safe way is to use regex targeting the col2 block.
content = content.replace(
    /\{activeMenu === "col2" && \([\s\S]*?<Plus className="size-3.5" \/> Start mission[\s\S]*?<MoreHorizontal className="size-3.5" \/> Show all\n\s*<\/button>/m,
    (match) => {
        return match.replace(
            '<button className="w-full text-left px-3 py-2 rounded-md hover:bg-card dark:bg-white/10 flex items-center gap-2">\n <MoreHorizontal className="size-3.5" /> Show all\n </button>',
            '<button onClick={() => onNavigate?.("workspace-missions")} className="w-full text-left px-3 py-2 rounded-md hover:bg-card dark:bg-white/10 flex items-center gap-2">\n <MoreHorizontal className="size-3.5" /> Show all\n </button>'
        );
    }
);

// Update col3 buttons
content = content.replace(
    '<button className="w-full text-left px-3 py-2 rounded-md hover:bg-card dark:bg-white/10 flex items-center gap-2">\n <Plus className="size-3.5" /> Add recent\n </button>',
    '<button onClick={() => onNavigate?.("recents")} className="w-full text-left px-3 py-2 rounded-md hover:bg-card dark:bg-white/10 flex items-center gap-2">\n <Plus className="size-3.5" /> Add recent\n </button>'
);
content = content.replace(
    /\{activeMenu === "col3" && \([\s\S]*?<Plus className="size-3.5" \/> Add recent[\s\S]*?<MoreHorizontal className="size-3.5" \/> Show all\n\s*<\/button>/m,
    (match) => {
        return match.replace(
            '<button className="w-full text-left px-3 py-2 rounded-md hover:bg-card dark:bg-white/10 flex items-center gap-2">\n <MoreHorizontal className="size-3.5" /> Show all\n </button>',
            '<button onClick={() => onNavigate?.("recents")} className="w-full text-left px-3 py-2 rounded-md hover:bg-card dark:bg-white/10 flex items-center gap-2">\n <MoreHorizontal className="size-3.5" /> Show all\n </button>'
        );
    }
);

fs.writeFileSync(file, content);
console.log("Wired up navigation buttons.");
