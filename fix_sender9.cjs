const fs = require('fs');

let content = fs.readFileSync('src/components/sender/SenderPortal.tsx', 'utf8');

const bannerStart = content.indexOf('{/* Weight Discrepancy Action Banner */}');
if (bannerStart !== -1) {
    let bannerEnd = content.indexOf('{isAr ? \'رفض واسترجاع الطرد للفرع\' : \'Reject & Return Package\'}', bannerStart);
    if (bannerEnd !== -1) {
        bannerEnd = content.indexOf(')}', bannerEnd) + 2;
        const fullBanner = content.substring(bannerStart, bannerEnd);
        
        content = content.replace(fullBanner, '');
        const injectTarget = '<form onSubmit={handleInlineDisputeSubmit} className="space-y-5">';
        content = content.replace(injectTarget, fullBanner + '\n                  ' + injectTarget);
        fs.writeFileSync('src/components/sender/SenderPortal.tsx', content);
        console.log('Moved banner successfully');
    } else {
        console.log('Could not find end of banner');
    }
} else {
    console.log('Could not find start of banner');
}
