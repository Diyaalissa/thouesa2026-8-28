const fs = require('fs');

let content = fs.readFileSync('src/components/sender/SenderPortal.tsx', 'utf8');

const regex = /\{\/\* Weight Discrepancy Action Banner \*\/\}[\s\S]*?\{isAr \? 'رفض' : 'Reject'\}<\/span>\s*<\/button>\s*<\/div>\s*<\/div>\s*\)\}/;
const match = content.match(regex);

if (match) {
    content = content.replace(match[0], '');
    const injectTarget = `<form onSubmit={handleInlineDisputeSubmit} className="space-y-5">`;
    content = content.replace(injectTarget, match[0] + '\n                  ' + injectTarget);
    fs.writeFileSync('src/components/sender/SenderPortal.tsx', content);
    console.log("Replaced successfully");
} else {
    console.log("Could not find regex match");
}
