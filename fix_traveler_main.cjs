const fs = require('fs');
let content = fs.readFileSync('src/components/traveler/TravelerPortal.tsx', 'utf8');

const mainArea = `
      {activeTab === 'PROFILE' && (
        <UserProfile currentUser={currentUser} locale={locale} isAr={isAr} />
      )}
`;

const searchStr = `<main className="flex-1 min-w-0 overflow-y-auto bg-slate-50/50 p-6 space-y-6">`;

if (!content.includes("<UserProfile currentUser")) {
  content = content.replace(searchStr, searchStr + mainArea);
  fs.writeFileSync('src/components/traveler/TravelerPortal.tsx', content);
  console.log("Profile component inserted into TravelerPortal main area.");
} else {
  console.log("Profile component already exists.");
}
