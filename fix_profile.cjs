const fs = require('fs');
let content = fs.readFileSync('src/components/profile/UserProfile.tsx', 'utf8');
content = content.replace(/name="fullName"[\s]+disabled=\{!isEditing\}/, 'name="fullName"\n                      disabled={true}');
fs.writeFileSync('src/components/profile/UserProfile.tsx', content);
