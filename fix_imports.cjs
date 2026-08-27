const fs = require('fs');

function addImport(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes("import { UserProfile }")) {
    content = content.replace(
      "import React,",
      "import { UserProfile } from '../profile/UserProfile';\nimport React,"
    );
    fs.writeFileSync(file, content);
  }
}

addImport('src/components/sender/SenderPortal.tsx');
addImport('src/components/traveler/TravelerPortal.tsx');
