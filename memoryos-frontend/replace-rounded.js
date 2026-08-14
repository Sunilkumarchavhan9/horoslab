const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.next' && f !== '.git') {
        walkDir(dirPath, callback);
      }
    } else {
      if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
        callback(dirPath);
      }
    }
  });
}

let modified = 0;
walkDir(path.join(__dirname, 'components'), processFile);
walkDir(path.join(__dirname, 'runtime'), processFile);
walkDir(path.join(__dirname, 'app'), processFile);

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content.replace(/\brounded-xl\b/g, 'rounded-md');
  newContent = newContent.replace(/\brounded-lg\b/g, 'rounded-md');
  newContent = newContent.replace(/\brounded-2xl\b/g, 'rounded-md');
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    modified++;
    console.log('Updated:', filePath);
  }
}
console.log(`Modified ${modified} files.`);
