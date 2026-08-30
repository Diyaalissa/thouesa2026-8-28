import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

opt3_pattern = r"\{/\* Pro-forma Invoice Breakdown \*/\}.*?\{/\* 5\. TAB: RECEIVED ORDERS & ACTIVE SHIPMENTS WITH ITEM DETAILS, QUANTITIES & PRICES \*/\}"
opt3_match = re.search(opt3_pattern, content, re.DOTALL)

if opt3_match:
    # We can just reuse the similar logic for option 3, adjusting variable names if needed
    replacement = """{/* Pro-forma Invoice Breakdown */}
            <div className="p-5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex flex-col gap-3 text-xs">
              <h4 className="font-bold text-emerald-400 mb-2 border-b border-emerald-500/20 pb-2">
                {isAr ? 'الفاتورة التقديرية (Pro-forma Invoice)' : 'Pro-forma Invoice Breakdown'}
              </h4>
              <div className="flex items-center justify-between text-slate-300">
                <span>{isAr ? 'إجمالي قيمة المنتجات المقدرة:' : 'Est. Items Total Cost:'}</span>
                <span className="font-semibold">${countryBuyItems.reduce((sum, item) => sum + (item.totalCost || 0), 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>{isAr ? 'عمولة التسوق (5%):' : 'Shopper Fee (5%):'}</span>
                <span className="font-semibold">${(countryBuyItems.reduce((sum, item) => sum + (item.totalCost || 0), 0) * 0.05).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>{isAr ? 'رسوم الشحن التقديرية (مبدئي):' : 'Est. Shipping (Initial):'}</span>
                <span className="font-semibold">$15.00</span>
              </div>
              <div className="flex items-center justify-between text-emerald-200 pt-3 border-t border-emerald-500/20">
                <span className="font-bold">{isAr ? 'الإجمالي التقديري للتكلفة:' : 'Total Estimated Cost:'}</span>
                <span className="text-sm font-bold text-slate-300 line-through opacity-70">
                  ${(countryBuyItems.reduce((sum, item) => sum + (item.totalCost || 0), 0) * 1.05 + 15).toFixed(2)} USD
                </span>
              </div>
              <div className="flex items-center justify-between text-emerald-300 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 mt-1">
                <span className="font-black">{isAr ? 'عربون تأكيد الطلب المطلوب دفعه الآن (50%):' : 'Required Confirmation Deposit (50%):'}</span>
                <span className="text-lg font-black text-emerald-400">
                  ${((countryBuyItems.reduce((sum, item) => sum + (item.totalCost || 0), 0) * 1.05 + 15) / 2).toFixed(2)} USD
                </span>
              </div>
              <p className="text-[10px] text-emerald-400/70 mt-1">
                {isAr ? '*يتم دفع الـ 50% المتبقية وأي رسوم جمركية محتملة عند وصول واستلام الطلب.' : '*The remaining 50% and any potential customs duties are paid upon arrival and delivery.'}
              </p>
            </div>
          </div>
          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
              <input
                type="checkbox"
                className="w-5 h-5 text-emerald-500 rounded-md cursor-pointer"
                id="packagingCheckboxOpt3"
              />
              <label htmlFor="packagingCheckboxOpt3" className="text-xs font-semibold text-slate-300 cursor-pointer">
                {isAr ? 'تغليف آمن ومحكم (رسوم إضافية)' : 'Secure Packaging (Extra Fee)'}
              </label>
            </div>
            <div>
              <select className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white">
                <option value="HUB">{isAr ? 'الاستلام من المكتب' : 'Hub Pickup'}</option>
                <option value="HOME">{isAr ? 'توصيل لباب البيت' : 'Home Delivery'}</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('MY_SHIPMENTS')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-teal-600/30 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? (isAr ? 'جاري الإرسال...' : 'Submitting...') : (isAr ? 'دفع العربون وتأكيد الطلب' : 'Pay Deposit & Confirm')}</span>
            </button>
          </div>
        </form>
      )}
      {/* 5. TAB: RECEIVED ORDERS & ACTIVE SHIPMENTS WITH ITEM DETAILS, QUANTITIES & PRICES */}"""
    content = content.replace(opt3_match.group(0), replacement)
else:
    print("Warning: Option 3 block not found")

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)

print("Pass 4 done")
