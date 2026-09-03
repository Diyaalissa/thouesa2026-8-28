import React, { useState } from 'react';
import {
  Coins,
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  CreditCard,
  Building2,
  CheckCircle2,
  Lock,
  Plus,
  Search,
} from 'lucide-react';
import { Hub, Locale, DailyExchangeRate, SettlementRecord, EmployeeNavSection, Currency } from '../../../types';
import { INITIAL_DAILY_EXCHANGE_RATES, INITIAL_SETTLEMENTS } from '../../../lib/hubOperationsData';

interface CurrencySettlementViewProps {
  currentHub: Hub;
  locale: Locale;
  onNavigate: (section: EmployeeNavSection) => void;
}

export const CurrencySettlementView: React.FC<CurrencySettlementViewProps> = ({
  currentHub,
  locale,
  onNavigate,
}) => {
  const isAr = locale === 'ar';
  const [rates, setRates] = useState<DailyExchangeRate[]>(INITIAL_DAILY_EXCHANGE_RATES);
  const [settlements, setSettlements] = useState<SettlementRecord[]>(INITIAL_SETTLEMENTS);
  const [activeTab, setActiveTab] = useState<'DRAWER' | 'RATES' | 'LEDGER'>('DRAWER');

  // Branch Cash Drawer balances
  const [cashDrawer, setCashDrawer] = useState<{ [c in Currency]?: number }>({
    JOD: 845.5,
    DZD: 165400,
    USD: 420.0,
  });

  // Quick Currency Exchange Converter State
  const [fromCurrency, setFromCurrency] = useState<Currency>('JOD');
  const [toCurrency, setToCurrency] = useState<Currency>('DZD');
  const [exchangeAmount, setExchangeAmount] = useState<number>(50);
  const [operationType, setOperationType] = useState<'CUSTOMER_PAYMENT' | 'TRAVELER_PAYOUT'>('CUSTOMER_PAYMENT');

  // Find matching exchange rate
  const directRate = rates.find((r) => r.baseCurrency === fromCurrency && r.quoteCurrency === toCurrency);
  const reverseRate = rates.find((r) => r.baseCurrency === toCurrency && r.quoteCurrency === fromCurrency);

  let convertedResult = 0;
  let appliedRate = 1;

  if (fromCurrency === toCurrency) {
    convertedResult = exchangeAmount;
    appliedRate = 1;
  } else if (directRate) {
    appliedRate = operationType === 'CUSTOMER_PAYMENT' ? directRate.sellRate : directRate.buyRate;
    convertedResult = Number((exchangeAmount * appliedRate).toFixed(2));
  } else if (reverseRate) {
    const baseRate = operationType === 'CUSTOMER_PAYMENT' ? reverseRate.sellRate : reverseRate.buyRate;
    appliedRate = baseRate !== 0 ? Number((1 / baseRate).toFixed(6)) : 1;
    convertedResult = Number((exchangeAmount * appliedRate).toFixed(2));
  } else {
    // Fallback standard proxy calculation
    appliedRate = fromCurrency === 'JOD' && toCurrency === 'DZD' ? 186.5 : fromCurrency === 'DZD' && toCurrency === 'JOD' ? 0.0052 : 1;
    convertedResult = Number((exchangeAmount * appliedRate).toFixed(2));
  }

  const handleRecordSettlement = () => {
    const settlementId = `STL-${Date.now().toString().slice(-6)}`;
    const newRecord: SettlementRecord = {
      id: settlementId,
      settlementNumber: settlementId,
      hubId: currentHub.id,
      hubCode: currentHub.code,
      type: operationType,
      relatedUserId: 'WALK-IN-CLIENT',
      relatedUserName: isAr ? 'عميل كاونتر الفرع' : 'Counter Walk-in Client',
      baseAmount: exchangeAmount,
      baseCurrency: fromCurrency,
      settlementCurrency: toCurrency,
      appliedFxRate: appliedRate,
      fxSide: operationType === 'CUSTOMER_PAYMENT' ? 'SELL' : 'BUY',
      convertedAmount: convertedResult,
      fees: 0,
      adjustments: 0,
      finalAmount: convertedResult,
      status: 'SETTLED',
      idempotencyKey: `IDEMP-${settlementId}-${Date.now()}`,
      processedBy: 'EMP-CURRENT-SHIFT',
      processedByName: isAr ? 'أمين الصندوق (الوردية الحالية)' : 'Cashier (Current Shift)',
      processedAt: new Date().toISOString(),
      notes: isAr ? 'تسوية فورية على كاونتر الفرع' : 'Immediate counter settlement',
    };

    setSettlements([newRecord, ...settlements]);

    // Update cash drawer
    setCashDrawer((prev) => ({
      ...prev,
      [fromCurrency]: (prev[fromCurrency] || 0) + exchangeAmount,
      [toCurrency]: Math.max(0, (prev[toCurrency] || 0) - convertedResult),
    }));

    alert(
      isAr
        ? `تم تسجيل تسوية الخزينة بنجاح برقم ${newRecord.id} وتحديث رصيد الدرج النقدي.`
        : `Settlement ${newRecord.id} recorded and cash drawer updated.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Coins className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-black text-slate-900">
              {isAr ? 'وحدة تسوية العملات والدرج النقدي للفرع' : 'Currency Exchange & Branch Settlement Desk'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'إدارة أسعار الصرف الرسمية (شراء/بيع)، تحصيل رسوم العملاء وصرف أرباح المسافرين، ومطابقة عهدة الخزينة اليومية.'
              : 'Multi-currency settlement: customer collection, traveler payout, FX rates, and cash drawer.'}
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('DRAWER')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'DRAWER' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isAr ? 'الخزينة والتحويل' : 'Cash Drawer & FX'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('RATES')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'RATES' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isAr ? 'أسعار الصرف اليومية' : 'Daily FX Rates'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('LEDGER')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'LEDGER' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isAr ? 'دفتر التسويات' : 'Settlement Ledger'}
          </button>
        </div>
      </div>

      {/* Cash Drawer KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">{isAr ? 'رصيد الخزينة (JOD):' : 'Drawer (JOD):'}</span>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{(cashDrawer.JOD || 0).toFixed(2)}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
            JOD
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">{isAr ? 'رصيد الخزينة (DZD):' : 'Drawer (DZD):'}</span>
            <div className="text-2xl font-black text-emerald-700 mt-1 font-mono">
              {(cashDrawer.DZD || 0).toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
            DZD
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500">{isAr ? 'رصيد الخزينة (USD):' : 'Drawer (USD):'}</span>
            <div className="text-2xl font-black text-blue-700 mt-1 font-mono">{(cashDrawer.USD || 0).toFixed(2)}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
            USD
          </div>
        </div>
      </div>

      {/* TAB 1: DRAWER & FX CONVERSION */}
      {activeTab === 'DRAWER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Quick Settlement Converter (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? 'تنفيذ تسوية عملة أو صرف نقدي' : 'Branch FX & Settlement Desk'}</span>
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  {isAr ? 'طبيعة العملية النقدية:' : 'Transaction Type:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOperationType('CUSTOMER_PAYMENT')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      operationType === 'CUSTOMER_PAYMENT'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {isAr ? 'تحصيل من عميل (سعر بيع الفرع)' : 'Customer Collection (Sell Rate)'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOperationType('TRAVELER_PAYOUT')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      operationType === 'TRAVELER_PAYOUT'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 ring-1 ring-blue-500'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    {isAr ? 'صرف أرباح مسافر (سعر شراء الفرع)' : 'Traveler Payout (Buy Rate)'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'المبلغ والعملة المدفوعة:' : 'Amount Received:'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={exchangeAmount}
                      onChange={(e) => setExchangeAmount(parseFloat(e.target.value) || 0)}
                      className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-900"
                    />
                    <select
                      value={fromCurrency}
                      onChange={(e) => setFromCurrency(e.target.value as Currency)}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
                    >
                      <option value="JOD">JOD</option>
                      <option value="DZD">DZD</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'العملة المستهدفة بالصرف:' : 'Disbursed Currency:'}
                  </label>
                  <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value as Currency)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono"
                  >
                    <option value="DZD">DZD (دينار جزائري)</option>
                    <option value="JOD">JOD (دينار أردني)</option>
                    <option value="USD">USD (دولار أمريكي)</option>
                  </select>
                </div>
              </div>

              {/* Conversion Preview */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block">
                    {isAr ? 'سعر الصرف المطبق:' : 'Applied Exchange Rate:'}
                  </span>
                  <div className="font-mono font-bold text-slate-800">
                    1 {fromCurrency} = {appliedRate.toFixed(4)} {toCurrency}
                  </div>
                </div>
                <div className="text-end">
                  <span className="text-[11px] text-slate-500 block">
                    {isAr ? 'المبلغ المستحق صرفه:' : 'Disbursed Amount:'}
                  </span>
                  <div className="text-xl font-black text-emerald-700 font-mono">
                    {convertedResult.toLocaleString()} {toCurrency}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRecordSettlement}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAr ? 'تأكيد وقيد التسوية في الخزينة' : 'Confirm & Post to Drawer'}</span>
              </button>
            </div>
          </div>

          {/* Reconciliation Audit Info (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2">
                {isAr ? 'سياسة تسوية العملات بالفرع' : 'Branch FX Compliance Policy'}
              </h3>
              <ul className="text-slate-600 space-y-2 list-disc ps-4 text-[11px]">
                <li>
                  {isAr
                    ? 'يتم تحديث أسعار الصرف مركزياً يومياً الساعة 08:00 صباحاً بتوقيت كل فرع.'
                    : 'FX rates updated centrally at 08:00 AM daily.'}
                </li>
                <li>
                  {isAr
                    ? 'سعر تحصيل العميل يضمن هامش أمان بنكي بنسبة 1.5% لتغطية تقلبات الصرف.'
                    : 'Customer rate includes 1.5% bank buffer spread.'}
                </li>
                <li>
                  {isAr
                    ? 'صرف أرباح المسافر يتم وفق سعر الشراء المعتمد وقت إصدار المانيفست.'
                    : 'Traveler payouts locked at manifest issuance rate.'}
                </li>
                <li>
                  {isAr
                    ? 'يتم إقفال الدرج النقدي وتسليمه في نهاية كل وردية عمل ومطابقته محاسبياً.'
                    : 'Cash drawer reconciled at the end of every shift.'}
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAILY FX RATES TABLE */}
      {activeTab === 'RATES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800">
              {isAr ? 'جدول أسعار الصرف الرسمية المعتمدة لليوم' : 'Official Daily FX Rates Table'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-start">{isAr ? 'زوج العملات' : 'Currency Pair'}</th>
                  <th className="p-3 text-start">{isAr ? 'سعر شراء الفرع (لأرباح المسافر)' : 'Branch Buy (Traveler Payout)'}</th>
                  <th className="p-3 text-start">{isAr ? 'سعر بيع الفرع (لتحصيل العميل)' : 'Branch Sell (Customer Charge)'}</th>
                  <th className="p-3 text-start">{isAr ? 'النطاق' : 'Scope'}</th>
                  <th className="p-3 text-start">{isAr ? 'تاريخ التفعيل' : 'Effective From'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {rates.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors font-medium">
                    <td className="p-3 font-mono font-bold text-slate-900">
                      {r.baseCurrency}/{r.quoteCurrency}
                    </td>
                    <td className="p-3 font-mono font-bold text-blue-700">{r.buyRate}</td>
                    <td className="p-3 font-mono font-bold text-emerald-700">{r.sellRate}</td>
                    <td className="p-3 font-mono text-slate-500">{r.countryScope}</td>
                    <td className="p-3 text-slate-400 text-[11px]">{new Date(r.effectiveFrom).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SETTLEMENT LEDGER */}
      {activeTab === 'LEDGER' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800">
              {isAr ? 'سجل التسويات والعمليات النقدية المنفذة' : 'Settlement Ledger History'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-start">{isAr ? 'رقم التسوية' : 'Settlement ID'}</th>
                  <th className="p-3 text-start">{isAr ? 'نوع الحركة' : 'Type'}</th>
                  <th className="p-3 text-start">{isAr ? 'المبلغ الأساسي' : 'Base Amount'}</th>
                  <th className="p-3 text-start">{isAr ? 'المبلغ المحوّل' : 'Converted'}</th>
                  <th className="p-3 text-start">{isAr ? 'سعر الصرف' : 'Rate'}</th>
                  <th className="p-3 text-start">{isAr ? 'المرجع / المستخدم' : 'Reference'}</th>
                  <th className="p-3 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {settlements.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-900">{s.settlementNumber || s.id}</td>
                    <td className="p-3 font-bold text-slate-700">
                      {s.type === 'CUSTOMER_PAYMENT'
                        ? (isAr ? 'تحصيل من عميل' : 'Customer Collection')
                        : (isAr ? 'صرف أرباح مسافر' : 'Traveler Payout')}
                    </td>
                    <td className="p-3 font-mono text-emerald-800 font-bold">
                      {s.baseAmount} {s.baseCurrency}
                    </td>
                    <td className="p-3 font-mono text-blue-800 font-bold">
                      {s.convertedAmount} {s.settlementCurrency}
                    </td>
                    <td className="p-3 font-mono text-slate-600">{s.appliedFxRate}</td>
                    <td className="p-3 font-mono text-slate-500">{s.trackingNumber || s.flightNumber || s.relatedUserName}</td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
