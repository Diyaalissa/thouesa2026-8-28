const fs = require('fs');
let content = fs.readFileSync('src/components/sender/SenderPortal.tsx', 'utf8');

// 1. Add PROFILE to activeTab type
content = content.replace(
  "| 'SPECIFIC_COUNTRY_BUY' | 'DISPUTES'",
  "| 'SPECIFIC_COUNTRY_BUY' | 'DISPUTES' | 'PROFILE'"
);

// 2. Add UserProfile import
if (!content.includes("import { UserProfile }")) {
  content = content.replace(
    "import React, { useState } from 'react';",
    "import React, { useState } from 'react';\nimport { UserProfile } from '../profile/UserProfile';"
  );
}

// 3. Add UserIcon to lucide-react imports if not there
if (!content.includes("User as UserIcon")) {
  content = content.replace("User,", "User, User as UserIcon,");
  if (!content.includes("User as UserIcon")) {
     content = content.replace("User }", "User, User as UserIcon }");
  }
}

// 4. Add the Sidebar Tab
const sidebarTab = `
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all \${
              activeTab === 'PROFILE'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }\`}
          >
            <UserIcon className="w-5 h-5" />
            {isSidebarOpen && <span>{isAr ? 'الملف الشخصي' : 'Profile'}</span>}
          </button>
        </nav>`;

if (!content.includes("setActiveTab('PROFILE')")) {
  content = content.replace("</nav>", sidebarTab);
}

// 5. Add the Main Area Switch
const mainArea = `
      {activeTab === 'PROFILE' && (
        <UserProfile currentUser={currentUser} locale={locale} isAr={isAr} />
      )}
`;

if (!content.includes("activeTab === 'PROFILE'")) {
  content = content.replace(
    "{activeTab === 'DISPUTES' && (",
    mainArea + "\n      {activeTab === 'DISPUTES' && ("
  );
}

fs.writeFileSync('src/components/sender/SenderPortal.tsx', content);
console.log("Patched SenderPortal");
