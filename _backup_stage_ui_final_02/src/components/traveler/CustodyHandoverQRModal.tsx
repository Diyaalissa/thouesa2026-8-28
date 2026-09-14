import React, { useState } from 'react';
import { QrCode, X, ShieldCheck, CheckCircle2, Copy, Download, Share2, Clock, AlertTriangle } from 'lucide-react';
import { Locale, Trip } from '../../types';

interface CustodyHandoverQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  totalWeight: number;
  packageCount: number;
  locale: Locale;
  mode?: 'RECEIVE_AT_ORIGIN' | 'DELIVER_AT_DEST';
}

export const CustodyHandoverQRModal: React.FC<CustodyHandoverQRModalProps> = ({
  isOpen,
  onClose,
  trip,
  totalWeight,
  packageCount,
  locale,
  mode = 'DELIVER_AT_DEST',
}) => {
  const isAr = locale === 'ar';
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handoverToken = `THOUESA-CUSTODY-${trip.id.substring(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(handoverToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {mode === 'DELIVER_AT_DEST'
                  ? isAr ? 'كود إخلاء الطرف وتسليم العهدة 📱' : 'Custody Handover QR 📱'
                  : isAr ? 'كود استلام العهدة في فرع المغادرة 📷' : 'Custody Intake QR 📷'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {trip.airline || 'Royal Jordanian'} - #{trip.id.substring(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-center space-y-5">
          {/* QR Code Container */}
          <div className="p-6 bg-slate-50 border-2 border-dashed border-teal-200 rounded-3xl inline-block mx-auto shadow-inner relative">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                handoverToken
              )}`}
              alt="Handover Custody QR"
              className="w-48 h-48 rounded-xl object-contain mx-auto mix-blend-multiply"
            />
            <div className="mt-2 text-[10px] font-mono text-slate-400 font-bold">
              {handoverToken}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] text-slate-500 font-bold block">{isAr ? 'عدد الطرود' : 'Packages'}</span>
              <span className="text-sm font-black text-slate-800">{packageCount} {isAr ? 'طرود' : 'pkgs'}</span>
            </div>
            <div className="p-3 bg-teal-50/60 rounded-2xl border border-teal-100">
              <span className="text-[10px] text-teal-700 font-bold block">{isAr ? 'الوزن الإجمالي' : 'Total Weight'}</span>
              <span className="text-sm font-black text-teal-900">{totalWeight.toFixed(1)} kg</span>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 text-start space-y-1">
            <div className="flex items-center gap-2 font-bold text-emerald-950">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{isAr ? 'تعليمات موظف الفرع:' : 'Hub Verification Steps:'}</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              {mode === 'DELIVER_AT_DEST'
                ? isAr
                  ? 'أظهر هذا الرمز لموظف فرع الوصول لمسحه ومطابقة الأختام الرقمية وإغلاق العهدة وتحرير الأرباح فوراً.'
                  : 'Present this QR code to the destination hub agent to verify digital tamper seals and unlock funds.'
                : isAr
                  ? 'أظهر هذا الرمز لموظف فرع المغادرة لاستلام حقيبة العهدة المختومة والمانيفست.'
                  : 'Present this QR code at departure hub to collect certified sealed luggage.'}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-2xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الرمز' : 'Copy Code')}</span>
            </button>

            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-2xl transition-colors cursor-pointer"
            >
              {isAr ? 'تم، إغلاق' : 'Done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
