const fs = require('fs');
const path = require('path');
function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('ViewRegistry')) {
        content = content.replace(/import \{ ViewRegistry \} from ['"]..\/..\/runtime\/registry['"];/g, 'import { GlobalRealityRegistry } from "../../runtime/RealityRegistry";');
        content = content.replace(/ViewRegistry\.register/g, 'GlobalRealityRegistry.register');
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}
walk('./runtime/reality/perspectives');
