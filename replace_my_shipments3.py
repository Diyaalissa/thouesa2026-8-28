import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

start_idx = content.find("{activeTab === 'MY_SHIPMENTS' && (")
if start_idx == -1:
    print("Could not find MY_SHIPMENTS block")
    exit(1)

end_idx = content.find("      {/* Printable Waybill Modal */}", start_idx)
if end_idx == -1:
    print("Could not find end block")
    exit(1)

new_content = """{activeTab === 'MY_SHIPMENTS' && (
        <div className="space-y-6">
          {/* Status Filters Bar (Active, Completed, Cancelled) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs w-full sm:w-auto">
              <button
                onClick={() => setShipmentStatusTab('ACTIVE')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
                  shipmentStatusTab === 'ACTIVE'
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isAr ? 'طلبات نشطة' : 'Active Orders'}
              </button>
              <button
                onClick={() => setShipmentStatusTab('COMPLETED')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
                  shipmentStatusTab === 'COMPLETED'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isAr ? 'طلبات مكتملة' : 'Completed'}
              </button>
              <button
                onClick={() => setShipmentStatusTab('CANCELLED')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold transition-colors cursor-pointer ${
                  shipmentStatusTab === 'CANCELLED'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isAr ? 'طلبات ملغاة' : 'Cancelled'}
              </button>
            </div>
          </div>

          {/* Master-Detail Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Orders List (Hidden on mobile if order selected) */}
            <div className={`space-y-3 ${selectedShipment ? 'hidden lg:block' : 'block'}`}>
              {senderShipments.filter(s => {
                if (shipmentStatusTab === 'ACTIVE') return !['DELIVERED', 'CANCELLED'].includes(s.currentStatus);
                if (shipmentStatusTab === 'COMPLETED') return s.currentStatus === 'DELIVERED';
                if (shipmentStatusTab === 'CANCELLED') return s.currentStatus === 'CANCELLED';
                return true;
              }).length === 0 ? (
                <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center text-slate-400 text-xs">
                  <Box className="w-8 h-8 mx-auto mb-2 opacity-40 text-brand-300" />
                  <p>{isAr ? 'لا توجد طلبات في هذا التصنيف حالياً' : 'No orders found in this category'}</p>
                </div>
              ) : (
                senderShipments.filter(s => {
                  if (shipmentStatusTab === 'ACTIVE') return !['DELIVERED', 'CANCELLED'].includes(s.currentStatus);
                  if (shipmentStatusTab === 'COMPLETED') return s.currentStatus === 'DELIVERED';
                  if (shipmentStatusTab === 'CANCELLED') return s.currentStatus === 'CANCELLED';
                  return true;
                }).map((s) => {
                  const isSelected = selectedShipment?.id === s.id;
                  
                  // Payment Tag Logic
                  const isFullyPaid = s.currentStatus === 'DELIVERED' || s.serviceType === 'SEND_PARCEL';
                  const paymentTagClass = isFullyPaid 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                  const paymentTagText = isFullyPaid 
                    ? (isAr ? 'مكتمل الدفع' : 'Fully Paid')
                    : (isAr ? 'بانتظار الدفع عند الاستلام' : 'Pending Payment on Delivery');

                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedShipment(s)}
                      className={`p-4 rounded-3xl border cursor-pointer transition-all duration-300 ${
                        isSelected
                          ? 'bg-brand-950/40 border-brand-500/50 shadow-xl shadow-brand-900/20 ring-1 ring-brand-500/20'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-white">{s.trackingNumber}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date().toLocaleDateString(isAr ? 'ar-JO' : 'en-US', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        {/* Service Type Icon/Badge */}
                        <div className="flex items-center gap-1.5">
                          {s.serviceType === 'INTERNATIONAL_BUY' && (
                            <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {isAr ? 'شراء عالمي' : 'Global Buy'}
                            </span>
                          )}
                          {s.serviceType === 'SPECIFIC_COUNTRY_BUY' && (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                              <Store className="w-3 h-3" />
                              {isAr ? 'شراء محلي' : 'Local Buy'}
                            </span>
                          )}
                          {(!s.serviceType || s.serviceType === 'SEND_PARCEL') && (
                            <span className="px-2 py-0.5 rounded-lg bg-brand-500/20 text-brand-400 text-[10px] font-bold flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {isAr ? 'إرسال طرد' : 'Send Parcel'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 mb-3 bg-slate-950/50 p-2 rounded-xl border border-slate-800/50">
                        <span className="truncate">{HUBS_DATA.find(h => h.id === s.originHubId)?.cityAr || 'الأردن'}</span>
                        <ArrowRight className="w-3 h-3 text-brand-500 shrink-0 rtl:rotate-180" />
                        <span className="truncate">{HUBS_DATA.find(h => h.id === s.destinationHubId)?.cityAr || 'الجزائر'}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${paymentTagClass}`}>
                          {paymentTagText}
                        </span>
                        <StatusBadge status={s?.currentStatus} locale={locale} size="sm" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right: Selected Order Detail (Hidden on mobile if NO order selected) */}
            <div className={`lg:col-span-2 space-y-4 ${selectedShipment ? 'block' : 'hidden lg:block'}`}>
              {selectedShipment ? (
                <div className="bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-800 text-white shadow-2xl relative overflow-hidden">
                  {/* Subtle Background Accent */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 blur-[100px] rounded-full pointer-events-none" />
                  
                  {/* Mobile Back Button */}
                  <div className="lg:hidden mb-4">
                    <button 
                      onClick={() => setSelectedShipment(null)}
                      className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                      {isAr ? 'العودة للقائمة' : 'Back to List'}
                    </button>
                  </div>

                  {/* Order Top Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800/80 relative z-10">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-black font-mono text-white tracking-tight">{selectedShipment.trackingNumber}</h3>
                        <StatusBadge status={selectedShipment.currentStatus} locale={locale} size="sm" />
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5" />
                        {isAr ? 'المستلم:' : 'Recipient:'} <strong className="text-slate-200">{selectedShipment.recipientName}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setChatModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-700"
                      >
                        <MessageSquare className="w-4 h-4 text-brand-400" />
                        <span>{isAr ? 'محادثة الدعم' : 'Support Chat'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Visual Tracking Timeline (Vertical) */}
                  <div className="py-6 border-b border-slate-800/80 relative z-10">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                      <ListOrdered className="w-4 h-4 text-brand-500" />
                      {isAr ? 'الخط الزمني للشحنة' : 'Shipment Timeline'}
                    </h4>
                    <TrackingTimeline 
                      shipment={selectedShipment} 
                      locale={locale} 
                      onOpenWaybill={(s) => setWaybillModalShipment(s)} 
                    />
                  </div>

                  {/* Financial Transparency & Customs Section */}
                  <div className="pt-6 relative z-10 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-emerald-500" />
                        {isAr ? 'الفاتورة والشفافية المالية' : 'Financial Transparency'}
                      </h4>
                    </div>

                    <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 text-xs">
                      {/* Base cost / Deposit */}
                      <div className="flex items-center justify-between text-slate-300">
                        <span>{isAr ? 'قيمة المنتجات (عربون مدفوع)' : 'Items Value (Deposit Paid)'}</span>
                        <span className="font-bold text-white">{formatCurrency(selectedShipment.declaredValue || 0, 'USD')}</span>
                      </div>
                      
                      {/* Shipping Cost */}
                      <div className="flex items-center justify-between text-slate-300">
                        <span>{isAr ? 'تكلفة الشحن (تقريبية)' : 'Shipping Cost (Est.)'}</span>
                        <span className="font-bold text-white">{formatCurrency(selectedShipment.shippingCost || 15, 'USD')}</span>
                      </div>

                      {/* Customs Receipt dynamic row */}
                      {selectedShipment.currentStatus === 'CUSTOMS_CLEARANCE' || selectedShipment.currentStatus === 'DELIVERED' || selectedShipment.currentStatus === 'READY_FOR_DELIVERY' ? (
                        <div className="flex items-center justify-between text-amber-200 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                          <div className="flex items-center gap-2">
                            <span>{isAr ? 'رسوم جمركية رسمية' : 'Official Customs Fees'}</span>
                            <button 
                              onClick={() => setCustomsReceiptUrl('https://images.unsplash.com/photo-1621844781423-f327702e861c?auto=format&fit=crop&q=80&w=400')}
                              className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              <Paperclip className="w-3 h-3" />
                              {isAr ? 'عرض الوصل' : 'View Receipt'}
                            </button>
                          </div>
                          <span className="font-bold text-amber-400">{formatCurrency(25, 'USD')}</span>
                        </div>
                      ) : null}

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-sm">
                        <span className="font-bold text-slate-200">{isAr ? 'المبلغ المتبقي عند الاستلام' : 'Remaining on Delivery'}</span>
                        <span className="font-black text-brand-400 text-lg">
                          {formatCurrency((selectedShipment.shippingCost || 15) + (['CUSTOMS_CLEARANCE', 'DELIVERED', 'READY_FOR_DELIVERY'].includes(selectedShipment.currentStatus) ? 25 : 0), 'USD')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hidden lg:flex flex-col items-center justify-center h-full min-h-[400px] bg-slate-900/50 border border-slate-800/50 rounded-3xl text-slate-500 space-y-4">
                  <Box className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-medium">{isAr ? 'اختر طلباً لعرض التفاصيل' : 'Select an order to view details'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

"""

final_content = content[:start_idx] + new_content + content[end_idx:]

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(final_content)

print("Successfully replaced MY_SHIPMENTS block.")
