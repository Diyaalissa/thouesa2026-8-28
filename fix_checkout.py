import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

old_checkout = """<h4 className="text-lg font-black text-white mb-4 border-b border-slate-800 pb-3">{isAr ? 'ملخص الدفع والتأكيد' : 'Checkout & Confirmation'}</h4>"""

new_checkout = """<div className="flex flex-col md:flex-row md:items-center justify-between mb-4 border-b border-slate-800 pb-3 gap-3">
              <h4 className="text-lg font-black text-white">{isAr ? 'ملخص الدفع والتأكيد' : 'Checkout & Confirmation'}</h4>
              <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 w-fit">
                <button
                  type="button"
                  onClick={() => setPaymentCurrency('SENDER')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${paymentCurrency === 'SENDER' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  {isAr ? 'الدفع بعملة المرسل (JOD)' : 'Sender Currency (JOD)'}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentCurrency('RECIPIENT')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${paymentCurrency === 'RECIPIENT' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  {isAr ? 'الدفع بعملة المستلم (DZD)' : 'Recipient Currency (DZD)'}
                </button>
              </div>
            </div>"""

content = content.replace(old_checkout, new_checkout)

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)

print("Patch applied")
