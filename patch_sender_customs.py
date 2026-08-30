import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# 1. Remove Customs Condition Selector
# Using regex to find the block
customs_block_pattern = r"\{/\* Customs Condition Selector \*/\}.*?\{/\* Live Quote Breakdown Card \*/\}"
customs_match = re.search(customs_block_pattern, content, re.DOTALL)

if customs_match:
    # Let's insert Trip Selection UX and Packaging options before the Live Quote Breakdown Card
    replacement = """{/* Trip Selection & Warning */}
          <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-2xl space-y-3">
             <div className="flex items-center gap-2 text-amber-400 font-bold mb-2">
                <Plane className="w-5 h-5" />
                <span>{isAr ? 'اختيار الرحلة المتاحة للتوصيل' : 'Select Available Delivery Trip'}</span>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'الرحلة المقررة' : 'Scheduled Trip'}</label>
                    <select className="w-full px-3 py-2.5 bg-slate-800 border border-amber-500/50 rounded-xl text-xs text-white">
                        <option>{isAr ? 'رحلة 15 أكتوبر - متاح 20 كغ' : 'Oct 15 Trip - 20kg Remaining'}</option>
                        <option>{isAr ? 'رحلة 20 أكتوبر - متاح 5 كغ' : 'Oct 20 Trip - 5kg Remaining'}</option>
                    </select>
                 </div>
                 <div className="flex flex-col justify-center">
                    <p className="text-xs text-amber-200 font-bold bg-amber-500/20 p-2 rounded-lg border border-amber-500/30 text-center">
                       ⚠️ {isAr ? 'تنبيه إلزامي: يجب تسليم الطلب للمكتب قبل 3 أيام من تاريخ الرحلة' : 'Mandatory Alert: Deliver to hub 3 days prior to trip date!'}
                    </p>
                    <p className="text-[10px] text-slate-400 text-center mt-2">
                       {isAr ? 'تاريخ التسليم المتوقع: بعد 3 أيام عمل من تاريخ الرحلة' : 'Expected Delivery: 3 business days after trip'}
                    </p>
                 </div>
             </div>
          </div>
          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
              <input
                type="checkbox"
                className="w-5 h-5 text-brand-500 rounded-md cursor-pointer"
                id="packagingCheckbox"
              />
              <label htmlFor="packagingCheckbox" className="text-xs font-semibold text-slate-300 cursor-pointer">
                {isAr ? 'تغليف آمن ومحكم (رسوم إضافية)' : 'Secure Packaging (Extra Fee)'}
              </label>
            </div>
          </div>
          {/* Live Quote Breakdown Card */}"""
    content = content.replace(customs_match.group(0), replacement)
else:
    print("Warning: Customs block not found")

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)

print("Pass 2 done")
