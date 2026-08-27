const fs = require('fs');
let content = fs.readFileSync('src/components/sender/SenderPortal.tsx', 'utf8');

const walletContent = `
      {activeTab === 'WALLET' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-white shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">
                  {isAr ? 'المحفظة المالية' : 'Financial Wallet'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isAr ? 'إدارة أرصدتك وإضافة أموال لشحن طرودك بسهولة' : 'Manage your balances and top up funds easily'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Wallet Overview Card */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-6">
              <div>
                <span className="text-xs text-slate-500 font-bold block mb-2">{isAr ? 'الرصيد المتاح' : 'Available Balance'}</span>
                <div className="text-4xl font-black text-indigo-600">
                  {wallet ? formatCurrency(wallet.balance, wallet.currency) : '$0.00'}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100 text-xs font-medium">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{isAr ? 'مبالغ محجوزة (قيد الشحن):' : 'Reserved (In Transit):'}</span>
                  <span className="font-bold text-amber-500">
                    {wallet ? formatCurrency(wallet.lockedEscrowDeposit, 'USD') : '$0.00'}
                  </span>
                </div>
              </div>

              {/* Exchange Rates Info Card */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3 mt-4">
                <h4 className="font-bold text-xs flex items-center gap-2 text-slate-700">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  {isAr ? 'أسعار الصرف المعتمدة (الإدارة)' : 'Official Exchange Rates'}
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">1 USD</span>
                    <span className="font-black text-slate-800">140 DZD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">1 USD</span>
                    <span className="font-black text-slate-800">0.71 JOD</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed pt-2 border-t border-slate-200">
                  {isAr ? 'يتم تحديد أسعار الصرف بمرونة من قبل الإدارة لتسهيل معاملاتك' : 'Rates flexibly configured by management to facilitate transactions.'}
                </p>
              </div>
            </div>

            {/* Top Up / History */}
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800">{isAr ? 'إضافة رصيد (شحن المحفظة)' : 'Top Up Wallet'}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">{isAr ? 'المبلغ ($)' : 'Amount ($)'}</label>
                      <input type="number" min="10" placeholder="100" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">{isAr ? 'طريقة الدفع' : 'Payment Method'}</label>
                      <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm">
                        <option>{isAr ? 'بطاقة بنكية (Stripe)' : 'Credit Card (Stripe)'}</option>
                        <option>{isAr ? 'البطاقة الذهبية (الجزائر)' : 'Edahabia (Algeria)'}</option>
                        <option>{isAr ? 'إي فواتيركم (الأردن)' : 'eFawateerCom (Jordan)'}</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-indigo-600/20 w-full md:w-auto">
                      {isAr ? 'متابعة الدفع' : 'Proceed to Payment'}
                    </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
`;

if (!content.includes("أسعار الصرف المعتمدة (الإدارة)")) {
  const searchStr = "{activeTab === 'PROFILE' && (";
  content = content.replace(searchStr, walletContent + "\n" + searchStr);
  fs.writeFileSync('src/components/sender/SenderPortal.tsx', content);
  console.log("Wallet content inserted into SenderPortal.");
}

// Add Sparkles to lucide-react if needed
if (!content.includes("Sparkles,")) {
  content = content.replace("Wallet,", "Wallet, Sparkles,");
  fs.writeFileSync('src/components/sender/SenderPortal.tsx', content);
}

