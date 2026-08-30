import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# Replace <button inside Mobile Bottom Bar with <motion.button

content = content.replace(
    """<button 
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'OVERVIEW' ? 'text-brand-600 scale-110' : 'text-slate-400'}`}
        >""",
    """<motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'OVERVIEW' ? 'text-brand-600 scale-110' : 'text-slate-400'}`}
        >"""
)

content = content.replace(
    """<button 
          onClick={() => setActiveTab('SEND_PARCEL')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'SEND_PARCEL' ? 'text-brand-600 scale-110' : 'text-slate-400'}`}
        >""",
    """<motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('SEND_PARCEL')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'SEND_PARCEL' ? 'text-brand-600 scale-110' : 'text-slate-400'}`}
        >"""
)

content = content.replace(
    """<button 
          onClick={() => setActiveTab('WALLET')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'WALLET' ? 'text-brand-600 scale-110' : 'text-slate-400'}`}
        >""",
    """<motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('WALLET')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'WALLET' ? 'text-brand-600 scale-110' : 'text-slate-400'}`}
        >"""
)

content = content.replace(
    """<button 
          onClick={() => setActiveTab('PROFILE')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'PROFILE' ? 'text-brand-600 scale-110' : 'text-slate-400'}`}
        >""",
    """<motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('PROFILE')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'PROFILE' ? 'text-brand-600 scale-110' : 'text-slate-400'}`}
        >"""
)

content = content.replace(
    """<span className="text-[10px] font-bold">{isAr ? 'حسابي' : 'Profile'}</span>
        </button>""",
    """<span className="text-[10px] font-bold">{isAr ? 'حسابي' : 'Profile'}</span>
        </motion.button>"""
)

content = content.replace(
    """<span className="text-[10px] font-bold">{isAr ? 'المحفظة' : 'Wallet'}</span>
        </button>""",
    """<span className="text-[10px] font-bold">{isAr ? 'المحفظة' : 'Wallet'}</span>
        </motion.button>"""
)

content = content.replace(
    """<span className="text-[10px] font-bold">{isAr ? 'إرسال' : 'Send'}</span>
        </button>""",
    """<span className="text-[10px] font-bold">{isAr ? 'إرسال' : 'Send'}</span>
        </motion.button>"""
)

content = content.replace(
    """<span className="text-[10px] font-bold">{isAr ? 'الرئيسية' : 'Home'}</span>
        </button>""",
    """<span className="text-[10px] font-bold">{isAr ? 'الرئيسية' : 'Home'}</span>
        </motion.button>"""
)


with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
