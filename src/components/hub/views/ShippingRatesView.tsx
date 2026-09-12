import React, { useState, useId } from 'react';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Lock, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  ShieldCheck,
  Plane,
  Layers,
  PauseCircle,
  FileText,
  Clock,
  ChevronDown,
  XCircle,
  RotateCcw
} from 'lucide-react';
import { Hub, Locale, PricingModel, ServiceType, ShippingRate, User, WeightTier } from '../../../types';
import { StatusBadge } from '../common/StatusBadge';
import { DetailsDrawer } from '../common/DetailsDrawer';
import { normalizeCountryCode } from '../../../lib/statusNormalizer';

export interface ShippingRatesViewProps {
  rates: ShippingRate[];
  currentHub: Hub;
  currentUser: User;
  locale: Locale;
  onSaveRate: (newRate: Partial<ShippingRate>) => void;
  onDisableRate?: (rateId: string, reason?: string) => void;
}

export const ShippingRatesView: React.FC<ShippingRatesViewProps> = ({
  rates,
  currentHub,
  currentUser,
  locale,
  onSaveRate,
  onDisableRate,
}) => {
  const isAr = locale === 'ar';
  const isMasterAdmin = currentUser.role === 'MASTER_ADMIN';

  // Permission checks
  const permissions = currentUser.permissions || [];
  const hasViewPerm = isMasterAdmin || currentUser.role === 'PRICING_MANAGER' || permissions.includes('pricing.view') || permissions.includes('all');
  const hasCreatePerm = isMasterAdmin || currentUser.role === 'PRICING_MANAGER' || permissions.includes('pricing.create') || permissions.includes('all');
  const hasDisablePerm = isMasterAdmin || currentUser.role === 'PRICING_MANAGER' || permissions.includes('pricing.disable') || permissions.includes('all');

  // Country scope determined by employee's assigned hub with robust normalizer (JOR/JO, DZA/DZ)
  const employeeOriginScope = normalizeCountryCode(currentHub.countryCode || 'JO') as 'JO' | 'DZ';
  const [activeTab, setActiveTab] = useState<'CUSTOMER_SHIPPING' | 'TRAVELER_COMPENSATION'>('CUSTOMER_SHIPPING');

  // Filters state
  const [selectedRoute, setSelectedRoute] = useState<'ALL' | 'JO-DZ' | 'DZ-JO'>('ALL');
  const [selectedService, setSelectedService] = useState<string>('ALL');
  const [selectedPricingModel, setSelectedPricingModel] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Drawer / Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'CREATE' | 'NEW_VERSION'>('CREATE');
  const [selectedRateDetails, setSelectedRateDetails] = useState<ShippingRate | null>(null);
  const [confirmDisableRate, setConfirmDisableRate] = useState<ShippingRate | null>(null);
  const [disableReason, setDisableReason] = useState<string>('');

  // Form Field State
  const [formOriginCountry, setFormOriginCountry] = useState<'JO' | 'DZ'>(employeeOriginScope);
  const [formDestCountry, setFormDestCountry] = useState<'JO' | 'DZ'>(employeeOriginScope === 'JO' ? 'DZ' : 'JO');
  const [formRateType, setFormRateType] = useState<'CUSTOMER_SHIPPING' | 'TRAVELER_COMPENSATION'>('CUSTOMER_SHIPPING');
  const [formServiceType, setFormServiceType] = useState<ServiceType>('SEND_PARCEL');
  const [formPricingModel, setFormPricingModel] = useState<PricingModel>('PER_KG');
  const [formCurrency, setFormCurrency] = useState<'JOD' | 'DZD' | 'USD'>(employeeOriginScope === 'JO' ? 'JOD' : 'DZD');
  const [formRatePerKg, setFormRatePerKg] = useState<number>(employeeOriginScope === 'JO' ? 7.5 : 1800);
  const [formFlatAmount, setFormFlatAmount] = useState<number>(employeeOriginScope === 'JO' ? 15.0 : 3500);
  const [formMinCharge, setFormMinCharge] = useState<number>(employeeOriginScope === 'JO' ? 5.0 : 1500);
  const [formMinBillableWeight, setFormMinBillableWeight] = useState<number>(0.5);
  const [formEffectiveFrom, setFormEffectiveFrom] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formEffectiveUntil, setFormEffectiveUntil] = useState<string>('');
  const [formReason, setFormReason] = useState<string>('');
  const [baseVersionForNewVersion, setBaseVersionForNewVersion] = useState<number>(1);
  const [formSaveAsDraft, setFormSaveAsDraft] = useState<boolean>(false);

  // Validation feedback
  const [validationError, setValidationError] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Weight Tiers state
  const [weightTiers, setWeightTiers] = useState<WeightTier[]>([
    { fromKg: 0, toKg: 1, ratePerKg: employeeOriginScope === 'JO' ? 8.0 : 2000 },
    { fromKg: 1, toKg: 5, ratePerKg: employeeOriginScope === 'JO' ? 7.5 : 1800 },
    { fromKg: 5, toKg: 10, ratePerKg: employeeOriginScope === 'JO' ? 7.0 : 1600 },
  ]);

  // Accessible Form IDs
  const destSelectId = useId();
  const serviceSelectId = useId();
  const pricingModelSelectId = useId();
  const currencySelectId = useId();
  const ratePerKgInputId = useId();
  const flatAmountInputId = useId();
  const minChargeInputId = useId();
  const minWeightInputId = useId();
  const effFromInputId = useId();
  const effUntilInputId = useId();
  const reasonInputId = useId();

  // Tier helpers
  const handleAddTier = () => {
    const lastTier = weightTiers[weightTiers.length - 1];
    const newFrom = lastTier ? lastTier.toKg : 0;
    setWeightTiers([
      ...weightTiers,
      { fromKg: newFrom, toKg: Number((newFrom + 5).toFixed(1)), ratePerKg: lastTier ? lastTier.ratePerKg : (formOriginCountry === 'JO' ? 6.0 : 1500) },
    ]);
  };

  const handleRemoveTier = (index: number) => {
    if (weightTiers.length <= 1) return;
    setWeightTiers(weightTiers.filter((_, i) => i !== index));
  };

  const handleUpdateTier = (index: number, field: keyof WeightTier, val: number) => {
    const updated = [...weightTiers];
    updated[index] = { ...updated[index], [field]: val };
    setWeightTiers(updated);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setFormMode('CREATE');
    setValidationError(null);
    setConflictWarning(null);
    setFormOriginCountry(employeeOriginScope);
    setFormDestCountry(employeeOriginScope === 'JO' ? 'DZ' : 'JO');
    setFormRateType(activeTab);
    setFormServiceType('SEND_PARCEL');
    setFormPricingModel('PER_KG');
    setFormCurrency(employeeOriginScope === 'JO' ? 'JOD' : 'DZD');
    setFormRatePerKg(employeeOriginScope === 'JO' ? 7.5 : 1800);
    setFormFlatAmount(employeeOriginScope === 'JO' ? 15.0 : 3500);
    setFormMinCharge(employeeOriginScope === 'JO' ? 5.0 : 1500);
    setFormMinBillableWeight(0.5);
    setFormEffectiveFrom(new Date().toISOString().split('T')[0]);
    setFormEffectiveUntil('');
    setFormReason('');
    setFormSaveAsDraft(false);
    setIsFormOpen(true);
  };

  // Open New Version Modal prefilled with existing rate
  const openNewVersionModal = (existingRate: ShippingRate) => {
    setFormMode('NEW_VERSION');
    setValidationError(null);
    setConflictWarning(null);
    setFormOriginCountry(normalizeCountryCode(existingRate.originCountry) as 'JO' | 'DZ');
    setFormDestCountry(normalizeCountryCode(existingRate.destinationCountry) as 'JO' | 'DZ');
    setFormRateType(existingRate.rateType);
    setFormServiceType(existingRate.serviceType);
    setFormPricingModel(existingRate.pricingModel);
    setFormCurrency(existingRate.currency);
    setFormRatePerKg(existingRate.ratePerKg);
    setFormFlatAmount(existingRate.minimumCharge || (existingRate.originCountry === 'JO' ? 15.0 : 3500));
    setFormMinCharge(existingRate.minimumCharge);
    setFormMinBillableWeight(existingRate.minimumBillableWeightKg);
    setWeightTiers(existingRate.tiers && existingRate.tiers.length > 0 ? existingRate.tiers : [
      { fromKg: 0, toKg: 1, ratePerKg: existingRate.ratePerKg * 1.1 },
      { fromKg: 1, toKg: 5, ratePerKg: existingRate.ratePerKg },
      { fromKg: 5, toKg: 10, ratePerKg: existingRate.ratePerKg * 0.9 },
    ]);
    setFormEffectiveFrom(new Date().toISOString().split('T')[0]);
    setFormEffectiveUntil('');
    setBaseVersionForNewVersion(existingRate.version);
    setFormReason(isAr ? `تحديث تعرفة وتعديل تشغيلي للإصدار v${existingRate.version + 1}` : `Operational adjustment for v${existingRate.version + 1}`);
    setFormSaveAsDraft(false);
    setIsFormOpen(true);
  };

  // Form submission with comprehensive validations
  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Rule 1: Origin and destination must be different
    if (formOriginCountry === formDestCountry) {
      setValidationError(isAr ? 'خطأ: لا يمكن أن يكون بلد المنشأ والوجهة متطابقين لمسار دولي.' : 'Origin and destination cannot be the same.');
      return;
    }

    // Rule 2: Country scope restriction for non-admins
    if (!isMasterAdmin && formOriginCountry !== employeeOriginScope) {
      setValidationError(
        isAr 
          ? `ليس لديك صلاحية لإدارة أسعار المنشأ ${formOriginCountry}. نطاقك الحالي محصور في ${employeeOriginScope}.` 
          : `You do not have permission to manage rates for origin country ${formOriginCountry}.`
      );
      return;
    }

    // Rule 3: Validate pricing model values
    if (formPricingModel === 'PER_KG') {
      if (formRatePerKg <= 0) {
        setValidationError(isAr ? 'خطأ: يجب أن يكون السعر لكل كغم أكبر من صفر.' : 'Rate per KG must be greater than zero.');
        return;
      }
    } else if (formPricingModel === 'FLAT_RATE') {
      if (formFlatAmount <= 0) {
        setValidationError(isAr ? 'خطأ: يجب أن يكون السعر الثابت أكبر من صفر.' : 'Flat amount must be greater than zero.');
        return;
      }
    } else if (formPricingModel === 'WEIGHT_TIERS') {
      if (!weightTiers || weightTiers.length === 0) {
        setValidationError(isAr ? 'خطأ: يجب تعريف شريحة وزن واحدة على الأقل.' : 'At least one weight tier must be configured.');
        return;
      }
      for (let i = 0; i < weightTiers.length; i++) {
        const t = weightTiers[i];
        if (t.fromKg < 0) {
          setValidationError(isAr ? `الشريحة ${i + 1}: الوزن الأدنى لا يمكن أن يكون سالباً.` : `Tier ${i + 1}: Min weight cannot be negative.`);
          return;
        }
        if (t.toKg <= t.fromKg) {
          setValidationError(isAr ? `الشريحة ${i + 1}: الوزن الأقصى يجب أن يكون أكبر من الوزن الأدنى.` : `Tier ${i + 1}: Max weight must be greater than min weight.`);
          return;
        }
        if (t.ratePerKg <= 0) {
          setValidationError(isAr ? `الشريحة ${i + 1}: يجب أن يكون السعر أكبر من صفر.` : `Tier ${i + 1}: Rate must be greater than zero.`);
          return;
        }
        if (i > 0 && t.fromKg < weightTiers[i - 1].toKg) {
          setValidationError(
            isAr 
              ? `خطأ: تداخل في شرائح الوزن بين الشريحة ${i} والشريحة ${i + 1}.` 
              : `Weight tiers overlap between tier ${i} and tier ${i + 1}.`
          );
          return;
        }
      }
    }

    // Rule 4: Effective date validation
    if (formEffectiveUntil && new Date(formEffectiveUntil) <= new Date(formEffectiveFrom)) {
      setValidationError(isAr ? 'خطأ: تاريخ نهاية السريان يجب أن يكون بعد تاريخ البداية.' : 'Effective end date must be after start date.');
      return;
    }

    // Rule 5: Duplicate active conflict check
    if (!formSaveAsDraft) {
      const now = new Date();
      const isEffFuture = new Date(formEffectiveFrom) > now;
      const targetStatus = isEffFuture ? 'SCHEDULED' : 'ACTIVE';

      const existingConflicts = rates.filter((r) => {
        const rOrig = normalizeCountryCode(r.originCountry);
        const rDest = normalizeCountryCode(r.destinationCountry);
        return (
          rOrig === formOriginCountry &&
          rDest === formDestCountry &&
          r.rateType === formRateType &&
          r.serviceType === formServiceType &&
          r.status === targetStatus
        );
      });

      if (existingConflicts.length > 0 && formMode === 'CREATE') {
        setConflictWarning(
          isAr
            ? `تنبيه: توجد بالفعل تعرفة (${targetStatus === 'ACTIVE' ? 'نشطة' : 'مجدولة'}) لنفس المسار والخدمة والنوع. سيؤدي هذا الإجراء لإغلاق التعرفة السابقة وتسجيل نسخة جديدة.`
            : `Notice: An active/scheduled rate already exists for this exact chain. Saving a new version will supersede the previous rate.`
        );
      }
    }

    // Construct Payload
    onSaveRate({
      originCountry: formOriginCountry,
      destinationCountry: formDestCountry,
      serviceType: formServiceType,
      rateType: formRateType,
      pricingModel: formPricingModel,
      currency: formCurrency,
      ratePerKg: formPricingModel === 'FLAT_RATE' ? formFlatAmount : formRatePerKg,
      minimumCharge: formPricingModel === 'FLAT_RATE' ? formFlatAmount : formMinCharge,
      minimumBillableWeightKg: formMinBillableWeight,
      tiers: formPricingModel === 'WEIGHT_TIERS' ? weightTiers : undefined,
      effectiveFrom: new Date(formEffectiveFrom).toISOString(),
      effectiveUntil: formEffectiveUntil ? new Date(formEffectiveUntil).toISOString() : undefined,
      status: formSaveAsDraft ? 'DRAFT' : undefined, // Will be computed in HubPortal based on date
      reason: formReason || (isAr ? (formMode === 'NEW_VERSION' ? 'إصدار نسخة سعرية جديدة' : 'إصدار تعرفة جديدة') : 'Tariff update'),
    });

    setIsFormOpen(false);
  };

  // Perform disablement
  const handleConfirmDisable = () => {
    if (!confirmDisableRate || !onDisableRate) return;
    onDisableRate(confirmDisableRate.id, disableReason || (isAr ? 'تعطيل تشغيلي معتمد' : 'Operational disablement'));
    setConfirmDisableRate(null);
    setDisableReason('');
  };

  // Filter rates for current view
  // 1. Separate by activeTab: CUSTOMER_SHIPPING vs TRAVELER_COMPENSATION
  // 2. Separate by Route: JO -> DZ vs DZ -> JO
  // 3. Status sorting: ACTIVE -> SCHEDULED -> DRAFT -> EXPIRED -> DISABLED
  const filteredRates = rates.filter((r) => {
    if (r.rateType !== activeTab) return false;

    const rOrig = normalizeCountryCode(r.originCountry);
    const rDest = normalizeCountryCode(r.destinationCountry);
    const routeKey = `${rOrig}-${rDest}`;

    if (selectedRoute !== 'ALL' && routeKey !== selectedRoute) return false;
    if (selectedService !== 'ALL' && r.serviceType !== selectedService) return false;
    if (selectedPricingModel !== 'ALL' && r.pricingModel !== selectedPricingModel) return false;
    if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = (r.id || '').toLowerCase().includes(q);
      const matchRoute = `${rOrig} ${rDest}`.toLowerCase().includes(q);
      const matchReason = (r.reason || '').toLowerCase().includes(q);
      if (!matchId && !matchRoute && !matchReason) return false;
    }

    return true;
  });

  // Sort by priority: ACTIVE (1) -> SCHEDULED (2) -> DRAFT (3) -> EXPIRED (4) -> DISABLED (5)
  const statusPriority: Record<string, number> = {
    ACTIVE: 1,
    SCHEDULED: 2,
    DRAFT: 3,
    EXPIRED: 4,
    DISABLED: 5,
    INACTIVE: 5,
    ARCHIVED: 6,
  };

  const sortedRates = [...filteredRates].sort((a, b) => {
    const pA = statusPriority[a.status] || 99;
    const pB = statusPriority[b.status] || 99;
    if (pA !== pB) return pA - pB;
    return new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime();
  });

  // KPI Calculations across the 4 independent pricing chains
  const activeCustomerRatesCount = rates.filter((r) => r.rateType === 'CUSTOMER_SHIPPING' && r.status === 'ACTIVE').length;
  const activeTravelerRatesCount = rates.filter((r) => r.rateType === 'TRAVELER_COMPENSATION' && r.status === 'ACTIVE').length;
  const scheduledRatesCount = rates.filter((r) => r.status === 'SCHEDULED').length;
  
  // Check expiring soon (within next 14 days)
  const nowMs = Date.now();
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
  const expiringSoonCount = rates.filter((r) => {
    if (r.status !== 'ACTIVE' || !r.effectiveUntil) return false;
    const untilMs = new Date(r.effectiveUntil).getTime();
    return untilMs > nowMs && (untilMs - nowMs) <= fourteenDaysMs;
  }).length;

  // Route-specific Coverage Matrix Checks:
  // 1. JO -> DZ Customer
  const hasJoDzCust = rates.some((r) => normalizeCountryCode(r.originCountry) === 'JO' && normalizeCountryCode(r.destinationCountry) === 'DZ' && r.rateType === 'CUSTOMER_SHIPPING' && r.status === 'ACTIVE');
  // 2. JO -> DZ Traveler
  const hasJoDzTrav = rates.some((r) => normalizeCountryCode(r.originCountry) === 'JO' && normalizeCountryCode(r.destinationCountry) === 'DZ' && r.rateType === 'TRAVELER_COMPENSATION' && r.status === 'ACTIVE');
  // 3. DZ -> JO Customer
  const hasDzJoCust = rates.some((r) => normalizeCountryCode(r.originCountry) === 'DZ' && normalizeCountryCode(r.destinationCountry) === 'JO' && r.rateType === 'CUSTOMER_SHIPPING' && r.status === 'ACTIVE');
  // 4. DZ -> JO Traveler
  const hasDzJoTrav = rates.some((r) => normalizeCountryCode(r.originCountry) === 'DZ' && normalizeCountryCode(r.destinationCountry) === 'JO' && r.rateType === 'TRAVELER_COMPENSATION' && r.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      {/* 1. Header & Scope Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900">
                  {isAr ? 'أسعار الشحن الرسمية' : 'Shipping Rates'}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr 
                    ? 'إدارة أسعار شحن العملاء وتعويضات المسافرين حسب اتجاه النقل والخدمة ونموذج التسعير وفترة السريان.' 
                    : 'Manage customer shipping rates and traveler compensation with strict route direction and versioning.'}
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-lg border border-amber-200">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>
                  {isAr ? `نطاق المنشأ المعتمد للموظف: ${employeeOriginScope === 'JO' ? 'الأردن (JO)' : 'الجزائر (DZ)'}` : `Origin Scope: ${employeeOriginScope}`}
                </span>
              </span>
              {isMasterAdmin && (
                <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-purple-200">
                  {isAr ? 'صلاحيات المدير العام (كافة المسارات)' : 'Master Admin Scope (All Routes)'}
                </span>
              )}
            </div>
          </div>

          {hasCreatePerm && (
            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إصدار تعرفة جديدة' : 'New Shipping Rate'}</span>
            </button>
          )}
        </div>

        {/* 2. Four Exact Independent KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5 pt-4 border-t border-slate-100">
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
            <div className="flex items-center justify-between text-xs text-amber-800 font-bold mb-1">
              <span>{isAr ? 'أسعار شحن العملاء الفعالة' : 'Active Customer Rates'}</span>
              <DollarSign className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-950 font-mono">{activeCustomerRatesCount}</div>
            <div className="text-[11px] text-amber-700 mt-0.5">{isAr ? 'سعر فاتورة العميل' : 'Customer billing'}</div>
          </div>

          <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl">
            <div className="flex items-center justify-between text-xs text-indigo-800 font-bold mb-1">
              <span>{isAr ? 'تعويضات المسافرين الفعالة' : 'Active Traveler Rates'}</span>
              <Plane className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-950 font-mono">{activeTravelerRatesCount}</div>
            <div className="text-[11px] text-indigo-700 mt-0.5">{isAr ? 'مستحقات نقل المسافر' : 'Traveler payouts'}</div>
          </div>

          <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl">
            <div className="flex items-center justify-between text-xs text-sky-800 font-bold mb-1">
              <span>{isAr ? 'التعريفات المجدولة' : 'Scheduled Rates'}</span>
              <Clock className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-black text-sky-950 font-mono">{scheduledRatesCount}</div>
            <div className="text-[11px] text-sky-700 mt-0.5">{isAr ? 'جاهزة للتفعيل المستقبلي' : 'Future effective dates'}</div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-700 font-bold mb-1">
              <span>{isAr ? 'تنتهي قريباً (خلال 14 يوماً)' : 'Expiring Soon'}</span>
              <Calendar className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">{expiringSoonCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{isAr ? 'تتطلب إصدار نسخة جديدة' : 'Requires new version'}</div>
          </div>
        </div>

        {/* 3. Coverage Matrix Summary Bar (4 Chains Audit) */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <div className="font-bold text-slate-700 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? 'حالة تغطية السلاسل السعرية الأربعة المستقلة (Coverage Matrix):' : 'Four Independent Chains Coverage Matrix:'}</span>
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              {isAr ? 'ممنوع استخدام hardcoded fallback عند غياب أي سلسلة' : 'No hardcoded fallbacks permitted'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
            {/* Chain 1 & 2: Jordan -> Algeria */}
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900">الأردن ← الجزائر (JO → DZ)</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className={`px-2 py-0.5 rounded font-bold ${hasJoDzCust ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  CUST: {hasJoDzCust ? 'ACTIVE' : 'MISSING'}
                </span>
                <span className={`px-2 py-0.5 rounded font-bold ${hasJoDzTrav ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  TRAV: {hasJoDzTrav ? 'ACTIVE' : 'MISSING'}
                </span>
              </div>
            </div>

            {/* Chain 3 & 4: Algeria -> Jordan */}
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900">الجزائر ← الأردن (DZ → JO)</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className={`px-2 py-0.5 rounded font-bold ${hasDzJoCust ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  CUST: {hasDzJoCust ? 'ACTIVE' : 'MISSING'}
                </span>
                <span className={`px-2 py-0.5 rounded font-bold ${hasDzJoTrav ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  TRAV: {hasDzJoTrav ? 'ACTIVE' : 'MISSING'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Missing Rate Warnings */}
      {(!hasJoDzCust || !hasJoDzTrav || !hasDzJoCust || !hasDzJoTrav) && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{isAr ? 'تنبيه تشغيلي حول السلاسل السعرية الناقصة:' : 'Operational Notice on Missing Rate Chains:'}</span>
          </div>
          <p className="text-[11px] text-amber-800">
            {isAr
              ? 'وفق السياسة المؤسسية لـ THOUESA، لن يقوم النظام باستنتاج سعر أو استخدام Fallback عند غياب تعرفة فعالة، وسيتم إيقاف تسعير المسار المتأثر حتى اعتماد تعرفة نشطة.'
              : 'Per THOUESA strict policy, no hardcoded fallbacks exist. Missing active chains will strictly block pricing operations.'}
          </p>
        </div>
      )}

      {/* 5. Main Navigation Tabs (Customer Shipping vs Traveler Compensation) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('CUSTOMER_SHIPPING')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'CUSTOMER_SHIPPING'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>{isAr ? 'أسعار شحن العملاء (Customer Shipping)' : 'Customer Shipping Rates'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
              {rates.filter((r) => r.rateType === 'CUSTOMER_SHIPPING').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TRAVELER_COMPENSATION')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'TRAVELER_COMPENSATION'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Plane className="w-4 h-4" />
            <span>{isAr ? 'تعويضات المسافرين (Traveler Compensation)' : 'Traveler Compensation Rates'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
              {rates.filter((r) => r.rateType === 'TRAVELER_COMPENSATION').length}
            </span>
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative sm:w-64">
          <input
            type="text"
            placeholder={isAr ? 'بحث بالمسار أو رقم التعرفة...' : 'Search rates...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl ps-8 pe-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* 6. Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            {isAr ? 'مسار الشحن (Route)' : 'Route Direction'}
          </label>
          <select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value as any)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
          >
            <option value="ALL">{isAr ? 'كافة المسارات' : 'All Routes'}</option>
            <option value="JO-DZ">{isAr ? 'الأردن ← الجزائر (JO → DZ)' : 'Jordan → Algeria (JO → DZ)'}</option>
            <option value="DZ-JO">{isAr ? 'الجزائر ← الأردن (DZ → JO)' : 'Algeria → Jordan (DZ → JO)'}</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">
            {isAr ? 'نوع الخدمة' : 'Service Type'}
          </label>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
          >
            <option value="ALL">{isAr ? 'كافة الخدمات' : 'All Services'}</option>
            <option value="SEND_PARCEL">{isAr ? 'طرد شخصي (Personal Parcel)' : 'Personal Parcel'}</option>
            <option value="BUY_FOR_ME">{isAr ? 'اشترِ لي (Buy for Me)' : 'Buy for Me'}</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">
            {isAr ? 'نموذج التسعير' : 'Pricing Model'}
          </label>
          <select
            value={selectedPricingModel}
            onChange={(e) => setSelectedPricingModel(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
          >
            <option value="ALL">{isAr ? 'كافة النماذج' : 'All Models'}</option>
            <option value="PER_KG">{isAr ? 'لكل كغم (PER_KG)' : 'Per KG'}</option>
            <option value="FLAT_RATE">{isAr ? 'سعر ثابت (FLAT_RATE)' : 'Flat Rate'}</option>
            <option value="WEIGHT_TIERS">{isAr ? 'شرائح وزن (WEIGHT_TIERS)' : 'Weight Tiers'}</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">
            {isAr ? 'حالة التعرفة' : 'Status'}
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
          >
            <option value="ALL">{isAr ? 'الكل' : 'All'}</option>
            <option value="ACTIVE">{isAr ? 'نشطة (ACTIVE)' : 'Active'}</option>
            <option value="SCHEDULED">{isAr ? 'مجدولة (SCHEDULED)' : 'Scheduled'}</option>
            <option value="DRAFT">{isAr ? 'مسودة (DRAFT)' : 'Draft'}</option>
            <option value="EXPIRED">{isAr ? 'منتهية (EXPIRED)' : 'Expired'}</option>
            <option value="DISABLED">{isAr ? 'معطلة (DISABLED)' : 'Disabled'}</option>
          </select>
        </div>
      </div>

      {/* 7. Desktop Table View */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-3.5 text-start">{isAr ? 'المسار (Route)' : 'Route'}</th>
                <th className="p-3.5 text-start">{isAr ? 'النوع' : 'Rate Type'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الخدمة' : 'Service'}</th>
                <th className="p-3.5 text-start">{isAr ? 'النموذج' : 'Model'}</th>
                <th className="p-3.5 text-start">{isAr ? 'السعر والعملة' : 'Rate & Currency'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الحد الأدنى' : 'Min Charge'}</th>
                <th className="p-3.5 text-start">{isAr ? 'فترة السريان' : 'Effective Period'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الإصدار' : 'Version'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="p-3.5 text-center">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRates.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div className="font-bold text-slate-700">
                      {isAr ? 'لا توجد أسعار شحن معرفة حالياً تطابق الفلاتر' : 'No shipping rates found matching current filters'}
                    </div>
                    {hasCreatePerm && (
                      <button
                        type="button"
                        onClick={openCreateModal}
                        className="mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        {isAr ? 'إصدار تعرفة جديدة' : 'Create New Rate'}
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                sortedRates.map((r) => {
                  const origCode = normalizeCountryCode(r.originCountry);
                  const destCode = normalizeCountryCode(r.destinationCountry);
                  const origName = origCode === 'JO' ? (isAr ? 'الأردن' : 'Jordan') : (isAr ? 'الجزائر' : 'Algeria');
                  const destName = destCode === 'JO' ? (isAr ? 'الأردن' : 'Jordan') : (isAr ? 'الجزائر' : 'Algeria');
                  const isCust = r.rateType === 'CUSTOMER_SHIPPING';
                  const isEffectiveActive = r.status === 'ACTIVE';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{origName}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span>{destName}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          {origCode} → {destCode}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                            isCust
                              ? 'bg-amber-50 text-amber-900 border border-amber-200'
                              : 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                          }`}
                        >
                          {isCust ? (isAr ? 'سعر العميل' : 'Customer Rate') : (isAr ? 'تعويض المسافر' : 'Traveler Comp')}
                        </span>
                      </td>

                      <td className="p-3.5 font-semibold text-slate-800">
                        {r.serviceType === 'SEND_PARCEL' 
                          ? (isAr ? 'طرد شخصي' : 'Personal Parcel') 
                          : (isAr ? 'اشترِ لي' : 'Buy for Me')}
                      </td>

                      <td className="p-3.5 font-mono text-xs text-slate-600">
                        {r.pricingModel}
                      </td>

                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        {r.pricingModel === 'WEIGHT_TIERS' ? (
                          <span className="text-amber-700">
                            {r.tiers?.length || 0} {isAr ? 'شرائح وزن' : 'Tiers'}
                          </span>
                        ) : r.pricingModel === 'FLAT_RATE' ? (
                          <span>
                            {r.minimumCharge} {r.currency} (Flat)
                          </span>
                        ) : (
                          <span>
                            {r.ratePerKg} {r.currency} / KG
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-slate-600">
                        <div>{r.minimumCharge} {r.currency}</div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {r.minimumBillableWeightKg} KG min
                        </span>
                      </td>

                      <td className="p-3.5 text-[11px] text-slate-600">
                        <div>{new Date(r.effectiveFrom).toLocaleDateString(isAr ? 'ar-JO' : 'en-US')}</div>
                        {r.effectiveUntil ? (
                          <div className="text-slate-400 text-[10px]">
                            {isAr ? 'إلى: ' : 'Until: '}
                            {new Date(r.effectiveUntil).toLocaleDateString(isAr ? 'ar-JO' : 'en-US')}
                          </div>
                        ) : (
                          <div className="text-emerald-600 text-[10px]">{isAr ? 'ساري حتى إشعار آخر' : 'Open-ended'}</div>
                        )}
                      </td>

                      <td className="p-3.5 font-mono text-xs font-bold text-slate-700">
                        v{r.version}
                      </td>

                      <td className="p-3.5">
                        <StatusBadge domain="PRICING" status={r.status} locale={locale} size="sm" />
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedRateDetails(r)}
                            className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-bold cursor-pointer"
                          >
                            {isAr ? 'عرض' : 'View'}
                          </button>

                          {hasCreatePerm && (
                            <button
                              type="button"
                              onClick={() => openNewVersionModal(r)}
                              title={isAr ? 'إصدار نسخة سعرية جديدة دون حذف التاريخي' : 'Issue new version'}
                              className="px-2.5 py-1 text-xs text-amber-700 hover:bg-amber-50 rounded-lg transition-colors font-bold cursor-pointer"
                            >
                              {isAr ? 'نسخة جديدة' : 'New Version'}
                            </button>
                          )}

                          {hasDisablePerm && isEffectiveActive && (
                            <button
                              type="button"
                              onClick={() => setConfirmDisableRate(r)}
                              className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-bold cursor-pointer"
                            >
                              {isAr ? 'تعطيل' : 'Disable'}
                            </button>
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

      {/* 8. Mobile Card View (No Horizontal Overflow) */}
      <div className="md:hidden space-y-3">
        {sortedRates.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500">
            <Info className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <div className="font-bold text-slate-800 text-xs">
              {isAr ? 'لا توجد أسعار شحن تطابق الفلاتر' : 'No shipping rates match filters'}
            </div>
            {hasCreatePerm && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-3 px-4 py-2 bg-amber-500 text-white font-bold rounded-xl text-xs"
              >
                {isAr ? 'إصدار تعرفة جديدة' : 'Create Rate'}
              </button>
            )}
          </div>
        ) : (
          sortedRates.map((r) => {
            const origCode = normalizeCountryCode(r.originCountry);
            const destCode = normalizeCountryCode(r.destinationCountry);
            const origName = origCode === 'JO' ? (isAr ? 'الأردن' : 'Jordan') : (isAr ? 'الجزائر' : 'Algeria');
            const destName = destCode === 'JO' ? (isAr ? 'الأردن' : 'Jordan') : (isAr ? 'الجزائر' : 'Algeria');
            const isCust = r.rateType === 'CUSTOMER_SHIPPING';

            return (
              <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                      <span>{origName}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span>{destName}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {origCode} → {destCode} • v{r.version}
                    </span>
                  </div>
                  <StatusBadge domain="PRICING" status={r.status} locale={locale} size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-500 block">{isAr ? 'النوع:' : 'Type:'}</span>
                    <span className={`font-bold ${isCust ? 'text-amber-900' : 'text-indigo-900'}`}>
                      {isCust ? (isAr ? 'سعر العميل' : 'Customer Rate') : (isAr ? 'تعويض المسافر' : 'Traveler Comp')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block">{isAr ? 'السعر المعتمد:' : 'Rate:'}</span>
                    <span className="font-mono font-black text-slate-900">
                      {r.pricingModel === 'WEIGHT_TIERS' 
                        ? `${r.tiers?.length || 0} Tiers` 
                        : `${r.ratePerKg} ${r.currency} / KG`}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block">{isAr ? 'الخدمة:' : 'Service:'}</span>
                    <span className="font-semibold text-slate-800">
                      {r.serviceType === 'SEND_PARCEL' ? (isAr ? 'طرد شخصي' : 'Parcel') : (isAr ? 'اشترِ لي' : 'Buy for Me')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block">{isAr ? 'تاريخ السريان:' : 'Effective:'}</span>
                    <span className="font-mono text-slate-700">
                      {new Date(r.effectiveFrom).toLocaleDateString(isAr ? 'ar-JO' : 'en-US')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedRateDetails(r)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-lg"
                  >
                    {isAr ? 'عرض' : 'View'}
                  </button>

                  {hasCreatePerm && (
                    <button
                      type="button"
                      onClick={() => openNewVersionModal(r)}
                      className="px-3 py-1.5 bg-amber-50 text-amber-800 font-bold text-xs rounded-lg"
                    >
                      {isAr ? 'نسخة جديدة' : 'New Version'}
                    </button>
                  )}

                  {hasDisablePerm && r.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => setConfirmDisableRate(r)}
                      className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 font-bold text-xs rounded-lg"
                    >
                      {isAr ? 'تعطيل' : 'Disable'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 9. Create / New Version Drawer Form */}
      <DetailsDrawer
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={
          formMode === 'NEW_VERSION'
            ? (isAr ? `إصدار نسخة جديدة v${baseVersionForNewVersion + 1}` : `New Version v${baseVersionForNewVersion + 1}`)
            : (isAr ? 'إصدار تعرفة شحن جديدة' : 'Create New Shipping Rate')
        }
        subtitle={
          formMode === 'NEW_VERSION'
            ? (isAr ? 'النسخة السابقة ستبقى محفوظة ومؤرشفة ولن يتم حذفها إطلاقاً' : 'Previous version remains in history')
            : (isAr ? `نطاق المنشأ: ${formOriginCountry}` : `Origin Scope: ${formOriginCountry}`)
        }
        locale={locale}
        icon={<DollarSign className="w-5 h-5 text-amber-600" />}
      >
        <form onSubmit={handleSaveSubmit} className="space-y-4">
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {conflictWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{conflictWarning}</span>
            </div>
          )}

          {/* Locked Origin Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">
                {isAr ? 'بلد المنشأ مقفل بناءً على نطاق الموظف المعتمد:' : 'Origin country is locked by employee scope:'}
              </span>{' '}
              {formOriginCountry === 'JO' ? (isAr ? 'الأردن (Jordan)' : 'Jordan') : (isAr ? 'الجزائر (Algeria)' : 'Algeria')}
            </div>
          </div>

          {/* Origin & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'بلد المنشأ (مُقفل)' : 'Origin Country (Locked)'}
              </label>
              <input
                type="text"
                disabled
                value={formOriginCountry === 'JO' ? (isAr ? 'الأردن (JO)' : 'Jordan (JO)') : (isAr ? 'الجزائر (DZ)' : 'Algeria (DZ)')}
                className="w-full text-xs bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-slate-600 font-bold cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor={destSelectId} className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'بلد الوجهة (المسار المقابل)' : 'Destination Country'}
              </label>
              <select
                id={destSelectId}
                value={formDestCountry}
                disabled={formMode === 'NEW_VERSION'}
                onChange={(e) => {
                  setFormDestCountry(e.target.value as any);
                  setFormCurrency(formOriginCountry === 'JO' ? 'JOD' : 'DZD');
                }}
                className={`w-full text-xs border rounded-xl p-2.5 text-slate-900 ${
                  formMode === 'NEW_VERSION' ? 'bg-slate-100 border-slate-300 cursor-not-allowed' : 'bg-white border-slate-300 focus:ring-2 focus:ring-amber-500'
                }`}
              >
                {formOriginCountry === 'JO' ? (
                  <option value="DZ">{isAr ? 'الجزائر (Algeria)' : 'Algeria (DZ)'}</option>
                ) : (
                  <option value="JO">{isAr ? 'الأردن (Jordan)' : 'Jordan (JO)'}</option>
                )}
              </select>
            </div>
          </div>

          {/* Rate Category Selection (Strict Separation) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isAr ? 'نوع التعرفة (Rate Type)' : 'Rate Category'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={formMode === 'NEW_VERSION'}
                onClick={() => setFormRateType('CUSTOMER_SHIPPING')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  formRateType === 'CUSTOMER_SHIPPING'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                } ${formMode === 'NEW_VERSION' ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isAr ? 'سعر شحن العميل (Customer)' : 'Customer Shipping'}
              </button>
              <button
                type="button"
                disabled={formMode === 'NEW_VERSION'}
                onClick={() => setFormRateType('TRAVELER_COMPENSATION')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  formRateType === 'TRAVELER_COMPENSATION'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                } ${formMode === 'NEW_VERSION' ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isAr ? 'تعويض المسافر (Traveler)' : 'Traveler Compensation'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isAr
                ? 'ممنوع استخدام سعر العميل لحساب تعويض المسافر، وممنوع استخدام تعويض المسافر لفاتورة العميل.'
                : 'Customer tariff and traveler compensation are strictly separate accounting streams.'}
            </p>
          </div>

          {/* Service Type */}
          <div>
            <label htmlFor={serviceSelectId} className="block text-xs font-bold text-slate-700 mb-1">
              {isAr ? 'نوع الخدمة' : 'Service Type'}
            </label>
            <select
              id={serviceSelectId}
              value={formServiceType}
              onChange={(e) => setFormServiceType(e.target.value as ServiceType)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500"
            >
              <option value="SEND_PARCEL">{isAr ? 'طرد شخصي (Personal Parcel)' : 'Personal Parcel'}</option>
              <option value="BUY_FOR_ME">{isAr ? 'اشترِ لي (Buy for Me)' : 'Buy for Me'}</option>
            </select>
          </div>

          {/* Pricing Model & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={pricingModelSelectId} className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'نموذج التسعير' : 'Pricing Model'}
              </label>
              <select
                id={pricingModelSelectId}
                value={formPricingModel}
                onChange={(e) => setFormPricingModel(e.target.value as PricingModel)}
                className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500"
              >
                <option value="PER_KG">{isAr ? 'لكل كيلوغرام (PER_KG)' : 'Per KG'}</option>
                <option value="FLAT_RATE">{isAr ? 'سعر ثابت (FLAT_RATE)' : 'Flat Rate'}</option>
                <option value="WEIGHT_TIERS">{isAr ? 'شرائح وزن (WEIGHT_TIERS)' : 'Weight Tiers'}</option>
              </select>
            </div>

            <div>
              <label htmlFor={currencySelectId} className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'العملة' : 'Currency'}
              </label>
              <select
                id={currencySelectId}
                value={formCurrency}
                onChange={(e) => setFormCurrency(e.target.value as any)}
                className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-amber-500"
              >
                <option value="JOD">JOD (دينار أردني)</option>
                <option value="DZD">DZD (دينار جزائري)</option>
                <option value="USD">USD (دولار أمريكي)</option>
              </select>
            </div>
          </div>

          {/* Dynamic Pricing Inputs */}
          {formPricingModel === 'PER_KG' && (
            <div>
              <label htmlFor={ratePerKgInputId} className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? `السعر لكل كغم (${formCurrency})` : `Rate per KG (${formCurrency})`}
              </label>
              <input
                id={ratePerKgInputId}
                type="number"
                step="0.01"
                min="0.01"
                value={formRatePerKg}
                onChange={(e) => setFormRatePerKg(parseFloat(e.target.value) || 0)}
                className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
          )}

          {formPricingModel === 'FLAT_RATE' && (
            <div>
              <label htmlFor={flatAmountInputId} className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? `المبلغ الثابت للشحنة (${formCurrency})` : `Flat Amount (${formCurrency})`}
              </label>
              <input
                id={flatAmountInputId}
                type="number"
                step="0.5"
                min="0.5"
                value={formFlatAmount}
                onChange={(e) => setFormFlatAmount(parseFloat(e.target.value) || 0)}
                className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
          )}

          {formPricingModel === 'WEIGHT_TIERS' && (
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  {isAr ? 'منشئ شرائح الوزن (Tier Builder)' : 'Weight Tiers Builder'}
                </span>
                <button
                  type="button"
                  onClick={handleAddTier}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
                >
                  + {isAr ? 'إضافة شريحة' : 'Add Tier'}
                </button>
              </div>

              <div className="space-y-2">
                {weightTiers.map((tier, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <input
                      type="number"
                      step="0.1"
                      value={tier.fromKg}
                      onChange={(e) => handleUpdateTier(idx, 'fromKg', parseFloat(e.target.value) || 0)}
                      placeholder="Min KG"
                      className="w-20 bg-white border border-slate-300 rounded-lg p-1.5 text-center font-mono"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      step="0.1"
                      value={tier.toKg}
                      onChange={(e) => handleUpdateTier(idx, 'toKg', parseFloat(e.target.value) || 0)}
                      placeholder="Max KG"
                      className="w-20 bg-white border border-slate-300 rounded-lg p-1.5 text-center font-mono"
                    />
                    <span>KG =</span>
                    <input
                      type="number"
                      step="0.1"
                      value={tier.ratePerKg}
                      onChange={(e) => handleUpdateTier(idx, 'ratePerKg', parseFloat(e.target.value) || 0)}
                      placeholder="Rate"
                      className="flex-1 bg-white border border-slate-300 rounded-lg p-1.5 font-mono font-bold"
                    />
                    <span className="font-mono text-slate-500 text-[11px]">{formCurrency}</span>
                    {weightTiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTier(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Minimum Charge & Min Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={minChargeInputId} className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? `الحد الأدنى للرسوم (${formCurrency})` : `Minimum Charge (${formCurrency})`}
              </label>
              <input
                id={minChargeInputId}
                type="number"
                step="0.5"
                value={formMinCharge}
                onChange={(e) => setFormMinCharge(parseFloat(e.target.value) || 0)}
                className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono"
                required
              />
            </div>

            <div>
              <label htmlFor={minWeightInputId} className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'الحد الأدنى للوزن القابل للفوترة (كغم)' : 'Min Billable Weight (KG)'}
              </label>
              <input
                id={minWeightInputId}
                type="number"
                step="0.1"
                value={formMinBillableWeight}
                onChange={(e) => setFormMinBillableWeight(parseFloat(e.target.value) || 0.5)}
                className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono"
                required
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={effFromInputId} className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'تاريخ بداية السريان (Effective From)' : 'Effective From'}
              </label>
              <input
                id={effFromInputId}
                type="date"
                value={formEffectiveFrom}
                onChange={(e) => setFormEffectiveFrom(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900"
                required
              />
            </div>

            <div>
              <label htmlFor={effUntilInputId} className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'تاريخ نهاية السريان (اختياري)' : 'Effective Until (Optional)'}
              </label>
              <input
                id={effUntilInputId}
                type="date"
                value={formEffectiveUntil}
                onChange={(e) => setFormEffectiveUntil(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900"
              />
            </div>
          </div>

          {/* Audit Reason */}
          <div>
            <label htmlFor={reasonInputId} className="block text-xs font-bold text-slate-700 mb-1">
              {isAr ? 'سبب التحديث / المذكرة الرسمية' : 'Reason for Rate Update'}
            </label>
            <textarea
              id={reasonInputId}
              rows={2}
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              placeholder={isAr ? 'مثال: تعديل تكلفة النقل الجوي والوقود للربع الحالي...' : 'e.g. Quarterly market adjustment...'}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900"
              required
            />
          </div>

          {/* Draft toggle */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="draftCheck"
              checked={formSaveAsDraft}
              onChange={(e) => setFormSaveAsDraft(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded"
            />
            <label htmlFor="draftCheck" className="text-xs text-slate-700 font-semibold cursor-pointer">
              {isAr ? 'حفظ كمسودة (DRAFT) غير مفعلة ولا تستخدم في الحسابات حالياً' : 'Save as DRAFT (Inactive, not used in pricing)'}
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {formMode === 'NEW_VERSION'
                ? (isAr ? 'اعتماد وحفظ النسخة الجديدة' : 'Save New Version')
                : (isAr ? 'حفظ التعرفة' : 'Save Rate')}
            </button>
          </div>
        </form>
      </DetailsDrawer>

      {/* 10. Rate Details Drawer */}
      {selectedRateDetails && (
        <DetailsDrawer
          isOpen={true}
          onClose={() => setSelectedRateDetails(null)}
          title={isAr ? 'تفاصيل تعرفة الشحن الرسمية' : 'Shipping Rate Details'}
          subtitle={selectedRateDetails.id}
          locale={locale}
          badge={<StatusBadge domain="PRICING" status={selectedRateDetails.status} locale={locale} size="sm" />}
          icon={<DollarSign className="w-5 h-5 text-amber-600" />}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="font-bold text-slate-800">{isAr ? 'بيانات المسار والتصنيف' : 'Route & Category'}</div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>{isAr ? 'بلد المنشأ:' : 'Origin:'} <span className="font-bold text-slate-900">{selectedRateDetails.originCountry}</span></div>
                <div>{isAr ? 'بلد الوجهة:' : 'Destination:'} <span className="font-bold text-slate-900">{selectedRateDetails.destinationCountry}</span></div>
                <div>{isAr ? 'نوع التعرفة:' : 'Rate Type:'} <span className="font-bold text-slate-900">{selectedRateDetails.rateType}</span></div>
                <div>{isAr ? 'الخدمة:' : 'Service:'} <span className="font-bold text-slate-900">{selectedRateDetails.serviceType}</span></div>
                <div>{isAr ? 'النموذج:' : 'Model:'} <span className="font-mono font-bold text-slate-900">{selectedRateDetails.pricingModel}</span></div>
                <div>{isAr ? 'الإصدار:' : 'Version:'} <span className="font-mono font-bold text-slate-900">v{selectedRateDetails.version}</span></div>
              </div>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'السعر لكل كغم:' : 'Rate per KG:'}</span>
                <span className="font-bold text-slate-900">{selectedRateDetails.ratePerKg} {selectedRateDetails.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'الحد الأدنى للفوترة:' : 'Minimum Charge:'}</span>
                <span className="font-bold text-slate-900">{selectedRateDetails.minimumCharge} {selectedRateDetails.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'أدنى وزن محاسبي:' : 'Min Billable Weight:'}</span>
                <span className="font-bold text-slate-900">{selectedRateDetails.minimumBillableWeightKg} KG</span>
              </div>
            </div>

            {selectedRateDetails.pricingModel === 'WEIGHT_TIERS' && selectedRateDetails.tiers && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-800">{isAr ? 'جدول شرائح الوزن المعتمد:' : 'Weight Tiers Schedule:'}</div>
                <div className="space-y-1 font-mono text-[11px]">
                  {selectedRateDetails.tiers.map((t, idx) => (
                    <div key={idx} className="flex justify-between p-1.5 bg-white rounded border border-slate-200">
                      <span>{t.fromKg} - {t.toKg} KG</span>
                      <span className="font-bold">{t.ratePerKg} {selectedRateDetails.currency} / KG</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'تاريخ بداية السريان:' : 'Effective From:'}</span>
                <span className="font-mono font-bold">{new Date(selectedRateDetails.effectiveFrom).toLocaleDateString(isAr ? 'ar-JO' : 'en-US')}</span>
              </div>
              {selectedRateDetails.effectiveUntil && (
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'تاريخ نهاية السريان:' : 'Effective Until:'}</span>
                  <span className="font-mono font-bold">{new Date(selectedRateDetails.effectiveUntil).toLocaleDateString(isAr ? 'ar-JO' : 'en-US')}</span>
                </div>
              )}
            </div>

            {selectedRateDetails.reason && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                <span className="font-bold block mb-1">{isAr ? 'سبب الإصدار والتوثيق الرقابي:' : 'Audit Reason:'}</span>
                {selectedRateDetails.reason}
              </div>
            )}

            <div className="text-[11px] text-slate-400">
              {isAr ? 'تم الإنشاء بواسطة:' : 'Created by:'} {selectedRateDetails.createdBy} • {new Date(selectedRateDetails.createdAt).toLocaleString(isAr ? 'ar-JO' : 'en-US')}
            </div>

            {/* Quick Actions from drawer */}
            {hasCreatePerm && (
              <button
                type="button"
                onClick={() => {
                  const rateToUpgrade = selectedRateDetails;
                  setSelectedRateDetails(null);
                  openNewVersionModal(rateToUpgrade);
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isAr ? 'إصدار نسخة سعرية جديدة (New Version)' : 'Issue New Version'}</span>
              </button>
            )}
          </div>
        </DetailsDrawer>
      )}

      {/* 11. Disable Confirmation Dialog */}
      {confirmDisableRate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 max-w-md w-full shadow-xl space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>{isAr ? 'تأكيد تعطيل تعرفة الشحن' : 'Confirm Rate Disablement'}</span>
            </div>

            <p className="text-slate-600">
              {isAr
                ? `هل أنت متأكد من رغبتك في تعطيل التعرفة ${confirmDisableRate.id} (v${confirmDisableRate.version})؟ لن يتم حذف السجل وسيظل محفوظاً للأغراض الرقابية والتاريخية.`
                : `Are you sure you want to disable rate ${confirmDisableRate.id} (v${confirmDisableRate.version})? It will not be deleted and remains in history.`}
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
              {isAr
                ? 'تنبيه: تعطيل هذه التعرفة قد يوقف عمليات التسعير الجديدة لهذا المسار في حال عدم وجود تعرفة فعالة بديلة.'
                : 'Notice: Disabling this rate may block new pricing operations for this route if no other active rate exists.'}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isAr ? 'سبب التعطيل:' : 'Reason for Disablement:'}
              </label>
              <input
                type="text"
                value={disableReason}
                onChange={(e) => setDisableReason(e.target.value)}
                placeholder={isAr ? 'مثال: إيقاف الخدمة مؤقتاً لمراجعة الأسعار...' : 'e.g. Temporary suspension for rate review...'}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDisableRate(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDisable}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                {isAr ? 'تأكيد التعطيل' : 'Disable Rate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
