import React from 'react';
import { PlusCircle, QrCode, MessageCircle, Phone, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { Locale } from '../../types';

interface TravelerQuickActionsCardProps {
  locale: Locale;
  onAddNewTrip: () => void;
  onScanQR: () => void;
  onOpenSupport: () => void;
}

export const TravelerQuickActionsCard: React.FC<TravelerQuickActionsCardProps> = ({
  locale,
  onAddNewTrip,
  onScanQR,
  onOpenSupport,
}) => {
  const isAr = locale === 'ar';

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3.5" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="font-black text-sm text-slate-900">{isAr ? 'إجراءات سريعة' : 'Quick Actions'}</h3>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {/* Add Flight Button */}
        <button
          onClick={onAddNewTrip}
          className="flex flex-col items-center justify-center p-3.5 bg-teal-50/70 hover:bg-teal-100/70 border border-teal-100 rounded-2xl transition-all cursor-pointer group text-center space-y-1.5"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
            <PlusCircle className="w-5 h-5" />
          </div>
          <span className="text-xs font-black text-teal-950 block">{isAr ? 'إضافة رحلة' : 'Add Flight'}</span>
          <span className="text-[10px] text-teal-700 font-medium leading-tight line-clamp-1">{isAr ? 'جدولة وزن جديد' : 'Register baggage'}</span>
        </button>

        {/* Scan Barcode / QR Handover */}
        <button
          onClick={onScanQR}
          className="flex flex-col items-center justify-center p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-2xl transition-all cursor-pointer group text-center space-y-1.5"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
            <QrCode className="w-5 h-5" />
          </div>
          <span className="text-xs font-black text-slate-900 block">{isAr ? 'مسح باركود' : 'Scan QR'}</span>
          <span className="text-[10px] text-slate-500 font-medium leading-tight line-clamp-1">{isAr ? 'تسليم / استلام' : 'Mutual handover'}</span>
        </button>

        {/* 24/7 SOS & Live Operations Support */}
        <button
          onClick={onOpenSupport}
          className="col-span-2 flex items-center justify-between p-3.5 bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200 rounded-2xl transition-all cursor-pointer group text-start"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-rose-950 block">{isAr ? 'الدعم المباشر وطوارئ المطار' : 'Airport SOS & Live Support'}</span>
              <span className="text-[10px] text-rose-700 font-medium">{isAr ? 'مساعدة فورية 24/7 مع العمليات' : 'Instant 24/7 emergency dispatch'}</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-rose-500 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
