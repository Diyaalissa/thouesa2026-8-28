const fs = require('fs');
let content = fs.readFileSync('src/components/sender/SenderPortal.tsx.bak', 'utf8');

const disputeTabContent = `
          {activeTab === 'DISPUTES' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-white shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">
                      {isAr ? 'النزاعات والشكاوى الرسمية' : 'Disputes & Official Claims'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {isAr ? 'قم بتقديم شكوى أو متابعة الشكاوى السابقة وتجميد الضمان المالي للمسافر' : 'File a new complaint or track existing claims to freeze traveler escrow'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {senderShipments.filter(s => ['DELIVERED_TO_HUB', 'DELIVERED_TO_RECIPIENT', 'DISPUTED', 'IN_TRANSIT', 'WEIGHT_DISCREPANCY_PENDING', 'PENDING_PAYMENT'].includes(s.currentStatus)).map(s => (
                  <div key={s.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono font-bold text-xs text-slate-900">{s.trackingNumber}</span>
                      <StatusBadge status={s.currentStatus} locale={locale} size="sm" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700 mb-4 truncate">{s.itemDescription || (isAr ? 'بدون وصف' : 'No description')}</p>
                    
                    <button
                      onClick={() => {
                        setSelectedShipment(s);
                        setDisputeModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-colors cursor-pointer border border-red-200"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>{s.currentStatus === 'DISPUTED' ? (isAr ? 'تحديث النزاع / عرض التفاصيل' : 'Update Dispute') : (isAr ? 'تقديم شكوى وفتح نزاع' : 'File Dispute')}</span>
                    </button>
                  </div>
                ))}
                
                {senderShipments.filter(s => ['DELIVERED_TO_HUB', 'DELIVERED_TO_RECIPIENT', 'DISPUTED', 'IN_TRANSIT', 'WEIGHT_DISCREPANCY_PENDING', 'PENDING_PAYMENT'].includes(s.currentStatus)).length === 0 && (
                  <div className="col-span-2 p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-300" />
                    <p>{isAr ? 'لا توجد شحنات مؤهلة لفتح نزاع في الوقت الحالي' : 'No eligible shipments to dispute right now'}</p>
                  </div>
                )}
              </div>
            </div>
          )}
`;

content = content.replace('{activeTab === \'SEND_PARCEL\' && (', disputeTabContent + '\n          {activeTab === \'SEND_PARCEL\' && (');

fs.writeFileSync('src/components/sender/SenderPortal.tsx', content);
