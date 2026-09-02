import React from 'react';
import { Trip, Locale, Hub } from '../../types';
import { Plane, AlertTriangle, CheckCircle2, Phone, MapPin, Sparkles, Scale, Clock, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface BoardingPassCardProps {
  trip: Trip;
  originHub?: Hub;
  destHub?: Hub;
  locale: Locale;
  onCheckIn?: () => void;
  isCheckInAvailable?: boolean;
  onSelect?: () => void;
}

export const BoardingPassCard: React.FC<BoardingPassCardProps> = ({
  trip,
  originHub,
  destHub,
  locale,
  onCheckIn,
  isCheckInAvailable,
  onSelect,
}) => {
  const isAr = locale === 'ar';
  
  // Format Date safely
  const formatDateTime = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return new Intl.DateTimeFormat(isAr ? 'ar-JO' : 'en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return dateString;
    }
  };

  // 48h confirmation timing calculation
  const departureDate = new Date(trip.departureTime);
  const now = new Date();
  const diffHours = (departureDate.getTime() - now.getTime()) / (1000 * 3600);
  const needsCheckIn = !trip.checkedInAt && diffHours <= 48 && diffHours > 0 && ['SUBMITTED', 'SCHEDULED', 'VERIFIED'].includes(trip.status);
  const isUrgent24h = diffHours <= 24 && diffHours > 0;

  const isGoldPriority = trip.priorityTier === 'GOLD' || trip.travelerRating >= 4.9;

  const allocated = trip.allocatedWeightKg || 0;
  const total = trip.availableWeightKg || 1;
  const capacityPct = Math.min(100, Math.round((allocated / total) * 100));

  return (
    <div 
      className="bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col relative group cursor-pointer"
      onClick={onSelect}
    >
      {/* Top Airline Colored Stripe with Priority Badge */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-900 to-slate-900 text-white px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
            <Plane className="w-4 h-4 rtl:-scale-x-100" />
          </div>
          <div>
            <span className="text-xs font-black tracking-wide block">{trip.airline}</span>
            <span className="text-[10px] text-teal-200 font-mono">{trip.flightNumber}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isGoldPriority && (
            <div className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>{isAr ? 'أولوية ذهبية 🌟' : 'Gold Priority 🌟'}</span>
            </div>
          )}
          <StatusBadge status={trip.status} locale={locale} size="sm" />
        </div>
      </div>
      
      {/* Main Boarding Pass Content */}
      <div className="p-5 space-y-4">
        {/* Flight Route Departure -> Arrival */}
        <div className="flex justify-between items-center bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
          <div className="flex flex-col text-start">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {originHub?.countryCode === 'JOR' ? 'AMM' : (originHub?.countryCode === 'DZA' ? 'ALG' : 'JOR')}
            </span>
            <span className="text-[11px] font-bold text-slate-500 mt-0.5">
              {originHub ? (isAr ? originHub.cityAr : originHub.cityEn) : (isAr ? 'عمّان' : 'Amman')}
            </span>
            <span className="text-[10px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md mt-1">
              {formatDateTime(trip.departureTime)}
            </span>
          </div>
          
          <div className="flex-1 px-3 flex flex-col items-center justify-center relative">
            <div className="w-full border-t-2 border-dashed border-slate-300 relative top-2.5" />
            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center relative z-10">
              <Plane className="w-4 h-4 text-teal-600 rtl:-scale-x-100" />
            </div>
            <span className="text-[9px] font-mono font-bold text-slate-400 mt-1">
              PNR: {trip.pnrCode}
            </span>
          </div>
          
          <div className="flex flex-col text-end">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {destHub?.countryCode === 'DZA' ? 'ALG' : (destHub?.countryCode === 'JOR' ? 'AMM' : 'DZA')}
            </span>
            <span className="text-[11px] font-bold text-slate-500 mt-0.5">
              {destHub ? (isAr ? destHub.cityAr : destHub.cityEn) : (isAr ? 'الجزائر العاصمة' : 'Algiers')}
            </span>
            <span className="text-[10px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md mt-1">
              {formatDateTime(trip.arrivalTime)}
            </span>
          </div>
        </div>

        {/* Capacity Meter (الوزن المحجوز من قبل الإدارة / المتاح) */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-600 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-teal-600" />
              {isAr ? 'سعة الشحن المحجوزة' : 'Assigned Cargo Capacity'}
            </span>
            <span className="font-mono font-black text-slate-900">
              {allocated} / {total} {isAr ? 'كغ' : 'KG'} ({capacityPct}%)
            </span>
          </div>
          
          <div className="h-2.5 w-full bg-slate-200/80 rounded-full overflow-hidden p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                capacityPct >= 90 ? 'bg-rose-500' : (capacityPct > 0 ? 'bg-teal-600' : 'bg-slate-400')
              }`} 
              style={{ width: `${Math.max(4, capacityPct)}%` }} 
            />
          </div>
          
          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span>{isAr ? `متاح: ${total - allocated} كغ` : `Remaining: ${total - allocated} kg`}</span>
            <span>{isAr ? `الأرباح المقدرة: $${trip.totalEarningsEstimated}` : `Est. Earnings: $${trip.totalEarningsEstimated}`}</span>
          </div>
        </div>

        {/* Pre-Flight Digital Confirmation Alert (48h Protocol) */}
        {(needsCheckIn || isCheckInAvailable) && (
          <div className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
            isUrgent24h 
              ? 'bg-rose-50 border-rose-300 text-rose-900' 
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isUrgent24h ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
            }`}>
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black">
                  {isAr ? 'تأكيد استمرار الرحلة والجاهزية للسفر' : 'Confirm Travel Readiness'}
                </h4>
                {diffHours > 0 && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-white rounded-md border border-amber-200">
                    <Clock className="w-2.5 h-2.5 inline me-1" />
                    {Math.round(diffHours)}h {isAr ? 'متبقية' : 'left'}
                  </span>
                )}
              </div>
              
              <p className="text-[11px] text-slate-600 mt-1 mb-2 leading-relaxed">
                {isAr 
                  ? 'يرجى تأكيد استمرار الرحلة لتثبيت حجز الطرود وتجهيز المانيفست في فرع المغادرة ومنع إلغاء الإسناد.'
                  : 'Please confirm your flight intention to secure parcel allocation and manifest readiness at origin hub.'}
              </p>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (onCheckIn) onCheckIn();
                }}
                className={`w-full py-2.5 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
                  isUrgent24h 
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30 animate-pulse' 
                    : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAr ? 'تأكيد الجاهزية للسفر الآن' : 'Confirm Flight Readiness'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Checked-In Badge if completed */}
        {trip.checkedInAt && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {isAr ? 'تم تأكيد استمرار السفر - يرجى التوجه لفرع المغادرة لاستلام العهدة' : 'Flight readiness confirmed. Please visit Origin Hub for handover.'}
            </span>
          </div>
        )}
      </div>

      {/* Perforated Divider Styling */}
      <div className="relative py-1 bg-slate-50 border-t border-dashed border-slate-300 flex items-center justify-between px-4">
        {/* Left and Right Notches */}
        <div className="absolute -start-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-100 rounded-full border border-slate-200" />
        <div className="absolute -end-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-100 rounded-full border border-slate-200" />
        
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mx-auto">
          THOUESA • SECURE P2P MANIFEST • PNR #{trip.pnrCode}
        </span>
      </div>
    </div>
  );
};
