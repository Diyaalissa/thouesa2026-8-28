import React from 'react';
import { 
  Plane, ShieldCheck, ShieldAlert, Clock, Sun, Cloud, Calendar, 
  Package, ChevronRight, AlertTriangle, Sparkles, DollarSign 
} from 'lucide-react';
import { Locale, Trip } from '../../types';
import { formatCurrency } from '../../lib/crypto';
import { HUBS_DATA } from '../../lib/constants';

interface UpcomingTripCardProps {
  trip: Trip | null | undefined;
  locale: Locale;
  onViewBag: () => void;
  onAddNewTrip?: () => void;
}

export const UpcomingTripCard: React.FC<UpcomingTripCardProps> = ({
  trip,
  locale,
  onViewBag,
  onAddNewTrip,
}) => {
  const isAr = locale === 'ar';

  if (!trip) {
    return (
      <div 
        className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-2xs"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
          <Plane className="w-8 h-8" />
        </div>
        <div className="max-w-md">
          <h3 className="text-lg font-black text-slate-800">{isAr ? 'لا توجد رحلات قادمة مسجلة' : 'No upcoming flights scheduled'}</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {isAr
              ? 'هل لديك تذكرة طيران قادمة بين الأردن والجزائر؟ سجل رحلتك واستثمر وزن حقائبك غير المستغل لكسب مئات الدولارات بأمان.'
              : 'Traveling between Jordan and Algeria soon? Register your flight to monetize your unused baggage capacity safely.'}
          </p>
        </div>
        {onAddNewTrip && (
          <button
            onClick={onAddNewTrip}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-2xl transition-all shadow-md hover:shadow-teal-600/20 cursor-pointer flex items-center gap-2"
          >
            <Plane className="w-4 h-4" />
            <span>{isAr ? 'إضافة رحلة جديدة الآن' : 'Add New Flight Now'}</span>
          </button>
        )}
      </div>
    );
  }

  // Lookup Hub Details for Weather & Flags
  const originHub = HUBS_DATA.find(h => h.id === trip.originHubId) || {
    cityAr: 'عَمّان',
    cityEn: 'Amman',
    countryNameAr: 'الأردن',
    countryNameEn: 'Jordan',
    countryCode: 'JO',
  };

  const destHub = HUBS_DATA.find(h => h.id === trip.destinationHubId) || {
    cityAr: 'الجزائر العاصمة',
    cityEn: 'Algiers',
    countryNameAr: 'الجزائر',
    countryNameEn: 'Algeria',
    countryCode: 'DZ',
  };

  const originFlag = originHub.countryCode === 'JO' ? '🇯🇴' : '🇩🇿';
  const destFlag = destHub.countryCode === 'DZ' ? '🇩🇿' : '🇯🇴';

  const originCity = isAr ? originHub.cityAr : originHub.cityEn;
  const destCity = isAr ? destHub.cityAr : destHub.cityEn;

  // Mock weather for destination city
  const weatherTemp = destHub.countryCode === 'DZ' ? '23°C' : '28°C';
  const weatherCondition = isAr ? 'معتدل 🌤️' : 'Pleasant 🌤️';
  const destLocalTime = destHub.countryCode === 'DZ' ? 'GMT+1 (14:30)' : 'GMT+3 (16:30)';

  // Calculate capacity percentage
  const totalCapacity = trip.availableWeightKg || 30;
  const allocated = trip.allocatedWeightKg || 0;
  const percentage = Math.min(100, Math.round((allocated / totalCapacity) * 100));

  // Countdown approximation
  const departureDate = new Date(trip.departureTime);
  const now = new Date();
  const diffHours = Math.max(0, Math.round((departureDate.getTime() - now.getTime()) / (1000 * 60 * 60)));
  const countdownText = diffHours > 0 
    ? (isAr ? `باقي ${diffHours} ساعة على الإقلاع` : `${diffHours}h left until takeoff`)
    : (isAr ? 'الرحلة قيد التنفيذ الآن' : 'Flight in transit');

  // Parcel Count Calculation
  const parcelCount = allocated > 0 ? Math.max(1, Math.round(allocated / 4)) : 0;

  return (
    <div 
      className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Top Banner (Dark Flight Header) */}
      <div className="bg-slate-900 text-white p-6 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/15 blur-[90px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Flight meta top row */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-mono">
              <span className="px-2.5 py-1 bg-slate-800/80 rounded-xl border border-slate-700 text-teal-400 font-bold">
                {trip.airline || 'Royal Jordanian'}
              </span>
              <span className="text-slate-400">#{trip.id.substring(0, 8).toUpperCase()}</span>
            </div>

            {/* Destination Weather & Local Time Badge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-medium border border-white/15">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>{destCity}: {weatherTemp} {weatherCondition}</span>
              <span className="opacity-50">|</span>
              <span className="font-mono text-slate-300">{destLocalTime}</span>
            </div>
          </div>

          {/* Route Display */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-4 text-2xl sm:text-3xl font-black">
              <div className="flex items-center gap-2">
                <span>{originCity}</span>
                <span className="text-xl">{originFlag}</span>
              </div>

              <div className="flex items-center gap-1 text-teal-400 px-2">
                <span className="w-4 h-0.5 bg-teal-500/50 hidden sm:inline-block"></span>
                <Plane className="w-6 h-6 rtl:rotate-180 animate-pulse shrink-0" />
                <span className="w-4 h-0.5 bg-teal-500/50 hidden sm:inline-block"></span>
              </div>

              <div className="flex items-center gap-2">
                <span>{destCity}</span>
                <span className="text-xl">{destFlag}</span>
              </div>
            </div>

            {/* Live Countdown Badge */}
            <div className="bg-gradient-to-br from-teal-500/20 to-teal-700/30 border border-teal-400/30 rounded-2xl px-4 py-2.5 text-center sm:text-end shrink-0 backdrop-blur-md">
              <div className="flex items-center gap-1.5 justify-center sm:justify-end text-[11px] text-teal-200 font-bold mb-0.5">
                <Clock className="w-3.5 h-3.5 text-teal-400 animate-spin" />
                <span>{isAr ? 'العد التنازلي للإقلاع' : 'Takeoff Countdown'}</span>
              </div>
              <span className="text-base sm:text-lg font-black text-white block">
                {countdownText}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-6 space-y-6">
        {/* Capacity & Booking Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 block">{isAr ? 'الوزن المتاح الكلي' : 'Total Capacity'}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-900">{totalCapacity}</span>
              <span className="text-xs text-slate-500 font-bold">kg</span>
            </div>
          </div>

          <div className="p-3.5 bg-teal-50/70 rounded-2xl border border-teal-100 space-y-1">
            <span className="text-[11px] font-bold text-teal-700 block">{isAr ? 'الوزن المحجوز' : 'Allocated Weight'}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-teal-900">{allocated}</span>
              <span className="text-xs text-teal-700 font-bold">/ {totalCapacity} kg</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 block">{isAr ? 'الطرود المسندة' : 'Assigned Parcels'}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-900">{parcelCount}</span>
              <span className="text-xs text-slate-500 font-bold">{isAr ? 'شحنات' : 'parcels'}</span>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100 space-y-1">
            <span className="text-[11px] font-bold text-emerald-700 block">{isAr ? 'الأرباح المقدرة' : 'Est. Earnings'}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-emerald-700">{formatCurrency(trip.totalEarningsEstimated || 180, 'USD')}</span>
            </div>
          </div>
        </div>

        {/* Visual Capacity Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-teal-600" />
              <span>{isAr ? 'نسبة إشغال الحقيبة' : 'Luggage Capacity Utilization'}</span>
            </span>
            <span className="font-mono font-bold text-teal-700">{percentage}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Financial Escrow Warning Alert Box */}
        {trip.requiredEscrowDeposit > 0 && !trip.isEscrowPaid && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <span className="block font-black text-amber-950 text-sm">
                  {isAr ? 'الضمان المالي المطلوب تجهيزه:' : 'Required Escrow Deposit:'}
                </span>
                <span className="text-xs text-amber-800 font-medium">
                  {isAr 
                    ? 'يُدفع في مكتب الفرع عند استلام الطرود ويُسترد بالكامل فور تسليمها بالوجهة.' 
                    : 'Payable at departure hub upon parcel pickup, 100% refundable upon handover.'}
                </span>
              </div>
            </div>
            <div className="self-end sm:self-center px-4 py-2 bg-amber-200/80 rounded-xl border border-amber-300 font-black text-amber-950 text-base shrink-0 font-mono">
              {formatCurrency(trip.requiredEscrowDeposit, 'USD')}
            </div>
          </div>
        )}

        {/* Primary CTA: View My Bag & Manifest */}
        <button
          onClick={onViewBag}
          className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 cursor-pointer group"
        >
          <ShieldCheck className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
          <span>{isAr ? 'عرض حقيبتي لمعاينة الطرود والمانيفست' : 'View My Bag & Inspect Parcels'}</span>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
