import React, { useState } from 'react';
import {
  Boxes,
  MapPin,
  CheckCircle2,
  Bell,
  Search,
  ArrowRight,
  Sparkles,
  Tag,
  UserCheck,
} from 'lucide-react';
import { Hub, Locale, Shipment, EmployeeNavSection } from '../../../types';
import { StatusBadge } from '../../common/StatusBadge';

interface PickupPreparationViewProps {
  currentHub: Hub;
  shipments: Shipment[];
  locale: Locale;
  onNavigate: (section: EmployeeNavSection) => void;
  onRefreshData: () => void;
}

export const PickupPreparationView: React.FC<PickupPreparationViewProps> = ({
  currentHub,
  shipments,
  locale,
  onNavigate,
  onRefreshData,
}) => {
  const isAr = locale === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [shelfLocation, setShelfLocation] = useState('RACK-A-04');
  const [isAllocating, setIsAllocating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Parcels that reached destination hub and need shelf assignment or customer notification
  const destParcels = shipments.filter(
    (s) =>
      s.destinationHubId === currentHub.id &&
      (s.currentStatus === 'RECEIVED_AT_DEST' ||
        s.currentStatus === 'RECEIVED_AT_DEST_HUB' ||
        s.currentStatus === 'READY_FOR_PICKUP')
  );

  const pendingShelf = destParcels.filter((s) => s.currentStatus !== 'READY_FOR_PICKUP');

  const filtered = (pendingShelf.length > 0 ? pendingShelf : destParcels).filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.trackingNumber.toLowerCase().includes(q) ||
      s.recipientName.toLowerCase().includes(q) ||
      s.recipientPhone.toLowerCase().includes(q)
    );
  });

  const handleConfirmReadyForPickup = async () => {
    if (!selectedShipment) return;
    setIsAllocating(true);
    setSuccessMessage('');

    try {
      selectedShipment.currentStatus = 'READY_FOR_PICKUP';
      setSuccessMessage(
        isAr
          ? `تم تخصيص الرف [${shelfLocation}] للشحنة [${selectedShipment.trackingNumber}]، وتوليد رمز OTP وإشعار المستلم (${selectedShipment.recipientName}) بنجاح!`
          : `Shelf [${shelfLocation}] allocated. Pickup OTP generated & customer notified!`
      );
      setSelectedShipment(null);
      onRefreshData();
    } finally {
      setIsAllocating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <Boxes className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-black text-slate-900">
              {isAr ? 'تجهيز وتصنيف الرفوف للاستلام' : 'Parcel Pickup Shelf Allocation'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'فرز الطرود الواصلة، تحديد أرقام الرفوف والممرات (Racks & Shelves)، وإرسال إشعار الجاهزية ورمز OTP للمستلم.'
              : 'Allocate shelf storage bins and trigger recipient ready-for-pickup notification with OTP.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('FINAL_DELIVERY')}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
        >
          <UserCheck className="w-4 h-4" />
          <span>{isAr ? 'كاونتر التسليم النهائي' : 'Go to Delivery Counter'}</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('FINAL_DELIVERY')}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs cursor-pointer"
          >
            {isAr ? 'كاونتر التسليم (OTP)' : 'Open Delivery Counter'}
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                {isAr ? 'الطرود الواصلة للفرع' : 'Arrived Parcels'} ({filtered.length})
              </span>
              <div className="relative max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'بحث برقم التتبع أو المستلم...' : 'Search parcel or recipient...'}
                  className="w-full ps-8 pe-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <Boxes className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <div className="font-bold text-slate-700">
                  {isAr ? 'لا توجد طرود بانتظار فرز الرفوف' : 'No parcels awaiting shelf allocation'}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((s) => {
                  const isSelected = selectedShipment?.id === s.id;
                  const isReady = s.currentStatus === 'READY_FOR_PICKUP';

                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedShipment(s)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50/50 ring-2 ring-purple-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-purple-900">
                              {s.trackingNumber}
                            </span>
                            <StatusBadge status={s.currentStatus} locale={locale} size="sm" />
                          </div>
                          <div className="text-xs font-bold text-slate-900 mt-1">{s.itemDescription}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {isAr ? 'المستلم:' : 'Recipient:'} <strong>{s.recipientName}</strong> • {s.recipientPhone}
                          </div>
                        </div>

                        {isReady ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            {isAr ? 'جاهز بالرف' : 'On Shelf'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                            {isAr ? 'بانتظار الرف' : 'Needs Shelf'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Allocation Drawer (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-600" />
              <span>{isAr ? 'تخصيص مكان التخزين والرف' : 'Shelf & Bin Assignment'}</span>
            </h2>

            {!selectedShipment ? (
              <div className="p-12 text-center bg-slate-50 rounded-xl border border-slate-100 text-slate-400 text-xs">
                <Boxes className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <div className="font-bold text-slate-600">
                  {isAr ? 'اختر شحنة لتحديد رقم الرف' : 'Select a parcel to assign shelf'}
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isAr ? 'رقم التتبع:' : 'Tracking:'}</span>
                    <strong className="font-mono text-slate-900">{selectedShipment.trackingNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isAr ? 'المستلم:' : 'Recipient:'}</span>
                    <strong className="text-slate-900">{selectedShipment.recipientName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isAr ? 'هاتف المستلم:' : 'Recipient Phone:'}</span>
                    <span className="font-mono text-slate-700">{selectedShipment.recipientPhone}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    {isAr ? 'اختر الرف أو الصندوق (Storage Bin / Shelf):' : 'Storage Shelf Code:'}
                  </label>
                  <select
                    value={shelfLocation}
                    onChange={(e) => setShelfLocation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
                  >
                    <option value="RACK-A-01">الرف A-01 (صناديق صغيرة)</option>
                    <option value="RACK-A-02">الرف A-02 (إلكترونيات)</option>
                    <option value="RACK-A-04">الرف A-04 (أدوية ووثائق)</option>
                    <option value="RACK-B-01">الرف B-01 (أمتعة متوسطة)</option>
                    <option value="RACK-B-05">الرف B-05 (طرود شخصية)</option>
                    <option value="ZONE-C-FLOOR">منطقة C (أحجام كبيرة)</option>
                  </select>
                </div>

                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-purple-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-purple-700" />
                    <span>{isAr ? 'إشعار فوري للعميل:' : 'Customer SMS & App Push:'}</span>
                  </div>
                  <p className="text-[11px]">
                    {isAr
                      ? 'عند تأكيد الحفظ، سيتم إرسال إشعار فوري للمستلم برقم الرف وموقع الفرع، وتوليد رمز التحقق OTP للتسليم.'
                      : 'Trigger SMS & app push with pickup PIN and hub opening hours.'}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isAllocating}
                  onClick={handleConfirmReadyForPickup}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isAllocating
                      ? (isAr ? 'جارِ تخصيص الرف...' : 'Saving...')
                      : (isAr ? 'تأكيد الحفظ بالرف وإشعار العميل (READY_FOR_PICKUP)' : 'Confirm Shelf & Notify Recipient')}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
