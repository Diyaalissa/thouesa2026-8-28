import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# Add import if missing
if 'DisputesDashboard' not in content:
    content = content.replace("import { WalletDashboard } from '../wallet/WalletDashboard';", "import { WalletDashboard } from '../wallet/WalletDashboard';\nimport { DisputesDashboard } from '../disputes/DisputesDashboard';")

# Replace placeholder with component
old_disputes = """      {activeTab === 'DISPUTES' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-white shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">
                  {isAr ? 'النزاعات والشكاوى الرسمية' : 'Disputes & Official Claims'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isAr ? 'مركّز الدعم لحل مشاكلك وطلبات التعويض.' : 'Support center to resolve your issues and compensation requests.'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 p-12 rounded-3xl shadow-sm text-center">
             <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
             <h3 className="text-slate-800 font-bold mb-2">{isAr ? 'لا توجد نزاعات نشطة' : 'No Active Disputes'}</h3>
             <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
               {isAr ? 'لم تقم برفع أي شكاوى أو نزاعات مؤخراً. فريقنا متواجد دائماً لضمان حقوقك.' : 'You have not raised any disputes recently. Our team is always here to protect your rights.'}
             </p>
             <button 
               onClick={() => setDisputeModalOpen(true)}
               className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2 rounded-xl transition-colors inline-flex items-center gap-2"
             >
               <MessageSquare className="w-4 h-4" /> {isAr ? 'إنشاء نزاع جديد' : 'Create New Dispute'}
             </button>
          </div>
        </div>
      )}"""

new_disputes = """      {activeTab === 'DISPUTES' && (
        <DisputesDashboard currentUser={currentUser} isAr={isAr} />
      )}"""

if old_disputes in content:
    content = content.replace(old_disputes, new_disputes)
else:
    print("WARNING: Could not find old disputes block.")
    
with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
