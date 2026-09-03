import React, { useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  Filter, 
  Search, 
  Lock, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Info,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { Hub, Locale, PricingModel, ServiceType, ShippingRate, User, WeightTier } from '../../../types';
import { StatusBadge } from '../common/StatusBadge';
import { DetailsDrawer } from '../common/DetailsDrawer';

export interface ShippingRatesViewProps {
  rates: ShippingRate[];
  currentHub: Hub;
  currentUser: User;
  locale: Locale;
  onSaveRate: (newRate: Partial<ShippingRate>) => void;
}

export const ShippingRatesView: React.FC<ShippingRatesViewProps> = ({
  rates,
  currentHub,
  currentUser,
  locale,
  onSaveRate,
}) => {
  const isAr = locale === 'ar';
  const isMasterAdmin = currentUser.role === 'MASTER_ADMIN';

  // Country scope determined by employee's assigned hub
  // Hub countryCode: JOR -> 'JO', DZA -> 'DZ'
  const defaultCountryCode = (currentHub.countryCode === 'JOR' || currentHub.countryCode === 'JO') ? 'JO' : 'DZ';
  const originCountry = defaultCountryCode;

  const [selectedDestination, setSelectedDestination] = useState<string>('ALL');
  const [selectedService, setSelectedService] = useState<string>('ALL');
  const [selectedRateType, setSelectedRateType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Rate Drawer / Modal state
  const [isAddRateOpen, setIsAddRateOpen] = useState(false);
  const [selectedRateDetails, setSelectedRateDetails] = useState<ShippingRate | null>(null);

  // Form State
  const [formDestCountry, setFormDestCountry] = useState<string>(originCountry === 'JO' ? 'DZ' : 'JO');
  const [formRateType, setFormRateType] = useState<'CUSTOMER_SHIPPING' | 'TRAVELER_COMPENSATION'>('CUSTOMER_SHIPPING');
  const [formServiceType, setFormServiceType] = useState<ServiceType>('SEND_PARCEL');
  const [formPricingModel, setFormPricingModel] = useState<PricingModel>('PER_KG');
  const [formCurrency, setFormCurrency] = useState<'JOD' | 'DZD' | 'USD'>(originCountry === 'JO' ? 'JOD' : 'DZD');
  const [formRatePerKg, setFormRatePerKg] = useState<number>(originCountry === 'JO' ? 7.5 : 1800);
  const [formMinCharge, setFormMinCharge] = useState<number>(originCountry === 'JO' ? 5.0 : 1500);
  const [formMinBillableWeight, setFormMinBillableWeight] = useState<number>(0.5);
  const [formEffectiveFrom, setFormEffectiveFrom] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formReason, setFormReason] = useState<string>('');
  
  // Weight Tiers state
  const [weightTiers, setWeightTiers] = useState<WeightTier[]>([
    { fromKg: 0, toKg: 1, ratePerKg: originCountry === 'JO' ? 8.0 : 2000 },
    { fromKg: 1, toKg: 5, ratePerKg: originCountry === 'JO' ? 7.5 : 1800 },
    { fromKg: 5, toKg: 10, ratePerKg: originCountry === 'JO' ? 7.0 : 1600 },
  ]);

  const handleAddTier = () => {
    const lastTier = weightTiers[weightTiers.length - 1];
    const newFrom = lastTier ? lastTier.toKg : 0;
    setWeightTiers([
      ...weightTiers,
      { fromKg: newFrom, toKg: newFrom + 5, ratePerKg: lastTier ? lastTier.ratePerKg : 5 },
    ]);
  };

  const handleRemoveTier = (index: number) => {
    setWeightTiers(weightTiers.filter((_, i) => i !== index));
  };

  const handleUpdateTier = (index: number, field: keyof WeightTier, val: number) => {
    const updated = [...weightTiers];
    updated[index] = { ...updated[index], [field]: val };
    setWeightTiers(updated);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRate({
      originCountry,
      destinationCountry: formDestCountry,
      serviceType: formServiceType,
      rateType: formRateType,
      pricingModel: formPricingModel,
      currency: formCurrency,
      ratePerKg: formRatePerKg,
      minimumCharge: formMinCharge,
      minimumBillableWeightKg: formMinBillableWeight,
      tiers: formPricingModel === 'WEIGHT_TIERS' ? weightTiers : undefined,
      effectiveFrom: new Date(formEffectiveFrom).toISOString(),
      reason: formReason || (isAr ? 'تحديث تعرفة معتمدة' : 'Standard tariff update'),
      status: 'ACTIVE',
    });
    setIsAddRateOpen(false);
  };

  // Filter rates: Employee can view rates originating from their country (or all if admin)
  const filteredRates = rates.filter((r) => {
    if (!isMasterAdmin && r.originCountry !== originCountry) return false;
    if (selectedDestination !== 'ALL' && r.destinationCountry !== selectedDestination) return false;
    if (selectedService !== 'ALL' && r.serviceType !== selectedService) return false;
    if (selectedRateType !== 'ALL' && r.rateType !== selectedRateType) return false;
    if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchRoute = `${r.originCountry} ${r.destinationCountry}`.toLowerCase().includes(q);
      const matchReason = (r.reason || '').toLowerCase().includes(q);
      if (!matchRoute && !matchReason) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Scope Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">
                {isAr ? 'أسعار الشحن الرسمية' : 'Official Shipping Rates'}
              </h1>
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                {isAr ? `نطاق الدولة: ${originCountry === 'JO' ? 'الأردن (Jordan)' : 'الجزائر (Algeria)'}` : `Scope: ${originCountry}`}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {isAr 
                  ? 'صلاحية تسعير المسارات محكومة بنطاق بلد الموظف (المسارات الصادرة فقط).' 
                  : 'Origin country is strictly controlled by employee national scope.'}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddRateOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة تعرفة جديدة' : 'Add New Rate'}</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              {isAr ? 'وجهة الوصول' : 'Destination'}
            </label>
            <select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">{isAr ? 'جميع الوجهات' : 'All Destinations'}</option>
              <option value="DZ">{isAr ? 'الجزائر (Algeria)' : 'Algeria (DZ)'}</option>
              <option value="JO">{isAr ? 'الأردن (Jordan)' : 'Jordan (JO)'}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              {isAr ? 'نوع الخدمة' : 'Service Type'}
            </label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">{isAr ? 'كافة الخدمات' : 'All Services'}</option>
              <option value="SEND_PARCEL">{isAr ? 'طرد شخصي (Personal Parcel)' : 'Personal Parcel'}</option>
              <option value="BUY_FOR_ME">{isAr ? 'اشترِ لي (Buy for Me)' : 'Buy for Me'}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              {isAr ? 'تصنيف التعرفة' : 'Rate Type'}
            </label>
            <select
              value={selectedRateType}
              onChange={(e) => setSelectedRateType(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">{isAr ? 'كافة الأنواع' : 'All Types'}</option>
              <option value="CUSTOMER_SHIPPING">{isAr ? 'سعر العميل (Customer)' : 'Customer Shipping'}</option>
              <option value="TRAVELER_COMPENSATION">{isAr ? 'أرباح المسافر (Traveler)' : 'Traveler Compensation'}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              {isAr ? 'حالة التعرفة' : 'Status'}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">{isAr ? 'الكل' : 'All'}</option>
              <option value="ACTIVE">{isAr ? 'نشطة (Active)' : 'Active'}</option>
              <option value="INACTIVE">{isAr ? 'معطلة (Inactive)' : 'Inactive'}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              {isAr ? 'بحث سريع' : 'Search'}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={isAr ? 'بحث بالمسار أو الملاحظة...' : 'Search by route...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl ps-8 pe-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Rates Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-3.5 text-start">{isAr ? 'المسار (Route)' : 'Route'}</th>
                <th className="p-3.5 text-start">{isAr ? 'النوع' : 'Rate Type'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الخدمة' : 'Service'}</th>
                <th className="p-3.5 text-start">{isAr ? 'نموذج التسعير' : 'Pricing Model'}</th>
                <th className="p-3.5 text-start">{isAr ? 'السعر والعملة' : 'Rate & Currency'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الحد الأدنى' : 'Min Charge / Weight'}</th>
                <th className="p-3.5 text-start">{isAr ? 'ساري من' : 'Effective From'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الإصدار' : 'Version'}</th>
                <th className="p-3.5 text-center">{isAr ? 'التفاصيل' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRates.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div className="font-bold text-slate-700">
                      {isAr ? 'لا توجد تعريفات مطابقة للبحث' : 'No matching rates found'}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {isAr ? 'قم بتعديل الفلاتر أو إضافة تعرفة جديدة للمسار' : 'Adjust filters or add a new rate.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRates.map((r) => {
                  const originLabel = r.originCountry === 'JO' ? (isAr ? 'الأردن' : 'Jordan') : (isAr ? 'الجزائر' : 'Algeria');
                  const destLabel = r.destinationCountry === 'JO' ? (isAr ? 'الأردن' : 'Jordan') : (isAr ? 'الجزائر' : 'Algeria');
                  const isCust = r.rateType === 'CUSTOMER_SHIPPING';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{originLabel}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span>{destLabel}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          {r.originCountry} → {r.destinationCountry}
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
                          {isCust
                            ? (isAr ? 'سعر العميل' : 'Customer Rate')
                            : (isAr ? 'أرباح المسافر' : 'Traveler Comp')}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold text-slate-800">
                          {r.serviceType === 'SEND_PARCEL' 
                            ? (isAr ? 'طرد شخصي' : 'Personal Parcel') 
                            : (isAr ? 'اشترِ لي' : 'Buy for Me')}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {r.pricingModel}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        {r.pricingModel === 'WEIGHT_TIERS' ? (
                          <span className="text-xs text-amber-700">
                            {r.tiers?.length || 3} {isAr ? 'شرائح وزن' : 'Tiers'}
                          </span>
                        ) : (
                          <span>
                            {r.ratePerKg.toLocaleString()} {r.currency} / KG
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-xs text-slate-600">
                        <div>{r.minimumCharge} {r.currency}</div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {r.minimumBillableWeightKg} KG min
                        </span>
                      </td>

                      <td className="p-3.5 text-xs text-slate-600">
                        {new Date(r.effectiveFrom).toLocaleDateString(isAr ? 'ar-JO' : 'en-US')}
                      </td>

                      <td className="p-3.5">
                        <StatusBadge domain="PRICING" status={r.status} locale={locale} size="sm" />
                      </td>

                      <td className="p-3.5">
                        <span className="font-mono text-xs text-slate-500 font-bold">
                          v{r.version}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedRateDetails(r)}
                          className="px-2.5 py-1 text-xs text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors font-bold cursor-pointer"
                        >
                          {isAr ? 'عرض' : 'View'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Rate Drawer/Form (Section 35 & 36) */}
      <DetailsDrawer
        isOpen={isAddRateOpen}
        onClose={() => setIsAddRateOpen(false)}
        title={isAr ? 'إضافة تعرفة شحن جديدة' : 'Add New Shipping Rate'}
        subtitle={isAr ? `بلد المنشأ المقفل: ${originCountry}` : `Locked Origin: ${originCountry}`}
        locale={locale}
        icon={<DollarSign className="w-5 h-5 text-amber-600" />}
      >
        <form onSubmit={handleSaveSubmit} className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">
                {isAr ? 'بلد المنشأ مقفل بناءً على نطاق الموظف:' : 'Origin country is locked by employee scope:'}
              </span>{' '}
              {originCountry === 'JO' ? (isAr ? 'الأردن (Jordan)' : 'Jordan') : (isAr ? 'الجزائر (Algeria)' : 'Algeria')}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'بلد المنشأ (Locked)' : 'Origin Country'}
              </label>
              <input
                type="text"
                disabled
                value={originCountry === 'JO' ? (isAr ? 'الأردن (JO)' : 'Jordan (JO)') : (isAr ? 'الجزائر (DZ)' : 'Algeria (DZ)')}
                className="w-full text-xs bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-slate-600 font-bold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'بلد الوجهة' : 'Destination Country'}
              </label>
              <select
                value={formDestCountry}
                onChange={(e) => {
                  setFormDestCountry(e.target.value);
                  setFormCurrency(originCountry === 'JO' ? 'JOD' : 'DZD');
                }}
                className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500"
              >
                {originCountry === 'JO' ? (
                  <option value="DZ">{isAr ? 'الجزائر (Algeria)' : 'Algeria (DZ)'}</option>
                ) : (
                  <option value="JO">{isAr ? 'الأردن (Jordan)' : 'Jordan (JO)'}</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isAr ? 'تصنيف التعرفة (Rate Category)' : 'Rate Category'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormRateType('CUSTOMER_SHIPPING')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  formRateType === 'CUSTOMER_SHIPPING'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {isAr ? 'سعر شحن العميل (Customer)' : 'Customer Shipping'}
              </button>
              <button
                type="button"
                onClick={() => setFormRateType('TRAVELER_COMPENSATION')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  formRateType === 'TRAVELER_COMPENSATION'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {isAr ? 'أرباح المسافر (Traveler)' : 'Traveler Compensation'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isAr
                ? 'مبدأ THOUESA المؤسسي: سعر الشحن للعميل منفصل تماماً عن تعويض المسافر.'
                : 'Core policy: Customer shipping tariff != Traveler compensation.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isAr ? 'نوع الخدمة' : 'Service'}
            </label>
            <select
              value={formServiceType}
              onChange={(e) => setFormServiceType(e.target.value as ServiceType)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500"
            >
              <option value="SEND_PARCEL">{isAr ? 'طرد شخصي (Personal Parcel)' : 'Personal Parcel'}</option>
              <option value="BUY_FOR_ME">{isAr ? 'اشترِ لي (Buy for Me)' : 'Buy for Me'}</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'نموذج التسعير' : 'Pricing Model'}
              </label>
              <select
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'العملة' : 'Currency'}
              </label>
              <select
                value={formCurrency}
                onChange={(e) => setFormCurrency(e.target.value as any)}
                className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 font-mono font-bold"
              >
                <option value="JOD">JOD (دينار أردني)</option>
                <option value="DZD">DZD (دينار جزائري)</option>
                <option value="USD">USD (دولار أمريكي)</option>
              </select>
            </div>
          </div>

          {formPricingModel === 'PER_KG' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'السعر لكل كغم' : 'Rate per KG'}
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={formRatePerKg}
                onChange={(e) => setFormRatePerKg(parseFloat(e.target.value) || 0)}
                className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
          )}

          {formPricingModel === 'WEIGHT_TIERS' && (
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  {isAr ? 'شرائح الوزن والأسعار' : 'Weight Tiers'}
                </span>
                <button
                  type="button"
                  onClick={handleAddTier}
                  className="text-xs font-bold text-amber-700 hover:text-amber-800"
                >
                  + {isAr ? 'إضافة شريحة' : 'Add Tier'}
                </button>
              </div>

              {weightTiers.map((tier, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <input
                    type="number"
                    value={tier.fromKg}
                    onChange={(e) => handleUpdateTier(idx, 'fromKg', parseFloat(e.target.value) || 0)}
                    placeholder="From KG"
                    className="w-20 bg-white border border-slate-300 rounded-lg p-1.5 text-center font-mono"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    value={tier.toKg}
                    onChange={(e) => handleUpdateTier(idx, 'toKg', parseFloat(e.target.value) || 0)}
                    placeholder="To KG"
                    className="w-20 bg-white border border-slate-300 rounded-lg p-1.5 text-center font-mono"
                  />
                  <span>KG =</span>
                  <input
                    type="number"
                    value={tier.ratePerKg}
                    onChange={(e) => handleUpdateTier(idx, 'ratePerKg', parseFloat(e.target.value) || 0)}
                    placeholder="Rate"
                    className="flex-1 bg-white border border-slate-300 rounded-lg p-1.5 font-mono font-bold"
                  />
                  {weightTiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'الحد الأدنى للرسوم' : 'Minimum Charge'}
              </label>
              <input
                type="number"
                step="0.5"
                value={formMinCharge}
                onChange={(e) => setFormMinCharge(parseFloat(e.target.value) || 0)}
                className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isAr ? 'الحد الأدنى للوزن القابل للفوترة (كغم)' : 'Min Billable Weight (KG)'}
              </label>
              <input
                type="number"
                step="0.1"
                value={formMinBillableWeight}
                onChange={(e) => setFormMinBillableWeight(parseFloat(e.target.value) || 0.5)}
                className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isAr ? 'تاريخ السريان' : 'Effective From'}
            </label>
            <input
              type="date"
              value={formEffectiveFrom}
              onChange={(e) => setFormEffectiveFrom(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isAr ? 'سبب التحديث / المذكرة الرسمية' : 'Reason / Reference Note'}
            </label>
            <textarea
              rows={2}
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              placeholder={isAr ? 'مثال: تعديل رسوم الوقود الميداني وتكلفة الترانزيت...' : 'e.g. Quarterly review...'}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900"
              required
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddRateOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isAr ? 'حفظ التعرفة الجديدة' : 'Save New Rate'}
            </button>
          </div>
        </form>
      </DetailsDrawer>

      {/* View Rate Details Drawer */}
      {selectedRateDetails && (
        <DetailsDrawer
          isOpen={true}
          onClose={() => setSelectedRateDetails(null)}
          title={isAr ? 'تفاصيل تعرفة الشحن' : 'Shipping Rate Details'}
          subtitle={selectedRateDetails.id}
          locale={locale}
          badge={<StatusBadge domain="PRICING" status={selectedRateDetails.status} locale={locale} size="sm" />}
          icon={<DollarSign className="w-5 h-5 text-amber-600" />}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="font-bold text-slate-800 mb-2">{isAr ? 'ملخص المسار' : 'Route Summary'}</div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>{isAr ? 'المنشأ:' : 'Origin:'} <span className="font-bold text-slate-900">{selectedRateDetails.originCountry}</span></div>
                <div>{isAr ? 'الوجهة:' : 'Destination:'} <span className="font-bold text-slate-900">{selectedRateDetails.destinationCountry}</span></div>
                <div>{isAr ? 'الخدمة:' : 'Service:'} <span className="font-bold text-slate-900">{selectedRateDetails.serviceType}</span></div>
                <div>{isAr ? 'النموذج:' : 'Model:'} <span className="font-mono font-bold text-slate-900">{selectedRateDetails.pricingModel}</span></div>
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'السعر لكل كغم:' : 'Rate per KG:'}</span>
                <span className="font-bold text-slate-900">{selectedRateDetails.ratePerKg} {selectedRateDetails.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'الحد الأدنى للفوترة:' : 'Minimum Charge:'}</span>
                <span className="font-bold text-slate-900">{selectedRateDetails.minimumCharge} {selectedRateDetails.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'أدنى وزن قابل للحساب:' : 'Min Billable Weight:'}</span>
                <span className="font-bold text-slate-900">{selectedRateDetails.minimumBillableWeightKg} KG</span>
              </div>
            </div>

            {selectedRateDetails.reason && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                <span className="font-bold block mb-1">{isAr ? 'سبب الإصدار:' : 'Audit Reason:'}</span>
                {selectedRateDetails.reason}
              </div>
            )}

            <div className="text-[11px] text-slate-400">
              {isAr ? 'تم الإنشاء بواسطة:' : 'Created by:'} {selectedRateDetails.createdBy}
            </div>
          </div>
        </DetailsDrawer>
      )}
    </div>
  );
};
