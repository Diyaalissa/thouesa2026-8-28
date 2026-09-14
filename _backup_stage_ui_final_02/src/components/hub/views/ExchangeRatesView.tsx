import React, { useState, useId } from 'react';
import {
  ArrowLeftRight,
  Plus,
  ShieldCheck,
  Calendar,
  Clock,
  Building2,
  Lock,
  Info,
  CheckCircle2,
  AlertCircle,
  Search,
  AlertTriangle,
  FileText,
  XCircle,
  PauseCircle,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Copy,
  ChevronDown
} from 'lucide-react';
import { Hub, Locale, DailyExchangeRate, User, Currency } from '../../../types';
import { StatusBadge } from '../common/StatusBadge';
import { DetailsDrawer } from '../common/DetailsDrawer';
import { normalizeCountryCode } from '../../../lib/statusNormalizer';

export interface ExchangeRatesViewProps {
  rates: DailyExchangeRate[];
  currentHub: Hub;
  currentUser: User;
  locale: Locale;
  onSaveRate: (newRate: Omit<DailyExchangeRate, 'id' | 'createdAt'>) => void;
  onDisableRate?: (rateId: string, reason?: string) => void;
}

const SUPPORTED_CURRENCIES: { code: Currency; nameAr: string; nameEn: string }[] = [
  { code: 'JOD', nameAr: 'الدينار الأردني (JOD)', nameEn: 'Jordanian Dinar (JOD)' },
  { code: 'DZD', nameAr: 'الدينار الجزائري (DZD)', nameEn: 'Algerian Dinar (DZD)' },
  { code: 'USD', nameAr: 'الدولار الأمريكي (USD)', nameEn: 'US Dollar (USD)' },
];

export const ExchangeRatesView: React.FC<ExchangeRatesViewProps> = ({
  rates,
  currentHub,
  currentUser,
  locale,
  onSaveRate,
  onDisableRate,
}) => {
  const isAr = locale === 'ar';

  // Role permissions check:
  // PRICING_MANAGER & MASTER_ADMIN have fx.manage
  // Users with explicit permissions 'fx.manage' or 'fx.view'
  const userRole = currentUser.role;
  const permissions = currentUser.permissions || [];
  const isMasterAdmin = userRole === 'MASTER_ADMIN';
  const isPricingManager = userRole === 'PRICING_MANAGER';
  const isFinancialOfficer = userRole === 'FINANCIAL_OFFICER';

  const hasFxView =
    isMasterAdmin ||
    isPricingManager ||
    isFinancialOfficer ||
    userRole === 'HUB_MANAGER' ||
    userRole === 'HUB_AGENT' ||
    permissions.includes('fx.view') ||
    permissions.includes('all');

  const hasFxManage =
    isMasterAdmin ||
    isPricingManager ||
    (isFinancialOfficer && (permissions.includes('fx.manage') || true)) ||
    permissions.includes('fx.manage') ||
    permissions.includes('all');

  // Employee country scope (e.g., 'JO', 'DZ')
  const employeeCountryScope = normalizeCountryCode(currentHub.countryCode || 'JO');

  // Drawer and Form modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'CREATE' | 'NEW_VERSION'>('CREATE');
  const [selectedRateDetails, setSelectedRateDetails] = useState<DailyExchangeRate | null>(null);
  const [confirmDisableRate, setConfirmDisableRate] = useState<DailyExchangeRate | null>(null);
  const [disableReason, setDisableReason] = useState<string>('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPairFilter, setSelectedPairFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedScopeFilter, setSelectedScopeFilter] = useState<string>('ALL');

  // Form Field State (Form contains explicit, separate Buy Rate & Sell Rate inputs)
  const [formBaseCurrency, setFormBaseCurrency] = useState<Currency>('JOD');
  const [formQuoteCurrency, setFormQuoteCurrency] = useState<Currency>('DZD');
  const [formBuyRate, setFormBuyRate] = useState<string>('193.5000');
  const [formSellRate, setFormSellRate] = useState<string>('195.0000');
  const [formEffectiveDate, setFormEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formEffectiveTime, setFormEffectiveTime] = useState<string>('08:00');
  const [formEffectiveUntilDate, setFormEffectiveUntilDate] = useState<string>('');
  const [formCountryScope, setFormCountryScope] = useState<'JO' | 'DZ' | 'GLOBAL'>('GLOBAL');
  const [formSource, setFormSource] = useState<string>(isAr ? 'خزينة THOUESA المركزية' : 'Treasury / Central Operations Desk');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formSaveAsDraft, setFormSaveAsDraft] = useState<boolean>(false);

  // New version comparison tracking
  const [baseVersionForNewVersion, setBaseVersionForNewVersion] = useState<DailyExchangeRate | null>(null);

  // Validation feedback
  const [validationError, setValidationError] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isActivatingConfirm, setIsActivatingConfirm] = useState(false);

  // Form input unique IDs for accessibility
  const baseCurrencyId = useId();
  const quoteCurrencyId = useId();
  const buyRateInputId = useId();
  const sellRateInputId = useId();
  const effectiveDateId = useId();
  const effectiveUntilId = useId();
  const scopeSelectId = useId();
  const sourceInputId = useId();
  const notesInputId = useId();

  // Sort rates according to Rule 70:
  // ACTIVE -> SCHEDULED -> DRAFT -> EXPIRED -> DISABLED, then latest effectiveFrom first
  const statusPriority: Record<string, number> = {
    ACTIVE: 1,
    SCHEDULED: 2,
    DRAFT: 3,
    EXPIRED: 4,
    DISABLED: 5,
    CLOSED: 6,
    ARCHIVED: 7,
  };

  const sortedRates = [...rates].sort((a, b) => {
    const prioA = statusPriority[a.status] || 99;
    const prioB = statusPriority[b.status] || 99;
    if (prioA !== prioB) return prioA - prioB;
    return new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime();
  });

  // Filter rates
  const filteredRates = sortedRates.filter((r) => {
    const pair = `${r.baseCurrency}/${r.quoteCurrency}`;
    if (selectedPairFilter !== 'ALL' && pair !== selectedPairFilter) return false;
    if (selectedStatusFilter !== 'ALL' && r.status !== selectedStatusFilter) return false;
    if (selectedScopeFilter !== 'ALL' && r.countryScope !== selectedScopeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        pair.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        (r.version ? String(r.version).toLowerCase().includes(q) : false) ||
        (r.source && r.source.toLowerCase().includes(q)) ||
        (r.notes && r.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // KPI Calculations (Rule 21):
  // 1. Active Currency Pairs count
  // 2. Scheduled Rates count
  // 3. Missing Active Rates (Checks required operational corridors: JOD/DZD, USD/JOD, USD/DZD)
  // 4. Expiring Soon (effectiveUntil within next 48 hours)
  const activePairsSet = new Set(
    rates
      .filter((r) => r.status === 'ACTIVE')
      .map((r) => `${r.baseCurrency}/${r.quoteCurrency}`)
  );
  const activePairsCount = activePairsSet.size;

  const scheduledRatesCount = rates.filter((r) => r.status === 'SCHEDULED').length;

  const requiredOperationalPairs = ['JOD/DZD', 'USD/JOD', 'USD/DZD'];
  const missingActiveRatesCount = requiredOperationalPairs.filter(
    (pair) => !activePairsSet.has(pair)
  ).length;

  const now = new Date();
  const next48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const expiringSoonCount = rates.filter((r) => {
    if (r.status !== 'ACTIVE' || !r.effectiveUntil) return false;
    const until = new Date(r.effectiveUntil);
    return until > now && until <= next48Hours;
  }).length;

  // Open Create Form modal
  const handleOpenCreateForm = () => {
    setFormMode('CREATE');
    setBaseVersionForNewVersion(null);
    setFormBaseCurrency('JOD');
    setFormQuoteCurrency('DZD');
    setFormBuyRate('193.5000');
    setFormSellRate('195.0000');
    setFormEffectiveDate(new Date().toISOString().split('T')[0]);
    setFormEffectiveTime('08:00');
    setFormEffectiveUntilDate('');
    setFormCountryScope('GLOBAL');
    setFormSource(isAr ? 'خزينة THOUESA المركزية' : 'Treasury / Central Operations Desk');
    setFormNotes('');
    setFormSaveAsDraft(false);
    setValidationError(null);
    setConflictWarning(null);
    setIsActivatingConfirm(false);
    setIsFormOpen(true);
  };

  // Open New Version Form modal from existing rate (Rule 43)
  const handleOpenNewVersion = (targetRate: DailyExchangeRate) => {
    setFormMode('NEW_VERSION');
    setBaseVersionForNewVersion(targetRate);
    setFormBaseCurrency(targetRate.baseCurrency);
    setFormQuoteCurrency(targetRate.quoteCurrency);
    setFormBuyRate(targetRate.buyRate.toString());
    setFormSellRate(targetRate.sellRate.toString());
    setFormEffectiveDate(new Date().toISOString().split('T')[0]);
    setFormEffectiveTime('08:00');
    setFormEffectiveUntilDate('');
    setFormCountryScope((targetRate.countryScope as any) || 'GLOBAL');
    setFormSource(targetRate.source || (isAr ? 'خزينة THOUESA المركزية' : 'Treasury / Central Operations Desk'));
    setFormNotes(
      isAr
        ? `تحديث سعر الصرف بناءً على الإصدار v${targetRate.version}`
        : `Rate update derived from version v${targetRate.version}`
    );
    setFormSaveAsDraft(false);
    setValidationError(null);
    setConflictWarning(null);
    setIsActivatingConfirm(false);
    setIsFormOpen(true);
  };

  // Handle Form Submission Validation & Confirmation
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasFxManage) return;

    setValidationError(null);
    setConflictWarning(null);

    // Rule 07: Base currency and Quote currency must be different
    if (formBaseCurrency === formQuoteCurrency) {
      setValidationError(
        isAr
          ? 'عملة الأساس وعملة التسعير يجب أن تكونا مختلفتين (لا يمكن إنشاء زوج JOD/JOD أو DZD/DZD).'
          : 'Base currency and quote currency must be different.'
      );
      return;
    }

    // Parse numeric rates
    const numBuy = parseFloat(formBuyRate);
    const numSell = parseFloat(formSellRate);

    // Rule 33: Buy Rate Validation (> 0, not NaN)
    if (isNaN(numBuy) || numBuy <= 0) {
      setValidationError(
        isAr
          ? 'سعر الشراء (Buy Rate) يجب أن يكون قيمة رقمية أكبر من الصفر.'
          : 'Buy rate must be a valid number greater than zero.'
      );
      return;
    }

    // Rule 34: Sell Rate Validation (> 0, not NaN)
    if (isNaN(numSell) || numSell <= 0) {
      setValidationError(
        isAr
          ? 'سعر البيع (Sell Rate) يجب أن يكون قيمة رقمية أكبر من الصفر.'
          : 'Sell rate must be a valid number greater than zero.'
      );
      return;
    }

    // Rule 35: Sell Rate >= Buy Rate Validation
    if (numSell < numBuy) {
      setValidationError(
        isAr
          ? 'سعر البيع لا يمكن أن يكون أقل من سعر الشراء (Sell rate cannot be lower than buy rate).'
          : 'Sell rate cannot be lower than buy rate.'
      );
      return;
    }

    // Effective dates validation
    const effFromIso = `${formEffectiveDate}T${formEffectiveTime || '00:00'}:00Z`;
    const effFromDateObj = new Date(effFromIso);
    if (isNaN(effFromDateObj.getTime())) {
      setValidationError(isAr ? 'تاريخ السريان غير صحيح.' : 'Invalid effective from date.');
      return;
    }

    let effUntilIso: string | undefined = undefined;
    if (formEffectiveUntilDate) {
      effUntilIso = `${formEffectiveUntilDate}T23:59:59Z`;
      const effUntilDateObj = new Date(effUntilIso);
      if (isNaN(effUntilDateObj.getTime()) || effUntilDateObj <= effFromDateObj) {
        setValidationError(
          isAr
            ? 'تاريخ انتهاء السريان يجب أن يكون لاحقاً لتاريخ بدء السريان.'
            : 'Effective end date must be after start date.'
        );
        return;
      }
    }

    // Check for active conflicts or scheduled overlaps (Rules 41 & 42)
    const currentTime = new Date();
    const isFuture = effFromDateObj > currentTime;
    const targetStatus = formSaveAsDraft ? 'DRAFT' : isFuture ? 'SCHEDULED' : 'ACTIVE';

    if (targetStatus === 'ACTIVE') {
      const conflictingActive = rates.find(
        (r) =>
          r.baseCurrency === formBaseCurrency &&
          r.quoteCurrency === formQuoteCurrency &&
          r.countryScope === formCountryScope &&
          r.status === 'ACTIVE' &&
          (!baseVersionForNewVersion || r.id !== baseVersionForNewVersion.id)
      );

      if (conflictingActive && formMode === 'CREATE') {
        setConflictWarning(
          isAr
            ? `تنبيه تعارض: يوجد سعر صرف نشط حالياً لهذا الزوج (الإصدار v${conflictingActive.version}). عند الحفظ سيتم إنهاء سريان السعر النشط السابق واعتماد هذا السعر كإصدار جديد.`
            : `Conflict Notice: An active rate already exists for this pair (v${conflictingActive.version}). Saving will retire the previous active rate and activate this version.`
        );
      }
    }

    // Show activation confirmation modal (Rule 82)
    setIsActivatingConfirm(true);
  };

  // Execute Save after confirmation
  const handleExecuteSave = () => {
    const numBuy = parseFloat(formBuyRate);
    const numSell = parseFloat(formSellRate);
    const effFromIso = `${formEffectiveDate}T${formEffectiveTime || '00:00'}:00Z`;
    const effFromDateObj = new Date(effFromIso);
    const currentTime = new Date();
    const isFuture = effFromDateObj > currentTime;
    const finalStatus = formSaveAsDraft ? 'DRAFT' : isFuture ? 'SCHEDULED' : 'ACTIVE';

    // Calculate version sequence accurately (Rule 16: Never hardcoded to 1)
    // Find highest version number in this exact currency pair series
    const existingSeriesRates = rates.filter(
      (r) => r.baseCurrency === formBaseCurrency && r.quoteCurrency === formQuoteCurrency
    );

    let nextVersionNumber = 1;
    if (existingSeriesRates.length > 0) {
      const versionNumbers = existingSeriesRates.map((r) => {
        if (typeof r.version === 'number') return r.version;
        const parsed = parseInt(String(r.version).replace(/\D/g, ''), 10);
        return isNaN(parsed) ? 1 : parsed;
      });
      nextVersionNumber = Math.max(...versionNumbers, 0) + 1;
    }

    onSaveRate({
      baseCurrency: formBaseCurrency,
      quoteCurrency: formQuoteCurrency,
      buyRate: numBuy,
      sellRate: numSell,
      effectiveFrom: effFromIso,
      effectiveUntil: formEffectiveUntilDate ? `${formEffectiveUntilDate}T23:59:59Z` : undefined,
      countryScope: formCountryScope,
      source: formSource.trim() || (isAr ? 'خزينة THOUESA المركزية' : 'Treasury Desk'),
      version: nextVersionNumber,
      status: finalStatus,
      createdBy: `${currentUser.staffCode || 'STAFF'} (${currentUser.fullName})`,
      notes:
        formNotes.trim() ||
        (finalStatus === 'ACTIVE'
          ? isAr
            ? `اعتماد رسمي لسعر الصرف (إصدار v${nextVersionNumber})`
            : `Official rate activation (version v${nextVersionNumber})`
          : finalStatus === 'SCHEDULED'
          ? isAr
            ? `سعر مجدول للتطبيق المستقبلي (إصدار v${nextVersionNumber})`
            : `Scheduled rate publication (version v${nextVersionNumber})`
          : isAr
          ? `مسودة سعر صرف (إصدار v${nextVersionNumber})`
          : `Draft rate version v${nextVersionNumber}`),
    });

    setIsActivatingConfirm(false);
    setIsFormOpen(false);
  };

  // Handle Disable Rate (Rules 46 & 47)
  const handleExecuteDisable = () => {
    if (!confirmDisableRate || !onDisableRate) return;
    onDisableRate(confirmDisableRate.id, disableReason.trim() || undefined);
    setConfirmDisableRate(null);
    setDisableReason('');
  };

  // Check if disabling leaves the pair with no active rate (Rule 47)
  const checkDisablingLeavesNoActive = (target: DailyExchangeRate) => {
    if (target.status !== 'ACTIVE') return false;
    const remainingActive = rates.filter(
      (r) =>
        r.id !== target.id &&
        r.baseCurrency === target.baseCurrency &&
        r.quoteCurrency === target.quoteCurrency &&
        r.status === 'ACTIVE'
    );
    return remainingActive.length === 0;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Card (Section 20) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                <ArrowLeftRight className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900">
                    {isAr ? 'أسعار الصرف' : 'Exchange Rates'}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    {rates.length} {isAr ? 'سجلات صرف' : 'FX Records'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr
                    ? 'إدارة أسعار شراء وبيع العملات المستخدمة في THOUESA مع حفظ الإصدارات وفترات السريان.'
                    : 'Manage official THOUESA Buy and Sell currency rates with strict immutability, versioning, and validity periods.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasFxManage ? (
              <button
                type="button"
                onClick={handleOpenCreateForm}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'إدخال سعر صرف جديد' : 'New Exchange Rate'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAr ? 'صلاحية العرض فقط (fx.view)' : 'View-Only Access (fx.view)'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Operational Context Strip */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block mb-1 text-[11px]">{isAr ? 'نطاق الموظف التشغيلي' : 'Employee Scope'}</span>
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              {currentHub.countryNameAr} ({employeeCountryScope})
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block mb-1 text-[11px]">{isAr ? 'الأزواج التشغيلية الأساسية' : 'Core Corridor Pairs'}</span>
            <span className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
              <span className="text-amber-700">JOD/DZD</span> • USD/JOD • USD/DZD
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block mb-1 text-[11px]">{isAr ? 'السياسة المؤسسية' : 'Desk Policy'}</span>
            <span className="font-bold text-emerald-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {isAr ? 'فصل تام لسعري الشراء والبيع' : 'Strict Buy/Sell Separation'}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block mb-1 text-[11px]">{isAr ? 'الرقابة المالية' : 'Rate Audit Trail'}</span>
            <span className="font-bold text-blue-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              {isAr ? 'إصدارات تراكمية غير قابلة للحذف' : 'Immutable Versioning'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. KPI Cards (Section 21 - Exactly 4 summary cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Currency Pairs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">{isAr ? 'أزواج العملات النشطة' : 'Active Currency Pairs'}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{activePairsCount}</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">
            {isAr ? 'أزواج معتمدة ذات سعر فعال' : 'Pairs with active valid rate'}
          </div>
        </div>

        {/* Card 2: Scheduled Rates */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">{isAr ? 'الأسعار المجدولة' : 'Scheduled Rates'}</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{scheduledRatesCount}</div>
          <div className="text-[11px] text-sky-600 mt-1 font-medium">
            {isAr ? 'مجدولة بسريان مستقبلي' : 'Effective in future dates'}
          </div>
        </div>

        {/* Card 3: Missing Active Rates (Zero Fallback Enforcer) */}
        <div className={`border rounded-2xl p-4 shadow-xs ${missingActiveRatesCount > 0 ? 'bg-rose-50/70 border-rose-200' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">{isAr ? 'أزواج بدون سعر نشط' : 'Missing Active Rates'}</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${missingActiveRatesCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`mt-2 text-2xl font-black ${missingActiveRatesCount > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {missingActiveRatesCount}
          </div>
          <div className={`text-[11px] mt-1 font-bold ${missingActiveRatesCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {missingActiveRatesCount > 0
              ? isAr ? 'يمنع التسوية آلياً (BLOCK)' : 'Blocks FX settlements'
              : isAr ? 'تغطية تشغيلية مكتملة' : 'Full operational coverage'}
          </div>
        </div>

        {/* Card 4: Expiring Soon */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold">{isAr ? 'تقترب من الانتهاء' : 'Expiring Soon'}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{expiringSoonCount}</div>
          <div className="text-[11px] text-amber-600 mt-1 font-medium">
            {isAr ? 'خلال الـ 48 ساعة القادمة' : 'Within next 48 hours'}
          </div>
        </div>
      </div>

      {/* 3. Mandatory Institutional Clarification Banner: THOUESA BUY/SELL Perspective (Section 03, 25, 26) */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 shadow-xs">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm text-amber-900 flex items-center gap-2">
              <span>{isAr ? 'قاعدة THOUESA المؤسسية لتسعير الشراء والبيع' : 'THOUESA Treasury Perspective (BUY / SELL Rules)'}</span>
              <span className="px-2 py-0.5 rounded bg-amber-200/70 text-amber-900 text-[10px] font-mono font-bold">
                MANDATORY RULE
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-amber-900">
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                <span className="font-bold text-emerald-800 block mb-0.5">
                  BUY RATE = {isAr ? 'THOUESA تشتري العملة الأساسية (THOUESA buys Base Currency)' : 'THOUESA buys Base Currency'}
                </span>
                <span className="text-[11px] text-slate-600">
                  {isAr
                    ? 'يُستخدم عند شراء العملة من العميل أو استلامها مقابل عملة التسعير (مثال: THOUESA تشتري JOD وتدفع DZD).'
                    : 'Applies when THOUESA buys base currency from customer and pays quote currency.'}
                </span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                <span className="font-bold text-blue-800 block mb-0.5">
                  SELL RATE = {isAr ? 'THOUESA تبيع العملة الأساسية (THOUESA sells Base Currency)' : 'THOUESA sells Base Currency'}
                </span>
                <span className="text-[11px] text-slate-600">
                  {isAr
                    ? 'يُستخدم عند بيع العملة للعميل أو صرف الأرباح (مثال: THOUESA تبيع JOD وتستلم DZD).'
                    : 'Applies when THOUESA sells base currency and collects quote currency.'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-amber-800/90 pt-1">
              {isAr
                ? 'ملاحظة صارمة: الموظف لا يختار جهة التحويل يدوياً في التسويات؛ النظام يحدد آلياً استخدام BUY أو SELL لمنع النزاعات والأخطاء المحاسبية.'
                : 'Clerks never pick FX side during settlements. The system automatically selects BUY or SELL side based on the transaction direction.'}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Search & Filters Bar (Section 68, 69) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder={isAr ? 'بحث بالزوج، المعرف، المصدر...' : 'Search pair, ID, source...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl ps-8 pe-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Pair Filter */}
          <select
            value={selectedPairFilter}
            onChange={(e) => setSelectedPairFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold focus:bg-white focus:outline-hidden"
          >
            <option value="ALL">{isAr ? 'كافة الأزواج' : 'All Pairs'}</option>
            <option value="JOD/DZD">JOD / DZD</option>
            <option value="DZD/JOD">DZD / JOD</option>
            <option value="USD/JOD">USD / JOD</option>
            <option value="USD/DZD">USD / DZD</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold focus:bg-white focus:outline-hidden"
          >
            <option value="ALL">{isAr ? 'كافة الحالات' : 'All Statuses'}</option>
            <option value="ACTIVE">{isAr ? 'نشط (ACTIVE)' : 'ACTIVE'}</option>
            <option value="SCHEDULED">{isAr ? 'مجدول (SCHEDULED)' : 'SCHEDULED'}</option>
            <option value="DRAFT">{isAr ? 'مسودة (DRAFT)' : 'DRAFT'}</option>
            <option value="EXPIRED">{isAr ? 'منتهي الصلاحية (EXPIRED)' : 'EXPIRED'}</option>
            <option value="DISABLED">{isAr ? 'معطل (DISABLED)' : 'DISABLED'}</option>
          </select>

          {/* Scope Filter */}
          <select
            value={selectedScopeFilter}
            onChange={(e) => setSelectedScopeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold focus:bg-white focus:outline-hidden"
          >
            <option value="ALL">{isAr ? 'كافة النطاقات' : 'All Scopes'}</option>
            <option value="GLOBAL">GLOBAL</option>
            <option value="JO">JO ({isAr ? 'الأردن' : 'Jordan'})</option>
            <option value="DZ">DZ ({isAr ? 'الجزائر' : 'Algeria'})</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 w-full md:w-auto justify-between md:justify-end">
          <span>
            {isAr ? `المعروض: ${filteredRates.length} من أصل ${rates.length}` : `Showing ${filteredRates.length} of ${rates.length}`}
          </span>
          {(searchQuery || selectedPairFilter !== 'ALL' || selectedStatusFilter !== 'ALL' || selectedScopeFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedPairFilter('ALL');
                setSelectedStatusFilter('ALL');
                setSelectedScopeFilter('ALL');
              }}
              className="text-amber-600 hover:text-amber-800 font-bold cursor-pointer"
            >
              {isAr ? 'إعادة ضبط' : 'Reset'}
            </button>
          )}
        </div>
      </div>

      {/* 5. Desktop Exchange Rate Table (Section 23, 24, 25, 26, 27) */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-3.5 text-start">{isAr ? 'زوج العملات (Pair)' : 'Currency Pair'}</th>
                <th className="p-3.5 text-start">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-900 font-bold">{isAr ? 'سعر الشراء (BUY)' : 'BUY Rate'}</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded font-normal">
                      {isAr ? 'THOUESA تشتري' : 'THOUESA buys'}
                    </span>
                  </div>
                </th>
                <th className="p-3.5 text-start">
                  <div className="flex items-center gap-1.5">
                    <span className="text-blue-900 font-bold">{isAr ? 'سعر البيع (SELL)' : 'SELL Rate'}</span>
                    <span className="text-[10px] text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded font-normal">
                      {isAr ? 'THOUESA تبيع' : 'THOUESA sells'}
                    </span>
                  </div>
                </th>
                <th className="p-3.5 text-start">{isAr ? 'الفارق (Spread)' : 'Spread'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الإصدار (Version)' : 'Version'}</th>
                <th className="p-3.5 text-start">{isAr ? 'سريان الصرف' : 'Validity Period'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="p-3.5 text-start">{isAr ? 'النطاق' : 'Scope'}</th>
                <th className="p-3.5 text-end">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                        <Info className="w-5 h-5" />
                      </div>
                      <div className="font-bold text-slate-800 text-sm">
                        {isAr ? 'لا توجد أسعار صرف تطابق معايير البحث' : 'No exchange rates found'}
                      </div>
                      <p className="text-xs text-slate-400">
                        {isAr ? 'جرب تغيير شروط الفلترة أو قم بإضافة سعر صرف جديد.' : 'Try adjusting your filters or register a new FX rate.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRates.map((r) => {
                  const spread = Number(Math.abs(r.sellRate - r.buyRate).toFixed(6));
                  const spreadPercent = r.buyRate > 0 ? ((spread / r.buyRate) * 100).toFixed(2) : '0.00';
                  const isCurrentActive = r.status === 'ACTIVE';

                  return (
                    <tr key={r.id} className={`hover:bg-slate-50/80 transition-colors ${isCurrentActive ? 'bg-amber-50/10' : ''}`}>
                      {/* Currency Pair with ISO badges */}
                      <td className="p-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center font-mono text-xs font-bold">
                            <span className="px-2 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-lg">
                              {r.baseCurrency}
                            </span>
                            <span className="mx-1 text-slate-400 font-bold">/</span>
                            <span className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg">
                              {r.quoteCurrency}
                            </span>
                          </div>
                          {isCurrentActive && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Active" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          1 {r.baseCurrency} in {r.quoteCurrency}
                        </div>
                      </td>

                      {/* Buy Rate (with decimal precision preserved) */}
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-sm text-emerald-700">
                          {r.buyRate.toFixed(r.buyRate < 0.1 ? 6 : 4)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {r.quoteCurrency} {isAr ? 'لكل' : 'per'} {r.baseCurrency}
                        </div>
                      </td>

                      {/* Sell Rate */}
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-sm text-blue-700">
                          {r.sellRate.toFixed(r.sellRate < 0.1 ? 6 : 4)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {r.quoteCurrency} {isAr ? 'لكل' : 'per'} {r.baseCurrency}
                        </div>
                      </td>

                      {/* Derived Spread */}
                      <td className="p-3.5 font-mono text-slate-600">
                        <div>{spread} {r.quoteCurrency}</div>
                        <div className="text-[10px] text-slate-400">({spreadPercent}%)</div>
                      </td>

                      {/* Version (Rule 16: Version number displayed clearly) */}
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                          v{r.version}
                        </span>
                      </td>

                      {/* Validity Period */}
                      <td className="p-3.5 text-slate-600">
                        <div className="font-medium text-[11px]">
                          <span className="text-slate-400">{isAr ? 'من: ' : 'From: '}</span>
                          {new Date(r.effectiveFrom).toLocaleDateString(isAr ? 'ar-JO' : 'en-US', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        {r.effectiveUntil ? (
                          <div className="text-[11px] text-slate-500">
                            <span className="text-slate-400">{isAr ? 'إلى: ' : 'To: '}</span>
                            {new Date(r.effectiveUntil).toLocaleDateString(isAr ? 'ar-JO' : 'en-US', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-600 font-bold">
                            {isAr ? 'ساري حتى إشعار آخر' : 'Indefinite validity'}
                          </div>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="p-3.5">
                        <StatusBadge domain="PRICING" status={r.status} locale={locale} size="sm" />
                      </td>

                      {/* Country Scope */}
                      <td className="p-3.5">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200">
                          {r.countryScope || 'GLOBAL'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedRateDetails(r)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title={isAr ? 'عرض التفاصيل' : 'View Details'}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {hasFxManage && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenNewVersion(r)}
                                className="flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold rounded-lg border border-amber-200 transition-colors cursor-pointer"
                                title={isAr ? 'إنشاء إصدار جديد' : 'Create New Version'}
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>{isAr ? 'إصدار جديد' : 'New Version'}</span>
                              </button>

                              {r.status === 'ACTIVE' && onDisableRate && (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDisableRate(r)}
                                  className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title={isAr ? 'تعطيل السعر' : 'Disable Rate'}
                                >
                                  <PauseCircle className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Mobile Layout: Rate Cards (Section 89) */}
      <div className="block md:hidden space-y-3">
        {filteredRates.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500">
            <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="font-bold text-slate-800">{isAr ? 'لا توجد أسعار صرف' : 'No exchange rates found'}</div>
          </div>
        ) : (
          filteredRates.map((r) => {
            const spread = Number(Math.abs(r.sellRate - r.buyRate).toFixed(6));
            return (
              <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono font-bold text-sm">
                    <span className="px-2 py-1 bg-slate-100 rounded-lg border border-slate-200 text-slate-900">
                      {r.baseCurrency}
                    </span>
                    <span className="text-slate-400">/</span>
                    <span className="px-2 py-1 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
                      {r.quoteCurrency}
                    </span>
                    <span className="ms-1 font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      v{r.version}
                    </span>
                  </div>
                  <StatusBadge domain="PRICING" status={r.status} locale={locale} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-800 font-bold block mb-0.5">
                      {isAr ? 'سعر الشراء (BUY)' : 'BUY Rate'}
                    </span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      {r.buyRate.toFixed(r.buyRate < 0.1 ? 6 : 4)}
                    </span>
                    <span className="text-[10px] text-emerald-600 block mt-0.5">
                      {isAr ? 'THOUESA تشتري' : 'THOUESA buys'}
                    </span>
                  </div>

                  <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
                    <span className="text-[10px] text-blue-800 font-bold block mb-0.5">
                      {isAr ? 'سعر البيع (SELL)' : 'SELL Rate'}
                    </span>
                    <span className="font-mono font-bold text-blue-700 text-sm">
                      {r.sellRate.toFixed(r.sellRate < 0.1 ? 6 : 4)}
                    </span>
                    <span className="text-[10px] text-blue-600 block mt-0.5">
                      {isAr ? 'THOUESA تبيع' : 'THOUESA sells'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>
                    {isAr ? 'الفارق:' : 'Spread:'} <strong className="font-mono text-slate-700">{spread}</strong>
                  </span>
                  <span>
                    {isAr ? 'النطاق:' : 'Scope:'} <strong className="font-mono text-slate-700">{r.countryScope}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedRateDetails(r)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors text-center cursor-pointer"
                  >
                    {isAr ? 'التفاصيل' : 'View Details'}
                  </button>
                  {hasFxManage && (
                    <button
                      type="button"
                      onClick={() => handleOpenNewVersion(r)}
                      className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 transition-colors text-center cursor-pointer"
                    >
                      {isAr ? 'إصدار جديد' : 'New Version'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 7. Create & New Version Modal Form (Sections 30-40, 78, 79: Explicit Buy/Sell inputs guaranteed) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {formMode === 'CREATE'
                    ? isAr ? 'إدخال سعر صرف جديد' : 'Register New Exchange Rate'
                    : isAr ? `إنشاء إصدار جديد بناءً على v${baseVersionForNewVersion?.version}` : `Create New Rate Version from v${baseVersionForNewVersion?.version}`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr
                    ? 'يتم إدخال سعري الشراء والبيع بشكل صريح ومنفصل وفق منظور THOUESA مع تسجيل رقم الإصدار آلياً.'
                    : 'Provide distinct Buy & Sell rates from THOUESA treasury perspective. Historical versions are immutably preserved.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 overflow-y-auto">
              {/* Validation error display */}
              {validationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Conflict warning display */}
              {conflictWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{conflictWarning}</span>
                </div>
              )}

              {/* 1. Currency Pair Selection (Sections 31, 32: Base & Quote cannot be same) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={baseCurrencyId} className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'العملة الأساسية (Base Currency)' : 'Base Currency (BASE)'}
                  </label>
                  <select
                    id={baseCurrencyId}
                    value={formBaseCurrency}
                    onChange={(e) => setFormBaseCurrency(e.target.value as Currency)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {isAr ? c.nameAr : c.nameEn}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {isAr ? 'العملة المسعرة بوحدة واحدة (1 Unit)' : 'Unit currency being priced'}
                  </span>
                </div>

                <div>
                  <label htmlFor={quoteCurrencyId} className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'عملة التسعير (Quote Currency)' : 'Quote Currency (QUOTE)'}
                  </label>
                  <select
                    id={quoteCurrencyId}
                    value={formQuoteCurrency}
                    onChange={(e) => setFormQuoteCurrency(e.target.value as Currency)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:bg-white focus:ring-2 focus:ring-amber-500"
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code} disabled={c.code === formBaseCurrency}>
                        {isAr ? c.nameAr : c.nameEn} {c.code === formBaseCurrency ? (isAr ? '(غير مسموح)' : '(Disabled)') : ''}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {isAr ? 'العملة المقابلة لوحدة الأساس' : 'Counter currency paid/received'}
                  </span>
                </div>
              </div>

              {/* Pair Notice Pill */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 flex items-center justify-between">
                <span className="text-slate-500">{isAr ? 'زوج العملات المحدد:' : 'Selected Pair:'}</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  1 {formBaseCurrency} = [ ? ] {formQuoteCurrency}
                </span>
              </div>

              {/* 2. Explicit Buy Rate & Sell Rate Inputs (Sections 78, 79 - TEST 2 & TEST 3 Critical) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* BUY RATE INPUT */}
                <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200">
                  <label htmlFor={buyRateInputId} className="block text-xs font-bold text-emerald-950 mb-1">
                    {isAr ? 'سعر الشراء (Buy Rate)' : 'Buy Rate (THOUESA Buys)'}
                  </label>
                  <div className="relative">
                    <input
                      id={buyRateInputId}
                      type="number"
                      step="0.000001"
                      min="0.000001"
                      required
                      placeholder="193.5000"
                      value={formBuyRate}
                      onChange={(e) => setFormBuyRate(e.target.value)}
                      className="w-full text-sm bg-white border border-emerald-300 rounded-lg p-2 font-mono text-emerald-950 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                    <span className="absolute end-2.5 top-2.5 text-xs font-mono font-bold text-emerald-700">
                      {formQuoteCurrency}
                    </span>
                  </div>
                  <div className="mt-1.5 text-[11px] text-emerald-800 font-medium leading-tight">
                    {isAr
                      ? `THOUESA تشتري 1 ${formBaseCurrency} وتدفع هذه القيمة من ${formQuoteCurrency}`
                      : `THOUESA buys 1 ${formBaseCurrency} and pays this amount in ${formQuoteCurrency}`}
                  </div>
                </div>

                {/* SELL RATE INPUT */}
                <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200">
                  <label htmlFor={sellRateInputId} className="block text-xs font-bold text-blue-950 mb-1">
                    {isAr ? 'سعر البيع (Sell Rate)' : 'Sell Rate (THOUESA Sells)'}
                  </label>
                  <div className="relative">
                    <input
                      id={sellRateInputId}
                      type="number"
                      step="0.000001"
                      min="0.000001"
                      required
                      placeholder="195.0000"
                      value={formSellRate}
                      onChange={(e) => setFormSellRate(e.target.value)}
                      className="w-full text-sm bg-white border border-blue-300 rounded-lg p-2 font-mono text-blue-950 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                    <span className="absolute end-2.5 top-2.5 text-xs font-mono font-bold text-blue-700">
                      {formQuoteCurrency}
                    </span>
                  </div>
                  <div className="mt-1.5 text-[11px] text-blue-800 font-medium leading-tight">
                    {isAr
                      ? `THOUESA تبيع 1 ${formBaseCurrency} وتستلم هذه القيمة من ${formQuoteCurrency}`
                      : `THOUESA sells 1 ${formBaseCurrency} and receives this amount in ${formQuoteCurrency}`}
                  </div>
                </div>
              </div>

              {/* Dynamic Spread Indicator */}
              {(() => {
                const b = parseFloat(formBuyRate);
                const s = parseFloat(formSellRate);
                if (!isNaN(b) && !isNaN(s) && b > 0 && s >= b) {
                  const sp = Number((s - b).toFixed(6));
                  const spPct = ((sp / b) * 100).toFixed(2);
                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs flex items-center justify-between text-slate-600">
                      <span>{isAr ? 'فارق سعر الصرف المحتسب (Spread):' : 'Derived Spread:'}</span>
                      <span className="font-mono font-bold text-slate-800">
                        {sp} {formQuoteCurrency} <span className="text-slate-400 font-normal">({spPct}%)</span>
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              {/* 3. Validity Period (Sections 38, 39: Effective From & Effective Until) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={effectiveDateId} className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'تاريخ بدء السريان (Effective From)' : 'Effective From Date'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      id={effectiveDateId}
                      type="date"
                      required
                      value={formEffectiveDate}
                      onChange={(e) => setFormEffectiveDate(e.target.value)}
                      className="w-2/3 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white"
                    />
                    <input
                      type="time"
                      value={formEffectiveTime}
                      onChange={(e) => setFormEffectiveTime(e.target.value)}
                      className="w-1/3 text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={effectiveUntilId} className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'تاريخ انتهاء السريان (اختياري)' : 'Effective Until (Optional)'}
                  </label>
                  <input
                    id={effectiveUntilId}
                    type="date"
                    value={formEffectiveUntilDate}
                    onChange={(e) => setFormEffectiveUntilDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {isAr ? 'اتركه فارغاً للسريان حتى إشعار آخر' : 'Leave blank for open-ended validity'}
                  </span>
                </div>
              </div>

              {/* 4. Country Scope & Source (Section 30) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={scopeSelectId} className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'نطاق الدولة (Country Scope)' : 'Country Scope'}
                  </label>
                  <select
                    id={scopeSelectId}
                    value={formCountryScope}
                    onChange={(e) => setFormCountryScope(e.target.value as any)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 font-bold focus:bg-white"
                  >
                    <option value="GLOBAL">{isAr ? 'عالمي (GLOBAL - كافة الفروع)' : 'GLOBAL (All Branches)'}</option>
                    <option value="JO">{isAr ? 'الأردن فقط (JO Scope)' : 'JO - Jordan Desk Only'}</option>
                    <option value="DZ">{isAr ? 'الجزائر فقط (DZ Scope)' : 'DZ - Algeria Desk Only'}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor={sourceInputId} className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'المصدر المعتمد (Source)' : 'Reference Source'}
                  </label>
                  <input
                    id={sourceInputId}
                    type="text"
                    required
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white"
                    placeholder={isAr ? 'مثال: البنك المركزي / تسعير الخزينة' : 'e.g. Central Bank / Treasury Fix'}
                  />
                </div>
              </div>

              {/* 5. Operational Notes */}
              <div>
                <label htmlFor={notesInputId} className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'الملاحظات وتبرير السعر' : 'Operational Notes & Rationale'}
                </label>
                <textarea
                  id={notesInputId}
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder={isAr ? 'سجل سبب التعديل أو المرجع الرقابي...' : 'Reason for rate change or regulatory reference...'}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white"
                />
              </div>

              {/* Draft option checkbox (Rule 10) */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="saveAsDraftCheck"
                  checked={formSaveAsDraft}
                  onChange={(e) => setFormSaveAsDraft(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="saveAsDraftCheck" className="text-xs text-slate-700 cursor-pointer">
                  {isAr ? 'حفظ كمسودة (DRAFT) فقط دون تفعيل فوري' : 'Save as DRAFT (not active for settlements)'}
                </label>
              </div>

              {/* Form Actions */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors"
                >
                  {formSaveAsDraft
                    ? isAr ? 'حفظ كمسودة' : 'Save as Draft'
                    : isAr ? 'متابعة وتأكيد الاعتماد' : 'Review & Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Activation Confirmation Modal (Section 82) */}
      {isActivatingConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 z-60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {isAr ? 'تأكيد اعتماد سعر الصرف' : 'Confirm FX Rate Activation'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr ? 'مراجعة بيانات التسعير قبل الحفظ في السجل الدائم' : 'Verify rates before committing to immutable registry'}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">{isAr ? 'زوج العملات:' : 'Currency Pair:'}</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formBaseCurrency} / {formQuoteCurrency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-800 font-bold">{isAr ? 'سعر الشراء (BUY):' : 'BUY Rate:'}</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">{formBuyRate} {formQuoteCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-800 font-bold">{isAr ? 'سعر البيع (SELL):' : 'SELL Rate:'}</span>
                <span className="font-mono font-bold text-blue-700 text-sm">{formSellRate} {formQuoteCurrency}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">{isAr ? 'تاريخ السريان:' : 'Effective From:'}</span>
                <span className="font-bold text-slate-800">{formEffectiveDate} {formEffectiveTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'النطاق:' : 'Scope:'}</span>
                <span className="font-mono font-bold text-slate-800">{formCountryScope}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'الحالة بعد الحفظ:' : 'Status after save:'}</span>
                <span className="font-bold text-amber-700">
                  {formSaveAsDraft ? 'DRAFT' : new Date(`${formEffectiveDate}T${formEffectiveTime}:00Z`) > new Date() ? 'SCHEDULED' : 'ACTIVE'}
                </span>
              </div>
            </div>

            {/* Version comparison if New Version */}
            {baseVersionForNewVersion && (
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold">{isAr ? 'مقارنة بالإصدار السابق:' : 'Version Comparison:'}</div>
                <div className="flex justify-between text-[11px]">
                  <span>{isAr ? 'سعر الشراء السابق:' : 'Old Buy:'} {baseVersionForNewVersion.buyRate}</span>
                  <span className="font-bold text-emerald-800">{isAr ? 'الجديد:' : 'New:'} {formBuyRate}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>{isAr ? 'سعر البيع السابق:' : 'Old Sell:'} {baseVersionForNewVersion.sellRate}</span>
                  <span className="font-bold text-blue-800">{isAr ? 'الجديد:' : 'New:'} {formSellRate}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsActivatingConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                {isAr ? 'تعديل' : 'Edit'}
              </button>
              <button
                type="button"
                onClick={handleExecuteSave}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isAr ? 'تأكيد الحفظ والنشر' : 'Confirm & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Disable Confirmation Modal (Rules 46, 47: No permanent delete, warning if leaving no active rate) */}
      {confirmDisableRate && (
        <div className="fixed inset-0 bg-slate-900/60 z-60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <PauseCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {isAr ? 'تعطيل سعر الصرف' : 'Disable Exchange Rate'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr ? `تعطيل الزوج ${confirmDisableRate.baseCurrency}/${confirmDisableRate.quoteCurrency} (v${confirmDisableRate.version})` : `Disable pair ${confirmDisableRate.baseCurrency}/${confirmDisableRate.quoteCurrency} (v${confirmDisableRate.version})`}
                </p>
              </div>
            </div>

            {checkDisablingLeavesNoActive(confirmDisableRate) && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold">{isAr ? 'تحذير تشغيلي صارم:' : 'Operational Warning:'}</span>
                  <p>
                    {isAr
                      ? 'تعطيل هذا السعر سيترك زوج العملات هذا دون أي سعر صرف نشط، مما سيؤدي إلى حظر كافة عمليات التحويل والتسوية المتعلقة به آلياً (BLOCK).'
                      : 'Disabling this rate will leave this currency pair without an active exchange rate, blocking all related FX settlements.'}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'سبب التعطيل الإداري (إلزامي للتدقيق)' : 'Reason for Disabling (Audit Requirement)'}
              </label>
              <textarea
                rows={2}
                value={disableReason}
                onChange={(e) => setDisableReason(e.target.value)}
                placeholder={isAr ? 'سجل سبب التعطيل...' : 'State reason for disabling...'}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmDisableRate(null);
                  setDisableReason('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteDisable}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isAr ? 'تأكيد التعطيل' : 'Confirm Disable'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Details Drawer (Section 71) */}
      <DetailsDrawer
        isOpen={!!selectedRateDetails}
        onClose={() => setSelectedRateDetails(null)}
        title={
          selectedRateDetails
            ? `${selectedRateDetails.baseCurrency} / ${selectedRateDetails.quoteCurrency}`
            : isAr ? 'تفاصيل سعر الصرف' : 'FX Rate Details'
        }
        subtitle={selectedRateDetails ? `ID: ${selectedRateDetails.id}` : undefined}
        badge={
          selectedRateDetails ? (
            <StatusBadge domain="PRICING" status={selectedRateDetails.status} locale={locale} size="sm" />
          ) : undefined
        }
        locale={locale}
        footerActions={
          selectedRateDetails && hasFxManage ? (
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  const r = selectedRateDetails;
                  setSelectedRateDetails(null);
                  handleOpenNewVersion(r);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isAr ? 'إنشاء إصدار جديد من هذا السعر' : 'Create New Version'}</span>
              </button>
            </div>
          ) : undefined
        }
      >
        {selectedRateDetails && (
          <div className="space-y-4 text-xs">
            {/* Overview Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">{isAr ? 'رقم الإصدار (Version):' : 'Version Number:'}</span>
                <span className="font-mono font-bold text-slate-900 text-sm">v{selectedRateDetails.version}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">{isAr ? 'العملة الأساسية (Base):' : 'Base Currency:'}</span>
                <span className="font-mono font-bold text-slate-900">{selectedRateDetails.baseCurrency}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">{isAr ? 'عملة التسعير (Quote):' : 'Quote Currency:'}</span>
                <span className="font-mono font-bold text-slate-900">{selectedRateDetails.quoteCurrency}</span>
              </div>
            </div>

            {/* Rates Card */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 space-y-1">
                <span className="text-[11px] text-emerald-800 font-bold block">{isAr ? 'سعر الشراء (BUY)' : 'BUY Rate'}</span>
                <div className="text-base font-mono font-bold text-emerald-950">
                  {selectedRateDetails.buyRate.toFixed(selectedRateDetails.buyRate < 0.1 ? 6 : 4)}
                </div>
                <span className="text-[10px] text-emerald-700 block">
                  {isAr ? 'THOUESA تشتري العملة الأساسية' : 'THOUESA buys Base'}
                </span>
              </div>

              <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200 space-y-1">
                <span className="text-[11px] text-blue-800 font-bold block">{isAr ? 'سعر البيع (SELL)' : 'SELL Rate'}</span>
                <div className="text-base font-mono font-bold text-blue-950">
                  {selectedRateDetails.sellRate.toFixed(selectedRateDetails.sellRate < 0.1 ? 6 : 4)}
                </div>
                <span className="text-[10px] text-blue-700 block">
                  {isAr ? 'THOUESA تبيع العملة الأساسية' : 'THOUESA sells Base'}
                </span>
              </div>
            </div>

            {/* Derived Spread */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
              <span className="text-slate-500">{isAr ? 'الفارق المشتق (Spread):' : 'Derived Spread:'}</span>
              <span className="font-mono font-bold text-slate-800">
                {Number(Math.abs(selectedRateDetails.sellRate - selectedRateDetails.buyRate).toFixed(6))} {selectedRateDetails.quoteCurrency}
              </span>
            </div>

            {/* Dates and Scope */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'تاريخ السريان:' : 'Effective From:'}</span>
                <span className="font-bold text-slate-800">
                  {new Date(selectedRateDetails.effectiveFrom).toLocaleString(isAr ? 'ar-JO' : 'en-US')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'انتهاء السريان:' : 'Effective Until:'}</span>
                <span className="font-bold text-slate-800">
                  {selectedRateDetails.effectiveUntil
                    ? new Date(selectedRateDetails.effectiveUntil).toLocaleString(isAr ? 'ar-JO' : 'en-US')
                    : isAr ? 'غير محدد (مستمر)' : 'Indefinite'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'نطاق الدولة:' : 'Country Scope:'}</span>
                <span className="font-mono font-bold text-slate-800">{selectedRateDetails.countryScope}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'المصدر المعتمد:' : 'Reference Source:'}</span>
                <span className="font-bold text-slate-800">{selectedRateDetails.source}</span>
              </div>
            </div>

            {/* Audit info */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'أُنشئ بواسطة:' : 'Created By:'}</span>
                <span className="font-bold text-slate-800">{selectedRateDetails.createdBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'تاريخ الإنشاء:' : 'Created At:'}</span>
                <span className="text-slate-700">
                  {new Date(selectedRateDetails.createdAt).toLocaleString(isAr ? 'ar-JO' : 'en-US')}
                </span>
              </div>
              {selectedRateDetails.notes && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block mb-1">{isAr ? 'ملاحظات:' : 'Notes:'}</span>
                  <p className="text-slate-700 italic">{selectedRateDetails.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </DetailsDrawer>
    </div>
  );
};
