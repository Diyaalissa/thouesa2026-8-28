import re

with open('src/components/traveler/TravelerPortal.tsx', 'r') as f:
    content = f.read()

new_balance_display = """              <div className="flex flex-col gap-1 mt-1">
                <div className="text-3xl font-black text-emerald-400">
                  {wallet ? formatCurrency(wallet.balance, wallet.currency) : '$0.00'}
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
                  <span>🇯🇴 {wallet ? formatCurrency(wallet.balance * 0.71, 'JOD') : '0.00 JOD'}</span>
                  <span>🇩🇿 {wallet ? formatCurrency(wallet.balance * 134, 'DZD') : '0.00 DZD'}</span>
                </div>
              </div>"""

content = re.sub(
    r'<div className="text-3xl font-black text-emerald-400 mt-1">.*?</div>',
    new_balance_display,
    content,
    flags=re.DOTALL
)

with open('src/components/traveler/TravelerPortal.tsx', 'w') as f:
    f.write(content)
