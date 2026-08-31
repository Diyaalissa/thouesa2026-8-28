import React, { useState, useEffect } from 'react';
import { Trip, Hub, Locale } from '../../types';
import { X, Plane, Edit3, AlertTriangle, Check, ShieldCheck, DollarSign, Calendar, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { HUBS_DATA, ROUTE_PRICING } from '../../lib/constants';
import { formatCurrency } from '../../lib/crypto';

interface EditTripModalProps {
  trip: Trip | null;
  activeHubs: Hub[];
  locale: Locale;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditTripModal: React.FC<EditTripModalProps> = ({
  trip,
  activeHubs,
  locale,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const isAr = locale === 'ar';

  const [airline, setAirline] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [pnrCode, setPNRCode] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [availableWeightKg, setAvailableWeightKg] = useState(15);
  const [originHubId, setOriginHubId] = useState('');
  const [destHubId, setDestHubId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (trip) {
      setAirline(trip.airline || '');
      setFlightNumber(trip.flightNumber || '');
      setPNRCode(trip.pnrCode || '');
      setAvailableWeightKg(trip.availableWeightKg || 15);
      setOriginHubId(trip.originHubId || activeHubs[0]?.id || '');
      setDestHubId(trip.destinationHubId || activeHubs[1]?.id || '');

      if (trip.departureTime) {
        const d = new Date(trip.departureTime);
        if (!isNaN(d.getTime())) {
          setDepartureDate(d.toISOString().split('T')[0]);
          setDepartureTime(d.toTimeString().slice(0, 5));
        }
      }
      setErrorMsg(null);
    }
  }, [trip, activeHubs]);

  if (!isOpen || !trip) return null;

  const allocatedKg = trip.allocatedWeightKg || 0;
  const canEditHubs = allocatedKg === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let combinedDepTime = trip.departureTime;
      if (departureDate) {
        const timePart = departureTime || '12:00';
        combinedDepTime = new Date(`${departureDate}T${timePart}:00`).toISOString();
      }

      const res = await fetch(`/api/trips/${trip.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          airline,
          flightNumber,
          pnrCode,
          availableWeightKg,
          departureTime: combinedDepTime,
          originHubId: canEditHubs ? originHubId : undefined,
          destinationHubId: canEditHubs ? destHubId : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل تحديث بيانات الرحلة');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء تعديل بيانات الرحلة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {isAr ? 'تعديل بيانات وسعة رحلة الطيران' : 'Edit Flight & Luggage Details'}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {trip.flightNumber} • PNR: {trip.pnrCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Hubs (Only if 0 allocated) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700">
                {isAr ? 'مركز المغادرة (Origin Hub)' : 'Origin Hub'}
              </label>
              <select
                disabled={!canEditHubs}
                value={originHubId}
                onChange={(e) => setOriginHubId(e.target.value)}
                className={`w-full p-2.5 rounded-xl border ${
                  canEditHubs ? 'bg-slate-50 border-slate-200' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {activeHubs.map((h) => (
                  <option key={h.id} value={h.id}>
                    {isAr ? h.nameAr : h.nameEn} ({h.code})
                  </option>
                ))}
              </select>
              {!canEditHubs && (
                <p className="text-[10px] text-amber-600 mt-1">
                  {isAr ? 'لا يمكن تغيير المركز لوجود طرود مسندة للرحلة.' : 'Hub locked because parcels are assigned.'}
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700">
                {isAr ? 'مركز وجهة الوصول (Destination Hub)' : 'Destination Hub'}
              </label>
              <select
                disabled={!canEditHubs}
                value={destHubId}
                onChange={(e) => setDestHubId(e.target.value)}
                className={`w-full p-2.5 rounded-xl border ${
                  canEditHubs ? 'bg-slate-50 border-slate-200' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {activeHubs.map((h) => (
                  <option key={h.id} value={h.id}>
                    {isAr ? h.nameAr : h.nameEn} ({h.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Airline, Flight & PNR */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700">{isAr ? 'شركة الطيران' : 'Airline'}</label>
              <input
                type="text"
                required
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700">{isAr ? 'رقم الرحلة' : 'Flight Number'}</label>
              <input
                type="text"
                required
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700">{isAr ? 'رمز الحجز (PNR)' : 'PNR Code'}</label>
              <input
                type="text"
                required
                value={pnrCode}
                onChange={(e) => setPNRCode(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase font-bold text-brand-600"
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAr ? 'تاريخ الإقلاع المحدث' : 'Departure Date'}</span>
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAr ? 'وقت الإقلاع التقديري' : 'Departure Time'}</span>
              </label>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>

          {/* Available Luggage Weight */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-800">
                {isAr ? 'سعة الوزن المتاحة للأمتعة (كغم)' : 'Available Luggage Weight (kg)'}
              </label>
              <div className="flex items-center gap-2">
                {allocatedKg > 0 && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-semibold">
                    {isAr ? `محجوز منها: ${allocatedKg} كغ` : `Allocated: ${allocatedKg} kg`}
                  </span>
                )}
                <span className="font-bold text-teal-600 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-lg text-xs">
                  {availableWeightKg} كغم
                </span>
              </div>
            </div>
            <input
              type="range"
              min={Math.max(2, allocatedKg)}
              max="40"
              step="1"
              value={availableWeightKg}
              onChange={(e) => setAvailableWeightKg(Number(e.target.value))}
              className="w-full accent-teal-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>{Math.max(2, allocatedKg)} كغم (الحد الأدنى)</span>
              <span>40 كغم (الحد الأقصى)</span>
            </div>
          </div>

          {/* Earnings Estimation */}
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 flex items-center justify-between">
            <span className="font-medium text-xs">
              {isAr ? 'الأرباح التقديرية المحدثة للرحلة:' : 'Updated Estimated Earnings:'}
            </span>
            <span className="font-black text-sm text-teal-700">
              ${(availableWeightKg * (trip.pricePerKgEarned || 12.0)).toFixed(2)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-teal-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? (isAr ? 'جارِ الحفظ...' : 'Saving...') : isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CancelTripModalProps {
  trip: Trip | null;
  locale: Locale;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CancelTripModal: React.FC<CancelTripModalProps> = ({
  trip,
  locale,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const isAr = locale === 'ar';
  const [reason, setReason] = useState('تغيير في موعد أو خطة السفر الشخصية');
  const [customNotes, setCustomNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !trip) return null;

  const isEscrowLocked = trip.isEscrowPaid && (trip.requiredEscrowDeposit || 0) > 0;

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const fullReason = customNotes ? `${reason} - ${customNotes}` : reason;

    try {
      const res = await fetch(`/api/trips/${trip.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: fullReason }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل إلغاء الرحلة');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إلغاء الرحلة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-rose-100 bg-rose-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {isAr ? 'تأكيد إلغاء رحلة الطيران' : 'Confirm Trip Cancellation'}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {trip.flightNumber} • PNR: {trip.pnrCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleCancelSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Refund Notice */}
          {isEscrowLocked ? (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1 text-emerald-950">
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'فك حجز الضمان واسترداد كامل الرصيد فوراً' : '100% Escrow Deposit Refund'}</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                {isAr
                  ? `مبلغ التأمين المحجوز ($${trip.requiredEscrowDeposit}) سيعاد فورياً وبالكامل إلى رصيد محفظتك المتاح بدون أي اقتطاع أو غرامة.`
                  : `Your locked escrow hold of $${trip.requiredEscrowDeposit} will be instantly refunded to your available wallet balance with zero penalty.`}
              </p>
            </div>
          ) : (
            <p className="text-slate-600 text-xs">
              {isAr
                ? 'عند إلغاء الرحلة سيتم حذف تخصيص سعة الأمتعة وإعادة أي طرود مسندة إلى طابور فرع المغادرة للرحلات القادمة.'
                : 'Cancelling will free up your luggage capacity and return any assigned parcels to the hub queue.'}
            </p>
          )}

          {/* Reason selection */}
          <div className="space-y-2">
            <label className="block font-semibold text-slate-700">
              {isAr ? 'سبب إلغاء الرحلة:' : 'Reason for Cancellation:'}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
            >
              <option value="تغيير في موعد أو خطة السفر الشخصية">
                {isAr ? 'تغيير في موعد أو خطة السفر الشخصية' : 'Personal travel plan changes'}
              </option>
              <option value="إلغاء أو تأجيل الرحلة من قبل شركة الطيران">
                {isAr ? 'إلغاء أو تأجيل الرحلة من قبل شركة الطيران' : 'Flight cancelled/rescheduled by airline'}
              </option>
              <option value="ظروف طارئة أو أسباب صحية">
                {isAr ? 'ظروف طارئة أو أسباب صحية' : 'Emergency or medical reasons'}
              </option>
              <option value="تعديل في وزن الأمتعة المسافرة">
                {isAr ? 'تعديل في وزن الأمتعة المسافرة' : 'Luggage weight modifications'}
              </option>
              <option value="أخرى">{isAr ? 'أخرى (يرجى التحديد)' : 'Other reason'}</option>
            </select>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block font-semibold mb-1 text-slate-700">
              {isAr ? 'ملاحظات إضافية (اختياري):' : 'Additional Notes (Optional):'}
            </label>
            <textarea
              rows={2}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder={isAr ? 'اكتب تفاصيل إضافية إن وجدت...' : 'Any details...'}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
            >
              {isAr ? 'تراجع' : 'Keep Trip'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{isSubmitting ? (isAr ? 'جارِ الإلغاء...' : 'Cancelling...') : isAr ? 'تأكيد إلغاء الرحلة' : 'Confirm Cancel'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


interface EmergencyCancelTripModalProps {
  trip: Trip | null;
  locale: Locale;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EmergencyCancelTripModal: React.FC<EmergencyCancelTripModalProps> = ({
  trip,
  locale,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const isAr = locale === 'ar';
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !trip) return null;

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 20) {
      setErrorMsg(isAr ? 'يرجى كتابة سبب واضح وتفصيلي (20 حرف على الأقل).' : 'Please provide a detailed reason (at least 20 characters).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Send emergency cancel request to admin
      const res = await fetch(`/api/trips/${trip.id}/emergency-cancel-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل تقديم الطلب');
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء تقديم الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-red-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-rose-900">
                {isAr ? 'طلب إلغاء طارئ للرحلة' : 'Emergency Cancellation Request'}
              </h3>
              <p className="text-[11px] text-rose-700 mt-0.5">
                {isAr ? 'الطرود تم ربطها بالفعل بهذه الرحلة' : 'Packages are already linked to this trip'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-rose-200 text-rose-500 hover:text-rose-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleCancelSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-amber-950">
            <h4 className="font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              {isAr ? 'تنبيه إداري هام' : 'Important Notice'}
            </h4>
            <p className="text-[11px] leading-relaxed text-amber-800">
              {isAr 
                ? 'لا يمكن إلغاء هذه الرحلة تلقائياً نظراً لارتباط طرود العملاء بها. طلب الإلغاء سيُرسل للإدارة للمراجعة والبت فيه. ستبقى الرحلة نشطة في حسابك حتى يتم توفير مسافر بديل ونقل الطرود إليه.' 
                : 'This trip cannot be auto-cancelled as packages are linked. This request will be sent to admins for review. The trip remains active in your account until a replacement traveler is found.'}
            </p>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700">
              {isAr ? 'سبب الإلغاء الطارئ والتفاصيل' : 'Emergency Reason & Details'} <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isAr ? 'يرجى كتابة سبب الإلغاء بالتفصيل ليتم تقييم طلبك من الإدارة...' : 'Please write your detailed emergency reason for admin review...'}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-rose-400 focus:ring-1 focus:ring-rose-400 outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              {isAr ? 'الحد الأدنى 20 حرفاً.' : 'Minimum 20 characters.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
            >
              {isAr ? 'تراجع' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{isSubmitting ? (isAr ? 'جارِ الإرسال...' : 'Submitting...') : isAr ? 'إرسال طلب للإدارة' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
