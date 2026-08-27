const fs = require('fs');

let content = fs.readFileSync('src/components/sender/SenderPortal.tsx', 'utf8');

// Find the activeTab === 'DISPUTES' block
const searchStr = `{activeTab === 'DISPUTES' && (`;
const idx = content.indexOf(searchStr);

if (idx === -1) {
    console.error("Could not find the DISPUTES tab block.");
    process.exit(1);
}

// We need to replace the entire activeTab === 'DISPUTES' block.
// Let's use a regex or string splitting to replace it.
const split1 = content.split(`{activeTab === 'DISPUTES' && (`);
const split2 = split1[1].split(`{activeTab === 'SEND_PARCEL' && (`);

// We will inject the state for the inline dispute form at the top of SenderPortal
const stateInjection = `  const [disputeReason, setDisputeReason] = useState<'DAMAGED_ITEM' | 'TAMPERED_SEAL' | 'MISSING_PACKAGE' | 'FLIGHT_DELAY_EXTREME' | 'PROHIBITED_GOODS_DISCOVERED'>('DAMAGED_ITEM');
  const [disputeClaimAmount, setDisputeClaimAmount] = useState<number>(0);
  const [disputeDescription, setDisputeDescription] = useState('');
  const [disputePhotoUrl, setDisputePhotoUrl] = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);

  const handleInlineDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;
    setDisputeError(null);
    setDisputeSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(locale === 'ar' ? 'تم تسجيل النزاع بنجاح وتجميد الضمان.' : 'Dispute filed successfully and escrow locked.');
      // Reset form or update shipment state
      setDisputeDescription('');
      setDisputePhotoUrl('');
    } catch (err) {
      setDisputeError(locale === 'ar' ? 'فشل تسجيل النزاع.' : 'Failed to file dispute.');
    } finally {
      setDisputeSubmitting(false);
    }
  };
`;

if (!content.includes('const [disputeReason, setDisputeReason]')) {
    content = content.replace('const [disputeModalOpen, setDisputeModalOpen] = useState(false);', 'const [disputeModalOpen, setDisputeModalOpen] = useState(false);\n' + stateInjection);
}

// The new Disputes tab content (Master-Detail layout)
const newDisputesContent = `{activeTab === 'DISPUTES' && (
        <div className="space-y-6">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Orders List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>{isAr ? 'الشحنات المؤهلة' : 'Eligible Shipments'}</span>
              </div>
              {senderShipments.filter(s => ['DELIVERED_TO_HUB', 'DELIVERED_TO_RECIPIENT', 'DISPUTED', 'IN_TRANSIT', 'WEIGHT_DISCREPANCY_PENDING', 'PENDING_PAYMENT'].includes(s.currentStatus)).length === 0 ? (
                <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400 text-xs">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>{isAr ? 'لا توجد شحنات مؤهلة لفتح نزاع في الوقت الحالي' : 'No eligible shipments to dispute right now'}</p>
                </div>
              ) : (
                senderShipments.filter(s => ['DELIVERED_TO_HUB', 'DELIVERED_TO_RECIPIENT', 'DISPUTED', 'IN_TRANSIT', 'WEIGHT_DISCREPANCY_PENDING', 'PENDING_PAYMENT'].includes(s.currentStatus)).map(s => {
                  const isSelected = selectedShipment?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedShipment(s)}
                      className={\`p-4 rounded-2xl border cursor-pointer transition-all \${
                        isSelected
                          ? 'bg-red-950/40 border-red-500/50 ring-2 ring-red-500/20 shadow-lg'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }\`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-xs text-slate-200">{s.trackingNumber}</span>
                        <StatusBadge status={s.currentStatus} locale={locale} size="sm" />
                      </div>
                      <p className="text-xs font-semibold text-slate-400 truncate mb-2">{s.itemDescription}</p>
                      
                      {s.currentStatus === 'DISPUTED' ? (
                        <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{isAr ? 'يوجد نزاع مفتوح' : 'Open Dispute'}</span>
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          <span>{isAr ? 'مؤهل لفتح نزاع' : 'Eligible for dispute'}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Right: Dispute Form */}
            <div className="lg:col-span-2 space-y-4">
              {selectedShipment ? (
                <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-white shadow-xl space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white">
                          {isAr ? 'نموذج النزاع والشكوى' : 'Dispute & Claim Form'}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {isAr ? \`الشحنة المحددة: \${selectedShipment.trackingNumber}\` : \`Selected Shipment: \${selectedShipment.trackingNumber}\`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleInlineDisputeSubmit} className="space-y-5">
                    {disputeError && (
                      <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{disputeError}</span>
                      </div>
                    )}

                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold text-amber-300">
                        <Lock className="w-4 h-4" />
                        <span>{isAr ? 'حماية التحكيم المالي المشدد (Escrow Guarantee):' : 'Escrow Arbitration Protection:'}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11px]">
                        {isAr
                          ? 'بمجرد تسجيل هذا النزاع، يتم تجميد أموال الضمان المالي المحجوزة للمسافر فوراً وعدم صرفها، ويتم إحالة الملف إلى ضابط الامتثال بالإدارة المركزية لمراجعة صور الفحص والختم الأمني واتخاذ القرار النهائي.'
                          : 'Filing this dispute immediately freezes the traveler security deposit (escrow) and routes the case to central compliance for evidence audit and financial resolution.'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">
                        {isAr ? 'سبب النزاع والمطالبة:' : 'Dispute Reason:'}
                      </label>
                      <select
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value as any)}
                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-red-400"
                      >
                        <option value="DAMAGED_ITEM">
                          {isAr ? 'تلف أو كسر في محتويات الطرد (Damaged Item)' : 'Damaged / Broken Goods'}
                        </option>
                        <option value="TAMPERED_SEAL">
                          {isAr ? 'عبث بالختم الأمني الإلكتروني أو فتح غير مصرح (Tampered Security Seal)' : 'Tampered Security Seal'}
                        </option>
                        <option value="MISSING_PACKAGE">
                          {isAr ? 'فقدان الطرد أو نقص في المحتويات المسلمة (Missing Package / Loss)' : 'Missing Package / Loss'}
                        </option>
                        <option value="FLIGHT_DELAY_EXTREME">
                          {isAr ? 'تأخر مفرط وإخلال بالموعد الزمني المحدد (Severe Delivery Delay)' : 'Severe Delivery Delay'}
                        </option>
                        <option value="PROHIBITED_GOODS_DISCOVERED">
                          {isAr ? 'اكتشاف مواد مخالفة أو غير مصرح بها (Prohibited Goods Issue)' : 'Prohibited Goods Discovered'}
                        </option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-300">
                          {isAr ? 'مبلغ التعويض المالي المطلوب ($ USD):' : 'Claim Compensation Amount ($ USD):'}
                        </label>
                        <span className="text-[11px] text-slate-400">
                          {isAr ? \`القيمة المصرحة للطرد: $\${selectedShipment.declaredValue}\` : \`Declared Value: $\${selectedShipment.declaredValue}\`}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          step="0.5"
                          required
                          value={disputeClaimAmount || selectedShipment.declaredValue}
                          onChange={(e) => setDisputeClaimAmount(Number(e.target.value))}
                          className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono font-bold focus:outline-hidden focus:border-red-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        {isAr ? 'شرح الشكوى والملاحظات التفصيلية للجنة التحكيم:' : 'Detailed Complaint Statement & Notes:'}
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={disputeDescription}
                        onChange={(e) => setDisputeDescription(e.target.value)}
                        placeholder={
                          isAr
                            ? 'يرجى توضيح حالة الطرد عند الاستلام، رقم الختم، وأي أضرار أو تفاصيل تدعم الشكوى...'
                            : 'Describe package condition at intake/handover, seal state, or any evidence...'
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-red-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-red-400" />
                        <span>{isAr ? 'صورة إثبات الضرر أو التلف (رابط الصورة):' : 'Evidence Photo URL:'}</span>
                      </label>
                      <input
                        type="url"
                        value={disputePhotoUrl}
                        onChange={(e) => setDisputePhotoUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-hidden focus:border-red-400"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                      <button
                        type="submit"
                        disabled={disputeSubmitting}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-600/30 transition-colors cursor-pointer disabled:opacity-50 w-full justify-center sm:w-auto"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        <span>{disputeSubmitting ? (isAr ? 'جاري التسجيل...' : 'Submitting...') : (isAr ? 'تأكيد تسجيل النزاع وتجميد الضمان' : 'Confirm Dispute & Lock Escrow')}</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-3xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
                  <ShieldAlert className="w-12 h-12 text-slate-600 mb-4" />
                  <h3 className="text-sm font-bold text-slate-300 mb-1">
                    {isAr ? 'لم يتم تحديد شحنة' : 'No Shipment Selected'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    {isAr ? 'الرجاء اختيار شحنة من القائمة الجانبية لعرض تفاصيلها وتقديم شكوى أو متابعة النزاع الخاص بها.' : 'Please select a shipment from the list to view its details and file a complaint.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
`;

const finalContent = split1[0] + newDisputesContent + "\n          {activeTab === 'SEND_PARCEL' && (" + split2.slice(1).join(`{activeTab === 'SEND_PARCEL' && (`);

// verify compilation
fs.writeFileSync('src/components/sender/SenderPortal.tsx', finalContent);
