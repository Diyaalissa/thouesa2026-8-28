import sys

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

bottom_bar_ui = """
      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between z-40 pb-safe">
        <motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'OVERVIEW' ? 'text-brand-600 scale-110' : 'text-slate-400'}`}
        >
          <Box className="w-6 h-6" />
          <span className="text-[10px] font-bold">{isAr ? 'الرئيسية' : 'Home'}</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('SEND_PARCEL')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'SEND_PARCEL' ? 'text-brand-600 scale-110' : 'text-slate-400'}`}
        >
          <Package className="w-6 h-6" />
          <span className="text-[10px] font-bold">{isAr ? 'إرسال' : 'Send'}</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('WALLET')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'WALLET' ? 'text-brand-600 scale-110' : 'text-slate-400'}`}
        >
          <Wallet className="w-6 h-6" />
          <span className="text-[10px] font-bold">{isAr ? 'المحفظة' : 'Wallet'}</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('PROFILE')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'PROFILE' ? 'text-brand-600 scale-110' : 'text-slate-400'}`}
        >
          <UserIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold">{isAr ? 'حسابي' : 'Profile'}</span>
        </motion.button>
      </div>
"""

# Let's insert it before the last </div>
last_div_idx = content.rfind("</div>")
if last_div_idx != -1 and "Mobile Bottom Bar" not in content:
    content = content[:last_div_idx] + bottom_bar_ui + content[last_div_idx:]

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
