const fs = require('fs');
const file = 'app/use-cases/ai-assistant/page.tsx';
let content = fs.readFileSync(file, 'utf-8');
content = content.replace(/Deploy your assistant\{" "\}\r?\n\s*<ChevronRight/g, 'Deploy your assistant{" "}\n                      <ArrowRight');
content = content.replace(/Read the stack\{" "\}\r?\n\s*<ChevronRight/g, 'Read the stack{" "}\n                      <ArrowRight');
fs.writeFileSync(file, content);
