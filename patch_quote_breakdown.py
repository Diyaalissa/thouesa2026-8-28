import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

customs_quote_target = """              <div className={`p-2.5 rounded-xl border ${liveParcelQuote.customsDutyUsd > 0 ? 'bg-amber-950/40 border-amber-500/40' : 'bg-emerald-950/40 border-emerald-500/40'}`}>
                <span className="text-slate-400 text-[11px] block">{isAr ? 'الجمرك المقدر' : 'Est. Customs Duty'}</span>
                <div className="flex items-center gap-1">
                  <span className={`font-bold text-sm ${liveParcelQuote.customsDutyUsd > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    ${liveParcelQuote.customsDutyUsd}
                  </span>
                  {liveParcelQuote.isCustomsExempt ? (
                    <span className="text-[10px] text-emerald-400 font-bold">({isAr ? 'معفى 0%' : '0%'})</span>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-bold">({liveParcelQuote.customsRatePercent}%)</span>
                  )}
                </div>
              </div>"""

if customs_quote_target in content:
    content = content.replace(customs_quote_target, "")
else:
    print("Warning: Customs quote not found!")

# While we're here, let's fix the "50% deposit" text in the local payment gateway for buying items.
# Let's add text in Option 2 & 3.
# Where is Option 2?
