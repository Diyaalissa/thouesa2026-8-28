import React, { useState } from 'react';
import {
  UserCheck,
  Search,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Lock,
  Printer,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Hub, Locale, Shipment, EmployeeNavSection } from '../../../types';
import { StatusBadge } from '../../common/StatusBadge';

interface FinalDeliveryViewProps {
  currentHub: Hub;
  shipments: Shipment[];
  locale: Locale;
  onDeliverToRecipient: (payload: any) => Promise<boolean>;
  onNavigate: (section: EmployeeNavSection) => void;
  onRefreshData: () => void;
}

export const FinalDeliveryView: React.FC<FinalDeliveryViewProps> = ({
  currentHub,
  shipments,
  locale,
  onDeliverToRecipient,
  onNavigate,
  onRefreshData,
}) => {
  const isAr = locale === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [nationalIdCheck, setNationalIdCheck] = useState('');
  const [otpCode, setOtpCode] = useState('9842');
  const [isDelivering, setIsDelivering] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState<{
    success: boolean;
    trackingNumber: string;
    recipientName: string;
    timestamp: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Parcels ready for pickup or delivered at this hub
  const destParcels = shipments.filter(
    (s) =>
      s.destinationHubId === currentHub.id &&
      (s.currentStatus === 'READY_FOR_PICKUP' ||
        s.currentStatus === 'DELIVERED' ||
        s.currentStatus === 'COMPLETED')
  );

  const readyForPickupParcels = destParcels.filter(
    (s) => s.currentStatus === 'READY_FOR_PICKUP'
  );

  const filtered = (readyForPickupParcels.length > 0 ? readyForPickupParcels : destParcels).filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.trackingNumber.toLowerCase().includes(q) ||
      s.recipientName.toLowerCase().includes(q) ||
      s.recipientPhone.toLowerCase().includes(q)
    );
  });

  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;

    if (otpCode.length < 4) {
      setErrorMsg(isAr ? 'يرجى إدخال رمز التحقق OTP الصحيح' : 'Please enter valid OTP');
      return;
    }

    setIsDelivering(true);
    setErrorMsg('');

    try {
      const ok = await onDeliverToRecipient({
        shipmentId: selectedShipment.id,
        recipientNationalId: nationalIdCheck || 'ID-VERIFIED-COUNTER',
        otpCode,
        deliveredByHubId: currentHub.id,
        deliveredAt: new Date().toISOString(),
      });

      if (ok) {
        setDeliveryResult({
          success: true,
          trackingNumber: selectedShipment.trackingNumber,
          recipientName: selectedShipment.recipientName,
          timestamp: new Date().toLocaleTimeString(),
        });
        setSelectedShipment(null);
        setOtpCode('');
        setNationalIdCheck('');
        onRefreshData();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete delivery');
    } finally {
      setIsDelivering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-black text-slate-900">
              {isAr ? 'كاونتر التسليم النهائي للمستلم (OTP Delivery)' : 'Final Recipient Counter Delivery'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'التحقق من الهوية الوطنية للمستلم، مطابقة رمز التحقق الرقمي OTP السري، وتسليم الطرد وإغلاق الشحنة.'
              : 'Verify recipient national ID, confirm OTP secret code, hand over package, and close order.'}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 text-xs font-bold text-purple-900">
          <span>{isAr ? 'جاهزة للاستلام:' : 'Ready for Pickup:'}</span>
          <span className="font-black text-sm">{readyForPickupParcels.length}</span>
        </div>
      </div>

      {/* Success Receipt Banner */}
      {deliveryResult && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 text-xs text-emerald-950 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>
                {isAr
                  ? `تم تسليم الطرد [${deliveryResult.trackingNumber}] للمستلم (${deliveryResult.recipientName}) بنجاح!`
                  : `Package [${deliveryResult.trackingNumber}] delivered to (${deliveryResult.recipientName})!`}
              </span>
            </div>
            <span className="font-mono text-[11px] text-emerald-700">{deliveryResult.timestamp}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isAr ? 'طباعة إشعار وسند الاستلام' : 'Print Handover Receipt'}</span>
            </button>
            <button
              type="button"
              onClick={() => setDeliveryResult(null)}
              className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg font-bold hover:bg-emerald-100/50 cursor-pointer"
            >
              {isAr ? 'إغلاق الإشعار' : 'Dismiss'}
            </button>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                {isAr ? 'الطرود الجاهزة للتسليم بالكاونتر' : 'Ready Parcels'} ({filtered.length})
              </span>
              <div className="relative max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'رقم التتبع أو اسم المستلم...' : 'Tracking # or recipient...'}
                  className="w-full ps-8 pe-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <div className="font-bold text-slate-700">
                  {isAr ? 'لا توجد طرود جاهزة للتسليم حالياً' : 'No parcels ready for counter delivery'}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((s) => {
                  const isSelected = selectedShipment?.id === s.id;
                  const isDelivered = s.currentStatus === 'DELIVERED' || s.currentStatus === 'COMPLETED';

                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedShipment(s)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-600/20 shadow-xs'
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
                            {isAr ? 'المستلم:' : 'Recipient:'} <strong className="text-slate-800">{s.recipientName}</strong> • {s.recipientPhone}
                          </div>
                        </div>

                        {isDelivered ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                            {isAr ? 'تم التسليم' : 'Delivered'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 shrink-0">
                            {isAr ? 'بانتظار العميل' : 'Awaiting OTP'}
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

        {/* Right OTP Verification Drawer (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-purple-600" />
              <span>{isAr ? 'التحقق من المستلم ورمز OTP' : 'Recipient OTP Verification'}</span>
            </h2>

            {!selectedShipment ? (
              <div className="p-12 text-center bg-slate-50 rounded-xl border border-slate-100 text-slate-400 text-xs">
                <Lock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <div className="font-bold text-slate-600">
                  {isAr ? 'اختر طرداً لتسليمه للعميل' : 'Select a parcel to deliver'}
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmDelivery} className="space-y-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isAr ? 'رقم التتبع:' : 'Tracking:'}</span>
                    <strong className="font-mono text-slate-900">{selectedShipment.trackingNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isAr ? 'اسم المستلم المصرح:' : 'Recipient:'}</span>
                    <strong className="text-slate-900">{selectedShipment.recipientName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isAr ? 'هاتف المستلم:' : 'Phone:'}</span>
                    <span className="font-mono text-slate-700">{selectedShipment.recipientPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isAr ? 'الختم الأمني:' : 'Seal ID:'}</span>
                    <span className="font-mono font-bold text-teal-700">{selectedShipment.securitySealId}</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    {isAr ? 'رقم الهوية الوطنية / جواز السفر للمستلم:' : 'Recipient National ID / Passport:'}
                  </label>
                  <input
                    type="text"
                    required
                    value={nationalIdCheck}
                    onChange={(e) => setNationalIdCheck(e.target.value)}
                    placeholder={isAr ? 'مثال: 9942018821' : 'e.g. 9942018821'}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>{isAr ? 'رمز التحقق السري (6-digit OTP):' : 'Delivery Secret OTP:'}</span>
                    <span className="text-[10px] text-purple-700 font-bold">
                      {isAr ? 'رمز الاختبار الافتراضي: 9842' : 'Demo OTP: 9842'}
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="••••••"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-black font-mono text-center text-lg tracking-widest text-slate-900"
                  />
                </div>

                {errorMsg && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-bold text-center">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isDelivering || !otpCode}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isDelivering
                      ? (isAr ? 'جارِ التحقق من الرمز...' : 'Verifying OTP...')
                      : (isAr ? 'تأكيد التسليم وإغلاق الشحنة (DELIVERED)' : 'Confirm Handover & Close Order')}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
