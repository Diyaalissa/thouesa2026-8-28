const fs = require('fs');

let content = fs.readFileSync('src/components/traveler/TravelerPortal.tsx', 'utf8');

if (!content.includes('Menu,')) {
  content = content.replace('import {', 'import {\n  Menu,\n  X,');
}

if (!content.includes('isSidebarOpen')) {
  content = content.replace('const [activeTab, setActiveTab]', 'const [isSidebarOpen, setIsSidebarOpen] = useState(true);\n  const [activeTab, setActiveTab]');
}

// Find return index
const returnIndex = content.indexOf('  return (\n    <div className="space-y-6" dir={isAr ? \'rtl\' : \'ltr\'}>');
if (returnIndex === -1) {
  console.log("Could not find return block");
  process.exit(1);
}

const beforeReturn = content.slice(0, returnIndex);

const newReturn = `  return (
    <div className="flex flex-col h-full bg-slate-50" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Traveler Top Header */}
      <header className="shrink-0 flex items-center justify-between px-6 py-4 bg-slate-900 text-white shadow-md z-10 relative">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold border border-teal-500/30">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-wide">
                {isAr ? 'بوابة المسافر المعتمد والضمان المالي' : 'Traveler Portal & Escrow'}
              </h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-md border border-emerald-500/30 uppercase tracking-wider">
                KYC {currentUser.kycStatus}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isAr
                ? 'مرحباً، ' + currentUser.fullName
                : 'Welcome, ' + currentUser.fullName}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside
          className={\`shrink-0 flex flex-col bg-white border-\${isAr ? 'l' : 'r'} border-slate-200 overflow-y-auto transition-all duration-300 z-20 \${
            isSidebarOpen ? 'w-64' : 'w-20'
          }\`}
        >
          <div className="p-4 space-y-2 flex-1">
            <button
              onClick={() => setActiveTab('MY_TRIPS')}
              className={\`w-full flex items-center \${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start \${
                activeTab === 'MY_TRIPS' ? 'bg-teal-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }\`}
              title={!isSidebarOpen ? (isAr ? 'رحلاتي المجدولة' : 'My Flights') : undefined}
            >
              <div className={\`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 \${activeTab === 'MY_TRIPS' ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-700'}\`}>
                <Plane className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'رحلاتي المجدولة' : 'My Flights'}</div>
                  <div className={\`text-[10px] truncate \${activeTab === 'MY_TRIPS' ? 'text-teal-100' : 'text-slate-400'}\`}>
                    {travelerTrips.length} {isAr ? 'رحلات مسجلة' : 'flights'}
                  </div>
                </div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('NEW_TRIP')}
              className={\`w-full flex items-center \${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start \${
                activeTab === 'NEW_TRIP' ? 'bg-teal-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }\`}
              title={!isSidebarOpen ? (isAr ? 'إضافة رحلة جديدة' : 'Add Flight') : undefined}
            >
              <div className={\`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 \${activeTab === 'NEW_TRIP' ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-700'}\`}>
                <PlusCircle className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'إضافة رحلة جديدة' : 'Add Flight'}</div>
                  <div className={\`text-[10px] truncate \${activeTab === 'NEW_TRIP' ? 'text-teal-100' : 'text-slate-400'}\`}>
                    {isAr ? 'تسجيل أمتعة متاحة' : 'Register luggage'}
                  </div>
                </div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('WALLET')}
              className={\`w-full flex items-center \${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start \${
                activeTab === 'WALLET' ? 'bg-teal-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }\`}
              title={!isSidebarOpen ? (isAr ? 'محفظة الضمان المالي' : 'Escrow Wallet') : undefined}
            >
              <div className={\`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 \${activeTab === 'WALLET' ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-700'}\`}>
                <Wallet className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'محفظة الضمان المالي' : 'Escrow Wallet'}</div>
                  <div className={\`text-[10px] truncate \${activeTab === 'WALLET' ? 'text-teal-100' : 'text-slate-400'}\`}>
                    {isAr ? 'الأرصدة والأرباح' : 'Balances & Earnings'}
                  </div>
                </div>
              )}
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50/50 p-6 space-y-6">`;

const myTripsIndex = content.indexOf('{/* TAB 1: MY TRIPS */}');
if (myTripsIndex === -1) {
  console.log("Could not find MY TRIPS section");
  process.exit(1);
}

const afterTabs = content.slice(myTripsIndex);

const finalContent = beforeReturn + newReturn + "\n          " + afterTabs;

const correctedEnd = finalContent.replace(/    <\/div>\n  \);\n};\n?$/, '        </main>\n      </div>\n    </div>\n  );\n};\n');

fs.writeFileSync('src/components/traveler/TravelerPortal.tsx', correctedEnd);
console.log("Updated TravelerPortal");
