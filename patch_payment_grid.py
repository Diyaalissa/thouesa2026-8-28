import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

target = r"""<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedPaymentGateway\('CLIQ_JOR'\)}
                className={`p-2\.5 rounded-xl border text-center font-bold transition-all cursor-pointer \$\{
                  selectedPaymentGateway === 'CLIQ_JOR'
                    \? 'bg-brand-500/30 border-brand-400 text-white ring-1 ring-brand-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                \}`}
              >
                <span>🇯🇴 CliQ Jordan</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPaymentGateway\('EDAHABIA_DZA'\)}
                className={`p-2\.5 rounded-xl border text-center font-bold transition-all cursor-pointer \$\{
                  selectedPaymentGateway === 'EDAHABIA_DZA'
                    \? 'bg-amber-600/30 border-amber-500 text-white ring-1 ring-amber-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                \}`}
              >
                <span>🇩🇿 بريدي موب / الذهبية</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPaymentGateway\('CIB_DZA'\)}
                className={`p-2\.5 rounded-xl border text-center font-bold transition-all cursor-pointer \$\{
                  selectedPaymentGateway === 'CIB_DZA'
                    \? 'bg-teal-600/30 border-emerald-500 text-white ring-1 ring-emerald-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                \}`}
              >
                <span>🇩🇿 بطاقة CIB البنكية</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPaymentGateway\('ESCROW_WALLET'\)}
                className={`p-2\.5 rounded-xl border text-center font-bold transition-all cursor-pointer \$\{
                  selectedPaymentGateway === 'ESCROW_WALLET'
                    \? 'bg-purple-600/30 border-purple-500 text-white ring-1 ring-purple-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                \}`}
              >
                <span>🛡️ محفظة الضمان</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPaymentGateway\('CASH_AT_HUB'\)}
                className={`p-2\.5 rounded-xl border text-center font-bold transition-all cursor-pointer \$\{
                  selectedPaymentGateway === 'CASH_AT_HUB'
                    \? 'bg-blue-600/30 border-blue-500 text-white ring-1 ring-blue-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                \}`}
              >
                <span>💵 \{isAr \? 'نقداً في المستودع' : 'Cash at Hub'\}</span>
              </button>
            </div>"""

replacement = """<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
              {selectedOriginHub?.countryCode === 'JOR' && (
                <button
                  type="button"
                  onClick={() => setSelectedPaymentGateway('CLIQ_JOR')}
                  className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    selectedPaymentGateway === 'CLIQ_JOR'
                      ? 'bg-brand-500/30 border-brand-400 text-white ring-1 ring-brand-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span>🇯🇴 CliQ Jordan</span>
                </button>
              )}
              {selectedOriginHub?.countryCode === 'DZA' && (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentGateway('EDAHABIA_DZA')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      selectedPaymentGateway === 'EDAHABIA_DZA'
                        ? 'bg-amber-600/30 border-amber-500 text-white ring-1 ring-amber-500'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>🇩🇿 بريدي موب / الذهبية</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentGateway('CIB_DZA')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      selectedPaymentGateway === 'CIB_DZA'
                        ? 'bg-teal-600/30 border-emerald-500 text-white ring-1 ring-emerald-500'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>🇩🇿 بطاقة CIB البنكية</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setSelectedPaymentGateway('ESCROW_WALLET')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  selectedPaymentGateway === 'ESCROW_WALLET'
                    ? 'bg-purple-600/30 border-purple-500 text-white ring-1 ring-purple-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>🛡️ محفظة الضمان</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPaymentGateway('CASH_AT_HUB')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  selectedPaymentGateway === 'CASH_AT_HUB'
                    ? 'bg-blue-600/30 border-blue-500 text-white ring-1 ring-blue-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>💵 {isAr ? 'نقداً في المستودع' : 'Cash at Hub'}</span>
              </button>
            </div>"""

new_content = re.sub(target, replacement, content, flags=re.DOTALL)
if new_content == content:
    print("Warning: Payment Gateway Grid target not found")
else:
    with open('src/components/sender/SenderPortal.tsx', 'w') as f:
        f.write(new_content)
    print("Payment Gateway Grid replaced")
