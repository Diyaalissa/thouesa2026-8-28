const fs = require('fs');
let content = fs.readFileSync('src/components/sender/SenderPortal.tsx', 'utf8');

const profileTab = `
            <button
              onClick={() => setActiveTab('PROFILE')}
              className={\`w-full flex items-center \${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start \${
                activeTab === 'PROFILE' ? 'bg-indigo-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }\`}
              title={!isSidebarOpen ? (isAr ? 'الملف الشخصي' : 'Profile') : undefined}
            >
              <div className={\`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 \${activeTab === 'PROFILE' ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-700'}\`}>
                <UserIcon className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'الملف الشخصي' : 'Profile'}</div>
                  <div className={\`text-[10px] truncate \${activeTab === 'PROFILE' ? 'text-indigo-100' : 'text-slate-400'}\`}>
                    {isAr ? 'الإعدادات والهوية' : 'Settings & ID'}
                  </div>
                </div>
              )}
            </button>`;

const searchStr = `</button>
          </div>
        </aside>`;

if (!content.includes("onClick={() => setActiveTab('PROFILE')}")) {
  if (content.includes(searchStr)) {
    content = content.replace(searchStr, "</button>\n" + profileTab + "\n          </div>\n        </aside>");
    fs.writeFileSync('src/components/sender/SenderPortal.tsx', content);
    console.log("Profile tab inserted into sidebar.");
  } else {
    console.log("Could not find insertion point.");
  }
} else {
  console.log("Profile tab already exists in sidebar.");
}
