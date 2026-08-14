const ts = require('typescript');
const fs = require('fs');

const file = 'c:\\projects\\MemoryOS\\memoryos-frontend\\components\\mission-control\\account-home-dashboard.tsx';
const content = fs.readFileSync(file, 'utf8');

const sourceFile = ts.createSourceFile(
    'account-home-dashboard.tsx',
    content,
    ts.ScriptTarget.Latest,
    true
);

const diagnostics = sourceFile.parseDiagnostics;

if (diagnostics.length > 0) {
    console.log("Syntax Errors:");
    diagnostics.forEach(diag => {
        const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
        const pos = sourceFile.getLineAndCharacterOfPosition(diag.start);
        console.log(`Line ${pos.line + 1}: ${message}`);
    });
} else {
    console.log("No syntax errors found by TS parser.");
}
