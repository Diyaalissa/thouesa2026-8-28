import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Banknote,
  Smartphone,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import { Shipment, Locale, Hub } from '../../../types';

// -------------------------------------------------------------
// 1. Receive Confirmation Modal (نافذة تأكيد الاستلام)
// -------------------------------------------------------------
interface ReceiveConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => Promise<void>;
  shipment: Shipment;
  currentHub: Hub;
  locale: Locale;
  isSubmitting: boolean;
}

export const ReceiveConfirmModal: React.FC<ReceiveConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  shipment,
  currentHub,
  locale,
  isSubmitting,
}) => {
  const isAr = locale === 'ar';
  const [deskNotes, setDeskNotes] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-amber-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-bold text-sm sm:text-base">
              {isAr ? 'تأكيد استلام الطرد بالكاونتر' : 'Confirm Desk Parcel Intake'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg hover:bg-amber-600/60 transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs text-slate-700">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500">{isAr ? 'رقم التتبع:' : 'Tracking Number:'}</span>
              <span className="font-mono font-black text-slate-900 text-sm">{shipment.trackingNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">{isAr ? 'المرسل المسجل:' : 'Sender Name:'}</span>
              <span className="font-bold text-slate-900">{shipment.senderName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">{isAr ? 'فرع الاستلام:' : 'Intake Hub:'}</span>
              <span className="font-medium text-amber-900">
                {isAr ? currentHub.nameAr : currentHub.nameEn} ({currentHub.code})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">{isAr ? 'الوزن المعلن من العميل:' : 'Declared Weight:'}</span>
              <span className="font-bold text-slate-800">{shipment.estimatedWeightKg} كغم</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-900 leading-relaxed">
              <span className="font-bold block mb-0.5">
                {isAr ? 'تأكيد التسليم الفعلي:' : 'Physical Handover Verification:'}
              </span>
              {isAr
                ? 'هل تؤكد أن العميل سلّم الطرد فعلياً في كاونتر الفرع وأن الصندوق سليم وخالٍ من أي تلفيات ظاهرة؟'
                : 'Do you confirm that the customer physically handed over the package at the desk in an intact condition?'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isAr ? 'ملاحظات كاونتر الاستقبال (اختياري):' : 'Desk Reception Notes (Optional):'}
            </label>
            <textarea
              rows={2}
              value={deskNotes}
              onChange={(e) => setDeskNotes(e.target.value)}
              placeholder={
                isAr
                  ? 'مثال: تم تسليم الطرد من العميل شخصياً، الكرتون محكم الإغلاق...'
                  : 'e.g. Delivered by sender in person, securely taped...'
              }
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onConfirm(deskNotes)}
            className="px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isSubmitting
                ? (isAr ? 'جارِ التوثيق...' : 'Recording...')
                : (isAr ? 'تأكيد الاستلام ونقل للفحص' : 'Confirm Intake & Transfer')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 2. Intake Issue Modal (تسجيل ملاحظة / مشكلة عند الاستلام)
// -------------------------------------------------------------
interface IntakeIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveIssue: (issueType: string, notes: string, photoUrl?: string) => void;
  shipment: Shipment;
  locale: Locale;
}

export const IntakeIssueModal: React.FC<IntakeIssueModalProps> = ({
  isOpen,
  onClose,
  onSaveIssue,
  shipment,
  locale,
}) => {
  const isAr = locale === 'ar';
  const [issueType, setIssueType] = useState('DAMAGED_PACKAGING');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;
    onSaveIssue(issueType, notes, photoUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-bold text-sm sm:text-base">
              {isAr ? 'تسجيل ملاحظة / مشكلة عند الاستلام' : 'Record Intake Incident / Observation'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-rose-700 transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-slate-500 block mb-1">{isAr ? 'الشحنة المعنية:' : 'Shipment:'}</span>
            <div className="flex justify-between items-center">
              <span className="font-mono font-bold text-slate-900">{shipment.trackingNumber}</span>
              <span className="text-slate-600 font-medium">{shipment.senderName}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isAr ? 'نوع المشكلة أو الملاحظة الظاهرة:' : 'Issue Classification:'}
            </label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="DAMAGED_PACKAGING">
                {isAr ? 'تلف أو تمزق خارجي في الصندوق / الكرتون' : 'Damaged / torn outer packaging'}
              </option>
              <option value="LEAKING">
                {isAr ? 'تسريب سوائل أو روائح غير معتادة' : 'Liquid leakage or unusual odour'}
              </option>
              <option value="ALREADY_OPENED">
                {isAr ? 'العبوة مفتوحة مسبقاً أو غير محكمة الإغلاق' : 'Package pre-opened or improperly sealed'}
              </option>
              <option value="DISCREPANCY">
                {isAr ? 'اختلاف ظاهر بين المحتوى الفعلي والبيانات المصرحة' : 'Visible discrepancy in declared contents'}
              </option>
              <option value="SUSPICIOUS">
                {isAr ? 'اشتباه أمني يستوجب تفتيشاً دقيقاً في محطة الفحص' : 'Security flag for intensive inspection'}
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isAr ? 'تفاصيل الملاحظة الموثقة (إجباري):' : 'Incident Details (Required):'}
            </label>
            <textarea
              required
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isAr
                  ? 'صف حالة الطرد بالتفصيل كما شوهدت على الكاونتر بحضور العميل...'
                  : 'Describe package condition witnessed at desk in front of customer...'
              }
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isAr ? 'رابط صورة إثبات الحالة (اختياري):' : 'Evidence Photo URL (Optional):'}
            </label>
            <input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>{isAr ? 'حفظ الملاحظة في ملف الشحنة' : 'Save Observation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 3. Counter Payment Collection Modal (تحصيل الدفع بالكاونتر)
// -------------------------------------------------------------
interface CounterPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (method: string) => void;
  shipment: Shipment;
  locale: Locale;
}

export const CounterPaymentModal: React.FC<CounterPaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  shipment,
  locale,
}) => {
  const isAr = locale === 'ar';
  const [selectedMethod, setSelectedMethod] = useState<'CASH' | 'POS_CARD' | 'CLIQ_BARIDIMOB'>('CASH');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess(selectedMethod);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <h3 className="font-bold text-sm sm:text-base">
              {isAr ? 'تحصيل رسوم الشحن في الكاونتر' : 'Desk Shipping Payment Collection'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-lg hover:bg-emerald-700 transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-800 block">
                {isAr ? 'المبلغ المستحق للشحن:' : 'Due Shipping Charge:'}
              </span>
              <span className="text-xl font-black text-emerald-950">${shipment.shippingCost} USD</span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
              {shipment.trackingNumber}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              {isAr ? 'اختر طريقة التحصيل في الفرع:' : 'Select Counter Payment Method:'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod('CASH')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  selectedMethod === 'CASH'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Banknote className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                <span className="text-[11px] block">{isAr ? 'نقداً بالفرع' : 'Cash Desk'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('POS_CARD')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  selectedMethod === 'POS_CARD'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <CreditCard className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                <span className="text-[11px] block">{isAr ? 'بطاقة POS' : 'POS Card'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('CLIQ_BARIDIMOB')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  selectedMethod === 'CLIQ_BARIDIMOB'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Smartphone className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                <span className="text-[11px] block">{isAr ? 'CliQ / BaridiMob' : 'Instant Pay'}</span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
            {isAr
              ? 'سيتم إصدار إيصال دفع رسمي وتسجيل العملية في سجل المحاسبة المالي كدفعة نقدية بالفرع.'
              : 'An official payment receipt will be recorded to the double-entry ledger.'}
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmPayment}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isProcessing
                  ? (isAr ? 'جارِ التحصيل...' : 'Processing...')
                  : (isAr ? 'تأكيد السداد وإصدار إيصال' : 'Confirm & Issue Receipt')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
