import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

proforma_pattern = r"\{/\* Pro-forma Invoice Breakdown \*/\}.*?\{/\* 4\. OPTION 3 WIZARD: BUY FROM SPECIFIC COUNTRY & SHIP \*/\}"
proforma_match = re.search(proforma_pattern, content, re.DOTALL)

if proforma_match:
    replacement = """{/* Pro-forma Invoice Breakdown */}
            <div className="p-5 bg-brand-950/40 border border-brand-500/30 rounded-2xl flex flex-col gap-3 text-xs">
              <h4 className="font-bold text-brand-300 mb-2 border-b border-brand-500/20 pb-2">
                {isAr ? 'الفاتورة التقديرية (Pro-forma Invoice)' : 'Pro-forma Invoice Breakdown'}
              </h4>
              <div className="flex items-center justify-between text-slate-300">
                <span>{isAr ? 'إجمالي قيمة المنتجات:' : 'Items Total Cost:'}</span>
                <span className="font-semibold">${storeItems.reduce((sum, item) => sum + (item.totalCost || 0), 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>{isAr ? 'عمولة التسوق (5%):' : 'Shopper Fee (5%):'}</span>
                <span className="font-semibold">${(storeItems.reduce((sum, item) => sum + (item.totalCost || 0), 0) * 0.05).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>{isAr ? 'رسوم الشحن التقديرية (مبدئي):' : 'Est. Shipping (Initial):'}</span>
                <span className="font-semibold">$15.00</span>
              </div>
              <div className="flex items-center justify-between text-brand-200 pt-3 border-t border-brand-500/20">
                <span className="font-bold">{isAr ? 'إجمالي التكلفة التقريبي:' : 'Approximate Total Cost:'}</span>
                <span className="text-sm font-bold text-slate-300 line-through opacity-70">
                  ${(storeItems.reduce((sum, item) => sum + (item.totalCost || 0), 0) * 1.05 + 15).toFixed(2)} USD
                </span>
              </div>
              <div className="flex items-center justify-between text-emerald-300 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 mt-1">
                <span className="font-black">{isAr ? 'عربون تأكيد الطلب المطلوب دفعه الآن (50%):' : 'Required Confirmation Deposit (50%):'}</span>
                <span className="text-lg font-black text-emerald-400">
                  ${((storeItems.reduce((sum, item) => sum + (item.totalCost || 0), 0) * 1.05 + 15) / 2).toFixed(2)} USD
                </span>
              </div>
              <p className="text-[10px] text-brand-400/70 mt-1">
                {isAr ? '*يتم دفع الـ 50% المتبقية وأي رسوم جمركية محتملة عند وصول واستلام الطلب.' : '*The remaining 50% and any potential customs duties are paid upon arrival and delivery.'}
              </p>
            </div>
          </div>
          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
              <input
                type="checkbox"
                className="w-5 h-5 text-brand-500 rounded-md cursor-pointer"
                id="packagingCheckboxIntl"
              />
              <label htmlFor="packagingCheckboxIntl" className="text-xs font-semibold text-slate-300 cursor-pointer">
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
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-brand-600/30 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? (isAr ? 'جاري الإرسال...' : 'Submitting...') : (isAr ? 'دفع العربون وتأكيد الطلب' : 'Pay Deposit & Confirm')}</span>
            </button>
          </div>
        </form>
      )}
      {/* 4. OPTION 3 WIZARD: BUY FROM SPECIFIC COUNTRY & SHIP */}"""
    content = content.replace(proforma_match.group(0), replacement)
else:
    print("Warning: Proforma block not found")

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)

print("Pass 3 done")
