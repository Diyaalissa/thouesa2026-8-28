import React from 'react';
import { Phone, MessageCircle, AlertTriangle, ShieldCheck, Clock, MapPin, ExternalLink } from 'lucide-react';
import { Locale } from '../../types';
import { HUBS_DATA } from '../../lib/constants';

interface SupportSOSViewProps {
  locale: Locale;
}

export const SupportSOSView: React.FC<SupportSOSViewProps> = ({ locale }) => {
  const isAr = locale === 'ar';

  return (
    <div className="space-y-6 max-w-4xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      {/* SOS Emergency Banner */}
      <div className="bg-gradient-to-br from-rose-600 via-rose-700 to-slate-900 p-6 rounded-3xl text-white shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>{isAr ? 'خط طوارئ المطار المباشر (24/7 SOS)' : '24/7 Airport Emergency Dispatch'}</span>
          </div>
          <span className="text-[11px] font-mono bg-black/30 px-2 py-0.5 rounded">PRIORITY 1</span>
        </div>

        <div>
          <h2 className="text-2xl font-black">{isAr ? 'مركز الدعم والطوارئ الميدانية' : 'Support & Rapid Response Desk'}</h2>
          <p className="text-xs text-rose-100 mt-1 max-w-2xl leading-relaxed">
            {isAr
              ? 'هل تواجه تفتيشاً جمركياً غير متوقع، تأخر في رحلة الطيران، أو صعوبة في الوصول لفرع التسليم؟ فريق عمليات THOUESA متاح على مدار الساعة للتدخل الفوري.'
              : 'Facing unexpected customs inspection, flight rescheduling, or hub delivery issues? THOUESA rapid response unit is on standby.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <a
            href="tel:+962790000000"
            className="flex items-center justify-center gap-2.5 py-3.5 px-4 bg-white text-rose-700 hover:bg-rose-50 font-black rounded-2xl transition-all shadow-md text-xs cursor-pointer"
          >
            <Phone className="w-4 h-4 text-rose-600" />
            <span>{isAr ? 'اتصال طوارئ فوري (عمان/الجزائر)' : 'Call Emergency Hotline'}</span>
          </a>
          <a
            href="https://wa.me/962790000000"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2.5 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl transition-all shadow-md text-xs cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{isAr ? 'محادثة واتساب مباشرة مع العمليات' : 'Live WhatsApp Dispatch'}</span>
          </a>
        </div>
      </div>

      {/* Official Hub Offices Direct Contacts */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">{isAr ? 'أرقام مكاتب الفروع المعتمدة' : 'Official Hub Branch Numbers'}</h3>
            <p className="text-xs text-slate-500">{isAr ? 'للتواصل المباشر مع مكاتب الاستلام والتسليم' : 'Direct branch managers contacts'}</p>
          </div>
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            {HUBS_DATA.length} {isAr ? 'فروع نشطة' : 'Active Hubs'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {HUBS_DATA.map((hub) => (
            <div key={hub.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{isAr ? hub.nameAr : hub.nameEn}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>{isAr ? hub.cityAr : hub.cityEn}, {isAr ? hub.countryNameAr : hub.countryNameEn}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-600">
                  {hub.code}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                <div className="flex items-center gap-1 text-slate-600 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{hub.phone || '+962 6 500 0000'}</span>
                </div>
                <a
                  href={`tel:${hub.phone || '+96265000000'}`}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-[11px] transition-colors"
                >
                  {isAr ? 'اتصال' : 'Call'}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
