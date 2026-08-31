import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Plane, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ShieldCheck, 
  Scale, 
  Calendar, 
  Clock, 
  DollarSign, 
  Check, 
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { Hub, Locale, Trip } from '../../types';
import { ROUTE_PRICING } from '../../lib/constants';

interface NewTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  hubs: Hub[];
  currentUserId: string;
  currentUserName: string;
  currentUserPhone?: string;
  locale: Locale;
  onSuccess: (newTrip: Trip) => void;
}

export const NewTripModal: React.FC<NewTripModalProps> = ({
  isOpen,
  onClose,
  hubs,
  currentUserId,
  currentUserName,
  currentUserPhone,
  locale,
  onSuccess,
}) => {
  const isAr = locale === 'ar';

  const defaultOrigin = hubs.find(h => h.countryCode === 'JOR')?.id || hubs[0]?.id || '';
  const defaultDest = hubs.find(h => h.countryCode === 'DZA')?.id || hubs[1]?.id || '';

  const [originHubId, setOriginHubId] = useState<string>(defaultOrigin);
  const [destinationHubId, setDestinationHubId] = useState<string>(defaultDest);
  const [airline, setAirline] = useState('Royal Jordanian');
  const [flightNumber, setFlightNumber] = useState('RJ-511');
  const [pnrCode, setPnrCode] = useState('');
  
  // Set default departure to +3 days at 08:00 AM
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 3);
  const defaultDateStr = futureDate.toISOString().slice(0, 10);
  
  const [departureDate, setDepartureDate] = useState(defaultDateStr);
  const [departureTimeOnly, setDepartureTimeOnly] = useState('08:30');
  const [arrivalDate, setArrivalDate] = useState(defaultDateStr);
  const [arrivalTimeOnly, setArrivalTimeOnly] = useState('14:45');
  
  const [availableWeightKg, setAvailableWeightKg] = useState<number>(15);
  const [ticketFile, setTicketFile] = useState<{ name: string; size: number; url: string } | null>(null);
  const [commitmentAccepted, setCommitmentAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Selected Hub objects
  const originHub = hubs.find(h => h.id === originHubId);
  const destHub = hubs.find(h => h.id === destinationHubId);

  // Dynamic pricing calculation
  const route = ROUTE_PRICING.find(
    (r) => r.originCountry === originHub?.countryCode && r.destinationCountry === destHub?.countryCode
  ) || { travelerShareKg: 12.0 };

  const pricePerKg = route.travelerShareKg || 12.0;
  const estimatedEarnings = Number((availableWeightKg * pricePerKg).toFixed(2));
  const estimatedEscrow = Number((availableWeightKg * 35.0).toFixed(2));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate file reading / upload
      setTicketFile({
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
      });
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!originHubId || !destinationHubId) {
      setErrorMsg(isAr ? 'يرجى اختيار مركز المغادرة ومركز الوصول.' : 'Please select origin and destination hubs.');
      return;
    }

    if (originHubId === destinationHubId) {
      setErrorMsg(isAr ? 'لا يمكن أن يكون مركز الوصول هو نفسه مركز المغادرة.' : 'Destination hub cannot be the same as origin hub.');
      return;
    }

    if (!pnrCode || pnrCode.trim().length < 5) {
      setErrorMsg(isAr ? 'يرجى إدخال رمز حجز التذكرة (PNR Code) بشكل صحيح (5-6 خانات).' : 'Please provide a valid ticket PNR code (5-6 characters).');
      return;
    }

    if (!flightNumber.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال رقم الرحلة (Flight Number).' : 'Please enter flight number.');
      return;
    }

    if (!ticketFile) {
      setErrorMsg(isAr ? 'يرجى إرفاق إثبات حجز التذكرة (صورة أو ملف PDF) للتأكد من مصداقية الرحلة.' : 'Please upload flight ticket proof (image or PDF).');
      return;
    }

    if (!commitmentAccepted) {
      setErrorMsg(isAr ? 'يجب الموافقة على إقرار الالتزام بعدم التخلف عن السفر.' : 'You must accept the flight commitment agreement.');
      return;
    }

    setIsSubmitting(true);

    try {
      const depIso = `${departureDate}T${departureTimeOnly}:00.000Z`;
      const arrIso = `${arrivalDate}T${arrivalTimeOnly}:00.000Z`;

      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          travelerId: currentUserId,
          travelerName: currentUserName,
          travelerPhone: currentUserPhone,
          originHubId,
          destinationHubId,
          airline,
          flightNumber: flightNumber.toUpperCase(),
          pnrCode: pnrCode.toUpperCase(),
          departureTime: depIso,
          arrivalTime: arrIso,
          availableWeightKg,
          ticketDocUrl: ticketFile.name,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to register trip');
      }

      onSuccess(data.trip);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || (isAr ? 'حدث خطأ أثناء تسجيل الرحلة' : 'Error registering trip'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto" dir={isAr ? 'rtl' : 'ltr'}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Header with Boarding Style Gradient */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-5 end-5 w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-teal-500/20 border border-teal-500/40 rounded-xl flex items-center justify-center text-teal-300">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black">{isAr ? 'إضافة وجدولة رحلة طيران جديدة' : 'Register New Flight Trip'}</h2>
              <p className="text-xs text-teal-200/80">
                {isAr ? 'أعلن عن سعتك الشحنية المتاحة واكسب أرباحاً مضمونة مع THOUESA' : 'List your luggage capacity and earn guaranteed income with THOUESA'}
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white/10 rounded-2xl border border-white/10 flex items-center gap-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-slate-200">
              {isAr 
                ? 'السرية التامة: لا تظهر أي بيانات تخصك للعملاء. إدارتنا ومكاتبنا هي الجهة الوحيدة التي تتعامل معها.' 
                : 'Strict Anonymity: Your identity is never exposed to customers. You interact solely with our verified official hubs.'}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Route Section */}
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              {isAr ? '1. خط سير الرحلة (المراكز المعتمدة)' : '1. Flight Route & Verified Hubs'}
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Origin Hub */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  {isAr ? '📍 مركز المغادرة (الاستلام)' : '📍 Origin Hub (Pickup)'}
                </span>
                <select
                  value={originHubId}
                  onChange={(e) => setOriginHubId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-teal-500"
                >
                  {hubs.map((h) => (
                    <option key={h.id} value={h.id}>
                      {isAr ? `${h.nameAr} (${h.code})` : `${h.nameEn} (${h.code})`}
                    </option>
                  ))}
                </select>
                {originHub && (
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {isAr ? `المدينة: ${originHub.cityAr}` : `City: ${originHub.cityEn}`}
                  </span>
                )}
              </div>

              {/* Destination Hub */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  {isAr ? '📍 مركز الوصول (التسليم)' : '📍 Destination Hub (Drop-off)'}
                </span>
                <select
                  value={destinationHubId}
                  onChange={(e) => setDestinationHubId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-teal-500"
                >
                  {hubs.map((h) => (
                    <option key={h.id} value={h.id}>
                      {isAr ? `${h.nameAr} (${h.code})` : `${h.nameEn} (${h.code})`}
                    </option>
                  ))}
                </select>
                {destHub && (
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {isAr ? `المدينة: ${destHub.cityAr}` : `City: ${destHub.cityEn}`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Flight Details & PNR Verification */}
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              {isAr ? '2. بيانات الطيران ورمز الحجز (PNR)' : '2. Flight & Reservation Details'}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  {isAr ? 'شركة الطيران' : 'Airline'}
                </label>
                <select
                  value={airline}
                  onChange={(e) => setAirline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                >
                  <option value="Royal Jordanian">Royal Jordanian 🇯🇴</option>
                  <option value="Air Algerie">Air Algérie 🇩🇿</option>
                  <option value="Saudia">Saudia 🇸🇦</option>
                  <option value="EgyptAir">EgyptAir 🇪🇬</option>
                  <option value="Turkish Airlines">Turkish Airlines 🇹🇷</option>
                  <option value="Qatar Airways">Qatar Airways 🇶🇦</option>
                  <option value="Emirates">Emirates 🇦🇪</option>
                  <option value="Flydubai">Flydubai 🇦🇪</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  {isAr ? 'رقم الرحلة (Flight #)' : 'Flight Number'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. RJ-511"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold uppercase tracking-wider"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1 flex items-center justify-between">
                  <span>{isAr ? 'رمز الحجز (PNR)' : 'PNR Code'}</span>
                  <span className="text-[9px] text-amber-600 font-bold">{isAr ? 'إلزامي للتحقق' : 'Mandatory'}</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. PNR771X"
                  value={pnrCode}
                  onChange={(e) => setPnrCode(e.target.value)}
                  maxLength={8}
                  className="w-full bg-slate-50 border border-amber-300 rounded-xl p-2.5 text-xs font-mono font-bold uppercase tracking-widest text-slate-900 bg-amber-50/40"
                  required
                />
              </div>
            </div>

            {/* Dates and Times */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  {isAr ? 'موعد الإقلاع' : 'Departure Schedule'}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl p-2 text-xs font-medium"
                    required
                  />
                  <input
                    type="time"
                    value={departureTimeOnly}
                    onChange={(e) => setDepartureTimeOnly(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl p-2 text-xs font-medium"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  {isAr ? 'موعد الوصول المتوقع' : 'Expected Arrival Schedule'}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl p-2 text-xs font-medium"
                    required
                  />
                  <input
                    type="time"
                    value={arrivalTimeOnly}
                    onChange={(e) => setArrivalTimeOnly(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl p-2 text-xs font-medium"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Weight Capacity & Earnings Calculator */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                {isAr ? '3. السعة الشحنية المعروضة والأرباح التقديرية' : '3. Luggage Capacity & Estimated Earnings'}
              </label>
              <span className="text-xs font-black px-2.5 py-0.5 bg-teal-100 text-teal-800 rounded-full">
                {availableWeightKg} {isAr ? 'كغ' : 'kg'}
              </span>
            </div>

            <div className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl space-y-4">
              <div>
                <input
                  type="range"
                  min="2"
                  max="35"
                  step="1"
                  value={availableWeightKg}
                  onChange={(e) => setAvailableWeightKg(Number(e.target.value))}
                  className="w-full h-2 bg-teal-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-bold mt-1.5">
                  <span>2 {isAr ? 'كغ (الحد الأدنى)' : 'kg (Min)'}</span>
                  <span>15 {isAr ? 'كغ (شائع)' : 'kg (Standard)'}</span>
                  <span>23 {isAr ? 'كغ (حقيبة كاملة)' : 'kg (Full Bag)'}</span>
                  <span>35 {isAr ? 'كغ (سعة قصوى)' : 'kg (Max)'}</span>
                </div>
              </div>

              {/* Financial Breakdown Preview */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-teal-200/60">
                <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-teal-200/60">
                  <span className="text-[10px] text-slate-500 block">{isAr ? 'أرباحك الصافية التقديرية' : 'Estimated Net Earnings'}</span>
                  <div className="text-lg font-black text-emerald-600 flex items-center gap-1 mt-0.5">
                    <span>${estimatedEarnings.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400 font-normal">(${pricePerKg}/kg)</span>
                  </div>
                  <span className="text-[9px] text-emerald-700 font-bold">
                    {isAr ? `≈ ${(estimatedEarnings * 0.709).toFixed(1)} JOD / ${(estimatedEarnings * 220).toFixed(0)} DZD` : ''}
                  </span>
                </div>

                <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-teal-200/60">
                  <span className="text-[10px] text-slate-500 block">{isAr ? 'مبلغ الضمان المسترد المطلوب' : 'Refundable Escrow Deposit'}</span>
                  <div className="text-lg font-black text-slate-800 flex items-center gap-1 mt-0.5">
                    <span>${estimatedEscrow.toFixed(2)}</span>
                  </div>
                  <span className="text-[9px] text-slate-500">
                    {isAr ? 'يُفك الحجز فور تسليم الطرود في مركز الوصول' : 'Unlocked immediately upon dropoff'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Proof Upload */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              {isAr ? '4. إثبات حجز التذكرة (Flight Ticket Proof)' : '4. Flight Ticket Proof (PDF / Image)'}
            </label>

            <div className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-2xl p-4 text-center transition-colors relative bg-slate-50">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {ticketFile ? (
                <div className="flex items-center justify-center gap-2 text-xs text-emerald-700 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>{ticketFile.name} ({(ticketFile.size / 1024).toFixed(0)} KB)</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <UploadCloud className="w-8 h-8 text-teal-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">
                    {isAr ? 'اضغط لرفع صورة التذكرة أو بطاقة الصعود (PDF/PNG/JPG)' : 'Click or drop your ticket proof here (PDF/PNG/JPG)'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {isAr ? 'يتم فحص التذكرة ومطابقة PNR بواسطة نظام التدقيق الأمني' : 'Ticket and PNR are validated by security protocol'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Legal Commitment Agreement Checkbox */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={commitmentAccepted}
                onChange={(e) => setCommitmentAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-amber-400 text-teal-600 focus:ring-teal-500"
              />
              <div className="text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-amber-900 block mb-0.5">
                  {isAr ? 'إقرار الالتزام ومسؤولية السفر القانونية:' : 'Traveler Commitment & Legal Trust Pledge:'}
                </span>
                {isAr
                  ? 'أقر وأتعهد بالالتزام بموعد السفر المعلن، وعدم التخلف عن الرحلة بعد حجز وإسناد طرود العملاء إليها. وأدرك أن المنصة تعتمد على حجزي لطرح السعة الشحنية، وأن أي إلغاء غير مبرر يخضع للمساءلة وفك الضمان وفق اللوائح التنظيمية.'
                  : 'I commit to the announced flight date and time. I acknowledge that THOUESA allocates confirmed customer shipments based on this schedule. Once packages are linked, cancellation is subject to management review.'}
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !commitmentAccepted || !ticketFile}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-black shadow-lg shadow-teal-600/20 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>{isAr ? 'جاري التحقق والحفظ...' : 'Registering & Verifying...'}</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isAr ? 'تأكيد وحفظ الرحلة' : 'Confirm & Publish Flight'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
