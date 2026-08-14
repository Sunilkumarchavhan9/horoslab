const fs = require('fs');
const path = require('path');

const dir = 'c:\\projects\\MemoryOS\\memoryos-frontend\\runtime\\developer\\perspectives';

function processDirectory(directory) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith('View.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');

            // 1. Remove border and change bg from header
            content = content.replace(
                '<div className="flex flex-col shrink-0 border-b border-border bg-card">',
                '<div className="flex flex-col shrink-0 bg-background">'
            );

            // 2. Remove border from toolbar
            content = content.replace(
                '<div className="flex items-center justify-between px-6 py-3 bg-muted/20 border-t border-border overflow-x-auto custom-scrollbar">',
                '<div className="flex items-center justify-between px-6 py-3 bg-muted/20 overflow-x-auto custom-scrollbar">'
            );

            // 3. Remove /50 from table area background
            content = content.replace(
                '<div className="flex-1 overflow-auto bg-background/50 custom-scrollbar">',
                '<div className="flex-1 overflow-auto bg-background custom-scrollbar">'
            );
            
            // 3b. Some might have "flex-1 overflow-y-auto..."
            content = content.replace(
                '<div className="flex-1 overflow-y-auto bg-background/50 custom-scrollbar">',
                '<div className="flex-1 overflow-y-auto bg-background custom-scrollbar">'
            );

            // 4. Remove pseudo-shadow border from table header
            content = content.replace(
                '<thead className="sticky top-0 bg-card z-10 shadow-[0_1px_0_rgba(255,255,255,0.1)]">',
                '<thead className="sticky top-0 bg-card z-10">'
            );

            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`Updated ${fullPath}`);
        }
    }
}

processDirectory(dir);
