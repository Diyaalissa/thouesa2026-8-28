import re

with open('src/components/wallet/WalletDashboard.tsx', 'r') as f:
    content = f.read()

# Replace the select options to add CASH_OFFICE
old_select = """                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-800 dark:text-white outline-none focus:border-brand-500 transition-all cursor-pointer"
                >
                  <option value="CARD">{isAr ? 'البطاقة البنكية (Credit/Debit Card)' : 'Bank Card'}</option>
                  {isJordanian && (
                    <option value="INSTANT_TRANSFER">{isAr ? 'إي فواتيركم / كليك' : 'eFawateerCom / CliQ'}</option>
                  )}
                  {isAlgerian && (
                    <option value="INSTANT_TRANSFER">{isAr ? 'البطاقة الذهبية / بريدي موب' : 'Edahabia / BaridiMob'}</option>
                  )}
                  <option value="BANK_TRANSFER">{isAr ? 'حوالة بنكية يدوية' : 'Manual Bank Transfer'}</option>
                </select>"""

new_select = """                <select 
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    setUploadingReceipt(false); // Reset on change
                  }}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-800 dark:text-white outline-none focus:border-brand-500 transition-all cursor-pointer"
                >
                  <option value="CARD">{isAr ? 'البطاقة البنكية (Credit/Debit Card)' : 'Bank Card'}</option>
                  {isJordanian && (
                    <option value="INSTANT_TRANSFER">{isAr ? 'كليك (CliQ) / إي فواتيركم' : 'CliQ / eFawateerCom'}</option>
                  )}
                  {isAlgerian && (
                    <option value="INSTANT_TRANSFER">{isAr ? 'بريدي موب / البطاقة الذهبية' : 'BaridiMob / Edahabia'}</option>
                  )}
                  <option value="BANK_TRANSFER">{isAr ? 'حوالة بنكية يدوية' : 'Manual Bank Transfer'}</option>
                  <option value="CASH_OFFICE">{isAr ? 'دفع نقدي في المكتب' : 'Cash at Office'}</option>
                </select>"""

content = content.replace(old_select, new_select)

# Replace the animate presence block
old_animate = """              {/* In-app Receipt Upload for Bank Transfer */}
              <AnimatePresence>
                {paymentMethod === 'BANK_TRANSFER' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 mt-2 space-y-3">
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {isAr ? 'يرجى تحويل المبلغ للحساب التالي ثم إرفاق الإيصال:' : 'Please transfer to the following account and upload receipt:'}
                        <br/><strong className="text-slate-800 dark:text-white block mt-1">IBAN: JO12 3456 7890 1234 5678 90</strong>
                      </p>
                      <button 
                        onClick={() => {
                          alert(isAr ? 'تم إرفاق صورة التحويل بنجاح' : 'Transfer receipt uploaded successfully');
                          setUploadingReceipt(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-slate-700 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:border-brand-500 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        {isAr ? 'إرفاق صورة التحويل' : 'Upload Receipt'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>"""

new_animate = """              {/* Instructions & In-app Receipt Upload */}
              <AnimatePresence>
                {(paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'INSTANT_TRANSFER' || paymentMethod === 'CASH_OFFICE') && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 mt-2 space-y-3">
                      {paymentMethod === 'CASH_OFFICE' ? (
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          {isAr ? 'يرجى زيارة مكتبنا وتزويد الموظف بالرقم التعريفي الخاص بك:' : 'Please visit our office and provide your ID to the agent:'}
                          <br/>
                          <span className="inline-block mt-2 font-mono text-lg font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-3 py-1 rounded-lg border border-brand-200 dark:border-brand-800">{currentUser.id}</span>
                          <br/>
                          <span className="block mt-2 text-xs">{isAr ? 'سيتم شحن رصيدك فور استلام المبلغ نقداً.' : 'Your balance will be topped up instantly upon cash receipt.'}</span>
                        </p>
                      ) : (
                        <>
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            {paymentMethod === 'INSTANT_TRANSFER' && isJordanian && (
                              <>{isAr ? 'يرجى التحويل عبر كليك (CliQ) إلى المعرف التالي ثم إرفاق الوصل إجبارياً:' : 'Please transfer via CliQ to the following alias and upload receipt (Mandatory):'}<br/><strong className="text-slate-800 dark:text-white block mt-1 text-sm">Alias: THOUESA</strong></>
                            )}
                            {paymentMethod === 'INSTANT_TRANSFER' && isAlgerian && (
                              <>{isAr ? 'يرجى التحويل عبر بريدي موب إلى المعرف التالي ثم إرفاق الوصل إجبارياً:' : 'Please transfer via BaridiMob to the following RIP and upload receipt (Mandatory):'}<br/><strong className="text-slate-800 dark:text-white block mt-1 text-sm">RIP: 007999990000000000</strong></>
                            )}
                            {paymentMethod === 'BANK_TRANSFER' && (
                              <>{isAr ? 'يرجى تحويل المبلغ للحساب البنكي التالي ثم إرفاق الوصل إجبارياً:' : 'Please transfer to the following bank account and upload receipt (Mandatory):'}<br/><strong className="text-slate-800 dark:text-white block mt-1">IBAN: JO12 3456 7890 1234 5678 90</strong></>
                            )}
                          </p>
                          <button 
                            onClick={() => {
                              alert(isAr ? 'تم إرفاق صورة الوصل بنجاح' : 'Receipt uploaded successfully');
                              setUploadingReceipt(true);
                            }}
                            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors ${uploadingReceipt ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' : 'bg-white dark:bg-slate-700 border border-dashed border-brand-300 dark:border-brand-600 text-brand-600 dark:text-brand-400 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20'}`}
                          >
                            {uploadingReceipt ? (
                              <><CheckCircle2 className="w-4 h-4" /> {isAr ? 'تم إرفاق الوصل' : 'Receipt Uploaded'}</>
                            ) : (
                              <><Upload className="w-4 h-4" /> {isAr ? 'إرفاق صورة الوصل (إلزامي)' : 'Upload Receipt (Mandatory)'}</>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>"""

content = content.replace(old_animate, new_animate)

# Also need to update disabled button state and handleDeposit logic
old_submit_btn = """              <button 
                onClick={handleDeposit} 
                disabled={isDepositing || (paymentMethod === 'BANK_TRANSFER' && !uploadingReceipt)} 
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2"
              >"""

new_submit_btn = """              <button 
                onClick={handleDeposit} 
                disabled={isDepositing || ((paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'INSTANT_TRANSFER') && !uploadingReceipt) || paymentMethod === 'CASH_OFFICE'} 
                className={`w-full py-3.5 text-white font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 ${paymentMethod === 'CASH_OFFICE' ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 disabled:opacity-50'}`}
              >"""

content = content.replace(old_submit_btn, new_submit_btn)

with open('src/components/wallet/WalletDashboard.tsx', 'w') as f:
    f.write(content)

print("Updated WalletDashboard logic.")
