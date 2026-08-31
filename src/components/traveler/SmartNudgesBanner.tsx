import React from 'react';
import { Info, CheckCircle2, AlertCircle, PlusCircle, Sparkles, MapPin, ArrowRight } from 'lucide-react';
import { Locale, Trip } from '../../types';

interface SmartNudgesBannerProps {
  activeTrip: Trip | null | undefined;
  locale: Locale;
  onAddNewTrip: () => void;
  onOpenHubMap?: () => void;
}

export const SmartNudgesBanner: React.FC<SmartNudgesBannerProps> = ({
  activeTrip,
  locale,
  onAddNewTrip,
  onOpenHubMap,
}) => {
  const isAr = locale === 'ar';

  if (!activeTrip) {
    return (
      <div 
        onClick={onAddNewTrip}
        className="bg-gradient-to-r from-teal-50 via-teal-100/50 to-indigo-50 border border-teal-200 rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:border-teal-300 transition-all shadow-2xs group"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>{isAr ? 'هل تخطط للسفر قريباً بين عمان والجزائر؟' : 'Planning to travel soon?'}</span>
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              {isAr
                ? 'أضف تفاصيل تذكرتك الآن واكسب حتى $300+ لكل رحلة من خلال نقل الطرود الموثقة بأمان.'
                : 'Register your flight ticket to earn up to $300+ per trip transporting verified parcels.'}
            </p>
          </div>
        </div>

        <button className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-teal-600 group-hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-xs">
          <span>{isAr ? 'إضافة رحلة' : 'Add Flight'}</span>
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </button>
      </div>
    );
  }

  // Pre-departure state (Scheduled / Pending)
  if (activeTrip.status === 'SCHEDULED' || activeTrip.status === 'PENDING') {
    return (
      <div 
        className="bg-teal-50 border border-teal-200 rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-2xs"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-teal-950">
              {isAr ? 'تنبيه مرحلة ما قبل المغادرة (Pre-Flight)' : 'Pre-Flight Preparation Nudge'}
            </h4>
            <p className="text-xs text-teal-800 mt-0.5 leading-relaxed">
              {isAr
                ? 'لا تنسَ التوجه لمكتبنا المعتمد غداً لدفع مبلغ الضمان واستلام الطرود وفحص الأمانة قبل موعد إقلاع رحلتك.'
                : 'Don\'t forget to visit our official branch tomorrow to deposit escrow, receive parcels, and verify custody before flight.'}
            </p>
          </div>
        </div>

        {onOpenHubMap && (
          <button 
            onClick={onOpenHubMap}
            className="hidden sm:flex items-center gap-1 px-3.5 py-2 bg-white hover:bg-teal-100/50 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
            <span>{isAr ? 'موقع الفرع' : 'Hub Location'}</span>
          </button>
        )}
      </div>
    );
  }

  // In-transit / Arrived state
  if (activeTrip.status === 'IN_TRANSIT' || activeTrip.status === 'ARRIVED') {
    return (
      <div 
        className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-4 shadow-2xs animate-in fade-in"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-emerald-950">
              {isAr ? 'الحمد لله على السلامة! مرحلة التسليم النهائي' : 'Safe Arrival! Final Handover Desk'}
            </h4>
            <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
              {isAr
                ? 'الحمد لله على سلامة الوصول! يرجى التوجه لمكتب الوصول لتسليم الطرود المشفرة وتحرير أرباحك ومبلغ الضمان فوراً في محفظتك.'
                : 'Welcome safely! Please head to the destination hub to handover custody and immediately unlock your earnings & escrow deposit.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
