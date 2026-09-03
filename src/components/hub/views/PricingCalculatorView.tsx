import React, { useState, useId } from 'react';
import {
  Calculator,
  Scale,
  DollarSign,
  Layers,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Hub, Locale, EmployeeNavSection, ShippingRate, DailyExchangeRate } from '../../../types';
import { INITIAL_SHIPPING_RATES, INITIAL_DAILY_EXCHANGE_RATES } from '../../../lib/hubOperationsData';

interface PricingCalculatorViewProps {
  currentHub: Hub;
  locale: Locale;
  shippingRates?: ShippingRate[];
  exchangeRates?: DailyExchangeRate[];
  onNavigate: (section: EmployeeNavSection) => void;
}

export const PricingCalculatorView: React.FC<PricingCalculatorViewProps> = ({
  currentHub,
  locale,
  shippingRates = INITIAL_SHIPPING_RATES,
  exchangeRates = INITIAL_DAILY_EXCHANGE_RATES,
  onNavigate,
}) => {
  const isAr = locale === 'ar';
  const weightInputId = useId();
  const lengthInputId = useId();
  const widthInputId = useId();
  const heightInputId = useId();
  const routeSelectId = useId();
  const categorySelectId = useId();
  const insuranceCheckId = useId();
  const expressCheckId = useId();

  const [originCountry, setOriginCountry] = useState<'JO' | 'DZ'>(currentHub.countryCode === 'DZA' ? 'DZ' : 'JO');
  const [destCountry, setDestCountry] = useState<'JO' | 'DZ'>(currentHub.countryCode === 'DZA' ? 'JO' : 'DZ');
  const [category, setCategory] = useState<'standard' | 'express' | 'documents' | 'fragile'>('standard');
  const [actualWeightKg, setActualWeightKg] = useState<number>(2.5);
  const [lengthCm, setLengthCm] = useState<number>(30);
  const [widthCm, setWidthCm] = useState<number>(20);
  const [heightCm, setHeightCm] = useState<number>(15);
  const [isInsured, setIsInsured] = useState<boolean>(false);
  const [declaredValue, setDeclaredValue] = useState<number>(100);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Volumetric calculation: (L * W * H) / 5000
  const volumetricWeightKg = Number(((lengthCm * widthCm * heightCm) / 5000).toFixed(2));
  const chargeableWeightKg = Math.max(actualWeightKg, volumetricWeightKg);

  // Find rate card from dynamic shippingRates
  const rateCard =
    shippingRates.find(
      (r) => r.originCountry === originCountry && r.destinationCountry === destCountry && r.rateType === 'CUSTOMER_SHIPPING'
    ) || shippingRates[0] || INITIAL_SHIPPING_RATES[0];

  // Base calculation
  const perKgRate = rateCard.ratePerKg;
  const minCharge = rateCard.minimumCharge;
  let basePriceJod = Math.max(minCharge, chargeableWeightKg * perKgRate);

  // Category markup
  let categoryMarkupJod = 0;
  if (category === 'express') categoryMarkupJod = 5;
  if (category === 'fragile') categoryMarkupJod = 4;

  // Insurance calculation (2% of declared value)
  const insuranceFeeJod = isInsured ? Number((declaredValue * 0.02).toFixed(2)) : 0;

  // Subtotal before discount
  const subtotalJod = basePriceJod + categoryMarkupJod + insuranceFeeJod;
  const discountAmountJod = Number(((subtotalJod * discountPercent) / 100).toFixed(2));
  const finalTotalJod = Math.max(0, Number((subtotalJod - discountAmountJod).toFixed(2)));

  // Dynamic currency conversions from exchangeRates
  const dzdPair = exchangeRates.find((r) => (r.baseCurrency === 'DZD' && r.quoteCurrency === 'JOD') || (r.baseCurrency === 'JOD' && r.quoteCurrency === 'DZD'));
  const fxDzdRate = dzdPair ? (dzdPair.baseCurrency === 'DZD' ? (dzdPair.buyRate > 0 ? 1 / dzdPair.buyRate : 188.0) : dzdPair.sellRate) : 188.0;
  const finalTotalDzd = Math.round(finalTotalJod * fxDzdRate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Calculator className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-black text-slate-900">
              {isAr ? 'حاسبة الوزن الحجمي والتسعير المعتمد' : 'Volumetric Weight & Official Pricing Calculator'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'معادلة الآياتا IATA الرسمية: (الطول × العرض × الارتفاع) ÷ 5000، واحتساب الوزن المحاسبي والفروقات تلقائياً.'
              : 'IATA Volumetric Formula: (L × W × H) ÷ 5000. Chargeable weight calculation and official rates.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('ORIGIN_INTAKE')}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
        >
          <span>{isAr ? 'العودة لكاونتر الاستقبال' : 'Back to Intake'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-600" />
            <span>{isAr ? 'بيانات الطرد والأبعاد الهندسية' : 'Package Dimensions & Route'}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Route Selection */}
            <div>
              <label htmlFor={routeSelectId} className="block font-bold text-slate-700 mb-1">
                {isAr ? 'مسار الشحن الدولي:' : 'Route:'}
              </label>
              <select
                id={routeSelectId}
                value={`${originCountry}-${destCountry}`}
                onChange={(e) => {
                  const [orig, dst] = e.target.value.split('-') as ['JO' | 'DZ', 'JO' | 'DZ'];
                  setOriginCountry(orig);
                  setDestCountry(dst);
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              >
                <option value="JO-DZ">{isAr ? 'الأردن (عمّان) ← الجزائر (العاصمة)' : 'Jordan (AMM) → Algeria (ALG)'}</option>
                <option value="DZ-JO">{isAr ? 'الجزائر (العاصمة) ← الأردن (عمّان)' : 'Algeria (ALG) → Jordan (AMM)'}</option>
              </select>
            </div>

            {/* Service Category */}
            <div>
              <label htmlFor={categorySelectId} className="block font-bold text-slate-700 mb-1">
                {isAr ? 'تصنيف الشحنة:' : 'Service Category:'}
              </label>
              <select
                id={categorySelectId}
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              >
                <option value="standard">{isAr ? 'طرد شخصي اعتيادي (قياسي)' : 'Standard Personal Parcel'}</option>
                <option value="express">{isAr ? 'خدمة سريعة VIP ذات أولوية (+5 JOD)' : 'Express Priority (+5 JOD)'}</option>
                <option value="fragile">{isAr ? 'بضائع قابلة للكسر وتحتاج عناية (+4 JOD)' : 'Fragile / Special Care (+4 JOD)'}</option>
                <option value="documents">{isAr ? 'وثائق ومستندات رسمية' : 'Official Documents'}</option>
              </select>
            </div>
          </div>

          {/* Actual Scale Weight */}
          <div className="text-xs">
            <label htmlFor={weightInputId} className="block font-bold text-slate-700 mb-1">
              {isAr ? 'الوزن الفعلي على الميزان (كغم):' : 'Actual Weight from Scale (kg):'}
            </label>
            <div className="relative">
              <input
                id={weightInputId}
                type="number"
                step="0.1"
                min="0.1"
                value={actualWeightKg}
                onChange={(e) => setActualWeightKg(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-900 text-sm"
              />
              <span className="absolute end-3 top-2.5 text-slate-400 font-bold">KG</span>
            </div>
          </div>

          {/* Dimensions */}
          <div className="text-xs space-y-1.5">
            <div className="font-bold text-slate-700">
              {isAr ? 'الأبعاد بالسنتيمتر (الطول × العرض × الارتفاع):' : 'Dimensions in cm (L × W × H):'}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor={lengthInputId} className="text-[11px] text-slate-500 block mb-0.5">
                  {isAr ? 'الطول (L)' : 'Length (L)'}
                </label>
                <input
                  id={lengthInputId}
                  type="number"
                  min="1"
                  value={lengthCm}
                  onChange={(e) => setLengthCm(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center font-bold"
                />
              </div>

              <div>
                <label htmlFor={widthInputId} className="text-[11px] text-slate-500 block mb-0.5">
                  {isAr ? 'العرض (W)' : 'Width (W)'}
                </label>
                <input
                  id={widthInputId}
                  type="number"
                  min="1"
                  value={widthCm}
                  onChange={(e) => setWidthCm(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center font-bold"
                />
              </div>

              <div>
                <label htmlFor={heightInputId} className="text-[11px] text-slate-500 block mb-0.5">
                  {isAr ? 'الارتفاع (H)' : 'Height (H)'}
                </label>
                <input
                  id={heightInputId}
                  type="number"
                  min="1"
                  value={heightCm}
                  onChange={(e) => setHeightCm(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center font-bold"
                />
              </div>
            </div>
          </div>

          {/* Cargo Insurance Options */}
          <div className="pt-2 border-t border-slate-100 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor={insuranceCheckId} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id={insuranceCheckId}
                  type="checkbox"
                  checked={isInsured}
                  onChange={(e) => setIsInsured(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="font-bold text-slate-800">
                  {isAr ? 'تأمين الحماية التكافلية الشاملة (2% من القيمة المعلنة)' : 'Comprehensive Cargo Insurance (2%)'}
                </span>
              </label>

              {isInsured && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{isAr ? 'القيمة المعلنة:' : 'Declared Value:'}</span>
                  <input
                    type="number"
                    value={declaredValue}
                    onChange={(e) => setDeclaredValue(parseFloat(e.target.value) || 0)}
                    className="w-20 p-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono font-bold"
                  />
                  <span className="font-bold text-slate-700">JOD</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Calculation Result & Quotation (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Weight Comparison Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>{isAr ? 'مقارنة الأوزان وفق معايير الطيران' : 'Weight Audit (IATA Standard)'}</span>
            </h2>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  {isAr ? 'الوزن الفعلي' : 'Actual Weight'}
                </span>
                <div className="text-xl font-black text-slate-900 font-mono">{actualWeightKg} kg</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  {isAr ? 'الوزن الحجمي' : 'Volumetric Weight'}
                </span>
                <div className="text-xl font-black text-indigo-700 font-mono">{volumetricWeightKg} kg</div>
              </div>
            </div>

            {/* Chargeable Weight Callout */}
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-900 block">
                  {isAr ? 'الوزن المحاسبي المعتمد للفوترة:' : 'Chargeable Billable Weight:'}
                </span>
                <span className="text-[11px] text-amber-700">
                  {volumetricWeightKg > actualWeightKg
                    ? isAr
                      ? 'تم اعتماد الوزن الحجمي لأنه أكبر من الفعلي'
                      : 'Volumetric weight is applied (greater than actual)'
                    : isAr
                    ? 'تم اعتماد الوزن الفعلي للميزان'
                    : 'Actual scale weight is applied'}
                </span>
              </div>
              <div className="text-2xl font-black text-amber-900 font-mono">{chargeableWeightKg} kg</div>
            </div>
          </div>

          {/* Quotation Breakdown Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? 'عرض السعر الرسمي المعتمد' : 'Official Rate Quotation'}</span>
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>{isAr ? 'رسوم الشحن الأساسية للوزن المحاسبي:' : 'Base Shipping Fee:'}</span>
                <span className="font-mono font-bold text-slate-900">{basePriceJod.toFixed(2)} JOD</span>
              </div>

              {categoryMarkupJod > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>{isAr ? 'رسوم التصنيف الإضافية:' : 'Category Markup:'}</span>
                  <span className="font-mono font-bold text-slate-900">+{categoryMarkupJod.toFixed(2)} JOD</span>
                </div>
              )}

              {isInsured && (
                <div className="flex justify-between text-slate-600">
                  <span>{isAr ? 'رسوم التأمين على البضائع:' : 'Cargo Insurance Fee:'}</span>
                  <span className="font-mono font-bold text-slate-900">+{insuranceFeeJod.toFixed(2)} JOD</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">{isAr ? 'المجموع الإجمالي:' : 'Total Cost:'}</span>
                <div className="text-end">
                  <div className="text-2xl font-black text-emerald-700 font-mono">{finalTotalJod.toFixed(2)} JOD</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">≈ {finalTotalDzd.toLocaleString()} DZD</div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                alert(
                  isAr
                    ? `تم حفظ عرض السعر (${finalTotalJod} JOD) للاستخدام في كاونتر الاستقبال.`
                    : `Quotation (${finalTotalJod} JOD) saved.`
                );
                onNavigate('ORIGIN_INTAKE');
              }}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isAr ? 'اعتماد التسعير وتطبيقه على الشحنة' : 'Apply Rate to Shipment'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
