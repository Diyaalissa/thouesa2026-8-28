const fs = require('fs');

let content = fs.readFileSync('src/components/sender/SenderPortal.tsx', 'utf8');

// Add the DISPUTES button in the sidebar right after SPECIFIC_COUNTRY_BUY
const countryBuyButtonStr = `
            <button
              onClick={() => setActiveTab('SPECIFIC_COUNTRY_BUY')}
              className={\`w-full flex items-center \${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start \${
                activeTab === 'SPECIFIC_COUNTRY_BUY' ? 'bg-brand-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }\`}
              title={!isSidebarOpen ? (isAr ? 'شراء من فرع معين' : 'Country Buy') : undefined}
            >
              <div className={\`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 \${activeTab === 'SPECIFIC_COUNTRY_BUY' ? 'bg-brand-700 text-white' : 'bg-brand-100 text-brand-700'}\`}>
                <ShoppingBag className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'شراء محلي' : 'Local Buy'}</div>
                  <div className={\`text-[10px] truncate \${activeTab === 'SPECIFIC_COUNTRY_BUY' ? 'text-brand-100' : 'text-slate-400'}\`}>
                    {isAr ? 'أسواق الفروع' : 'Hub markets'}
                  </div>
                </div>
              )}
            </button>`;

const disputesSidebarBtn = `

            <button
              onClick={() => setActiveTab('DISPUTES')}
              className={\`w-full flex items-center \${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start \${
                activeTab === 'DISPUTES' ? 'bg-red-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }\`}
              title={!isSidebarOpen ? (isAr ? 'النزاعات والشكاوى' : 'Disputes') : undefined}
            >
              <div className={\`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 \${activeTab === 'DISPUTES' ? 'bg-red-700 text-white' : 'bg-red-100 text-red-700'}\`}>
                <ShieldAlert className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'النزاعات والشكاوى' : 'Disputes'}</div>
                  <div className={\`text-[10px] truncate \${activeTab === 'DISPUTES' ? 'text-red-100' : 'text-slate-400'}\`}>
                    {isAr ? 'تقديم شكوى' : 'File a complaint'}
                  </div>
                </div>
              )}
            </button>`;

if (content.includes(countryBuyButtonStr) && !content.includes("activeTab === 'DISPUTES'")) {
    content = content.replace(countryBuyButtonStr, countryBuyButtonStr + disputesSidebarBtn);
} else {
    // try a more fuzzy match
    const parts = content.split('</aside>');
    if (parts.length > 1) {
        if (!parts[0].includes("activeTab === 'DISPUTES'")) {
            parts[0] = parts[0] + disputesSidebarBtn + '\n          </div>\n        ';
            content = parts.join('</aside>');
            // actually we might have messed up tags, let's fix
        }
    }
}
fs.writeFileSync('src/components/sender/SenderPortal.tsx.bak', content);
