import re

with open('src/components/wallet/WalletDashboard.tsx', 'r') as f:
    content = f.read()

# We will completely replace the Ledger part to include a desktop table and mobile cards.

# First, add a state for filter:
filter_state = """  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [txFilter, setTxFilter] = useState('ALL');"""

content = content.replace("  const [uploadingReceipt, setUploadingReceipt] = useState(false);", filter_state)

# Now, we find the ledger section.
ledger_start_marker = "{/* Right Column: Transaction Ledger */}"
ledger_end_marker = "{/* Quick Settle Modal / Bottom Sheet */}"

start_idx = content.find(ledger_start_marker)
end_idx = content.find(ledger_end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find ledger boundaries")
    exit(1)

new_ledger = """{/* Right Column: Transaction Ledger */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                {isAr ? 'سجل الحركات المرجعي' : 'Transaction Ledger'}
              </h3>
              
              <div className="flex items-center gap-2">
                <select 
                  value={txFilter}
                  onChange={(e) => setTxFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                >
                  <option value="ALL">{isAr ? 'جميع الحركات' : 'All Transactions'}</option>
                  <option value="DEPOSIT">{isAr ? 'إيداع واسترداد' : 'Deposits & Refunds'}</option>
                  <option value="DEDUCTION">{isAr ? 'خصم ودفع' : 'Deductions & Payments'}</option>
                </select>
                <button className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 bg-brand-50 dark:bg-brand-900/30 px-3 py-1.5 rounded-lg transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isAr ? 'تحميل الكشف' : 'Export'}</span>
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {loadingTx ? (
                <div className="text-center py-8 text-slate-400 font-bold text-sm animate-pulse">
                  {isAr ? 'جاري تحميل المعاملات...' : 'Loading transactions...'}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed">
                  <p className="text-slate-500 font-medium text-sm">
                    {isAr ? 'لا توجد معاملات مالية مسجلة بعد' : 'No transactions recorded yet'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Data Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                          <th className="pb-3 font-bold">{isAr ? 'رقم الحركة' : 'Txn ID'}</th>
                          <th className="pb-3 font-bold">{isAr ? 'التاريخ' : 'Date'}</th>
                          <th className="pb-3 font-bold">{isAr ? 'البيان' : 'Description'}</th>
                          <th className="pb-3 font-bold">{isAr ? 'المبلغ' : 'Amount'}</th>
                          <th className="pb-3 font-bold">{isAr ? 'الحالة' : 'Status'}</th>
                          <th className="pb-3 font-bold text-right">{isAr ? 'إجراءات' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {transactions
                          .filter(tx => txFilter === 'ALL' || (txFilter === 'DEPOSIT' && tx.amount > 0) || (txFilter === 'DEDUCTION' && tx.amount < 0))
                          .map((tx) => {
                          const isPositive = tx.amount > 0;
                          return (
                            <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                              <td className="py-3">
                                <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{tx.transactionCode}</span>
                              </td>
                              <td className="py-3">
                                <span className="text-xs text-slate-600 dark:text-slate-400">
                                  {new Date(tx.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-JO' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                    isPositive ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-slate-50 dark:bg-slate-800'
                                  }`}>
                                    {getTransactionIcon(tx.type)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                                      {getTransactionLabel(tx.type)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {tx.relatedShipmentId && (
                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-200 dark:border-slate-700">
                                          {tx.relatedShipmentId}
                                        </span>
                                      )}
                                      {tx.note && (
                                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                          tx.type === 'ESCROW_REFUND' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' : 'text-slate-500'
                                        }`}>
                                          {tx.note}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3">
                                <p className={`text-sm font-black ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
                                  {isPositive ? '+' : ''}{formatCurrency(tx.amount, tx.currency as any)}
                                </p>
                              </td>
                              <td className="py-3">
                                <span className={`text-[10px] font-bold flex items-center gap-1 ${
                                  tx.status === 'COMMITTED' ? 'text-emerald-500' : 'text-amber-500'
                                }`}>
                                  {tx.status === 'COMMITTED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                  {tx.status === 'COMMITTED' ? (isAr ? 'مكتمل' : 'Completed') : (isAr ? 'قيد المراجعة' : 'Pending')}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <button 
                                  onClick={() => setSelectedInvoice(tx)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-brand-600 transition-colors inline-flex"
                                >
                                  <Receipt className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards List */}
                  <div className="md:hidden space-y-3">
                    {transactions
                      .filter(tx => txFilter === 'ALL' || (txFilter === 'DEPOSIT' && tx.amount > 0) || (txFilter === 'DEDUCTION' && tx.amount < 0))
                      .map((tx) => {
                      const isPositive = tx.amount > 0;
                      return (
                        <div key={tx.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-brand-200 dark:hover:border-slate-600 hover:shadow-md rounded-2xl flex flex-col gap-3 transition-all">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                isPositive ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-slate-50 dark:bg-slate-800'
                              }`}>
                                {getTransactionIcon(tx.type)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">
                                  {getTransactionLabel(tx.type)}
                                </p>
                                <span className="font-mono text-[10px] text-slate-400">{tx.transactionCode}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-base font-black ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
                                {isPositive ? '+' : ''}{formatCurrency(tx.amount, tx.currency as any)}
                              </p>
                              <span className={`text-[10px] font-bold flex items-center justify-end gap-1 mt-1 ${
                                tx.status === 'COMMITTED' ? 'text-emerald-500' : 'text-amber-500'
                              }`}>
                                {tx.status === 'COMMITTED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {tx.status === 'COMMITTED' ? (isAr ? 'مكتمل' : 'Completed') : (isAr ? 'قيد المراجعة' : 'Pending')}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/50 pt-3">
                            <div className="flex flex-wrap items-center gap-2">
                              {tx.relatedShipmentId && (
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-200 dark:border-slate-700">
                                  {tx.relatedShipmentId}
                                </span>
                              )}
                              {tx.note && (
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                  tx.type === 'ESCROW_REFUND' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                  {tx.note}
                                </span>
                              )}
                            </div>
                            <button 
                              onClick={() => setSelectedInvoice(tx)}
                              className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-brand-600 transition-colors"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      """

final_content = content[:start_idx] + new_ledger + content[end_idx:]

with open('src/components/wallet/WalletDashboard.tsx', 'w') as f:
    f.write(final_content)

print("Updated WalletDashboard.tsx")
