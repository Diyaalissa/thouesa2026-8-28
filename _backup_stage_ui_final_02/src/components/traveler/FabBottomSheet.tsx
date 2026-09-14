import React from 'react';
import { PlusCircle, QrCode, X, Plane, ShieldCheck, Sparkles } from 'lucide-react';
import { Locale } from '../../types';

interface FabBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
  onOpenNewTrip: () => void;
  onOpenScanQR: () => void;
}

export const FabBottomSheet: React.FC<FabBottomSheetProps> = ({
  isOpen,
  onClose,
  locale,
  onOpenNewTrip,
  onOpenScanQR,
}) => {
  const isAr = locale === 'ar';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden bg-slate-900/60 backdrop-blur-xs">
      <div className="flex-1 w-full" onClick={onClose} />
      <div 
        className="w-full bg-white rounded-t-3xl p-5 pb-8 shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-200 space-y-4"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-black text-slate-800">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>{isAr ? 'إجراء تشغيلي سريع' : 'Quick Operations'}</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => {
              onClose();
              onOpenNewTrip();
            }}
            className="flex items-center gap-3.5 p-4 bg-teal-50 hover:bg-teal-100/80 border border-teal-200 rounded-2xl transition-colors text-start group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="block font-black text-sm text-teal-950">{isAr ? 'إضافة رحلة جديدة' : 'Register New Flight'}</span>
              <span className="text-[11px] text-teal-700 font-medium">
                {isAr ? 'سجل تذكرتك وعرض وزنك المتاح لكسب الأرباح' : 'Register flight ticket and available luggage capacity'}
              </span>
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenScanQR();
            }}
            className="flex items-center gap-3.5 p-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-colors text-start group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <span className="block font-black text-sm text-white">{isAr ? 'مسح باركود وتأكيد الاستلام / التسليم' : 'Scan Barcode / Handover Pass'}</span>
              <span className="text-[11px] text-slate-300 font-medium">
                {isAr ? 'فتح رمز التسليم المشفر أو فحص طرد في الفرع' : 'Access mutual custody QR or scan parcel barcode'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
