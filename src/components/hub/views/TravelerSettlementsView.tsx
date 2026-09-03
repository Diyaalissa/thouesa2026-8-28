import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Plane,
  Coins,
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  Building2,
  ArrowRightLeft,
  ChevronRight,
  Info,
  Scale,
} from 'lucide-react';
import {
  Hub,
  Locale,
  Trip,
  Manifest,
  DailyExchangeRate,
  SettlementRecord,
  Currency,
  ShippingRate,
  User as UserType,
} from '../../../types';
import { StatusBadge } from '../common/StatusBadge';
import { calculateTravelerPayoutPreview } from '../../../lib/hubFinancialPreview';
import { INITIAL_SHIPPING_RATES } from '../../../lib/hubOperationsData';

export interface TravelerSettlementsViewProps {
  trips: Trip[];
  manifests: Manifest[];
  exchangeRates: DailyExchangeRate[];
  shippingRates?: ShippingRate[];
  currentHub: Hub;
  currentUser: UserType;
  locale: Locale;
  onRecordSettlement: (record: SettlementRecord) => void;
  onViewReceipt?: (record: SettlementRecord) => void;
}

export const TravelerSettlementsView: React.FC<TravelerSettlementsViewProps> = ({
  trips,
  manifests,
  exchangeRates,
  shippingRates = INITIAL_SHIPPING_RATES,
  currentHub,
  currentUser,
  locale,
  onRecordSettlement,
  onViewReceipt,
}) => {
  const isAr = locale === 'ar';

  // Eligible trips for payout: verified or completed trips
  const eligibleTrips = trips.filter((t) => t.status === 'VERIFIED' || t.status === 'COMPLETED' || t.status === 'ARRIVED');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(eligibleTrips[0] || null);

  // Manifest matching selected trip
  const relatedManifest = manifests.find((m) => m.tripId === selectedTrip?.id) || manifests[0];

  // Traveler preference defaults (Section 96)
  // Traveler preferred payout currency: default to JOD if in Jordan hub, DZD if in Algeria hub
  const defaultPayoutCurrency: Currency = currentHub.countryCode === 'JOR' ? 'JOD' : 'DZD';
  const [payoutCurrency, setPayoutCurrency] = useState<Currency>(defaultPayoutCurrency);
  const [payoutNotes, setPayoutNotes] = useState<string>('');
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);

  // FX Quote Lock State (Section 81)
  const [quoteId, setQuoteId] = useState<string>(`FXQ-${Date.now().toString().slice(-6)}`);
  const [quoteTimeRemaining, setQuoteTimeRemaining] = useState<number>(300); // 5 minutes
  const [isQuoteExpired, setIsQuoteExpired] = useState(false);

  // Confirmation Modal / Receipt state
  const [lastSettlement, setLastSettlement] = useState<SettlementRecord | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

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

  // Dynamic Logistics & Earnings Calculation using central rates
  const originCountry = selectedTrip?.originHubId === 'hub-alg' ? 'DZ' : 'JO';
  const destCountry = originCountry === 'DZ' ? 'JO' : 'DZ';

  const preview = calculateTravelerPayoutPreview(
    selectedTrip || {},
    relatedManifest || null,
    payoutCurrency,
    shippingRates && shippingRates.length > 0 ? shippingRates : INITIAL_SHIPPING_RATES,
    exchangeRates,
    originCountry,
    destCountry
  );

  const baseCurrency = preview.baseCurrency;
  const transportedWeightKg = preview.transportedWeightKg;
  const travelerRatePerKg = preview.travelerRatePerKg ?? preview.compensationRatePerKg;
  const baseEarnings = preview.baseEarnings;
  const convertedAmount = preview.convertedAmount ?? preview.convertedPayoutAmount;
  const appliedFxRate = preview.appliedFxRate;
  const fxSide = preview.fxSide;
  const activeRateRecord = preview.rateRecord;
  const isSameCurrency = payoutCurrency === baseCurrency;

  const finalPayoutAmount = Math.max(0, Number((convertedAmount + adjustmentAmount).toFixed(2)));

  const handleConfirmPayout = () => {
    if (!selectedTrip) return;
    if (isQuoteExpired && !isSameCurrency) {
      alert(isAr ? 'انتهت صلاحية قفل سعر الصرف. يرجى تجديد التسعير' : 'Rate lock expired. Please refresh.');
      return;
    }

    const stlNumber = `STL-${Date.now().toString().slice(-6)}`;
    const rcpNumber = `RCP-${currentHub.code}-PAYOUT-${Date.now().toString().slice(-4)}`;

    const newSettlement: SettlementRecord = {
      id: stlNumber,
      settlementNumber: stlNumber,
      type: 'TRAVELER_PAYOUT',
      relatedUserId: selectedTrip.travelerId,
      relatedUserName: selectedTrip.travelerName,
      tripId: selectedTrip.id,
      flightNumber: selectedTrip.flightNumber,
      manifestId: relatedManifest?.id || 'MF-DEFAULT',
      hubId: currentHub.id,
      hubCode: currentHub.code,

      // Base Amount Snapshot (Section 69 & 70)
      baseAmount: baseEarnings,
      baseCurrency,

      // FX Conversion Snapshot
      settlementCurrency: payoutCurrency,
      exchangeRateId: activeRateRecord?.id || 'FX-INSTANT',
      rateVersion: activeRateRecord?.version || 'FX-2026-09-03-01',
      fxSide,
      appliedFxRate: isSameCurrency ? 1.0 : appliedFxRate,
      convertedAmount,

      fees: 0,
      adjustments: adjustmentAmount,
      finalAmount: finalPayoutAmount,

      status: 'SETTLED',
      idempotencyKey: `IDEMP-PAYOUT-${selectedTrip.id}-${Date.now()}`,
      processedBy: currentUser.staffCode || currentUser.id,
      processedByName: currentUser.fullName,
      processedAt: new Date().toISOString(),
      receiptNumber: rcpNumber,
      notes: payoutNotes || (isAr ? `صرف أرباح الرحلة ${selectedTrip.flightNumber} للمسافر ${selectedTrip.travelerName}` : `Traveler payout for flight ${selectedTrip.flightNumber}`),
    };

    onRecordSettlement(newSettlement);
    setLastSettlement(newSettlement);
    setIsReviewOpen(false);
  };

  const minutes = Math.floor(quoteTimeRemaining / 60);
  const seconds = quoteTimeRemaining % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Wallet className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {isAr ? 'تسوية وصرف مستحقات المسافرين' : 'Traveler Earnings & Settlement Drawer'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? 'صرف أرباح نقل الشحنات للمسافرين المعتمدين مع تطبيق آلي لقاعدة سعر البيع عند الصرف بعملة أجنبية'
                  : 'Disburse verified flight compensation with automated THOUESA Sell-side FX settlement'}
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
        {/* Left Column: Eligible Trips List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {isAr ? 'الرحلات الجاهزة لصرف المستحقات' : 'Trips Ready for Payout'}
              </h3>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {eligibleTrips.length}
              </span>
            </div>

            <div className="space-y-2 max-h-[480px] overflow-y-auto pe-1">
              {eligibleTrips.map((t) => {
                const isSelected = selectedTrip?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTrip(t)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Plane className="w-3.5 h-3.5 text-amber-600" />
                        <span>{t.flightNumber}</span>
                      </div>
                      <StatusBadge status={t.status} type="trip" locale={locale} />
                    </div>
                    <div className="mt-2 text-slate-600 flex items-center justify-between">
                      <span className="font-medium text-slate-800">{t.travelerName}</span>
                      <span className="font-mono text-slate-500">
                        {t.departureCityAr || t.departureCity} → {t.destinationCityAr || t.destinationCity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Traveler Settlement Drawer (7 cols) - Sections 77-80 */}
        <div className="lg:col-span-7 space-y-4">
          {selectedTrip ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
              {/* Header Info */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block">
                      {isAr ? 'المسافر المستحق' : 'Traveler'}
                    </span>
                    <span className="font-bold text-base text-slate-900">
                      {selectedTrip.travelerName}
                    </span>
                  </div>
                  <div className="text-end">
                    <span className="text-[11px] font-bold text-slate-400 block">
                      {isAr ? 'رقم الرحلة والمسار' : 'Flight & Route'}
                    </span>
                    <span className="font-mono font-bold text-slate-800 text-xs">
                      {selectedTrip.flightNumber} ({originCountry === 'DZ' ? 'ALG → AMM' : 'AMM → ALG'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Settlement Parameters Breakdown (Section 77 & 78) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>{isAr ? 'رمز المانيفست المعتمد' : 'Manifest Reference'}</span>
                  <span className="font-mono font-bold text-slate-900">{relatedManifest?.id || 'MF-ALG-AMM-001'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>{isAr ? 'الوزن المنقول الفعلي (Transported Weight)' : 'Transported Weight'}</span>
                  <span className="font-mono font-bold text-slate-900">{transportedWeightKg} KG</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>{isAr ? 'تعرفة أرباح المسافر المعتمدة للمسار' : 'Traveler Rate per KG'}</span>
                  <span className="font-mono font-bold text-slate-900">
                    {travelerRatePerKg.toLocaleString()} {baseCurrency} / KG
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-slate-900 font-bold">
                  <span>{isAr ? 'الربح الأساسي للمسافر (Base Earnings)' : 'Settlement Base Earnings'}</span>
                  <span className="text-sm font-mono text-amber-700">
                    {baseEarnings.toLocaleString()} {baseCurrency}
                  </span>
                </div>
              </div>

              {/* Payout Currency & Traveler Request (Section 96) */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    {isAr ? 'عملة وبلد استلام المستحقات' : 'Requested Payout Country & Currency'}
                  </label>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                    {isAr ? 'طلب المسافر مسبقاً' : 'Requested by traveler'}: {currentHub.countryCode === 'JOR' ? 'Jordan / JOD' : 'Algeria / DZD'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(['JOD', 'DZD', 'USD'] as Currency[]).map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setPayoutCurrency(curr)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        payoutCurrency === curr
                          ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {curr}
                    </button>
                  ))}
                </div>

                {/* FX Quote Lock Banner if foreign currency */}
                {!isSameCurrency ? (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <Lock className="w-4 h-4 text-amber-700" />
                        <span>{isAr ? 'سعر الصرف مقفل لهذه التسوية' : 'Exchange Rate Locked'}</span>
                      </div>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white text-amber-800 border border-amber-200">
                        {quoteId}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-700">
                      <span>{isAr ? 'السعر المعتمد (قاعدة بيع THOUESA)' : 'Applied THOUESA Sell Rate'}:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {baseCurrency === 'DZD' && payoutCurrency === 'JOD' ? '1 JOD = 190 DZD (Rate: 0.005263)' : `1 ${baseCurrency} = ${appliedFxRate} ${payoutCurrency}`}
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
                    <span>{isAr ? 'الصرف بنفس عملة الأرباح الأساسية — لا يلزم تحويل عملة' : 'Same currency payout - No FX conversion required'}</span>
                  </div>
                )}
              </div>

              {/* Final Converted Amount (Read-Only - Section 79) */}
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">
                    {isAr ? 'صافي المستحقات المصروفة للمسافر' : 'Final Payout to Traveler'}
                  </span>
                  <span className="text-2xl font-bold font-mono text-amber-400">
                    {finalPayoutAmount.toFixed(2)} {payoutCurrency}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                  <span>{isAr ? 'المبلغ المحول قبل التعديل' : 'Converted Amount'}:</span>
                  <span className="font-mono text-slate-200">{convertedAmount.toFixed(2)} {payoutCurrency}</span>
                </div>
              </div>

              {/* Actions: Review & Confirm (Section 78) */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReviewOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  {isAr ? 'مراجعة الحسبة المالية' : 'Review Calculation'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayout}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAr ? 'تأكيد صرف المستحقات' : 'Confirm Settlement'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
              <Plane className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <div className="font-bold text-slate-700">
                {isAr ? 'اختر رحلة من القائمة للبدء بتسوية المستحقات' : 'Select a trip to begin settlement'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {isReviewOpen && selectedTrip && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {isAr ? 'مراجعة الحسبة المالية لتسوية المسافر' : 'Traveler Settlement Audit Review'}
              </h3>
              <button
                type="button"
                onClick={() => setIsReviewOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'المسافر' : 'Traveler'}:</span>
                  <span className="font-bold text-slate-900">{selectedTrip.travelerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'الرحلة والمانيفست' : 'Flight & Manifest'}:</span>
                  <span className="font-bold text-slate-900">{selectedTrip.flightNumber} / {relatedManifest?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'الوزن المعتمد' : 'Weight'}:</span>
                  <span>{transportedWeightKg} KG</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'الربح الأساسي' : 'Base Earnings'}:</span>
                  <span className="font-bold font-mono">{baseEarnings.toLocaleString()} {baseCurrency}</span>
                </div>
                {!isSameCurrency && (
                  <>
                    <div className="flex justify-between text-amber-800">
                      <span>{isAr ? 'سعر الصرف المعتمد (Sell)' : 'Applied FX Rate'}:</span>
                      <span className="font-mono font-bold">{appliedFxRate}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>{isAr ? 'معرف القفل' : 'Lock Quote'}:</span>
                      <span className="font-mono">{quoteId}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-sm font-bold text-emerald-800 pt-2 border-t border-slate-200">
                  <span>{isAr ? 'المبلغ النهائي للصرف' : 'Final Payout'}:</span>
                  <span>{finalPayoutAmount.toFixed(2)} {payoutCurrency}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReviewOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  {isAr ? 'رجوع' : 'Back'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayout}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  {isAr ? 'اعتماد وصرف المستحقات' : 'Approve & Disburse'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instant Settlement Receipt Modal */}
      {lastSettlement && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" />
                <div>
                  <h3 className="text-base font-bold">
                    {isAr ? 'تم صرف المستحقات بنجاح' : 'Settlement Disbursed Successfully'}
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
                  <span className="text-slate-500">{isAr ? 'رقم الإيصال' : 'Receipt'}:</span>
                  <span className="font-bold text-slate-900">{lastSettlement.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'المسافر' : 'Traveler'}:</span>
                  <span className="font-bold text-slate-900">{lastSettlement.relatedUserName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'الربح الأساسي' : 'Base Earnings'}:</span>
                  <span>{lastSettlement.baseAmount.toLocaleString()} {lastSettlement.baseCurrency}</span>
                </div>
                {lastSettlement.fxSide !== 'NONE' && (
                  <div className="flex justify-between text-amber-700">
                    <span>{isAr ? 'سعر الصرف' : 'FX Applied'}:</span>
                    <span>{lastSettlement.appliedFxRate} ({lastSettlement.fxSide})</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-emerald-800 pt-2 border-t border-slate-200">
                  <span>{isAr ? 'المبلغ المصروف' : 'Disbursed'}:</span>
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
