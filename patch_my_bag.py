import re

with open('src/components/traveler/TravelerPortal.tsx', 'r') as f:
    content = f.read()

my_bag_block = """          {/* TAB: MY BAG */}
          {activeTab === 'MY_BAG' && (() => {
            const activeTrip = travelerTrips.find(t => t.status === 'SCHEDULED' || t.status === 'PENDING' || t.status === 'IN_TRANSIT');
            if (!activeTrip) {
              return (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 text-center shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-2">{isAr ? 'حقيبتك فارغة' : 'Your Bag is Empty'}</h3>
                  <p className="text-slate-500 text-sm">{isAr ? 'لا توجد رحلات نشطة أو طرود مسندة إليك حالياً.' : 'You have no active trips or assigned parcels.'}</p>
                </div>
              );
            }

            const tripShipments = shipments.filter(s => s.currentStatus !== 'DELIVERED_TO_RECEIVER'); // mock filter for demo
            // Real logic: We should filter by shipments linked to this trip. In our types, shipment might not have tripId directly, but manifest does.
            // Let's use `manifests` to find shipments.
            const manifest = manifests.find(m => m.tripId === activeTrip.id);
            const bagShipments = manifest ? shipments.filter(s => manifest.shipmentIds.includes(s.id)) : [];
            const totalValue = bagShipments.reduce((acc, s) => acc + s.declaredValue, 0);
            
            return (
              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                  <div className="bg-amber-100 text-amber-600 w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-900 text-sm">{isAr ? 'حق التفتيش والشفافية' : 'Right to Inspect'}</h4>
                    <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                      {isAr 
                        ? 'لك الحق المطلق في معاينة وتفتيش محتويات كافة الطرود في مكتبنا قبل استلامها لضمان راحتك النفسية والمسؤولية القانونية في المطار.' 
                        : 'You have the absolute right to inspect all parcels contents at our office before accepting custody to ensure your peace of mind and legal responsibility.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl flex flex-col justify-between">
                    <span className="block text-xs text-slate-500 mb-2 font-bold uppercase tracking-wider">{isAr ? 'إجمالي الطرود' : 'Total Parcels'}</span>
                    <span className="text-3xl font-black text-slate-900">{bagShipments.length}</span>
                  </div>
                  <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl flex flex-col justify-between">
                    <span className="block text-xs text-slate-500 mb-2 font-bold uppercase tracking-wider">{isAr ? 'إجمالي الوزن' : 'Total Weight'}</span>
                    <span className="text-3xl font-black text-slate-900">{activeTrip.allocatedWeightKg} <span className="text-sm text-slate-500">kg</span></span>
                  </div>
                  <div className="p-5 bg-teal-50 border border-teal-200 shadow-sm rounded-2xl flex flex-col justify-between">
                    <span className="block text-xs text-teal-800 mb-2 font-bold uppercase tracking-wider">{isAr ? 'القيمة التقديرية للطرود' : 'Total Est. Value'}</span>
                    <span className="text-3xl font-black text-teal-700">{formatCurrency(totalValue, 'USD')}</span>
                  </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h4 className="text-lg font-black text-white">{isAr ? 'مبلغ الضمان الإلزامي' : 'Mandatory Security Escrow'}</h4>
                      <p className="text-slate-400 text-xs mt-1 max-w-sm leading-relaxed">
                        {isAr 
                          ? 'يُمنع استلام الطرود أو توليد كود الاستلام قبل دفع الضمان المالي. سيتم تحرير الضمان بالكامل فور تسليم الطرود في مكتب الوصول.' 
                          : 'Handover QR is strictly locked until the escrow deposit is secured. It will be fully released upon destination handover.'}
                      </p>
                      <div className="text-3xl font-black text-emerald-400 mt-4">
                        {formatCurrency(activeTrip.requiredEscrowDeposit, 'USD')}
                      </div>
                    </div>
                    
                    <div className="shrink-0">
                      {!activeTrip.isEscrowPaid ? (
                        <button
                          onClick={() => onLockEscrow(activeTrip.id)}
                          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-teal-500 hover:bg-teal-400 text-slate-900 text-sm font-black rounded-xl shadow-[0_0_20px_rgba(20,184,166,0.4)] transition-all cursor-pointer"
                        >
                          <Lock className="w-5 h-5" />
                          <span>{isAr ? 'تأكيد ودفع الضمان' : 'Pay Escrow Deposit'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenQR(activeTrip)}
                          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 text-sm font-black rounded-xl shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-all cursor-pointer"
                        >
                          <QrCode className="w-5 h-5" />
                          <span>{activeTrip.status === 'IN_TRANSIT' ? (isAr ? 'توليد QR لتسليم الطرود' : 'Generate Handover QR') : (isAr ? 'توليد QR لاستلام الأمانة' : 'Generate Pickup QR')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h4 className="font-bold text-slate-900">{isAr ? 'قائمة الفحص البصرية (Visual Checklist)' : 'Visual Checklist'}</h4>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {bagShipments.map(s => (
                      <label key={s.id} className="flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div className="mt-1">
                          <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 transition-colors" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">{s.id.split('-')[0].toUpperCase()}</span>
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">{s.estimatedWeightKg} kg</span>
                            <span className="text-xs text-amber-600 font-bold ml-auto">{formatCurrency(s.declaredValue, 'USD')}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-900">{s.itemDescription}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {isAr ? 'الختم الأمني:' : 'Security Seal:'} <span className="font-mono font-bold text-slate-700">{s.securitySealId || 'PENDING'}</span>
                          </p>
                        </div>
                      </label>
                    ))}
                    {bagShipments.length === 0 && (
                      <div className="p-8 text-center text-slate-500 text-sm">
                        {isAr ? 'لا توجد طرود في هذه الرحلة' : 'No parcels assigned'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}"""

content = re.sub(
    r'\{\/\* TAB 1: MY TRIPS \*\/\}',
    my_bag_block + '\n\n          {/* TAB 1: MY TRIPS */}',
    content
)

with open('src/components/traveler/TravelerPortal.tsx', 'w') as f:
    f.write(content)
