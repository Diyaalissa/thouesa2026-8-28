import sys
import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# 1. Look for the container that holds Sidebar and Main content
# Usually: <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
# And at the end, before the modal blocks, the main container closes.

# Let's add bottom bar right before the closing tag of the main layout, or inside it.
# Actually, the main tag is `<div className="flex h-screen bg-slate-50 overflow-hidden font-sans flex-col md:flex-row">` (or similar)
# Let's find it.

# We will inject the bottom bar code at the end of the root div.
# Let's find the closing `</div>` right before `{waybillModalShipment && (`
bottom_bar_ui = """
      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between z-40 pb-safe">
        <button 
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'OVERVIEW' ? 'text-brand-600 scale-110' : 'text-slate-400'}`}
        >
          <Box className="w-6 h-6" />
          <span className="text-[10px] font-bold">{isAr ? 'الرئيسية' : 'Home'}</span>
        </button>
        <button 
          onClick={() => setActiveTab('SEND_PARCEL')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'SEND_PARCEL' ? 'text-brand-600 scale-110' : 'text-slate-400'}`}
        >
          <Package className="w-6 h-6" />
          <span className="text-[10px] font-bold">{isAr ? 'إرسال' : 'Send'}</span>
        </button>
        <button 
          onClick={() => setActiveTab('WALLET')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'WALLET' ? 'text-brand-600 scale-110' : 'text-slate-400'}`}
        >
          <Wallet className="w-6 h-6" />
          <span className="text-[10px] font-bold">{isAr ? 'المحفظة' : 'Wallet'}</span>
        </button>
        <button 
          onClick={() => setActiveTab('PROFILE')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'PROFILE' ? 'text-brand-600 scale-110' : 'text-slate-400'}`}
        >
          <UserIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold">{isAr ? 'حسابي' : 'Profile'}</span>
        </button>
      </div>
"""

# Find `      {waybillModalShipment && (` and prepend bottom_bar_ui
if "      {/* Mobile Bottom Bar */}" not in content:
    content = content.replace("      {waybillModalShipment && (", bottom_bar_ui + "\n      {waybillModalShipment && (")

# also need to make sure Package, User as UserIcon are imported in SenderPortal.tsx
if "import { Package" not in content:
    content = content.replace("  Box,", "  Box,\n  Package,")
if "import { User as UserIcon" not in content:
    content = content.replace("  Upload,", "  Upload,\n  User as UserIcon,")

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
