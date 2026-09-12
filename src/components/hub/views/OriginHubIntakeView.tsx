import React, { useState, useMemo } from 'react';
import {
  PackagePlus,
  Search,
  Scan,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Building2,
  User,
  Phone,
  MapPin,
  Tag,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import {
  Hub,
  Locale,
  Shipment,
  EmployeeNavSection,
  User as UserType,
} from '../../../types';
import { StatusBadge } from '../../common/StatusBadge';
import { QRScannerModal } from '../../common/QRScannerModal';
import { ShipmentIntakeDrawer } from '../intake/ShipmentIntakeDrawer';
import {
  ReceiveConfirmModal,
  IntakeIssueModal,
  CounterPaymentModal,
} from '../intake/IntakeModals';

export interface OriginHubIntakeViewProps {
  currentHub: Hub;
  currentUser?: UserType;
  shipments: Shipment[];
  locale: Locale;
  onReceivePackage: (shipmentId: string, notes?: string) => Promise<boolean>;
  onNavigate: (section: EmployeeNavSection) => void;
  onRefreshData: () => void;
}

export const OriginHubIntakeView: React.FC<OriginHubIntakeViewProps> = ({
  currentHub,
  currentUser,
  shipments,
  locale,
  onReceivePackage,
  onNavigate,
  onRefreshData,
}) => {
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WAITING' | 'RECEIVED_TODAY' | 'ATTENTION'>('WAITING');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [destinationFilter, setDestinationFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  // Scanner & Modal States
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drawerSuccessMsg, setDrawerSuccessMsg] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter for origin hub parcels
  const hubShipments = useMemo(() => {
    return shipments.filter((s) => s.originHubId === currentHub.id || !s.originHubId);
  }, [shipments, currentHub.id]);

  // Operational Summary Counters
  const waitingCount = useMemo(() => {
    return hubShipments.filter(
      (s) =>
        s.currentStatus === 'PENDING_DROPOFF' ||
        s.currentStatus === 'PENDING' ||
        s.currentStatus === 'PENDING_HUB_DROPOFF' ||
        s.currentStatus === 'PENDING_REVIEW'
    ).length;
  }, [hubShipments]);

  const expectedTodayCount = useMemo(() => {
    return hubShipments.filter((s) => {
      const isPending =
        s.currentStatus === 'PENDING_DROPOFF' ||
        s.currentStatus === 'PENDING' ||
        s.currentStatus === 'PENDING_HUB_DROPOFF';
      if (!isPending) return false;
      const dateStr = s.preferredDepartureDate || '';
      return (
        dateStr.includes('اليوم') ||
        dateStr.toLowerCase().includes('today') ||
        dateStr.includes(new Date().toISOString().split('T')[0])
      );
    }).length;
  }, [hubShipments]);

  const attentionRequiredCount = useMemo(() => {
    return hubShipments.filter(
      (s) =>
        (s.currentStatus === 'PENDING_DROPOFF' || s.currentStatus === 'PENDING') &&
        (s.paymentStatus === 'PENDING_PAYMENT' ||
          s.securityDeclarations?.containsFragile ||
          Boolean(s.customerNotes))
    ).length;
  }, [hubShipments]);

  const receivedTodayCount = useMemo(() => {
    return hubShipments.filter((s) => {
      const isReceived =
        s.currentStatus === 'RECEIVED_AT_ORIGIN' ||
        s.currentStatus === 'RECEIVED_AT_ORIGIN_HUB' ||
        s.currentStatus === 'INSPECTED_SEALED' ||
        s.currentStatus === 'INSPECTED_AND_SEALED';
      if (!isReceived) return false;
      const recDate = s.receivedAtOriginHubAt || s.updatedAt || '';
      return recDate.startsWith(new Date().toISOString().split('T')[0]);
    }).length;
  }, [hubShipments]);

  // Filtered Parcels Calculation
  const filteredParcels = useMemo(() => {
    return hubShipments.filter((s) => {
      // 1. Status Filter Tab
      if (statusFilter === 'WAITING') {
        const isWaiting =
          s.currentStatus === 'PENDING_DROPOFF' ||
          s.currentStatus === 'PENDING' ||
          s.currentStatus === 'PENDING_HUB_DROPOFF' ||
          s.currentStatus === 'PENDING_REVIEW';
        if (!isWaiting) return false;
      } else if (statusFilter === 'RECEIVED_TODAY') {
        const isReceived =
          s.currentStatus === 'RECEIVED_AT_ORIGIN' ||
          s.currentStatus === 'RECEIVED_AT_ORIGIN_HUB' ||
          s.currentStatus === 'INSPECTED_SEALED' ||
          s.currentStatus === 'INSPECTED_AND_SEALED';
        if (!isReceived) return false;
      } else if (statusFilter === 'ATTENTION') {
        const needsAttention =
          s.paymentStatus === 'PENDING_PAYMENT' ||
          s.securityDeclarations?.containsFragile ||
          Boolean(s.customerNotes);
        if (!needsAttention) return false;
      }

      // 2. Service Filter
      if (serviceFilter !== 'ALL' && s.serviceType !== serviceFilter) {
        return false;
      }

      // 3. Destination Filter
      if (destinationFilter === 'DZ') {
        if (s.destinationHubId !== 'hub-alg' && !s.recipientAddress.includes('الجزائر')) return false;
      } else if (destinationFilter === 'JO') {
        if (s.destinationHubId !== 'hub-amm' && !s.recipientAddress.includes('عمان') && !s.recipientAddress.includes('الأردن')) return false;
      }

      // 4. Date Filter
      if (dateFilter === 'TODAY') {
        const dStr = s.preferredDepartureDate || '';
        if (!dStr.includes('اليوم') && !dStr.toLowerCase().includes('today')) return false;
      } else if (dateFilter === 'TOMORROW') {
        const dStr = s.preferredDepartureDate || '';
        if (!dStr.includes('غداً') && !dStr.toLowerCase().includes('tomorrow')) return false;
      }

      // 5. Payment Filter
      if (paymentFilter === 'PAID') {
        if (s.paymentStatus !== 'FULLY_PAID') return false;
      } else if (paymentFilter === 'REQUIRED') {
        if (s.paymentStatus === 'FULLY_PAID') return false;
      }

      // 6. Search Query (Tracking, Phone, Sender Name, Recipient Name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTracking = (s.trackingNumber || '').toLowerCase().includes(q);
        const matchesSender = (s.senderName || '').toLowerCase().includes(q);
        const matchesPhone = (s.senderPhone || '').toLowerCase().includes(q);
        const matchesRecipient = (s.recipientName || '').toLowerCase().includes(q);
        const matchesDesc = (s.itemDescription || '').toLowerCase().includes(q);
        if (!matchesTracking && !matchesSender && !matchesPhone && !matchesRecipient && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [hubShipments, statusFilter, serviceFilter, destinationFilter, dateFilter, paymentFilter, searchQuery]);

  // Handle Barcode Scan Result
  const handleScanResult = (decodedText: string) => {
    setScannerOpen(false);
    const cleaned = decodedText.trim().toUpperCase();

    // Check across all shipments in workspace (including wrong hub to test guardrail)
    const matched = shipments.find(
      (s) =>
        s.trackingNumber.toUpperCase() === cleaned ||
        s.id.toUpperCase() === cleaned ||
        s.senderPhone.includes(cleaned)
    );

    if (matched) {
      setSelectedShipment(matched);
      setDrawerOpen(true);
      setSearchQuery(matched.trackingNumber);
    } else {
      setSearchQuery(decodedText);
    }
  };

  // Open Drawer for parcel
  const handleOpenShipment = (parcel: Shipment) => {
    setSelectedShipment(parcel);
    setDrawerSuccessMsg('');
    setDrawerOpen(true);
  };

  // Click-to-copy helper
  const handleCopy = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('WAITING');
    setServiceFilter('ALL');
    setDestinationFilter('ALL');
    setDateFilter('ALL');
    setPaymentFilter('ALL');
  };

  // Confirm Intake Execution
  const handleExecuteIntake = async (notes: string) => {
    if (!selectedShipment) return;
    setIsSubmitting(true);

    try {
      const ok = await onReceivePackage(
        selectedShipment.id,
        notes || (isAr ? `تم استلام الطرد في كاونتر فرع ${currentHub.nameAr}` : `Received at ${currentHub.nameEn} counter`)
      );

      if (ok) {
        // Update local selectedShipment state
        const updated: Shipment = {
          ...selectedShipment,
          currentStatus: 'RECEIVED_AT_ORIGIN',
          receivedAtOriginHubAt: new Date().toISOString(),
          receivedByEmployeeId: currentUser?.fullName || currentUser?.id || 'EMP-DESK-01',
          receivedAtHubId: currentHub.id,
        };
        setSelectedShipment(updated);
        setConfirmModalOpen(false);
        setDrawerSuccessMsg(
          isAr
            ? `تم استلام الطرد [${selectedShipment.trackingNumber}] بنجاح ونقله إلى قائمة الفحص والوزن.`
            : `Package [${selectedShipment.trackingNumber}] received and transferred to Inspection & Sealing queue.`
        );
        onRefreshData();
      }
    } catch (err) {
      console.error('Intake confirmation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Incident/Issue
  const handleSaveIssue = (issueType: string, notes: string, photoUrl?: string) => {
    if (!selectedShipment) return;
    const newIssue = {
      id: `ISS-${Date.now().toString().slice(-4)}`,
      issueType,
      notes,
      photoUrl,
      recordedAt: new Date().toISOString(),
      employeeId: currentUser?.id || 'EMP-AMM-101',
    };
    const updated = {
      ...selectedShipment,
      customerNotes: `${selectedShipment.customerNotes ? selectedShipment.customerNotes + ' | ' : ''}[ملاحظة استلام: ${notes}]`,
      intakeIssues: [...(selectedShipment.intakeIssues || []), newIssue],
    };
    setSelectedShipment(updated);
  };

  // Record Counter Payment
  const handlePaymentSuccess = (method: string) => {
    if (!selectedShipment) return;
    const updated: Shipment = {
      ...selectedShipment,
      paymentStatus: 'FULLY_PAID',
      paymentMethod: method as any,
    };
    setSelectedShipment(updated);
    onRefreshData();
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header with Hub & Active Employee Info */}
      <header className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <PackagePlus className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <span>{isAr ? 'استقبال الطرود' : 'Shipment Intake'}</span>
                <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  DESK INTAKE
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? 'البحث عن طلبات العملاء واستلام الطرود المسلّمة إلى هذا الفرع.'
                  : 'Search customer orders and record incoming physical parcel intake at this branch.'}
              </p>
            </div>
          </div>
        </div>

        {/* Opposite side: Branch identity & Employee status */}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 self-start md:self-auto">
          <div className="w-9 h-9 rounded-lg bg-amber-100/70 text-amber-800 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-xs leading-tight">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">
                {isAr ? currentHub.nameAr : currentHub.nameEn}
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isAr ? 'مفتوح' : 'OPEN'}</span>
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
              <span>{isAr ? currentHub.countryNameAr : currentHub.countryNameEn} ({currentHub.code})</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-700 font-medium">
                {currentUser?.fullName || (isAr ? 'موظف الكاونتر' : 'Desk Agent')}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Quick Intake Search Bar & Actions */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-center">
          {/* Large Search Field */}
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'ابحث برقم التتبع (TH-...)، أو رقم الهاتف، أو اسم العميل...'
                  : 'Search by tracking number (TH-...), phone, or customer name...'
              }
              className="w-full ps-10 pe-9 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Prominent QR / Barcode Scan Button */}
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="w-full sm:w-auto px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Scan className="w-4 h-4" />
            <span>{isAr ? 'مسح QR / Barcode' : 'Scan QR / Barcode'}</span>
          </button>
        </div>

        {/* Quick Action Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer text-[11px]"
            >
              <Scan className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAr ? 'مسح طرد سريع' : 'Quick Scan'}</span>
            </button>
            <button
              type="button"
              onClick={onRefreshData}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer text-[11px]"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAr ? 'تحديث القائمة' : 'Refresh List'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('WAITING');
                setDateFilter(dateFilter === 'TODAY' ? 'ALL' : 'TODAY');
              }}
              className={`px-3 py-1.5 font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer text-[11px] ${
                dateFilter === 'TODAY'
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isAr ? 'استلامات اليوم' : 'Today Drop-offs'}</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500">
            {isAr ? 'إجمالي المعروض:' : 'Showing:'} <span className="font-bold text-slate-900">{filteredParcels.length}</span> {isAr ? 'طرد' : 'parcels'}
          </div>
        </div>
      </div>

      {/* 3. Operational Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Waiting Drop-off */}
        <div
          onClick={() => setStatusFilter('WAITING')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
            statusFilter === 'WAITING'
              ? 'border-amber-500 ring-2 ring-amber-500/20'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600">
              {isAr ? 'بانتظار التسليم' : 'Awaiting Drop-off'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <PackagePlus className="w-4 h-4 text-amber-700" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{waitingCount}</div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {isAr ? 'مسجلة بانتظار وصول العميل' : 'Registered orders at counter'}
          </p>
        </div>

        {/* Card 2: Expected Today */}
        <div
          onClick={() => {
            setStatusFilter('WAITING');
            setDateFilter('TODAY');
          }}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
            dateFilter === 'TODAY'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600">
              {isAr ? 'متوقع اليوم' : 'Expected Today'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
              <Clock className="w-4 h-4 text-indigo-700" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-950">{expectedTodayCount}</div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {isAr ? 'مجدولة للاستلام خلال ساعات العمل' : 'Scheduled for today intake'}
          </p>
        </div>

        {/* Card 3: Needs Attention */}
        <div
          onClick={() => setStatusFilter('ATTENTION')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
            statusFilter === 'ATTENTION'
              ? 'border-rose-500 ring-2 ring-rose-500/20'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600">
              {isAr ? 'تحتاج انتباه' : 'Needs Action'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-rose-700" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-950">{attentionRequiredCount}</div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {isAr ? 'مطلوب تحصيل دفع أو بضائع هشة' : 'Pending payment or fragile'}
          </p>
        </div>

        {/* Card 4: Received Today */}
        <div
          onClick={() => setStatusFilter('RECEIVED_TODAY')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
            statusFilter === 'RECEIVED_TODAY'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600">
              {isAr ? 'تم استلامها اليوم' : 'Received Today'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-950">{receivedTodayCount}</div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {isAr ? 'تم توثيقها ونقلها للفحص والوزن' : 'Transferred to scale queue'}
          </p>
        </div>
      </div>

      {/* 4. Comprehensive Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        {/* Status Tab Row */}
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isAr ? 'كل الطرود' : 'All Parcels'}
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('WAITING')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer ${
              statusFilter === 'WAITING'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isAr ? 'بانتظار التسليم' : 'Awaiting Drop-off'} ({waitingCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('RECEIVED_TODAY')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer ${
              statusFilter === 'RECEIVED_TODAY'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isAr ? 'مستلمة اليوم' : 'Received Today'} ({receivedTodayCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ATTENTION')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer ${
              statusFilter === 'ATTENTION'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isAr ? 'تحتاج إجراء' : 'Needs Action'} ({attentionRequiredCount})
          </button>
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 text-xs">
          {/* Service Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">
              {isAr ? 'نوع الخدمة' : 'Service Type'}
            </label>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden"
            >
              <option value="ALL">{isAr ? 'جميع الخدمات' : 'All Services'}</option>
              <option value="SEND_PARCEL">{isAr ? 'طرد شخصي (Personal)' : 'Personal Parcel'}</option>
              <option value="INTERNATIONAL_BUY">{isAr ? 'شراء دولي (Intl Buy)' : 'International Buy'}</option>
              <option value="SPECIFIC_COUNTRY_BUY">{isAr ? 'شراء محلي (Country Buy)' : 'Country Buy'}</option>
            </select>
          </div>

          {/* Destination Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">
              {isAr ? 'بلد الوجهة' : 'Destination'}
            </label>
            <select
              value={destinationFilter}
              onChange={(e) => setDestinationFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden"
            >
              <option value="ALL">{isAr ? 'كل الوجهات' : 'All Destinations'}</option>
              <option value="DZ">{isAr ? 'الجزائر (Algeria - ALG)' : 'Algeria (ALG)'}</option>
              <option value="JO">{isAr ? 'الأردن (Jordan - AMM)' : 'Jordan (AMM)'}</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">
              {isAr ? 'الموعد المجدول' : 'Drop-off Date'}
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden"
            >
              <option value="ALL">{isAr ? 'كل المواعيد' : 'All Dates'}</option>
              <option value="TODAY">{isAr ? 'اليوم' : 'Today'}</option>
              <option value="TOMORROW">{isAr ? 'غداً' : 'Tomorrow'}</option>
            </select>
          </div>

          {/* Payment Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">
              {isAr ? 'حالة السداد' : 'Payment Status'}
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden"
            >
              <option value="ALL">{isAr ? 'كل حالات الدفع' : 'All Payments'}</option>
              <option value="PAID">{isAr ? 'مدفوع بالكامل (Paid)' : 'Paid'}</option>
              <option value="REQUIRED">{isAr ? 'مطلوب تحصيل (Unpaid)' : 'Payment Required'}</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          <div className="flex items-end col-span-2 sm:col-span-4 lg:col-span-1">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAr ? 'إعادة ضبط' : 'Reset Filters'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Desktop Intake Table (Visible on md & larger) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th className="py-3 px-4 text-start">{isAr ? 'رقم التتبع' : 'Tracking'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'العميل (المرسل)' : 'Customer'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'الخدمة' : 'Service'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'الوجهة' : 'Destination'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'الوزن المعلن' : 'Declared Wt'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'الموعد المتوقع' : 'Expected'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'الدفع' : 'Payment'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="py-3 px-4 text-center">{isAr ? 'الإجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParcels.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <PackagePlus className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                    <div className="text-sm font-bold text-slate-700">
                      {isAr ? 'لا توجد طرود مطابقة لمعايير البحث' : 'No matching parcels found'}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {searchQuery
                        ? (isAr
                            ? 'تأكد من كتابة رقم التتبع أو رقم هاتف العميل بدقة، أو قم بمسح الباركود.'
                            : 'Check your tracking number or phone query, or scan barcode.')
                        : (isAr
                            ? 'لا توجد شحنات مسجلة لهذا الفرع حالياً وفق الفلاتر المحددة.'
                            : 'No shipments waiting for intake according to current filters.')}
                    </p>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-3 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        {isAr ? 'مسح البحث' : 'Clear Search'}
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredParcels.map((parcel) => {
                  const isPaid = parcel.paymentStatus === 'FULLY_PAID';
                  const isWaiting =
                    parcel.currentStatus === 'PENDING_DROPOFF' ||
                    parcel.currentStatus === 'PENDING' ||
                    parcel.currentStatus === 'PENDING_HUB_DROPOFF';

                  return (
                    <tr
                      key={parcel.id}
                      onClick={() => handleOpenShipment(parcel)}
                      className="hover:bg-amber-50/40 transition-colors cursor-pointer group"
                    >
                      {/* Tracking with One-Click Copy */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono font-black text-slate-900">
                          <span>{parcel.trackingNumber}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopy(parcel.id, parcel.trackingNumber, e)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors opacity-60 group-hover:opacity-100 cursor-pointer"
                            title={isAr ? 'نسخ التتبع' : 'Copy'}
                          >
                            {copiedId === parcel.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <span>{parcel.senderName}</span>
                          {parcel.senderKycStatus === 'VERIFIED' && (
                            <ShieldCheck className="w-3 h-3 text-emerald-600" title="KYC Verified" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{parcel.senderPhone}</div>
                      </td>

                      {/* Service Type */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          {parcel.serviceType === 'SEND_PARCEL'
                            ? (isAr ? 'طرد شخصي' : 'Personal Parcel')
                            : parcel.serviceType === 'INTERNATIONAL_BUY'
                            ? (isAr ? 'شراء دولي' : 'Intl Buy')
                            : (isAr ? 'شراء محلي' : 'Country Buy')}
                        </span>
                      </td>

                      {/* Destination */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {parcel.destinationHubId === 'hub-alg'
                            ? (isAr ? 'الجزائر العاصمة' : 'Algiers')
                            : (isAr ? 'عمان' : 'Amman')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {parcel.destinationHubId === 'hub-alg' ? 'Algeria (DZA)' : 'Jordan (JOR)'}
                        </div>
                      </td>

                      {/* Declared Weight */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-amber-800">{parcel.estimatedWeightKg} كغم</span>
                        <span className="text-[9px] text-slate-400 block">{isAr ? 'معلن' : 'Declared'}</span>
                      </td>

                      {/* Expected Drop-off */}
                      <td className="py-3 px-4">
                        <span className="text-slate-700 font-medium">
                          {parcel.preferredDepartureDate || (isAr ? 'اليوم' : 'Today')}
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isPaid ? (isAr ? 'مدفوع' : 'PAID') : (isAr ? 'مطلوب الدفع' : 'REQUIRED')}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <StatusBadge status={parcel.currentStatus} locale={locale} />
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenShipment(parcel);
                          }}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isAr ? 'فتح' : 'Open'}</span>
                          <ArrowIcon className="w-3 h-3" />
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

      {/* 6. Mobile Card List (Visible on mobile < md) */}
      <div className="md:hidden space-y-3">
        {filteredParcels.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-200">
            <PackagePlus className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
            <div className="text-xs font-bold text-slate-700">
              {isAr ? 'لا توجد طرود مطابقة لمعايير البحث' : 'No matching parcels'}
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2.5 px-3 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs"
              >
                {isAr ? 'مسح البحث' : 'Clear'}
              </button>
            )}
          </div>
        ) : (
          filteredParcels.map((parcel) => {
            const isPaid = parcel.paymentStatus === 'FULLY_PAID';

            return (
              <div
                key={parcel.id}
                onClick={() => handleOpenShipment(parcel)}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3 active:bg-amber-50/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {parcel.trackingNumber}
                  </span>
                  <StatusBadge status={parcel.currentStatus} locale={locale} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'المرسل:' : 'Sender:'}</span>
                    <span className="font-bold text-slate-800">{parcel.senderName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'الوجهة:' : 'Destination:'}</span>
                    <span className="font-bold text-slate-800">
                      {parcel.destinationHubId === 'hub-alg' ? 'الجزائر (ALG)' : 'عمان (AMM)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'الوزن المعلن:' : 'Declared Wt:'}</span>
                    <span className="font-bold text-amber-800">{parcel.estimatedWeightKg} كغم</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{isAr ? 'حالة الدفع:' : 'Payment:'}</span>
                    <span className={`font-bold ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {isPaid ? (isAr ? 'مدفوع' : 'PAID') : (isAr ? 'مطلوب تحصيل' : 'REQUIRED')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full py-2.5 bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>{isAr ? 'فتح واستلام الطرد' : 'Open & Process Intake'}</span>
                  <ArrowIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* 7. Mobile Floating Action Button (FAB) for Barcode Scan */}
      <div className="md:hidden fixed bottom-6 end-6 z-30">
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-xl flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
          aria-label="Scan barcode"
        >
          <Scan className="w-6 h-6" />
        </button>
      </div>

      {/* 8. Slide-over Shipment Intake Drawer */}
      <ShipmentIntakeDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        shipment={selectedShipment}
        currentHub={currentHub}
        currentUser={currentUser}
        locale={locale}
        onReceiveClick={() => setConfirmModalOpen(true)}
        onRecordIssueClick={() => setIssueModalOpen(true)}
        onCollectPaymentClick={() => setPaymentModalOpen(true)}
        onNavigate={onNavigate}
        successMessage={drawerSuccessMsg}
      />

      {/* 9. Receive Confirmation Modal */}
      {selectedShipment && (
        <ReceiveConfirmModal
          isOpen={confirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          onConfirm={handleExecuteIntake}
          shipment={selectedShipment}
          currentHub={currentHub}
          locale={locale}
          isSubmitting={isSubmitting}
        />
      )}

      {/* 10. Intake Issue/Observation Modal */}
      {selectedShipment && (
        <IntakeIssueModal
          isOpen={issueModalOpen}
          onClose={() => setIssueModalOpen(false)}
          onSaveIssue={handleSaveIssue}
          shipment={selectedShipment}
          locale={locale}
        />
      )}

      {/* 11. Counter Payment Collection Modal */}
      {selectedShipment && (
        <CounterPaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
          shipment={selectedShipment}
          locale={locale}
        />
      )}

      {/* 12. Full-Screen QR & Barcode Scanner Modal */}
      {scannerOpen && (
        <QRScannerModal
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScanSuccess={handleScanResult}
          locale={locale}
          title={isAr ? 'مسح باركود الشحنة أو بوليصة الشحن' : 'Scan Shipment Waybill Barcode'}
        />
      )}
    </div>
  );
};
