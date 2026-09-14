import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  X, 
  PlusCircle, 
  CheckCircle2, 
  CreditCard, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Zap, 
  Sparkles,
  Building,
  Smartphone
} from 'lucide-react';
import { Currency } from '../../types';
import { convertCurrency, formatCurrency } from '../../lib/crypto';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAr: boolean;
  currentBalance: number;
  selectedCurrency: Currency;
  onTopUpSuccess: (amountUsd: number) => void;
}

export const TopUpModal: React.FC<TopUpModalProps> = ({
  isOpen,
  onClose,
  isAr,
  currentBalance,
  selectedCurrency,
  onTopUpSuccess,
}) => {
  const [amount, setAmount] = useState<number>(50);
  const [paymentMethod, setPaymentMethod] = useState<'CLIQ' | 'EDAHABIA' | 'CARD' | 'CASH'>('CLIQ');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const presets = [20, 50, 100, 200];

  const handleConfirmTopUp = async () => {
    if (amount <= 0 || isProcessing) return;
    setIsProcessing(true);

    // Simulate instant wallet topup processing
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setIsProcessing(false);
    setIsSuccess(true);

    setTimeout(() => {
      onTopUpSuccess(amount);
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  const convertedAmount = convertCurrency(amount, selectedCurrency);
  const formattedConverted = formatCurrency(convertedAmount, selectedCurrency);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl z-10 border border-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">
                  {isAr ? 'شحن رصيد المحفظة الضامنة' : 'Top Up Escrow Wallet'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {isAr ? 'إيداع فوري وآمن 100% لإجراء المدفوعات والطلبات' : 'Instant and secure funds deposit for escrow payments'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isSuccess ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-12 text-center"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black text-slate-900 mb-1">
                {isAr ? 'تم شحن الرصيد بنجاح!' : 'Top Up Successful!'}
              </h4>
              <p className="text-sm text-slate-500 font-medium">
                {isAr
                  ? `تمت إضافة ${formattedConverted} إلى محفظتك بنجاح.`
                  : `Added ${formattedConverted} to your wallet.`}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-5 pt-4">
              {/* Amount Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {isAr ? 'حدد مبلغ الإيداع (USD)' : 'Select Deposit Amount (USD)'}
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {presets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAmount(p)}
                      className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        amount === p
                          ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20 scale-105'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      ${p}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="5"
                    max="5000"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-8 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-black text-slate-900 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                  <div className="absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                    ≈ {formattedConverted}
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {isAr ? 'طريقة الدفع المباشر' : 'Payment Method'}
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CLIQ')}
                    className={`p-3 rounded-2xl border text-start flex items-center gap-2.5 transition-all cursor-pointer ${
                      paymentMethod === 'CLIQ'
                        ? 'border-brand-500 bg-brand-50/50 text-brand-900 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-brand-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">CliQ (الأردن 🇯🇴)</div>
                      <div className="text-[10px] text-slate-500">تحويل فوري بدون عمولة</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('EDAHABIA')}
                    className={`p-3 rounded-2xl border text-start flex items-center gap-2.5 transition-all cursor-pointer ${
                      paymentMethod === 'EDAHABIA'
                        ? 'border-brand-500 bg-brand-50/50 text-brand-900 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">الذهبية / CIB (الجزائر 🇩🇿)</div>
                      <div className="text-[10px] text-slate-500">دفع إلكتروني آمن</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-3 rounded-2xl border text-start flex items-center gap-2.5 transition-all cursor-pointer ${
                      paymentMethod === 'CARD'
                        ? 'border-brand-500 bg-brand-50/50 text-brand-900 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">بطاقة Visa / Mastercard</div>
                      <div className="text-[10px] text-slate-500">دولي وسريع</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-3 rounded-2xl border text-start flex items-center gap-2.5 transition-all cursor-pointer ${
                      paymentMethod === 'CASH'
                        ? 'border-brand-500 bg-brand-50/50 text-brand-900 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Building className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">إيداع نقدي بالفرع</div>
                      <div className="text-[10px] text-slate-500">عبر أمين الصندوق</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Escrow Guarantee Notice */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-slate-600">
                <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0" />
                <span>
                  {isAr
                    ? 'رصيدك محمي ومحفوظ في حساب الضمان (Escrow) ولا يتم تحريره للمسافر إلا بعد تأكيد استلام الشحنة سالمة.'
                    : 'Your balance is protected in Escrow and released only after delivery confirmation.'}
                </span>
              </div>

              {/* Submit CTA with Micro-loader */}
              <button
                type="button"
                onClick={handleConfirmTopUp}
                disabled={isProcessing || amount <= 0}
                className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer active:scale-98"
              >
                {isProcessing ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>{isAr ? 'جاري معالجة الإيداع الآمن...' : 'Processing Secure Deposit...'}</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-5 h-5" />
                    <span>
                      {isAr ? `تأكيد شحن $${amount} USD` : `Confirm Top Up $${amount} USD`}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
