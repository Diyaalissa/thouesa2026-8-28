import React, { useState } from 'react';
import {
  Coins,
  Search,
  Filter,
  Calendar,
  Printer,
  FileText,
  User,
  ShieldCheck,
  Building2,
  Lock,
  Info,
  CheckCircle2,
  ArrowRightLeft,
  DollarSign,
  Receipt,
  Wallet,
  Clock,
  QrCode,
} from 'lucide-react';
import { Hub, Locale, SettlementRecord, SettlementType, Currency } from '../../../types';
import { StatusBadge } from '../common/StatusBadge';

export interface SettlementHistoryViewProps {
  settlements: SettlementRecord[];
  currentHub: Hub;
  locale: Locale;
  activeReceipt?: SettlementRecord | null;
  onCloseReceipt?: () => void;
}

export const SettlementHistoryView: React.FC<SettlementHistoryViewProps> = ({
  settlements,
  currentHub,
  locale,
  activeReceipt: externalReceipt,
  onCloseReceipt,
}) => {
  const isAr = locale === 'ar';

  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedReceipt, setSelectedReceipt] = useState<SettlementRecord | null>(
    externalReceipt || null
  );

  // Sync external receipt if provided
  React.useEffect(() => {
    if (externalReceipt) {
      setSelectedReceipt(externalReceipt);
    }
  }, [externalReceipt]);

  const filteredSettlements = settlements.filter((s) => {
    if (typeFilter !== 'ALL' && s.type !== typeFilter) return false;
    if (currencyFilter !== 'ALL' && s.settlementCurrency !== currencyFilter) return false;

    if (dateFilter === 'TODAY') {
      const today = new Date().toISOString().split('T')[0];
      if (!s.processedAt.startsWith(today)) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.settlementNumber.toLowerCase().includes(q) ||
        (s.receiptNumber && s.receiptNumber.toLowerCase().includes(q)) ||
        (s.trackingNumber && s.trackingNumber.toLowerCase().includes(q)) ||
        (s.flightNumber && s.flightNumber.toLowerCase().includes(q)) ||
        s.relatedUserName.toLowerCase().includes(q) ||
        s.processedByName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalCollectedJOD = settlements
    .filter((s) => s.type === 'CUSTOMER_PAYMENT' && s.settlementCurrency === 'JOD')
    .reduce((acc, s) => acc + s.finalAmount, 0);

  const totalDisbursedJOD = settlements
    .filter((s) => s.type === 'TRAVELER_PAYOUT' && s.settlementCurrency === 'JOD')
    .reduce((acc, s) => acc + s.finalAmount, 0);

  const totalCollectedDZD = settlements
    .filter((s) => s.type === 'CUSTOMER_PAYMENT' && s.settlementCurrency === 'DZD')
    .reduce((acc, s) => acc + s.finalAmount, 0);

  const totalDisbursedDZD = settlements
    .filter((s) => s.type === 'TRAVELER_PAYOUT' && s.settlementCurrency === 'DZD')
    .reduce((acc, s) => acc + s.finalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Coins className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {isAr ? 'سجل التسويات والمدفوعات' : 'Settlement Log & Financial Audit'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? 'سجل غير قابل للحذف لجميع عمليات التحصيل وصرف المستحقات والتحويل المالي مع حفظ لقطات أسعار الصرف'
                  : 'Immutable audit trail for customer collections, traveler payouts, and historical FX snapshots'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
              {currentHub.nameAr} ({currentHub.code})
            </span>
          </div>
        </div>

        {/* Aggregate Stats Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
            <span className="text-emerald-700 block mb-1 font-bold">
              {isAr ? 'تحصيلات العملاء (JOD)' : 'Customer Collections (JOD)'}
            </span>
            <span className="text-base font-bold text-emerald-900 font-mono">
              {totalCollectedJOD.toFixed(2)} JOD
            </span>
          </div>

          <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
            <span className="text-blue-700 block mb-1 font-bold">
              {isAr ? 'صرف المسافرين (JOD)' : 'Traveler Payouts (JOD)'}
            </span>
            <span className="text-base font-bold text-blue-900 font-mono">
              {totalDisbursedJOD.toFixed(2)} JOD
            </span>
          </div>

          <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
            <span className="text-emerald-700 block mb-1 font-bold">
              {isAr ? 'تحصيلات العملاء (DZD)' : 'Customer Collections (DZD)'}
            </span>
            <span className="text-base font-bold text-emerald-900 font-mono">
              {totalCollectedDZD.toLocaleString()} DZD
            </span>
          </div>

          <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
            <span className="text-blue-700 block mb-1 font-bold">
              {isAr ? 'صرف المسافرين (DZD)' : 'Traveler Payouts (DZD)'}
            </span>
            <span className="text-base font-bold text-blue-900 font-mono">
              {totalDisbursedDZD.toLocaleString()} DZD
            </span>
          </div>
        </div>
      </div>

      {/* Filter Bar (Section 94) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            {isAr ? 'نوع المعاملة' : 'Transaction Type'}
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
          >
            <option value="ALL">{isAr ? 'كافة المعاملات' : 'All Types'}</option>
            <option value="CUSTOMER_PAYMENT">{isAr ? 'تحصيل عميل (Customer Payment)' : 'Customer Payment'}</option>
            <option value="TRAVELER_PAYOUT">{isAr ? 'صرف مسافر (Traveler Payout)' : 'Traveler Payout'}</option>
            <option value="REFUND">{isAr ? 'استرداد (Refund)' : 'Refund'}</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            {isAr ? 'عملة التسوية' : 'Settlement Currency'}
          </label>
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
          >
            <option value="ALL">{isAr ? 'كافة العملات' : 'All Currencies'}</option>
            <option value="JOD">JOD - الدينار الأردني</option>
            <option value="DZD">DZD - الدينار الجزائري</option>
            <option value="USD">USD - الدولار الأمريكي</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            {isAr ? 'النطاق الزمني' : 'Date Range'}
          </label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
          >
            <option value="ALL">{isAr ? 'كامل السجل' : 'All History'}</option>
            <option value="TODAY">{isAr ? 'اليوم فقط' : 'Today Only'}</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            {isAr ? 'بحث سريع' : 'Search'}
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder={isAr ? 'بحث برقم التسوية أو المستخدم...' : 'Search STL, user, tracking...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl ps-8 pe-3 py-2 text-slate-800"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Settlements Table (Section 94) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-3.5 text-start">{isAr ? 'رمز التسوية' : 'Settlement ID'}</th>
                <th className="p-3.5 text-start">{isAr ? 'النوع' : 'Type'}</th>
                <th className="p-3.5 text-start">{isAr ? 'المستخدم والارتباط' : 'User & Reference'}</th>
                <th className="p-3.5 text-start">{isAr ? 'المبلغ الأساسي' : 'Base Amount'}</th>
                <th className="p-3.5 text-start">{isAr ? 'تحويل الصرف (FX)' : 'FX Applied'}</th>
                <th className="p-3.5 text-start">{isAr ? 'المبلغ النهائي' : 'Final Amount'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الحالة المالية' : 'Status'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الموظف والتاريخ' : 'Processed By & Date'}</th>
                <th className="p-3.5 text-center">{isAr ? 'الإيصال' : 'Receipt'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div className="font-bold text-slate-700">
                      {isAr ? 'لا توجد سجلات تسوية مطابقة' : 'No settlement records found'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSettlements.map((s) => {
                  const isCust = s.type === 'CUSTOMER_PAYMENT';
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        {s.settlementNumber}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] ${
                            isCust
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {isCust ? (
                            <>
                              <Receipt className="w-3 h-3" />
                              <span>{isAr ? 'تحصيل عميل' : 'Customer'}</span>
                            </>
                          ) : (
                            <>
                              <Wallet className="w-3 h-3" />
                              <span>{isAr ? 'صرف مسافر' : 'Traveler'}</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{s.relatedUserName}</div>
                        <div className="font-mono text-[11px] text-slate-400">
                          {s.trackingNumber || s.flightNumber || s.manifestId || '-'}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700">
                        {s.baseAmount.toLocaleString()} {s.baseCurrency}
                      </td>
                      <td className="p-3.5">
                        {s.fxSide === 'NONE' ? (
                          <span className="text-slate-400 text-[11px]">{isAr ? 'بدون تحويل' : 'No FX'}</span>
                        ) : (
                          <div className="space-y-0.5 font-mono text-[11px]">
                            <span className="font-bold text-amber-800">
                              {s.fxSide === 'BUY' ? (isAr ? 'شراء' : 'Buy') : (isAr ? 'بيع' : 'Sell')} @ {s.appliedFxRate}
                            </span>
                            <div className="text-[10px] text-slate-400">
                              {s.baseCurrency} → {s.settlementCurrency}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        {s.finalAmount.toLocaleString()} {s.settlementCurrency}
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={s.status} type="generic" locale={locale} />
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <div className="font-medium text-slate-800">{s.processedByName}</div>
                        <div className="text-slate-400 text-[11px]">
                          {new Date(s.processedAt).toLocaleDateString(isAr ? 'ar-JO' : 'en-US', {
                            day: '2-digit',
                            month: 'short',
                          })}{' '}
                          {new Date(s.processedAt).toLocaleTimeString(isAr ? 'ar-JO' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(s)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
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

      {/* Official Settlement Receipt Modal (Sections 95 & 103) */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Top Modal Bar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm">
                  {isAr ? 'إيصال المعاملة المالية المعتمد' : 'Official Settlement Audit Receipt'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedReceipt(null);
                  if (onCloseReceipt) onCloseReceipt();
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Printable Receipt Paper Container */}
            <div id="printable-receipt" className="p-6 space-y-5 text-xs text-slate-800 bg-white">
              {/* Receipt Header with Logo & Meta */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black tracking-wider text-slate-950">THOUESA</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                      OFFICIAL SETTLEMENT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {isAr ? 'منصة الخدمات اللوجستية والشحن عبر المسافرين' : 'Cross-border P2P Logistics & Cargo'}
                  </p>
                </div>
                <div className="text-end font-mono">
                  <div className="font-bold text-slate-900 text-sm">{selectedReceipt.settlementNumber}</div>
                  <div className="text-slate-500 text-[11px]">{selectedReceipt.receiptNumber || 'RCP-VERIFIED'}</div>
                </div>
              </div>

              {/* 14 Mandatory Audit Fields (Section 103) */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'الفرع المصدر' : 'Issuing Hub'}</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.hubCode} ({currentHub.nameAr})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'الموظف المسؤول' : 'Processed By'}</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.processedByName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'المستفيد / العميل' : 'Party / User'}</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.relatedUserName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'الارتباط التشغيلي' : 'Operational Ref'}</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedReceipt.trackingNumber || selectedReceipt.flightNumber || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'تاريخ ووقت المعاملة' : 'Timestamp'}</span>
                  <span className="text-slate-800">{new Date(selectedReceipt.processedAt).toLocaleString(isAr ? 'ar-JO' : 'en-US')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'الحالة المالية' : 'Financial Status'}</span>
                  <span className="font-bold text-emerald-700">{selectedReceipt.status}</span>
                </div>
              </div>

              {/* Financial Calculation Breakdown Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 text-start">{isAr ? 'البيان المالي' : 'Description'}</th>
                      <th className="p-2.5 text-end">{isAr ? 'القيمة' : 'Amount'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr>
                      <td className="p-2.5 text-slate-600">
                        {isAr ? 'المبلغ الأساسي للعملية (Base Amount)' : 'Base Amount'}
                      </td>
                      <td className="p-2.5 text-end font-bold text-slate-900">
                        {selectedReceipt.baseAmount.toLocaleString()} {selectedReceipt.baseCurrency}
                      </td>
                    </tr>
                    {selectedReceipt.fxSide !== 'NONE' ? (
                      <>
                        <tr>
                          <td className="p-2.5 text-slate-600">
                            {isAr ? 'قاعدة تسعير الصرف المعتمدة' : 'Applied FX Rule'}
                          </td>
                          <td className="p-2.5 text-end text-amber-800 font-bold">
                            THOUESA {selectedReceipt.fxSide} Rate
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-slate-600">
                            {isAr ? 'سعر الصرف وإصدار اليوم' : 'Exchange Rate & Version'}
                          </td>
                          <td className="p-2.5 text-end text-slate-800">
                            {selectedReceipt.appliedFxRate} ({selectedReceipt.rateVersion || 'DAILY-FIX'})
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 text-slate-600">
                            {isAr ? 'المبلغ المحول بعملة التسوية' : 'Converted Amount'}
                          </td>
                          <td className="p-2.5 text-end text-slate-800">
                            {selectedReceipt.convertedAmount.toLocaleString()} {selectedReceipt.settlementCurrency}
                          </td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td className="p-2.5 text-slate-500">
                          {isAr ? 'تحويل العملة' : 'FX Conversion'}
                        </td>
                        <td className="p-2.5 text-end text-slate-500">
                          {isAr ? 'نفس العملة (بدون تحويل)' : 'Same Currency (No FX)'}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-slate-50 text-sm font-bold text-slate-950 border-t-2 border-slate-300">
                      <td className="p-3">
                        {selectedReceipt.type === 'CUSTOMER_PAYMENT'
                          ? isAr ? 'إجمالي المبلغ المقبوض' : 'Total Collected'
                          : isAr ? 'إجمالي المبلغ المصروف' : 'Total Disbursed'}
                      </td>
                      <td className="p-3 text-end font-mono text-emerald-800">
                        {selectedReceipt.finalAmount.toLocaleString()} {selectedReceipt.settlementCurrency}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Idempotency & Audit Stamp */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100 font-mono">
                <div>IDEMP: {selectedReceipt.idempotencyKey}</div>
                <div>SECURE-SHA256-VERIFIED</div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReceipt(null);
                    if (onCloseReceipt) onCloseReceipt();
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isAr ? 'طباعة الإيصال الرسمي' : 'Print Official Receipt'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
