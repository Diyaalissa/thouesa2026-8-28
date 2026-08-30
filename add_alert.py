import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

alert_card = """            {activeTab === 'OVERVIEW' && (
              <div className="space-y-4">
                {hasPendingDispute && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-red-800 text-sm">{isAr ? 'لديك نزاع بانتظار ردك' : 'You have a dispute pending your response'}</h4>
                        <p className="text-xs text-red-600 mt-0.5">{isAr ? 'يرجى مراجعة تفاصيل النزاع لتجنب إغلاقه تلقائياً.' : 'Please review the dispute details to prevent auto-closure.'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('DISPUTES')}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0"
                    >
                      {isAr ? 'عرض النزاع' : 'View Dispute'}
                    </button>
                  </motion.div>
                )}
                <SenderOverview 
                  currentUser={currentUser} 
                  walletBalance={wallet?.balance || 0}
                  activeShipmentsCount={(shipments || []).filter(s => s?.currentStatus !== 'DELIVERED' && s?.currentStatus !== 'CANCELLED').length}
                  onNavigate={(tab) => setActiveTab(tab as any)}
                  isAr={isAr}
                  shipments={shipments}
                />
              </div>
            )}"""

content = re.sub(
    r'\{activeTab === \'OVERVIEW\' && \(\s*<SenderOverview[^>]+/>\s*\)\}',
    alert_card,
    content
)

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
