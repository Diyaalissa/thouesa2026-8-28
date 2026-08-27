const fs = require('fs');
let content = fs.readFileSync('src/components/sender/SenderPortal.tsx', 'utf8');

content = content.replace("EscrowWallet, Sparkles,", "EscrowWallet,");
content = content.replace("ShieldAlert,", "ShieldAlert, Wallet, Sparkles,");

// Wallet is also mentioned as missing in line 565 and 608.
fs.writeFileSync('src/components/sender/SenderPortal.tsx', content);
