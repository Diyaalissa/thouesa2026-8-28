import React, { useState } from 'react';
import { RefreshCw, ArrowRightLeft, DollarSign, X, Check } from 'lucide-react';
import { Locale } from '../../types';

interface CurrencyExchangeWidgetProps {
  locale: Locale;
  isModal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export const CurrencyExchangeWidget: React.FC<CurrencyExchangeWidgetProps> = ({
  locale,
  isModal = false,
  isOpen = true,
  onClose,
}) => {
  const isAr = locale === 'ar';

  const [amount, setAmount] = useState<number>(100);
  const [baseCurrency, setBaseCurrency] = useState<'USD' | 'JOD' | 'DZD'>('USD');

  if (isModal && !isOpen) return null;

  // Fixed conversion rates
  // 1 USD = 0.709 JOD = 134.50 DZD
  // 1 JOD = 1.41 USD = 189.70 DZD
  // 1 DZD = 0.0074 USD = 0.00527 JOD
  const calculateRates = (val: number, base: 'USD' | 'JOD' | 'DZD') => {
    let usd = 0;
    let jod = 0;
    let dzd = 0;

    if (base === 'USD') {
      usd = val;
      jod = val * 0.709;
      dzd = val * 134.5;
    } else if (base === 'JOD') {
      usd = val * 1.4104;
      jod = val;
      dzd = val * 189.703;
    } else if (base === 'DZD') {
      usd = val * 0.007435;
      jod = val * 0.005271;
      dzd = val;
    }

    return { usd, jod, dzd };
  };

  const rates = calculateRates(amount || 0, baseCurrency);

  const content = (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header with quick swap indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <h3 className="font-black text-sm text-slate-900">{isAr ? 'محول العملات السريع' : 'Quick Currency Exchange'}</h3>
            <span className="text-[10px] text-slate-400 font-mono">1 USD ≈ 0.71 JOD ≈ 134.5 DZD</span>
          </div>
        </div>

        {isModal && onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Currency Switcher Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
        {[
          { code: 'USD', label: 'USD ($)', flag: '🇺🇸' },
          { code: 'JOD', label: 'JOD (د.أ)', flag: '🇯🇴' },
          { code: 'DZD', label: 'DZD (د.ج)', flag: '🇩🇿' },
        ].map((item) => (
          <button
            key={item.code}
            onClick={() => setBaseCurrency(item.code as any)}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              baseCurrency === item.code
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>{item.flag}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Amount Input */}
      <div className="relative">
        <label className="text-[11px] font-bold text-slate-500 mb-1 block">
          {isAr ? 'المبلغ المراد تحويله:' : 'Enter Amount:'}
        </label>
        <div className="relative flex items-center">
          <input
            type="number"
            min="0"
            step="any"
            value={amount === 0 ? '' : amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-base font-black text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
            placeholder="0.00"
          />
          <span className="absolute end-4 text-xs font-mono font-bold text-slate-400 pointer-events-none">
            {baseCurrency}
          </span>
        </div>
      </div>

      {/* Real-time Results Cards */}
      <div className="space-y-2 pt-1">
        {baseCurrency !== 'USD' && (
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-base">🇺🇸</span>
              <div>
                <span className="text-xs font-bold text-slate-800 block">USD (دولار أمريكي)</span>
                <span className="text-[10px] text-slate-400 font-mono">International Standard</span>
              </div>
            </div>
            <span className="text-base font-black text-slate-900 font-mono">
              ${rates.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {baseCurrency !== 'JOD' && (
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-base">🇯🇴</span>
              <div>
                <span className="text-xs font-bold text-slate-800 block">JOD (دينار أردني)</span>
                <span className="text-[10px] text-slate-400 font-mono">Amman Hub Rate</span>
              </div>
            </div>
            <span className="text-base font-black text-slate-900 font-mono">
              {rates.jod.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-slate-500 font-bold">JOD</span>
            </span>
          </div>
        )}

        {baseCurrency !== 'DZD' && (
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-base">🇩🇿</span>
              <div>
                <span className="text-xs font-bold text-slate-800 block">DZD (دينار جزائري)</span>
                <span className="text-[10px] text-slate-400 font-mono">Algiers Hub Rate</span>
              </div>
            </div>
            <span className="text-base font-black text-slate-900 font-mono">
              {rates.dzd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} <span className="text-xs text-slate-500 font-bold">DZD</span>
            </span>
          </div>
        )}
      </div>

      <div className="text-[10px] text-slate-400 text-center pt-1 font-medium">
        {isAr ? 'أسعار الصرف الرسمية المعتمدة لعمليات الاستلام والتسليم' : 'Official operational exchange rate between Jordan & Algeria hubs'}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden bg-slate-900/60 backdrop-blur-xs">
        <div className="flex-1 w-full" onClick={onClose} />
        <div className="w-full bg-white rounded-t-3xl p-6 pb-8 shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-200">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
      {content}
    </div>
  );
};
