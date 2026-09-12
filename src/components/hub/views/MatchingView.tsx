import React, { useState, useMemo, useEffect } from 'react';
import {
  Split,
  Plane,
  CheckCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Search,
  Scale,
  Calendar,
  Lock,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Clock,
  Check,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  X,
  User,
  Info,
  FileText,
  Ban,
  ExternalLink,
  Filter,
  Eye,
  WifiOff,
} from 'lucide-react';
import { Hub, Locale, Shipment, Trip, EmployeeNavSection, User as UserType } from '../../../types';
import { HUBS_DATA } from '../../../lib/constants';
import { normalizeShipmentStatus } from '../../../lib/statusNormalizer';
import { StatusBadge } from '../common/StatusBadge';
import { DetailsDrawer } from '../common/DetailsDrawer';

interface MatchingViewProps {
  currentHub: Hub;
  shipments: Shipment[];
  trips: Trip[];
  locale: Locale;
  preselectedShipmentId?: string;
  preselectedTripId?: string;
  onNavigate: (section: EmployeeNavSection, extra?: { tripId?: string; shipmentId?: string }) => void;
  onRefreshData: () => void;
  currentUser?: UserType;
}

export const MatchingView: React.FC<MatchingViewProps> = ({
  currentHub,
  shipments,
  trips,
  locale,
  preselectedShipmentId,
  preselectedTripId,
  onNavigate,
  onRefreshData,
  currentUser,
}) => {
  const isAr = locale === 'ar';

  // Permissions check (Rule 45)
  const canAssign = useMemo(() => {
    if (!currentUser) return true;
    const empPermissions = (currentUser as any).permissions as string[] | undefined;
    if (empPermissions && Array.isArray(empPermissions)) {
      if (empPermissions.includes('matching.view') && !empPermissions.includes('matching.assign')) {
        return false;
      }
    }
    if (currentUser.role === 'HUB_INSPECTOR') {
      return false;
    }
    return true;
  }, [currentUser]);

  // State: Online / Offline tracking
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 1. Ready Shipments Calculation (Strict matching requirements)
  // - Belongs to current origin hub
  // - Status: INSPECTED_SEALED (or normalized INSPECTED_AND_SEALED)
  // - Weight > 0
  // - Valid seal ID
  // - Not assigned previously
  // - Not on hold
  const readyShipments = useMemo(() => {
    return shipments.filter((s) => {
      const isCurrentHub = s.originHubId === currentHub.id || !s.originHubId;
      if (!isCurrentHub) return false;

      const normStatus = normalizeShipmentStatus(s.currentStatus);
      const isInspectedSealed = normStatus === 'INSPECTED_SEALED';
      if (!isInspectedSealed) return false;

      // Exclude already assigned or transit statuses
      const isAssigned =
        !!s.assignedTripId ||
        s.currentStatus === 'ASSIGNED_TO_TRIP' ||
        s.currentStatus === 'ASSIGNED_TO_TRAVELER';
      if (isAssigned) return false;

      const isExcluded =
        s.currentStatus === 'IN_TRANSIT' ||
        s.currentStatus === 'IN_TRANSIT_AIR' ||
        s.currentStatus === 'IN_FLIGHT' ||
        s.currentStatus === 'RECEIVED_AT_DEST' ||
        s.currentStatus === 'RECEIVED_AT_DEST_HUB' ||
        s.currentStatus === 'READY_FOR_PICKUP' ||
        s.currentStatus === 'DELIVERED' ||
        s.currentStatus === 'COMPLETED' ||
        s.currentStatus === 'CANCELLED' ||
        s.currentStatus === 'REJECTED_PROHIBITED';
      if (isExcluded) return false;

      const weight = s.actualWeightKg ?? s.estimatedWeightKg ?? 0;
      if (weight <= 0) return false;

      const hasValidSeal = !!s.securitySealId;
      if (!hasValidSeal) return false;

      const isBlocked = !!s.isHold || s.currentStatus === 'CUSTOMS_HELD';
      if (isBlocked) return false;

      return true;
    });
  }, [shipments, currentHub.id]);

  // Helpers
  const getDestinationDisplay = (destHubId: string) => {
    const hub = HUBS_DATA.find((h) => h.id === destHubId);
    if (!hub) return destHubId;
    return isAr ? `${hub.cityAr} (${hub.code})` : `${hub.cityEn} (${hub.code})`;
  };

  const getOriginDisplay = (originHubId: string) => {
    const hub = HUBS_DATA.find((h) => h.id === originHubId);
    if (!hub) return originHubId;
    return isAr ? `${hub.cityAr} (${hub.code})` : `${hub.cityEn} (${hub.code})`;
  };

  const getReadySinceText = (shipment: Shipment) => {
    const timestampStr = shipment.inspectedAt || shipment.readySince || shipment.updatedAt || shipment.createdAt;
    if (!timestampStr) return isAr ? 'حديثاً' : 'Just now';

    const diffMs = Math.max(0, Date.now() - new Date(timestampStr).getTime());
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return isAr ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
    if (diffHours > 0) return isAr ? `منذ ${diffHours} س` : `${diffHours}h ago`;
    return isAr ? `منذ ${diffMins} د` : `${diffMins}m ago`;
  };

  // 2. Search & Filters for Ready Shipments
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDestination, setFilterDestination] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterMatchAvailability, setFilterMatchAvailability] = useState<'ALL' | 'HAS_MATCH' | 'NO_MATCH'>('ALL');

  // Active hub trips for compatibility checks
  const hubTrips = useMemo(() => {
    return trips.filter((t) => t.originHubId === currentHub.id || !t.originHubId);
  }, [trips, currentHub.id]);

  // Helper to test if a trip is eligible for a specific shipment
  const evaluateTripEligibility = (trip: Trip, shipment: Shipment) => {
    const shipmentWeight = shipment.actualWeightKg ?? shipment.estimatedWeightKg ?? 0;
    const remainingWeightKg = Math.max(0, trip.availableWeightKg - (trip.allocatedWeightKg || 0));

    // 1. Route match
    if (trip.destinationHubId !== shipment.destinationHubId) {
      return {
        isEligible: false,
        reason: isAr ? 'المسار غير مطابق لوجهة الطرد' : 'Route mismatch',
        remainingWeightKg,
        remainingAfter: remainingWeightKg - shipmentWeight,
      };
    }

    // 2. Strict status check
    if (trip.status === 'VERIFIED') {
      return {
        isEligible: false,
        reason: isAr ? 'بانتظار تأكيد المسافر (VERIFIED فقط)' : 'Waiting for traveler confirmation',
        remainingWeightKg,
        remainingAfter: remainingWeightKg - shipmentWeight,
      };
    }

    if (trip.status === 'DELAYED') {
      return {
        isEligible: false,
        reason: isAr ? 'الرحلة مؤجلة (قيد المراجعة التشغيلية)' : 'Trip delayed (operational review)',
        remainingWeightKg,
        remainingAfter: remainingWeightKg - shipmentWeight,
      };
    }

    if (['CANCELLED', 'REJECTED', 'COMPLETED', 'EMERGENCY_UNASSIGNED'].includes(trip.status)) {
      return {
        isEligible: false,
        reason: isAr ? 'الرحلة غير نشطة أو ملغاة' : 'Trip inactive or cancelled',
        remainingWeightKg,
        remainingAfter: remainingWeightKg - shipmentWeight,
      };
    }

    // 3. Flight fullness and capacity
    if (remainingWeightKg <= 0) {
      return {
        isEligible: false,
        reason: isAr ? 'الرحلة ممتلئة بالكامل (السعة 0 كغم)' : 'Flight is completely full',
        remainingWeightKg,
        remainingAfter: remainingWeightKg - shipmentWeight,
      };
    }

    if (remainingWeightKg < shipmentWeight) {
      return {
        isEligible: false,
        reason: isAr
          ? `السعة المتبقية غير كافية (المتبقي ${remainingWeightKg.toFixed(1)} كغم، المطلوب ${shipmentWeight.toFixed(1)} كغم)`
          : `Insufficient capacity (${remainingWeightKg.toFixed(1)} kg remaining, ${shipmentWeight.toFixed(1)} kg needed)`,
        remainingWeightKg,
        remainingAfter: remainingWeightKg - shipmentWeight,
      };
    }

    // 4. Departure cut-off
    const departureTimeMs = new Date(trip.departureTime).getTime();
    if (!isNaN(departureTimeMs) && departureTimeMs < Date.now()) {
      return {
        isEligible: false,
        reason: isAr ? 'انتهت نافذة الإسناد المسموحة (موعد الإقلاع انقضى)' : 'Assignment cut-off reached',
        remainingWeightKg,
        remainingAfter: remainingWeightKg - shipmentWeight,
      };
    }

    // 5. Trip risk flag
    if (trip.hasRiskFlag) {
      return {
        isEligible: false,
        reason: isAr ? 'يوجد تنبيه مخاطر تشغيلي على الرحلة' : 'Operational risk flag on trip',
        remainingWeightKg,
        remainingAfter: remainingWeightKg - shipmentWeight,
      };
    }

    // 6. Eligible status
    if (trip.status === 'CONFIRMED' || trip.status === 'PACKAGES_LINKED') {
      return {
        isEligible: true,
        reason: '',
        remainingWeightKg,
        remainingAfter: remainingWeightKg - shipmentWeight,
      };
    }

    return {
      isEligible: false,
      reason: isAr ? 'حالة الرحلة غير مؤهلة للمطابقة' : 'Trip status not eligible for matching',
      remainingWeightKg,
      remainingAfter: remainingWeightKg - shipmentWeight,
    };
  };

  // Check eligible trips count for a shipment
  const getEligibleTripsForShipment = (shipment: Shipment) => {
    return hubTrips.filter((t) => evaluateTripEligibility(t, shipment).isEligible);
  };

  // 3. Sorting Ready Shipments
  // 1. URGENT
  // 2. Preferred dispatch approaching
  // 3. Oldest ready shipment
  // 4. Normal
  const sortedReadyShipments = useMemo(() => {
    return [...readyShipments].sort((a, b) => {
      const aPriority = a.priority === 'URGENT' ? 3 : a.priority === 'HIGH' ? 2 : 1;
      const bPriority = b.priority === 'URGENT' ? 3 : b.priority === 'HIGH' ? 2 : 1;
      if (bPriority !== aPriority) return bPriority - aPriority;

      if (a.preferredDepartureDate && b.preferredDepartureDate) {
        const aDate = new Date(a.preferredDepartureDate).getTime();
        const bDate = new Date(b.preferredDepartureDate).getTime();
        if (!isNaN(aDate) && !isNaN(bDate) && aDate !== bDate) return aDate - bDate;
      }

      const aTime = new Date(a.inspectedAt || a.readySince || a.createdAt).getTime();
      const bTime = new Date(b.inspectedAt || b.readySince || b.createdAt).getTime();
      if (!isNaN(aTime) && !isNaN(bTime)) return aTime - bTime;

      return 0;
    });
  }, [readyShipments]);

  // Filtered Ready Shipments
  const filteredReadyShipments = useMemo(() => {
    return sortedReadyShipments.filter((s) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTracking = s.trackingNumber.toLowerCase().includes(q);
        const matchesSender = s.senderName.toLowerCase().includes(q);
        const matchesRecipient = s.recipientName.toLowerCase().includes(q);
        const matchesSeal = s.securitySealId?.toLowerCase().includes(q);
        const matchesDesc = s.itemDescription.toLowerCase().includes(q);
        const matchesDest = getDestinationDisplay(s.destinationHubId).toLowerCase().includes(q);
        if (!matchesTracking && !matchesSender && !matchesRecipient && !matchesSeal && !matchesDesc && !matchesDest) {
          return false;
        }
      }

      // Filter: Destination
      if (filterDestination !== 'ALL' && s.destinationHubId !== filterDestination) {
        return false;
      }

      // Filter: Priority
      if (filterPriority !== 'ALL') {
        const priority = s.priority || 'NORMAL';
        if (priority !== filterPriority) return false;
      }

      // Filter: Match Availability
      if (filterMatchAvailability !== 'ALL') {
        const compCount = getEligibleTripsForShipment(s).length;
        if (filterMatchAvailability === 'HAS_MATCH' && compCount === 0) return false;
        if (filterMatchAvailability === 'NO_MATCH' && compCount > 0) return false;
      }

      return true;
    });
  }, [sortedReadyShipments, searchQuery, filterDestination, filterPriority, filterMatchAvailability, hubTrips]);

  // Unique destinations present among ready shipments
  const availableDestinations = useMemo(() => {
    const destIds: string[] = Array.from(
      new Set(readyShipments.map((s) => s.destinationHubId).filter((id): id is string => Boolean(id)))
    );
    return destIds.map((id) => ({
      id,
      label: getDestinationDisplay(id),
    }));
  }, [readyShipments, isAr]);

  // 4. Selection State
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>(() => {
    if (preselectedShipmentId && readyShipments.some((s) => s.id === preselectedShipmentId)) {
      return preselectedShipmentId;
    }
    return readyShipments[0]?.id || '';
  });

  const [selectedTripId, setSelectedTripId] = useState<string>(() => {
    if (preselectedTripId && hubTrips.some((t) => t.id === preselectedTripId)) {
      return preselectedTripId;
    }
    return '';
  });

  // Ensure selected shipment stays valid if list changes
  useEffect(() => {
    if (readyShipments.length === 0) {
      setSelectedShipmentId('');
      setSelectedTripId('');
    } else if (!readyShipments.some((s) => s.id === selectedShipmentId)) {
      setSelectedShipmentId(readyShipments[0].id);
      setSelectedTripId('');
    }
  }, [readyShipments, selectedShipmentId]);

  const selectedShipment = readyShipments.find((s) => s.id === selectedShipmentId) || null;

  // 5. Compatible Trips for Selected Shipment
  const [showIneligibleTrips, setShowIneligibleTrips] = useState<boolean>(false);

  const evaluatedTripsForShipment = useMemo(() => {
    if (!selectedShipment) return [];

    return hubTrips.map((trip) => {
      const evaluation = evaluateTripEligibility(trip, selectedShipment);
      return {
        trip,
        ...evaluation,
      };
    });
  }, [selectedShipment, hubTrips, isAr]);

  const eligibleTrips = useMemo(() => {
    return evaluatedTripsForShipment.filter((t) => t.isEligible);
  }, [evaluatedTripsForShipment]);

  const ineligibleTrips = useMemo(() => {
    return evaluatedTripsForShipment.filter((t) => !t.isEligible);
  }, [evaluatedTripsForShipment]);

  // Best Match calculation (among eligible trips)
  const bestMatchTripId = useMemo(() => {
    if (eligibleTrips.length === 0) return null;
    // Prefer closest departure date that has capacity
    const sorted = [...eligibleTrips].sort((a, b) => {
      const aTime = new Date(a.trip.departureTime).getTime();
      const bTime = new Date(b.trip.departureTime).getTime();
      return aTime - bTime;
    });
    return sorted[0].trip.id;
  }, [eligibleTrips]);

  const selectedTrip = hubTrips.find((t) => t.id === selectedTripId) || null;
  const selectedTripEvaluation = selectedShipment && selectedTrip
    ? evaluateTripEligibility(selectedTrip, selectedShipment)
    : null;

  // 6. KPI Cards Metrics (4 Operational Cards)
  const kpiReadyShipmentsCount = readyShipments.length;

  const kpiEligibleTripsCount = useMemo(() => {
    return hubTrips.filter((t) => {
      const remaining = Math.max(0, t.availableWeightKg - (t.allocatedWeightKg || 0));
      const hasStatus = t.status === 'CONFIRMED' || t.status === 'PACKAGES_LINKED';
      const depTime = new Date(t.departureTime).getTime();
      const validDeparture = isNaN(depTime) || depTime > Date.now();
      return hasStatus && remaining > 0 && validDeparture && !t.hasRiskFlag;
    }).length;
  }, [hubTrips]);

  const kpiUnmatchedWeightKg = useMemo(() => {
    const total = readyShipments.reduce((sum, s) => sum + (s.actualWeightKg ?? s.estimatedWeightKg ?? 0), 0);
    return Number(total.toFixed(1));
  }, [readyShipments]);

  const kpiNoMatchShipmentsCount = useMemo(() => {
    return readyShipments.filter((s) => getEligibleTripsForShipment(s).length === 0).length;
  }, [readyShipments, hubTrips]);

  // 7. Modal & Drawer States
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [drawerTrip, setDrawerTrip] = useState<Trip | null>(null);
  const [successState, setSuccessState] = useState<{
    shipmentTracking: string;
    flightNumber: string;
    travelerName: string;
    weight: number;
    remainingAfter: number;
  } | null>(null);

  // Mobile View Stepper: 1 = Select Shipment, 2 = Select Trip, 3 = Review
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1);

  // 8. Execute Assignment Action
  const handleExecuteAssignment = () => {
    if (!selectedShipment || !selectedTrip || !selectedTripEvaluation?.isEligible) return;
    if (!isOnline) return;

    const shipmentWeight = Number((selectedShipment.actualWeightKg ?? selectedShipment.estimatedWeightKg ?? 0).toFixed(2));
    const newRemainingAfter = selectedTripEvaluation.remainingAfter;

    // Mutate in shared state
    selectedShipment.currentStatus = 'ASSIGNED_TO_TRIP';
    selectedShipment.assignedTripId = selectedTrip.id;
    selectedShipment.assignedTravelerId = selectedTrip.travelerId;
    selectedShipment.assignedTravelerName = selectedTrip.travelerName;
    selectedShipment.flightNumber = selectedTrip.flightNumber;
    selectedShipment.airline = selectedTrip.airline;

    if (selectedTrip.status === 'CONFIRMED') {
      selectedTrip.status = 'PACKAGES_LINKED';
    }

    selectedTrip.allocatedWeightKg = Number(((selectedTrip.allocatedWeightKg || 0) + shipmentWeight).toFixed(2));

    // Success payload
    setSuccessState({
      shipmentTracking: selectedShipment.trackingNumber,
      flightNumber: `${selectedTrip.airline} (${selectedTrip.flightNumber})`,
      travelerName: selectedTrip.travelerName,
      weight: shipmentWeight,
      remainingAfter: Math.max(0, newRemainingAfter),
    });

    setIsConfirmModalOpen(false);
    setSelectedTripId('');

    // Trigger central state refresh
    onRefreshData();
  };

  const handleContinueMatching = () => {
    setSuccessState(null);
    setSelectedTripId('');
    setMobileStep(1);
    // Auto-select next available shipment if exists
    if (readyShipments.length > 0) {
      setSelectedShipmentId(readyShipments[0].id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center gap-3 text-amber-900 text-xs font-semibold animate-in fade-in">
          <WifiOff className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            {isAr
              ? 'أنت تعمل دون اتصال بالإنترنت حالياً (Offline). تم تعطيل عمليات الإسناد حتى استعادة الاتصال لضمان سلامة العمليات.'
              : 'You are currently offline. Matching assignment actions are disabled until connection is restored.'}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Split className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">
                  {isAr ? 'المطابقة' : 'Matching'}
                </h1>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  {currentHub.code}
                </span>
                <span className="text-xs text-slate-400 font-medium">Matching Desk</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? 'مطابقة الطرود الجاهزة للنقل مع الرحلات المؤكدة وفق المسار، التاريخ، السعة والجاهزية التشغيلية.'
                  : 'Match sealed packages with confirmed flights respecting route, departure date, capacity, and operational readiness.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onNavigate('READY_FOR_TRANSPORT')}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            <span>{isAr ? 'الطرود الجاهزة للنقل' : 'Ready for Transport'}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('MANIFESTS')}
            className="flex-1 sm:flex-initial px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>{isAr ? 'الانتقال للمانيفست' : 'Go to Manifests'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (4 Operational Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Ready Shipments */}
        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">
              {isAr ? 'الطرود الجاهزة' : 'Ready Shipments'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{kpiReadyShipmentsCount}</div>
          <div className="text-[11px] text-teal-700 font-semibold mt-1">
            {isAr ? 'مفحوص ومختوم أمنياً' : 'Inspected & Sealed'}
          </div>
        </div>

        {/* 2. Eligible Trips */}
        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">
              {isAr ? 'الرحلات المؤهلة' : 'Eligible Trips'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Plane className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{kpiEligibleTripsCount}</div>
          <div className="text-[11px] text-indigo-700 font-semibold mt-1">
            {isAr ? 'مؤكدة وبسعة شاغرة' : 'Confirmed & Available'}
          </div>
        </div>

        {/* 3. Unmatched Weight */}
        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">
              {isAr ? 'الوزن غير المسند' : 'Unmatched Weight'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {kpiUnmatchedWeightKg} <span className="text-xs font-bold text-slate-500">كغم</span>
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">
            {isAr ? 'جاهز للشحن الفوري' : 'Pending flight match'}
          </div>
        </div>

        {/* 4. No Match */}
        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">
              {isAr ? 'طرود بدون رحلة' : 'No Match'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{kpiNoMatchShipmentsCount}</div>
          <div className="text-[11px] text-rose-700 font-semibold mt-1">
            {isAr ? 'تحتاج رحلات مسافرين إضافية' : 'Awaiting flight routes'}
          </div>
        </div>
      </div>

      {/* Mobile Step Navigator (Shown on small screens) */}
      <div className="flex lg:hidden bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold">
        <button
          type="button"
          onClick={() => setMobileStep(1)}
          className={`flex-1 py-2 rounded-lg transition-all text-center ${
            mobileStep === 1 ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          1. {isAr ? 'الطرود الجاهزة' : 'Shipments'} ({readyShipments.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileStep(2)}
          disabled={!selectedShipment}
          className={`flex-1 py-2 rounded-lg transition-all text-center disabled:opacity-40 ${
            mobileStep === 2 ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          2. {isAr ? 'الرحلات المتوافقة' : 'Trips'} ({eligibleTrips.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileStep(3)}
          disabled={!selectedShipment || !selectedTrip}
          className={`flex-1 py-2 rounded-lg transition-all text-center disabled:opacity-40 ${
            mobileStep === 3 ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          3. {isAr ? 'المراجعة' : 'Review'}
        </button>
      </div>

      {/* Main Split Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Ready Shipments Panel (5 cols) */}
        <div className={`lg:col-span-5 space-y-4 ${mobileStep !== 1 ? 'hidden lg:block' : ''}`}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Panel Header */}
            <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {isAr ? 'الطرود الجاهزة للمطابقة' : 'Ready Shipments'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {isAr ? 'اختر طرداً لعرض الرحلات المؤهلة له' : 'Select a parcel to see compatible flights'}
                  </p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  {filteredReadyShipments.length} {isAr ? 'طرد' : 'parcels'}
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isAr
                      ? 'بحث برقم التتبع، الختم، المستلم...'
                      : 'Search tracking, seal ID, recipient...'
                  }
                  className="w-full ps-9 pe-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute top-1/2 -translate-y-1/2 end-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
                {/* Destination Filter */}
                <select
                  value={filterDestination}
                  onChange={(e) => setFilterDestination(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden"
                >
                  <option value="ALL">{isAr ? 'كل الوجهات' : 'All Destinations'}</option>
                  {availableDestinations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>

                {/* Priority Filter */}
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden"
                >
                  <option value="ALL">{isAr ? 'كل الأولويات' : 'All Priorities'}</option>
                  <option value="URGENT">{isAr ? 'عاجل (Urgent)' : 'Urgent'}</option>
                  <option value="HIGH">{isAr ? 'مرتفع (High)' : 'High'}</option>
                  <option value="NORMAL">{isAr ? 'عادي (Normal)' : 'Normal'}</option>
                </select>

                {/* Match Availability Filter */}
                <select
                  value={filterMatchAvailability}
                  onChange={(e) => setFilterMatchAvailability(e.target.value as any)}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-hidden"
                >
                  <option value="ALL">{isAr ? 'كل الحالات' : 'All Matches'}</option>
                  <option value="HAS_MATCH">{isAr ? 'توجد رحلات' : 'Has Trips'}</option>
                  <option value="NO_MATCH">{isAr ? 'بدون رحلة' : 'No Trip'}</option>
                </select>
              </div>
            </div>

            {/* Shipments List */}
            <div className="p-3 space-y-2.5 max-h-[620px] overflow-y-auto">
              {filteredReadyShipments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <CheckCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-700 text-xs">
                      {isAr ? 'لا توجد طرود جاهزة للمطابقة حالياً' : 'No ready parcels for matching'}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                      {isAr
                        ? 'ستظهر هنا الطرود بعد اجتياز الفحص والختم الأمني.'
                        : 'Parcels will appear here after passing physical inspection and security sealing.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('READY_FOR_TRANSPORT')}
                    className="px-3.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl font-bold text-xs hover:bg-amber-100 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>{isAr ? 'الانتقال للطرود الجاهزة للنقل' : 'Go to Ready for Transport'}</span>
                    {isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : (
                filteredReadyShipments.map((shipment) => {
                  const isSelected = selectedShipmentId === shipment.id;
                  const weight = (shipment.actualWeightKg ?? shipment.estimatedWeightKg ?? 0).toFixed(2);
                  const readySince = getReadySinceText(shipment);
                  const destLabel = getDestinationDisplay(shipment.destinationHubId);
                  const compTripsCount = getEligibleTripsForShipment(shipment).length;
                  const isUrgent = shipment.priority === 'URGENT';
                  const isHigh = shipment.priority === 'HIGH';

                  return (
                    <div
                      key={shipment.id}
                      onClick={() => {
                        setSelectedShipmentId(shipment.id);
                        setSelectedTripId('');
                        setMobileStep(2);
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer text-start ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          {/* Tracking & Seal */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-black text-slate-900">
                              {shipment.trackingNumber}
                            </span>
                            {shipment.securitySealId && (
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                {shipment.securitySealId}
                              </span>
                            )}
                            {isUrgent && (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 animate-pulse">
                                {isAr ? 'عاجل' : 'URGENT'}
                              </span>
                            )}
                            {isHigh && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                {isAr ? 'أولوية' : 'HIGH'}
                              </span>
                            )}
                          </div>

                          {/* Route */}
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{currentHub.cityAr || currentHub.code}</span>
                            <ArrowRight className={`w-3 h-3 text-slate-400 ${isAr ? 'rotate-180' : ''}`} />
                            <span className="text-indigo-900 font-black">{destLabel}</span>
                          </div>

                          {/* Description & Sender */}
                          <div className="text-[11px] text-slate-600 truncate max-w-xs">
                            {shipment.itemDescription}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {isAr ? 'المرسل:' : 'Sender:'} {shipment.senderName} • {readySince}
                          </div>
                        </div>

                        {/* Weight & Compatible trips count badge */}
                        <div className="text-end shrink-0 space-y-1.5">
                          <div className="text-sm font-black text-slate-900">
                            {weight} <span className="text-[10px] font-semibold text-slate-500">كغم</span>
                          </div>

                          <div>
                            {compTripsCount > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Plane className="w-3 h-3" />
                                {compTripsCount} {isAr ? 'رحلات' : 'trips'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                {isAr ? 'لا رحلات' : 'No trips'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Compatible Trips Panel & Match Actions (7 cols) */}
        <div className={`lg:col-span-7 space-y-4 ${mobileStep === 1 ? 'hidden lg:block' : ''}`}>
          {selectedShipment ? (
            <div className="space-y-4">
              {/* Selected Shipment Summary Card at top of Right Panel */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">
                      {isAr ? 'الطرود المحدد للمطابقة' : 'Selected Parcel for Matching'}
                    </span>
                    <div className="text-base sm:text-lg font-black font-mono mt-0.5 flex items-center gap-2">
                      <span>{selectedShipment.trackingNumber}</span>
                      <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        {selectedShipment.securitySealId}
                      </span>
                    </div>
                  </div>

                  <div className="text-end">
                    <div className="text-lg sm:text-xl font-black text-amber-400">
                      {(selectedShipment.actualWeightKg ?? selectedShipment.estimatedWeightKg ?? 0).toFixed(2)}{' '}
                      <span className="text-xs font-semibold text-slate-300">كغم</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isAr ? 'الوزن الفعلي المفحوص' : 'Actual Inspected Weight'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'المسار المطلوب:' : 'Route:'}</span>
                    <span className="font-bold text-slate-200">
                      {getOriginDisplay(selectedShipment.originHubId)} →{' '}
                      {getDestinationDisplay(selectedShipment.destinationHubId)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'المرسل:' : 'Sender:'}</span>
                    <span className="font-bold text-slate-200 truncate block">{selectedShipment.senderName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'المستلم:' : 'Recipient:'}</span>
                    <span className="font-bold text-slate-200 truncate block">{selectedShipment.recipientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{isAr ? 'جاهز منذ:' : 'Ready Since:'}</span>
                    <span className="font-bold text-slate-200">{getReadySinceText(selectedShipment)}</span>
                  </div>
                </div>

                {/* Readiness Validation */}
                {(!selectedShipment.securitySealId ||
                  (selectedShipment.actualWeightKg ?? selectedShipment.estimatedWeightKg ?? 0) <= 0 ||
                  selectedShipment.isHold) && (
                  <div className="p-2.5 bg-rose-950/80 border border-rose-800 rounded-xl flex items-center gap-2 text-rose-200 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>
                      {isAr
                        ? 'المطابقة محظورة: الطرد يحتوي على ملاحظة تشغيلية أو نقص في الختم الأمني.'
                        : 'Matching Blocked: Parcel has an active operational hold or missing seal.'}
                    </span>
                  </div>
                )}
              </div>

              {/* Compatible Flights Header */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>{isAr ? 'رحلات الطيران المتوافقة مع الطرد' : 'Compatible Flights for Parcel'}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {eligibleTrips.length} {isAr ? 'مؤهلة' : 'eligible'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isAr
                        ? 'فقط الرحلات المؤكدة (CONFIRMED) ذات السعة الكافية مؤهلة للإسناد.'
                        : 'Only confirmed flights with sufficient capacity are eligible for assignment.'}
                    </p>
                  </div>

                  {ineligibleTrips.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowIneligibleTrips((prev) => !prev)}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      <span>
                        {showIneligibleTrips
                          ? isAr
                            ? 'إخفاء الرحلات غير المؤهلة'
                            : 'Hide Ineligible'
                          : isAr
                          ? `عرض الرحلات غير المؤهلة (${ineligibleTrips.length})`
                          : `Show Ineligible (${ineligibleTrips.length})`}
                      </span>
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  )}
                </div>

                {/* Eligible Trips List */}
                {eligibleTrips.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Plane className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-xs">
                        {isAr ? 'لا توجد رحلة مؤهلة متاحة حالياً لهذا الطرد' : 'No eligible flight currently available'}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                        {isAr
                          ? `المسار المطلوب: ${getDestinationDisplay(selectedShipment.destinationHubId)} • الوزن المطلوب: ${(selectedShipment.actualWeightKg ?? selectedShipment.estimatedWeightKg ?? 0).toFixed(2)} كغم.`
                          : `Needed Route: ${getDestinationDisplay(selectedShipment.destinationHubId)} • Needed Weight: ${(selectedShipment.actualWeightKg ?? selectedShipment.estimatedWeightKg ?? 0).toFixed(2)} kg.`}
                      </p>
                    </div>

                    {/* Summary of ineligible reasons */}
                    {ineligibleTrips.length > 0 && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-start text-[11px] space-y-1.5 max-w-md mx-auto">
                        <div className="font-bold text-slate-700">
                          {isAr ? `تم فحص (${ineligibleTrips.length}) رحلات أخرى:` : `${ineligibleTrips.length} other trips reviewed:`}
                        </div>
                        {ineligibleTrips.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span className="font-mono font-bold text-slate-800">{item.trip.flightNumber}:</span>
                            <span className="text-slate-500">{item.reason}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {eligibleTrips.map(({ trip, remainingWeightKg, remainingAfter }) => {
                      const isSelected = selectedTripId === trip.id;
                      const isBestMatch = trip.id === bestMatchTripId;
                      const shipmentWeight = selectedShipment.actualWeightKg ?? selectedShipment.estimatedWeightKg ?? 0;
                      const depDate = new Date(trip.departureTime);

                      return (
                        <div
                          key={trip.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            {/* Traveler & Flight Info */}
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-sm text-slate-900">{trip.travelerName}</span>
                                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                                  {trip.airline} ({trip.flightNumber})
                                </span>
                                {isBestMatch && (
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    {isAr ? 'أفضل مطابقة' : 'BEST MATCH'}
                                  </span>
                                )}
                                <StatusBadge domain="TRIP" status={trip.status} size="sm" locale={locale} />
                              </div>

                              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>
                                  {depDate.toLocaleDateString(locale === 'ar' ? 'ar-JO' : 'en-US', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}{' '}
                                  •{' '}
                                  {depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-500">
                                {isAr ? 'المسار:' : 'Route:'}{' '}
                                <span className="font-bold text-slate-700">
                                  {getOriginDisplay(trip.originHubId)} → {getDestinationDisplay(trip.destinationHubId)}
                                </span>
                              </div>
                            </div>

                            {/* Capacity Breakdown */}
                            <div className="text-end shrink-0 sm:min-w-[140px] space-y-1">
                              <div className="text-xs text-slate-500">
                                {isAr ? 'السعة الكلية:' : 'Total Capacity:'}{' '}
                                <span className="font-bold text-slate-800">{trip.availableWeightKg} كغم</span>
                              </div>
                              <div className="text-xs font-black text-emerald-800">
                                {isAr ? 'المتبقي الحالي:' : 'Current Remaining:'}{' '}
                                <span>{remainingWeightKg.toFixed(2)} كغم</span>
                              </div>
                              <div className="text-[11px] font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md inline-block">
                                {isAr ? 'بعد الإسناد:' : 'After Assignment:'}{' '}
                                <span>{remainingAfter.toFixed(2)} كغم</span>
                              </div>
                            </div>
                          </div>

                          {/* Card Actions */}
                          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setDrawerTrip(trip)}
                              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Info className="w-3.5 h-3.5 text-slate-400" />
                              <span>{isAr ? 'تفاصيل الرحلة' : 'Trip Details'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTripId(trip.id);
                                setMobileStep(3);
                              }}
                              className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-2xs'
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{isAr ? 'تم اختيار هذه الرحلة' : 'Trip Selected'}</span>
                                </>
                              ) : (
                                <>
                                  <span>{isAr ? 'اختيار الرحلة' : 'Select Flight'}</span>
                                  {isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Ineligible Trips Section (Toggleable) */}
                {showIneligibleTrips && ineligibleTrips.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {isAr ? 'رحلات غير مؤهلة لهذا الطرد' : 'Ineligible Flights'} ({ineligibleTrips.length})
                    </h4>
                    <div className="space-y-2">
                      {ineligibleTrips.map(({ trip, reason, remainingWeightKg }) => (
                        <div
                          key={trip.id}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl opacity-80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{trip.travelerName}</span>
                              <span className="font-mono text-[10px] text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded">
                                {trip.airline} ({trip.flightNumber})
                              </span>
                              <StatusBadge domain="TRIP" status={trip.status} size="sm" locale={locale} />
                            </div>
                            <div className="text-[11px] text-rose-700 font-bold mt-1 flex items-center gap-1">
                              <Ban className="w-3 h-3 shrink-0" />
                              <span>{reason}</span>
                            </div>
                          </div>

                          <div className="text-end shrink-0 text-[11px] text-slate-500">
                            {isAr ? 'المتبقي:' : 'Remaining:'}{' '}
                            <span className="font-bold">{remainingWeightKg.toFixed(2)} كغم</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assignment Summary Bar & Action Trigger */}
                {selectedTrip && selectedTripEvaluation && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-900">
                        {isAr ? 'ملخص الإسناد الجاهز للتأكيد' : 'Assignment Review Summary'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedTripId('')}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-800"
                      >
                        {isAr ? 'إلغاء التحديد' : 'Cancel Selection'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                        <span className="text-[10px] text-slate-500 block">{isAr ? 'الطرد:' : 'Parcel:'}</span>
                        <span className="font-mono font-black text-slate-900 truncate block">
                          {selectedShipment.trackingNumber}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                        <span className="text-[10px] text-slate-500 block">{isAr ? 'الرحلة:' : 'Flight:'}</span>
                        <span className="font-bold text-slate-900 truncate block">
                          {selectedTrip.flightNumber} ({selectedTrip.travelerName})
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                        <span className="text-[10px] text-slate-500 block">{isAr ? 'وزن الطرد:' : 'Weight:'}</span>
                        <span className="font-black text-amber-800">
                          {(selectedShipment.actualWeightKg ?? selectedShipment.estimatedWeightKg ?? 0).toFixed(2)} كغم
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                        <span className="text-[10px] text-slate-500 block">{isAr ? 'السعة بعد الإسناد:' : 'Capacity After:'}</span>
                        <span className="font-black text-emerald-700">
                          {selectedTripEvaluation.remainingAfter.toFixed(2)} كغم
                        </span>
                      </div>
                    </div>

                    {/* Read-Only Notice if user cannot assign */}
                    {!canAssign && (
                      <div className="p-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-700 text-[11px] font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>
                          {isAr
                            ? 'عرض فقط: لا تملك صلاحية إسناد الطرود (matching.assign)'
                            : 'Read-only: Missing matching.assign permission'}
                        </span>
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      type="button"
                      disabled={!selectedTripEvaluation.isEligible || !isOnline || !canAssign}
                      onClick={() => setIsConfirmModalOpen(true)}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-black rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isAr ? 'تأكيد إسناد الطرد للرحلة' : 'Confirm Assignment to Flight'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-400 space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Split className="w-7 h-7" />
              </div>
              <div className="font-bold text-slate-700 text-sm">
                {isAr ? 'اختر طرداً من القائمة للمطابقة' : 'Select a parcel to view matching flights'}
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isAr
                  ? 'ستظهر هنا الرحلات المتوافقة مع وجهة الطرد وأوزانه فور اختياره من القائمة الجانبية.'
                  : 'Flights matching parcel destination and weight criteria will appear here upon selection.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Mobile Action Bar (Rule 43) */}
      {selectedShipment && selectedTrip && selectedTripEvaluation && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom">
          <div className="min-w-0 flex-1">
            <div className="font-mono text-xs font-black text-slate-900 truncate">
              {selectedShipment.trackingNumber} → {selectedTrip.flightNumber}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span className="font-bold text-amber-700">
                {(selectedShipment.actualWeightKg ?? selectedShipment.estimatedWeightKg ?? 0).toFixed(2)} كغم
              </span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">
                {isAr ? 'المتبقي:' : 'Rem:'} {selectedTripEvaluation.remainingAfter.toFixed(2)} كغم
              </span>
            </div>
          </div>
          <button
            type="button"
            disabled={!selectedTripEvaluation.isEligible || !isOnline || !canAssign}
            onClick={() => setIsConfirmModalOpen(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-black rounded-xl text-xs shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'إسناد للرحلة' : 'Assign to Trip'}</span>
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && selectedShipment && selectedTrip && selectedTripEvaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Plane className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {isAr ? 'تأكيد إسناد الطرد إلى رحلة المسافر' : 'Confirm Package Assignment'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr ? 'مراجعة بيانات النقل النهائي قبل تثبيت الحجز' : 'Review transportation data before locking'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">{isAr ? 'رقم التتبع:' : 'Tracking Number:'}</span>
                <span className="font-mono font-black text-slate-900">{selectedShipment.trackingNumber}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">{isAr ? 'المسافر والرحلة:' : 'Traveler & Flight:'}</span>
                <span className="font-bold text-slate-900">
                  {selectedTrip.travelerName} • {selectedTrip.airline} ({selectedTrip.flightNumber})
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">{isAr ? 'المسار الجوي:' : 'Route:'}</span>
                <span className="font-bold text-slate-900">
                  {getOriginDisplay(selectedShipment.originHubId)} → {getDestinationDisplay(selectedShipment.destinationHubId)}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">{isAr ? 'الوزن الفعلي المحسوب:' : 'Actual Weight:'}</span>
                <span className="font-black text-amber-800">
                  {(selectedShipment.actualWeightKg ?? selectedShipment.estimatedWeightKg ?? 0).toFixed(2)} كغم
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'السعة الشاغرة المتبقية للرحلة:' : 'Remaining After:'}</span>
                <span className="font-black text-emerald-700">
                  {selectedTripEvaluation.remainingAfter.toFixed(2)} كغم
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
              <p className="font-bold text-amber-900">
                {isAr
                  ? 'هل تؤكد إسناد هذا الطرد إلى هذه الرحلة؟'
                  : 'Do you confirm assigning this parcel to this flight?'}
              </p>
              <p className="text-[11px] text-amber-700 mt-1">
                {isAr
                  ? 'ستتغير حالة الطرد إلى (ASSIGNED_TO_TRIP) وسيتم حجز السعة تلقائياً في مانيفست الرحلة.'
                  : 'The parcel status will transition to (ASSIGNED_TO_TRIP) and weight will be allocated.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteAssignment}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs shadow-md transition-colors cursor-pointer"
              >
                {isAr ? 'تأكيد الإسناد النهائي' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Modal */}
      {successState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                {isAr ? 'تمت المطابقة والإسناد بنجاح!' : 'Package Assigned Successfully!'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isAr
                  ? 'تم ربط الطرد بالرحلة وتحديث السعة التشغيلية للمسافر بنجاح.'
                  : 'Parcel is linked to flight and remaining capacity has been updated.'}
              </p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-start space-y-1.5 font-bold">
              <div className="flex justify-between text-slate-700">
                <span>{isAr ? 'الطرد:' : 'Parcel:'}</span>
                <span className="font-mono text-indigo-900">{successState.shipmentTracking}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>{isAr ? 'الرحلة والمسافر:' : 'Flight:'}</span>
                <span className="text-emerald-900">
                  {successState.flightNumber} ({successState.travelerName})
                </span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>{isAr ? 'الوزن المسند:' : 'Weight:'}</span>
                <span>{successState.weight} كغم</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>{isAr ? 'السعة المتبقية للرحلة:' : 'Remaining:'}</span>
                <span className="text-emerald-800">{successState.remainingAfter.toFixed(2)} كغم</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleContinueMatching}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {isAr ? 'متابعة المطابقة' : 'Continue Matching'}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('MANIFESTS', { tripId: successState?.tripId })}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
              >
                {isAr ? 'الانتقال للمانيفست' : 'Open Manifest'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trip Details Drawer */}
      <DetailsDrawer
        isOpen={!!drawerTrip}
        onClose={() => setDrawerTrip(null)}
        title={drawerTrip ? `${drawerTrip.airline} (${drawerTrip.flightNumber})` : ''}
        subtitle={drawerTrip ? `${getOriginDisplay(drawerTrip.originHubId)} → ${getDestinationDisplay(drawerTrip.destinationHubId)}` : ''}
        badge={drawerTrip ? <StatusBadge domain="TRIP" status={drawerTrip.status} locale={locale} /> : null}
        locale={locale}
      >
        {drawerTrip && (
          <div className="space-y-6 text-xs text-slate-800">
            {/* Traveler Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-sm text-slate-900">{drawerTrip.travelerName}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{drawerTrip.travelerPhone}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-500 block">{isAr ? 'تقييم المسافر:' : 'Rating:'}</span>
                  <span className="font-bold text-amber-700">⭐ {drawerTrip.travelerRating} / 5.0</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{isAr ? 'حالة التوثيق (KYC):' : 'KYC Status:'}</span>
                  <span className="font-bold text-emerald-700">
                    {drawerTrip.kycStatus === 'VERIFIED'
                      ? isAr
                        ? 'موثق ومعتمد'
                        : 'Verified'
                      : drawerTrip.kycStatus || 'Verified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Flight & Schedule */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5">
              <h4 className="font-bold text-slate-900">{isAr ? 'بيانات الرحلة والتوقيت' : 'Flight & Schedule'}</h4>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'شركة الطيران:' : 'Airline:'}</span>
                <span className="font-bold">{drawerTrip.airline}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'رقم الرحلة:' : 'Flight Number:'}</span>
                <span className="font-mono font-bold">{drawerTrip.flightNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'رمز الحجز (PNR):' : 'PNR Code:'}</span>
                <span className="font-mono font-bold">{drawerTrip.pnrCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'موعد الإقلاع:' : 'Departure Time:'}</span>
                <span className="font-bold">{new Date(drawerTrip.departureTime).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'موعد الوصول المتوقع:' : 'Arrival Time:'}</span>
                <span className="font-bold">{new Date(drawerTrip.arrivalTime).toLocaleString()}</span>
              </div>
            </div>

            {/* Capacity Status */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5">
              <h4 className="font-bold text-slate-900">{isAr ? 'سعة الحقائب والحمولة' : 'Baggage Capacity'}</h4>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'السعة الكلية المخصصة:' : 'Total Capacity:'}</span>
                <span className="font-bold">{drawerTrip.availableWeightKg} كغم</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'الوزن المسند حالياً:' : 'Allocated Weight:'}</span>
                <span className="font-bold text-amber-700">{drawerTrip.allocatedWeightKg || 0} كغم</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'السعة الشاغرة المتبقية:' : 'Remaining Capacity:'}</span>
                <span className="font-black text-emerald-800">
                  {Math.max(0, drawerTrip.availableWeightKg - (drawerTrip.allocatedWeightKg || 0)).toFixed(2)} كغم
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-500">{isAr ? 'الطرود المسندة للرحلة:' : 'Assigned Packages:'}</span>
                <span className="font-bold text-indigo-900">
                  {shipments.filter((s) => s.assignedTripId === drawerTrip.id).length} {isAr ? 'طرد' : 'parcels'}
                </span>
              </div>
            </div>

            {/* Select Button inside Drawer */}
            {selectedShipment && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTripId(drawerTrip.id);
                  setDrawerTrip(null);
                  setMobileStep(3);
                }}
                disabled={!evaluateTripEligibility(drawerTrip, selectedShipment).isEligible}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {isAr ? 'اختيار هذه الرحلة للمطابقة' : 'Select Flight for Matching'}
              </button>
            )}
          </div>
        )}
      </DetailsDrawer>
    </div>
  );
};
