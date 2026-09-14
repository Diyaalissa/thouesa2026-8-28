import React, { useState, useMemo } from 'react';
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
  Eye,
  X,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Tag,
  Scale,
  Plane,
  Package,
  Layers,
  CheckCircle,
  RotateCcw,
} from 'lucide-react';
import {
  Hub,
  Locale,
  SettlementRecord,
  SettlementType,
  SettlementStatus,
  Currency,
  EmployeeNavSection,
  User as AuthUser,
} from '../../../types';
import { StatusBadge } from '../common/StatusBadge';

export interface SettlementHistoryViewProps {
  settlements: SettlementRecord[];
  currentHub: Hub;
  currentUser?: AuthUser;
  locale: Locale;
  activeReceipt?: SettlementRecord | null;
  onCloseReceipt?: () => void;
  onNavigate?: (section: EmployeeNavSection) => void;
}

export const SettlementHistoryView: React.FC<SettlementHistoryViewProps> = ({
  settlements,
  currentHub,
  currentUser,
  locale,
  activeReceipt: externalReceipt,
  onCloseReceipt,
  onNavigate,
}) => {
  const isAr = locale === 'ar';

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'ALL' | 'CUSTOMER_PAYMENT' | 'TRAVELER_PAYOUT' | 'REFUND'>('ALL');

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');

  // Selected Settlement for Drawer / Receipt Inspection
  const [selectedRecord, setSelectedRecord] = useState<SettlementRecord | null>(externalReceipt || null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Sync external receipt if provided
  React.useEffect(() => {
    if (externalReceipt) {
      setSelectedRecord(externalReceipt);
    }
  }, [externalReceipt]);

  // Date filtering helper
  const isWithinDateRange = (dateStr: string, range: string): boolean => {
    if (range === 'ALL') return true;
    const itemDate = new Date(dateStr);
    const now = new Date();

    if (range === 'TODAY') {
      const todayStr = now.toISOString().split('T')[0];
      return dateStr.startsWith(todayStr);
    }

    if (range === 'LAST_7_DAYS') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return itemDate >= sevenDaysAgo;
    }

    if (range === 'LAST_30_DAYS') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return itemDate >= thirtyDaysAgo;
    }

    return true;
  };

  // Filtered & Sorted Settlements
  const filteredSettlements = useMemo(() => {
    return settlements
      .filter((s) => {
        // Tab filter
        if (activeTab !== 'ALL' && s.type !== activeTab) return false;

        // Status filter
        if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;

        // Currency filter
        if (currencyFilter !== 'ALL' && s.settlementCurrency !== currencyFilter) return false;

        // Date range filter
        if (!isWithinDateRange(s.processedAt, dateFilter)) return false;

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchNumber = (s.settlementNumber || '').toLowerCase().includes(q);
          const matchReceipt = (s.receiptNumber || '').toLowerCase().includes(q);
          const matchTracking = (s.trackingNumber || '').toLowerCase().includes(q);
          const matchShipmentId = (s.shipmentId || '').toLowerCase().includes(q);
          const matchTrip = (s.tripId || '').toLowerCase().includes(q);
          const matchFlight = (s.flightNumber || '').toLowerCase().includes(q);
          const matchManifest = (s.manifestId || '').toLowerCase().includes(q);
          const matchUser = (s.relatedUserName || '').toLowerCase().includes(q);
          const matchUserId = (s.relatedUserId || '').toLowerCase().includes(q);
          const matchStaff = (s.processedByName || '').toLowerCase().includes(q);

          if (
            !matchNumber &&
            !matchReceipt &&
            !matchTracking &&
            !matchShipmentId &&
            !matchTrip &&
            !matchFlight &&
            !matchManifest &&
            !matchUser &&
            !matchUserId &&
            !matchStaff
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.processedAt).getTime();
        const timeB = new Date(b.processedAt).getTime();
        return sortOrder === 'DESC' ? timeB - timeA : timeA - timeB;
      });
  }, [settlements, activeTab, statusFilter, currencyFilter, dateFilter, searchQuery, sortOrder]);

  // Multi-Currency Aware Aggregate Metrics
  const metrics = useMemo(() => {
    const custPayments = settlements.filter((s) => s.type === 'CUSTOMER_PAYMENT');
    const travPayouts = settlements.filter((s) => s.type === 'TRAVELER_PAYOUT');
    const settledTransactions = settlements.filter((s) => s.status === 'PAID' || s.status === 'SETTLED');
    const exceptions = settlements.filter(
      (s) => s.status === 'FAILED' || s.status === 'REVERSED' || s.type === 'REFUND'
    );

    // Customer Payments Breakdown
    const custJOD = custPayments
      .filter((s) => s.settlementCurrency === 'JOD')
      .reduce((acc, s) => acc + s.finalAmount, 0);
    const custDZD = custPayments
      .filter((s) => s.settlementCurrency === 'DZD')
      .reduce((acc, s) => acc + s.finalAmount, 0);

    // Traveler Payouts Breakdown
    const travJOD = travPayouts
      .filter((s) => s.settlementCurrency === 'JOD')
      .reduce((acc, s) => acc + s.finalAmount, 0);
    const travDZD = travPayouts
      .filter((s) => s.settlementCurrency === 'DZD')
      .reduce((acc, s) => acc + s.finalAmount, 0);

    return {
      custCount: custPayments.length,
      custJOD,
      custDZD,
      travCount: travPayouts.length,
      travJOD,
      travDZD,
      settledCount: settledTransactions.length,
      exceptionsCount: exceptions.length,
      totalCount: settlements.length,
    };
  }, [settlements]);

  const handleOpenRecord = (record: SettlementRecord) => {
    setSelectedRecord(record);
  };

  const handleCloseRecord = () => {
    setSelectedRecord(null);
    if (onCloseReceipt) onCloseReceipt();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Coins className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {isAr ? 'سجل التسويات والعمليات المالية' : 'Settlement History & Financial Audit'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Stage 12
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isAr
                  ? 'سجل موحد لجميع عمليات تحصيل العملاء ومستحقات المسافرين والتسويات المالية مع حفظ القيم والأسعار وأسعار الصرف المستخدمة وقت التنفيذ'
                  : 'Unified audit log of customer collections, traveler payouts, and financial settlements with locked rate snapshots and exchange rates applied at execution'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentHub.nameAr} ({currentHub.code})</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isAr ? 'سجل مالي للقراءة فقط' : 'Read-Only Audit Log'}</span>
            </div>
          </div>
        </div>

        {/* 4 Multi-Currency Aware KPI Cards */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Card 1: Customer Payments */}
          <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-emerald-800 font-bold flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" />
                {isAr ? 'تحصيلات العملاء' : 'Customer Payments'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                {metrics.custCount} {isAr ? 'عملية' : 'txns'}
              </span>
            </div>
            <div className="mt-2.5 space-y-1">
              {metrics.custJOD > 0 && (
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-slate-500 text-[11px]">JOD:</span>
                  <span className="text-sm font-bold text-emerald-950">{metrics.custJOD.toFixed(2)} JOD</span>
                </div>
              )}
              {metrics.custDZD > 0 && (
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-slate-500 text-[11px]">DZD:</span>
                  <span className="text-sm font-bold text-emerald-950">{metrics.custDZD.toLocaleString()} DZD</span>
                </div>
              )}
              {metrics.custJOD === 0 && metrics.custDZD === 0 && (
                <div className="text-xs text-slate-400 font-mono">0.00</div>
              )}
            </div>
          </div>

          {/* Card 2: Traveler Payouts */}
          <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-bold flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-blue-600" />
                {isAr ? 'مستحقات المسافرين' : 'Traveler Payouts'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-bold text-[10px]">
                {metrics.travCount} {isAr ? 'عملية' : 'txns'}
              </span>
            </div>
            <div className="mt-2.5 space-y-1">
              {metrics.travDZD > 0 && (
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-slate-500 text-[11px]">DZD:</span>
                  <span className="text-sm font-bold text-blue-950">{metrics.travDZD.toLocaleString()} DZD</span>
                </div>
              )}
              {metrics.travJOD > 0 && (
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-slate-500 text-[11px]">JOD:</span>
                  <span className="text-sm font-bold text-blue-950">{metrics.travJOD.toFixed(2)} JOD</span>
                </div>
              )}
              {metrics.travJOD === 0 && metrics.travDZD === 0 && (
                <div className="text-xs text-slate-400 font-mono">0.00</div>
              )}
            </div>
          </div>

          {/* Card 3: Settled Transactions */}
          <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-indigo-800 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                {isAr ? 'المعاملات المنجزة' : 'Settled Transactions'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 font-bold text-[10px]">
                PAID / SETTLED
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-indigo-950">{metrics.settledCount}</span>
              <span className="text-[11px] text-indigo-700 font-bold">
                {metrics.totalCount > 0
                  ? `${Math.round((metrics.settledCount / metrics.totalCount) * 100)}% ${isAr ? 'من الإجمالي' : 'of total'}`
                  : '100%'}
              </span>
            </div>
          </div>

          {/* Card 4: Failed / Reversed / Refunds */}
          <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-100/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-amber-800 font-bold flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                {isAr ? 'الاستردادات والاستثناءات' : 'Refunds & Reversals'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                AUDIT
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-amber-950">{metrics.exceptionsCount}</span>
              <span className="text-[11px] text-amber-700">
                {isAr ? 'معاملات استرداد / معكوسة' : 'Reversals & refunds'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs & Quick Navigation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {isAr ? 'كافة المعاملات' : 'All Transactions'} ({settlements.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CUSTOMER_PAYMENT')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'CUSTOMER_PAYMENT'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{isAr ? 'تحصيلات العملاء' : 'Customer Payments'}</span> ({metrics.custCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('TRAVELER_PAYOUT')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'TRAVELER_PAYOUT'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-blue-50/60 text-blue-800 hover:bg-blue-100'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>{isAr ? 'مستحقات المسافرين' : 'Traveler Payouts'}</span> ({metrics.travCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('REFUND')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'REFUND'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-purple-50/60 text-purple-800 hover:bg-purple-100'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isAr ? 'الاستردادات' : 'Refunds'}</span> (
            {settlements.filter((s) => s.type === 'REFUND').length})
          </button>
        </div>

        <div className="flex items-center gap-2 pe-1">
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {sortOrder === 'DESC'
                ? isAr ? 'الأحدث أولاً' : 'Newest First'
                : isAr ? 'الأقدم أولاً' : 'Oldest First'}
            </span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            {isAr ? 'بحث سريع' : 'Search Reference / Party'}
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder={isAr ? 'بحث برقم التسوية، التتبع، المسافر...' : 'Search STL, tracking, user, trip...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl ps-8 pe-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            {isAr ? 'الحالة المالية' : 'Financial Status'}
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
          >
            <option value="ALL">{isAr ? 'كافة الحالات' : 'All Statuses'}</option>
            <option value="PAID">{isAr ? 'مسدد (PAID)' : 'PAID'}</option>
            <option value="SETTLED">{isAr ? 'مصروف / منجز (SETTLED)' : 'SETTLED'}</option>
            <option value="PENDING_PAYMENT">{isAr ? 'بانتظار التحصيل (PENDING_PAYMENT)' : 'PENDING_PAYMENT'}</option>
            <option value="PENDING_PAYOUT">{isAr ? 'بانتظار الصرف (PENDING_PAYOUT)' : 'PENDING_PAYOUT'}</option>
            <option value="DRAFT">{isAr ? 'مسودة (DRAFT)' : 'DRAFT'}</option>
            <option value="REVERSED">{isAr ? 'معكوس (REVERSED)' : 'REVERSED'}</option>
            <option value="FAILED">{isAr ? 'فاشل (FAILED)' : 'FAILED'}</option>
            <option value="CANCELLED">{isAr ? 'ملغى (CANCELLED)' : 'CANCELLED'}</option>
          </select>
        </div>

        {/* Settlement Currency Filter */}
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

        {/* Date Range Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            {isAr ? 'النطاق الزمني' : 'Date Range'}
          </label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
          >
            <option value="ALL">{isAr ? 'كامل السجل التاريخي' : 'All History'}</option>
            <option value="TODAY">{isAr ? 'اليوم فقط (Today)' : 'Today Only'}</option>
            <option value="LAST_7_DAYS">{isAr ? 'آخر 7 أيام' : 'Last 7 Days'}</option>
            <option value="LAST_30_DAYS">{isAr ? 'آخر 30 يوماً' : 'Last 30 Days'}</option>
          </select>
        </div>
      </div>

      {/* Desktop Settlements Table */}
      <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-3.5 text-start">{isAr ? 'رقم التسوية' : 'Settlement ID'}</th>
                <th className="p-3.5 text-start">{isAr ? 'نوع العملية' : 'Type'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الطرف والارتباط' : 'Party & Reference'}</th>
                <th className="p-3.5 text-start">{isAr ? 'المبلغ الأساسي' : 'Base Amount'}</th>
                <th className="p-3.5 text-start">{isAr ? 'لقطة الصرف (FX)' : 'FX Snapshot'}</th>
                <th className="p-3.5 text-start">{isAr ? 'المبلغ النهائي' : 'Final Amount'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الموظف والتاريخ' : 'Processed By'}</th>
                <th className="p-3.5 text-center">{isAr ? 'الإجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-500">
                    <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div className="font-bold text-slate-700">
                      {isAr ? 'لا توجد تسويات تطابق البحث الحالي' : 'No settlement records match the criteria'}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {isAr
                        ? 'جرّب إعادة ضبط الفلاتر أو البحث برمز آخر'
                        : 'Try clearing filters or search terms'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSettlements.map((s) => {
                  const isCust = s.type === 'CUSTOMER_PAYMENT';
                  const isTrav = s.type === 'TRAVELER_PAYOUT';
                  const isRef = s.type === 'REFUND';

                  return (
                    <tr
                      key={s.id}
                      onClick={() => handleOpenRecord(s)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      {/* 1. Settlement ID */}
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{s.settlementNumber}</span>
                          <Lock className="w-3 h-3 text-slate-400" title={isAr ? 'سجل مقفل تاريخياً' : 'Locked'} />
                        </div>
                      </td>

                      {/* 2. Type */}
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[11px] ${
                            isCust
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : isTrav
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-purple-50 text-purple-800 border border-purple-200'
                          }`}
                        >
                          {isCust && <Receipt className="w-3 h-3" />}
                          {isTrav && <Wallet className="w-3 h-3" />}
                          {isRef && <RotateCcw className="w-3 h-3" />}
                          <span>
                            {isCust
                              ? isAr ? 'تحصيل عميل' : 'Customer Payment'
                              : isTrav
                              ? isAr ? 'صرف مسافر' : 'Traveler Payout'
                              : isAr ? 'استرداد مالي' : 'Refund'}
                          </span>
                        </span>
                      </td>

                      {/* 3. Party & Reference */}
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{s.relatedUserName}</div>
                        <div className="font-mono text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          {s.trackingNumber && (
                            <span className="flex items-center gap-0.5 text-emerald-700 bg-emerald-50 px-1 rounded">
                              <Package className="w-2.5 h-2.5" />
                              {s.trackingNumber}
                            </span>
                          )}
                          {s.flightNumber && (
                            <span className="flex items-center gap-0.5 text-blue-700 bg-blue-50 px-1 rounded">
                              <Plane className="w-2.5 h-2.5" />
                              {s.flightNumber}
                            </span>
                          )}
                          {s.manifestId && (
                            <span className="text-slate-400">({s.manifestId})</span>
                          )}
                          {s.originalSettlementId && (
                            <span className="text-purple-700 font-bold">
                              ↳ {s.originalSettlementId}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Base Amount */}
                      <td className="p-3.5 font-mono text-slate-800">
                        <div className="font-bold">
                          {s.baseAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                          {s.baseCurrency}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {isCust && s.billingWeightKg ? `${s.billingWeightKg.toFixed(2)} KG` : ''}
                          {isTrav && s.transportedWeightKg ? `${s.transportedWeightKg.toFixed(2)} KG` : ''}
                        </div>
                      </td>

                      {/* 5. FX Snapshot */}
                      <td className="p-3.5">
                        {s.fxSide === 'NONE' ? (
                          <span className="text-slate-400 text-[11px]">
                            {isAr ? 'نفس العملة (1:1)' : 'Same Currency (1:1)'}
                          </span>
                        ) : (
                          <div className="space-y-0.5 font-mono text-[11px]">
                            <span className="font-bold text-amber-800 flex items-center gap-1">
                              <span className="px-1 py-0.2 rounded bg-amber-100 text-[10px]">
                                {s.fxSide}
                              </span>
                              <span>@ {s.appliedFxRate}</span>
                            </span>
                            <div className="text-[10px] text-slate-500">
                              {s.baseCurrency} → {s.settlementCurrency} (v{s.exchangeRateVersion || s.rateVersion || '1'})
                            </div>
                          </div>
                        )}
                      </td>

                      {/* 6. Final Amount */}
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        <div className="text-sm text-slate-950">
                          {s.finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                          <span className="text-xs font-normal text-slate-600">{s.settlementCurrency}</span>
                        </div>
                        {s.paymentMethod && (
                          <div className="text-[10px] font-sans text-slate-400">
                            {s.paymentMethod}
                          </div>
                        )}
                      </td>

                      {/* 7. Status */}
                      <td className="p-3.5">
                        <StatusBadge status={s.status} type="generic" locale={locale} />
                      </td>

                      {/* 8. Processed By */}
                      <td className="p-3.5 text-slate-600">
                        <div className="font-medium text-slate-800 text-[11px]">{s.processedByName}</div>
                        <div className="text-slate-400 text-[10px] font-mono">
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

                      {/* 9. Action */}
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenRecord(s)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isAr ? 'التفاصيل' : 'View'}</span>
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

      {/* Mobile Settlements Cards */}
      <div className="lg:hidden space-y-3">
        {filteredSettlements.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
            <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <div className="font-bold text-slate-700">
              {isAr ? 'لا توجد تسويات تطابق البحث' : 'No settlements found'}
            </div>
          </div>
        ) : (
          filteredSettlements.map((s) => {
            const isCust = s.type === 'CUSTOMER_PAYMENT';
            const isTrav = s.type === 'TRAVELER_PAYOUT';

            return (
              <div
                key={s.id}
                onClick={() => handleOpenRecord(s)}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 cursor-pointer hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        isCust
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : isTrav
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-purple-50 text-purple-800 border border-purple-200'
                      }`}
                    >
                      {isCust
                        ? isAr ? 'تحصيل عميل' : 'Customer Payment'
                        : isTrav
                        ? isAr ? 'صرف مسافر' : 'Traveler Payout'
                        : isAr ? 'استرداد' : 'Refund'}
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-xs">{s.settlementNumber}</span>
                  </div>
                  <StatusBadge status={s.status} type="generic" locale={locale} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">{isAr ? 'الطرف المعني' : 'Party'}</span>
                    <span className="font-bold text-slate-900">{s.relatedUserName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">{isAr ? 'المرجع التشغيلي' : 'Reference'}</span>
                    <span className="font-mono text-slate-800">
                      {s.trackingNumber || s.flightNumber || s.manifestId || '-'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans">
                      {isAr ? 'المبلغ الأساسي' : 'Base Amount'}
                    </span>
                    <span className="text-slate-700">
                      {s.baseAmount.toFixed(2)} {s.baseCurrency}
                    </span>
                  </div>
                  <div className="text-end">
                    <span className="text-slate-400 block text-[10px] font-sans">
                      {isAr ? 'المبلغ النهائي' : 'Final Amount'}
                    </span>
                    <span className="font-bold text-slate-950 text-sm text-emerald-900">
                      {s.finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                      {s.settlementCurrency}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                  <span>{new Date(s.processedAt).toLocaleDateString(isAr ? 'ar-JO' : 'en-US')}</span>
                  <span className="text-amber-800 font-bold flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isAr ? 'عرض التفاصيل' : 'View Details'}</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Structured DetailsDrawer (Deep Inspection Modal) */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Coins className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">
                      {isAr ? 'تفاصيل السجل المالي المعتمد' : 'Verified Settlement Audit Record'}
                    </span>
                    <span className="font-mono text-xs text-amber-400 font-bold">
                      {selectedRecord.settlementNumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isAr
                      ? 'سجل محاسبي مقفل تاريخياً ومحمي ضد أي تعديل أو إعادة احتساب'
                      : 'Immutable locked historical financial snapshot'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseRecord}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 6 Inspection Sections */}
            <div className="p-5 space-y-5 text-xs text-slate-800 max-h-[75vh] overflow-y-auto">
              {/* Section 1: Transaction Summary & Audit Trail */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    {isAr ? '1. ملخص المعاملة والتدقيق' : '1. Transaction Summary & Audit'}
                  </span>
                  <StatusBadge status={selectedRecord.status} type="generic" locale={locale} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'نوع المعاملة' : 'Type'}</span>
                    <span className="font-bold text-slate-900">{selectedRecord.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'الفرع المصدر' : 'Issuing Hub'}</span>
                    <span className="font-bold text-slate-900">
                      {selectedRecord.hubCode} ({selectedRecord.hubId})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'الموظف المسؤول' : 'Processed By'}</span>
                    <span className="font-bold text-slate-900">{selectedRecord.processedByName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'تاريخ ووقت التنفيذ' : 'Timestamp'}</span>
                    <span className="text-slate-800 font-mono">
                      {new Date(selectedRecord.processedAt).toLocaleString(isAr ? 'ar-JO' : 'en-US')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'رقم الإيصال' : 'Receipt No.'}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedRecord.receiptNumber || 'RCP-VERIFIED'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'مفتاح عدم التكرار' : 'Idempotency Key'}</span>
                    <span className="font-mono text-[10px] text-slate-600 truncate block">
                      {selectedRecord.idempotencyKey}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Party & Operational Context */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    {isAr ? '2. الطرف المعني والارتباط التشغيلي' : '2. Party & Operational Context'}
                  </span>
                  {selectedRecord.route && (
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[10px]">
                      {selectedRecord.route}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">
                      {selectedRecord.type === 'CUSTOMER_PAYMENT'
                        ? isAr ? 'العميل / الدافع' : 'Customer'
                        : isAr ? 'المسافر المعتمد' : 'Traveler'}
                    </span>
                    <span className="font-bold text-slate-900">{selectedRecord.relatedUserName}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {selectedRecord.relatedUserId}
                    </span>
                  </div>

                  {selectedRecord.trackingNumber && (
                    <div>
                      <span className="text-slate-400 block">{isAr ? 'رقم التتبع' : 'Tracking Number'}</span>
                      <span className="font-mono font-bold text-emerald-800">
                        {selectedRecord.trackingNumber}
                      </span>
                    </div>
                  )}

                  {selectedRecord.flightNumber && (
                    <div>
                      <span className="text-slate-400 block">{isAr ? 'رقم الرحلة' : 'Flight Number'}</span>
                      <span className="font-mono font-bold text-blue-800">
                        {selectedRecord.flightNumber} ({selectedRecord.tripId})
                      </span>
                    </div>
                  )}

                  {selectedRecord.manifestId && (
                    <div>
                      <span className="text-slate-400 block">{isAr ? 'رقم المانيفست' : 'Manifest ID'}</span>
                      <span className="font-mono font-bold text-slate-800">{selectedRecord.manifestId}</span>
                    </div>
                  )}

                  {selectedRecord.originalSettlementId && (
                    <div className="col-span-2">
                      <span className="text-slate-400 block">{isAr ? 'التسوية الأصلية المرتبطة' : 'Original Settlement'}</span>
                      <span className="font-mono font-bold text-purple-800">
                        {selectedRecord.originalSettlementId}
                      </span>
                      {selectedRecord.refundReason && (
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          {selectedRecord.refundReason}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Pricing Snapshot (LOCKED) */}
              <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/70 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200/70 pb-2">
                  <span className="font-bold text-amber-950 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-amber-700" />
                    {isAr ? '3. لقطة التعرفة المقفلة (Pricing Snapshot)' : '3. Locked Pricing Snapshot'}
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                    <Lock className="w-3 h-3" />
                    <span>LOCKED</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">{isAr ? 'نوع التعرفة' : 'Rate Type'}</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {selectedRecord.rateType || (selectedRecord.type === 'CUSTOMER_PAYMENT' ? 'CUSTOMER_SHIPPING' : 'TRAVELER_COMPENSATION')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">{isAr ? 'رمز وإصدار التعرفة' : 'Rate Card ID & Ver'}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedRecord.shippingRateId || selectedRecord.travelerCompensationRateId || 'RATE-CARD-FIX'} (v
                      {selectedRecord.shippingRateVersion || selectedRecord.travelerCompensationRateVersion || '2'})
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">
                      {selectedRecord.type === 'CUSTOMER_PAYMENT'
                        ? isAr ? 'الوزن المحتسب' : 'Billing Weight'
                        : isAr ? 'الوزن المنقول' : 'Transported Weight'}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {(selectedRecord.billingWeightKg || selectedRecord.transportedWeightKg || 0).toFixed(2)} KG
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">{isAr ? 'سعر التعرفة المطبق' : 'Applied Rate'}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {(selectedRecord.appliedShippingRate || selectedRecord.appliedTravelerRate || 0).toFixed(2)}{' '}
                      {selectedRecord.baseCurrency} / KG
                    </span>
                  </div>
                </div>

                <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/50 flex items-center justify-between font-mono text-xs">
                  <span className="font-sans text-slate-600">
                    {isAr ? 'المبلغ الأساسي الناتج (Base Amount)' : 'Calculated Base Amount'}:
                  </span>
                  <span className="font-bold text-slate-950 text-sm">
                    {selectedRecord.baseAmount.toFixed(2)} {selectedRecord.baseCurrency}
                  </span>
                </div>
              </div>

              {/* Section 4: FX Conversion Snapshot (LOCKED) */}
              <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-200/70 space-y-3">
                <div className="flex items-center justify-between border-b border-blue-200/70 pb-2">
                  <span className="font-bold text-blue-950 flex items-center gap-1.5">
                    <ArrowRightLeft className="w-4 h-4 text-blue-700" />
                    {isAr ? '4. لقطة سعر الصرف المقفلة (FX Snapshot)' : '4. Locked FX Snapshot'}
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[10px]">
                    <Lock className="w-3 h-3" />
                    <span>LOCKED</span>
                  </span>
                </div>

                {selectedRecord.fxSide === 'NONE' ? (
                  <div className="p-3 bg-white/80 rounded-lg text-slate-600 text-center">
                    {isAr
                      ? 'تمت التسوية بنفس عملة التسعير الأساسية — لا يوجد تحويل عملات (FX Side: NONE, Rate: 1.0)'
                      : 'Settled in same currency — No FX conversion applied (FX Side: NONE, Rate: 1.0)'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">{isAr ? 'زوج العملات' : 'FX Pair'}</span>
                        <span className="font-bold text-slate-900 font-mono">
                          {selectedRecord.baseCurrency} / {selectedRecord.settlementCurrency}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block">{isAr ? 'جانب الصرف' : 'FX Side'}</span>
                        <span className="font-mono font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded">
                          {selectedRecord.fxSide}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block">{isAr ? 'سعر الصرف المطبق' : 'Applied FX Rate'}</span>
                        <span className="font-mono font-bold text-slate-900">
                          {selectedRecord.appliedFxRate}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-500 block">{isAr ? 'إصدار سعر الصرف' : 'FX Version'}</span>
                        <span className="font-mono font-bold text-slate-900">
                          {selectedRecord.exchangeRateVersion || selectedRecord.rateVersion || 'v4'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white/80 p-2.5 rounded-lg border border-blue-200/50 flex items-center justify-between font-mono text-xs">
                      <span className="font-sans text-slate-600">
                        {isAr ? 'المبلغ المحول (Converted Amount)' : 'Converted Amount'}:
                      </span>
                      <span className="font-bold text-blue-950 text-sm">
                        {selectedRecord.convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                        {selectedRecord.settlementCurrency}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 5: Final Financial Breakdown Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 text-start">{isAr ? 'البيان المالي' : 'Item'}</th>
                      <th className="p-2.5 text-end">{isAr ? 'المبلغ' : 'Amount'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr>
                      <td className="p-2.5 text-slate-600 font-sans">
                        {isAr ? 'المبلغ الأساسي (Base Amount)' : 'Base Amount'}
                      </td>
                      <td className="p-2.5 text-end font-bold text-slate-900">
                        {selectedRecord.baseAmount.toFixed(2)} {selectedRecord.baseCurrency}
                      </td>
                    </tr>
                    {selectedRecord.fxSide !== 'NONE' && (
                      <tr>
                        <td className="p-2.5 text-slate-600 font-sans">
                          {isAr ? 'المبلغ المحول بعد تطبيق الصرف' : 'Converted Amount'}
                        </td>
                        <td className="p-2.5 text-end text-slate-900">
                          {selectedRecord.convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                          {selectedRecord.settlementCurrency}
                        </td>
                      </tr>
                    )}
                    {selectedRecord.fees > 0 && (
                      <tr>
                        <td className="p-2.5 text-slate-600 font-sans">{isAr ? 'رسوم ومصاريف' : 'Fees'}</td>
                        <td className="p-2.5 text-end text-slate-900">
                          {selectedRecord.fees.toFixed(2)} {selectedRecord.settlementCurrency}
                        </td>
                      </tr>
                    )}
                    {selectedRecord.adjustments !== 0 && (
                      <tr>
                        <td className="p-2.5 text-slate-600 font-sans">{isAr ? 'تسويات وتعديلات' : 'Adjustments'}</td>
                        <td className="p-2.5 text-end text-slate-900">
                          {selectedRecord.adjustments.toFixed(2)} {selectedRecord.settlementCurrency}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-slate-50 text-sm font-bold text-slate-950 border-t-2 border-slate-300">
                      <td className="p-3 font-sans">
                        {selectedRecord.type === 'CUSTOMER_PAYMENT'
                          ? isAr ? 'المبلغ النهائي المقبوض (Final Collected)' : 'Final Amount Collected'
                          : isAr ? 'المبلغ النهائي المصروف (Final Payout)' : 'Final Amount Disbursed'}
                      </td>
                      <td className="p-3 text-end font-mono text-emerald-900 text-base">
                        {selectedRecord.finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                        {selectedRecord.settlementCurrency}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Notes if available */}
              {selectedRecord.notes && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block mb-1">{isAr ? 'ملاحظات المعاملة' : 'Notes'}:</span>
                  <p>{selectedRecord.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>IMMUTABLE AUDIT TRAIL</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isAr ? 'طباعة الإيصال' : 'Print Receipt'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseRecord}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Printable Settlement Receipt Modal */}
      {showPrintModal && selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm">
                  {isAr ? 'إيصال المعاملة المالية المعتمد' : 'Official Settlement Audit Receipt'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div id="printable-receipt" className="p-6 space-y-5 text-xs text-slate-800 bg-white">
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
                  <div className="font-bold text-slate-900 text-sm">{selectedRecord.settlementNumber}</div>
                  <div className="text-slate-500 text-[11px]">{selectedRecord.receiptNumber || 'RCP-VERIFIED'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'الفرع المصدر' : 'Issuing Hub'}</span>
                  <span className="font-bold text-slate-900">{selectedRecord.hubCode} ({currentHub.nameAr})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'الموظف المسؤول' : 'Processed By'}</span>
                  <span className="font-bold text-slate-900">{selectedRecord.processedByName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'المستفيد / العميل' : 'Party / User'}</span>
                  <span className="font-bold text-slate-900">{selectedRecord.relatedUserName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'الارتباط التشغيلي' : 'Operational Ref'}</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedRecord.trackingNumber || selectedRecord.flightNumber || selectedRecord.manifestId || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'تاريخ ووقت المعاملة' : 'Timestamp'}</span>
                  <span className="text-slate-800 font-mono">
                    {new Date(selectedRecord.processedAt).toLocaleString(isAr ? 'ar-JO' : 'en-US')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">{isAr ? 'الحالة المالية' : 'Financial Status'}</span>
                  <span className="font-bold text-emerald-700">{selectedRecord.status}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden font-mono">
                <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex justify-between font-bold text-slate-800">
                  <span>{isAr ? 'المبلغ النهائي' : 'Final Settled Amount'}</span>
                  <span className="text-emerald-900 text-sm">
                    {selectedRecord.finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                    {selectedRecord.settlementCurrency}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100 font-mono">
                <div>IDEMP: {selectedRecord.idempotencyKey}</div>
                <div>SECURE-SHA256-VERIFIED</div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
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
                  <span>{isAr ? 'طباعة' : 'Print'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
