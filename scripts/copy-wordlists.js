const { copyFileSync, mkdirSync, readdirSync } = require('fs');
const { join } = require('path');

try {
  const outDir = join(process.cwd(), 'out');
  const wordlistsDir = join(outDir, 'wordlists');
  
  // Ensure wordlists directory exists
  mkdirSync(wordlistsDir, { recursive: true });
  
  // Copy all word list JSON files
  const dataDir = join(process.cwd(), 'data');
  const files = readdirSync(dataDir).filter(file => file.endsWith('.json'));
  
  files.forEach(file => {
    const source = join(dataDir, file);
    const dest = join(wordlistsDir, file);
    copyFileSync(source, dest);
    console.log(`Copied ${file} to out/wordlists/`);
  });
  
  console.log('All word lists copied successfully!');
} catch (error) {
  console.error('Error copying word lists:', error);
  process.exit(1);
}