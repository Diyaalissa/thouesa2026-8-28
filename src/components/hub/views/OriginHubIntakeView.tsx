import React, { useState } from 'react';
import {
  PackagePlus,
  Search,
  Scan,
  CheckCircle2,
  AlertCircle,
  User,
  Phone,
  MapPin,
  Tag,
  ArrowRight,
  ArrowLeft,
  Barcode,
  Clock,
  Filter,
} from 'lucide-react';
import { Hub, Locale, Shipment, EmployeeNavSection } from '../../../types';
import { StatusBadge } from '../../common/StatusBadge';
import { QRScannerModal } from '../../common/QRScannerModal';

interface OriginHubIntakeViewProps {
  currentHub: Hub;
  shipments: Shipment[];
  locale: Locale;
  onReceivePackage: (shipmentId: string, notes?: string) => Promise<boolean>;
  onNavigate: (section: EmployeeNavSection) => void;
  onRefreshData: () => void;
}

export const OriginHubIntakeView: React.FC<OriginHubIntakeViewProps> = ({
  currentHub,
  shipments,
  locale,
  onReceivePackage,
  onNavigate,
  onRefreshData,
}) => {
  const isAr = locale === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'PENDING' | 'ALL'>('PENDING');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [deskNotes, setDeskNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Filter for origin hub parcels
  const originParcels = shipments.filter(
    (s) => s.originHubId === currentHub.id || !s.originHubId
  );

  const pendingDropoffParcels = originParcels.filter(
    (s) =>
      s.currentStatus === 'PENDING_DROPOFF' ||
      s.currentStatus === 'PENDING' ||
      s.currentStatus === 'PENDING_HUB_DROPOFF'
  );

  const displayedParcels = (filterType === 'PENDING' ? pendingDropoffParcels : originParcels).filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.trackingNumber.toLowerCase().includes(q) ||
      s.senderName.toLowerCase().includes(q) ||
      s.senderPhone.toLowerCase().includes(q) ||
      s.itemDescription.toLowerCase().includes(q)
    );
  });

  const handleScanResult = (decodedText: string) => {
    setScannerOpen(false);
    const matched = originParcels.find(
      (s) =>
        s.trackingNumber.toLowerCase() === decodedText.toLowerCase() ||
        s.id.toLowerCase() === decodedText.toLowerCase()
    );
    if (matched) {
      setSelectedShipment(matched);
      setSearchQuery(matched.trackingNumber);
    } else {
      setSearchQuery(decodedText);
    }
  };

  const handleConfirmIntake = async () => {
    if (!selectedShipment) return;
    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const ok = await onReceivePackage(
        selectedShipment.id,
        deskNotes || (isAr ? `تم استلام الطرد في كاونتر فرع ${currentHub.nameAr}` : `Received at ${currentHub.nameEn} desk`)
      );

      if (ok) {
        setSuccessMessage(
          isAr
            ? `تم استلام الطرد [${selectedShipment.trackingNumber}] بنجاح، وتحويله لمحطة الفحص والوزن.`
            : `Shipment [${selectedShipment.trackingNumber}] intake confirmed. Queued for inspection.`
        );
        setSelectedShipment(null);
        setDeskNotes('');
        onRefreshData();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <PackagePlus className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-black text-slate-900">
              {isAr ? 'استقبال الطرود — كاونتر الفرع' : 'Origin Hub Intake Counter'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'استلام الطرود من العملاء الحاضرين في الفرع، مطابقة هوية المرسل، وتسجيل الدخول الأولي للنظام.'
              : 'Physical intake of sender parcels at origin hub desk, sender ID confirmation & entry log.'}
          </p>
        </div>

        {/* Action Button: Barcode Scanner */}
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
        >
          <Scan className="w-4 h-4 text-amber-400" />
          <span>{isAr ? 'مسح باركود الطرد / البوليصة' : 'Scan Waybill Barcode'}</span>
        </button>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('INSPECTION_WEIGHT')}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors cursor-pointer text-xs shrink-0"
          >
            {isAr ? 'الانتقال لمحطة الفحص' : 'Go to Inspection Station'}
          </button>
        </div>
      )}

      {/* Main Grid: Left List + Right Intake Action Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Search, Filter & Parcel Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFilterType('PENDING')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    filterType === 'PENDING' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isAr ? 'بانتظار وصول العميل' : 'Awaiting Drop-off'} ({pendingDropoffParcels.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    filterType === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isAr ? 'جميع طرود الفرع' : 'All Origin Parcels'} ({originParcels.length})
                </button>
              </div>

              {/* Search Input */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'رقم التتبع، اسم المرسل، هاتف...' : 'Tracking #, sender, phone...'}
                  className="w-full ps-9 pe-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            {/* Parcel List */}
            {displayedParcels.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100">
                <PackagePlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <div className="text-xs font-bold text-slate-700">
                  {isAr ? 'لا توجد شحنات مطابقة للبحث' : 'No matching shipments found'}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {displayedParcels.map((shipment) => {
                  const isSelected = selectedShipment?.id === shipment.id;
                  const isReadyForIntake =
                    shipment.currentStatus === 'PENDING_DROPOFF' ||
                    shipment.currentStatus === 'PENDING' ||
                    shipment.currentStatus === 'PENDING_HUB_DROPOFF';

                  return (
                    <div
                      key={shipment.id}
                      onClick={() => setSelectedShipment(shipment)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-amber-700">
                              {shipment.trackingNumber}
                            </span>
                            <StatusBadge status={shipment.currentStatus} locale={locale} size="sm" />
                          </div>
                          <div className="text-xs font-bold text-slate-900 mt-1">{shipment.itemDescription}</div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                            <span>{isAr ? 'المرسل:' : 'Sender:'} <strong className="text-slate-700">{shipment.senderName}</strong></span>
                            <span>•</span>
                            <span>{shipment.senderPhone}</span>
                            <span>•</span>
                            <span>{shipment.estimatedWeightKg} {isAr ? 'كغم تقديري' : 'kg est.'}</span>
                          </div>
                        </div>

                        <div className="text-end shrink-0">
                          <div className="text-xs font-black text-slate-900">
                            {shipment.shippingCost} {shipment.currency}
                          </div>
                          {isReadyForIntake ? (
                            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                              {isAr ? 'جاهز للاستلام' : 'Ready for Intake'}
                            </span>
                          ) : (
                            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              {isAr ? 'تم استلامه سابقاً' : 'Already Received'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Counter Intake Action Form & Verification Panel (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs sticky top-20 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <PackagePlus className="w-4 h-4 text-amber-600" />
              <span>{isAr ? 'إجراءات استلام الكاونتر' : 'Counter Intake Verification'}</span>
            </h2>

            {!selectedShipment ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-slate-400">
                <Barcode className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <div className="text-xs font-bold text-slate-600">
                  {isAr ? 'اختر شحنة من القائمة أو امسح الباركود' : 'Select a parcel or scan waybill'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isAr ? 'لتأكيد استلام الطرد من العميل في الفرع' : 'To record physical arrival at counter'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selected Parcel Summary Card */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">{isAr ? 'رقم التتبع:' : 'Tracking:'}</span>
                    <span className="font-mono font-black text-slate-900">{selectedShipment.trackingNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">{isAr ? 'المرسل المسجل:' : 'Sender Name:'}</span>
                    <span className="font-bold text-slate-900">{selectedShipment.senderName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">{isAr ? 'هاتف المرسل:' : 'Sender Phone:'}</span>
                    <span className="font-mono text-slate-700">{selectedShipment.senderPhone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">{isAr ? 'المستلم والوجهة:' : 'Recipient:'}</span>
                    <span className="font-medium text-slate-700">{selectedShipment.recipientName} ({selectedShipment.recipientAddress})</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                    <span className="text-slate-500">{isAr ? 'الوزن المعلن من العميل:' : 'Declared Weight:'}</span>
                    <span className="font-bold text-amber-700">{selectedShipment.estimatedWeightKg} كغم</span>
                  </div>
                </div>

                {/* Desk Verification Checklist */}
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-700" />
                    <span>{isAr ? 'شروط الاستلام في الكاونتر:' : 'Counter Acceptance Checks:'}</span>
                  </div>
                  <ul className="text-[11px] text-amber-800 space-y-1 ps-4 list-disc">
                    <li>{isAr ? 'التحقق من هوية الشخص الحاضر ومطابقتها للمرسل أو وكيله' : 'Verify physical ID of sender'}</li>
                    <li>{isAr ? 'التأكد من سلامة الصندوق الخارجية وعدم وجود تسريب' : 'External packaging intact with no leaks'}</li>
                    <li>{isAr ? 'توجيه الطرد مباشرة لمحطة الفحص والوزن بعد الاستلام' : 'Transfer immediately to inspection scale'}</li>
                  </ul>
                </div>

                {/* Reception Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'ملاحظات كاونتر الاستلام (اختياري):' : 'Counter Intake Notes (Optional):'}
                  </label>
                  <textarea
                    rows={2}
                    value={deskNotes}
                    onChange={(e) => setDeskNotes(e.target.value)}
                    placeholder={isAr ? 'مثال: تم الاستلام من العميل شخصياً، الطرد مغلف بكرتون...' : 'e.g. Sender delivered in person, secure carton...'}
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                {/* Submit Reception Button */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmIntake}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? (isAr ? 'جارِ توثيق الاستلام...' : 'Recording Intake...')
                      : (isAr ? 'تأكيد استلام الطرد بالكاونتر (RECEIVED)' : 'Confirm Desk Intake (RECEIVED)')}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR & Barcode Scanner Modal */}
      {scannerOpen && (
        <QRScannerModal
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScanSuccess={handleScanResult}
          locale={locale}
          title={isAr ? 'مسح باركود الشحنة أو بوليصة الشحن' : 'Scan Shipment Waybill Barcode'}
        />
      )}
    </div>
  );
};
