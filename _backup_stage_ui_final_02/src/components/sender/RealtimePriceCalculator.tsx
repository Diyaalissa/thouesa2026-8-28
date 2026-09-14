import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calculator, Plane, ShieldCheck, ArrowRight, ArrowLeft, Sparkles, Scale, Info } from 'lucide-react';
import { Currency, Hub } from '../../types';
import { convertCurrency, formatCurrency } from '../../lib/crypto';
import { HUBS_DATA } from '../../lib/constants';

interface RealtimePriceCalculatorProps {
  isAr: boolean;
  selectedCurrency: Currency;
  activeHubs?: Hub[];
  onStartShipmentWithQuote?: (quote: { originHubId: string; destHubId: string; weightKg: number }) => void;
}

export const RealtimePriceCalculator: React.FC<RealtimePriceCalculatorProps> = ({
  isAr,
  selectedCurrency,
  activeHubs = HUBS_DATA,
  onStartShipmentWithQuote,
}) => {
  const [originHubId, setOriginHubId] = useState<string>('hub-amm');
  const [destHubId, setDestHubId] = useState<string>('hub-alg');
  const [weightKg, setWeightKg] = useState<number>(1.5);
  const [itemType, setItemType] = useState<'PERSONAL_USED' | 'NEW_GIFTS' | 'ELECTRONICS'>('PERSONAL_USED');

  // Instant reactive price calculation
  const quote = useMemo(() => {
    if (!weightKg || weightKg <= 0) return null;

    // Base rate per kg depending on route
    const isJorDza = (originHubId.includes('amm') && destHubId.includes('alg')) || (originHubId.includes('alg') && destHubId.includes('amm'));
    const ratePerKg = isJorDza ? 14.0 : 18.0;
    
    // Base shipping cost in USD
    const baseShippingUsd = Math.max(15, weightKg * ratePerKg);
    const handlingFeeUsd = 3.0;
    const totalShippingUsd = baseShippingUsd + handlingFeeUsd;

    // Customs estimate: Personal Used = 0% exempt
    const isCustomsExempt = itemType === 'PERSONAL_USED';
    const estimatedCustomsUsd = isCustomsExempt ? 0 : itemType === 'NEW_GIFTS' ? 12.0 : 25.0;

    // Converted amounts to selected currency
    const totalConverted = convertCurrency(totalShippingUsd, selectedCurrency);
    const formattedTotal = formatCurrency(totalConverted, selectedCurrency);

    return {
      totalShippingUsd,
      totalConverted,
      formattedTotal,
      isCustomsExempt,
      estimatedCustomsUsd,
      transitHours: '24-48h',
    };
  }, [originHubId, destHubId, weightKg, itemType, selectedCurrency]);

  const presetWeights = [0.5, 1.0, 2.0, 5.0];

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 md:p-6 shadow-sm relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <Calculator className="w-36 h-36 text-slate-900" />
      </div>

      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-slate-800">
              {isAr ? 'حاسبة الأسعار المدمجة واللحظية' : 'Real-time Price Calculator'}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {isAr ? 'تقدير فوري لتكلفة الشحن الجوي مع المسافرين' : 'Instant estimate for verified air travel shipping'}
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black border border-emerald-200/60 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-500" />
          {isAr ? 'حساب لحظي 100%' : 'Instant UI'}
        </span>
      </div>

      {/* Reactive Form Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 relative z-10">
        {/* Origin Hub */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
            {isAr ? 'من بلد / فرع الإرسال' : 'From Origin'}
          </label>
          <select
            value={originHubId}
            onChange={(e) => setOriginHubId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
          >
            <option value="hub-amm">{isAr ? '🇯🇴 عمّان - المركز الرئيسي' : '🇯🇴 Amman - Central Hub'}</option>
            <option value="hub-alg">{isAr ? '🇩🇿 الجزائر العاصمة - فرع حيدرة' : '🇩🇿 Algiers - Hydra Hub'}</option>
            <option value="hub-orn">{isAr ? '🇩🇿 وهران - فرع الباهية' : '🇩🇿 Oran - Hub'}</option>
          </select>
        </div>

        {/* Destination Hub */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
            {isAr ? 'إلى بلد / فرع الاستلام' : 'To Destination'}
          </label>
          <select
            value={destHubId}
            onChange={(e) => setDestHubId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all cursor-pointer"
          >
            <option value="hub-alg">{isAr ? '🇩🇿 الجزائر العاصمة - فرع حيدرة' : '🇩🇿 Algiers - Hydra Hub'}</option>
            <option value="hub-orn">{isAr ? '🇩🇿 وهران - فرع الباهية' : '🇩🇿 Oran - Hub'}</option>
            <option value="hub-amm">{isAr ? '🇯🇴 عمّان - المركز الرئيسي' : '🇯🇴 Amman - Central Hub'}</option>
          </select>
        </div>

        {/* Weight input with presets */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-slate-600">
              {isAr ? 'الوزن التقريبي (كجم)' : 'Weight (kg)'}
            </label>
            <span className="text-[10px] text-slate-400 font-bold">{weightKg} kg</span>
          </div>
          <div className="relative">
            <input
              type="number"
              min="0.1"
              max="30"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              placeholder="1.5"
            />
            <Scale className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Quick Weight Presets */}
      <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
        <span className="text-[10px] font-bold text-slate-400 shrink-0">
          {isAr ? 'أوزان شائعة:' : 'Quick Presets:'}
        </span>
        {presetWeights.map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => setWeightKg(w)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              weightKg === w
                ? 'bg-emerald-600 text-white shadow-sm scale-105'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {w} kg
          </button>
        ))}
      </div>

      {/* Instant Reactive Results Box */}
      <AnimatePresence mode="wait">
        {quote && (
          <motion.div
            key={`${originHubId}-${destHubId}-${weightKg}-${selectedCurrency}`}
            initial={{ opacity: 0, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-5 bg-gradient-to-br from-emerald-50 via-teal-50/60 to-emerald-50/30 border border-emerald-200/80 rounded-2xl p-4 md:p-5 relative overflow-hidden"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-800">
                    {isAr ? 'التكلفة التقديرية للشحن:' : 'Estimated Shipping Cost:'}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-200/70 text-emerald-900 text-[10px] font-black rounded-md">
                    {quote.transitHours}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-black text-emerald-950 tracking-tight">
                    {quote.formattedTotal}
                  </span>
                  <span className="text-xs font-bold text-emerald-700/80">
                    (${quote.totalShippingUsd.toFixed(2)} USD)
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-emerald-700/90 pt-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {quote.isCustomsExempt
                      ? (isAr ? 'أمانات ومقتنيات شخصية: معفاة جمركياً (0%)' : 'Personal items: Customs exempt (0%)')
                      : (isAr ? 'تطبق الرسوم الجمركية الرسمية' : 'Standard customs apply')}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0 flex items-center gap-2">
                {onStartShipmentWithQuote && (
                  <button
                    onClick={() => onStartShipmentWithQuote({ originHubId, destHubId, weightKg })}
                    className="w-full md:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs md:text-sm font-black shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <span>{isAr ? 'ابدأ الشحن بهذا السعر' : 'Ship with this Quote'}</span>
                    {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
