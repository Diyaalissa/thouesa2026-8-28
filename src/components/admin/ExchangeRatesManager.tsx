import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  RefreshCw,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Sliders,
  DollarSign,
  ArrowRightLeft,
  Clock,
  UserCheck,
} from 'lucide-react';
import { Locale } from '../../types';

interface CurrencyDetail {
  code: string;
  nameAr: string;
  nameEn: string;
  symbol: string;
  rateToUsd: number;
  lastUpdated: string;
  updatedBy: string;
  isManualOverride: boolean;
}

interface ExchangeRatesManagerProps {
  locale: Locale;
  onRefreshGlobalState?: () => void;
}

export const ExchangeRatesManager: React.FC<ExchangeRatesManagerProps> = ({
  locale,
  onRefreshGlobalState,
}) => {
  const isAr = locale === 'ar';
  const [currencies, setCurrencies] = useState<CurrencyDetail[]>([]);
  const [draftRates, setDraftRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Live Conversion Simulator State
  const [simUsdAmount, setSimUsdAmount] = useState<number>(100);

  const fetchLiveRates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/rates');
      const data = await res.json();
      if (data.success && data.supportedCurrencies) {
        setCurrencies(data.supportedCurrencies);
        const draft: Record<string, number> = {};
        data.supportedCurrencies.forEach((c: CurrencyDetail) => {
          draft[c.code] = c.rateToUsd;
        });
        setDraftRates(draft);
      }
    } catch (err) {
      console.error('Error fetching rates:', err);
      setFeedbackMessage({
        type: 'error',
        text: isAr ? 'فشل تحميل أسعار الصرف الحالية' : 'Failed to load exchange rates',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveRates();
  }, []);

  const handleRateInputChange = (code: string, value: string) => {
    const num = parseFloat(value);
    setDraftRates((prev) => ({
      ...prev,
      [code]: isNaN(num) ? 0 : num,
    }));
  };

  const handleSaveSingleRate = async (code: string) => {
    const rateToUsd = draftRates[code];
    if (!rateToUsd || rateToUsd <= 0) {
      setFeedbackMessage({
        type: 'error',
        text: isAr ? 'يرجى إدخال سعر صرف صالح أكبر من الصفر' : 'Please enter a valid positive rate',
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/rates/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency: code,
          rateToUsd,
          adminId: 'usr-admin-001',
          adminName: 'المسؤول المركزي (Master Admin)',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMessage({
          type: 'success',
          text: isAr
            ? `تم تحديث سعر صرف ${code} بنجاح إلى (${rateToUsd}) مقابل الدولار`
            : `Successfully updated ${code} exchange rate to ${rateToUsd} / USD`,
        });
        await fetchLiveRates();
        onRefreshGlobalState?.();
        setTimeout(() => setFeedbackMessage(null), 5000);
      } else {
        setFeedbackMessage({
          type: 'error',
          text: data.error || (isAr ? 'فشل تحديث سعر الصرف' : 'Failed to update rate'),
        });
      }
    } catch (err) {
      console.error(err);
      setFeedbackMessage({
        type: 'error',
        text: isAr ? 'خطأ في الاتصال بالخادم أثناء حفظ السعر' : 'Network error while saving rate',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAllBatch = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/rates/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rates: draftRates,
          adminId: 'usr-admin-001',
          adminName: 'المسؤول المركزي (Master Admin)',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMessage({
          type: 'success',
          text: isAr
            ? 'تم حفظ واعتماد كافة أسعار الصرف المعدلة وتثبيتها بنجاح'
            : 'All exchange rates batch updated and locked successfully',
        });
        await fetchLiveRates();
        onRefreshGlobalState?.();
        setTimeout(() => setFeedbackMessage(null), 5000);
      } else {
        setFeedbackMessage({
          type: 'error',
          text: data.error || (isAr ? 'فشل حفظ التعديلات' : 'Failed to batch update'),
        });
      }
    } catch (err) {
      console.error(err);
      setFeedbackMessage({
        type: 'error',
        text: isAr ? 'خطأ في الاتصال بالخادم أثناء التحديث الجماعي' : 'Network error updating rates',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToBaseline = async () => {
    if (
      !window.confirm(
        isAr
          ? 'هل أنت متأكد من رغبتك في إعادة تعيين كافة أسعار الصرف إلى القيم المرجعية للنظام؟'
          : 'Are you sure you want to reset all exchange rates to system default baseline?'
      )
    ) {
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/rates/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: 'usr-admin-001',
          adminName: 'المسؤول المركزي (Master Admin)',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMessage({
          type: 'success',
          text: isAr
            ? 'تمت استعادة أسعار الصرف المرجعية الأصلية بنجاح'
            : 'Default baseline rates successfully restored',
        });
        await fetchLiveRates();
        onRefreshGlobalState?.();
        setTimeout(() => setFeedbackMessage(null), 5000);
      }
    } catch (err) {
      console.error(err);
      setFeedbackMessage({
        type: 'error',
        text: isAr ? 'خطأ في إعادة الضبط' : 'Reset error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 text-xs" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isAr ? 'إدارة والتحكم في أسعار الصرف وتثبيت الهوامش' : 'Multi-Currency Exchange Rates & Corridor Locks'}
              </h3>
              <p className="text-slate-500 text-xs">
                {isAr
                  ? 'تحكم مركزي مباشر في أسعار صرف العملات مقابل الدولار (USD) لحماية المعاملات ومحافظ الضمان من تقلبات السوق.'
                  : 'Live administrative control over platform multi-currency conversion rates and escrow lock anchors.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchLiveRates}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isAr ? 'تحديث الأسعار' : 'Refresh Rates'}</span>
          </button>

          <button
            onClick={handleResetToBaseline}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl transition-colors border border-rose-200 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isAr ? 'إعادة الضبط للمعيار' : 'Reset Baseline'}</span>
          </button>

          <button
            onClick={handleSaveAllBatch}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ كافة الأسعار' : 'Batch Save All')}</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Grid of Controllable Currencies */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currencies.map((curr) => {
          const currentDraft = draftRates[curr.code] !== undefined ? draftRates[curr.code] : curr.rateToUsd;
          const isModified = currentDraft !== curr.rateToUsd;

          return (
            <div
              key={curr.code}
              className={`p-5 rounded-2xl border transition-all ${
                isModified
                  ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Currency Top Info */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-sm shadow-2xs">
                    {curr.symbol}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {isAr ? curr.nameAr : curr.nameEn}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500 font-semibold uppercase">
                      {curr.code} / USD
                    </span>
                  </div>
                </div>

                {curr.isManualOverride && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold text-[10px] rounded-md border border-purple-200">
                    {isAr ? 'تعديل إداري' : 'Manual Override'}
                  </span>
                )}
              </div>

              {/* Editable Rate Input */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-700">
                    {isAr ? 'سعر الصرف (1 دولار =)' : 'Exchange Rate (1 USD =)'}
                  </label>
                  {isModified && (
                    <span className="text-[10px] font-bold text-amber-700">
                      {isAr ? 'قيمة معدلة لم تُحفظ بعد' : 'Unsaved change'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.001"
                      min="0.0001"
                      disabled={curr.code === 'USD'}
                      value={curr.code === 'USD' ? 1.0 : currentDraft}
                      onChange={(e) => handleRateInputChange(curr.code, e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-base font-black rounded-xl border font-mono transition-all ${
                        curr.code === 'USD'
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : isModified
                          ? 'bg-white text-brand-600 border-brand-500 ring-2 ring-brand-500/20'
                          : 'bg-white text-slate-900 border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                      }`}
                    />
                    <span
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none"
                    >
                      {curr.code}
                    </span>
                  </div>

                  {curr.code !== 'USD' && (
                    <button
                      onClick={() => handleSaveSingleRate(curr.code)}
                      disabled={isSaving}
                      className="px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                      title={isAr ? 'حفظ هذا السعر' : 'Save this rate'}
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isAr ? 'حفظ' : 'Save'}</span>
                    </button>
                  )}
                </div>

                {/* Calculation Quick Preview */}
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600">
                  <span>
                    $100 USD = <strong className="text-slate-900 font-mono">{(100 * currentDraft).toFixed(2)} {curr.symbol}</strong>
                  </span>
                  <span>
                    10 {curr.symbol} = <strong className="text-slate-900 font-mono">${(10 / (currentDraft || 1)).toFixed(2)} USD</strong>
                  </span>
                </div>

                {/* Metadata info */}
                <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(curr.lastUpdated).toLocaleTimeString(isAr ? 'ar-JO' : 'en-US')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    <span>{curr.updatedBy || 'System'}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Conversion Simulator Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 border border-slate-700 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-brand-400" />
            <div>
              <h4 className="font-bold text-sm">
                {isAr ? 'محاكي واختبار تسعير العملات الفوري' : 'Live Multi-Currency Conversion Simulator'}
              </h4>
              <p className="text-slate-400 text-[11px]">
                {isAr
                  ? 'اختبر كيف ستظهر الأسعار المحسوبة للعملاء والمسافرين في جميع الدول بالأسعار الجديدة'
                  : 'Test calculated payouts and fees for clients and travelers in local currencies.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-300 text-xs font-semibold">{isAr ? 'المبلغ بالدولار:' : 'Test USD Amount:'}</span>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={simUsdAmount}
                onChange={(e) => setSimUsdAmount(Math.max(1, Number(e.target.value) || 1))}
                className="w-28 px-3 py-1.5 bg-slate-950 text-emerald-400 font-mono font-bold text-sm rounded-lg border border-slate-700 text-center"
              />
              <span className="absolute end-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-4">
          {currencies.map((curr) => {
            const activeRate = draftRates[curr.code] || curr.rateToUsd;
            const converted = (simUsdAmount * activeRate).toFixed(2);
            return (
              <div key={curr.code} className="p-3 bg-slate-950/60 rounded-xl border border-slate-700 text-center space-y-1">
                <span className="text-slate-400 text-[10px] block font-semibold">{curr.nameAr}</span>
                <div className="text-sm font-black font-mono text-emerald-400">
                  {converted}
                </div>
                <span className="text-slate-400 text-[10px] font-mono">{curr.code}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
