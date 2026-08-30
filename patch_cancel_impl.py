import sys

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

old_actions_block = """                  {/* Actions */}
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                    {(selectedShipment.currentStatus === 'SUBMITTED' || selectedShipment.currentStatus === 'PENDING') && (
                      <button
                        onClick={() => {
                            if (window.confirm(isAr ? 'هل أنت متأكد من إلغاء الطلب؟ سيتم استرداد المبلغ إلى المحفظة.' : 'Are you sure you want to cancel? Refund will be issued to your wallet.')) {
                                // Add mock wallet refund logic in real implementation
                                alert(isAr ? 'تم الإلغاء واسترداد المبلغ للمحفظة بنجاح.' : 'Order cancelled and amount refunded to wallet.');
                            }
                        }}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-colors"
                      >
                        {isAr ? 'إلغاء الطلب واسترداد الرصيد' : 'Cancel Order (Refund to Wallet)'}
                      </button>
                    )}
                  </div>"""

new_actions_block = """                  {/* Actions */}
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                    {['PENDING', 'PENDING_REVIEW', 'SUBMITTED', 'PENDING_HUB_DROPOFF'].includes(selectedShipment.currentStatus) && (
                      <button
                        onClick={async () => {
                            if (window.confirm(isAr ? 'هل أنت متأكد من إلغاء الطلب؟ سيتم استرداد المبلغ إلى المحفظة بشكل تلقائي.' : 'Are you sure you want to cancel? Refund will be issued to your wallet automatically.')) {
                                const success = await onCancelShipment(selectedShipment.id);
                                if (success) {
                                  alert(isAr ? 'تم الإلغاء واسترداد المبلغ للمحفظة بنجاح.' : 'Order cancelled and amount refunded to wallet successfully.');
                                }
                            }
                        }}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-colors"
                      >
                        {isAr ? 'إلغاء الطلب واسترداد الرصيد' : 'Cancel Order (Refund to Wallet)'}
                      </button>
                    )}
                  </div>"""

content = content.replace(old_actions_block, new_actions_block)

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
