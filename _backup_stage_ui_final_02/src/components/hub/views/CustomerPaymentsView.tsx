import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Search,
  DollarSign,
  ArrowRight,
  Clock,
  Lock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Coins,
  ShieldCheck,
  User,
  Package,
  Printer,
  ChevronRight,
  Info,
  Scale,
  RefreshCw,
  Filter,
  Check,
  X,
  CreditCard,
  Ban,
  Eye,
  Calendar,
  Layers,
  ArrowUpRight,
  Sparkles,
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
import { DetailsDrawer } from '../common/DetailsDrawer';
import {
  calculateCustomerShippingPreview,
  calculateChargeableWeight,
  findShippingRate,
} from '../../../lib/hubFinancialPreview';
import { INITIAL_SHIPPING_RATES } from '../../../lib/hubOperationsData';

export interface CustomerPaymentsViewProps {
  shipments: Shipment[];
  exchangeRates: DailyExchangeRate[];
  shippingRates?: ShippingRate[];
  settlements?: SettlementRecord[];
  currentHub: Hub;
  currentUser: UserType;
  locale: Locale;
  onRecordSettlement: (record: SettlementRecord) => void;
  onViewReceipt?: (record: SettlementRecord) => void;
}

type CollectionTab = 'ALL' | 'PENDING' | 'READY' | 'PAID' | 'BLOCKED';

export const CustomerPaymentsView: React.FC<CustomerPaymentsViewProps> = ({
  shipments,
  exchangeRates,
  shippingRates = INITIAL_SHIPPING_RATES,
  settlements = [],
  currentHub,
  currentUser,
  locale,
  onRecordSettlement,
  onViewReceipt,
}) => {
  const isAr = locale === 'ar';

  // Permission Check
  const canProcess =
    currentUser.role === 'FINANCIAL_OFFICER' ||
    currentUser.role === 'MASTER_ADMIN' ||
    currentUser.permissions?.includes('collection.process') ||
    currentUser.permissions?.includes('admin.all');

  // Offline detection
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Filter shipments originating from or handled by this hub
  const hubShipments = useMemo(() => {
    return shipments.filter(
      (s) =>
        s.originHubId === currentHub.id ||
        s.destinationHubId === currentHub.id ||
        !s.originHubId
    );
  }, [shipments, currentHub]);

  // Tab & Search State
  const [activeTab, setActiveTab] = useState<CollectionTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>(
    hubShipments[0]?.id || ''
  );

  const selectedShipment = useMemo(() => {
    return (
      hubShipments.find((s) => s.id === selectedShipmentId) ||
      hubShipments[0] ||
      null
    );
  }, [hubShipments, selectedShipmentId]);

  // Payment Form State
  const [paymentCurrency, setPaymentCurrency] = useState<Currency>(
    currentHub.countryCode === 'JOR' ? 'DZD' : 'JOD'
  );
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'POS_CARD'>('CASH');
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Confirmation Modal & Success Receipt State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lastSettlement, setLastSettlement] = useState<SettlementRecord | null>(null);
  const [inspectSettlement, setInspectSettlement] = useState<SettlementRecord | null>(null);

  // FX Quote Lock State (5-minute countdown)
  const [quoteId, setQuoteId] = useState<string>(`FXQ-${Date.now().toString().slice(-6)}`);
  const [quoteTimeRemaining, setQuoteTimeRemaining] = useState<number>(300);
  const [isQuoteExpired, setIsQuoteExpired] = useState(false);

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
  const preview = useMemo(() => {
    return calculateCustomerShippingPreview(
      selectedShipment || {},
      paymentCurrency,
      shippingRates && shippingRates.length > 0 ? shippingRates : INITIAL_SHIPPING_RATES,
      exchangeRates,
      currentHub.countryCode === 'DZA' ? 'DZ' : 'JO',
      currentHub.countryCode === 'DZA' ? 'JO' : 'DZ'
    );
  }, [selectedShipment, paymentCurrency, shippingRates, exchangeRates, currentHub]);

  const baseCurrency = preview.baseCurrency;
  const billingWeight = preview.billingWeightKg;
  const ratePerKg = preview.ratePerKg;
  const rateVersion = preview.rateVersion || 'V2';
  const rateType = preview.rateType || 'CUSTOMER_SHIPPING';
  const pricingModel = preview.pricingModel || 'PER_KG';
  const baseCharge = preview.baseCharge;
  const convertedAmountDue = preview.convertedAmountDue;
  const appliedFxRate = preview.appliedFxRate;
  const fxSide = preview.fxSide;
  const fxPair =
    preview.fxPair ||
    (baseCurrency === paymentCurrency
      ? 'NONE'
      : `${baseCurrency} / ${paymentCurrency}`);
  const activeRateRecord = preview.rateRecord;
  const activeRateCard = preview.rateCard;
  const isSameCurrency = paymentCurrency === baseCurrency;
  const isBlocked = preview.fxBlocked || preview.pricingBlocked;
  const blockReason = preview.blockReason;

  // Check if this shipment already has a PAID CUSTOMER_PAYMENT
  const existingPaidSettlement = useMemo(() => {
    if (!selectedShipment) return undefined;
    return settlements.find(
      (stl) =>
        (stl.shipmentId === selectedShipment.id ||
          stl.trackingNumber === selectedShipment.trackingNumber) &&
        stl.type === 'CUSTOMER_PAYMENT' &&
        stl.status === 'PAID'
    );
  }, [selectedShipment, settlements]);

  const isAlreadyPaid =
    selectedShipment?.paymentStatus === 'PAID' || Boolean(existingPaidSettlement);

  const numReceived = parseFloat(amountReceived) || 0;
  const changeDue = Math.max(0, numReceived - convertedAmountDue);
  const isAmountSufficient = numReceived >= convertedAmountDue;

  // 10-point Collection Readiness Checklist
  const readinessChecklist = useMemo(() => {
    return [
      {
        id: 'shipment_valid',
        labelAr: 'صحة بيانات الشحنة',
        labelEn: 'Shipment valid',
        pass: Boolean(selectedShipment && selectedShipment.currentStatus !== 'CANCELLED' && selectedShipment.currentStatus !== 'REJECTED_PROHIBITED'),
      },
      {
        id: 'customer_shipping_rate',
        labelAr: 'توفر تعرفة شحن عملاء نشطة (CUSTOMER_SHIPPING)',
        labelEn: 'CUSTOMER_SHIPPING rate found',
        pass: Boolean(activeRateCard && activeRateCard.rateType === 'CUSTOMER_SHIPPING'),
      },
      {
        id: 'pricing_value_valid',
        labelAr: 'صحة قيمة التعرفة (غير صفرية ومطابقة للنموذج)',
        labelEn: 'Pricing value valid',
        pass: Boolean(!preview.pricingBlocked && baseCharge > 0),
      },
      {
        id: 'billing_weight_valid',
        labelAr: 'الوزن المحاسبي معتمد وصحيح (> 0)',
        labelEn: 'Billing weight valid',
        pass: billingWeight > 0,
      },
      {
        id: 'base_amount_calc',
        labelAr: 'احتساب المبلغ الأساسي آلياً',
        labelEn: 'Base amount calculated',
        pass: baseCharge > 0,
      },
      {
        id: 'payment_currency_valid',
        labelAr: 'تحديد عملة سداد مقبولة',
        labelEn: 'Payment currency valid',
        pass: Boolean(paymentCurrency),
      },
      {
        id: 'active_fx_found',
        labelAr: isSameCurrency ? 'مطابقة العملة (لا تتطلب تحويل)' : 'توفر سعر صرف نشط ومعتمد',
        labelEn: isSameCurrency ? 'Same currency (no FX needed)' : 'Active FX found if needed',
        pass: isSameCurrency || Boolean(activeRateRecord && activeRateRecord.status === 'ACTIVE'),
      },
      {
        id: 'fx_side_auto',
        labelAr: 'تحديد جانب الصرف آلياً (BUY / SELL / NONE)',
        labelEn: 'FX side selected automatically',
        pass: Boolean(fxSide),
      },
      {
        id: 'amount_due_calc',
        labelAr: 'احتساب المبلغ المستحق النهائي بدقة',
        labelEn: 'Amount due calculated',
        pass: convertedAmountDue > 0,
      },
      {
        id: 'no_duplicate_paid',
        labelAr: 'عدم وجود سداد مسبق لنفس الشحنة (منع الازدواج)',
        labelEn: 'No existing paid duplicate',
        pass: !isAlreadyPaid,
      },
    ];
  }, [
    selectedShipment,
    activeRateCard,
    preview.pricingBlocked,
    baseCharge,
    billingWeight,
    paymentCurrency,
    isSameCurrency,
    activeRateRecord,
    fxSide,
    convertedAmountDue,
    isAlreadyPaid,
  ]);

  const allReadinessPassed = readinessChecklist.every((item) => item.pass);

  // Pre-calculate status for all shipments in list
  const evaluatedShipments = useMemo(() => {
    return hubShipments.map((s) => {
      const sPaid = s.paymentStatus === 'PAID';
      const p = calculateCustomerShippingPreview(
        s,
        s.originHubId === 'hub-alg' ? 'DZD' : 'JOD',
        shippingRates,
        exchangeRates,
        s.originHubId === 'hub-alg' ? 'DZ' : 'JO',
        s.originHubId === 'hub-alg' ? 'JO' : 'DZ'
      );
      const isBlock = p.fxBlocked || p.pricingBlocked;
      return {
        shipment: s,
        isPaid: sPaid,
        isBlocked: isBlock,
        preview: p,
      };
    });
  }, [hubShipments, shippingRates, exchangeRates]);

  // 4 KPI Cards Calculations
  const kpis = useMemo(() => {
    const pendingCount = evaluatedShipments.filter((e) => !e.isPaid && !e.isBlocked).length;
    const todayStr = new Date().toISOString().slice(0, 10);
    const paidToday = settlements.filter(
      (stl) =>
        stl.type === 'CUSTOMER_PAYMENT' &&
        stl.status === 'PAID' &&
        stl.processedAt?.startsWith(todayStr)
    );
    const blockedPricingCount = evaluatedShipments.filter((e) => e.preview.pricingBlocked).length;
    const blockedFxCount = evaluatedShipments.filter((e) => !e.preview.pricingBlocked && e.preview.fxBlocked).length;

    return {
      pendingCount,
      paidTodayCount: paidToday.length,
      blockedPricingCount,
      blockedFxCount,
    };
  }, [evaluatedShipments, settlements]);

  // Filtered shipments list based on Tab & Search
  const filteredList = useMemo(() => {
    return evaluatedShipments.filter(({ shipment: s, isPaid, isBlocked: isBlk }) => {
      // Tab filter
      if (activeTab === 'PENDING' && (isPaid || isBlk)) return false;
      if (activeTab === 'READY' && (isPaid || isBlk)) return false;
      if (activeTab === 'PAID' && !isPaid) return false;
      if (activeTab === 'BLOCKED' && !isBlk) return false;

      // Search query filter
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.trackingNumber.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.senderName && s.senderName.toLowerCase().includes(q)) ||
        (s.senderPhone && s.senderPhone.toLowerCase().includes(q)) ||
        (s.recipientPhone && s.recipientPhone.toLowerCase().includes(q))
      );
    });
  }, [evaluatedShipments, activeTab, searchQuery]);

  const handleOpenConfirmation = () => {
    if (!isOnline) {
      alert(
        isAr
          ? 'لا يمكن إتمام عملية التحصيل في وضع عدم الاتصال (Offline).'
          : 'Customer collection cannot be completed while offline.'
      );
      return;
    }
    if (!canProcess) {
      alert(
        isAr
          ? 'عذراً، ليس لديك صلاحية تنفيذ التحصيلات المالية (collection.process).'
          : 'Permission denied: Requires collection.process permission.'
      );
      return;
    }
    if (isAlreadyPaid) {
      alert(isAr ? 'تم سداد رسوم هذه الشحنة مسبقاً.' : 'Payment already completed for this shipment.');
      return;
    }
    if (isBlocked) {
      alert(blockReason || (isAr ? 'التحصيل محظور لوجود نقص في التعرفة أو الصرف.' : 'Collection blocked.'));
      return;
    }
    if (isQuoteExpired && !isSameCurrency) {
      alert(isAr ? 'انتهت صلاحية سعر الصرف المقفل. يرجى تجديد التسعير' : 'FX Quote expired. Please refresh rate lock.');
      return;
    }
    if (!isAmountSufficient && paymentMethod === 'CASH') {
      alert(isAr ? 'المبلغ المستلم أقل من المبلغ المطلوب' : 'Received amount is less than total due.');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmCollection = () => {
    if (!selectedShipment) return;

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

      // Pricing Snapshot (LOCKED)
      shippingRateId: activeRateCard?.id,
      shippingRateVersion: rateVersion,
      rateType,
      pricingModel,
      appliedShippingRate: ratePerKg,
      billingWeightKg: billingWeight,
      baseAmount: baseCharge,
      baseCurrency,

      // FX Conversion Snapshot (LOCKED if applicable)
      settlementCurrency: paymentCurrency,
      exchangeRateId: activeRateRecord?.id || (isSameCurrency ? undefined : 'FX-INSTANT'),
      rateVersion: `${rateVersion} / ${activeRateRecord?.version ? `v${activeRateRecord.version}` : 'N/A'}`,
      exchangeRateVersion: activeRateRecord?.version || 'N/A',
      fxSide,
      appliedFxRate: isSameCurrency ? 1.0 : appliedFxRate,
      convertedAmount: convertedAmountDue,
      amountDue: convertedAmountDue,
      amountReceived: numReceived || convertedAmountDue,
      paymentMethod,

      fees: 0,
      adjustments: 0,
      finalAmount: convertedAmountDue,

      status: 'PAID',
      idempotencyKey: `IDEMP-PAY-${selectedShipment.id}-${Date.now()}`,
      processedBy: currentUser.staffCode || currentUser.id,
      processedByName: currentUser.fullName,
      processedAt: new Date().toISOString(),
      receiptNumber: rcpNumber,
      notes:
        paymentNotes ||
        (isAr
          ? `تحصيل رسوم شحن كاونتر فرع ${currentHub.nameAr} بطريقة ${paymentMethod}`
          : `Counter payment at ${currentHub.nameEn}`),
    };

    onRecordSettlement(newSettlement);
    setLastSettlement(newSettlement);
    setShowConfirmModal(false);
    setAmountReceived('');
  };

  const minutes = Math.floor(quoteTimeRemaining / 60);
  const seconds = quoteTimeRemaining % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="space-y-6">
      {/* Offline Alert Banner if applicable */}
      {!isOnline && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs text-amber-900 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              {isAr
                ? 'النظام في وضع عدم الاتصال (Offline) — شاشة التحصيل للعرض فقط، ولا يمكن تأكيد عمليات السداد.'
                : 'Customer collection is in Read-Only mode while offline. Payment actions are disabled.'}
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-amber-200 text-amber-950 text-[10px] font-mono font-bold">
            READ ONLY
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Receipt className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {isAr ? 'تحصيل العملاء' : 'Customer Collections'}
                </h1>
                <span className="text-xs text-slate-400 font-mono">CUSTOMER_PAYMENT</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                {isAr
                  ? 'حساب المبلغ المستحق على العميل والتحقق من سعر الشحن وسعر الصرف وتسجيل عملية التحصيل بصورة قابلة للتتبع.'
                  : 'Calculate amount due, verify active customer shipping and FX rates, and record atomic settlements.'}
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

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Pending Collections */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>{isAr ? 'التحصيلات المعلقة' : 'Pending Collections'}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {kpis.pendingCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isAr ? 'بانتظار سداد العميل' : 'Awaiting payment'}
          </span>
        </div>

        {/* Card 2: Collected Today */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>{isAr ? 'المحصلة اليوم' : 'Collected Today'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            {kpis.paidTodayCount}
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 block font-medium">
            {isAr ? 'تسويات PAID مكتملة' : 'Settled transactions'}
          </span>
        </div>

        {/* Card 3: Blocked Pricing */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>{isAr ? 'حظر التعرفة' : 'Blocked Pricing'}</span>
            <Ban className="w-4 h-4 text-rose-500" />
          </div>
          <div className={`text-2xl font-bold font-mono ${kpis.blockedPricingCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {kpis.blockedPricingCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isAr ? 'تعرفة مفقودة أو غير صالحة' : 'Missing/invalid rate'}
          </span>
        </div>

        {/* Card 4: Blocked FX */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>{isAr ? 'حظر سعر الصرف' : 'Blocked FX'}</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-2xl font-bold font-mono ${kpis.blockedFxCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {kpis.blockedFxCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isAr ? 'لا يوجد زوج صرف نشط' : 'No active FX pair'}
          </span>
        </div>
      </div>

      {/* Main Layout: Left Queue & Right Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filter Tabs, Search & Shipment Queue (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl mb-3 overflow-x-auto text-[11px] font-bold">
              {(['ALL', 'PENDING', 'READY', 'PAID', 'BLOCKED'] as CollectionTab[]).map((tab) => {
                const label =
                  tab === 'ALL'
                    ? isAr ? 'الكل' : 'All'
                    : tab === 'PENDING'
                    ? isAr ? 'معلق' : 'Pending'
                    : tab === 'READY'
                    ? isAr ? 'جاهز' : 'Ready'
                    : tab === 'PAID'
                    ? isAr ? 'مسدد' : 'Paid'
                    : isAr ? 'محجوب' : 'Blocked';
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === tab
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isAr
                    ? 'بحث برقم التتبع، الشحنة، العميل، الهاتف...'
                    : 'Search by tracking, shipment ID, customer...'
                }
                className="w-full ps-9 pe-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              />
            </div>

            {/* Shipment Queue List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pe-1">
              {filteredList.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  {searchQuery
                    ? isAr
                      ? 'لا توجد عمليات تطابق البحث الحالي.'
                      : 'No collections match current search.'
                    : isAr
                    ? 'لا توجد عمليات تحصيل معلقة حالياً.'
                    : 'No pending collections found.'}
                </div>
              ) : (
                filteredList.map(({ shipment: s, isPaid, isBlocked: isBlk, preview: p }) => {
                  const isSelected = selectedShipment?.id === s.id;
                  const sWeight = s.actualWeightKg ?? s.estimatedWeightKg ?? 3.2;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedShipmentId(s.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {s.trackingNumber}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isPaid ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              {isAr ? 'تم السداد' : 'PAID'}
                            </span>
                          ) : isBlk ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold flex items-center gap-0.5">
                              <Ban className="w-2.5 h-2.5" />
                              <span>{isAr ? 'محجوب' : 'BLOCKED'}</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                              {isAr ? 'جاهز للتحصيل' : 'READY'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-slate-500 text-[11px] mt-1">
                        <span>{s.senderName || (isAr ? 'مرسل الكاونتر' : 'Counter Sender')}</span>
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                          {sWeight.toFixed(2)} KG
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 pt-1 border-t border-slate-100 font-mono">
                        <span>
                          {s.originHubId === 'hub-alg' ? 'DZ → JO' : 'JO → DZ'}
                        </span>
                        <span className="font-bold text-slate-700">
                          {p.baseCharge > 0 ? `${p.baseCharge.toFixed(2)} ${p.baseCurrency}` : '—'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Collection Workspace (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedShipment ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
              {/* Section 1: Shipment & Customer Summary */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                      {isAr ? 'الشحنة المحددة للتحصيل' : 'Selected Shipment'}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono font-bold text-lg text-slate-900">
                        {selectedShipment.trackingNumber}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">({selectedShipment.id})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={selectedShipment.currentStatus} locale={locale} size="sm" />
                    {isAlreadyPaid && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold">
                        {isAr ? 'مسدد مسبقاً (PAID)' : 'ALREADY PAID'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer Details Box */}
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">{isAr ? 'المرسل (دافع الرسوم)' : 'Customer / Payer'}</span>
                    <span className="font-bold text-slate-800">{selectedShipment.senderName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">{isAr ? 'هاتف العميل' : 'Phone'}</span>
                    <span className="font-mono text-slate-700">{selectedShipment.senderPhone || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">{isAr ? 'المسار والخدمة' : 'Route & Service'}</span>
                    <span className="font-bold text-slate-700">
                      {selectedShipment.originHubId === 'hub-alg' ? 'DZ → JO' : 'JO → DZ'} ({selectedShipment.serviceType || 'PARCEL'})
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">{isAr ? 'سياسة الدفع' : 'Payment Policy'}</span>
                    <span className="font-mono font-bold text-slate-700">
                      {selectedShipment.paymentPolicy || 'AT_ORIGIN'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Payment Currency Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    {isAr ? 'عملة سداد العميل في الكاونتر' : 'Payment Currency at Counter'}
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {isAr ? `العملة الأساسية للتعرفة: ${baseCurrency}` : `Base Currency: ${baseCurrency}`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentCurrency('DZD')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      paymentCurrency === 'DZD'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{isAr ? 'الدينار الجزائري (DZD)' : 'Algerian Dinar (DZD)'}</span>
                    {baseCurrency !== 'DZD' && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-950 text-[10px] font-mono">
                        FX
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentCurrency('JOD')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      paymentCurrency === 'JOD'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{isAr ? 'الدينار الأردني (JOD)' : 'Jordanian Dinar (JOD)'}</span>
                    {baseCurrency === 'JOD' && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-mono">
                        BASE
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Section 3: Exact Financial & FX Calculation Breakdown */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-sans">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-slate-600" />
                    <span>{isAr ? 'تفاصيل احتساب الرسوم وتحويل العملة' : 'Financial Breakdown'}</span>
                  </span>
                  {!isSameCurrency && !isBlocked && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>{quoteId} ({timeFormatted})</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleRefreshQuote}
                        title={isAr ? 'تجديد القفل' : 'Refresh Quote'}
                        className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Common Base Breakdown */}
                <div className="grid grid-cols-2 gap-y-2 text-slate-700">
                  <div className="text-slate-500 font-sans">{isAr ? 'الشحنة' : 'Shipment'}:</div>
                  <div className="font-bold text-slate-900 text-end">{selectedShipment.trackingNumber}</div>

                  <div className="text-slate-500 font-sans">{isAr ? 'الوزن المعتمد للفوترة' : 'Billing Weight'}:</div>
                  <div className="font-bold text-slate-900 text-end">{billingWeight.toFixed(2)} KG</div>

                  <div className="text-slate-500 font-sans">{isAr ? 'نوع التعرفة' : 'Rate Type'}:</div>
                  <div className="font-bold text-slate-900 text-end">{rateType}</div>

                  <div className="text-slate-500 font-sans">{isAr ? 'سعر الكيلوغرام' : 'Rate'}:</div>
                  <div className="font-bold text-slate-900 text-end">{ratePerKg.toFixed(2)} {baseCurrency} / KG</div>

                  <div className="text-slate-500 font-sans">{isAr ? 'إصدار التعرفة' : 'Rate Version'}:</div>
                  <div className="font-bold text-emerald-800 text-end">{rateVersion}</div>

                  <div className="text-slate-500 font-sans">{isAr ? 'المبلغ الأساسي' : 'Base Amount'}:</div>
                  <div className="font-bold text-slate-900 text-end">{baseCharge.toFixed(2)} {baseCurrency}</div>
                </div>

                <div className="border-t border-slate-200 pt-2 grid grid-cols-2 gap-y-2 text-slate-700">
                  {!isSameCurrency ? (
                    // Foreign Currency Breakdown (e.g. JOD -> DZD)
                    <>
                      <div className="text-slate-500 font-sans">{isAr ? 'عملة السداد' : 'Payment Currency'}:</div>
                      <div className="font-bold text-slate-900 text-end">{paymentCurrency}</div>

                      <div className="text-slate-500 font-sans">{isAr ? 'زوج العملات' : 'FX Pair'}:</div>
                      <div className="font-bold text-slate-900 text-end">{fxPair}</div>

                      <div className="text-slate-500 font-sans">{isAr ? 'جانب الصرف' : 'FX Side'}:</div>
                      <div className="font-bold text-amber-800 text-end">{fxSide}</div>

                      <div className="text-slate-500 font-sans">{isAr ? 'سعر الصرف المعتمد' : 'Applied FX Rate'}:</div>
                      <div className="font-bold text-slate-900 text-end">{appliedFxRate.toFixed(2)}</div>

                      <div className="text-slate-900 font-bold font-sans pt-2 border-t border-slate-300 text-sm">
                        {isAr ? 'المبلغ المطلوب سداده' : 'Amount Due'}:
                      </div>
                      <div className="text-emerald-700 font-bold text-end pt-2 border-t border-slate-300 text-base">
                        {convertedAmountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {paymentCurrency}
                      </div>
                    </>
                  ) : (
                    // Same Currency Breakdown (e.g. JOD -> JOD)
                    <>
                      <div className="text-slate-500 font-sans">{isAr ? 'العملة الأساسية' : 'Base Currency'}:</div>
                      <div className="font-bold text-slate-900 text-end">{baseCurrency}</div>

                      <div className="text-slate-500 font-sans">{isAr ? 'عملة السداد' : 'Payment Currency'}:</div>
                      <div className="font-bold text-slate-900 text-end">{paymentCurrency}</div>

                      <div className="text-slate-500 font-sans">{isAr ? 'جانب الصرف' : 'FX Side'}:</div>
                      <div className="font-bold text-slate-600 text-end">NONE</div>

                      <div className="text-slate-500 font-sans">{isAr ? 'سعر الصرف المعتمد' : 'Applied FX Rate'}:</div>
                      <div className="font-bold text-slate-900 text-end">1</div>

                      <div className="text-slate-900 font-bold font-sans pt-2 border-t border-slate-300 text-sm">
                        {isAr ? 'المبلغ المطلوب سداده' : 'Amount Due'}:
                      </div>
                      <div className="text-emerald-700 font-bold text-end pt-2 border-t border-slate-300 text-base">
                        {baseCharge.toFixed(2)} {paymentCurrency}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Section 4: Blocking Alert (if missing rate or FX) */}
              {isBlocked && (
                <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 text-xs text-rose-900 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{isAr ? 'التحصيل محظور' : 'COLLECTION BLOCKED'}</span>
                    <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-950 text-[10px] font-mono font-bold">
                      BLOCK
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    {blockReason || (isAr ? 'لا تتوفر تعرفة شحن أو سعر صرف نشط لهذه العملية.' : 'Missing active shipping rate or exchange rate.')}
                  </p>
                </div>
              )}

              {/* Section 5: Tendered Amount & Change Due */}
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-medium">
                    {isAr ? 'المبلغ المستحق النهائي' : 'Final Amount Due'}
                  </span>
                  <span className="text-xl font-bold font-mono text-amber-400">
                    {convertedAmountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {paymentCurrency}
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
                      disabled={isAlreadyPaid || isBlocked}
                      className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-2 font-mono font-bold text-white focus:ring-1 focus:ring-amber-400 disabled:opacity-50"
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

              {/* Section 6: Collection Readiness Checklist (10 Items) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="font-bold text-slate-800 text-xs">
                    {isAr ? 'قائمة التحقق المالي للتحصيل (10 معايير)' : 'Collection Readiness Checklist'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${allReadinessPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {readinessChecklist.filter(i => i.pass).length} / 10 PASS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {readinessChecklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-1.5 text-[11px]">
                      {item.pass ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      )}
                      <span className={item.pass ? 'text-slate-700' : 'text-rose-700 font-bold'}>
                        {isAr ? item.labelAr : item.labelEn}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 7: Action Controls & Confirm */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    disabled={isAlreadyPaid || isBlocked}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer disabled:opacity-50 ${
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {isAr ? 'نقداً (Cash)' : 'Cash'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('POS_CARD')}
                    disabled={isAlreadyPaid || isBlocked}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer disabled:opacity-50 ${
                      paymentMethod === 'POS_CARD'
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {isAr ? 'بطاقة بنكية (POS Card)' : 'POS Card'}
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!allReadinessPassed || isAlreadyPaid || isBlocked || !isOnline}
                  onClick={handleOpenConfirmation}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 font-bold text-xs rounded-xl shadow-xs transition-colors ${
                    !allReadinessPassed || isAlreadyPaid || isBlocked || !isOnline
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isAlreadyPaid
                      ? isAr
                        ? 'تم التحصيل مسبقاً (PAID)'
                        : 'Already Paid'
                      : isBlocked
                      ? isAr
                        ? 'التحصيل محظور'
                        : 'Collection Blocked'
                      : isAr
                      ? 'تنفيذ التحصيل وتثبيت التسوية'
                      : 'Complete Collection'}
                  </span>
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

      {/* Confirmation Modal */}
      {showConfirmModal && selectedShipment && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">
                  {isAr ? 'تأكيد عملية التحصيل المالي' : 'Confirm Customer Collection'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">{isAr ? 'الشحنة' : 'Shipment'}:</span>
                  <span className="font-bold text-slate-900">{selectedShipment.trackingNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">{isAr ? 'العميل' : 'Customer'}:</span>
                  <span className="text-slate-800">{selectedShipment.senderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">{isAr ? 'الوزن المعتمد' : 'Billing Weight'}:</span>
                  <span className="text-slate-900">{billingWeight.toFixed(2)} KG</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">{isAr ? 'التعرفة المطبقة' : 'Applied Rate'}:</span>
                  <span className="text-slate-900">{ratePerKg.toFixed(2)} {baseCurrency} ({rateVersion})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">{isAr ? 'المبلغ الأساسي' : 'Base Amount'}:</span>
                  <span className="text-slate-900">{baseCharge.toFixed(2)} {baseCurrency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">{isAr ? 'عملة السداد' : 'Payment Currency'}:</span>
                  <span className="font-bold text-slate-900">{paymentCurrency}</span>
                </div>
                {!isSameCurrency && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">{isAr ? 'سعر الصرف' : 'Applied FX'}:</span>
                      <span className="text-amber-800">{appliedFxRate} ({fxSide})</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-emerald-800">
                  <span className="font-sans">{isAr ? 'المبلغ المستحق' : 'Amount Due'}:</span>
                  <span>{convertedAmountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {paymentCurrency}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-center cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCollection}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAr ? 'تأكيد السداد' : 'Confirm Payment'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Settlement Modal */}
      {lastSettlement && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" />
                <div>
                  <h3 className="text-base font-bold">
                    {isAr ? 'تم التحصيل وتثبيت التسوية المالية بنجاح' : 'Payment Collected & Financial Snapshot Locked'}
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
                  <span className="text-slate-500 font-sans">{isAr ? 'نوع التسوية' : 'Settlement Type'}:</span>
                  <span className="font-bold text-slate-900">{lastSettlement.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">{isAr ? 'حالة التسوية' : 'Settlement Status'}:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {lastSettlement.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">{isAr ? 'تثبيت التسعير' : 'Pricing Snapshot'}:</span>
                  <span className="font-bold text-slate-900">
                    LOCKED ({lastSettlement.baseAmount.toFixed(2)} {lastSettlement.baseCurrency})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">{isAr ? 'تثبيت سعر الصرف' : 'FX Snapshot'}:</span>
                  <span className="font-bold text-amber-800">
                    {lastSettlement.fxSide === 'NONE'
                      ? 'NONE (Same Currency)'
                      : `LOCKED (${lastSettlement.appliedFxRate} ${lastSettlement.fxSide})`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">{isAr ? 'حالة دفع الشحنة' : 'Shipment Payment Status'}:</span>
                  <span className="font-bold text-emerald-700">PAID</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">{isAr ? 'الحالة التشغيلية للشحنة' : 'Operational Status'}:</span>
                  <span className="font-bold text-slate-700">{selectedShipment?.currentStatus || 'UNCHANGED'}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-emerald-800">
                  <span className="font-sans">{isAr ? 'المبلغ المستلم' : 'Paid Amount'}:</span>
                  <span>
                    {lastSettlement.finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                    {lastSettlement.settlementCurrency}
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
                  <span>{isAr ? 'طباعة الإيصال' : 'Print Receipt'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Drawer for inspected historical settlement */}
      {inspectSettlement && (
        <DetailsDrawer
          isOpen={Boolean(inspectSettlement)}
          onClose={() => setInspectSettlement(null)}
          title={isAr ? 'تفاصيل التسوية المالية' : 'Settlement Details'}
          subtitle={inspectSettlement.settlementNumber}
          locale={locale}
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{isAr ? 'رقم التسوية' : 'Settlement #'}:</span>
                <span className="font-bold text-slate-900">{inspectSettlement.settlementNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{isAr ? 'الشحنة' : 'Shipment'}:</span>
                <span className="font-bold text-slate-900">{inspectSettlement.trackingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{isAr ? 'العميل' : 'Customer'}:</span>
                <span className="text-slate-800">{inspectSettlement.relatedUserName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{isAr ? 'المبلغ الأساسي' : 'Base Amount'}:</span>
                <span className="text-slate-900">{inspectSettlement.baseAmount.toFixed(2)} {inspectSettlement.baseCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{isAr ? 'المبلغ النهائي' : 'Final Amount'}:</span>
                <span className="font-bold text-emerald-800">
                  {inspectSettlement.finalAmount.toFixed(2)} {inspectSettlement.settlementCurrency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{isAr ? 'سعر الصرف المثبت' : 'Locked FX'}:</span>
                <span className="text-amber-800">{inspectSettlement.appliedFxRate} ({inspectSettlement.fxSide})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{isAr ? 'الموظف المنفذ' : 'Processed By'}:</span>
                <span className="text-slate-700">{inspectSettlement.processedByName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{isAr ? 'تاريخ المعاملة' : 'Date'}:</span>
                <span className="text-slate-700">{inspectSettlement.processedAt}</span>
              </div>
            </div>
          </div>
        </DetailsDrawer>
      )}
    </div>
  );
};
