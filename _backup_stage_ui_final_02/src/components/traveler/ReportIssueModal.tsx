import React, { useState } from 'react';
import { AlertTriangle, X, Camera, Scale, ShieldAlert, CheckCircle2, Send, PackageX } from 'lucide-react';
import { Locale, Shipment } from '../../types';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  locale: Locale;
  onSubmitReport: (shipmentId: string, issueType: string, notes: string) => void;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  shipment,
  locale,
  onSubmitReport,
}) => {
  const isAr = locale === 'ar';

  const [issueType, setIssueType] = useState<string>('DAMAGED_PACKAGE');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  if (!isOpen || !shipment) return null;

  const issueOptions = [
    {
      id: 'DAMAGED_PACKAGE',
      labelAr: 'طرد تالف أو الغلاف الأمني ممزق',
      labelEn: 'Damaged package or broken security seal',
      icon: PackageX,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
    },
    {
      id: 'WEIGHT_MISMATCH',
      labelAr: 'اختلاف في الوزن الفعلي عن المسجل',
      labelEn: 'Weight discrepancy from certified weight',
      icon: Scale,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      id: 'SUSPICIOUS_CONTENT',
      labelAr: 'محتوى مشبوه أو غير مطابق للوصف الجمركي',
      labelEn: 'Suspicious content / customs declaration mismatch',
      icon: ShieldAlert,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
    {
      id: 'OTHER',
      labelAr: 'ملاحظة أخرى / طلب استثناء',
      labelEn: 'Other exception / manual review request',
      icon: AlertTriangle,
      color: 'text-slate-600 bg-slate-50 border-slate-200',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedSuccess(true);
      onSubmitReport(shipment.id, issueType, notes);
      setTimeout(() => {
        setSubmittedSuccess(false);
        onClose();
      }, 1400);
    }, 600);
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {isAr ? 'إبلاغ عن مشكلة في الطرد' : 'Report Package Issue'}
              </h3>
              <p className="text-xs font-mono text-slate-500">
                {shipment.trackingNumber} ({shipment.actualWeightKg || shipment.estimatedWeightKg} kg)
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

        {/* Modal Content */}
        {submittedSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-slate-900">
              {isAr ? 'تم تسجيل الإبلاغ بنجاح' : 'Issue Reported Successfully'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {isAr
                ? 'تم رفع هذا الطرد مؤقتاً من عهدتك وإرسال تنبيه عاجل لمدير فرع المغادرة لمراجعته واستبداله.'
                : 'This parcel has been temporarily unassigned from your custody, and an urgent dispatch was sent to the hub manager.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Context Note */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
              {isAr
                ? '🔒 حماية للمسافر: لن تكون مسؤولاً عن أي طرد تقوم بالإبلاغ عنه فوراً قبل مغادرة الفرع.'
                : '🔒 Traveler Protection: You are not liable for any parcel flagged prior to departure.'}
            </div>

            {/* Select Issue Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                {isAr ? 'نوع المشكلة الملاحظة:' : 'Observed Issue Type:'}
              </label>
              <div className="grid grid-cols-1 gap-2">
                {issueOptions.map((opt) => {
                  const IconComp = opt.icon;
                  const isSelected = issueType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setIssueType(opt.id)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-start transition-all cursor-pointer ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${opt.color}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 flex-1">
                        {isAr ? opt.labelAr : opt.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes textarea */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                {isAr ? 'تفاصيل إضافية / وصف المشكلة للمدير:' : 'Additional Details for Hub Manager:'}
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  isAr
                    ? 'مثال: وجود تمزق في الكرتون الخارجي، أو الشحنة تبدو أثقل من الوزن المدون...'
                    : 'e.g. Outer carton is punctured or parcel appears heavier than declared...'
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 focus:outline-none focus:border-rose-500 focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isAr ? 'إرسال الإبلاغ واستبعاد الطرد' : 'Submit & Unassign Parcel'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
