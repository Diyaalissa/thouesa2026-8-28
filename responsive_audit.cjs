const fs = require('fs');
const path = require('path');

const filesToAudit = [
  'src/App.tsx',
  'src/components/sender/SenderPortal.tsx',
  'src/components/traveler/TravelerPortal.tsx',
  'src/components/traveler/TripManager.tsx',
  'src/components/hub/HubPortal.tsx',
  'src/components/admin/AdminPortal.tsx'
];

let totalFixes = 0;

for (const file of filesToAudit) {
  if (!fs.existsSync(file)) {
    console.log(`Skipping ${file} - not found`);
    continue;
  }
  
  let code = fs.readFileSync(file, 'utf8');
  let originalCode = code;

  // Find any bare grid-cols-2 that don't have mobile fallbacks
  code = code.replace(/className="([^"]*)grid-cols-2([^"]*)"/g, (match, p1, p2) => {
    // If it already has grid-cols-1 or md:grid-cols-2 etc., it's fine
    if (p1.includes('grid-cols-1') || p1.includes('md:grid-cols-2') || p1.includes('lg:grid-cols-2') || 
        p2.includes('grid-cols-1') || p2.includes('md:grid-cols-2') || p2.includes('lg:grid-cols-2')) {
      return match;
    }
    // Otherwise add responsive prefixes
    return `className="${p1}grid-cols-1 md:grid-cols-2${p2}"`;
  });

  // bare grid-cols-3
  code = code.replace(/className="([^"]*)grid-cols-3([^"]*)"/g, (match, p1, p2) => {
    if (p1.includes('grid-cols-1') || p1.includes('md:grid-cols-3') || p1.includes('lg:grid-cols-3') ||
        p2.includes('grid-cols-1') || p2.includes('md:grid-cols-3') || p2.includes('lg:grid-cols-3')) {
      return match;
    }
    return `className="${p1}grid-cols-1 md:grid-cols-2 lg:grid-cols-3${p2}"`;
  });

  // bare grid-cols-4
  code = code.replace(/className="([^"]*)grid-cols-4([^"]*)"/g, (match, p1, p2) => {
    if (p1.includes('grid-cols-1') || p1.includes('md:grid-cols-4') || p1.includes('lg:grid-cols-4') ||
        p2.includes('grid-cols-1') || p2.includes('md:grid-cols-4') || p2.includes('lg:grid-cols-4')) {
      return match;
    }
    return `className="${p1}grid-cols-1 md:grid-cols-2 lg:grid-cols-4${p2}"`;
  });
  
  // Clean up duplicate classes created by previous aggressive scripts
  code = code.replace(/md:grid-cols-2 md:grid-cols-2/g, 'md:grid-cols-2');
  code = code.replace(/grid-cols-1 grid-cols-1/g, 'grid-cols-1');
  code = code.replace(/md:grid-cols-1/g, 'grid-cols-1');
  
  // Make header/actions rows responsive (flex-col on mobile, flex-row on md)
  // Let's specifically target flex elements that are likely too wide for mobile
  code = code.replace(/className="flex items-center justify-between gap-4([^"]*)"/g, (match, p1) => {
    if (match.includes('flex-col')) return match;
    return `className="flex flex-col md:flex-row md:items-center justify-between gap-4${p1}"`;
  });
  
  code = code.replace(/className="flex items-center justify-between gap-3([^"]*)"/g, (match, p1) => {
    if (match.includes('flex-col') || match.includes('bg-white') || match.includes('p-3')) return match; // avoid very small cards
    return `className="flex flex-col md:flex-row md:items-center justify-between gap-3${p1}"`;
  });

  if (code !== originalCode) {
    fs.writeFileSync(file, code);
    console.log(`Fixed responsive layouts in ${file}`);
    totalFixes++;
  } else {
    console.log(`No layout fixes needed in ${file}`);
  }
}
console.log(`Total files modified: ${totalFixes}`);
