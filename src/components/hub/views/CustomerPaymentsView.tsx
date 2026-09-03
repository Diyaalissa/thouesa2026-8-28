import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  DollarSign,
  ArrowRight,
  Clock,
  Lock,
  CheckCircle2,
  AlertCircle,
  Coins,
  ShieldCheck,
  User,
  Package,
  Printer,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  Hub,
  Locale,
  Shipment,
  DailyExchangeRate,
  SettlementRecord,
  Currency,
  ShippingRate,
  User as UserType,
} from '../../../types';
import { StatusBadge } from '../common/StatusBadge';
import { calculateCustomerShippingPreview } from '../../../lib/hubFinancialPreview';
import { INITIAL_SHIPPING_RATES } from '../../../lib/hubOperationsData';

export interface CustomerPaymentsViewProps {
  shipments: Shipment[];
  exchangeRates: DailyExchangeRate[];
  shippingRates?: ShippingRate[];
  currentHub: Hub;
  currentUser: UserType;
  locale: Locale;
  onRecordSettlement: (record: SettlementRecord) => void;
  onViewReceipt?: (record: SettlementRecord) => void;
}

export const CustomerPaymentsView: React.FC<CustomerPaymentsViewProps> = ({
  shipments,
  exchangeRates,
  shippingRates = INITIAL_SHIPPING_RATES,
  currentHub,
  currentUser,
  locale,
  onRecordSettlement,
  onViewReceipt,
}) => {
  const isAr = locale === 'ar';

  // Filter shipments originating from this hub that are pending payment or submitted
  const hubShipments = shipments.filter(
    (s) => s.originHubId === currentHub.id || !s.originHubId
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    hubShipments[0] || null
  );

  // Payment Form State
  const [paymentCurrency, setPaymentCurrency] = useState<Currency>(
    currentHub.countryCode === 'JOR' ? 'JOD' : 'DZD'
  );
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'POS_CARD'>('CASH');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // FX Quote Lock State (Section 81)
  const [quoteId, setQuoteId] = useState<string>(`FXQ-${Date.now().toString().slice(-6)}`);
  const [quoteTimeRemaining, setQuoteTimeRemaining] = useState<number>(300); // 5 minutes
  const [isQuoteExpired, setIsQuoteExpired] = useState(false);

  // Success Settlement modal/receipt
  const [lastSettlement, setLastSettlement] = useState<SettlementRecord | null>(null);

  // Countdown timer for FX Quote
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsQuoteExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quoteId]);

  const handleRefreshQuote = () => {
    setQuoteId(`FXQ-${Date.now().toString().slice(-6)}`);
    setQuoteTimeRemaining(300);
    setIsQuoteExpired(false);
  };

  // Dynamic shipping cost & FX calculation using central rates
  const preview = calculateCustomerShippingPreview(
    selectedShipment || {},
    paymentCurrency,
    shippingRates && shippingRates.length > 0 ? shippingRates : INITIAL_SHIPPING_RATES,
    exchangeRates,
    currentHub.countryCode === 'DZA' ? 'DZ' : 'JO',
    currentHub.countryCode === 'DZA' ? 'JO' : 'DZ'
  );

  const baseCurrency = preview.baseCurrency;
  const weight = preview.chargeableWeightKg;
  const ratePerKg = preview.ratePerKg;
  const baseCharge = preview.baseCharge;
  const convertedAmountDue = preview.convertedAmountDue;
  const appliedFxRate = preview.appliedFxRate;
  const fxSide = preview.fxSide;
  const activeRateRecord = preview.rateRecord;
  const isSameCurrency = paymentCurrency === baseCurrency;

  const numReceived = parseFloat(amountReceived) || 0;
  const changeDue = Math.max(0, numReceived - convertedAmountDue);
  const isAmountSufficient = numReceived >= convertedAmountDue;

  const handleConfirmCollection = () => {
    if (!selectedShipment) return;
    if (isQuoteExpired && !isSameCurrency) {
      alert(isAr ? 'انتهت صلاحية سعر الصرف المقفل. يرجى تجديد التسعير' : 'FX Quote expired. Please refresh rate lock.');
      return;
    }
    if (!isAmountSufficient && paymentMethod === 'CASH') {
      alert(isAr ? 'المبلغ المستلم أقل من المبلغ المطلوب' : 'Received amount is less than total due.');
      return;
    }

    const stlNumber = `STL-${Date.now().toString().slice(-6)}`;
    const rcpNumber = `RCP-${currentHub.code}-${Date.now().toString().slice(-5)}`;

    const newSettlement: SettlementRecord = {
      id: stlNumber,
      settlementNumber: stlNumber,
      type: 'CUSTOMER_PAYMENT',
      relatedUserId: selectedShipment.senderId || 'CUST-WALKIN',
      relatedUserName: selectedShipment.senderName || 'العميل',
      shipmentId: selectedShipment.id,
      trackingNumber: selectedShipment.trackingNumber,
      hubId: currentHub.id,
      hubCode: currentHub.code,

      // Base Amount Snapshot
      baseAmount: baseCharge,
      baseCurrency,

      // FX Conversion Snapshot
      settlementCurrency: paymentCurrency,
      exchangeRateId: activeRateRecord?.id || 'FX-INSTANT',
      rateVersion: activeRateRecord?.version || 'FX-2026-09-03-01',
      fxSide,
      appliedFxRate: isSameCurrency ? 1.0 : appliedFxRate,
      convertedAmount: convertedAmountDue,

      fees: 0,
      adjustments: 0,
      finalAmount: convertedAmountDue,

      status: 'PAID',
      idempotencyKey: `IDEMP-PAY-${selectedShipment.id}-${Date.now()}`,
      processedBy: currentUser.staffCode || currentUser.id,
      processedByName: currentUser.fullName,
      processedAt: new Date().toISOString(),
      receiptNumber: rcpNumber,
      notes: paymentNotes || (isAr ? `سداد كاونتر فرع ${currentHub.nameAr} بطريقة ${paymentMethod}` : `Counter payment at ${currentHub.nameEn}`),
    };

    onRecordSettlement(newSettlement);
    setLastSettlement(newSettlement);
    setAmountReceived('');
  };

  const minutes = Math.floor(quoteTimeRemaining / 60);
  const seconds = quoteTimeRemaining % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Receipt className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {isAr ? 'تحصيل رسوم الشحن من العملاء' : 'Customer Shipping Fee Collection'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? 'تحصيل رسوم الطرود عند الإيداع في الفرع مع احتساب آلي لتحويل العملة بسعر الشراء المعتمد'
                  : 'Counter payment intake with automated THOUESA Buy-side currency conversion'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
              {currentHub.nameAr} ({currentHub.code})
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Shipment Selection & Details (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {isAr ? 'الطرود بانتظار السداد بالفرع' : 'Pending Counter Shipments'}
              </h3>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {hubShipments.length}
              </span>
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pe-1">
              {hubShipments.map((s) => {
                const isSelected = selectedShipment?.id === s.id;
                const sWeight = s.finalWeight || s.declaredWeight || 2.0;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedShipment(s)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{s.trackingNumber}</span>
                      <StatusBadge status={s.currentStatus} type="shipment" locale={locale} />
                    </div>
                    <div className="mt-2 text-slate-600 flex items-center justify-between">
                      <span>{s.senderName || (isAr ? 'مرسل الطرد' : 'Sender')}</span>
                      <span className="font-bold text-slate-800">{sWeight} KG</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Settlement Drawer / Intake Payment Form (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedShipment ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block">
                      {isAr ? 'رقم تتبع الطرد المطلوب تحصيله' : 'Shipment Tracking'}
                    </span>
                    <span className="font-mono font-bold text-base text-slate-900">
                      {selectedShipment.trackingNumber}
                    </span>
                  </div>
                  <div className="text-end">
                    <span className="text-[11px] font-bold text-slate-400 block">
                      {isAr ? 'مسار الشحن' : 'Route'}
                    </span>
                    <span className="font-bold text-slate-800 text-xs">
                      {currentHub.countryCode === 'JOR' ? 'Jordan → Algeria' : 'Algeria → Jordan'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Breakdown Grid (Section 82 & 83) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>{isAr ? 'الوزن المعتمد للفوترة' : 'Billable Weight'}</span>
                  <span className="font-bold text-slate-900 font-mono">{weight} KG</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>{isAr ? 'تعرفة الكيلوغرام الرسمية للعميل' : 'Customer Tariff Rate'}</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {ratePerKg} {baseCurrency} / KG
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-slate-900 font-bold">
                  <span>{isAr ? 'المبلغ الأساسي للتعرفة (Base Charge)' : 'Base Shipping Charge'}</span>
                  <span className="text-sm font-mono text-amber-700">
                    {baseCharge.toFixed(2)} {baseCurrency}
                  </span>
                </div>
              </div>

              {/* Currency Selection & FX Engine */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-700">
                  {isAr ? 'عملة سداد العميل في الفرع' : 'Customer Payment Currency at Counter'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['JOD', 'DZD', 'USD'] as Currency[]).map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setPaymentCurrency(curr)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        paymentCurrency === curr
                          ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>

                {/* FX Quote Lock Banner if Foreign Currency */}
                {!isSameCurrency ? (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <Lock className="w-4 h-4 text-amber-700" />
                        <span>{isAr ? 'سعر الصرف مقفل لهذه العملية' : 'Exchange Rate Locked'}</span>
                      </div>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white text-amber-800 border border-amber-200">
                        {quoteId}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-700">
                      <span>{isAr ? 'السعر المعتمد (قاعدة شراء THOUESA)' : 'Applied THOUESA Buy Rate'}:</span>
                      <span className="font-mono font-bold text-slate-900">
                        1 {baseCurrency} = {appliedFxRate} {paymentCurrency}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-slate-500">
                        {isAr ? 'إصدار السعر' : 'Version'}: {activeRateRecord?.version || 'FX-2026-09-03-01'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={isQuoteExpired ? 'text-rose-600 font-bold' : 'text-slate-600 font-mono'}>
                          <Clock className="w-3 h-3 inline me-1" />
                          {isQuoteExpired ? (isAr ? 'منتهي الصلاحية' : 'Expired') : timeFormatted}
                        </span>
                        {isQuoteExpired && (
                          <button
                            type="button"
                            onClick={handleRefreshQuote}
                            className="text-amber-700 underline font-bold cursor-pointer"
                          >
                            {isAr ? 'تجديد القفل' : 'Refresh'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{isAr ? 'السداد بنفس عملة التعرفة الأصلية — لا يلزم تحويل عملة' : 'Same currency payment - No FX conversion required'}</span>
                  </div>
                )}
              </div>

              {/* Total Due & Tendered Cash */}
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">
                    {isAr ? 'المبلغ المطلوب سداده نهائياً' : 'Total Amount Due'}
                  </span>
                  <span className="text-xl font-bold font-mono text-amber-400">
                    {convertedAmountDue.toFixed(2)} {paymentCurrency}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-bold">
                      {isAr ? 'المبلغ المقبوض من العميل' : 'Amount Received'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                      className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-2 font-mono font-bold text-white focus:ring-1 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <span className="block text-[11px] text-slate-300 mb-1 font-bold">
                      {isAr ? 'الباقي للعميل (Change)' : 'Change Due'}
                    </span>
                    <div className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-2 font-mono font-bold text-emerald-400">
                      {changeDue.toFixed(2)} {paymentCurrency}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method & Confirm */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                      paymentMethod === 'CASH'
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {isAr ? 'نقداً (Cash)' : 'Cash'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('POS_CARD')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                      paymentMethod === 'POS_CARD'
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {isAr ? 'بطاقة بنكية (POS Card)' : 'POS Card'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmCollection}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAr ? 'تأكيد التحصيل وإصدار الإيصال' : 'Confirm Collection & Print Receipt'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
              <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <div className="font-bold text-slate-700">
                {isAr ? 'اختر طرداً من القائمة للبدء بالتحصيل' : 'Select a shipment to begin collection'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instant Settlement Receipt Modal (Section 95) */}
      {lastSettlement && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" />
                <div>
                  <h3 className="text-base font-bold">
                    {isAr ? 'تم التحصيل بنجاح' : 'Payment Successfully Collected'}
                  </h3>
                  <p className="text-[11px] text-emerald-100">{lastSettlement.settlementNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLastSettlement(null)}
                className="text-white hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'رقم الإيصال' : 'Receipt No'}:</span>
                  <span className="font-bold text-slate-900">{lastSettlement.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'رقم التتبع' : 'Tracking'}:</span>
                  <span className="font-bold text-slate-900">{lastSettlement.trackingNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'المبلغ الأساسي' : 'Base Charge'}:</span>
                  <span>{lastSettlement.baseAmount.toFixed(2)} {lastSettlement.baseCurrency}</span>
                </div>
                {lastSettlement.fxSide !== 'NONE' && (
                  <div className="flex justify-between text-amber-700">
                    <span>{isAr ? 'سعر الصرف المعتمد' : 'Applied FX'}:</span>
                    <span>{lastSettlement.appliedFxRate} ({lastSettlement.fxSide})</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-emerald-800 pt-2 border-t border-slate-200">
                  <span>{isAr ? 'المبلغ المستلم' : 'Paid Amount'}:</span>
                  <span>{lastSettlement.finalAmount.toFixed(2)} {lastSettlement.settlementCurrency}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onViewReceipt) onViewReceipt(lastSettlement);
                    setLastSettlement(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-center cursor-pointer"
                >
                  {isAr ? 'عرض الإيصال الكامل' : 'Full Receipt'}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isAr ? 'طباعة الإيصال' : 'Print'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
