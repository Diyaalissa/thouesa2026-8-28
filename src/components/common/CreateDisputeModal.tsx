import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  ShieldAlert,
  FileCheck,
  DollarSign,
  Upload,
  AlertCircle,
  CheckCircle2,
  Lock,
  Camera,
} from 'lucide-react';
import { Dispute, Locale, Shipment, User } from '../../types';

interface CreateDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  currentUser: User;
  locale: Locale;
  onSuccess: (newDispute: Dispute) => void;
}

export const CreateDisputeModal: React.FC<CreateDisputeModalProps> = ({
  isOpen,
  onClose,
  shipment,
  currentUser,
  locale,
  onSuccess,
}) => {
  if (!isOpen || !shipment) return null;

  const isAr = locale === 'ar';

  const [reason, setReason] = useState<Dispute['reason']>('DAMAGED_ITEM');
  const [claimAmount, setClaimAmount] = useState<number>(
    shipment.declaredValue || shipment.shippingCost || 100
  );
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg(isAr ? 'يرجى كتابة تفاصيل الشكوى والسبب بالتفصيل' : 'Please provide detailed complaint notes');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: shipment.id,
          claimantId: currentUser.id,
          claimantName: currentUser.fullName,
          claimantRole: currentUser.role,
          reason,
          description,
          claimAmount: Number(claimAmount),
          evidencePhotos: [photoUrl],
        }),
      });

      const data = await res.json();
      if (data.success && data.dispute) {
        onSuccess(data.dispute);
        onClose();
      } else {
        setErrorMsg(data.error || (isAr ? 'فشل إرسال النزاع' : 'Failed to submit dispute'));
      }
    } catch (err: any) {
      setErrorMsg(err.message || (isAr ? 'خطأ في الاتصال بالخادم' : 'Server communication error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-red-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {isAr ? 'فتح نزاع وتقديم شكوى رسمية للإدارة' : 'File Official Dispute & Escrow Claim'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr ? `الشحنة: ${shipment.trackingNumber}` : `Shipment: ${shipment.trackingNumber}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Legal / Escrow Guarantee Notice */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <Lock className="w-4 h-4" />
              <span>{isAr ? 'حماية التحكيم المالي المشدد (Escrow Guarantee):' : 'Escrow Arbitration Protection:'}</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {isAr
                ? 'بمجرد تسجيل هذا النزاع، يتم تجميد أموال الضمان المالي المحجوزة للمسافر فوراً وعدم صرفها، ويتم إحالة الملف إلى ضابط الامتثال بالإدارة المركزية لمراجعة صور الفحص والختم الأمني واتخاذ القرار النهائي.'
                : 'Filing this dispute immediately freezes the traveler security deposit (escrow) and routes the case to central compliance for evidence audit and financial resolution.'}
            </p>
          </div>

          {/* Dispute Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              {isAr ? 'سبب النزاع والمطالبة:' : 'Dispute Reason:'}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as Dispute['reason'])}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-red-400"
            >
              <option value="DAMAGED_ITEM">
                {isAr ? 'تلف أو كسر في محتويات الطرد (Damaged Item)' : 'Damaged / Broken Goods'}
              </option>
              <option value="TAMPERED_SEAL">
                {isAr ? 'عبث بالختم الأمني الإلكتروني أو فتح غير مصرح (Tampered Security Seal)' : 'Tampered Security Seal'}
              </option>
              <option value="MISSING_PACKAGE">
                {isAr ? 'فقدان الطرد أو نقص في المحتويات المسلمة (Missing Package / Loss)' : 'Missing Package / Loss'}
              </option>
              <option value="FLIGHT_DELAY_EXTREME">
                {isAr ? 'تأخر مفرط وإخلال بالموعد الزمني المحدد (Severe Delivery Delay)' : 'Severe Delivery Delay'}
              </option>
              <option value="PROHIBITED_GOODS_DISCOVERED">
                {isAr ? 'اكتشاف مواد مخالفة أو غير مصرح بها (Prohibited Goods Issue)' : 'Prohibited Goods Discovered'}
              </option>
            </select>
          </div>

          {/* Claim Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                {isAr ? 'مبلغ التعويض المالي المطلوب ($ USD):' : 'Claim Compensation Amount ($ USD):'}
              </label>
              <span className="text-[11px] text-slate-400">
                {isAr ? `القيمة المصرحة للطرد: $${shipment.declaredValue}` : `Declared Value: $${shipment.declaredValue}`}
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="0.5"
                required
                value={claimAmount}
                onChange={(e) => setClaimAmount(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono font-bold focus:outline-hidden focus:border-red-400"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              {isAr ? 'شرح الشكوى والملاحظات التفصيلية للجنة التحكيم:' : 'Detailed Complaint Statement & Notes:'}
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isAr
                  ? 'يرجى توضيح حالة الطرد عند الاستلام، رقم الختم، وأي أضرار أو تفاصيل تدعم الشكوى...'
                  : 'Describe package condition at intake/handover, seal state, or any evidence...'
              }
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-red-400"
            />
          </div>

          {/* Evidence Photos */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-red-400" />
              <span>{isAr ? 'صورة إثبات الضرر أو التلف (رابط الصورة):' : 'Evidence Photo URL:'}</span>
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-hidden focus:border-red-400"
            />
            {photoUrl && (
              <div className="mt-2 w-32 h-24 rounded-xl overflow-hidden border border-slate-700">
                <img src={photoUrl} alt="Evidence preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-600/30 transition-colors cursor-pointer disabled:opacity-50"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{isSubmitting ? (isAr ? 'جاري التسجيل...' : 'Submitting...') : (isAr ? 'تسجيل النزاع وتجميد الضمان' : 'File Dispute & Lock Escrow')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
