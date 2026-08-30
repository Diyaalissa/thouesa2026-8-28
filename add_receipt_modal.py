import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

end_idx = content.find("      {/* Hub Agent Chat Modal */}")
if end_idx == -1:
    print("Could not find insertion point")
    exit(1)

modal_code = """
      {/* Customs Receipt Modal (Bottom Sheet style on Mobile) */}
      <AnimatePresence>
        {customsReceiptUrl && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setCustomsReceiptUrl(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full sm:w-[500px] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{isAr ? 'الوصل الجمركي الرسمي' : 'Official Customs Receipt'}</h3>
                    <p className="text-[11px] text-slate-400">{isAr ? 'تم سداد الرسوم من قبل مدير المحطة' : 'Fees paid by Hub Admin'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setCustomsReceiptUrl(null)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 sm:p-6 overflow-y-auto">
                <div className="aspect-[3/4] sm:aspect-auto sm:h-96 w-full bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 relative">
                  <img 
                    src={customsReceiptUrl} 
                    alt="Customs Receipt" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <span className="text-white font-mono font-bold text-xs bg-slate-950/50 px-3 py-1 rounded-lg backdrop-blur-md border border-slate-700/50">
                      ID: CUS-{Math.floor(1000 + Math.random() * 9000)}
                    </span>
                    <span className="text-brand-300 font-bold text-xs bg-brand-950/50 px-3 py-1 rounded-lg backdrop-blur-md border border-brand-700/50">
                      {new Date().toLocaleDateString(isAr ? 'ar-JO' : 'en-US')}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

"""

final_content = content[:end_idx] + modal_code + content[end_idx:]

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(final_content)

print("Modal added.")
