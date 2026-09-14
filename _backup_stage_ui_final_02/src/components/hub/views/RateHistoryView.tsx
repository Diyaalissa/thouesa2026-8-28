import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  ArrowRight,
  ShieldCheck,
  Calendar,
  User as UserIcon,
  TrendingUp,
  TrendingDown,
  Layers,
  CheckCircle2,
  Clock,
  XCircle,
  PauseCircle,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  DollarSign,
  Package,
  Plane,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  Locale,
  ShippingRate,
  DailyExchangeRate,
  RateHistoryEntry,
  Hub,
  User,
  ServiceType,
  PricingModel,
  Currency,
  WeightTier,
  EmployeeNavSection,
} from '../../../types';
import { StatusBadge } from '../common/StatusBadge';
import { DetailsDrawer } from '../common/DetailsDrawer';
import { normalizeCountryCode } from '../../../lib/statusNormalizer';

export interface RateHistoryViewProps {
  shippingRates?: ShippingRate[];
  exchangeRates?: DailyExchangeRate[];
  rateHistory?: RateHistoryEntry[];
  currentHub?: Hub;
  currentUser?: User;
  locale: Locale;
  onNavigate?: (section: EmployeeNavSection) => void;
}

export type RateKind = 'CUSTOMER_SHIPPING' | 'TRAVELER_COMPENSATION' | 'EXCHANGE_RATE';

export interface UnifiedRateHistoryEntry {
  id: string;
  kind: RateKind;
  rateId: string;
  seriesKey: string;
  version: number;
  versionText: string;
  status: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'DISABLED' | 'DRAFT' | 'INACTIVE' | 'ARCHIVED';
  isCurrent: boolean;
  effectiveFrom: string;
  effectiveUntil?: string;
  createdAt: string;
  createdBy: string;
  reason?: string;

  // Shipping Specific
  originCountry?: 'JO' | 'DZ' | string;
  destinationCountry?: 'JO' | 'DZ' | string;
  routeAr?: string;
  routeEn?: string;
  serviceType?: ServiceType;
  pricingModel?: PricingModel;
  currency?: Currency;
  previousRatePerKg?: number | null;
  newRatePerKg?: number;
  previousValueText: string;
  newValueText: string;
  diffPerKg?: number | null;
  diffPct?: number | null;
  previousTiers?: WeightTier[];
  newTiers?: WeightTier[];
  previousFlat?: number | null;
  newFlat?: number;

  // Exchange Rate Specific
  baseCurrency?: Currency;
  quoteCurrency?: Currency;
  countryScope?: string;
  source?: string;
  previousBuy?: number | null;
  newBuy?: number;
  previousSell?: number | null;
  newSell?: number;
  buyDiff?: number | null;
  sellDiff?: number | null;
  notes?: string;

  // Source object reference
  rawShippingRate?: ShippingRate;
  rawExchangeRate?: DailyExchangeRate;
}

export const RateHistoryView: React.FC<RateHistoryViewProps> = ({
  shippingRates = [],
  exchangeRates = [],
  currentHub,
  currentUser,
  locale,
  onNavigate,
}) => {
  const isAr = locale === 'ar';

  // 1. Permissions & Scope Resolution
  const userRole = currentUser?.role;
  const permissions = currentUser?.permissions || [];
  const isMasterAdmin = userRole === 'MASTER_ADMIN';
  const isPricingManager = userRole === 'PRICING_MANAGER';
  const isFinancialOfficer = userRole === 'FINANCIAL_OFFICER';

  const hasPricingView =
    isMasterAdmin ||
    isPricingManager ||
    isFinancialOfficer ||
    permissions.includes('pricing.view') ||
    permissions.includes('all');

  const hasFxView =
    isMasterAdmin ||
    isPricingManager ||
    isFinancialOfficer ||
    userRole === 'HUB_MANAGER' ||
    userRole === 'HUB_AGENT' ||
    permissions.includes('fx.view') ||
    permissions.includes('all');

  const employeeCountryScope = normalizeCountryCode(currentHub?.countryCode || 'JO');

  // 2. Tab & Filters State
  const [activeTab, setActiveTab] = useState<'ALL' | 'SHIPPING_RATES' | 'EXCHANGE_RATES'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [rateTypeFilter, setRateTypeFilter] = useState<'ALL' | RateKind>('ALL');
  const [routeDirectionFilter, setRouteDirectionFilter] = useState<'ALL' | 'JO-DZ' | 'DZ-JO'>('ALL');
  const [currencyPairFilter, setCurrencyPairFilter] = useState<'ALL' | string>('ALL');
  const [serviceFilter, setServiceFilter] = useState<'ALL' | ServiceType>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'NEWEST_CHANGE' | 'OLDEST_CHANGE' | 'VERSION_DESC' | 'VERSION_ASC' | 'EFFECTIVE_DATE'>('NEWEST_CHANGE');
  const [selectedEntry, setSelectedEntry] = useState<UnifiedRateHistoryEntry | null>(null);

  // 3. Construct Unified History from Shared State with strict series isolation & lineage
  const allHistoryEntries = useMemo(() => {
    const entries: UnifiedRateHistoryEntry[] = [];

    // --- Process Shipping Rates (Customer Shipping & Traveler Compensation) ---
    if (hasPricingView) {
      // Filter by country scope if restricted
      const scopedShippingRates = shippingRates.filter((r) => {
        if (isMasterAdmin || isPricingManager) return true;
        const orig = normalizeCountryCode(r.originCountry);
        return orig === employeeCountryScope;
      });

      // Group shipping rates into isolated series
      const shippingSeriesMap = new Map<string, ShippingRate[]>();
      scopedShippingRates.forEach((r) => {
        const orig = normalizeCountryCode(r.originCountry);
        const dest = normalizeCountryCode(r.destinationCountry);
        const key = `${r.rateType}_${orig}_${dest}_${r.serviceType}_${r.pricingModel}`;
        if (!shippingSeriesMap.has(key)) {
          shippingSeriesMap.set(key, []);
        }
        shippingSeriesMap.get(key)!.push(r);
      });

      // For each isolated series, sort by version ascending and calculate lineage diffs
      shippingSeriesMap.forEach((seriesRates, seriesKey) => {
        const sortedSeries = [...seriesRates].sort((a, b) => {
          if (a.version !== b.version) return a.version - b.version;
          return new Date(a.createdAt || a.effectiveFrom).getTime() - new Date(b.createdAt || b.effectiveFrom).getTime();
        });

        sortedSeries.forEach((rate, index) => {
          const prevRate = index > 0 ? sortedSeries[index - 1] : null;
          const orig = normalizeCountryCode(rate.originCountry);
          const dest = normalizeCountryCode(rate.destinationCountry);

          let previousValueText = isAr ? 'النسخة التأسيسية' : 'Initial Version';
          let newValueText = '';
          let diffPerKg: number | null = null;
          let diffPct: number | null = null;

          if (rate.pricingModel === 'PER_KG') {
            newValueText = `${rate.ratePerKg.toFixed(2)} ${rate.currency} / KG`;
            if (prevRate && prevRate.ratePerKg !== undefined) {
              previousValueText = `${prevRate.ratePerKg.toFixed(2)} ${prevRate.currency} / KG`;
              diffPerKg = rate.ratePerKg - prevRate.ratePerKg;
              if (prevRate.ratePerKg > 0) {
                diffPct = (diffPerKg / prevRate.ratePerKg) * 100;
              }
            }
          } else if (rate.pricingModel === 'FLAT_RATE') {
            newValueText = `${rate.minimumCharge.toFixed(2)} ${rate.currency} (FLAT)`;
            if (prevRate && prevRate.minimumCharge !== undefined) {
              previousValueText = `${prevRate.minimumCharge.toFixed(2)} ${prevRate.currency} (FLAT)`;
              diffPerKg = rate.minimumCharge - prevRate.minimumCharge;
            }
          } else if (rate.pricingModel === 'WEIGHT_TIERS') {
            const tiersCount = rate.tiers?.length || 0;
            newValueText = isAr ? `${tiersCount} شرائح أوزان` : `${tiersCount} Weight Tiers`;
            if (prevRate && prevRate.tiers) {
              previousValueText = isAr ? `${prevRate.tiers.length} شرائح سابقة` : `${prevRate.tiers.length} Previous Tiers`;
            }
          }

          const routeAr = `${orig === 'JO' ? 'الأردن' : 'الجزائر'} ← ${dest === 'JO' ? 'الأردن' : 'الجزائر'}`;
          const routeEn = `${orig} → ${dest}`;

          entries.push({
            id: rate.id,
            kind: rate.rateType,
            rateId: rate.id,
            seriesKey,
            version: rate.version,
            versionText: `V${rate.version}`,
            status: rate.status,
            isCurrent: rate.status === 'ACTIVE',
            effectiveFrom: rate.effectiveFrom,
            effectiveUntil: rate.effectiveUntil,
            createdAt: rate.createdAt || rate.effectiveFrom,
            createdBy: rate.createdBy || 'System / Operations Desk',
            reason: rate.reason,
            originCountry: orig,
            destinationCountry: dest,
            routeAr,
            routeEn,
            serviceType: rate.serviceType,
            pricingModel: rate.pricingModel,
            currency: rate.currency,
            previousRatePerKg: prevRate ? prevRate.ratePerKg : null,
            newRatePerKg: rate.ratePerKg,
            previousValueText,
            newValueText,
            diffPerKg,
            diffPct,
            previousTiers: prevRate?.tiers,
            newTiers: rate.tiers,
            previousFlat: prevRate ? prevRate.minimumCharge : null,
            newFlat: rate.minimumCharge,
            rawShippingRate: rate,
          });
        });
      });
    }

    // --- Process Exchange Rates ---
    if (hasFxView) {
      const scopedFxRates = exchangeRates.filter((fx) => {
        if (isMasterAdmin || isPricingManager || isFinancialOfficer) return true;
        const scope = normalizeCountryCode(fx.countryScope);
        return scope === employeeCountryScope || fx.countryScope === 'GLOBAL';
      });

      // Group FX rates into isolated currency pair & scope series
      const fxSeriesMap = new Map<string, DailyExchangeRate[]>();
      scopedFxRates.forEach((fx) => {
        const key = `FX_${fx.baseCurrency}_${fx.quoteCurrency}_${fx.countryScope || 'GLOBAL'}`;
        if (!fxSeriesMap.has(key)) {
          fxSeriesMap.set(key, []);
        }
        fxSeriesMap.get(key)!.push(fx);
      });

      fxSeriesMap.forEach((seriesFx, seriesKey) => {
        const sortedSeries = [...seriesFx].sort((a, b) => {
          const vA = typeof a.version === 'number' ? a.version : parseInt(String(a.version).replace(/\D/g, '')) || 1;
          const vB = typeof b.version === 'number' ? b.version : parseInt(String(b.version).replace(/\D/g, '')) || 1;
          if (vA !== vB) return vA - vB;
          return new Date(a.createdAt || a.effectiveFrom).getTime() - new Date(b.createdAt || b.effectiveFrom).getTime();
        });

        sortedSeries.forEach((fx, index) => {
          const prevFx = index > 0 ? sortedSeries[index - 1] : null;
          const versionNum = typeof fx.version === 'number' ? fx.version : parseInt(String(fx.version).replace(/\D/g, '')) || (index + 1);

          let previousValueText = isAr ? 'النسخة التأسيسية' : 'Initial Version';
          let previousBuy: number | null = null;
          let previousSell: number | null = null;
          let buyDiff: number | null = null;
          let sellDiff: number | null = null;

          if (prevFx) {
            previousBuy = prevFx.buyRate;
            previousSell = prevFx.sellRate;
            previousValueText = `BUY ${prevFx.buyRate.toFixed(2)} | SELL ${prevFx.sellRate.toFixed(2)}`;
            buyDiff = fx.buyRate - prevFx.buyRate;
            sellDiff = fx.sellRate - prevFx.sellRate;
          }

          const newValueText = `BUY ${fx.buyRate.toFixed(2)} | SELL ${fx.sellRate.toFixed(2)}`;

          entries.push({
            id: fx.id,
            kind: 'EXCHANGE_RATE',
            rateId: fx.id,
            seriesKey,
            version: versionNum,
            versionText: `V${versionNum}`,
            status: fx.status as any,
            isCurrent: fx.status === 'ACTIVE',
            effectiveFrom: fx.effectiveFrom,
            effectiveUntil: fx.effectiveUntil,
            createdAt: fx.createdAt || fx.effectiveFrom,
            createdBy: fx.createdBy || 'Treasury / Central Operations Desk',
            reason: fx.notes,
            notes: fx.notes,
            baseCurrency: fx.baseCurrency,
            quoteCurrency: fx.quoteCurrency,
            countryScope: fx.countryScope,
            source: fx.source,
            previousBuy,
            newBuy: fx.buyRate,
            previousSell,
            newSell: fx.sellRate,
            buyDiff,
            sellDiff,
            previousValueText,
            newValueText,
            rawExchangeRate: fx,
          });
        });
      });
    }

    return entries;
  }, [shippingRates, exchangeRates, hasPricingView, hasFxView, employeeCountryScope, isMasterAdmin, isPricingManager, isFinancialOfficer, isAr]);

  // 4. KPI Calculations
  const kpis = useMemo(() => {
    const total = allHistoryEntries.length;
    const shippingCount = allHistoryEntries.filter(
      (e) => e.kind === 'CUSTOMER_SHIPPING' || e.kind === 'TRAVELER_COMPENSATION'
    ).length;
    const fxCount = allHistoryEntries.filter((e) => e.kind === 'EXCHANGE_RATE').length;

    const currentYearMonth = new Date().toISOString().slice(0, 7);
    const thisMonthCount = allHistoryEntries.filter((e) => {
      const d = (e.createdAt || e.effectiveFrom || '').slice(0, 7);
      return d === currentYearMonth;
    }).length;

    return { total, shippingCount, fxCount, thisMonthCount };
  }, [allHistoryEntries]);

  // 5. Filter & Sort Logic
  const filteredAndSortedEntries = useMemo(() => {
    return allHistoryEntries
      .filter((entry) => {
        // Tab Filter
        if (activeTab === 'SHIPPING_RATES' && entry.kind === 'EXCHANGE_RATE') return false;
        if (activeTab === 'EXCHANGE_RATES' && entry.kind !== 'EXCHANGE_RATE') return false;

        // Rate Type Filter
        if (rateTypeFilter !== 'ALL' && entry.kind !== rateTypeFilter) return false;

        // Route Direction Filter (Shipping)
        if (routeDirectionFilter !== 'ALL') {
          if (entry.kind === 'EXCHANGE_RATE') return false;
          const routeKey = `${entry.originCountry}-${entry.destinationCountry}`;
          if (routeKey !== routeDirectionFilter) return false;
        }

        // Currency Pair Filter (FX)
        if (currencyPairFilter !== 'ALL') {
          if (entry.kind !== 'EXCHANGE_RATE') return false;
          const pairKey = `${entry.baseCurrency}-${entry.quoteCurrency}`;
          if (pairKey !== currencyPairFilter) return false;
        }

        // Service Filter
        if (serviceFilter !== 'ALL') {
          if (entry.kind === 'EXCHANGE_RATE' || entry.serviceType !== serviceFilter) return false;
        }

        // Status Filter
        if (statusFilter !== 'ALL') {
          if (entry.status !== statusFilter) return false;
        }

        // Search Query (Route, Pair, Service, ID, Version, Changed By)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchId = entry.id.toLowerCase().includes(q) || entry.rateId.toLowerCase().includes(q);
          const matchRoute =
            (entry.routeAr || '').toLowerCase().includes(q) ||
            (entry.routeEn || '').toLowerCase().includes(q) ||
            `${entry.originCountry} ${entry.destinationCountry}`.toLowerCase().includes(q) ||
            (q === 'jordan' && (entry.originCountry === 'JO' || entry.destinationCountry === 'JO')) ||
            (q === 'algeria' && (entry.originCountry === 'DZ' || entry.destinationCountry === 'DZ')) ||
            (q === 'الأردن' && (entry.originCountry === 'JO' || entry.destinationCountry === 'JO')) ||
            (q === 'الجزائر' && (entry.originCountry === 'DZ' || entry.destinationCountry === 'DZ'));
          const matchPair =
            `${entry.baseCurrency} ${entry.quoteCurrency}`.toLowerCase().includes(q) ||
            `${entry.baseCurrency}/${entry.quoteCurrency}`.toLowerCase().includes(q);
          const matchVersion =
            entry.versionText.toLowerCase().includes(q) ||
            `v${entry.version}`.toLowerCase().includes(q) ||
            entry.version.toString() === q;
          const matchService =
            (entry.serviceType || '').toLowerCase().includes(q) ||
            (entry.serviceType === 'SEND_PARCEL' && (q.includes('طرد') || q.includes('parcel'))) ||
            (entry.serviceType === 'BUY_FOR_ME' && (q.includes('اشتر') || q.includes('buy')));
          const matchUser = (entry.createdBy || '').toLowerCase().includes(q);
          const matchReason = (entry.reason || '').toLowerCase().includes(q);

          if (!matchId && !matchRoute && !matchPair && !matchVersion && !matchService && !matchUser && !matchReason) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'NEWEST_CHANGE') {
          return new Date(b.createdAt || b.effectiveFrom).getTime() - new Date(a.createdAt || a.effectiveFrom).getTime();
        }
        if (sortOrder === 'OLDEST_CHANGE') {
          return new Date(a.createdAt || a.effectiveFrom).getTime() - new Date(b.createdAt || b.effectiveFrom).getTime();
        }
        if (sortOrder === 'VERSION_DESC') {
          return b.version - a.version;
        }
        if (sortOrder === 'VERSION_ASC') {
          return a.version - b.version;
        }
        if (sortOrder === 'EFFECTIVE_DATE') {
          return new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime();
        }
        return 0;
      });
  }, [allHistoryEntries, activeTab, rateTypeFilter, routeDirectionFilter, currencyPairFilter, serviceFilter, statusFilter, searchQuery, sortOrder]);

  // 6. Selected entry series lineage for DetailsDrawer
  const selectedSeriesLineage = useMemo(() => {
    if (!selectedEntry) return [];
    return allHistoryEntries
      .filter((e) => e.seriesKey === selectedEntry.seriesKey)
      .sort((a, b) => a.version - b.version);
  }, [allHistoryEntries, selectedEntry]);

  const currentSelectedIndexInSeries = useMemo(() => {
    if (!selectedEntry || selectedSeriesLineage.length === 0) return -1;
    return selectedSeriesLineage.findIndex((e) => e.id === selectedEntry.id);
  }, [selectedEntry, selectedSeriesLineage]);

  // Clear all filters handler
  const handleClearFilters = () => {
    setSearchQuery('');
    setRateTypeFilter('ALL');
    setRouteDirectionFilter('ALL');
    setCurrencyPairFilter('ALL');
    setServiceFilter('ALL');
    setStatusFilter('ALL');
    setSortOrder('NEWEST_CHANGE');
  };

  // If user has zero access to both domains
  if (!hasPricingView && !hasFxView) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <XCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          {isAr ? 'لا تملك صلاحيات كافية للاطلاع على سجل الأسعار' : 'Access Restricted'}
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
          {isAr
            ? 'يتطلب الوصول إلى هذا السجل صلاحية pricing.view أو fx.view المعينة من قبل الإدارة المركزية.'
            : 'Access to the Rate Audit History requires explicit pricing.view or fx.view permissions.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center border border-amber-500/20">
                <History className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-black text-slate-900">
                {isAr ? 'سجل الأسعار' : 'Rate History'}
              </h1>
              <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                {isAr ? 'سجل غير قابل للتعديل أو الحذف' : 'Immutable Audit Trail'}
              </span>
              <span className="bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 rounded-md border border-emerald-200">
                {isAr ? 'للقراءة والمراجعة فقط' : 'Read Only'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 leading-relaxed">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>
                {isAr
                  ? 'سجل زمني للنسخ والتغييرات التاريخية في أسعار شحن العملاء وتعويضات المسافرين وأسعار الصرف.'
                  : 'Chronological audit log of historical versions and revisions for customer shipping rates, traveler compensation, and exchange rates.'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder={isAr ? 'بحث بالمسار، الزوج، الإصدار، أو الموظف...' : 'Search by route, pair, version, or author...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl ps-8 pe-3 py-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-3 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. KPI Cards (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Versions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-slate-600">
              {isAr ? 'إجمالي النسخ التاريخية' : 'Total Versions'}
            </span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis.total}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'نسخ محفوظة ومؤرشفة' : 'Archived versions'}
          </div>
        </div>

        {/* Shipping Rate Changes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-bold text-slate-600">
              {isAr ? 'تعديلات أسعار الشحن' : 'Shipping Rate Changes'}
            </span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis.shippingCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'عملاء + تعويض مسافرين' : 'Customer & Traveler'}
          </div>
        </div>

        {/* FX Rate Changes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-bold text-slate-600">
              {isAr ? 'تعديلات أسعار الصرف' : 'FX Rate Changes'}
            </span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis.fxCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'أزواج العملات المعتمدة' : 'Currency pairs'}
          </div>
        </div>

        {/* Changes This Month */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-sky-700 mb-2">
            <span className="text-xs font-bold text-slate-600">
              {isAr ? 'تعديلات هذا الشهر' : 'Changes This Month'}
            </span>
            <Calendar className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis.thisMonthCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'تم تسجيلها خلال الشهر' : 'Recorded this month'}
          </div>
        </div>
      </div>

      {/* 3. Tabs & Secondary Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
        {/* Main Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => {
                setActiveTab('ALL');
                setRateTypeFilter('ALL');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'الكل' : 'All'} ({allHistoryEntries.length})
            </button>
            {hasPricingView && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('SHIPPING_RATES');
                  setRateTypeFilter('ALL');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'SHIPPING_RATES'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isAr ? 'أسعار الشحن' : 'Shipping Rates'} ({kpis.shippingCount})
              </button>
            )}
            {hasFxView && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('EXCHANGE_RATES');
                  setRateTypeFilter('EXCHANGE_RATE');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'EXCHANGE_RATES'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isAr ? 'أسعار الصرف' : 'Exchange Rates'} ({kpis.fxCount})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 font-medium">
              {isAr ? 'ترتيب حسب:' : 'Sort by:'}
            </span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:bg-white"
            >
              <option value="NEWEST_CHANGE">{isAr ? 'الأحدث تسجيلاً أولاً' : 'Newest Changed First'}</option>
              <option value="OLDEST_CHANGE">{isAr ? 'الأقدم تسجيلاً أولاً' : 'Oldest Changed First'}</option>
              <option value="VERSION_DESC">{isAr ? 'رقم الإصدار (تنازلي)' : 'Version (High to Low)'}</option>
              <option value="VERSION_ASC">{isAr ? 'رقم الإصدار (تصاعدي)' : 'Version (Low to High)'}</option>
              <option value="EFFECTIVE_DATE">{isAr ? 'تاريخ السريان' : 'Effective Date'}</option>
            </select>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
          {/* Rate Type Filter */}
          {activeTab === 'ALL' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                {isAr ? 'نوع التسعير' : 'Rate Type'}
              </label>
              <select
                value={rateTypeFilter}
                onChange={(e) => setRateTypeFilter(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:bg-white"
              >
                <option value="ALL">{isAr ? 'كافة الأنواع' : 'All Types'}</option>
                <option value="CUSTOMER_SHIPPING">{isAr ? 'شحن العميل' : 'Customer Shipping'}</option>
                <option value="TRAVELER_COMPENSATION">{isAr ? 'تعويض المسافر' : 'Traveler Compensation'}</option>
                <option value="EXCHANGE_RATE">{isAr ? 'سعر الصرف' : 'Exchange Rate'}</option>
              </select>
            </div>
          )}

          {activeTab === 'SHIPPING_RATES' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                {isAr ? 'فئة الشحن' : 'Shipping Category'}
              </label>
              <select
                value={rateTypeFilter}
                onChange={(e) => setRateTypeFilter(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:bg-white"
              >
                <option value="ALL">{isAr ? 'العميل والمسافر معاً' : 'Customer & Traveler'}</option>
                <option value="CUSTOMER_SHIPPING">{isAr ? 'شحن العميل فقط' : 'Customer Shipping Only'}</option>
                <option value="TRAVELER_COMPENSATION">{isAr ? 'تعويض المسافر فقط' : 'Traveler Compensation Only'}</option>
              </select>
            </div>
          )}

          {/* Route Direction Filter (Shipping) */}
          {activeTab !== 'EXCHANGE_RATES' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                {isAr ? 'اتجاه المسار' : 'Route Direction'}
              </label>
              <select
                value={routeDirectionFilter}
                onChange={(e) => setRouteDirectionFilter(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:bg-white"
              >
                <option value="ALL">{isAr ? 'كافة الاتجاهات' : 'All Routes'}</option>
                <option value="JO-DZ">{isAr ? 'JO → DZ (الأردن ← الجزائر)' : 'JO → DZ'}</option>
                <option value="DZ-JO">{isAr ? 'DZ → JO (الجزائر ← الأردن)' : 'DZ → JO'}</option>
              </select>
            </div>
          )}

          {/* Currency Pair Filter (FX) */}
          {activeTab !== 'SHIPPING_RATES' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                {isAr ? 'زوج العملة' : 'Currency Pair'}
              </label>
              <select
                value={currencyPairFilter}
                onChange={(e) => setCurrencyPairFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:bg-white"
              >
                <option value="ALL">{isAr ? 'كافة الأزواج' : 'All Pairs'}</option>
                <option value="JOD-DZD">JOD / DZD</option>
                <option value="DZD-JOD">DZD / JOD</option>
                <option value="USD-JOD">USD / JOD</option>
                <option value="USD-DZD">USD / DZD</option>
              </select>
            </div>
          )}

          {/* Service Filter */}
          {activeTab !== 'EXCHANGE_RATES' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                {isAr ? 'الخدمة' : 'Service'}
              </label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:bg-white"
              >
                <option value="ALL">{isAr ? 'كافة الخدمات' : 'All Services'}</option>
                <option value="SEND_PARCEL">{isAr ? 'طرد شخصي (SEND_PARCEL)' : 'Personal Parcel'}</option>
                <option value="BUY_FOR_ME">{isAr ? 'اشترِ لي (BUY_FOR_ME)' : 'Buy for Me'}</option>
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              {isAr ? 'حالة النسخة' : 'Version Status'}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:bg-white"
            >
              <option value="ALL">{isAr ? 'كافة الحالات' : 'All Statuses'}</option>
              <option value="ACTIVE">{isAr ? 'ACTIVE (نشطة)' : 'Active'}</option>
              <option value="SCHEDULED">{isAr ? 'SCHEDULED (مجدولة)' : 'Scheduled'}</option>
              <option value="EXPIRED">{isAr ? 'EXPIRED (منتهية)' : 'Expired'}</option>
              <option value="DISABLED">{isAr ? 'DISABLED (معطلة)' : 'Disabled'}</option>
              <option value="DRAFT">{isAr ? 'DRAFT (مسودة)' : 'Draft'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Desktop History Table */}
      <div className="hidden sm:block bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-3.5 text-start">{isAr ? 'النوع' : 'Type'}</th>
                <th className="p-3.5 text-start">{isAr ? 'المسار / زوج العملة' : 'Route / Currency Pair'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الخدمة' : 'Service'}</th>
                <th className="p-3.5 text-center">{isAr ? 'الإصدار' : 'Version'}</th>
                <th className="p-3.5 text-start">{isAr ? 'القيمة السابقة' : 'Previous Value'}</th>
                <th className="p-3.5 text-start">{isAr ? 'القيمة الجديدة' : 'New Value'}</th>
                <th className="p-3.5 text-start">{isAr ? 'تاريخ السريان' : 'Effective From'}</th>
                <th className="p-3.5 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="p-3.5 text-start">{isAr ? 'تاريخ التسجيل' : 'Changed At'}</th>
                <th className="p-3.5 text-start">{isAr ? 'المسؤول' : 'Changed By'}</th>
                <th className="p-3.5 text-center">{isAr ? 'التفاصيل' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedEntries.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-12 text-center text-slate-500">
                    <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <div className="text-sm font-bold text-slate-800">
                      {searchQuery || rateTypeFilter !== 'ALL' || statusFilter !== 'ALL'
                        ? (isAr ? 'لا توجد سجلات تطابق البحث الحالي' : 'No rate audit records match your search')
                        : (isAr ? 'لا توجد تغييرات سعرية مسجلة حتى الآن.' : 'No rate changes recorded yet.')}
                    </div>
                    {(searchQuery || rateTypeFilter !== 'ALL' || statusFilter !== 'ALL') && (
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        {isAr ? 'إعادة ضبط الفلاتر' : 'Clear Filters'}
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredAndSortedEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Type Badge */}
                    <td className="p-3.5">
                      {entry.kind === 'CUSTOMER_SHIPPING' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Package className="w-3 h-3 text-amber-600" />
                          <span>{isAr ? 'شحن العميل' : 'Customer Shipping'}</span>
                        </span>
                      )}
                      {entry.kind === 'TRAVELER_COMPENSATION' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                          <Plane className="w-3 h-3 text-indigo-600" />
                          <span>{isAr ? 'تعويض المسافر' : 'Traveler Comp'}</span>
                        </span>
                      )}
                      {entry.kind === 'EXCHANGE_RATE' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <DollarSign className="w-3 h-3 text-emerald-600" />
                          <span>{isAr ? 'سعر الصرف' : 'Exchange Rate'}</span>
                        </span>
                      )}
                    </td>

                    {/* Route / Currency Pair */}
                    <td className="p-3.5 font-bold text-slate-900">
                      {entry.kind === 'EXCHANGE_RATE' ? (
                        <div className="font-mono text-xs text-slate-900 font-bold">
                          {entry.baseCurrency} / {entry.quoteCurrency}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Scope: {entry.countryScope || 'GLOBAL'}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {isAr ? entry.routeAr : entry.routeEn}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {entry.originCountry} → {entry.destinationCountry}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Service */}
                    <td className="p-3.5 text-slate-600">
                      {entry.kind === 'EXCHANGE_RATE' ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <span className="font-medium text-slate-800">
                          {entry.serviceType === 'SEND_PARCEL'
                            ? (isAr ? 'طرد شخصي' : 'Personal Parcel')
                            : (isAr ? 'اشترِ لي' : 'Buy for Me')}
                        </span>
                      )}
                    </td>

                    {/* Version */}
                    <td className="p-3.5 text-center">
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold border border-slate-200">
                        {entry.versionText}
                      </span>
                    </td>

                    {/* Previous Value */}
                    <td className="p-3.5 font-mono text-slate-500 text-xs">
                      {entry.version === 1 ? (
                        <span className="text-slate-400 italic">
                          {isAr ? 'النسخة التأسيسية' : 'Initial Version'}
                        </span>
                      ) : entry.kind === 'EXCHANGE_RATE' ? (
                        <div className="space-y-0.5 text-[11px]">
                          <div>BUY: <span className="font-bold text-slate-700">{entry.previousBuy?.toFixed(2)}</span></div>
                          <div>SELL: <span className="font-bold text-slate-700">{entry.previousSell?.toFixed(2)}</span></div>
                        </div>
                      ) : (
                        <span className="line-through text-slate-400">{entry.previousValueText}</span>
                      )}
                    </td>

                    {/* New Value */}
                    <td className="p-3.5 font-mono text-xs">
                      {entry.kind === 'EXCHANGE_RATE' ? (
                        <div className="space-y-0.5 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">BUY:</span>
                            <span className="font-bold text-emerald-800">{entry.newBuy?.toFixed(2)}</span>
                            {entry.buyDiff !== null && entry.buyDiff !== undefined && (
                              <span className={`text-[10px] font-bold ${entry.buyDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                ({entry.buyDiff >= 0 ? `+${entry.buyDiff.toFixed(2)}` : entry.buyDiff.toFixed(2)})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">SELL:</span>
                            <span className="font-bold text-emerald-800">{entry.newSell?.toFixed(2)}</span>
                            {entry.sellDiff !== null && entry.sellDiff !== undefined && (
                              <span className={`text-[10px] font-bold ${entry.sellDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                ({entry.sellDiff >= 0 ? `+${entry.sellDiff.toFixed(2)}` : entry.sellDiff.toFixed(2)})
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-800">{entry.newValueText}</span>
                          {entry.diffPerKg !== null && entry.diffPerKg !== undefined && (
                            <span className={`text-[10px] font-bold ${entry.diffPerKg >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              ({entry.diffPerKg >= 0 ? `+${entry.diffPerKg.toFixed(2)}` : entry.diffPerKg.toFixed(2)})
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Effective From */}
                    <td className="p-3.5 font-mono text-slate-700 text-xs whitespace-nowrap">
                      {entry.effectiveFrom.split('T')[0]}
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        <StatusBadge domain="PRICING" status={entry.status} locale={locale} size="sm" />
                        {entry.isCurrent && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-300">
                            {isAr ? 'الحالي' : 'CURRENT'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Changed At */}
                    <td className="p-3.5 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {entry.createdAt.split('T')[0]}
                    </td>

                    {/* Changed By */}
                    <td className="p-3.5 text-slate-700 text-xs max-w-[140px] truncate" title={entry.createdBy}>
                      <span className="font-medium">{entry.createdBy}</span>
                    </td>

                    {/* Action Button (View Details Only - Strictly Read Only) */}
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedEntry(entry)}
                        className="px-2.5 py-1 text-xs text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors font-bold cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>{isAr ? 'عرض' : 'View'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Mobile Cards View (Responsive sm:hidden) */}
      <div className="block sm:hidden space-y-3">
        {filteredAndSortedEntries.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
            <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <div className="font-bold text-slate-800 text-xs">
              {isAr ? 'لا توجد سجلات مطابقة للبحث' : 'No records found'}
            </div>
            {(searchQuery || rateTypeFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-2 px-3 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs"
              >
                {isAr ? 'مسح الفلاتر' : 'Clear Filters'}
              </button>
            )}
          </div>
        ) : (
          filteredAndSortedEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {entry.kind === 'CUSTOMER_SHIPPING' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {isAr ? 'شحن العميل' : 'Customer Shipping'}
                      </span>
                    )}
                    {entry.kind === 'TRAVELER_COMPENSATION' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                        {isAr ? 'تعويض المسافر' : 'Traveler Comp'}
                      </span>
                    )}
                    {entry.kind === 'EXCHANGE_RATE' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {isAr ? 'سعر الصرف' : 'Exchange Rate'}
                      </span>
                    )}
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                      {entry.versionText}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">
                    {entry.kind === 'EXCHANGE_RATE'
                      ? `${entry.baseCurrency} / ${entry.quoteCurrency}`
                      : isAr ? entry.routeAr : entry.routeEn}
                  </h4>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <StatusBadge domain="PRICING" status={entry.status} locale={locale} size="sm" />
                  {entry.isCurrent && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[9px] border border-amber-300">
                      CURRENT
                    </span>
                  )}
                </div>
              </div>

              {/* Values Before & After */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs">
                {entry.kind === 'EXCHANGE_RATE' ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">BUY:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 line-through">
                          {entry.previousBuy !== null && entry.previousBuy !== undefined ? entry.previousBuy.toFixed(2) : '—'}
                        </span>
                        <ArrowRight className="w-3 h-3 text-amber-500" />
                        <span className="font-bold text-emerald-800">{entry.newBuy?.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">SELL:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 line-through">
                          {entry.previousSell !== null && entry.previousSell !== undefined ? entry.previousSell.toFixed(2) : '—'}
                        </span>
                        <ArrowRight className="w-3 h-3 text-amber-500" />
                        <span className="font-bold text-emerald-800">{entry.newSell?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isAr ? 'السابق' : 'Previous'}</span>
                      <span className="text-slate-500 font-bold text-xs">{entry.previousValueText}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                    <div>
                      <span className="text-emerald-700 block text-[10px] font-bold">{isAr ? 'الجديد' : 'New'}</span>
                      <span className="text-emerald-800 font-bold text-xs">{entry.newValueText}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <div>
                  <span>{isAr ? 'السريان:' : 'Effective:'} </span>
                  <strong className="text-slate-800 font-mono">{entry.effectiveFrom.split('T')[0]}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEntry(entry)}
                  className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold rounded-lg text-xs"
                >
                  {isAr ? 'عرض التفاصيل' : 'View Details'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 6. DetailsDrawer (Strictly Read Only & Deep Historical Lineage) */}
      {selectedEntry && (
        <DetailsDrawer
          isOpen={true}
          onClose={() => setSelectedEntry(null)}
          title={isAr ? 'سجل التدقيق التاريخي للتعرفة' : 'Rate Revision Audit Record'}
          subtitle={selectedEntry.id}
          locale={locale}
          icon={<History className="w-5 h-5 text-amber-600" />}
        >
          <div className="space-y-5 text-xs">
            {/* Version Navigation Bar */}
            {selectedSeriesLineage.length > 1 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={currentSelectedIndexInSeries <= 0}
                  onClick={() => {
                    if (currentSelectedIndexInSeries > 0) {
                      setSelectedEntry(selectedSeriesLineage[currentSelectedIndexInSeries - 1]);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>{isAr ? 'النسخة السابقة' : 'Previous Version'}</span>
                </button>

                <span className="font-mono text-xs font-bold text-slate-700">
                  {isAr ? `إصدار ${selectedEntry.versionText} من ${selectedSeriesLineage.length}` : `Version ${selectedEntry.versionText} of ${selectedSeriesLineage.length}`}
                </span>

                <button
                  type="button"
                  disabled={currentSelectedIndexInSeries >= selectedSeriesLineage.length - 1}
                  onClick={() => {
                    if (currentSelectedIndexInSeries < selectedSeriesLineage.length - 1) {
                      setSelectedEntry(selectedSeriesLineage[currentSelectedIndexInSeries + 1]);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                >
                  <span>{isAr ? 'النسخة التالية' : 'Next Version'}</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* General Information Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">
                  {selectedEntry.kind === 'EXCHANGE_RATE'
                    ? (isAr ? 'بيانات سعر الصرف' : 'Exchange Rate Information')
                    : (isAr ? 'بيانات مسار التعرفة' : 'Shipping Route Information')}
                </span>
                <div className="flex items-center gap-1.5">
                  <StatusBadge domain="PRICING" status={selectedEntry.status} locale={locale} size="sm" />
                  {selectedEntry.isCurrent && (
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-300">
                      CURRENT ACTIVE
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-600 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">{isAr ? 'نوع السعر:' : 'Rate Type:'}</span>
                  <strong className="text-slate-900">
                    {selectedEntry.kind === 'CUSTOMER_SHIPPING'
                      ? (isAr ? 'شحن العميل (CUSTOMER_SHIPPING)' : 'Customer Shipping')
                      : selectedEntry.kind === 'TRAVELER_COMPENSATION'
                      ? (isAr ? 'تعويض المسافر (TRAVELER_COMPENSATION)' : 'Traveler Compensation')
                      : (isAr ? 'سعر صرف مركزي (EXCHANGE_RATE)' : 'Exchange Rate')}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">
                    {selectedEntry.kind === 'EXCHANGE_RATE' ? (isAr ? 'زوج العملة:' : 'Currency Pair:') : (isAr ? 'المسار:' : 'Route:')}
                  </span>
                  <strong className="text-slate-900">
                    {selectedEntry.kind === 'EXCHANGE_RATE'
                      ? `${selectedEntry.baseCurrency} / ${selectedEntry.quoteCurrency}`
                      : `${selectedEntry.originCountry} → ${selectedEntry.destinationCountry} (${isAr ? selectedEntry.routeAr : selectedEntry.routeEn})`}
                  </strong>
                </div>

                {selectedEntry.kind !== 'EXCHANGE_RATE' && (
                  <>
                    <div>
                      <span className="text-slate-400 block text-[11px]">{isAr ? 'نوع الخدمة:' : 'Service:'}</span>
                      <strong className="text-slate-900">
                        {selectedEntry.serviceType === 'SEND_PARCEL'
                          ? (isAr ? 'طرد شخصي (SEND_PARCEL)' : 'Personal Parcel')
                          : (isAr ? 'اشترِ لي (BUY_FOR_ME)' : 'Buy for Me')}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">{isAr ? 'نموذج التسعير:' : 'Pricing Model:'}</span>
                      <strong className="text-slate-900 font-mono">
                        {selectedEntry.pricingModel} ({selectedEntry.currency})
                      </strong>
                    </div>
                  </>
                )}

                {selectedEntry.kind === 'EXCHANGE_RATE' && (
                  <>
                    <div>
                      <span className="text-slate-400 block text-[11px]">{isAr ? 'نطاق التطبيق (Scope):' : 'Scope:'}</span>
                      <strong className="text-slate-900 font-mono">
                        {selectedEntry.countryScope || 'GLOBAL'}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">{isAr ? 'المصدر المعتمد:' : 'Source:'}</span>
                      <strong className="text-slate-900">
                        {selectedEntry.source || 'Treasury / Central Operations Desk'}
                      </strong>
                    </div>
                  </>
                )}

                <div>
                  <span className="text-slate-400 block text-[11px]">{isAr ? 'تاريخ السريان (Effective From):' : 'Effective From:'}</span>
                  <strong className="text-slate-900 font-mono">
                    {selectedEntry.effectiveFrom}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">{isAr ? 'تاريخ الانتهاء (Effective Until):' : 'Effective Until:'}</span>
                  <strong className="text-slate-900 font-mono">
                    {selectedEntry.effectiveUntil || (isAr ? 'غير محدد (مستمر)' : 'Indefinite')}
                  </strong>
                </div>
              </div>
            </div>

            {/* Before vs After Comparison Card */}
            <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3">
              <div className="font-bold text-amber-900 text-xs flex items-center justify-between">
                <span>{isAr ? 'مقارنة القيمة: النسخة السابقة ← النسخة الحالية' : 'Version Rate Comparison'}</span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  {selectedEntry.versionText}
                </span>
              </div>

              {selectedEntry.kind === 'EXCHANGE_RATE' ? (
                <div className="grid grid-cols-2 gap-3 font-mono">
                  {/* BUY Comparison */}
                  <div className="p-3 bg-white border border-amber-200/80 rounded-lg">
                    <span className="text-xs font-bold text-slate-700 block mb-1">
                      {isAr ? 'سعر الشراء (BUY Rate)' : 'BUY Rate'}
                    </span>
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">{isAr ? 'السابق' : 'Previous'}</span>
                        <strong className="text-slate-600">
                          {selectedEntry.previousBuy !== null && selectedEntry.previousBuy !== undefined ? selectedEntry.previousBuy.toFixed(2) : '—'}
                        </strong>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                      <div>
                        <span className="text-[10px] text-emerald-700 block font-bold">{isAr ? 'الحالي' : 'Current'}</span>
                        <strong className="text-emerald-800">{selectedEntry.newBuy?.toFixed(2)}</strong>
                      </div>
                    </div>
                    {selectedEntry.buyDiff !== null && selectedEntry.buyDiff !== undefined && (
                      <div className="mt-2 text-[11px] font-bold text-slate-600 border-t border-slate-100 pt-1 flex justify-between">
                        <span>{isAr ? 'الفارق:' : 'Difference:'}</span>
                        <span className={selectedEntry.buyDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {selectedEntry.buyDiff >= 0 ? `+${selectedEntry.buyDiff.toFixed(2)}` : selectedEntry.buyDiff.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* SELL Comparison */}
                  <div className="p-3 bg-white border border-amber-200/80 rounded-lg">
                    <span className="text-xs font-bold text-slate-700 block mb-1">
                      {isAr ? 'سعر البيع (SELL Rate)' : 'SELL Rate'}
                    </span>
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">{isAr ? 'السابق' : 'Previous'}</span>
                        <strong className="text-slate-600">
                          {selectedEntry.previousSell !== null && selectedEntry.previousSell !== undefined ? selectedEntry.previousSell.toFixed(2) : '—'}
                        </strong>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                      <div>
                        <span className="text-[10px] text-emerald-700 block font-bold">{isAr ? 'الحالي' : 'Current'}</span>
                        <strong className="text-emerald-800">{selectedEntry.newSell?.toFixed(2)}</strong>
                      </div>
                    </div>
                    {selectedEntry.sellDiff !== null && selectedEntry.sellDiff !== undefined && (
                      <div className="mt-2 text-[11px] font-bold text-slate-600 border-t border-slate-100 pt-1 flex justify-between">
                        <span>{isAr ? 'الفارق:' : 'Difference:'}</span>
                        <span className={selectedEntry.sellDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {selectedEntry.sellDiff >= 0 ? `+${selectedEntry.sellDiff.toFixed(2)}` : selectedEntry.sellDiff.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : selectedEntry.pricingModel === 'WEIGHT_TIERS' ? (
                /* Tier by tier comparison */
                <div className="space-y-2">
                  <div className="text-[11px] text-slate-600 font-medium">
                    {isAr ? 'مقارنة شرائح الأوزان السابقة والحالية:' : 'Weight Tiers Comparison:'}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Previous Tiers */}
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                      <div className="font-bold text-slate-500 mb-1.5">{isAr ? 'الشرائح السابقة' : 'Previous Tiers'}</div>
                      {selectedEntry.previousTiers && selectedEntry.previousTiers.length > 0 ? (
                        <div className="space-y-1 font-mono text-[11px]">
                          {selectedEntry.previousTiers.map((t, i) => (
                            <div key={i} className="flex justify-between border-b border-slate-50 pb-0.5">
                              <span>{t.fromKg}–{t.toKg} KG:</span>
                              <strong>{t.ratePerKg} {selectedEntry.currency}</strong>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">{isAr ? 'لا توجد شرائح سابقة' : 'No previous tiers'}</span>
                      )}
                    </div>

                    {/* New Tiers */}
                    <div className="p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-lg">
                      <div className="font-bold text-emerald-800 mb-1.5">{isAr ? 'الشرائح المعتمدة' : 'New Tiers'}</div>
                      {selectedEntry.newTiers && selectedEntry.newTiers.length > 0 ? (
                        <div className="space-y-1 font-mono text-[11px]">
                          {selectedEntry.newTiers.map((t, i) => (
                            <div key={i} className="flex justify-between border-b border-emerald-100/50 pb-0.5">
                              <span>{t.fromKg}–{t.toKg} KG:</span>
                              <strong className="text-emerald-900">{t.ratePerKg} {selectedEntry.currency}</strong>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">{isAr ? 'غير محدد' : 'Not set'}</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* PER_KG / FLAT_RATE Comparison */
                <div className="p-3 bg-white border border-amber-200/80 rounded-lg font-mono">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isAr ? 'السعر السابق' : 'Old Rate'}</span>
                      <strong className="text-slate-700 text-sm">{selectedEntry.previousValueText}</strong>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="text-emerald-700 block text-[10px] font-bold">{isAr ? 'السعر المعتمد الجديد' : 'New Rate'}</span>
                      <strong className="text-emerald-900 text-sm">{selectedEntry.newValueText}</strong>
                    </div>
                  </div>

                  {selectedEntry.diffPerKg !== null && selectedEntry.diffPerKg !== undefined && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-sans font-bold">{isAr ? 'الفارق والتغيير النسبي:' : 'Delta & Percentage:'}</span>
                      <span className={`font-bold ${selectedEntry.diffPerKg >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {selectedEntry.diffPerKg >= 0 ? `+${selectedEntry.diffPerKg.toFixed(2)}` : selectedEntry.diffPerKg.toFixed(2)} {selectedEntry.currency} / KG
                        {selectedEntry.diffPct !== null && selectedEntry.diffPct !== undefined && (
                          <span className="ms-1.5 text-[11px] font-normal">
                            ({selectedEntry.diffPct >= 0 ? `+${selectedEntry.diffPct.toFixed(2)}%` : `${selectedEntry.diffPct.toFixed(2)}%`})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Version Lineage Timeline (V1 -> V2 -> V3) */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-500" />
                <span>{isAr ? 'تسلسل وسلسلة النسخ (Version Lineage)' : 'Version Lineage Chain'}</span>
              </div>

              <div className="space-y-2">
                {selectedSeriesLineage.map((vEntry) => {
                  const isSelected = vEntry.id === selectedEntry.id;
                  return (
                    <div
                      key={vEntry.id}
                      onClick={() => setSelectedEntry(vEntry)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                          isSelected ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-800'
                        }`}>
                          {vEntry.versionText}
                        </span>
                        <div>
                          <div className="font-mono text-xs font-bold text-slate-900">
                            {vEntry.newValueText}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {isAr ? 'سريان:' : 'Effective:'} {vEntry.effectiveFrom.split('T')[0]}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <StatusBadge domain="PRICING" status={vEntry.status} locale={locale} size="sm" />
                        {vEntry.isCurrent && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[9px] border border-amber-300">
                            CURRENT
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Audit & Justification Notes */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5">
              <span className="font-bold text-slate-800 block text-xs">
                {isAr ? 'مذكرة التبرير والسبب التشغيلي:' : 'Audit Reason & Official Rationale:'}
              </span>
              <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {selectedEntry.reason || selectedEntry.notes || (isAr ? 'لا توجد مذكرة تبرير مسجلة لهذه النسخة' : 'No rationale notes recorded.')}
              </p>
            </div>

            {/* Author Attribution */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>
                  {isAr ? 'الموظف المسؤول:' : 'Authorized by:'}{' '}
                  <strong className="text-slate-900">{selectedEntry.createdBy}</strong>
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {selectedEntry.createdAt.split('T')[0]}
              </span>
            </div>
          </div>
        </DetailsDrawer>
      )}
    </div>
  );
};
