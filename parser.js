// parseFolders.js
const fs = require('fs');
const path = require('path');

const parseDirectory = (dirPath, baseDir = dirPath) => {
  const items = fs.readdirSync(dirPath, { withFileTypes: true });

  let hasPageJS = items.some(item => item.isFile() && item.name === 'page.js');
  if (hasPageJS) {
    const relative = path.relative(baseDir, dirPath);
    console.log(relative || '.'); // Log '.' if it's the base 'app' dir itself
  }

  items.forEach(item => {
    if (item.isDirectory()) {
      const fullPath = path.join(dirPath, item.name);
      parseDirectory(fullPath, baseDir);
    }
  });
};

const ROOT_DIR = path.resolve(__dirname);
const appPath = path.join(ROOT_DIR, 'app');

if (fs.existsSync(appPath) && fs.statSync(appPath).isDirectory()) {
  console.log(`Directories in 'app' that contain page.js:\n`);
  parseDirectory(appPath);
} else {
  console.log(`❌ 'app' folder not found in ${ROOT_DIR}`);
}
