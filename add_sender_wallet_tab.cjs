const fs = require('fs');
let content = fs.readFileSync('src/components/sender/SenderPortal.tsx', 'utf8');

const walletTab = `
            <button
              onClick={() => setActiveTab('WALLET')}
              className={\`w-full flex items-center \${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start \${
                activeTab === 'WALLET' ? 'bg-indigo-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }\`}
              title={!isSidebarOpen ? (isAr ? 'المحفظة المالية' : 'Wallet') : undefined}
            >
              <div className={\`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 \${activeTab === 'WALLET' ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-700'}\`}>
                <Wallet className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'المحفظة المالية' : 'Wallet'}</div>
                  <div className={\`text-[10px] truncate \${activeTab === 'WALLET' ? 'text-indigo-100' : 'text-slate-400'}\`}>
                    {isAr ? 'الرصيد والمدفوعات' : 'Balance & Payments'}
                  </div>
                </div>
              )}
            </button>`;

if (!content.includes("setActiveTab('WALLET')")) {
  const searchStr = `onClick={() => setActiveTab('PROFILE')}`;
  content = content.replace(searchStr, "onClick={() => setActiveTab('WALLET')}\n" + walletTab + searchStr); // Just replace might be tricky, let's do it right.
}

fs.writeFileSync('src/components/sender/SenderPortal.tsx', content);
