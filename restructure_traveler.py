import re

with open('src/components/traveler/TravelerPortal.tsx', 'r') as f:
    content = f.read()

# I will update the tabs state first
content = re.sub(
    r"const \[activeTab, setActiveTab\] = useState<'MY_TRIPS' \| 'NEW_TRIP' \| 'WALLET' \| 'PROFILE'>\('MY_TRIPS'\);",
    "const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'MY_TRIPS' | 'MY_BAG' | 'WALLET' | 'PROFILE'>('DASHBOARD');\n  const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);",
    content
)

# And in bottom bar, replace with 5 icons.
new_bottom_bar = """      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-between z-40 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('DASHBOARD')}
          className={`flex flex-col items-center justify-center w-16 gap-1 transition-all ${activeTab === 'DASHBOARD' ? 'text-teal-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-bold">{isAr ? 'الرئيسية' : 'Home'}</span>
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('MY_TRIPS')}
          className={`flex flex-col items-center justify-center w-16 gap-1 transition-all ${activeTab === 'MY_TRIPS' ? 'text-teal-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Plane className="w-5 h-5" />
          <span className="text-[10px] font-bold">{isAr ? 'رحلاتي' : 'Trips'}</span>
        </motion.button>
        
        {/* Floating Action Button (Center) */}
        <div className="relative -top-5 w-16 flex justify-center">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('MY_BAG')}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${activeTab === 'MY_BAG' ? 'bg-amber-500 text-white shadow-amber-500/30' : 'bg-teal-600 text-white shadow-teal-500/30'}`}
          >
            <ShieldCheck className="w-6 h-6" />
          </motion.button>
          <span className="absolute -bottom-5 text-[10px] font-bold text-slate-500">{isAr ? 'حقيبتي' : 'My Bag'}</span>
        </div>

        <motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('WALLET')}
          className={`flex flex-col items-center justify-center w-16 gap-1 transition-all ${activeTab === 'WALLET' ? 'text-teal-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] font-bold">{isAr ? 'المحفظة' : 'Wallet'}</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('PROFILE')}
          className={`flex flex-col items-center justify-center w-16 gap-1 transition-all ${activeTab === 'PROFILE' ? 'text-teal-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
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
