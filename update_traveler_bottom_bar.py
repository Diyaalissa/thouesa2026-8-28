import re

with open('src/components/traveler/TravelerPortal.tsx', 'r') as f:
    content = f.read()

new_bottom_bar = """      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-between z-40 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('MY_TRIPS')}
          className={`flex flex-col items-center justify-center w-20 gap-1 transition-all ${activeTab === 'MY_TRIPS' ? 'text-teal-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Plane className="w-5 h-5" />
          <span className="text-[10px] font-bold">{isAr ? 'رحلاتي' : 'Trips'}</span>
        </motion.button>
        
        {/* Floating Action Button (Center) */}
        <div className="relative -top-5 w-20 flex justify-center">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('NEW_TRIP')}
            className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-teal-500/30"
          >
            <PlusCircle className="w-6 h-6" />
          </motion.button>
        </div>

        <motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('WALLET')}
          className={`flex flex-col items-center justify-center w-20 gap-1 transition-all ${activeTab === 'WALLET' ? 'text-teal-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] font-bold">{isAr ? 'المحفظة' : 'Wallet'}</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('PROFILE')}
          className={`flex flex-col items-center justify-center w-20 gap-1 transition-all ${activeTab === 'PROFILE' ? 'text-teal-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold">{isAr ? 'حسابي' : 'Profile'}</span>
        </motion.button>
      </div>"""

content = re.sub(
    r'\{\/\* Mobile Bottom Bar \*\/\}.*?<\/div>\s*<\/div>\s*\);\s*\}',
    new_bottom_bar + '\n</div>\n  );\n}',
    content,
    flags=re.DOTALL
)

with open('src/components/traveler/TravelerPortal.tsx', 'w') as f:
    f.write(content)
