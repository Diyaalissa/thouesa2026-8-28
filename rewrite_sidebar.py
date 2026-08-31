import re

with open('src/components/traveler/TravelerPortal.tsx', 'r') as f:
    content = f.read()

new_sidebar_buttons = """<div className="p-4 space-y-2 flex-1">
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'DASHBOARD' ? 'bg-teal-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'الرئيسية' : 'Dashboard') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'DASHBOARD' ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-700'}`}>
                <Menu className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'الرئيسية' : 'Dashboard'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'DASHBOARD' ? 'text-teal-100' : 'text-slate-400'}`}>
                    {isAr ? 'نظرة عامة' : 'Overview'}
                  </div>
                </div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('MY_TRIPS')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'MY_TRIPS' ? 'bg-teal-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'رحلاتي' : 'Trips') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'MY_TRIPS' ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-700'}`}>
                <Plane className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'رحلاتي' : 'Trips'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'MY_TRIPS' ? 'text-teal-100' : 'text-slate-400'}`}>
                    {travelerTrips.length} {isAr ? 'رحلات مسجلة' : 'Registered'}
                  </div>
                </div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('MY_BAG')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'MY_BAG' ? 'bg-amber-500 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'حقيبتي' : 'My Bag') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'MY_BAG' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-600'}`}>
                <ShieldCheck className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'حقيبتي' : 'My Bag'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'MY_BAG' ? 'text-amber-100' : 'text-slate-400'}`}>
                    {isAr ? 'قائمة الطرود' : 'Manifest & Custody'}
                  </div>
                </div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('WALLET')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'WALLET' ? 'bg-teal-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'المحفظة' : 'Wallet') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'WALLET' ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-700'}`}>
                <Wallet className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'المحفظة' : 'Wallet'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'WALLET' ? 'text-teal-100' : 'text-slate-400'}`}>
                    {isAr ? 'الأرباح والسحب' : 'Earnings & Payout'}
                  </div>
                </div>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('PROFILE')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'PROFILE' ? 'bg-teal-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'حسابي' : 'Profile') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'PROFILE' ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-700'}`}>
                <UserIcon className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'حسابي' : 'Profile'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'PROFILE' ? 'text-teal-100' : 'text-slate-400'}`}>
                    {isAr ? 'الهوية والتوثيق' : 'KYC & Settings'}
                  </div>
                </div>
              )}
            </button>
          </div>"""

# Replace from `<div className="p-4 space-y-2 flex-1">` until `</aside>`
content = re.sub(r'<div className="p-4 space-y-2 flex-1">.*?</aside>', new_sidebar_buttons + '\n        </aside>', content, flags=re.DOTALL)

with open('src/components/traveler/TravelerPortal.tsx', 'w') as f:
    f.write(content)
