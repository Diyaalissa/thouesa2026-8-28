const fs = require('fs');
let content = fs.readFileSync('src/components/traveler/TravelerPortal.tsx', 'utf8');

const ratesCard = `
          {/* Exchange Rates Info Card */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 mt-4">
            <h4 className="font-bold text-sm flex items-center gap-2 text-slate-800">
              <Sparkles className="w-4 h-4 text-amber-500" />
              {isAr ? 'أسعار الصرف المعتمدة' : 'Official Exchange Rates'}
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-600 font-medium">1 USD</span>
                <span className="font-bold text-slate-900">140 DZD</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-50 rounded-lg">
                <span className="text-slate-600 font-medium">1 USD</span>
                <span className="font-bold text-slate-900">0.71 JOD</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {isAr ? 'يتم تحديد أسعار الصرف بشكل مرن من قبل الإدارة لتسهيل التحويلات المالية عبر المحفظة.' : 'Exchange rates are flexibly configured by platform administration to facilitate wallet settlements.'}
            </p>
          </div>
`;

// Insert after Wallet Overview Card inside the left column
const target = "</div>\n          {/* Instant Payout Form */}";

if (!content.includes("أسعار الصرف المعتمدة")) {
  content = content.replace(target, ratesCard + "\n          </div>\n          {/* Instant Payout Form */}");
}

if(!content.includes("Sparkles")) {
    content = content.replace("Wallet,", "Wallet, Sparkles,");
}

fs.writeFileSync('src/components/traveler/TravelerPortal.tsx', content);
