const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach( f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
};

walk(path.join(__dirname, 'src'), (filePath) => {
  if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) return;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace backgrounds
  content = content.replace(/\bbg-\[\#0d0f14\]\b/g, 'bg-surface-900');
  content = content.replace(/\bbg-\[\#13161e\]\b/g, 'bg-surface-800');
  content = content.replace(/\bbg-\[\#1a1d24\]\b/g, 'bg-surface-700');
  content = content.replace(/\bbg-\[\#1a1d24\]\/80\b/g, 'bg-surface-700/80');
  content = content.replace(/\bbg-\[\#13161e\]\/50\b/g, 'bg-surface-800/50');

  // Replace text colors
  content = content.replace(/\btext-white\b/g, 'dark:text-white text-slate-900');
  
  // Replace borders
  content = content.replace(/\bborder-white\/10\b/g, 'dark:border-white/10 border-black/10');
  content = content.replace(/\bborder-white\/5\b/g, 'dark:border-white/5 border-black/5');

  // Fix button text contrast which should stay white even in light mode
  // Pattern: classes that contain bg-indigo or bg-emerald or bg-red
  content = content.replace(/bg-indigo-600 dark:text-white text-slate-900/g, 'bg-indigo-600 text-white');
  content = content.replace(/bg-emerald-600 dark:text-white text-slate-900/g, 'bg-emerald-600 text-white');
  content = content.replace(/bg-red-600 dark:text-white text-slate-900/g, 'bg-red-600 text-white');
  
  fs.writeFileSync(filePath, content, 'utf-8');
});

console.log('Global Refactoring complete');
