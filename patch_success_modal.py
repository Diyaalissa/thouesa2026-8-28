import sys

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# Add state
content = content.replace("const [waybillModalShipment, setWaybillModalShipment] = useState<Shipment | null>(null);", "const [waybillModalShipment, setWaybillModalShipment] = useState<Shipment | null>(null);\n  const [orderSuccessModalOpen, setOrderSuccessModalOpen] = useState(false);")

# Update handleSendParcelSubmit
content = content.replace("""    if (success) {
      setActiveTab('MY_SHIPMENTS');
      onRefreshShipments();
    }""", """    if (success) {
      setActiveTab('MY_SHIPMENTS');
      onRefreshShipments();
      setOrderSuccessModalOpen(true);
    }""")

# Update handleStoreBuySubmit
content = content.replace("""    if (success) {
      setActiveTab('MY_SHIPMENTS');
      onRefreshShipments();
    }""", """    if (success) {
      setActiveTab('MY_SHIPMENTS');
      onRefreshShipments();
      setOrderSuccessModalOpen(true);
    }""")

# Update handleCountryBuySubmit
content = content.replace("""    if (success) {
      setActiveTab('MY_SHIPMENTS');
      onRefreshShipments();
    }""", """    if (success) {
      setActiveTab('MY_SHIPMENTS');
      onRefreshShipments();
      setOrderSuccessModalOpen(true);
    }""")

# Add Modal at the end
modal_code = """
      {/* Order Success Confirmation & AWB Generation */}
      {orderSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-brand-500/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-emerald-500"></div>
            <div className="w-20 h-20 bg-brand-500/20 text-brand-400 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-brand-500/10">
              <FileCheck className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">
              {isAr ? 'تم تأكيد طلبك بنجاح!' : 'Order Confirmed Successfully!'}
            </h2>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">
              {isAr 
                ? 'لقد تم تسجيل شحنتك وإصدار بوليصة الشحن المبدئية (AWB). يمكنك متابعة التحديثات من لوحة التحكم.' 
                : 'Your shipment has been recorded and an initial Air Waybill (AWB) has been generated. Track updates from your dashboard.'}
            </p>
            
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-8">
              <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">{isAr ? 'رقم التتبع' : 'Tracking Number'}</div>
              <div className="text-xl font-mono font-black text-brand-300">
                TH-AWB-{Math.floor(100000 + Math.random() * 900000)}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setOrderSuccessModalOpen(false)}
                className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-colors"
              >
                {isAr ? 'المتابعة للطلبات' : 'Go to Orders'}
              </button>
            </div>
          </div>
        </div>
      )}
"""

content = content.replace("    </div>\n  );\n};", modal_code + "    </div>\n  );\n};")

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
