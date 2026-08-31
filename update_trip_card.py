import re

with open('src/components/traveler/TravelerPortal.tsx', 'r') as f:
    content = f.read()

weight_bar = """                  {/* Weight Progress Bar */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <div className="flex items-center justify-between text-[11px] mb-2 font-semibold">
                      <span className="text-slate-500">{isAr ? 'الوزن المحجوز' : 'Allocated Weight'}</span>
                      <span className="text-brand-600">
                        {trip.allocatedWeightKg} / {trip.availableWeightKg} <span className="text-slate-400">KG</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex">
                      <div 
                        className="bg-brand-500 h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (trip.allocatedWeightKg / trip.availableWeightKg) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 text-center">
                      {isAr ? 'يتم تحديد الوزن النهائي من قبل الإدارة' : 'Final weight determined by admin'}
                    </p>
                  </div>"""

content = re.sub(
    r'(\{\/\* Weight, Earnings & Escrow \*\/}\s*<div.*?<\/div>\s*<\/div>\s*<\/div>)',
    weight_bar + r'\n\n                  \1',
    content,
    flags=re.DOTALL
)

with open('src/components/traveler/TravelerPortal.tsx', 'w') as f:
    f.write(content)
