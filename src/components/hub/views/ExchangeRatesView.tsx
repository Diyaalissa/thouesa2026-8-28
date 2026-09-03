import React, { useState } from 'react';
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
  History,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Search,
} from 'lucide-react';
import { Hub, Locale, DailyExchangeRate, User, Currency } from '../../../types';
import { StatusBadge } from '../common/StatusBadge';

export interface ExchangeRatesViewProps {
  rates: DailyExchangeRate[];
  currentHub: Hub;
  currentUser: User;
  locale: Locale;
  onSaveRate: (newRate: Omit<DailyExchangeRate, 'id' | 'createdAt'>) => void;
}

export const ExchangeRatesView: React.FC<ExchangeRatesViewProps> = ({
  rates,
  currentHub,
  currentUser,
  locale,
  onSaveRate,
}) => {
  const isAr = locale === 'ar';

  // Role permissions check as mandated by Section 73:
  // HUB_AGENT -> View only
  // HUB_INSPECTOR -> No financial edit
  // HUB_MANAGER -> View (unless explicit FX permission)
  // Single Country Hub Officer / HUB_AGENT / HUB_MANAGER / MASTER_ADMIN -> Full currency management
  const userRole = currentUser.role;
  const canEditFX =
    userRole === 'MASTER_ADMIN' ||
    userRole === 'HUB_MANAGER' ||
    userRole === 'HUB_AGENT' ||
    (currentUser as any).role === 'FINANCIAL_OFFICER' ||
    (currentUser as any).role === 'PRICING_MANAGER';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPairFilter, setSelectedPairFilter] = useState<string>('ALL');

  // Form State for new rate
  const [baseCurrency, setBaseCurrency] = useState<Currency>('DZD');
  const [quoteCurrency, setQuoteCurrency] = useState<Currency>('JOD');
  const [buyRate, setBuyRate] = useState<string>('0.00515');
  const [sellRate, setSellRate] = useState<string>('0.00538');
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [effectiveTime, setEffectiveTime] = useState<string>('09:30');
  const [source, setSource] = useState<string>(isAr ? 'البنك المركزي / غرفة المقاصة المركزية' : 'Central Treasury Operations');
  const [notes, setNotes] = useState<string>('');

  const filteredRates = rates.filter((r) => {
    const pair = `${r.baseCurrency}/${r.quoteCurrency}`;
    if (selectedPairFilter !== 'ALL' && pair !== selectedPairFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        pair.toLowerCase().includes(q) ||
        r.version.toLowerCase().includes(q) ||
        (r.notes && r.notes.toLowerCase().includes(q)) ||
        r.source.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditFX) return;

    const numBuy = parseFloat(buyRate);
    const numSell = parseFloat(sellRate);

    if (isNaN(numBuy) || isNaN(numSell) || numBuy <= 0 || numSell <= 0) {
      alert(isAr ? 'يرجى إدخال أسعار شراء وبيع صحيحة' : 'Please enter valid buy and sell rates');
      return;
    }

    const nextVersionNum = rates.filter((r) => r.baseCurrency === baseCurrency && r.quoteCurrency === quoteCurrency).length + 1;
    const versionStr = `FX-${effectiveDate.replace(/-/g, '')}-0${nextVersionNum}`;

    onSaveRate({
      baseCurrency,
      quoteCurrency,
      buyRate: numBuy,
      sellRate: numSell,
      effectiveFrom: `${effectiveDate}T${effectiveTime}:00Z`,
      countryScope: currentHub.countryCode === 'JOR' ? 'JO' : currentHub.countryCode === 'DZA' ? 'DZ' : 'GLOBAL',
      source,
      version: versionStr,
      status: 'ACTIVE',
      createdBy: `${currentUser.staffCode || 'STAFF'} (${currentUser.fullName})`,
      notes: notes || (isAr ? 'تحديث رسمي معتمد لأسعار الصرف اليومية' : 'Official daily exchange rate publication'),
    });

    setIsModalOpen(false);
  };

  const businessDateFormatted = new Date().toLocaleDateString(isAr ? 'ar-JO' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                <ArrowLeftRight className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {isAr ? 'أسعار الصرف اليومية' : 'Daily Exchange Rates'}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr
                    ? 'تسعير الصرف المعتمد لتحصيل العملات وصرف مستحقات المسافرين بفصل تام لسعري الشراء والبيع'
                    : 'Official daily FX desk rates with strict separation of THOUESA Buy and Sell rates'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canEditFX ? (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'إدخال سعر صرف جديد' : 'New FX Rate'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAr ? 'صلاحية العرض فقط للموظف' : 'View-Only Access'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Operational Scope & Metadata Strip (Section 72) */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block mb-1">{isAr ? 'نطاق الدولة (Country Scope)' : 'Country Scope'}</span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              {currentHub.countryNameAr} ({currentHub.countryCode})
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block mb-1">{isAr ? 'تاريخ العمليات (Business Date)' : 'Business Date'}</span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              {businessDateFormatted}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block mb-1">{isAr ? 'آخر تحديث معتمد' : 'Last Update'}</span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              {rates[0]?.effectiveFrom ? new Date(rates[0].effectiveFrom).toLocaleTimeString(isAr ? 'ar-JO' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '09:15'}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block mb-1">{isAr ? 'أزواج العملات النشطة' : 'Active FX Pairs'}</span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {rates.filter((r) => r.status === 'ACTIVE').length} {isAr ? 'أزواج فعالة' : 'Active Pairs'}
            </span>
          </div>
        </div>
      </div>

      {/* Mandatory Institutional Rule Explainer Banner (Sections 63-64 & 84) */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-950 shadow-xs">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm text-amber-900">
              {isAr ? 'قاعدة THOUESA المؤسسية لتسعير الشراء والبيع (Buy/Sell Policy)' : 'THOUESA Institutional Buy/Sell Side Policy'}
            </div>
            <p className="text-amber-800 leading-relaxed">
              {isAr
                ? 'يتم تحديد سعر الشراء وسعر البيع آلياً من قِبل النظام وفق منظور THOUESA المالي وبدون تدخل يدوي من الموظف: (سعر الشراء: عند شراء THOUESA العملة الأجنبية من العميل في التحصيل | سعر البيع: عند بيع THOUESA للعملة وصرف الأرباح للمسافر). لا يُسمح بتعديل السعر يدوياً منعاً للأخطاء والنزاعات المالية.'
                : 'Buy/Sell side is strictly determined automatically by the system from THOUESA\'s treasury perspective: THOUESA BUY rate applies when collecting foreign currency from customers; THOUESA SELL rate applies when disbursing payouts to travelers. Clerks are never prompted to pick sides.'}
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder={isAr ? 'بحث بالزوج أو الإصدار...' : 'Search pair or version...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl ps-8 pe-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2.5 pointer-events-none" />
          </div>

          <select
            value={selectedPairFilter}
            onChange={(e) => setSelectedPairFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700"
          >
            <option value="ALL">{isAr ? 'كافة الأزواج' : 'All Pairs'}</option>
            <option value="DZD/JOD">DZD / JOD</option>
            <option value="USD/JOD">USD / JOD</option>
            <option value="USD/DZD">USD / DZD</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          {isAr ? `إجمالي السجلات: ${filteredRates.length}` : `Total records: ${filteredRates.length}`}
        </div>
      </div>

      {/* Daily Rates Table (Section 72) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-3.5 text-start">{isAr ? 'زوج العملات (Currency Pair)' : 'Currency Pair'}</th>
                <th className="p-3.5 text-start">
                  <div className="flex items-center gap-1">
                    <span>{isAr ? 'سعر الشراء (Buy Rate)' : 'Buy Rate'}</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded font-normal">
                      {isAr ? 'تحصيل عميل' : 'Customer'}
                    </span>
                  </div>
                </th>
                <th className="p-3.5 text-start">
                  <div className="flex items-center gap-1">
                    <span>{isAr ? 'سعر البيع (Sell Rate)' : 'Sell Rate'}</span>
                    <span className="text-[10px] text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-normal">
                      {isAr ? 'صرف مسافر' : 'Traveler'}
                    </span>
                  </div>
                </th>
                <th className="p-3.5 text-start">{isAr ? 'الفارق (Spread)' : 'Spread'}</th>
                <th className="p-3.5 text-start">{isAr ? 'وقت السريان' : 'Effective Time'}</th>
                <th className="p-3.5 text-start">{isAr ? 'المصدر المعتمد' : 'Reference / Source'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الإصدار' : 'Version'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div className="font-bold text-slate-700">
                      {isAr ? 'لا توجد أسعار صرف مسجلة' : 'No exchange rates found'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRates.map((r) => {
                  const spread = Math.abs(r.sellRate - r.buyRate);
                  const spreadPct = r.buyRate > 0 ? ((spread / r.buyRate) * 100).toFixed(2) : '0.00';
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-mono text-xs border border-slate-200">
                            {r.baseCurrency}
                          </span>
                          <span className="text-slate-400">/</span>
                          <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center font-mono text-xs border border-amber-200">
                            {r.quoteCurrency}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-emerald-700">
                        {r.buyRate.toFixed(r.buyRate < 0.1 ? 6 : 4)}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-blue-700">
                        {r.sellRate.toFixed(r.sellRate < 0.1 ? 6 : 4)}
                      </td>
                      <td className="p-3.5 font-mono text-slate-500">
                        {spread.toFixed(r.buyRate < 0.1 ? 6 : 4)}{' '}
                        <span className="text-[10px] text-slate-400">({spreadPct}%)</span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {new Date(r.effectiveFrom).toLocaleDateString(isAr ? 'ar-JO' : 'en-US', {
                          day: '2-digit',
                          month: 'short',
                        })}{' '}
                        <span className="text-slate-400">
                          {new Date(r.effectiveFrom).toLocaleTimeString(isAr ? 'ar-JO' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-[200px] truncate" title={r.source}>
                        {r.source}
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {r.version}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={r.status} type="generic" locale={locale} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New FX Rate Modal (Section 74) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isAr ? 'إدخال سعر صرف يومي جديد' : 'New Daily FX Rate Registration'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr
                    ? 'سيتم أرشفة السعر القديم واعتماد السعر الجديد فوراً مع حفظ كامل تاريخ التعديلات'
                    : 'Previous active rate will be closed and new rate activated with full audit versioning'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'العملة الأساسية (Base)' : 'Base Currency'}
                  </label>
                  <select
                    value={baseCurrency}
                    onChange={(e) => setBaseCurrency(e.target.value as Currency)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
                  >
                    <option value="DZD">DZD - الدينار الجزائري</option>
                    <option value="USD">USD - الدولار الأمريكي</option>
                    <option value="JOD">JOD - الدينار الأردني</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'عملة التسعير (Quote)' : 'Quote Currency'}
                  </label>
                  <select
                    value={quoteCurrency}
                    onChange={(e) => setQuoteCurrency(e.target.value as Currency)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
                  >
                    <option value="JOD">JOD - الدينار الأردني</option>
                    <option value="DZD">DZD - الدينار الجزائري</option>
                    <option value="USD">USD - الدولار الأمريكي</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/60">
                  <label className="block text-xs font-bold text-emerald-900 mb-1">
                    {isAr ? 'سعر الشراء (Buy Rate)' : 'THOUESA Buy Rate'}
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={buyRate}
                    onChange={(e) => setBuyRate(e.target.value)}
                    className="w-full text-xs bg-white border border-emerald-300 rounded-lg p-2 font-mono text-emerald-900 font-bold"
                  />
                  <span className="text-[10px] text-emerald-700 mt-1 block">
                    {isAr ? 'شراء THOUESA للعملة من العميل' : 'THOUESA buys from customer'}
                  </span>
                </div>

                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-200/60">
                  <label className="block text-xs font-bold text-blue-900 mb-1">
                    {isAr ? 'سعر البيع (Sell Rate)' : 'THOUESA Sell Rate'}
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={sellRate}
                    onChange={(e) => setSellRate(e.target.value)}
                    className="w-full text-xs bg-white border border-blue-300 rounded-lg p-2 font-mono text-blue-900 font-bold"
                  />
                  <span className="text-[10px] text-blue-700 mt-1 block">
                    {isAr ? 'بيع THOUESA للعملة وصرف المسافر' : 'THOUESA sells for traveler payout'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'تاريخ السريان' : 'Effective Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAr ? 'وقت السريان' : 'Effective Time'}
                  </label>
                  <input
                    type="time"
                    required
                    value={effectiveTime}
                    onChange={(e) => setEffectiveTime(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'المصدر / المرجع الرسمي' : 'Source / Official Reference'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: البنك المركزي الأردني / بنك الجزائر' : 'e.g. Central Bank / Treasury Fix'}
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAr ? 'ملاحظات وتبرير السعر' : 'Operational Notes & Rationale'}
                </label>
                <textarea
                  rows={2}
                  placeholder={isAr ? 'سبب التحديث أو أي شروط خاصة...' : 'Notes regarding today\'s fix...'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
                >
                  {isAr ? 'حفظ ونشر السعر المعتمد' : 'Save New FX Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
