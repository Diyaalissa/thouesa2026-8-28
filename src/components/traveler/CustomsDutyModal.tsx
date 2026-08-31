import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ShieldAlert, Camera, Upload, CheckCircle2, FileText, 
  DollarSign, AlertTriangle, Info, ArrowRight, Building2, 
  Receipt, Lock, Sparkles, Check
} from 'lucide-react';
import { Shipment, Locale, Currency, CustomsDutyRecord } from '../../types';

interface CustomsDutyModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  locale: Locale;
  onSubmitDutyRecord: (record: CustomsDutyRecord) => void;
}

export const CustomsDutyModal: React.FC<CustomsDutyModalProps> = ({
  isOpen,
  onClose,
  shipment,
  locale,
  onSubmitDutyRecord,
}) => {
  const isAr = locale === 'ar';

  const [dutyAmount, setDutyAmount] = useState<string>('35');
  const [dutyCurrency, setDutyCurrency] = useState<'USD' | 'JOD' | 'DZD'>('DZD');
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [customsLocation, setCustomsLocation] = useState<string>('AIRPORT_ALGIERS');
  const [notes, setNotes] = useState<string>('');
  const [receiptPhotoUrl, setReceiptPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80'
  );
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen || !shipment) return null;

  const handleSimulatePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      setErrorMsg('');
      setTimeout(() => {
        // Sample receipt image preview
        setReceiptPhotoUrl('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80');
        setIsUploading(false);
        setUploadSuccess(true);
      }, 900);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(dutyAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg(isAr ? 'يرجى إدخال مبلغ الرسوم الجمركية بشكل صحيح.' : 'Please enter a valid customs duty amount.');
      return;
    }
    if (!receiptPhotoUrl) {
      setErrorMsg(isAr ? 'يجب إرفاق صورة واضحة لوصل الجمرك الرسمي.' : 'An official tax receipt photo is required.');
      return;
    }

    const record: CustomsDutyRecord = {
      id: `duty-${Date.now()}`,
      shipmentId: shipment.id,
      dutyAmountPaid: parsedAmount,
      dutyCurrency: dutyCurrency,
      receiptPhotoUrl: receiptPhotoUrl,
      receiptNumber: receiptNumber || `REC-CUST-${Math.floor(100000 + Math.random() * 900000)}`,
      recordedAt: new Date().toISOString(),
      customsLocationAr: customsLocation === 'AIRPORT_ALGIERS' ? 'مطار الجزائر (هواري بومدين)' : 'مطار عمّان (الملكة علياء)',
      customsLocationEn: customsLocation === 'AIRPORT_ALGIERS' ? 'Algiers Airport (ALG)' : 'Amman Airport (QAIA)',
      notes: notes || undefined,
      verificationStatus: 'PENDING_HUB_VERIFICATION',
    };

    onSubmitDutyRecord(record);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-start my-8"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          {/* Top Header */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-5 sm:p-6 text-white relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-2xl shrink-0 shadow-lg">
                  🛂
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-900/40 text-amber-100 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider">
                      {isAr ? 'بروتوكول الرسوم الجمركية' : 'Customs Duty Protocol'}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-0.5">
                    {isAr ? 'توثيق الرسوم الجمركية للطرد' : 'Record Incurred Customs Duty'}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Shipment Details Pill */}
            <div className="mt-3 p-2.5 bg-black/20 rounded-2xl border border-white/15 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="text-amber-200 font-mono font-bold">{shipment.trackingNumber}</span>
                <span className="text-slate-300">|</span>
                <span className="text-white truncate font-medium">{shipment.itemDescription}</span>
              </div>
              <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[10px] font-black shrink-0">
                ${shipment.declaredValue}
              </span>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Step 1: Paid Amount & Currency */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                <span>{isAr ? 'المبلغ المالي المدفوع للجمارك' : 'Customs Duty Amount Paid'}</span>
                <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 relative">
                  <input
                    type="number"
                    step="any"
                    required
                    value={dutyAmount}
                    onChange={(e) => setDutyAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <select
                  value={dutyCurrency}
                  onChange={(e) => setDutyCurrency(e.target.value as any)}
                  className="col-span-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="DZD">{isAr ? '🇩🇿 د.ج (DZD)' : '🇩🇿 DZD'}</option>
                  <option value="JOD">{isAr ? '🇯🇴 د.أ (JOD)' : '🇯🇴 JOD'}</option>
                  <option value="USD">{isAr ? '🇺🇸 دولار (USD)' : '🇺🇸 USD'}</option>
                </select>
              </div>
            </div>

            {/* Step 2: Receipt Number & Airport Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                  <Receipt className="w-3 h-3 text-slate-500" />
                  <span>{isAr ? 'رقم وصل الجمرك (Quittance)' : 'Receipt Number #'}</span>
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder={isAr ? 'مثال: REC-ALG-9021' : 'e.g. REC-ALG-9021'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-500" />
                  <span>{isAr ? 'النقطة الجمركية / المطار' : 'Customs Checkpoint'}</span>
                </label>
                <select
                  value={customsLocation}
                  onChange={(e) => setCustomsLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="AIRPORT_ALGIERS">{isAr ? 'مطار الجزائر (ALG)' : 'Algiers Airport (ALG)'}</option>
                  <option value="AIRPORT_AMMAN">{isAr ? 'مطار عمّان (AMM)' : 'Amman Airport (AMM)'}</option>
                  <option value="OTHER">{isAr ? 'منفذ جمركي آخر' : 'Other Checkpoint'}</option>
                </select>
              </div>
            </div>

            {/* Step 3: Photo Upload of Official Customs Tax Receipt */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isAr ? 'صورة وصل الجمرك الرسمي الأصلي' : 'Official Customs Tax Receipt Photo'}</span>
                  <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {isAr ? 'إلزامي للتعويض' : 'Required for Refund'}
                </span>
              </label>

              <div className="p-3.5 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 hover:border-amber-500 transition-colors">
                {receiptPhotoUrl ? (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 max-h-48 flex items-center justify-center">
                      <img
                        src={receiptPhotoUrl}
                        alt="Receipt Proof"
                        className="w-full h-40 object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3">
                        <span className="text-[11px] text-white font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{isAr ? 'تم التقاط صورة الوصل بوضوح' : 'Receipt photo attached'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <label className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors">
                        <Camera className="w-3.5 h-3.5 text-amber-600" />
                        <span>{isAr ? 'إعادة التقاط الصورة 📷' : 'Retake Photo 📷'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleSimulatePhotoUpload}
                          className="hidden"
                        />
                      </label>

                      <span className="text-[10px] font-mono text-slate-400">
                        {isAr ? 'ختم وتاريخ واضحان' : 'Clear Stamp & Date'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center py-6 cursor-pointer space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      {isAr ? 'افتح الكاميرا لالتقاط صورة الوصل' : 'Take photo of official receipt'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isAr ? 'أو اختر ملف صورة من جهازك' : 'or choose an image file'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleSimulatePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Step 4: Notes (Optional) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-800">
                {isAr ? 'ملاحظات إضافية (سبب فرض الجمارك)' : 'Additional Notes / Customs Context'}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isAr ? 'مثال: تم تقدير رسم جمركي إضافي من قبل المفتش على العلبة...' : 'e.g. Assessed duty by customs officer on retail box...'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Step 5: How Reimbursement Works (Clear Guarantee Card) */}
            <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-1.5">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="text-xs font-black text-amber-950">
                  {isAr ? 'كيف يتم تعويضك واسترداد المبلغ؟' : 'How Reimbursement Works:'}
                </span>
              </div>
              <p className="text-[11px] text-amber-900/85 leading-relaxed">
                {isAr
                  ? '1. احتفظ بالوصل الورقي الأصلي.\n2. عند وصولك لفرع التسليم، سلمه للموظف مع الطرد.\n3. يطابق الموظف الوصل مع الصورة المرفوعة، ويتم تحويل المبلغ فوراً لرصيد محفظتك المتاح.'
                  : '1. Keep original paper receipt.\n2. Hand it over to the branch officer along with the parcel upon arrival.\n3. Once matched, the reimbursement is instantly unlocked in your wallet available balance.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-xl shadow-lg shadow-amber-900/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>{isAr ? 'تأكيد وحفظ الوصل الجمركي 🛂' : 'Confirm & Save Receipt 🛂'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
