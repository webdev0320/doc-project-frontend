const fs = require('fs');
const path = require('path');

const filesToRefactor = [
  'src/pages/DashboardPage.jsx',
  'src/pages/WorkspacePage.jsx',
  'src/components/PropertiesPanel.jsx',
  'src/components/ThumbnailSidebar.jsx',
  'src/components/MainCanvas.jsx'
];

filesToRefactor.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace text colors
  content = content.replace(/\btext-white\b/g, 'dark:text-white text-slate-900');
  content = content.replace(/\btext-slate-200\b/g, 'dark:text-slate-200 text-slate-800');
  content = content.replace(/\btext-slate-300\b/g, 'dark:text-slate-300 text-slate-700');
  content = content.replace(/\btext-slate-400\b/g, 'dark:text-slate-400 text-slate-600');
  
  // Replace backgrounds
  content = content.replace(/\bbg-\[\#0d0f14\]\b/g, 'bg-surface-900');
  content = content.replace(/\bbg-\[\#13161e\]\b/g, 'bg-surface-800');
  content = content.replace(/\bbg-\[\#1a1d24\]\b/g, 'bg-surface-700');
  
  // Replace white overlays/borders
  content = content.replace(/\bbg-white\/5\b/g, 'dark:bg-white/5 bg-black/5');
  content = content.replace(/\bbg-white\/10\b/g, 'dark:bg-white/10 bg-black/10');
  content = content.replace(/\bbg-white\/20\b/g, 'dark:bg-white/20 bg-black/20');
  
  content = content.replace(/\bborder-white\/5\b/g, 'dark:border-white/5 border-black/5');
  content = content.replace(/\bborder-white\/10\b/g, 'dark:border-white/10 border-black/10');
  content = content.replace(/\bborder-white\/20\b/g, 'dark:border-white/20 border-black/20');
  
  // Hover states
  content = content.replace(/\bhover:bg-white\/5\b/g, 'dark:hover:bg-white/5 hover:bg-black/5');
  content = content.replace(/\bhover:bg-white\/10\b/g, 'dark:hover:bg-white/10 hover:bg-black/10');
  
  content = content.replace(/\bhover:border-white\/20\b/g, 'dark:hover:border-white/20 hover:border-black/20');
  content = content.replace(/\bhover:text-white\b/g, 'dark:hover:text-white hover:text-slate-900');

  // Fix button text contrast which should stay white even in light mode
  content = content.replace(/bg-indigo-600 dark:text-white text-slate-900/g, 'bg-indigo-600 text-white');
  
  fs.writeFileSync(filePath, content, 'utf-8');
});

console.log('Refactoring complete');
