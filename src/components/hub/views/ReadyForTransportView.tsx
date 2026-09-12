import React, { useState, useMemo } from 'react';
import {
  CheckCheck,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  Split,
  FileSpreadsheet,
  Lock,
  Scale,
  Calendar,
  Layers,
  Sparkles,
  Plane,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Scan,
  ShieldCheck,
  Building2,
  X,
} from 'lucide-react';
import { Hub, Locale, Shipment, Trip, EmployeeNavSection } from '../../../types';
import { HUBS_DATA } from '../../../lib/constants';
import { StatusBadge } from '../../common/StatusBadge';
import { QRScannerModal } from '../../common/QRScannerModal';
import { ReadyShipmentDrawer } from '../transport/ReadyShipmentDrawer';

export interface ReadyForTransportViewProps {
  currentHub: Hub;
  shipments: Shipment[];
  trips?: Trip[];
  locale: Locale;
  onNavigate: (section: EmployeeNavSection, extra?: { shipmentId?: string }) => void;
}

export const ReadyForTransportView: React.FC<ReadyForTransportViewProps> = ({
  currentHub,
  shipments,
  trips = [],
  locale,
  onNavigate,
}) => {
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [weightRangeFilter, setWeightRangeFilter] = useState<'ALL' | 'LIGHT' | 'MEDIUM' | 'HEAVY'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'URGENT' | 'NORMAL'>('ALL');
  const [matchFilter, setMatchFilter] = useState<'ALL' | 'HAS_TRIPS' | 'NO_TRIPS'>('ALL');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Scanner & Drawer Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState<string | null>(null);

  // 1. STRICT RULE: Filter strictly by INSPECTED_SEALED for Current Hub
  // Forbid PENDING_DROPOFF, WEIGHT_ADJUSTMENT_PENDING, ASSIGNED_TO_TRIP
  const readyParcels = useMemo(() => {
    return shipments.filter((s) => {
      // Must belong to current origin hub
      const isCurrentHub = s.originHubId === currentHub.id || !s.originHubId;
      if (!isCurrentHub) return false;

      // Strict status check: must be INSPECTED_SEALED (or normalized INSPECTED_AND_SEALED)
      const isInspectedSealed =
        s.currentStatus === 'INSPECTED_SEALED' || s.currentStatus === 'INSPECTED_AND_SEALED';

      // Forbid un-inspected or already assigned statuses
      const isExcludedStatus =
        s.currentStatus === 'PENDING_DROPOFF' ||
        s.currentStatus === 'PENDING_HUB_DROPOFF' ||
        s.currentStatus === 'WEIGHT_ADJUSTMENT_PENDING' ||
        s.currentStatus === 'WEIGHT_DISCREPANCY_PENDING' ||
        s.currentStatus === 'ASSIGNED_TO_TRIP' ||
        s.currentStatus === 'ASSIGNED_TO_TRAVELER';

      return isInspectedSealed && !isExcludedStatus;
    });
  }, [shipments, currentHub.id]);

  // Helper: Find destination hub info
  const getDestinationDisplay = (destHubId: string) => {
    const hub = HUBS_DATA.find((h) => h.id === destHubId);
    if (!hub) return destHubId;
    return isAr ? `${hub.cityAr} (${hub.code})` : `${hub.cityEn} (${hub.code})`;
  };

  // Helper: Calculate compatible trips for each shipment
  const getCompatibleTrips = (shipment: Shipment): Trip[] => {
    const shipmentWeight = shipment.actualWeightKg ?? shipment.estimatedWeightKg ?? 0;
    return trips.filter((t) => {
      const isOriginMatch = t.originHubId === currentHub.id || !t.originHubId;
      const isDestMatch = t.destinationHubId === shipment.destinationHubId;
      const isVerified = t.status === 'VERIFIED' || t.status === 'CONFIRMED';
      const remainingCapacity = Math.max(0, t.availableWeightKg - (t.allocatedWeightKg || 0));
      return isOriginMatch && isDestMatch && isVerified && remainingCapacity >= shipmentWeight;
    });
  };

  // Helper: Human-readable "Ready Since" duration
  const getReadySinceText = (shipment: Shipment) => {
    const timestampStr = shipment.inspectedAt || shipment.readySince || shipment.updatedAt || shipment.createdAt;
    if (!timestampStr) return isAr ? 'حديثاً' : 'Just now';

    const diffMs = Math.max(0, Date.now() - new Date(timestampStr).getTime());
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return isAr ? `${diffDays} يوم` : `${diffDays}d`;
    }
    if (diffHours > 0) {
      return isAr ? `${diffHours} س` : `${diffHours}h`;
    }
    return isAr ? `${diffMins} د` : `${diffMins}m`;
  };

  // 2. SMART SORTING: Priority first (Urgent), then preferred departure date, then oldest waiting
  const sortedParcels = useMemo(() => {
    return [...readyParcels].sort((a, b) => {
      // 1. Priority check
      const aPriority = a.priority === 'URGENT' ? 3 : a.priority === 'HIGH' || a.isPriority ? 2 : 1;
      const bPriority = b.priority === 'URGENT' ? 3 : b.priority === 'HIGH' || b.isPriority ? 2 : 1;
      if (bPriority !== aPriority) {
        return bPriority - aPriority;
      }

      // 2. Preferred departure date (closest first)
      if (a.preferredDepartureDate && b.preferredDepartureDate) {
        const aDate = new Date(a.preferredDepartureDate).getTime();
        const bDate = new Date(b.preferredDepartureDate).getTime();
        if (aDate !== bDate) return aDate - bDate;
      } else if (a.preferredDepartureDate) {
        return -1;
      } else if (b.preferredDepartureDate) {
        return 1;
      }

      // 3. Oldest waiting first (FIFO queue)
      const aReadyTime = new Date(a.inspectedAt || a.readySince || a.updatedAt || a.createdAt).getTime();
      const bReadyTime = new Date(b.inspectedAt || b.readySince || b.updatedAt || b.createdAt).getTime();
      return aReadyTime - bReadyTime;
    });
  }, [readyParcels]);

  // 3. FILTERING (Search & Attributes)
  const filteredParcels = useMemo(() => {
    return sortedParcels.filter((s) => {
      // Search query (tracking, seal, sender, recipient, description)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTracking = (s.trackingNumber || '').toLowerCase().includes(q);
        const matchesSeal = (s.securitySealId || '').toLowerCase().includes(q);
        const matchesSender = (s.senderName || '').toLowerCase().includes(q);
        const matchesRecipient = (s.recipientName || '').toLowerCase().includes(q);
        const matchesItem = (s.itemDescription || '').toLowerCase().includes(q);

        if (!matchesTracking && !matchesSeal && !matchesSender && !matchesRecipient && !matchesItem) {
          return false;
        }
      }

      // Destination filter
      if (destinationFilter !== 'ALL' && s.destinationHubId !== destinationFilter) {
        return false;
      }

      // Service filter
      if (serviceFilter !== 'ALL' && s.serviceType !== serviceFilter) {
        return false;
      }

      // Weight range filter (using actualWeightKg)
      const weight = s.actualWeightKg ?? s.estimatedWeightKg ?? 0;
      if (weightRangeFilter === 'LIGHT' && weight >= 2) return false;
      if (weightRangeFilter === 'MEDIUM' && (weight < 2 || weight > 5)) return false;
      if (weightRangeFilter === 'HEAVY' && weight <= 5) return false;

      // Priority filter
      const isUrgentOrHigh = s.priority === 'URGENT' || s.priority === 'HIGH' || s.isPriority;
      if (priorityFilter === 'URGENT' && !isUrgentOrHigh) return false;
      if (priorityFilter === 'NORMAL' && isUrgentOrHigh) return false;

      // Match availability filter
      const compatibleCount = getCompatibleTrips(s).length;
      if (matchFilter === 'HAS_TRIPS' && compatibleCount === 0) return false;
      if (matchFilter === 'NO_TRIPS' && compatibleCount > 0) return false;

      return true;
    });
  }, [
    sortedParcels,
    searchQuery,
    destinationFilter,
    serviceFilter,
    weightRangeFilter,
    priorityFilter,
    matchFilter,
    trips,
    currentHub.id,
  ]);

  // Summary KPI Calculations (Strictly Operational)
  const totalParcelsCount = readyParcels.length;
  const highPriorityCount = readyParcels.filter(
    (s) => s.priority === 'URGENT' || s.priority === 'HIGH' || s.isPriority
  ).length;
  const totalActualWeightKg = Number(
    readyParcels
      .reduce((sum, s) => sum + (s.actualWeightKg ?? s.estimatedWeightKg ?? 0), 0)
      .toFixed(2)
  );

  // Oldest Waiting time calculation
  const oldestWaitingDuration = useMemo(() => {
    if (readyParcels.length === 0) return isAr ? 'لا يوجد' : 'None';
    let oldestTimestamp = Infinity;
    readyParcels.forEach((s) => {
      const t = new Date(s.inspectedAt || s.readySince || s.updatedAt || s.createdAt).getTime();
      if (t < oldestTimestamp) oldestTimestamp = t;
    });

    const diffHours = Math.floor(Math.max(0, Date.now() - oldestTimestamp) / 3600000);
    if (diffHours >= 24) {
      const days = Math.floor(diffHours / 24);
      return isAr ? `${days} يوم` : `${days} Days`;
    }
    return isAr ? `${diffHours} ساعة` : `${diffHours} Hours`;
  }, [readyParcels, isAr]);

  // Unique destinations for filter dropdown
  const availableDestinations = useMemo(() => {
    const destIds = Array.from(new Set(readyParcels.map((s) => s.destinationHubId)));
    return destIds.map((id) => {
      const hub = HUBS_DATA.find((h) => h.id === id);
      return {
        id,
        label: hub
          ? isAr
            ? `${hub.cityAr} (${hub.code})`
            : `${hub.cityEn} (${hub.code})`
          : id,
      };
    });
  }, [readyParcels, isAr]);

  // Copy Tracking Number helper
  const handleCopy = (trackingNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(trackingNumber);
    setCopiedTrackingId(trackingNumber);
    setTimeout(() => setCopiedTrackingId(null), 2000);
  };

  // Navigating to MATCHING screen with preselected shipment (NO direct assignment here)
  const handleFindCompatibleTrip = (shipmentId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onNavigate('MATCHING', { shipmentId });
  };

  // Handle Scan QR Token
  const handleScanSuccess = (token: string) => {
    setIsScannerOpen(false);
    // If token contains tracking or seal, search for it
    const trimmed = token.trim();
    setSearchQuery(trimmed);

    // If exactly matches one parcel, open its drawer immediately
    const found = readyParcels.find(
      (s) => s.trackingNumber === trimmed || s.securitySealId === trimmed || s.id === trimmed
    );
    if (found) {
      setSelectedShipment(found);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-black">
              <CheckCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">
                {isAr ? 'جاهزة للنقل — Ready for Transport' : 'Ready for Transport'}
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                <span className="flex items-center gap-1 font-bold text-slate-800">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  {isAr ? currentHub.nameAr : currentHub.nameEn} ({currentHub.code})
                </span>
                <span>•</span>
                <span>
                  {isAr ? 'الوزن الجاهز:' : 'Ready Payload:'}{' '}
                  <strong className="text-emerald-700 font-bold">{totalActualWeightKg} KG</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            <Scan className="w-4 h-4 text-indigo-600" />
            <span>{isAr ? 'مسح الباركود' : 'Scan QR'}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('MATCHING')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Split className="w-4 h-4" />
            <span>{isAr ? 'شاشة المطابقة الذكية' : 'Smart Matching'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Cards (Operational Indicators, NOT Analytics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Ready Parcels */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>{isAr ? 'الطرود الجاهزة للنقل' : 'Ready Parcels'}</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">{totalParcelsCount}</span>
            <span className="text-xs font-semibold text-slate-400">{isAr ? 'طرد' : 'pkgs'}</span>
          </div>
          <span className="text-[10px] font-medium text-slate-400 mt-1">
            {isAr ? 'مفحوص ومختوم أمنياً' : 'Inspected & sealed'}
          </span>
        </div>

        {/* Card 2: High Priority */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>{isAr ? 'أولوية عاجلة' : 'High Priority'}</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-rose-600">{highPriorityCount}</span>
            <span className="text-xs font-semibold text-rose-400">{isAr ? 'عاجل' : 'urgent'}</span>
          </div>
          <span className="text-[10px] font-medium text-slate-400 mt-1">
            {isAr ? 'تتطلب أولوية ربط' : 'Requires early matching'}
          </span>
        </div>

        {/* Card 3: Total Weight */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>{isAr ? 'الوزن الإجمالي الجاهز' : 'Total Ready Weight'}</span>
            <Scale className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-700">{totalActualWeightKg}</span>
            <span className="text-xs font-bold text-slate-500">{isAr ? 'كغم' : 'KG'}</span>
          </div>
          <span className="text-[10px] font-medium text-slate-400 mt-1">
            {isAr ? 'الوزن الفعلي المعتمد' : 'Verified actual weight'}
          </span>
        </div>

        {/* Card 4: Oldest Waiting */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>{isAr ? 'أقدم طرد منتظر' : 'Oldest Waiting'}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">{oldestWaitingDuration}</span>
          </div>
          <span className="text-[10px] font-medium text-slate-400 mt-1">
            {isAr ? 'أسبقية الحجز (FIFO)' : 'Priority in queue'}
          </span>
        </div>
      </div>

      {/* 3. Search & Interactive Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Quick Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'بحث برقم التتبع، اسم العميل، أو الختم الأمني...'
                  : 'Search tracking #, customer name, or seal ID...'
              }
              className="w-full ps-9 pe-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="sm:hidden flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{isAr ? 'الفلاتر' : 'Filters'}</span>
            </button>

            <span className="text-xs font-bold text-slate-500">
              {filteredParcels.length} / {readyParcels.length} {isAr ? 'طرد جاهز' : 'ready parcels'}
            </span>
          </div>
        </div>

        {/* Filters Row (Desktop inline) */}
        <div className="hidden sm:grid grid-cols-2 md:grid-cols-5 gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Destination Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">
              {isAr ? 'الوجهة' : 'Destination'}
            </label>
            <select
              value={destinationFilter}
              onChange={(e) => setDestinationFilter(e.target.value)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden"
            >
              <option value="ALL">{isAr ? 'كل الوجهات' : 'All Destinations'}</option>
              {availableDestinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Service Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">
              {isAr ? 'نوع الخدمة' : 'Service Type'}
            </label>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden"
            >
              <option value="ALL">{isAr ? 'كل الخدمات' : 'All Services'}</option>
              <option value="SEND_PARCEL">{isAr ? 'إرسال طرد' : 'Send Parcel'}</option>
              <option value="INTERNATIONAL_BUY">{isAr ? 'شراء دولي' : 'Intl Buy'}</option>
              <option value="SPECIFIC_COUNTRY_BUY">{isAr ? 'شراء محلي' : 'Specific Country'}</option>
            </select>
          </div>

          {/* Weight Range Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">
              {isAr ? 'الوزن الفعلي' : 'Actual Weight'}
            </label>
            <select
              value={weightRangeFilter}
              onChange={(e) => setWeightRangeFilter(e.target.value as any)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden"
            >
              <option value="ALL">{isAr ? 'جميع الأوزان' : 'All Weights'}</option>
              <option value="LIGHT">{isAr ? 'خفيف (< 2 كغم)' : 'Light (< 2 KG)'}</option>
              <option value="MEDIUM">{isAr ? 'متوسط (2 - 5 كغم)' : 'Medium (2 - 5 KG)'}</option>
              <option value="HEAVY">{isAr ? 'ثقيل (> 5 كغم)' : 'Heavy (> 5 KG)'}</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">
              {isAr ? 'درجة الأولوية' : 'Priority'}
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden"
            >
              <option value="ALL">{isAr ? 'كل الدرجات' : 'All Priorities'}</option>
              <option value="URGENT">{isAr ? 'أولوية عاجلة فقط' : 'Urgent Only'}</option>
              <option value="NORMAL">{isAr ? 'أولوية اعتيادية' : 'Standard'}</option>
            </select>
          </div>

          {/* Matching Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">
              {isAr ? 'توافر رحلات' : 'Trip Availability'}
            </label>
            <select
              value={matchFilter}
              onChange={(e) => setMatchFilter(e.target.value as any)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden"
            >
              <option value="ALL">{isAr ? 'كل الحالات' : 'All'}</option>
              <option value="HAS_TRIPS">{isAr ? 'يوجد رحلات متوافقة' : 'Has Trips'}</option>
              <option value="NO_TRIPS">{isAr ? 'بانتظار مسافر' : 'No Trips'}</option>
            </select>
          </div>
        </div>

        {/* Mobile Bottom Sheet Filters */}
        {showMobileFilters && (
          <div
            className="sm:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200"
            onClick={() => setShowMobileFilters(false)}
          >
            <div
              className="bg-white rounded-t-3xl p-5 shadow-2xl border-t border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto" />
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-indigo-600" />
                  <span>{isAr ? 'تصفية الطرود الجاهزة' : 'Filter Ready Parcels'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Destination */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {isAr ? 'الوجهة' : 'Destination'}
                  </label>
                  <select
                    value={destinationFilter}
                    onChange={(e) => setDestinationFilter(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                  >
                    <option value="ALL">{isAr ? 'كل الوجهات' : 'All Destinations'}</option>
                    {availableDestinations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {isAr ? 'نوع الخدمة' : 'Service Type'}
                  </label>
                  <select
                    value={serviceFilter}
                    onChange={(e) => setServiceFilter(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                  >
                    <option value="ALL">{isAr ? 'كل الخدمات' : 'All Services'}</option>
                    <option value="SEND_PARCEL">{isAr ? 'إرسال طرد' : 'Send Parcel'}</option>
                    <option value="INTERNATIONAL_BUY">{isAr ? 'شراء دولي' : 'Intl Buy'}</option>
                    <option value="SPECIFIC_COUNTRY_BUY">{isAr ? 'شراء محلي' : 'Specific Country'}</option>
                  </select>
                </div>

                {/* Weight Range */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {isAr ? 'نطاق الوزن الفعلي' : 'Actual Weight Range'}
                  </label>
                  <select
                    value={weightRangeFilter}
                    onChange={(e) => setWeightRangeFilter(e.target.value as any)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                  >
                    <option value="ALL">{isAr ? 'جميع الأوزان' : 'All Weights'}</option>
                    <option value="LIGHT">{isAr ? 'خفيف (< 2 كغم)' : 'Light (< 2 KG)'}</option>
                    <option value="MEDIUM">{isAr ? 'متوسط (2 - 5 كغم)' : 'Medium (2 - 5 KG)'}</option>
                    <option value="HEAVY">{isAr ? 'ثقيل (> 5 كغم)' : 'Heavy (> 5 KG)'}</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {isAr ? 'درجة الأولوية' : 'Priority'}
                  </label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value as any)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                  >
                    <option value="ALL">{isAr ? 'كل الدرجات' : 'All Priorities'}</option>
                    <option value="URGENT">{isAr ? 'أولوية عاجلة فقط' : 'Urgent Only'}</option>
                    <option value="NORMAL">{isAr ? 'أولوية اعتيادية' : 'Standard'}</option>
                  </select>
                </div>

                {/* Trip Availability */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {isAr ? 'توافر رحلات مسافرين' : 'Trip Availability'}
                  </label>
                  <select
                    value={matchFilter}
                    onChange={(e) => setMatchFilter(e.target.value as any)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                  >
                    <option value="ALL">{isAr ? 'كل الحالات' : 'All'}</option>
                    <option value="HAS_TRIPS">{isAr ? 'يوجد رحلات متوافقة' : 'Has Trips'}</option>
                    <option value="NO_TRIPS">{isAr ? 'بانتظار مسافر' : 'No Trips'}</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDestinationFilter('ALL');
                    setServiceFilter('ALL');
                    setWeightRangeFilter('ALL');
                    setPriorityFilter('ALL');
                    setMatchFilter('ALL');
                  }}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs"
                >
                  {isAr ? 'إعادة ضبط' : 'Reset'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(false)}
                  className="flex-2 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs shadow-xs"
                >
                  {isAr ? `تطبيق (${filteredParcels.length})` : `Apply (${filteredParcels.length})`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredParcels.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckCheck className="w-12 h-12 mx-auto mb-3 opacity-25 text-indigo-600" />
            <div className="text-sm font-bold text-slate-700">
              {isAr ? 'لا توجد طرود مطابقة للفلاتر الحالية' : 'No parcels match current filters'}
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {isAr
                ? 'تأكد من اختيار فلاتر أخرى أو قم بفحص وختم الطرود من محطة التفتيش الأمني والوزن.'
                : 'Clear filters or inspect and seal packages at the inspection station.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-start">{isAr ? 'رقم التتبع' : 'Tracking #'}</th>
                  <th className="p-3 text-start">{isAr ? 'الوجهة' : 'Destination'}</th>
                  <th className="p-3 text-start">{isAr ? 'الوزن الفعلي' : 'Actual Weight'}</th>
                  <th className="p-3 text-start">{isAr ? 'الختم الأمني' : 'Security Seal'}</th>
                  <th className="p-3 text-start">{isAr ? 'الأولوية' : 'Priority'}</th>
                  <th className="p-3 text-start">{isAr ? 'مدة الانتظار' : 'Ready Since'}</th>
                  <th className="p-3 text-start">{isAr ? 'رحلات متوافقة' : 'Compatible Trips'}</th>
                  <th className="p-3 text-center">{isAr ? 'الإجراء التشغيلي' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredParcels.map((s) => {
                  const compTrips = getCompatibleTrips(s);
                  const isUrgent = s.priority === 'URGENT';
                  const isHigh = s.priority === 'HIGH' || s.isPriority;
                  const isHold = s.isHold || s.currentStatus === 'CUSTOMS_HELD';

                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedShipment(s)}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                    >
                      {/* Tracking Number with Copy */}
                      <td className="p-3 font-mono font-black text-indigo-700">
                        <div className="flex items-center gap-1.5">
                          <span>{s.trackingNumber}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopy(s.trackingNumber, e)}
                            title={isAr ? 'نسخ رقم التتبع' : 'Copy Tracking #'}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-opacity"
                          >
                            {copiedTrackingId === s.trackingNumber ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Destination without origin */}
                      <td className="p-3">
                        <span className="font-bold text-slate-900">
                          {getDestinationDisplay(s.destinationHubId)}
                        </span>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          {s.recipientName}
                        </div>
                      </td>

                      {/* Actual Weight (Read-Only) */}
                      <td className="p-3">
                        <div className="flex items-center gap-1 font-black text-slate-900">
                          <Scale className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{(s.actualWeightKg ?? s.estimatedWeightKg ?? 0).toFixed(2)} KG</span>
                        </div>
                      </td>

                      {/* Security Seal with checkmark */}
                      <td className="p-3">
                        <div className="font-mono font-bold text-teal-800 flex items-center gap-1 bg-teal-50/80 px-2 py-1 rounded-md border border-teal-200 w-fit">
                          <Lock className="w-3 h-3 text-teal-600 shrink-0" />
                          <span>{s.securitySealId || '—'}</span>
                          <Check className="w-3 h-3 text-teal-600 shrink-0" />
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="p-3">
                        {isUrgent ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                            {isAr ? 'عاجل جداً' : 'Urgent'}
                          </span>
                        ) : isHigh ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                            {isAr ? 'أولوية' : 'High'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {isAr ? 'اعتيادي' : 'Standard'}
                          </span>
                        )}
                      </td>

                      {/* Ready Since */}
                      <td className="p-3 text-slate-600 font-medium">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{getReadySinceText(s)}</span>
                        </div>
                      </td>

                      {/* Compatible Trips */}
                      <td className="p-3">
                        {compTrips.length > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                            <Plane className="w-3 h-3 text-emerald-600" />
                            <span>
                              {compTrips.length} {isAr ? 'رحلات متاحة' : 'Trips'}
                            </span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {isAr ? 'لا توجد رحلات' : 'No Trips'}
                          </span>
                        )}
                      </td>

                      {/* Action Button: Find Compatible Trip */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          disabled={isHold}
                          onClick={(e) => handleFindCompatibleTrip(s.id, e)}
                          title={isHold ? (isAr ? 'الطرد محظور مؤقتاً' : 'Parcel on hold') : undefined}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition-colors cursor-pointer ${
                            isHold
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                              : 'bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200'
                          }`}
                        >
                          <Split className="w-3.5 h-3.5" />
                          <span>{isAr ? '🔗 البحث عن رحلة مناسبة' : '🔗 Find Match'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Mobile Cards View (Optimized for One-Handed Logistics Operations) */}
      <div className="md:hidden space-y-3">
        {filteredParcels.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
            <CheckCheck className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-600" />
            <div className="text-xs font-bold text-slate-600">
              {isAr ? 'لا توجد طرود مطابقة' : 'No matching parcels'}
            </div>
          </div>
        ) : (
          filteredParcels.map((s) => {
            const compTrips = getCompatibleTrips(s);
            const isHold = s.isHold || s.currentStatus === 'CUSTOMS_HELD';

            return (
              <div
                key={s.id}
                onClick={() => setSelectedShipment(s)}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3 cursor-pointer"
              >
                {/* Top Row: Tracking & Priority */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-sm text-indigo-700">
                      {s.trackingNumber}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleCopy(s.trackingNumber, e)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      {copiedTrackingId === s.trackingNumber ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {s.priority === 'URGENT' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                      {isAr ? 'عاجل' : 'Urgent'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getReadySinceText(s)}
                    </span>
                  )}
                </div>

                {/* Second Row: Destination & Actual Weight */}
                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[10px] block">{isAr ? 'الوجهة' : 'Destination'}</span>
                    <span className="font-bold text-slate-900">
                      {getDestinationDisplay(s.destinationHubId)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] block">{isAr ? 'الوزن الفعلي' : 'Actual Weight'}</span>
                    <span className="font-black text-slate-900 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-indigo-600" />
                      {(s.actualWeightKg ?? s.estimatedWeightKg ?? 0).toFixed(2)} KG
                    </span>
                  </div>
                </div>

                {/* Third Row: Seal & Trip Availability */}
                <div className="flex items-center justify-between text-xs">
                  <div className="font-mono font-bold text-teal-800 flex items-center gap-1 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-[11px]">
                    <Lock className="w-3 h-3 text-teal-600" />
                    <span>{s.securitySealId}</span>
                    <Check className="w-3 h-3 text-teal-600" />
                  </div>

                  <div className="text-[11px] font-bold">
                    {compTrips.length > 0 ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <Plane className="w-3 h-3 text-emerald-600" />
                        {compTrips.length} {isAr ? 'رحلات متاحة' : 'Trips'}
                      </span>
                    ) : (
                      <span className="text-slate-400">{isAr ? 'لا توجد رحلات' : 'No trips'}</span>
                    )}
                  </div>
                </div>

                {/* Sticky Action Button: Find Compatible Trip */}
                <button
                  type="button"
                  disabled={isHold}
                  onClick={(e) => handleFindCompatibleTrip(s.id, e)}
                  className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-colors ${
                    isHold
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                  }`}
                >
                  <Split className="w-4 h-4" />
                  <span>{isAr ? '🔗 البحث عن رحلة مناسبة' : '🔗 Find Compatible Trip'}</span>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* 6. Details Drawer */}
      <ReadyShipmentDrawer
        isOpen={Boolean(selectedShipment)}
        onClose={() => setSelectedShipment(null)}
        shipment={selectedShipment}
        currentHub={currentHub}
        locale={locale}
        compatibleTripsCount={selectedShipment ? getCompatibleTrips(selectedShipment).length : 0}
        onFindMatch={(id) => handleFindCompatibleTrip(id)}
      />

      {/* 7. QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title={isAr ? 'مسح باركود الطرد أو الختم الأمني' : 'Scan Parcel QR or Security Seal'}
        locale={locale}
      />
    </div>
  );
};
