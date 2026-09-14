import React, { useState, useMemo } from 'react';
import {
  BadgeCheck,
  Plane,
  Search,
  Calendar,
  Clock,
  Split,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Bell,
  RefreshCw,
  X,
  ShieldCheck,
  UserCheck,
  Scale,
  Package,
  ChevronRight,
  Info,
  ExternalLink,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock3,
} from 'lucide-react';
import { Hub, Locale, Trip, Shipment, EmployeeNavSection, TripStatus } from '../../../types';

interface VerifiedTripsViewProps {
  currentHub: Hub;
  trips: Trip[];
  shipments?: Shipment[];
  locale: Locale;
  onNavigate: (section: EmployeeNavSection, extra?: { tripId?: string; shipmentId?: string }) => void;
  onRefreshData?: () => void;
}

type FilterTab = 'ALL_ACTIVE' | 'READY_FOR_MATCHING' | 'AWAITING_CONFIRMATION' | 'LINKED' | 'DELAYED';

export const VerifiedTripsView: React.FC<VerifiedTripsViewProps> = ({
  currentHub,
  trips,
  shipments = [],
  locale,
  onNavigate,
  onRefreshData,
}) => {
  const isAr = locale === 'ar';

  // Component state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL_ACTIVE');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isSendingReminder, setIsSendingReminder] = useState<string | null>(null);
  const [reminderToast, setReminderToast] = useState<{ id: string; message: string } | null>(null);
  const [delayModalTrip, setDelayModalTrip] = useState<Trip | null>(null);

  // Active verified trips relevant to this hub
  const activeTrips = useMemo(() => {
    return trips.filter((t) => {
      const isHubMatch = t.originHubId === currentHub.id || !t.originHubId;
      // Allowed statuses in this monitoring view
      const isAllowedStatus =
        t.status === 'VERIFIED' ||
        t.status === 'CONFIRMED' ||
        t.status === 'PACKAGES_LINKED' ||
        t.status === 'DELAYED' ||
        t.status === 'COMPLETED' ||
        t.status === 'CANCELLED';
      return isHubMatch && isAllowedStatus;
    });
  }, [trips, currentHub.id]);

  // Capacity calculation helper function: strictly defined formula
  const getTripCapacity = (trip: Trip) => {
    const availableWeightKg = trip.availableWeightKg || 0;
    const allocatedWeightKg = trip.allocatedWeightKg || 0;
    const remainingWeightKg = Math.max(0, availableWeightKg - allocatedWeightKg);
    const usagePercentage =
      availableWeightKg > 0
        ? Math.min(100, Math.round((allocatedWeightKg / availableWeightKg) * 100))
        : 0;
    const isFull = remainingWeightKg <= 0;

    return {
      availableWeightKg,
      allocatedWeightKg,
      remainingWeightKg,
      usagePercentage,
      isFull,
    };
  };

  // KPI Metrics
  const kpis = useMemo(() => {
    const totalActive = activeTrips.filter(
      (t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
    ).length;

    // READY_FOR_MATCHING: traveler has confirmed AND there is remaining capacity
    const readyForMatching = activeTrips.filter((t) => {
      const { remainingWeightKg } = getTripCapacity(t);
      return t.status === 'CONFIRMED' && remainingWeightKg > 0;
    }).length;

    // AWAITING_CONFIRMATION: verified by hub, but traveler hasn't confirmed yet
    const awaitingConfirmation = activeTrips.filter((t) => t.status === 'VERIFIED').length;

    // ATTENTION / DELAYED
    const attentionDelayed = activeTrips.filter(
      (t) => t.status === 'DELAYED' || t.hasRiskFlag || t.emergencyCancelRequested
    ).length;

    // TOTAL REMAINING CAPACITY across all active trips
    const totalRemainingCapacityKg = activeTrips
      .filter((t) => t.status === 'CONFIRMED' || t.status === 'VERIFIED')
      .reduce((acc, t) => {
        const { remainingWeightKg } = getTripCapacity(t);
        return acc + remainingWeightKg;
      }, 0);

    return {
      totalActive,
      readyForMatching,
      awaitingConfirmation,
      attentionDelayed,
      totalRemainingCapacityKg,
    };
  }, [activeTrips]);

  // Tab Filtering
  const filteredTrips = useMemo(() => {
    return activeTrips.filter((t) => {
      const { remainingWeightKg, isFull } = getTripCapacity(t);

      // Tab filter
      if (activeTab === 'READY_FOR_MATCHING') {
        if (!(t.status === 'CONFIRMED' && remainingWeightKg > 0)) return false;
      } else if (activeTab === 'AWAITING_CONFIRMATION') {
        if (t.status !== 'VERIFIED') return false;
      } else if (activeTab === 'LINKED') {
        if (!(t.status === 'PACKAGES_LINKED' || isFull || (t.allocatedWeightKg || 0) > 0)) {
          return false;
        }
      } else if (activeTab === 'DELAYED') {
        if (t.status !== 'DELAYED') return false;
      }

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (t.travelerName || '').toLowerCase().includes(q) ||
        (t.flightNumber || '').toLowerCase().includes(q) ||
        (t.pnrCode || '').toLowerCase().includes(q) ||
        (t.airline || '').toLowerCase().includes(q) ||
        (t.id || '').toLowerCase().includes(q)
      );
    });
  }, [activeTrips, activeTab, searchQuery]);

  // Departure Time helper: format and calculate time-to-departure
  const formatDeparture = (departureTimeStr: string) => {
    try {
      const depDate = new Date(departureTimeStr);
      const now = new Date();
      const diffMs = depDate.getTime() - now.getTime();
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));

      const formattedDate = depDate.toLocaleDateString(isAr ? 'ar-JO' : 'en-US', {
        day: '2-digit',
        month: 'short',
      });
      const formattedTime = depDate.toLocaleTimeString(isAr ? 'ar-JO' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });

      let countdown = '';
      if (diffMs < 0) {
        countdown = isAr ? 'أقلعت' : 'Departed';
      } else if (diffHours < 24) {
        countdown = isAr ? `خلال ${diffHours} س` : `in ${diffHours}h`;
      } else {
        const days = Math.floor(diffHours / 24);
        const remH = diffHours % 24;
        countdown = isAr ? `خلال ${days} يوم و ${remH} س` : `in ${days}d ${remH}h`;
      }

      return { formattedDate, formattedTime, countdown, isPast: diffMs < 0 };
    } catch {
      return { formattedDate: departureTimeStr, formattedTime: '', countdown: '', isPast: false };
    }
  };

  // Find linked parcels for the selected trip
  const linkedShipments = useMemo(() => {
    if (!selectedTrip) return [];
    return shipments.filter((s) => s.assignedTripId === selectedTrip.id);
  }, [selectedTrip, shipments]);

  // Send reminder handler for VERIFIED trip
  const handleSendReminder = async (trip: Trip, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsSendingReminder(trip.id);
    try {
      const res = await fetch(`/api/trips/${trip.id}/send-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: 'EMP-HUB-01',
          employeeName: 'Amman Operations Agent',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReminderToast({
          id: trip.id,
          message: isAr
            ? `تم إرسال تذكير للمسافر ${trip.travelerName} لتأكيد الرحلة`
            : `Reminder sent to ${trip.travelerName} to confirm trip`,
        });
        setTimeout(() => setReminderToast(null), 4000);
        onRefreshData?.();
      }
    } catch (err) {
      console.error('Failed to send reminder:', err);
    } finally {
      setIsSendingReminder(null);
    }
  };

  // Navigate to matching with selected trip (Strictly NO direct assignment)
  const handleOpenMatching = (trip: Trip, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Clear drawer and route to MATCHING view passing tripId
    setSelectedTrip(null);
    onNavigate('MATCHING', { tripId: trip.id });
  };

  // Navigate to manifest
  const handleOpenManifest = (trip: Trip, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedTrip(null);
    onNavigate('MANIFESTS');
  };

  // Route Code Display
  const getRouteBadge = (trip: Trip) => {
    const origin = trip.originHubId?.includes('AMM') ? 'AMM' : trip.originHubId?.includes('ALG') ? 'ALG' : 'ORIGIN';
    const dest = trip.destinationHubId?.includes('ALG') ? 'ALG' : trip.destinationHubId?.includes('AMM') ? 'AMM' : 'DEST';
    return `${origin} → ${dest}`;
  };

  // Readiness evaluation for a trip
  const evaluateReadiness = (trip: Trip) => {
    const isVerified = trip.status === 'VERIFIED' || trip.status === 'CONFIRMED' || trip.status === 'PACKAGES_LINKED';
    const isTravelerConfirmed = trip.status === 'CONFIRMED' || trip.status === 'PACKAGES_LINKED';
    const { remainingWeightKg, isFull } = getTripCapacity(trip);
    const hasCapacity = remainingWeightKg > 0;
    const dep = formatDeparture(trip.departureTime);
    const isDepartureValid = !dep.isPast;
    const noBlockingIncident = !trip.hasRiskFlag && !trip.emergencyCancelRequested && trip.status !== 'DELAYED';

    const isReadyForMatching = isVerified && isTravelerConfirmed && hasCapacity && isDepartureValid && noBlockingIncident;

    return {
      isVerified,
      isTravelerConfirmed,
      isDepartureValid,
      hasCapacity,
      noBlockingIncident,
      isReadyForMatching,
      isFull,
    };
  };

  // Render Status Badge
  const renderStatusBadge = (status: TripStatus, isFull = false) => {
    if (isFull) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-white shadow-2xs">
          <span>{isAr ? 'ممتلئة بالكامل' : 'FULL'}</span>
        </span>
      );
    }

    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>{isAr ? 'مؤكدة — جاهزة' : 'CONFIRMED'}</span>
          </span>
        );
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200 shadow-2xs">
            <Clock3 className="w-3 h-3 text-sky-600" />
            <span>{isAr ? 'معتمدة (بانتظار التأكيد)' : 'VERIFIED'}</span>
          </span>
        );
      case 'PACKAGES_LINKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-2xs">
            <Package className="w-3 h-3 text-indigo-600" />
            <span>{isAr ? 'مرتبطة بطرود' : 'PACKAGES LINKED'}</span>
          </span>
        );
      case 'DELAYED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>{isAr ? 'متأخرة' : 'DELAYED'}</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            <span>{isAr ? 'مكتملة' : 'COMPLETED'}</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
            <span>{isAr ? 'ملغاة' : 'CANCELLED'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800">
            <span>{status}</span>
          </span>
        );
    }
  };

  // Render Context-Aware Action Button
  const renderContextAction = (trip: Trip, isCompact = false) => {
    const { remainingWeightKg, isFull } = getTripCapacity(trip);

    // If trip is DELAYED: Review Delay
    if (trip.status === 'DELAYED') {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDelayModalTrip(trip);
          }}
          className={`flex items-center justify-center gap-1.5 font-bold rounded-xl transition-all cursor-pointer bg-amber-500 hover:bg-amber-600 text-white shadow-2xs ${
            isCompact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-xs'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{isAr ? 'مراجعة التأخير' : 'Review Delay'}</span>
        </button>
      );
    }

    // If trip is PACKAGES_LINKED or FULL: Open Manifest
    if (trip.status === 'PACKAGES_LINKED' || isFull) {
      return (
        <button
          type="button"
          onClick={(e) => handleOpenManifest(trip, e)}
          className={`flex items-center justify-center gap-1.5 font-bold rounded-xl transition-all cursor-pointer bg-slate-800 hover:bg-slate-900 text-white shadow-2xs ${
            isCompact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-xs'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>{isAr ? 'فتح المانيفست' : 'Open Manifest'}</span>
        </button>
      );
    }

    // If CONFIRMED and has capacity: Open Matching
    if (trip.status === 'CONFIRMED' && remainingWeightKg > 0) {
      return (
        <button
          type="button"
          onClick={(e) => handleOpenMatching(trip, e)}
          className={`flex items-center justify-center gap-1.5 font-bold rounded-xl transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs ${
            isCompact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-xs'
          }`}
        >
          <Split className="w-3.5 h-3.5" />
          <span>{isAr ? 'فتح المطابقة' : 'Open Matching'}</span>
        </button>
      );
    }

    // If VERIFIED: Send Reminder (Traveler has not confirmed yet)
    if (trip.status === 'VERIFIED') {
      const isLoading = isSendingReminder === trip.id;
      return (
        <button
          type="button"
          disabled={isLoading}
          onClick={(e) => handleSendReminder(trip, e)}
          className={`flex items-center justify-center gap-1.5 font-bold rounded-xl transition-all cursor-pointer bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white shadow-2xs ${
            isCompact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-xs'
          }`}
        >
          <Bell className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? (isAr ? 'جارِ الإرسال...' : 'Sending...') : isAr ? 'إرسال تذكير' : 'Send Reminder'}</span>
        </button>
      );
    }

    // Default Fallback
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedTrip(trip);
        }}
        className={`flex items-center justify-center gap-1.5 font-bold rounded-xl transition-all cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 ${
          isCompact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-1.5 text-xs'
        }`}
      >
        <span>{isAr ? 'عرض' : 'View'}</span>
      </button>
    );
  };

  return (
    <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Toast Notification */}
      {reminderToast && (
        <div className="fixed top-5 end-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <Bell className="w-4 h-4 text-sky-400 shrink-0" />
          <p className="text-xs font-bold">{reminderToast.message}</p>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <BadgeCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {isAr ? 'الرحلات المعتمدة — Verified Trips' : 'Verified Trips — Capacity & Matching Monitor'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {currentHub.nameAr || currentHub.name} ({currentHub.code})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? 'مركز المتابعة التشغيلي للرحلات التي اجتازت الفحص؛ مراقبة تأكيد المسافر، سعة الأمتعة المتبقية، والجاهزية للمطابقة.'
                  : 'Operational monitor for approved flights; traveler confirmation status, remaining capacity, and matching readiness.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={() => onRefreshData?.()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            title={isAr ? 'تحديث البيانات' : 'Refresh Data'}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isAr ? 'تحديث' : 'Refresh'}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('MATCHING')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Split className="w-4 h-4" />
            <span>{isAr ? 'لوحة المطابقة الذكية' : 'Smart Matching'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Active Trips */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 flex items-center justify-between">
            <span>{isAr ? 'الرحلات النشطة' : 'Active Trips'}</span>
            <Plane className="w-3.5 h-3.5 text-slate-400" />
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {kpis.totalActive}
          </div>
          <span className="text-[10px] text-slate-400">{isAr ? 'غير ملغاة أو منتهية' : 'Pending completion'}</span>
        </div>

        {/* Card 2: Ready for Matching (CONFIRMED + Capacity > 0) */}
        <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 shadow-2xs">
          <span className="text-xs font-bold text-emerald-800 flex items-center justify-between">
            <span>{isAr ? 'جاهزة للمطابقة' : 'Ready for Matching'}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">
            {kpis.readyForMatching}
          </div>
          <span className="text-[10px] text-emerald-700 font-medium">
            {isAr ? 'مؤكدة + سعة متاحة' : 'Confirmed & Has Space'}
          </span>
        </div>

        {/* Card 3: Awaiting Confirmation (VERIFIED) */}
        <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200 shadow-2xs">
          <span className="text-xs font-bold text-sky-800 flex items-center justify-between">
            <span>{isAr ? 'بانتظار تأكيد المسافر' : 'Awaiting Confirm'}</span>
            <Clock className="w-3.5 h-3.5 text-sky-600" />
          </span>
          <div className="text-xl sm:text-2xl font-black text-sky-900 mt-1">
            {kpis.awaitingConfirmation}
          </div>
          <span className="text-[10px] text-sky-700 font-medium">
            {isAr ? 'معتمدة — تحتاج تأكيد' : 'Verified by Hub'}
          </span>
        </div>

        {/* Card 4: Attention / Delayed */}
        <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 shadow-2xs">
          <span className="text-xs font-bold text-amber-900 flex items-center justify-between">
            <span>{isAr ? 'تنبيهات وتأخير' : 'Delayed / Attention'}</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-950 mt-1">
            {kpis.attentionDelayed}
          </div>
          <span className="text-[10px] text-amber-800 font-medium">
            {isAr ? 'تتطلب تدخلاً تشغيلياً' : 'Action Required'}
          </span>
        </div>

        {/* Card 5: Remaining Capacity */}
        <div className="col-span-2 lg:col-span-1 p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200 shadow-2xs">
          <span className="text-xs font-bold text-indigo-900 flex items-center justify-between">
            <span>{isAr ? 'السعة المتبقية' : 'Remaining Space'}</span>
            <Scale className="w-3.5 h-3.5 text-indigo-600" />
          </span>
          <div className="text-xl sm:text-2xl font-black text-indigo-950 mt-1">
            {kpis.totalRemainingCapacityKg}{' '}
            <span className="text-xs font-bold text-indigo-700">{isAr ? 'كغم' : 'KG'}</span>
          </div>
          <span className="text-[10px] text-indigo-700 font-medium">
            {isAr ? 'صافي الوزن الشاغر للربط' : 'Net capacity for matching'}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
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
                  ? 'بحث بالمسافر، الرحلة، كود PNR، شركة الطيران...'
                  : 'Search traveler, flight, PNR code, airline...'
              }
              className="w-full ps-9 pe-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium self-end sm:self-auto">
            {isAr ? `إجمالي المعروض: ${filteredTrips.length} رحلة` : `Showing: ${filteredTrips.length} trips`}
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('ALL_ACTIVE')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              activeTab === 'ALL_ACTIVE'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {isAr ? 'كافة النشطة' : 'All Active'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('READY_FOR_MATCHING')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'READY_FOR_MATCHING'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'جاهزة للمطابقة' : 'Ready for Matching'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {kpis.readyForMatching}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('AWAITING_CONFIRMATION')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'AWAITING_CONFIRMATION'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'bg-sky-50 hover:bg-sky-100 text-sky-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isAr ? 'بانتظار التأكيد' : 'Awaiting Confirmation'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {kpis.awaitingConfirmation}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LINKED')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'LINKED'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>{isAr ? 'مرتبطة / ممتلئة' : 'Linked / Full'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DELAYED')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'DELAYED'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isAr ? 'المتأخرة' : 'Delayed'}</span>
            {kpis.attentionDelayed > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {kpis.attentionDelayed}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area: Desktop Table & Mobile Cards */}
      {filteredTrips.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <Plane className="w-10 h-10 mx-auto mb-2.5 opacity-30 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-800">
            {isAr ? 'لا توجد رحلات معتمدة تطابق هذا المعيار' : 'No verified trips found matching criteria'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {isAr
              ? 'جرّب تغيير التبويب أو تفريغ شريط البحث لعرض كافة الرحلات المتاحة في الفرع.'
              : 'Try switching tabs or resetting the search filter to browse active flights.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Desktop Table (Hidden on small screens) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 text-start">{isAr ? 'المسافر' : 'Traveler'}</th>
                    <th className="py-3 px-4 text-start">{isAr ? 'الرحلة والشركة' : 'Flight & Airline'}</th>
                    <th className="py-3 px-4 text-start">{isAr ? 'المسار' : 'Route'}</th>
                    <th className="py-3 px-4 text-start">{isAr ? 'الإقلاع' : 'Departure'}</th>
                    <th className="py-3 px-4 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="py-3 px-4 text-start">{isAr ? 'السعة (المتبقي / الكلي)' : 'Capacity (Rem / Tot)'}</th>
                    <th className="py-3 px-4 text-center">{isAr ? 'الطرود والمانيفست' : 'Packages'}</th>
                    <th className="py-3 px-4 text-center">{isAr ? 'الإجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  {filteredTrips.map((trip) => {
                    const capacity = getTripCapacity(trip);
                    const departure = formatDeparture(trip.departureTime);
                    const routeBadge = getRouteBadge(trip);
                    const isSelected = selectedTrip?.id === trip.id;
                    const linkedCount = shipments.filter((s) => s.assignedTripId === trip.id).length;

                    return (
                      <tr
                        key={trip.id}
                        onClick={() => setSelectedTrip(trip)}
                        className={`transition-colors cursor-pointer hover:bg-slate-50/80 ${
                          isSelected ? 'bg-sky-50/60' : ''
                        }`}
                      >
                        {/* Traveler */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200">
                              {trip.travelerName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{trip.travelerName}</div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <span>{trip.travelerPhone || '—'}</span>
                                {trip.kycStatus === 'VERIFIED' && (
                                  <span className="text-emerald-600 font-bold">KYC ✓</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Flight */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="font-mono text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                              {trip.flightNumber}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {trip.airline} • <span className="font-mono">{trip.pnrCode}</span>
                          </div>
                        </td>

                        {/* Route */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-mono font-bold text-[11px]">
                            {routeBadge}
                          </span>
                        </td>

                        {/* Departure */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{departure.formattedDate}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <span>{departure.formattedTime}</span>
                            <span
                              className={`font-semibold ${
                                departure.isPast ? 'text-rose-600' : 'text-emerald-700'
                              }`}
                            >
                              ({departure.countdown})
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {renderStatusBadge(trip.status, capacity.isFull)}
                        </td>

                        {/* Capacity */}
                        <td className="py-3 px-4 min-w-[140px]">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-black text-slate-900">
                              {capacity.remainingWeightKg} <span className="text-[10px] text-slate-500 font-normal">كغم متبقي</span>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {capacity.allocatedWeightKg} / {capacity.availableWeightKg} كغم
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div
                              className={`h-full transition-all duration-300 ${
                                capacity.usagePercentage >= 100
                                  ? 'bg-slate-800'
                                  : capacity.usagePercentage > 70
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-600'
                              }`}
                              style={{ width: `${capacity.usagePercentage}%` }}
                            />
                          </div>
                        </td>

                        {/* Packages & Manifest */}
                        <td className="py-3 px-4 text-center">
                          {linkedCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 text-[10px] font-bold border border-indigo-100">
                              <Package className="w-3 h-3" />
                              <span>{linkedCount} {isAr ? 'طرود' : 'pkgs'}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">—</span>
                          )}
                          {trip.manifestId && (
                            <div className="text-[9px] font-mono text-slate-500 mt-0.5 font-bold">
                              {trip.manifestId}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {renderContextAction(trip, true)}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTrip(trip);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                              title={isAr ? 'فتح التفاصيل' : 'Open Details'}
                            >
                              {isAr ? 'تفاصيل' : 'Open'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards (Visible on mobile/tablet) */}
          <div className="block md:hidden space-y-3">
            {filteredTrips.map((trip) => {
              const capacity = getTripCapacity(trip);
              const departure = formatDeparture(trip.departureTime);
              const routeBadge = getRouteBadge(trip);
              const readiness = evaluateReadiness(trip);
              const linkedCount = shipments.filter((s) => s.assignedTripId === trip.id).length;

              return (
                <div
                  key={trip.id}
                  onClick={() => setSelectedTrip(trip)}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3 active:bg-slate-50 cursor-pointer"
                >
                  {/* Top Readiness & Status Banner */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    {readiness.isReadyForMatching ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        <span>{isAr ? 'جاهزة للمطابقة ✓' : 'READY FOR MATCHING ✓'}</span>
                      </span>
                    ) : trip.status === 'VERIFIED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-900 border border-sky-300">
                        <Clock className="w-3 h-3 text-sky-700" />
                        <span>{isAr ? 'بانتظار تأكيد المسافر ⏳' : 'WAITING CONFIRMATION ⏳'}</span>
                      </span>
                    ) : (
                      renderStatusBadge(trip.status, capacity.isFull)
                    )}

                    <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {routeBadge}
                    </span>
                  </div>

                  {/* Flight & Traveler Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-900 text-sm">{trip.flightNumber}</span>
                        <span className="text-xs text-slate-500 font-medium">({trip.airline})</span>
                      </div>
                      <div className="text-xs font-bold text-slate-700 mt-0.5">
                        {trip.travelerName}{' '}
                        {trip.kycStatus === 'VERIFIED' && (
                          <span className="text-[10px] text-emerald-600 font-bold">KYC ✓</span>
                        )}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="text-xs font-bold text-slate-900">{departure.formattedDate}</div>
                      <div className="text-[10px] text-slate-500">{departure.countdown}</div>
                    </div>
                  </div>

                  {/* Capacity Progress Bar */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{isAr ? 'السعة الشاغرة:' : 'Remaining:'}</span>
                      <span className="font-black text-slate-900">
                        {capacity.remainingWeightKg} <span className="text-[10px] font-normal text-slate-500">من {capacity.availableWeightKg} كغم</span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          capacity.usagePercentage >= 100
                            ? 'bg-slate-800'
                            : capacity.usagePercentage > 70
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${capacity.usagePercentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{isAr ? `محجوز: ${capacity.allocatedWeightKg} كغم` : `Allocated: ${capacity.allocatedWeightKg} kg`}</span>
                      <span>{isAr ? `الطرود: ${linkedCount}` : `Pkgs: ${linkedCount}`}</span>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTrip(trip);
                      }}
                      className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                    >
                      {isAr ? 'تفاصيل الرحلة' : 'View Details'}
                    </button>
                    <div className="flex-1 text-end">{renderContextAction(trip, false)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TRIP DETAILS DRAWER / SHEET */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-2xs flex justify-end animate-in fade-in duration-200">
          <div
            className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/70 sticky top-0 z-10 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                    {selectedTrip.flightNumber}
                  </span>
                  <span className="font-mono text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md">
                    {getRouteBadge(selectedTrip)}
                  </span>
                  {renderStatusBadge(selectedTrip.status, getTripCapacity(selectedTrip).isFull)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr ? 'موعد الإقلاع:' : 'Departure:'}{' '}
                  <span className="font-bold text-slate-800">
                    {formatDeparture(selectedTrip.departureTime).formattedDate} —{' '}
                    {formatDeparture(selectedTrip.departureTime).formattedTime}
                  </span>{' '}
                  <span className="text-slate-400">
                    ({formatDeparture(selectedTrip.departureTime).countdown})
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTrip(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-500 flex items-center justify-center border border-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 space-y-5 flex-1 text-xs">
              {/* Traveler & Verification Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-black flex items-center justify-center text-sm">
                      {selectedTrip.travelerName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{selectedTrip.travelerName}</div>
                      <div className="text-slate-500">{selectedTrip.travelerPhone || 'No phone'}</div>
                    </div>
                  </div>
                  {selectedTrip.kycStatus === 'VERIFIED' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isAr ? 'هوية موثقة KYC ✓' : 'KYC VERIFIED ✓'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isAr ? 'توثيق الهوية معلق' : 'KYC PENDING'}</span>
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'موظف الاعتماد (Audit):' : 'Verified By:'}</span>
                    <span className="font-mono font-bold text-slate-700">
                      {selectedTrip.verifiedByEmployeeId || 'EMP-HUB-SYS'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'تاريخ التدقيق:' : 'Verified At:'}</span>
                    <span className="font-bold text-slate-700">
                      {selectedTrip.verifiedAt
                        ? new Date(selectedTrip.verifiedAt).toLocaleDateString()
                        : isAr
                        ? 'مكتمل في النظام'
                        : 'System Verified'}
                    </span>
                  </div>
                </div>

                {/* Traveler Confirmation Status */}
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-slate-500 font-bold">
                    {isAr ? 'تأكيد المسافر النهائي:' : 'Traveler Confirmation:'}
                  </span>
                  {selectedTrip.status === 'CONFIRMED' || selectedTrip.status === 'PACKAGES_LINKED' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-black text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'مؤكد من المسافر ✓' : 'CONFIRMED ✓'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sky-700 font-bold text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{isAr ? 'بانتظار تأكيد المسافر ⏳' : 'PENDING CONFIRMATION ⏳'}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Capacity Breakdown & Formula */}
              {(() => {
                const { availableWeightKg, allocatedWeightKg, remainingWeightKg, usagePercentage, isFull } =
                  getTripCapacity(selectedTrip);

                return (
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-slate-600" />
                        <span>{isAr ? 'معادلة وحالة السعة الاستيعابية' : 'Capacity Formula Breakdown'}</span>
                      </span>
                      {isFull && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-white">
                          {isAr ? 'ممتلئة بالكامل' : 'FULL'}
                        </span>
                      )}
                    </div>

                    {/* Three Distinct Numbers */}
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">{isAr ? 'إجمالي السعة' : 'Total Space'}</span>
                        <span className="font-black text-slate-900 text-sm">{availableWeightKg} كغم</span>
                      </div>
                      <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100">
                        <span className="text-[10px] text-indigo-700 block">{isAr ? 'المخصص' : 'Allocated'}</span>
                        <span className="font-black text-indigo-950 text-sm">{allocatedWeightKg} كغم</span>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                        <span className="text-[10px] text-emerald-700 block">{isAr ? 'المتبقي' : 'Remaining'}</span>
                        <span className="font-black text-emerald-950 text-sm">{remainingWeightKg} كغم</span>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full transition-all duration-300 ${
                            usagePercentage >= 100
                              ? 'bg-slate-800'
                              : usagePercentage > 70
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${usagePercentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>0 KG</span>
                        <span>{usagePercentage}% used</span>
                        <span>{availableWeightKg} KG</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Linked Packages & Manifest Mini Table */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-indigo-600" />
                    <span>{isAr ? 'الطرود المرتبطة والمانيفست' : 'Linked Packages & Manifest'}</span>
                  </span>
                  <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    {linkedShipments.length} {isAr ? 'طرود معتمدة' : 'Assigned'}
                  </span>
                </div>

                {linkedShipments.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                    <Package className="w-6 h-6 mx-auto mb-1 opacity-30 text-slate-500" />
                    <span>{isAr ? 'لا توجد طرود مرتبطة بهذه الرحلة حتى الآن' : 'No packages linked to this trip yet'}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {linkedShipments.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-mono font-bold text-slate-900">{pkg.trackingNumber}</div>
                          <div className="text-[10px] text-slate-500">
                            {pkg.packageType} • {pkg.weightKg} كغم
                          </div>
                        </div>
                        <div className="text-end">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800">
                            {pkg.currentStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">{isAr ? 'رقم المانيفست:' : 'Manifest:'}</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedTrip.manifestId || (isAr ? 'لم ينشأ بعد (Draft)' : 'Not generated yet')}
                  </span>
                </div>
              </div>

              {/* Matching Readiness Checklist */}
              {(() => {
                const readiness = evaluateReadiness(selectedTrip);

                return (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{isAr ? 'قائمة الجاهزية للمطابقة (Matching Readiness)' : 'Matching Readiness Checklist'}</span>
                      </span>
                      {readiness.isReadyForMatching ? (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                          READY ✓
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                          NOT READY
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* Check 1: Trip Verified */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">{isAr ? 'الرحلة معتمدة من الإدارة (Trip Verified)' : 'Trip Approved by Hub'}</span>
                        {readiness.isVerified ? (
                          <span className="text-emerald-700 font-bold">✓ {isAr ? 'معتمد' : 'Pass'}</span>
                        ) : (
                          <span className="text-slate-400">✗</span>
                        )}
                      </div>

                      {/* Check 2: Traveler Confirmed */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">{isAr ? 'تأكيد المسافر النهائي (Traveler Confirmed)' : 'Traveler Confirmed'}</span>
                        {readiness.isTravelerConfirmed ? (
                          <span className="text-emerald-700 font-bold">✓ {isAr ? 'مؤكد' : 'Pass'}</span>
                        ) : (
                          <span className="text-amber-600 font-bold">{isAr ? 'بانتظار التأكيد' : 'Pending'}</span>
                        )}
                      </div>

                      {/* Check 3: Valid Departure in Future */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">{isAr ? 'موعد الإقلاع في المستقبل (Valid Departure)' : 'Future Departure'}</span>
                        {readiness.isDepartureValid ? (
                          <span className="text-emerald-700 font-bold">✓ {isAr ? 'صالح' : 'Pass'}</span>
                        ) : (
                          <span className="text-rose-600 font-bold">{isAr ? 'أقلعت' : 'Departed'}</span>
                        )}
                      </div>

                      {/* Check 4: Capacity Available */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">{isAr ? 'سعة استيعابية شاغرة (Capacity Available)' : 'Available Space > 0'}</span>
                        {readiness.hasCapacity ? (
                          <span className="text-emerald-700 font-bold">✓ {isAr ? 'متاحة' : 'Pass'}</span>
                        ) : (
                          <span className="text-slate-500 font-bold">{isAr ? 'ممتلئة بالكامل' : 'Full'}</span>
                        )}
                      </div>

                      {/* Check 5: No Blocking Incident */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700">{isAr ? 'لا توجد بلاغات تجميد (No Incidents)' : 'No Blocking Incidents'}</span>
                        {readiness.noBlockingIncident ? (
                          <span className="text-emerald-700 font-bold">✓ {isAr ? 'سليم' : 'Clear'}</span>
                        ) : (
                          <span className="text-rose-600 font-bold">{isAr ? 'يوجد تنبيه' : 'Flagged'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Sticky Action Bar */}
            <div className="p-4 border-t border-slate-200 bg-white sticky bottom-0 z-10 flex items-center justify-between gap-3 shadow-lg">
              <button
                type="button"
                onClick={() => setSelectedTrip(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>

              <div className="flex items-center gap-2">
                {(selectedTrip.status === 'PACKAGES_LINKED' || getTripCapacity(selectedTrip).isFull) && (
                  <button
                    type="button"
                    onClick={() => handleOpenManifest(selectedTrip)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{isAr ? 'فتح المانيفست' : 'Open Manifest'}</span>
                  </button>
                )}

                {/* Primary Context Action Button */}
                {renderContextAction(selectedTrip, false)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELAY REVIEW MODAL */}
      {delayModalTrip && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-black text-slate-900 text-base">
                  {isAr ? 'مراجعة الرحلة المتأخرة' : 'Review Delayed Flight'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDelayModalTrip(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1 text-amber-900">
              <div className="font-bold">
                {delayModalTrip.airline} — {delayModalTrip.flightNumber}
              </div>
              <div>
                {isAr ? 'المسافر:' : 'Traveler:'} {delayModalTrip.travelerName} ({delayModalTrip.travelerPhone})
              </div>
              <div>
                {isAr ? 'موعد الإقلاع المجدول:' : 'Scheduled:'}{' '}
                {new Date(delayModalTrip.departureTime).toLocaleString()}
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isAr
                ? 'تأخر موعد إقلاع هذه الرحلة يؤثر على التزامات التسليم للطرد والـ SLA المعتمد. يمكنك إما إعادة جدولة الطرود المرتبطة أو التواصل مع المسافر.'
                : 'Delay impacts SLA and delivery commitments. You can either reschedule linked packages or notify senders.'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDelayModalTrip(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
              >
                {isAr ? 'إلغاء' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDelayModalTrip(null);
                  onNavigate('MANIFESTS');
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                {isAr ? 'مراجعة المانيفست' : 'Inspect Manifest'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
