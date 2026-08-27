const fs = require('fs');
let content = fs.readFileSync('src/components/sender/SenderPortal.tsx', 'utf8');

// Update imports
content = content.replace(
  "import { Hub, ItemCategory, ItemCondition, Locale, OrderItem, ServiceType, Shipment, User }",
  "import { EscrowWallet, Hub, ItemCategory, ItemCondition, Locale, OrderItem, ServiceType, Shipment, User }"
);

// Update Props
content = content.replace(
  "currentUser: User;",
  "currentUser: User;\n  wallet?: EscrowWallet | null;"
);

// Update destructuring
content = content.replace(
  "currentUser,",
  "currentUser,\n  wallet,"
);

// Add 'WALLET' to activeTab state
content = content.replace(
  "| 'SPECIFIC_COUNTRY_BUY' | 'DISPUTES' | 'PROFILE'",
  "| 'SPECIFIC_COUNTRY_BUY' | 'DISPUTES' | 'PROFILE' | 'WALLET'"
);

// Add WalletIcon import
if (!content.includes("Wallet,")) {
  content = content.replace("ShieldAlert,", "ShieldAlert, Wallet,");
}

fs.writeFileSync('src/components/sender/SenderPortal.tsx', content);
