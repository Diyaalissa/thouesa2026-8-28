import re

with open('src/components/wallet/WalletDashboard.tsx', 'r') as f:
    content = f.read()

# Add a check for customs fee to show the official receipt button in the invoice modal
invoice_footer_marker = """<button
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-500 text-slate-800 dark:text-white font-bold rounded-xl text-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  {isAr ? 'تحميل الفاتورة PDF' : 'Download PDF Invoice'}
                </button>"""

new_footer = """<div className="space-y-2">
                  <button
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-500 text-slate-800 dark:text-white font-bold rounded-xl text-sm transition-all"
                  >
                    <Download className="w-4 h-4" />
                    {isAr ? 'تحميل الفاتورة PDF' : 'Download PDF Invoice'}
                  </button>
                  {selectedInvoice.type === 'CUSTOMS_FEE' && (
                    <button
                      className="w-full flex items-center justify-center gap-2 py-3 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 dark:hover:bg-brand-900/50 text-brand-600 dark:text-brand-400 font-bold rounded-xl text-sm transition-all"
                      onClick={() => alert(isAr ? 'جاري فتح الوصل الجمركي الرسمي...' : 'Opening Official Customs Receipt...')}
                    >
                      <Receipt className="w-4 h-4" />
                      {isAr ? 'عرض وصل الجمارك الرسمي' : 'View Official Customs Receipt'}
                    </button>
                  )}
                </div>"""

content = content.replace(invoice_footer_marker, new_footer)

with open('src/components/wallet/WalletDashboard.tsx', 'w') as f:
    f.write(content)

print("Updated Invoice Modal")
