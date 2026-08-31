import re

with open('src/components/traveler/TravelerPortal.tsx', 'r') as f:
    content = f.read()

content = content.replace("  XCircle, User as UserIcon, Bell, Info, ShieldAlert, RefreshCw, Zap, MessageCircle,", "  XCircle, User as UserIcon, Bell, Info, ShieldAlert, RefreshCw, Zap, MessageCircle, Home, Briefcase, Settings, FileText, ChevronRight, History,")

# Add isFabMenuOpen state
content = content.replace(
    "const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);",
    "const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);\n  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);"
)

# Update activeTab state
content = content.replace(
    "const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'MY_TRIPS' | 'MY_BAG' | 'WALLET' | 'PROFILE'>('DASHBOARD');",
    "const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'MY_TRIPS' | 'MY_BAG' | 'WALLET' | 'PROFILE' | 'MORE'>('DASHBOARD');"
)

old_bottom_bar = r"\{\/\* Mobile Bottom Bar \*\/\}\s*<div className=\"md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-between z-40 pb-safe shadow-\[0_-4px_10px_rgba\(0,0,0,0\.05\)\]\">.*?(?=\s*<\/main>|\s*<\/div>\s*\)\s*;\s*\})"

new_bottom_bar = """{/* Mobile Bottom Bar (5 Items) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-1 py-1 flex items-center justify-between z-[60] pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        {/* 1. Dashboard */}
        <motion.button 
          whileTap={{ scale: 0.9, y: 3 }}
          onClick={() => setActiveTab('DASHBOARD')}
          className={`flex flex-col items-center justify-center w-[18%] gap-1 py-2 transition-all ${activeTab === 'DASHBOARD' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'DASHBOARD' ? 'fill-teal-50/50' : ''}`} />
          <span className={`text-[10px] ${activeTab === 'DASHBOARD' ? 'font-bold' : 'font-medium'}`}>{isAr ? 'الرئيسية' : 'Home'}</span>
        </motion.button>

        {/* 2. My Bag / Manifest */}
        <motion.button 
          whileTap={{ scale: 0.9, y: 3 }}
          onClick={() => setActiveTab('MY_BAG')}
          className={`flex flex-col items-center justify-center w-[18%] gap-1 py-2 transition-all ${activeTab === 'MY_BAG' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <ShieldCheck className={`w-5 h-5 ${activeTab === 'MY_BAG' ? 'fill-teal-50/50' : ''}`} />
          <span className={`text-[10px] ${activeTab === 'MY_BAG' ? 'font-bold' : 'font-medium'}`}>{isAr ? 'حقيبتي' : 'Bag'}</span>
        </motion.button>
        
        {/* 3. Center FAB */}
        <div className="relative w-[28%] flex justify-center -top-6">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsFabMenuOpen(true)}
            className="w-14 h-14 rounded-full bg-teal-600 text-white shadow-lg shadow-teal-600/30 flex items-center justify-center border-4 border-white"
          >
            <PlusCircle className="w-6 h-6" />
          </motion.button>
        </div>

        {/* 4. Wallet */}
        <motion.button 
          whileTap={{ scale: 0.9, y: 3 }}
          onClick={() => setActiveTab('WALLET')}
          className={`flex flex-col items-center justify-center w-[18%] gap-1 py-2 transition-all ${activeTab === 'WALLET' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Wallet className={`w-5 h-5 ${activeTab === 'WALLET' ? 'fill-teal-50/50' : ''}`} />
          <span className={`text-[10px] ${activeTab === 'WALLET' ? 'font-bold' : 'font-medium'}`}>{isAr ? 'المحفظة' : 'Wallet'}</span>
        </motion.button>

        {/* 5. More / Profile */}
        <motion.button 
          whileTap={{ scale: 0.9, y: 3 }}
          onClick={() => setActiveTab('MORE')}
          className={`flex flex-col items-center justify-center w-[18%] gap-1 py-2 transition-all ${activeTab === 'MORE' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Menu className={`w-5 h-5 ${activeTab === 'MORE' ? 'fill-teal-50/50' : ''}`} />
          <span className={`text-[10px] ${activeTab === 'MORE' ? 'font-bold' : 'font-medium'}`}>{isAr ? 'المزيد' : 'More'}</span>
        </motion.button>
      </div>

      {/* FAB Bottom Sheet Menu */}
      {isFabMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[70] flex flex-col justify-end bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsFabMenuOpen(false)}>
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-t-3xl p-6 pb-safe space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2" />
            <h3 className="font-bold text-lg text-slate-900 mb-4">{isAr ? 'إجراء سريع' : 'Quick Action'}</h3>
            
            <button 
              onClick={() => {
                setIsFabMenuOpen(false);
                if (currentUser.kycStatus === 'VERIFIED') {
                  setIsNewTripModalOpen(true);
                } else {
                  alert(isAr ? 'يرجى استكمال توثيق الحساب أولاً من صفحة حسابي.' : 'Please verify your account from the profile page first.');
                }
              }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-teal-50 hover:bg-teal-100 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                <Plane className="w-6 h-6" />
              </div>
              <div className="text-start">
                <span className="block font-bold text-teal-900">{isAr ? 'إضافة رحلة طيران جديدة' : 'Add New Flight Trip'}</span>
                <span className="text-xs text-teal-700">{isAr ? 'لجدولة رحلة قادمة وتخصيص وزن' : 'Schedule upcoming trip & allocate weight'}</span>
              </div>
            </button>

            <button 
              onClick={() => {
                setIsFabMenuOpen(false);
                setActiveTab('MY_BAG');
              }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <QrCode className="w-6 h-6" />
              </div>
              <div className="text-start">
                <span className="block font-bold text-indigo-900">{isAr ? 'مسح باركود (QR Scan)' : 'Scan QR Code'}</span>
                <span className="text-xs text-indigo-700">{isAr ? 'لاستلام/تسليم الطرود في المكتب' : 'For pickup/handover at the hub'}</span>
              </div>
            </button>
          </motion.div>
        </div>
      )}"""

# Replace the bottom bar, note that we need to find it properly
# Let's use a simpler regex that matches from {/* Mobile Bottom Bar */} to the end of the div
import re
content = re.sub(
    r"\{\/\* Mobile Bottom Bar \*\/\}\s*<div className=\"md:hidden fixed bottom-0.*?</main>\s*</div>",
    new_bottom_bar + "\n        </main>\n      </div>",
    content,
    flags=re.DOTALL
)

# Now add the MORE tab view
more_tab_content = """
          {/* TAB: MORE / PROFILE */}
          {activeTab === 'MORE' && (
            <div className="space-y-6 pb-20 md:pb-0">
              <div className="bg-slate-900 text-white rounded-3xl p-6 flex items-center gap-4 shadow-lg border border-slate-800">
                <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  <UserIcon className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black">{currentUser.fullName}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-400 text-xs font-mono">{currentUser.id}</span>
                    <StatusBadge status={currentUser.kycStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING'} type="kyc" locale={locale} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => setActiveTab('MY_TRIPS')} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-teal-300 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Plane className="w-5 h-5" />
                    </div>
                    <div className="text-start">
                      <span className="block font-bold text-slate-800">{isAr ? 'رحلاتي' : 'My Trips'}</span>
                      <span className="text-xs text-slate-500">{isAr ? 'سجل الرحلات السابقة والنشطة' : 'History of previous and active trips'}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 rtl:rotate-180 group-hover:text-teal-600" />
                </button>

                <button onClick={() => setActiveTab('PROFILE')} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-teal-300 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="text-start">
                      <span className="block font-bold text-slate-800">{isAr ? 'الملف الشخصي والتوثيق' : 'Profile & KYC'}</span>
                      <span className="text-xs text-slate-500">{isAr ? 'تحديث البيانات والوثائق' : 'Update details and documents'}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 rtl:rotate-180 group-hover:text-indigo-600" />
                </button>

                <button onClick={() => setActiveTab('WALLET')} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-teal-300 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                      <History className="w-5 h-5" />
                    </div>
                    <div className="text-start">
                      <span className="block font-bold text-slate-800">{isAr ? 'سجل الضمانات المالية' : 'Escrow History'}</span>
                      <span className="text-xs text-slate-500">{isAr ? 'الودائع المدفوعة والمستردة' : 'Paid and refunded deposits'}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 rtl:rotate-180 group-hover:text-amber-600" />
                </button>

                <button className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-teal-300 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-start">
                      <span className="block font-bold text-slate-800">{isAr ? 'الشروط وقائمة الممنوعات' : 'Terms & Banned Items'}</span>
                      <span className="text-xs text-slate-500">{isAr ? 'تعهد الأمانة والقوانين' : 'Trust pledge and regulations'}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 rtl:rotate-180 group-hover:text-rose-600" />
                </button>
                
                <button className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-teal-300 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div className="text-start">
                      <span className="block font-bold text-slate-800">{isAr ? 'الدعم والطوارئ' : 'Support & Emergency'}</span>
                      <span className="text-xs text-slate-500">{isAr ? 'تواصل مع الإدارة' : 'Contact management'}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 rtl:rotate-180 group-hover:text-emerald-600" />
                </button>

                <button className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-teal-300 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div className="text-start">
                      <span className="block font-bold text-slate-800">{isAr ? 'الإعدادات' : 'Settings'}</span>
                      <span className="text-xs text-slate-500">{isAr ? 'اللغة والإشعارات' : 'Language and notifications'}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 rtl:rotate-180 group-hover:text-slate-600" />
                </button>
              </div>
            </div>
          )}"""

content = content.replace("{/* Handover QR Modal */}", more_tab_content + "\n\n      {/* Handover QR Modal */}")

with open('src/components/traveler/TravelerPortal.tsx', 'w') as f:
    f.write(content)
