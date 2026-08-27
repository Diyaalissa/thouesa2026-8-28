const fs = require('fs');
let content = fs.readFileSync('src/components/traveler/TravelerPortal.tsx', 'utf8');

// 1. Add PROFILE to activeTab type
content = content.replace(
  "useState<'MY_TRIPS' | 'NEW_TRIP' | 'WALLET'>",
  "useState<'MY_TRIPS' | 'NEW_TRIP' | 'WALLET' | 'PROFILE'>"
);

// 2. Add UserProfile import
if (!content.includes("import { UserProfile }")) {
  content = content.replace(
    "import React, { useState, useMemo } from 'react';",
    "import React, { useState, useMemo } from 'react';\nimport { UserProfile } from '../profile/UserProfile';"
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
              className={\`w-full flex items-center \${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start \${
                activeTab === 'PROFILE' ? 'bg-teal-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }\`}
              title={!isSidebarOpen ? (isAr ? 'الملف الشخصي' : 'Profile') : undefined}
            >
              <div className={\`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 \${activeTab === 'PROFILE' ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-700'}\`}>
                <UserIcon className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'الملف الشخصي' : 'Profile'}</div>
                  <div className={\`text-[10px] truncate \${activeTab === 'PROFILE' ? 'text-teal-100' : 'text-slate-400'}\`}>
                    {isAr ? 'الإعدادات والهوية' : 'Settings & ID'}
                  </div>
                </div>
              )}
            </button>
          </div>
        </aside>
`;

if (!content.includes("setActiveTab('PROFILE')")) {
  content = content.replace("</div>\n        </aside>", sidebarTab);
}

// 5. Add the Main Area Switch
const mainArea = `
      {activeTab === 'PROFILE' && (
        <UserProfile currentUser={currentUser} locale={locale} isAr={isAr} />
      )}
`;

if (!content.includes("activeTab === 'PROFILE'")) {
  content = content.replace(
    "{/* Content Area */}\n        <main className=\"flex-1 min-w-0 overflow-y-auto bg-slate-50/50 p-6 space-y-6\">\n          {/* TAB 1: MY TRIPS */}",
    "{/* Content Area */}\n        <main className=\"flex-1 min-w-0 overflow-y-auto bg-slate-50/50 p-6 space-y-6\">\n" + mainArea + "\n          {/* TAB 1: MY TRIPS */}"
  );
}

fs.writeFileSync('src/components/traveler/TravelerPortal.tsx', content);
console.log("Patched TravelerPortal");
