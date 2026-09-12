import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronDown,
  Info,
  Scale,
  Package,
  Search,
  Filter,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  FileText,
  DollarSign,
  ArrowRight,
  Eye,
  UserCheck,
  Receipt,
  Sparkles,
} from 'lucide-react';
import {
  Hub,
  Locale,
  Trip,
  Manifest,
  Shipment,
  DailyExchangeRate,
  SettlementRecord,
  Currency,
  ShippingRate,
  User as UserType,
} from '../../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  calculateTravelerPayoutPreview,
  TravelerPayoutPreview,
} from '../../../lib/hubFinancialPreview';
import {
  INITIAL_SHIPPING_RATES,
  INITIAL_DAILY_EXCHANGE_RATES,
} from '../../../lib/hubOperationsData';
import { INTAKE_SEED_TRIP_0142 } from '../../../lib/destinationIntakeSeedData';

export interface TravelerSettlementsViewProps {
  trips: Trip[];
  manifests: Manifest[];
  shipments?: Shipment[];
  exchangeRates?: DailyExchangeRate[];
  shippingRates?: ShippingRate[];
  settlements?: SettlementRecord[];
  currentHub: Hub;
  currentUser: UserType;
  locale: Locale;
  onRecordSettlement: (record: SettlementRecord) => void;
  onViewReceipt?: (record: SettlementRecord) => void;
}

type TabFilter = 'ALL' | 'ELIGIBLE' | 'PENDING' | 'SETTLED' | 'BLOCKED';
type RouteFilter = 'ALL' | 'JO_TO_DZ' | 'DZ_TO_JO';

export const TravelerSettlementsView: React.FC<TravelerSettlementsViewProps> = ({
  trips,
  manifests,
  shipments = [],
  exchangeRates = INITIAL_DAILY_EXCHANGE_RATES,
  shippingRates = INITIAL_SHIPPING_RATES,
  settlements = [],
  currentHub,
  currentUser,
  locale,
  onRecordSettlement,
  onViewReceipt,
}) => {
  const isAr = locale === 'ar';

  // Permission check: Financial Officer or Admin
  const canProcessPayout =
    currentUser.role === 'FINANCIAL_OFFICER' ||
    currentUser.role === 'MASTER_ADMIN' ||
    currentUser.permissions?.includes('payout.process') ||
    currentUser.permissions?.includes('admin.all');

  // Filter & Search State
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [routeFilter, setRouteFilter] = useState<RouteFilter>('ALL');

  // Selected Trip state
  const [selectedTripId, setSelectedTripId] = useState<string>(() => {
    // Default to TRIP-0142 if present, otherwise first trip
    const found0142 = trips.find((t) => t.id === 'TRIP-0142' || t.flightNumber === 'RJ517');
    return found0142 ? found0142.id : (trips[0]?.id || '');
  });

  const selectedTrip = useMemo(() => {
    return trips.find((t) => t.id === selectedTripId) || trips[0] || null;
  }, [trips, selectedTripId]);

  // Manifest matching selected trip
  const relatedManifest = useMemo(() => {
    if (!selectedTrip) return null;
    return (
      manifests.find((m) => m.tripId === selectedTrip.id || m.id === selectedTrip.manifestId) ||
      manifests.find((m) => m.travelerId === selectedTrip.travelerId) ||
      null
    );
  }, [manifests, selectedTrip]);

  // Shipments in manifest
  const shipmentsInManifest = useMemo(() => {
    if (!relatedManifest) return [];
    if (relatedManifest.shipmentIds && relatedManifest.shipmentIds.length > 0) {
      return shipments.filter((s) => relatedManifest.shipmentIds.includes(s.id));
    }
    return shipments.filter((s) => s.assignedTripId === selectedTrip?.id);
  }, [relatedManifest, shipments, selectedTrip]);

  // Traveler preference defaults
  const defaultPayoutCurrency: Currency =
    currentHub.countryCode === 'JOR' ? 'JOD' : 'DZD';
  const [payoutCurrency, setPayoutCurrency] = useState<Currency>(defaultPayoutCurrency);
  const [payoutNotes, setPayoutNotes] = useState<string>('');
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [showShipmentsList, setShowShipmentsList] = useState<boolean>(false);

  // FX Quote Lock State (5 minutes)
  const [quoteId, setQuoteId] = useState<string>(`FXQ-${Date.now().toString().slice(-6)}`);
  const [quoteTimeRemaining, setQuoteTimeRemaining] = useState<number>(300);
  const [isQuoteExpired, setIsQuoteExpired] = useState(false);

  // Modal states
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

  // Route calculation
  const originCountry = selectedTrip?.originHubId === 'hub-alg' ? 'DZ' : 'JO';
  const destCountry = originCountry === 'DZ' ? 'JO' : 'DZ';

  // Calculate live preview for selected trip
  const preview: TravelerPayoutPreview = useMemo(() => {
    if (!selectedTrip) {
      return {
        baseCurrency: 'JOD',
        payoutCurrency,
        transportedWeightKg: 0,
        compensationRatePerKg: 0,
        travelerRatePerKg: 0,
        rateType: 'TRAVELER_COMPENSATION',
        rateVersion: 'N/A',
        rateCardId: 'N/A',
        baseEarnings: 0,
        convertedPayoutAmount: 0,
        convertedAmount: 0,
        appliedFxRate: 1,
        fxSide: 'NONE',
        isBlocked: true,
        blockReason: isAr ? 'لا توجد رحلة محددة' : 'No trip selected',
        blockingFlags: {
          operationalBlocked: true,
          manifestBlocked: true,
          weightBlocked: true,
          pricingBlocked: true,
          fxBlocked: false,
        },
      };
    }

    return calculateTravelerPayoutPreview(
      selectedTrip,
      relatedManifest,
      shipmentsInManifest,
      payoutCurrency,
      shippingRates,
      exchangeRates,
      originCountry,
      destCountry
    );
  }, [
    selectedTrip,
    relatedManifest,
    payoutCurrency,
    shippingRates,
    exchangeRates,
    originCountry,
    destCountry,
    shipmentsInManifest,
    isAr,
  ]);

  // Check if this trip is already settled
  const existingSettlement = useMemo(() => {
    if (!selectedTrip) return null;
    return settlements.find(
      (s) =>
        s.type === 'TRAVELER_PAYOUT' &&
        s.status === 'SETTLED' &&
        (s.tripId === selectedTrip.id || (relatedManifest && s.manifestId === relatedManifest.id))
    );
  }, [settlements, selectedTrip, relatedManifest]);

  const isAlreadySettled = !!existingSettlement;
  const isSameCurrency = preview.baseCurrency === payoutCurrency;
  const finalPayoutAmount = Math.max(
    0,
    Number((preview.convertedPayoutAmount + adjustmentAmount).toFixed(2))
  );

  // Compute status classification for each trip
  const tripEvaluations = useMemo(() => {
    return trips.map((trip) => {
      const manifest =
        manifests.find((m) => m.tripId === trip.id || m.id === trip.manifestId) ||
        manifests.find((m) => m.travelerId === trip.travelerId) ||
        null;

      const mShipments = manifest?.shipmentIds?.length
        ? shipments.filter((s) => manifest.shipmentIds.includes(s.id))
        : shipments.filter((s) => s.assignedTripId === trip.id);

      const oCountry = trip.originHubId === 'hub-alg' ? 'DZ' : 'JO';
      const dCountry = oCountry === 'DZ' ? 'JO' : 'DZ';

      const tripPreview = calculateTravelerPayoutPreview(
        trip,
        manifest,
        mShipments,
        defaultPayoutCurrency,
        shippingRates,
        exchangeRates,
        oCountry,
        dCountry
      );

      const settled = settlements.some(
        (s) =>
          s.type === 'TRAVELER_PAYOUT' &&
          s.status === 'SETTLED' &&
          (s.tripId === trip.id || (manifest && s.manifestId === manifest.id))
      );

      let statusCategory: TabFilter = 'ELIGIBLE';
      if (settled) {
        statusCategory = 'SETTLED';
      } else if (tripPreview.isBlocked) {
        statusCategory = 'BLOCKED';
      } else {
        statusCategory = 'ELIGIBLE';
      }

      return {
        trip,
        manifest,
        preview: tripPreview,
        isSettled: settled,
        statusCategory,
      };
    });
  }, [
    trips,
    manifests,
    shipments,
    shippingRates,
    exchangeRates,
    defaultPayoutCurrency,
    settlements,
  ]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const eligibleCount = tripEvaluations.filter((e) => e.statusCategory === 'ELIGIBLE').length;
    const pendingCount = tripEvaluations.filter((e) => e.statusCategory === 'PENDING').length;
    const settledCount = tripEvaluations.filter((e) => e.statusCategory === 'SETTLED').length;
    const blockedCount = tripEvaluations.filter((e) => e.statusCategory === 'BLOCKED').length;

    const settledTodayTotal = settlements
      .filter((s) => s.type === 'TRAVELER_PAYOUT' && s.status === 'SETTLED')
      .reduce((sum, s) => sum + (s.finalAmount || 0), 0);

    return {
      eligibleCount,
      pendingCount,
      settledCount,
      blockedCount,
      settledTodayTotal,
    };
  }, [tripEvaluations, settlements]);

  // Filtered trips list
  const filteredEvaluations = useMemo(() => {
    return tripEvaluations.filter(({ trip, manifest, statusCategory }) => {
      // Tab filter
      if (activeTab !== 'ALL' && statusCategory !== activeTab) {
        return false;
      }

      // Route filter
      if (routeFilter === 'JO_TO_DZ' && trip.originHubId !== 'hub-amm') return false;
      if (routeFilter === 'DZ_TO_JO' && trip.originHubId !== 'hub-alg') return false;

      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = trip.travelerName?.toLowerCase().includes(query);
        const matchesFlight = trip.flightNumber?.toLowerCase().includes(query);
        const matchesTripId = trip.id?.toLowerCase().includes(query);
        const matchesManifest = manifest?.id?.toLowerCase().includes(query);
        const matchesTravelerId = trip.travelerId?.toLowerCase().includes(query);

        if (
          !matchesName &&
          !matchesFlight &&
          !matchesTripId &&
          !matchesManifest &&
          !matchesTravelerId
        ) {
          return false;
        }
      }

      return true;
    });
  }, [tripEvaluations, activeTab, routeFilter, searchTerm]);

  // Payout submission handler
  const handleConfirmPayout = () => {
    if (!selectedTrip || isAlreadySettled || preview.isBlocked) return;
    if (isQuoteExpired && !isSameCurrency) {
      alert(
        isAr
          ? 'انتهت صلاحية قفل سعر الصرف. يرجى تجديد التسعير'
          : 'Rate lock expired. Please refresh the quote before processing.'
      );
      return;
    }

    const stlNumber = `STL-PAYOUT-${Date.now().toString().slice(-6)}`;
    const rcpNumber = `RCP-${currentHub.code}-TRAV-${Date.now().toString().slice(-4)}`;

    const newSettlement: SettlementRecord = {
      id: stlNumber,
      settlementNumber: stlNumber,
      type: 'TRAVELER_PAYOUT',
      relatedUserId: selectedTrip.travelerId,
      relatedUserName: selectedTrip.travelerName,
      tripId: selectedTrip.id,
      flightNumber: selectedTrip.flightNumber,
      manifestId: relatedManifest?.id || 'MF-0142',
      hubId: currentHub.id,
      hubCode: currentHub.code,

      // Pricing & Traveler Compensation Snapshot (Stage 11 Locked)
      travelerCompensationRateId: preview.rateCardId,
      travelerCompensationRateVersion: preview.rateVersion,
      rateType: 'TRAVELER_COMPENSATION',
      pricingModel: 'PER_KG',
      appliedTravelerRate: preview.travelerRatePerKg,
      transportedWeightKg: preview.transportedWeightKg,

      // Base Amount
      baseAmount: preview.baseEarnings,
      baseCurrency: preview.baseCurrency,

      // FX Conversion Snapshot (Stage 11 Locked)
      settlementCurrency: payoutCurrency,
      exchangeRateId: preview.fxRateId || 'FX-JOD-DZD-v2',
      exchangeRateVersion: preview.fxRateVersion || 'V2',
      fxSide: preview.fxSide,
      appliedFxRate: preview.appliedFxRate,
      convertedAmount: preview.convertedPayoutAmount,

      fees: 0,
      adjustments: adjustmentAmount,
      finalAmount: finalPayoutAmount,

      status: 'SETTLED',
      idempotencyKey: `IDEMP-PAYOUT-${selectedTrip.id}-${Date.now()}`,
      processedBy: currentUser.staffCode || currentUser.id,
      processedByName: currentUser.fullName,
      processedAt: new Date().toISOString(),
      receiptNumber: rcpNumber,
      notes:
        payoutNotes ||
        (isAr
          ? `صرف مستحقات المسافر ${selectedTrip.travelerName} للرحلة ${selectedTrip.flightNumber} بعد إغلاق المانيفست بنجاح`
          : `Traveler payout for flight ${selectedTrip.flightNumber} closed manifest`),
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Wallet className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {isAr ? 'تسوية وصرف مستحقات المسافرين' : 'Traveler Earnings & Settlement Drawer'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Stage 11
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isAr
                  ? 'صرف أرباح نقل الشحنات للمسافرين المعتمدين استناداً إلى الوزن الفعلي المنقول في المانيفست وسعر تعرفة TRAVELER_COMPENSATION وأسعار الصرف الرسمية المقفلة'
                  : 'Disburse verified flight compensation based on actual manifest weight, TRAVELER_COMPENSATION rate, and official locked FX treasury rates'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                const trip0142 = trips.find((t) => t.id === 'TRIP-0142' || t.flightNumber === 'RJ517');
                if (trip0142) {
                  setSelectedTripId(trip0142.id);
                  setActiveTab('ALL');
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-300/60 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{isAr ? 'عرض الحالة المعيارية (TRIP-0142)' : 'Load Benchmark (TRIP-0142)'}</span>
            </button>

            <span className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
              {currentHub.nameAr} ({currentHub.code})
            </span>

            <span
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                canProcessPayout
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {canProcessPayout
                  ? isAr
                    ? 'صلاحية الصرف: مصرح'
                    : 'Payout Role: Authorized'
                  : isAr
                  ? 'صلاحية الصرف: قراءة فقط'
                  : 'Payout Role: Read Only'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Ready for Payout */}
        <div
          onClick={() => setActiveTab('ELIGIBLE')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'ELIGIBLE'
              ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {isAr ? 'جاهزة للصرف (مؤهلة)' : 'Eligible for Payout'}
            </span>
            <span className="p-2 rounded-xl bg-emerald-100/70 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {kpis.eligibleCount}
            </span>
            <span className="text-xs text-slate-400">{isAr ? 'رحلة' : 'trips'}</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            {isAr ? 'رحلات مكتملة مع مانيفست مغلق' : 'Completed trips & closed manifests'}
          </p>
        </div>

        {/* 2. Pending Payouts */}
        <div
          onClick={() => setActiveTab('PENDING')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'PENDING'
              ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {isAr ? 'بانتظار الصرف' : 'Pending Payouts'}
            </span>
            <span className="p-2 rounded-xl bg-amber-100/70 text-amber-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {kpis.pendingCount}
            </span>
            <span className="text-xs text-slate-400">{isAr ? 'طلب' : 'records'}</span>
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-1">
            {isAr ? 'مسودات تسوية قيد الاعتماد' : 'Draft settlement records'}
          </p>
        </div>

        {/* 3. Settled */}
        <div
          onClick={() => setActiveTab('SETTLED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'SETTLED'
              ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-400/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {isAr ? 'تم صرفها (مسددة)' : 'Settled Payouts'}
            </span>
            <span className="p-2 rounded-xl bg-blue-100/70 text-blue-700">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {kpis.settledCount}
            </span>
            <span className="text-xs text-slate-400">{isAr ? 'عملية' : 'settled'}</span>
          </div>
          <p className="text-[11px] text-blue-600 font-medium mt-1">
            {isAr ? 'تسويات مقفلة ومؤرشفة' : 'Archived immutable settlements'}
          </p>
        </div>

        {/* 4. Blocked Payouts */}
        <div
          onClick={() => setActiveTab('BLOCKED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'BLOCKED'
              ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-400/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {isAr ? 'محجوبة (غير مستوفية)' : 'Blocked Payouts'}
            </span>
            <span className="p-2 rounded-xl bg-rose-100/70 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {kpis.blockedCount}
            </span>
            <span className="text-xs text-slate-400">{isAr ? 'رحلة' : 'blocked'}</span>
          </div>
          <p className="text-[11px] text-rose-600 font-medium mt-1">
            {isAr ? 'حالات تشغيلية أو أوزان غير مكتملة' : 'Operational/weight blocking rules'}
          </p>
        </div>
      </div>

      {/* Main Workspace Split-Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Trips & Manifests Queue (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            {/* Search & Filter Controls */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  isAr
                    ? 'بحث بالمسافر، الرحلة، المانيفست...'
                    : 'Search traveler, flight, manifest...'
                }
                className="w-full ps-9 pe-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>

            {/* Tab Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              {(['ALL', 'ELIGIBLE', 'PENDING', 'SETTLED', 'BLOCKED'] as TabFilter[]).map((tab) => {
                const labels: Record<TabFilter, string> = {
                  ALL: isAr ? 'الكل' : 'All',
                  ELIGIBLE: isAr ? 'جاهزة' : 'Eligible',
                  PENDING: isAr ? 'بانتظار' : 'Pending',
                  SETTLED: isAr ? 'مصروفة' : 'Settled',
                  BLOCKED: isAr ? 'محجوبة' : 'Blocked',
                };
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      activeTab === tab
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* Route Filter Dropdown */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
              <span className="text-slate-500 font-medium">{isAr ? 'المسار' : 'Route'}:</span>
              <select
                value={routeFilter}
                onChange={(e) => setRouteFilter(e.target.value as RouteFilter)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="ALL">{isAr ? 'جميع المسارات' : 'All Routes'}</option>
                <option value="JO_TO_DZ">
                  {isAr ? 'الأردن إلى الجزائر (AMM → ALG)' : 'Jordan → Algeria (AMM → ALG)'}
                </option>
                <option value="DZ_TO_JO">
                  {isAr ? 'الجزائر إلى الأردن (ALG → AMM)' : 'Algeria → Jordan (ALG → AMM)'}
                </option>
              </select>
            </div>

            {/* Trips List */}
            <div className="space-y-2.5 max-h-[560px] overflow-y-auto pe-1 pt-1">
              {filteredEvaluations.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Plane className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-600">
                    {isAr ? 'لا توجد رحلات مطابقة لمعايير البحث' : 'No trips match the filter criteria'}
                  </p>
                </div>
              ) : (
                filteredEvaluations.map(({ trip, manifest, preview: itemPreview, isSettled, statusCategory }) => {
                  const isSelected = selectedTrip?.id === trip.id;
                  const isTripCompleted = trip.status === 'COMPLETED';
                  const isManifestClosed = manifest?.status === 'CLOSED';

                  return (
                    <div
                      key={trip.id}
                      onClick={() => setSelectedTripId(trip.id)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/40 shadow-xs ring-1 ring-amber-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      {/* Top Row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                            <Plane className="w-3.5 h-3.5" />
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 font-mono">
                              {trip.flightNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 ms-1.5 font-mono">
                              ({trip.id})
                            </span>
                          </div>
                        </div>

                        {/* Status Category Badge */}
                        {isSettled ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            {isAr ? 'مصروفة' : 'SETTLED'}
                          </span>
                        ) : itemPreview.isBlocked ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {isAr ? 'محجوبة' : 'BLOCKED'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {isAr ? 'جاهزة للصرف' : 'READY'}
                          </span>
                        )}
                      </div>

                      {/* Middle Row: Traveler & Route */}
                      <div className="mt-2.5 flex items-center justify-between text-slate-700">
                        <span className="font-bold text-slate-900">{trip.travelerName}</span>
                        <span className="font-mono text-slate-500 text-[11px]">
                          {trip.originHubId === 'hub-alg' ? 'ALG → AMM' : 'AMM → ALG'}
                        </span>
                      </div>

                      {/* Bottom Row: Weight & Manifest Details */}
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Scale className="w-3 h-3 text-slate-400" />
                          <span>{itemPreview.transportedWeightKg.toFixed(2)} KG</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span>{manifest?.id || 'MF-N/A'}</span>
                          <span
                            className={`ms-1 px-1 py-0.2 rounded text-[9px] font-bold ${
                              isManifestClosed
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {manifest?.status || 'N/A'}
                          </span>
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Traveler Settlement Workspace (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedTrip ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
              {/* Header: Traveler & Flight Snapshot */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        {isAr ? 'المسافر المستحق' : 'Traveler'}
                      </span>
                      <span className="px-2 py-0.2 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                        {selectedTrip.travelerId}
                      </span>
                    </div>
                    <span className="font-bold text-lg text-slate-900 mt-0.5 block">
                      {selectedTrip.travelerName}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {selectedTrip.travelerPhone || '+213 55 998 1122'}
                    </span>
                  </div>

                  <div className="sm:text-end">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {isAr ? 'الرحلة والمسار' : 'Flight & Route'}
                    </span>
                    <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {selectedTrip.flightNumber}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        ({originCountry === 'DZ' ? 'ALG → AMM' : 'AMM → ALG'})
                      </span>
                    </div>
                    <div className="flex items-center sm:justify-end gap-1.5 mt-1">
                      <StatusBadge status={selectedTrip.status} type="trip" locale={locale} />
                      {relatedManifest && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border ${
                            relatedManifest.status === 'CLOSED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {relatedManifest.id} ({relatedManifest.status})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transported Weight Breakdown (Rules 77-80) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {isAr ? 'الوزن الفعلي المنقول (Transported Weight)' : 'Manifest Transported Weight'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowShipmentsList(!showShipmentsList)}
                    className="text-[11px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>
                      {showShipmentsList
                        ? isAr
                          ? 'إخفاء الشحنات'
                          : 'Hide Shipments'
                        : isAr
                        ? `عرض الشحنات (${shipmentsInManifest.length})`
                        : `View Shipments (${shipmentsInManifest.length})`}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${
                        showShipmentsList ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Weight Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {isAr ? 'الوزن المنقول الفعلي' : 'Transported Weight'}
                    </span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {preview.transportedWeightKg.toFixed(2)} KG
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {isAr ? 'عدد الشحنات في المانيفست' : 'Shipments Count'}
                    </span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {shipmentsInManifest.length || relatedManifest?.totalPackages || 0}{' '}
                      {isAr ? 'طرد' : 'pkgs'}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {isAr ? 'السعة الاسمية (مستبعدة)' : 'Available Weight (Ignored)'}
                    </span>
                    <span className="text-sm font-bold font-mono text-slate-400 line-through">
                      {(selectedTrip.availableWeightKg || 0).toFixed(2)} KG
                    </span>
                  </div>
                </div>

                {/* Notice banner on Weight Rule */}
                <div className="flex items-start gap-2 text-[11px] text-slate-600 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/60">
                  <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    {isAr
                      ? 'قاعدة الحسبة المالية: يتم احتساب أرباح المسافر حصراً بناءً على مجموع الأوزان الفعلية للشحنات المفرغة في المانيفست المغلق (12.00 KG) دون أي اعتماد على السعة المتاحة (availableWeightKg).'
                      : 'Audit Rule: Payout is calculated strictly on the sum of verified actual weights in the closed manifest. Nominal available weight is strictly ignored.'}
                  </span>
                </div>

                {/* Accordion List of Manifest Shipments */}
                {showShipmentsList && (
                  <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                    <div className="text-[11px] font-bold text-slate-700">
                      {isAr ? 'قائمة الشحنات المرتبطة بالمانيفست والأوزان المعتمدة:' : 'Linked Shipments & Weights:'}
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pe-1">
                      {shipmentsInManifest.map((s, idx) => (
                        <div
                          key={s.id}
                          className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-bold">#{idx + 1}</span>
                            <span className="font-bold text-slate-900">{s.trackingNumber}</span>
                            <span className="text-slate-500 text-[10px]">{s.itemDescription}</span>
                          </div>
                          <span className="font-bold text-amber-800">
                            {(s.actualWeightKg ?? s.estimatedWeightKg ?? 0).toFixed(2)} KG
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing Engine & Compensation Rate (TRAVELER_COMPENSATION Only) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {isAr ? 'محرك تسعير المسافر المعتمد' : 'Traveler Compensation Pricing'}
                    </h3>
                  </div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {preview.rateType} ({preview.rateVersion})
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>{isAr ? 'نوع التعرفة (Rate Type)' : 'Rate Type'}:</span>
                    <span className="font-mono font-bold text-slate-900">TRAVELER_COMPENSATION</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>{isAr ? 'تعرفة أرباح المسافر للمسار' : 'Compensation Rate'}:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {preview.travelerRatePerKg.toFixed(2)} {preview.baseCurrency} / KG
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>{isAr ? 'معرف بطاقة التعرفة' : 'Rate Card Reference'}:</span>
                    <span className="font-mono text-slate-700">{preview.rateCardId}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-slate-900 font-bold">
                    <span>{isAr ? 'الربح الأساسي للمسافر (Base Earnings)' : 'Base Earnings'}:</span>
                    <span className="text-base font-mono text-amber-700">
                      {preview.baseEarnings.toFixed(2)} {preview.baseCurrency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Treasury & FX Conversion Drawer (Section 96) */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    {isAr ? 'عملة استلام المستحقات المطلوبة من المسافر' : 'Traveler Payout Currency'}
                  </label>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                    {isAr ? 'طلب المسافر المسجل' : 'Registered Preference'}: {currentHub.countryCode === 'JOR' ? 'JOD' : 'DZD'}
                  </span>
                </div>

                {/* Currency Selection Pills */}
                <div className="grid grid-cols-3 gap-2">
                  {(['DZD', 'JOD', 'USD'] as Currency[]).map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      disabled={isAlreadySettled}
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

                {/* FX Quote Lock Banner if Foreign Currency */}
                {!isSameCurrency ? (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <Lock className="w-4 h-4 text-amber-700" />
                        <span>{isAr ? 'سعر الصرف مقفل لهذه التسوية' : 'FX Quote Locked'}</span>
                      </div>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white text-amber-800 border border-amber-200">
                        {quoteId}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 block">
                          {isAr ? 'زوج العملات والجانب' : 'FX Pair & Side'}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {preview.fxPair || 'JOD / DZD'} ({preview.fxSide})
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">
                          {isAr ? 'سعر الصرف المطبق (THOUESA BUY)' : 'Applied FX Rate'}
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          {preview.appliedFxRate} ({preview.fxRateVersion || 'V2'})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 text-[11px]">
                      <span className="text-slate-500">
                        {isAr ? 'معرف التسعير' : 'Rate ID'}: {preview.fxRateId || 'FX-JOD-DZD-v2'}
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
                    <span>
                      {isAr
                        ? 'الصرف بنفس عملة الأرباح الأساسية (JOD) — لا يلزم تحويل عملة (FX Side: NONE, Rate: 1.0)'
                        : 'Same currency payout (JOD) - No FX conversion required (FX Side: NONE, Rate: 1.0)'}
                    </span>
                  </div>
                )}
              </div>

              {/* 13-Point Payout Readiness Checklist */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {isAr ? 'قائمة التحقق من جاهزية الصرف (Readiness Checklist)' : 'Payout Readiness Checklist'}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      !preview.isBlocked && !isAlreadySettled
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {!preview.isBlocked && !isAlreadySettled
                      ? isAr
                        ? 'مكتمل وجاهز'
                        : 'Complete'
                      : isAr
                      ? 'غير مكتمل'
                      : 'Incomplete'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {/* 1 */}
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-slate-700">{isAr ? 'المسافر معتمد وموثق' : 'Traveler verified'}</span>
                  </div>

                  {/* 2 */}
                  <div className="flex items-center gap-2">
                    {selectedTrip.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    )}
                    <span className="text-slate-700">
                      {isAr ? 'حالة الرحلة: COMPLETED' : 'Trip status: COMPLETED'}
                    </span>
                  </div>

                  {/* 3 */}
                  <div className="flex items-center gap-2">
                    {relatedManifest?.status === 'CLOSED' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    )}
                    <span className="text-slate-700">
                      {isAr ? 'حالة المانيفست: CLOSED' : 'Manifest status: CLOSED'}
                    </span>
                  </div>

                  {/* 4 */}
                  <div className="flex items-center gap-2">
                    {relatedManifest?.status !== 'DISCREPANCY' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    )}
                    <span className="text-slate-700">
                      {isAr ? 'لا توجد فروقات غير محلولة' : 'No open discrepancies'}
                    </span>
                  </div>

                  {/* 5 */}
                  <div className="flex items-center gap-2">
                    {preview.transportedWeightKg > 0 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    )}
                    <span className="text-slate-700">
                      {isAr
                        ? `الوزن الفعلي المنقول: ${preview.transportedWeightKg.toFixed(2)} KG`
                        : `Transported weight: ${preview.transportedWeightKg.toFixed(2)} KG`}
                    </span>
                  </div>

                  {/* 6 */}
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-slate-700">
                      {isAr ? 'تعرفة TRAVELER_COMPENSATION' : 'TRAVELER_COMPENSATION rate'}
                    </span>
                  </div>

                  {/* 7 */}
                  <div className="flex items-center gap-2">
                    {!preview.blockingFlags?.pricingBlocked ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    )}
                    <span className="text-slate-700">
                      {isAr
                        ? `قيمة التعرفة: ${preview.travelerRatePerKg.toFixed(2)} ${preview.baseCurrency}/KG`
                        : `Rate value: ${preview.travelerRatePerKg.toFixed(2)} ${preview.baseCurrency}/KG`}
                    </span>
                  </div>

                  {/* 8 */}
                  <div className="flex items-center gap-2">
                    {!preview.blockingFlags?.fxBlocked ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    )}
                    <span className="text-slate-700">
                      {isAr
                        ? `سعر الصرف (BUY Side): ${preview.appliedFxRate}`
                        : `FX Rate (BUY Side): ${preview.appliedFxRate}`}
                    </span>
                  </div>

                  {/* 9 */}
                  <div className="flex items-center gap-2">
                    {!isAlreadySettled ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    )}
                    <span className="text-slate-700">
                      {isAlreadySettled
                        ? isAr
                          ? 'العملية مسددة مسبقاً (SETTLED)'
                          : 'Already settled'
                        : isAr
                        ? 'عدم وجود تسديد مسبق'
                        : 'No prior settlement'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Block Alert (if blocked) */}
              {preview.isBlocked && !isAlreadySettled && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs space-y-1 text-rose-800">
                  <div className="flex items-center gap-1.5 font-bold text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-700" />
                    <span>{isAr ? 'صرف المستحقات محجوب حالياً' : 'Payout Blocked'}</span>
                  </div>
                  <p className="text-rose-700">{preview.blockReason}</p>
                </div>
              )}

              {/* Final Converted Amount Snapshot Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">
                    {isAr ? 'صافي المبلغ النهائي للصرف للمسافر' : 'Final Traveler Payout Amount'}
                  </span>
                  <div className="text-end">
                    <span className="text-2xl font-bold font-mono text-amber-400">
                      {finalPayoutAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      {payoutCurrency}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-3 border-t border-slate-800">
                  <div>
                    <span>{isAr ? 'الربح الأساسي' : 'Base Earnings'}: </span>
                    <span className="font-mono text-slate-200">
                      {preview.baseEarnings.toFixed(2)} {preview.baseCurrency}
                    </span>
                  </div>
                  <div className="text-end">
                    <span>{isAr ? 'سعر الصرف' : 'Applied FX'}: </span>
                    <span className="font-mono text-slate-200">
                      {preview.appliedFxRate} ({preview.fxSide})
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes Input */}
              {!isAlreadySettled && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isAr ? 'ملاحظات الصرف والتحويل (اختياري)' : 'Payout Notes & Reference (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={payoutNotes}
                    onChange={(e) => setPayoutNotes(e.target.value)}
                    placeholder={
                      isAr
                        ? `صرف مستحقات الرحلة ${selectedTrip.flightNumber} للمسافر ${selectedTrip.travelerName}`
                        : `Traveler payout for flight ${selectedTrip.flightNumber}`
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                {isAlreadySettled ? (
                  <div className="w-full flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-2 text-blue-800 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span>
                        {isAr
                          ? `تم صرف المستحقات مسبقاً (${existingSettlement?.settlementNumber})`
                          : `Settlement disbursed (${existingSettlement?.settlementNumber})`}
                      </span>
                    </div>
                    {onViewReceipt && (
                      <button
                        type="button"
                        onClick={() => onViewReceipt(existingSettlement)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                      >
                        {isAr ? 'عرض الإيصال' : 'View Receipt'}
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={preview.isBlocked}
                      onClick={() => setIsReviewOpen(true)}
                      className={`w-full sm:w-auto px-4 py-2.5 font-bold text-xs rounded-xl cursor-pointer ${
                        preview.isBlocked
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isAr ? 'مراجعة الحسبة المالية (Audit)' : 'Review Calculation'}
                    </button>

                    <button
                      type="button"
                      disabled={preview.isBlocked || !canProcessPayout}
                      onClick={handleConfirmPayout}
                      className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer ${
                        preview.isBlocked || !canProcessPayout
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isAr ? 'تأكيد صرف المستحقات' : 'Confirm & Disburse Payout'}</span>
                    </button>
                  </>
                )}
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

      {/* Review Audit Modal */}
      {isReviewOpen && selectedTrip && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
                <h3 className="text-base font-bold text-slate-900">
                  {isAr ? 'مراجعة وتدقيق الحسبة المالية لصرف المستحقات' : 'Traveler Settlement Audit Review'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'المسافر' : 'Traveler'}:</span>
                  <span className="font-bold text-slate-900">{selectedTrip.travelerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'الرحلة والمانيفست' : 'Flight & Manifest'}:</span>
                  <span className="font-bold text-slate-900">
                    {selectedTrip.flightNumber} / {relatedManifest?.id || 'MF-0142'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'الوزن الفعلي المنقول' : 'Transported Weight'}:</span>
                  <span className="font-bold text-slate-900">{preview.transportedWeightKg.toFixed(2)} KG</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'تعرفة أرباح المسافر' : 'Traveler Rate'}:</span>
                  <span className="font-bold text-slate-900">
                    {preview.travelerRatePerKg.toFixed(2)} {preview.baseCurrency} / KG ({preview.rateVersion})
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">{isAr ? 'الربح الأساسي' : 'Base Earnings'}:</span>
                  <span className="font-bold text-amber-700">
                    {preview.baseEarnings.toFixed(2)} {preview.baseCurrency}
                  </span>
                </div>

                {!isSameCurrency && (
                  <>
                    <div className="flex justify-between text-amber-800">
                      <span>{isAr ? 'سعر الصرف المطبق (THOUESA BUY)' : 'Applied FX Rate'}:</span>
                      <span className="font-bold">
                        {preview.appliedFxRate} ({preview.fxSide})
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>{isAr ? 'معرف القفل' : 'Lock Quote'}:</span>
                      <span>{quoteId}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between text-sm font-bold text-emerald-800 pt-2 border-t border-slate-200">
                  <span>{isAr ? 'المبلغ النهائي للصرف' : 'Final Payout'}:</span>
                  <span>
                    {finalPayoutAmount.toFixed(2)} {payoutCurrency}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReviewOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
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
                  <span className="text-slate-500">{isAr ? 'الرحلة والمانيفست' : 'Flight/Manifest'}:</span>
                  <span className="font-bold text-slate-900">
                    {lastSettlement.flightNumber} / {lastSettlement.manifestId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'الوزن الفعلي المنقول' : 'Weight'}:</span>
                  <span className="font-bold text-slate-900">
                    {(lastSettlement.transportedWeightKg || 12.0).toFixed(2)} KG
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'الربح الأساسي' : 'Base Earnings'}:</span>
                  <span>
                    {lastSettlement.baseAmount.toLocaleString()} {lastSettlement.baseCurrency}
                  </span>
                </div>
                {lastSettlement.fxSide !== 'NONE' && (
                  <div className="flex justify-between text-amber-700">
                    <span>{isAr ? 'سعر الصرف المطبق (BUY)' : 'FX Applied (BUY)'}:</span>
                    <span>
                      {lastSettlement.appliedFxRate} ({lastSettlement.fxSide})
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-emerald-800 pt-2 border-t border-slate-200">
                  <span>{isAr ? 'المبلغ المصروف' : 'Disbursed Payout'}:</span>
                  <span>
                    {lastSettlement.finalAmount.toFixed(2)} {lastSettlement.settlementCurrency}
                  </span>
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
