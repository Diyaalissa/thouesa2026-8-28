import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# I need to add a state for mobile menu if needed. Let's just use `isCreateOrderMenuOpen` for mobile too, 
# or add `isMobileMenuOpen`? Let's check how many states are there.
# Let's add `hasPendingDispute = true` just below `const isAr = locale === 'ar';`

if 'const hasPendingDispute = true;' not in content:
    content = content.replace("const isAr = locale === 'ar';", "const isAr = locale === 'ar';\n  const hasPendingDispute = true;")

# Let's replace the mobile bottom bar block.
old_bottom_bar_regex = r'\{\/\* Mobile Bottom Bar \*\/\}.*?<\/div>'
new_bottom_bar = """{/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-between z-40 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex flex-col items-center justify-center w-16 gap-1 transition-all ${activeTab === 'OVERVIEW' ? 'text-brand-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">{isAr ? 'الرئيسية' : 'Home'}</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('MY_SHIPMENTS')}
          className={`flex flex-col items-center justify-center w-16 gap-1 transition-all ${activeTab === 'MY_SHIPMENTS' ? 'text-brand-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[10px] font-bold">{isAr ? 'طلباتي' : 'Orders'}</span>
        </motion.button>
        
        {/* Floating Action Button (Center) */}
        <div className="relative -top-5 w-16 flex justify-center">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreateOrderMenuOpen(!isCreateOrderMenuOpen)}
            className="w-12 h-12 bg-brand-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-brand-500/30"
          >
            <Plus className={`w-6 h-6 transition-transform ${isCreateOrderMenuOpen ? 'rotate-45' : ''}`} />
          </motion.button>
        </div>

        <motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('WALLET')}
          className={`flex flex-col items-center justify-center w-16 gap-1 transition-all ${activeTab === 'WALLET' ? 'text-brand-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] font-bold">{isAr ? 'المحفظة' : 'Wallet'}</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('PROFILE')}
          className={`relative flex flex-col items-center justify-center w-16 gap-1 transition-all ${activeTab === 'PROFILE' ? 'text-brand-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className="relative">
            <UserIcon className="w-5 h-5" />
            {hasPendingDispute && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
            )}
          </div>
          <span className="text-[10px] font-bold">{isAr ? 'حسابي' : 'Profile'}</span>
        </motion.button>
      </div>

      {/* Mobile Create Order Bottom Sheet */}
      <AnimatePresence>
        {isCreateOrderMenuOpen && (
          <div className="md:hidden">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateOrderMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-20 left-4 right-4 bg-white rounded-3xl p-4 z-50 shadow-2xl"
            >
              <h3 className="text-center font-bold text-slate-800 mb-4">{isAr ? 'ماذا تريد أن تفعل؟' : 'What would you like to do?'}</h3>
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => { setActiveTab('SEND_PARCEL'); setIsCreateOrderMenuOpen(false); }}
                  className="flex flex-col items-center gap-2 p-3 bg-brand-50 rounded-2xl text-brand-700 hover:bg-brand-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Box className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-center">{isAr ? 'إرسال طرد' : 'Send Parcel'}</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('INTERNATIONAL_BUY'); setIsCreateOrderMenuOpen(false); }}
                  className="flex flex-col items-center gap-2 p-3 bg-indigo-50 rounded-2xl text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Globe2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-center">{isAr ? 'شراء عالمي' : 'Global Buy'}</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('SPECIFIC_COUNTRY_BUY'); setIsCreateOrderMenuOpen(false); }}
                  className="flex flex-col items-center gap-2 p-3 bg-emerald-50 rounded-2xl text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Store className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-center">{isAr ? 'شراء محلي' : 'Local Buy'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>"""

content = re.sub(r'\{\/\* Mobile Bottom Bar \*\/\}.*?<\/div>\s*<\/div>\s*\);\s*\}', new_bottom_bar + '\n</div>\n  );\n}', content, flags=re.DOTALL)

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
