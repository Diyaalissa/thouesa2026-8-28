import re

with open('src/components/traveler/TravelerPortal.tsx', 'r') as f:
    content = f.read()

# 1. Add Offline State and Network Listener
state_injections = """
  const [isOffline, setIsOffline] = useState(false);
  const [hasNewPackage, setHasNewPackage] = useState(true); // Faked for UX demonstration
  const [hasNewEarnings, setHasNewEarnings] = useState(true); // Faked for UX demonstration

  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    if (!navigator.onLine) {
      setIsOffline(true);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Context-aware FAB logic
  const activeTrip = trips.find(t => t.status === 'SCHEDULED' || t.status === 'IN_TRANSIT');
  const hasTripToday = !!activeTrip; // Simplified check for UX Demo
"""

content = content.replace("  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);", state_injections + "\n  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);")


# 2. Add Offline Banner to the top of the main area
offline_banner = """
        {/* Content Area */}
        <main className="flex-1 min-w-0 flex flex-col h-[100dvh] overflow-y-auto bg-slate-50/50 pb-24 md:pb-6 relative">
          
          {/* Offline Mode Banner */}
          {isOffline && (
            <div className="sticky top-0 z-40 bg-slate-800 text-slate-200 text-xs py-2 px-4 flex items-center justify-center gap-2 shadow-sm">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'أنت الآن غير متصل بالإنترنت. تم تفعيل وضع التخزين المؤقت للمسافر.' : 'You are currently offline. Traveler offline mode activated.'}</span>
            </div>
          )}
          
          <div className="p-4 md:p-6 space-y-6">
"""

content = re.sub(
    r"\{\/\* Content Area \*\/\}\s*<main className=\"flex-1 min-w-0 overflow-y-auto bg-slate-50/50 p-4 md:p-6 pb-24 md:pb-6 space-y-6\">\s*(?=\{currentUser.kycStatus)",
    offline_banner,
    content
)

# And we need to close the extra div for the main area wrapping
content = re.sub(
    r"(\{\/\* Edit Flight Trip Modal \*\/\}.*?</main>)",
    r"          </div>\n        \1",
    content,
    flags=re.DOTALL
)

# 3. Re-write the Sidebar completely to match the new structure
sidebar_replacement = """        {/* Desktop Sidebar */}
        <aside className={`hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 z-10 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
            {isSidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold">
                  T
                </div>
                <span className="font-bold text-slate-800 text-sm">{isAr ? 'بوابة المسافر' : 'Traveler'}</span>
              </div>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors ${!isSidebarOpen && 'w-full flex justify-center'}`}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-3 space-y-8">
            
            {/* Section 1: Operational */}
            <div className="space-y-1">
              {isSidebarOpen && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">{isAr ? 'العمليات التشغيلية' : 'Operations'}</div>}
              
              <button
                onClick={() => setActiveTab('DASHBOARD')}
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                  activeTab === 'DASHBOARD' ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={!isSidebarOpen ? (isAr ? 'الرئيسية' : 'Dashboard') : undefined}
              >
                <div className="relative">
                  <Home className={`w-5 h-5 ${activeTab === 'DASHBOARD' ? 'text-teal-600' : ''}`} />
                </div>
                {isSidebarOpen && <div className="text-sm">{isAr ? 'الرئيسية' : 'Dashboard'}</div>}
              </button>

              <button
                onClick={() => setActiveTab('MY_TRIPS')}
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                  activeTab === 'MY_TRIPS' ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={!isSidebarOpen ? (isAr ? 'إدارة رحلاتي' : 'My Trips') : undefined}
              >
                <Plane className={`w-5 h-5 ${activeTab === 'MY_TRIPS' ? 'text-teal-600' : ''}`} />
                {isSidebarOpen && <div className="text-sm">{isAr ? 'إدارة رحلاتي' : 'My Trips'}</div>}
              </button>

              <button
                onClick={() => { setActiveTab('MY_BAG'); setHasNewPackage(false); }}
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                  activeTab === 'MY_BAG' ? 'bg-amber-50 text-amber-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={!isSidebarOpen ? (isAr ? 'حقيبتي / الطرود' : 'My Bag') : undefined}
              >
                <div className="relative">
                  <ShieldCheck className={`w-5 h-5 ${activeTab === 'MY_BAG' ? 'text-amber-600' : ''}`} />
                  {hasNewPackage && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>}
                </div>
                {isSidebarOpen && <div className="text-sm flex-1">{isAr ? 'حقيبتي / الطرود' : 'My Bag'}</div>}
                {isSidebarOpen && hasNewPackage && <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-bold">1 {isAr ? 'جديد' : 'New'}</span>}
              </button>
            </div>

            {/* Section 2: Financial */}
            <div className="space-y-1">
              {isSidebarOpen && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">{isAr ? 'المالية والضمانات' : 'Financials'}</div>}
              
              <button
                onClick={() => { setActiveTab('WALLET'); setHasNewEarnings(false); }}
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                  activeTab === 'WALLET' ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={!isSidebarOpen ? (isAr ? 'المحفظة والأرباح' : 'Wallet') : undefined}
              >
                <div className="relative">
                  <Wallet className={`w-5 h-5 ${activeTab === 'WALLET' ? 'text-teal-600' : ''}`} />
                  {hasNewEarnings && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>}
                </div>
                {isSidebarOpen && <div className="text-sm flex-1">{isAr ? 'المحفظة والأرباح' : 'Wallet'}</div>}
              </button>

              <button
                onClick={() => setActiveTab('MORE')}
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start text-slate-600 hover:bg-slate-50 hover:text-slate-900`}
                title={!isSidebarOpen ? (isAr ? 'سجل الضمانات' : 'Deposits') : undefined}
              >
                <History className="w-5 h-5" />
                {isSidebarOpen && <div className="text-sm">{isAr ? 'سجل الضمانات' : 'Escrow History'}</div>}
              </button>
            </div>

            {/* Section 3: Personal & Legal */}
            <div className="space-y-1">
              {isSidebarOpen && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">{isAr ? 'الشخصية والقانونية' : 'Personal & Legal'}</div>}
              
              <button
                onClick={() => setActiveTab('PROFILE')}
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                  activeTab === 'PROFILE' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={!isSidebarOpen ? (isAr ? 'الملف الشخصي' : 'Profile') : undefined}
              >
                <UserIcon className={`w-5 h-5 ${activeTab === 'PROFILE' ? 'text-indigo-600' : ''}`} />
                {isSidebarOpen && <div className="text-sm">{isAr ? 'الملف الشخصي' : 'Profile & KYC'}</div>}
              </button>

              <button
                onClick={() => setActiveTab('MORE')}
                className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start text-slate-600 hover:bg-slate-50 hover:text-slate-900`}
                title={!isSidebarOpen ? (isAr ? 'الشروط والتعهدات' : 'Terms') : undefined}
              >
                <FileText className="w-5 h-5" />
                {isSidebarOpen && <div className="text-sm">{isAr ? 'الشروط والتعهدات' : 'Terms & Policies'}</div>}
              </button>
            </div>
            
          </div>
          
          {/* Section 4: Settings & Support */}
          <div className="p-3 border-t border-slate-200 space-y-1">
            <button
              onClick={() => setActiveTab('MORE')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start text-slate-600 hover:bg-slate-50 hover:text-slate-900`}
              title={!isSidebarOpen ? (isAr ? 'الإعدادات' : 'Settings') : undefined}
            >
              <Settings className="w-5 h-5" />
              {isSidebarOpen && <div className="text-sm">{isAr ? 'الإعدادات' : 'Settings'}</div>}
            </button>
            
            <button
              onClick={() => setActiveTab('MORE')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start text-emerald-600 hover:bg-emerald-50`}
              title={!isSidebarOpen ? (isAr ? 'مركز الدعم' : 'Support') : undefined}
            >
              <MessageCircle className="w-5 h-5" />
              {isSidebarOpen && <div className="text-sm font-bold">{isAr ? 'الدعم والطوارئ' : 'Support & SOS'}</div>}
            </button>
          </div>
        </aside>"""

content = re.sub(
    r"\{\/\* Desktop Sidebar \*\/\}.*?(?=\{\/\* Content Area \*\/\})",
    sidebar_replacement + "\n\n        ",
    content,
    flags=re.DOTALL
)

# 4. Context Aware FAB Update
new_fab = """        {/* 3. Center FAB (Context-Aware) */}
        <div className="relative w-[28%] flex justify-center -top-6">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (hasTripToday) {
                // If they have a trip, default to QR Scan action or just open bottom sheet
                setIsFabMenuOpen(true);
              } else {
                setIsFabMenuOpen(true);
              }
            }}
            className={`w-14 h-14 rounded-full flex items-center justify-center border-4 border-white shadow-lg transition-colors ${
              hasTripToday ? 'bg-indigo-600 text-white shadow-indigo-600/30' : 'bg-teal-600 text-white shadow-teal-600/30'
            }`}
          >
            {hasTripToday ? <QrCode className="w-6 h-6" /> : <PlusCircle className="w-6 h-6" />}
          </motion.button>
        </div>"""

content = re.sub(
    r"\{\/\* 3\. Center FAB \*\/\}.*?(?=\{\/\* 4\. Wallet \*\/\})",
    new_fab + "\n\n        ",
    content,
    flags=re.DOTALL
)

# 5. Smart Badges on Mobile Bottom Bar
content = content.replace(
    "<ShieldCheck className={`w-5 h-5 ${activeTab === 'MY_BAG' ? 'fill-teal-50/50' : ''}`} />",
    """<div className="relative">
            <ShieldCheck className={`w-5 h-5 ${activeTab === 'MY_BAG' ? 'fill-teal-50/50' : ''}`} />
            {hasNewPackage && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>}
          </div>"""
)

content = content.replace(
    "<Wallet className={`w-5 h-5 ${activeTab === 'WALLET' ? 'fill-teal-50/50' : ''}`} />",
    """<div className="relative">
            <Wallet className={`w-5 h-5 ${activeTab === 'WALLET' ? 'fill-teal-50/50' : ''}`} />
            {hasNewEarnings && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border-2 border-white rounded-full"></span>}
          </div>"""
)

with open('src/components/traveler/TravelerPortal.tsx', 'w') as f:
    f.write(content)
