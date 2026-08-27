const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(
  "currentUser={currentUser || DEMO_PROFILES.SENDER}",
  "currentUser={currentUser || DEMO_PROFILES.SENDER}\n            wallet={wallet}"
);
fs.writeFileSync('src/App.tsx', content);
