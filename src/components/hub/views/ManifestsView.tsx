import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Plane,
  QrCode,
  Lock,
  CheckCircle2,
  Search,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Clock,
  Package,
  Layers,
  Trash2,
  Eye,
  Info,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Building2,
  Calendar,
  UserCheck,
} from 'lucide-react';
import {
  Hub,
  Locale,
  Manifest,
  Shipment,
  Trip,
  EmployeeNavSection,
  User as UserType,
  OperationalIncident,
} from '../../../types';
import { StatusBadge } from '../common/StatusBadge';
import { DetailsDrawer } from '../common/DetailsDrawer';
import { QRModal } from '../../common/QRModal';
import { normalizeManifestStatus } from '../../../lib/statusNormalizer';
import { generateCryptographicHandoverToken } from '../../../lib/crypto';

interface ManifestsViewProps {
  currentHub: Hub;
  currentUser?: UserType;
  manifests: Manifest[];
  shipments: Shipment[];
  trips: Trip[];
  operationalIncidents?: OperationalIncident[];
  locale: Locale;
  preselectedTripId?: string;
  onCreateManifest?: (newManifest: Manifest) => Promise<boolean>;
  onUpdateManifest?: (updatedManifest: Manifest) => void;
  onNavigate: (section: EmployeeNavSection, extra?: any) => void;
  onRefreshData: () => void;
}

export const ManifestsView: React.FC<ManifestsViewProps> = ({
  currentHub,
  currentUser,
  manifests,
  shipments,
  trips,
  operationalIncidents = [],
  locale,
  preselectedTripId,
  onCreateManifest,
  onUpdateManifest,
  onNavigate,
  onRefreshData,
}) => {
  const isAr = locale === 'ar';

  // Permissions check
  const canCreate = useMemo(() => {
    if (!currentUser) return true;
    if (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'HUB_MANAGER') return true;
    if (currentUser.permissions && currentUser.permissions.length > 0) {
      return currentUser.permissions.includes('manifest.create') || currentUser.permissions.includes('all');
    }
    return true;
  }, [currentUser]);

  // Selected Manifest Workbench ID
  const [selectedManifestId, setSelectedManifestId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [routeFilter, setRouteFilter] = useState<string>('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddShipmentModalOpen, setIsAddShipmentModalOpen] = useState(false);
  const [selectedShipmentIdsToAdd, setSelectedShipmentIdsToAdd] = useState<string[]>([]);
  const [shipmentToRemove, setShipmentToRemove] = useState<Shipment | null>(null);
  const [isMarkReadyModalOpen, setIsMarkReadyModalOpen] = useState(false);
  const [selectedManifestForQr, setSelectedManifestForQr] = useState<Manifest | null>(null);
  const [drawerManifest, setDrawerManifest] = useState<Manifest | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Filter manifests belonging to current Hub scope
  const hubManifests = useMemo(() => {
    return manifests.filter(
      (m) => m.originHubId === currentHub.id || !m.originHubId
    );
  }, [manifests, currentHub.id]);

  // Handle preselected trip if passed from matching navigation
  useEffect(() => {
    if (preselectedTripId) {
      // Check if manifest already exists for this trip
      const existing = hubManifests.find(
        (m) => m.tripId === preselectedTripId && normalizeManifestStatus(m.status || m.currentStatus) !== 'CANCELLED'
      );
      if (existing) {
        setSelectedManifestId(existing.id);
      } else {
        // Open create modal for this trip
        setIsCreateModalOpen(true);
      }
    }
  }, [preselectedTripId, hubManifests]);

  // KPI Calculations (Rule 10)
  const kpiData = useMemo(() => {
    let draftCount = 0;
    let readyCount = 0;
    let packagesInDraft = 0;
    let totalActiveWeight = 0;

    hubManifests.forEach((m) => {
      const canonicalStatus = normalizeManifestStatus(m.status || m.currentStatus);
      const pkgCount = m.shipmentIds?.length || m.totalPackages || m.totalShipmentsCount || 0;
      const weight = m.totalWeightKg || 0;

      if (canonicalStatus === 'DRAFT') {
        draftCount += 1;
        packagesInDraft += pkgCount;
        totalActiveWeight += weight;
      } else if (canonicalStatus === 'READY') {
        readyCount += 1;
        totalActiveWeight += weight;
      }
    });

    return {
      draftCount,
      readyCount,
      packagesInDraft,
      totalActiveWeight: Number(totalActiveWeight.toFixed(2)),
    };
  }, [hubManifests]);

  // Filtered & Sorted Manifests (Rule 15: 1. DRAFT, 2. READY, 3. Nearest Departure, 4. Newest)
  const filteredManifests = useMemo(() => {
    return hubManifests
      .filter((m) => {
        const canonicalStatus = normalizeManifestStatus(m.status || m.currentStatus);

        if (statusFilter !== 'ALL' && canonicalStatus !== statusFilter) {
          return false;
        }

        const relatedTrip = trips.find((t) => t.id === m.tripId);

        if (routeFilter === 'JO_TO_DZ') {
          if (m.originHubId !== 'hub-amm' && relatedTrip?.originHubId !== 'hub-amm') return false;
        } else if (routeFilter === 'DZ_TO_JO') {
          if (m.originHubId !== 'hub-alg' && relatedTrip?.originHubId !== 'hub-alg') return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const idMatch = (m.id || '').toLowerCase().includes(q) || (m.manifestCode || '').toLowerCase().includes(q) || (m.manifestNumber || '').toLowerCase().includes(q);
          const flightMatch = (m.flightNumber || relatedTrip?.flightNumber || '').toLowerCase().includes(q);
          const travelerMatch = (m.travelerName || m.assignedTravelerName || relatedTrip?.travelerName || '').toLowerCase().includes(q);
          const tripIdMatch = (m.tripId || '').toLowerCase().includes(q);

          return idMatch || flightMatch || travelerMatch || tripIdMatch;
        }

        return true;
      })
      .sort((a, b) => {
        const statusA = normalizeManifestStatus(a.status || a.currentStatus);
        const statusB = normalizeManifestStatus(b.status || b.currentStatus);

        // 1. DRAFT first
        if (statusA === 'DRAFT' && statusB !== 'DRAFT') return -1;
        if (statusB === 'DRAFT' && statusA !== 'DRAFT') return 1;

        // 2. READY second
        if (statusA === 'READY' && statusB !== 'READY') return -1;
        if (statusB === 'READY' && statusA !== 'READY') return 1;

        // 3. Nearest departure date
        const tripA = trips.find((t) => t.id === a.tripId);
        const tripB = trips.find((t) => t.id === b.tripId);
        const depA = tripA?.departureTime ? new Date(tripA.departureTime).getTime() : 0;
        const depB = tripB?.departureTime ? new Date(tripB.departureTime).getTime() : 0;
        if (depA !== depB && depA > 0 && depB > 0) return depA - depB;

        // 4. Newest created
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [hubManifests, statusFilter, routeFilter, searchQuery, trips]);

  // Selected Manifest object
  const activeManifest = useMemo(() => {
    if (!selectedManifestId) return null;
    return manifests.find((m) => m.id === selectedManifestId) || null;
  }, [selectedManifestId, manifests]);

  const activeTrip = useMemo(() => {
    if (!activeManifest) return null;
    return trips.find((t) => t.id === activeManifest.tripId) || null;
  }, [activeManifest, trips]);

  // Shipments currently included in the active manifest
  const activeManifestShipments = useMemo(() => {
    if (!activeManifest) return [];
    return activeManifest.shipmentIds
      .map((id) => shipments.find((s) => s.id === id))
      .filter(Boolean) as Shipment[];
  }, [activeManifest, shipments]);

  // All active shipments assigned to the same trip
  const allAssignedShipmentsForActiveTrip = useMemo(() => {
    if (!activeTrip) return [];
    return shipments.filter(
      (s) => s.assignedTripId === activeTrip.id && s.currentStatus === 'ASSIGNED_TO_TRIP'
    );
  }, [activeTrip, shipments]);

  // Shipments assigned to this trip but NOT yet inside this manifest
  const assignedShipmentsOutsideManifest = useMemo(() => {
    if (!activeManifest) return [];
    return allAssignedShipmentsForActiveTrip.filter(
      (s) => !activeManifest.shipmentIds.includes(s.id)
    );
  }, [allAssignedShipmentsForActiveTrip, activeManifest]);

  // Dynamic manifest weight calculation (Rule 29)
  const currentManifestWeight = useMemo(() => {
    return Number(
      activeManifestShipments
        .reduce((sum, s) => sum + (s.actualWeightKg ?? s.estimatedWeightKg ?? 0), 0)
        .toFixed(2)
    );
  }, [activeManifestShipments]);

  // Trip capacity metrics (Rules 30, 31, 32)
  const capacityMetrics = useMemo(() => {
    const tripCapacity = activeTrip?.availableWeightKg || 0;
    const allocatedWeight = activeTrip?.allocatedWeightKg || 0;
    const manifestWeight = currentManifestWeight;
    const remainingCapacity = Math.max(0, Number((tripCapacity - manifestWeight).toFixed(2)));
    const isExceeded = manifestWeight > tripCapacity;

    return {
      tripCapacity,
      allocatedWeight,
      manifestWeight,
      remainingCapacity,
      isExceeded,
    };
  }, [activeTrip, currentManifestWeight]);

  // Blocking incidents on trip or included shipments (Rule 57)
  const blockingIncidents = useMemo(() => {
    if (!activeManifest || !activeTrip) return [];
    return operationalIncidents.filter((inc) => {
      if (inc.status !== 'OPEN' && inc.status !== 'ACTION_REQUIRED') return false;
      const onTrip = inc.flightNumber === activeTrip.flightNumber || inc.relatedManifestId === activeManifest.id;
      const onShipment = inc.trackingNumber && activeManifestShipments.some((s) => s.trackingNumber === inc.trackingNumber);
      return onTrip || onShipment;
    });
  }, [activeManifest, activeTrip, operationalIncidents, activeManifestShipments]);

  // Readiness Checklist (Rules 41, 80, 84)
  const readinessChecklist = useMemo(() => {
    if (!activeManifest || !activeTrip) return null;

    const checks = [
      {
        id: 'trip_valid',
        labelAr: 'الرحلة الجوية سارية وقيد التشغيل',
        labelEn: 'Trip valid and operational',
        pass: activeTrip.status !== 'CANCELLED' && activeTrip.status !== 'REJECTED' && activeTrip.status !== 'SUBMITTED',
        failReasonAr: 'الرحلة غير مؤكدة أو تم إلغاؤها',
        failReasonEn: 'Trip is not confirmed or cancelled',
      },
      {
        id: 'traveler_valid',
        labelAr: 'المسافر معتمد وموثق الهوية (KYC Verified)',
        labelEn: 'Traveler KYC verified',
        pass: activeTrip.kycStatus === 'VERIFIED' || !!activeTrip.travelerName,
        failReasonAr: 'بيانات المسافر أو التحقق غير مكتمل',
        failReasonEn: 'Traveler KYC not verified',
      },
      {
        id: 'flight_valid',
        labelAr: 'رقم الرحلة وموعد الإقلاع معتمد',
        labelEn: 'Flight number and departure time verified',
        pass: !!activeTrip.flightNumber && !!activeTrip.departureTime,
        failReasonAr: 'بيانات موعد الإقلاع أو الرحلة ناقصة',
        failReasonEn: 'Flight number or departure time missing',
      },
      {
        id: 'route_valid',
        labelAr: 'تطابق المسار الجوي بين الطرود والرحلة',
        labelEn: 'Route matches origin and destination hubs',
        pass: activeManifestShipments.every(
          (s) => s.originHubId === activeTrip.originHubId && s.destinationHubId === activeTrip.destinationHubId
        ),
        failReasonAr: 'يوجد عدم تطابق في مسار أحد الطرود مع الرحلة',
        failReasonEn: 'Route mismatch detected in packages',
      },
      {
        id: 'min_packages',
        labelAr: 'يحتوي المانيفست على طرد واحد على الأقل',
        labelEn: 'Manifest contains at least one package',
        pass: activeManifestShipments.length > 0,
        failReasonAr: 'المانيفست لا يحتوي على أي طرود',
        failReasonEn: 'Manifest has no packages',
      },
      {
        id: 'actual_weight',
        labelAr: 'جميع الطرود مفحوصة وموزونة بوزن فعلي (> 0 كغم)',
        labelEn: 'All packages have actual weight recorded',
        pass: activeManifestShipments.length > 0 && activeManifestShipments.every((s) => (s.actualWeightKg ?? 0) > 0),
        failReasonAr: 'يوجد طرد بدون وزن فعلي مسجل من الفحص',
        failReasonEn: 'Package missing actual weight record',
      },
      {
        id: 'seals_valid',
        labelAr: 'جميع الطرود مختومة أمنياً برقم قفل مشفر ساري',
        labelEn: 'All packages have valid security seals',
        pass: activeManifestShipments.length > 0 && activeManifestShipments.every((s) => !!s.securitySealId && s.securitySealId.trim() !== ''),
        failReasonAr: 'أحد الطرود ينقصه رقم الختم الأمني المشفر',
        failReasonEn: 'Missing security seal on a package',
      },
      {
        id: 'capacity_guard',
        labelAr: 'وزن المانيفست لا يتجاوز السعة المتاحة للرحلة',
        labelEn: 'Total weight within trip available capacity',
        pass: !capacityMetrics.isExceeded,
        failReasonAr: `الوزن (${capacityMetrics.manifestWeight} كغم) يتجاوز سعة الرحلة (${capacityMetrics.tripCapacity} كغم)`,
        failReasonEn: `Total weight exceeds available capacity`,
      },
      {
        id: 'all_assigned_included',
        labelAr: 'جميع الطرود المسندة للرحلة مشمولة بالمانيفست',
        labelEn: 'All packages assigned to trip are included',
        pass: assignedShipmentsOutsideManifest.length === 0,
        failReasonAr: `يوجد (${assignedShipmentsOutsideManifest.length}) طرد مسند لم يضم للمانيفست بعد`,
        failReasonEn: `${assignedShipmentsOutsideManifest.length} assigned package(s) missing from manifest`,
      },
      {
        id: 'no_blocking_incidents',
        labelAr: 'خلو الرحلة والطرود من أي بلاغ تشغيلي معلّق',
        labelEn: 'No blocking operational incidents',
        pass: blockingIncidents.length === 0,
        failReasonAr: 'يوجد بلاغ تشغيلي مفتوح يعيق إصدار المانيفست',
        failReasonEn: 'Blocking operational incident reported',
      },
    ];

    const passedCount = checks.filter((c) => c.pass).length;
    const totalCount = checks.length;
    const isAllPass = passedCount === totalCount;

    return {
      checks,
      passedCount,
      totalCount,
      isAllPass,
    };
  }, [activeManifest, activeTrip, activeManifestShipments, capacityMetrics, assignedShipmentsOutsideManifest, blockingIncidents]);

  // Eligible Trips for creating a new manifest (Rules 18, 19)
  const eligibleTripsForCreation = useMemo(() => {
    return trips.filter((t) => {
      // Must belong to current Hub scope
      if (t.originHubId !== currentHub.id && t.originHubId) return false;

      // Must be PACKAGES_LINKED or CONFIRMED with assigned shipments
      if (t.status === 'CANCELLED' || t.status === 'REJECTED' || t.status === 'COMPLETED') return false;

      // Check if trip already has an active manifest (status not CANCELLED)
      const hasActiveManifest = hubManifests.some(
        (m) => m.tripId === t.id && normalizeManifestStatus(m.status || m.currentStatus) !== 'CANCELLED'
      );
      if (hasActiveManifest) return false;

      // Must have at least one shipment assigned to this trip
      const assignedCount = shipments.filter(
        (s) => s.assignedTripId === t.id && s.currentStatus === 'ASSIGNED_TO_TRIP'
      ).length;

      return assignedCount > 0;
    });
  }, [trips, currentHub.id, hubManifests, shipments]);

  // Helper for Route Name Display
  const getOriginDisplay = (hubId?: string) => {
    if (hubId === 'hub-amm') return isAr ? 'عمّان (AMM)' : 'Amman (AMM)';
    if (hubId === 'hub-alg') return isAr ? 'الجزائر (ALG)' : 'Algiers (ALG)';
    return hubId || '—';
  };

  const getDestinationDisplay = (hubId?: string) => {
    if (hubId === 'hub-alg') return isAr ? 'الجزائر (ALG)' : 'Algiers (ALG)';
    if (hubId === 'hub-amm') return isAr ? 'عمّان (AMM)' : 'Amman (AMM)';
    return hubId || '—';
  };

  // ACTION: Create Manifest from Trip (Rules 20, 21, 22)
  const handleCreateManifestFromTrip = async (trip: Trip) => {
    // Check if manifest already exists for this trip (Rule 5: No Duplicate Active Manifest)
    const existingManifest = hubManifests.find(
      (m) => m.tripId === trip.id && normalizeManifestStatus(m.status || m.currentStatus) !== 'CANCELLED'
    );
    if (existingManifest) {
      setIsCreateModalOpen(false);
      setSelectedManifestId(existingManifest.id);
      return;
    }

    // Grab all shipments assigned to this trip
    const assignedShipments = shipments.filter(
      (s) => s.assignedTripId === trip.id && s.currentStatus === 'ASSIGNED_TO_TRIP'
    );

    const shipmentIds = assignedShipments.map((s) => s.id);
    const totalWeight = Number(
      assignedShipments
        .reduce((sum, s) => sum + (s.actualWeightKg ?? s.estimatedWeightKg ?? 0), 0)
        .toFixed(2)
    );

    const now = new Date();
    const dateCode = now.toISOString().slice(2, 10).replace(/-/g, '');
    const randNum = String(Math.floor(Math.random() * 900) + 100);
    const manifestId = `MF-${currentHub.code}-${dateCode}-${randNum}`;

    const newManifest: Manifest = {
      id: manifestId,
      manifestCode: `MF-${currentHub.code}-${trip.flightNumber}`,
      manifestNumber: manifestId,
      tripId: trip.id,
      travelerId: trip.travelerId,
      travelerName: trip.travelerName,
      airline: trip.airline,
      flightNumber: trip.flightNumber,
      originHubId: trip.originHubId,
      destinationHubId: trip.destinationHubId,
      dispatchedByAgentId: currentUser?.id || 'usr-agent-303',
      shipmentIds,
      totalPackages: shipmentIds.length,
      totalShipmentsCount: shipmentIds.length,
      totalWeightKg: totalWeight,
      totalDeclaredValue: assignedShipments.reduce((sum, s) => sum + (s.declaredValue || 0), 0),
      handoverQrSecret: `HMAC_TK_${manifestId}_${Date.now()}`,
      status: 'DRAFT',
      currentStatus: 'DRAFT',
      tamperSealIds: assignedShipments.map((s) => s.securitySealId).filter(Boolean) as string[],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    if (onCreateManifest) {
      await onCreateManifest(newManifest);
    }

    setIsCreateModalOpen(false);
    setSelectedManifestId(newManifest.id);
    setSuccessBanner(
      isAr
        ? `تم إنشاء مسودة المانيفست [${manifestId}] بنجاح وتضمين (${shipmentIds.length}) طرد مسند.`
        : `Manifest draft [${manifestId}] created successfully with (${shipmentIds.length}) assigned parcels.`
    );
    onRefreshData();
  };

  // ACTION: Add Shipments to DRAFT Manifest (Rules 33, 34, 35)
  const handleConfirmAddShipments = () => {
    if (!activeManifest || selectedShipmentIdsToAdd.length === 0) return;

    const updatedShipmentIds = Array.from(new Set([...activeManifest.shipmentIds, ...selectedShipmentIdsToAdd]));
    const updatedShipments = updatedShipmentIds
      .map((id) => shipments.find((s) => s.id === id))
      .filter(Boolean) as Shipment[];

    const updatedWeight = Number(
      updatedShipments
        .reduce((sum, s) => sum + (s.actualWeightKg ?? s.estimatedWeightKg ?? 0), 0)
        .toFixed(2)
    );

    const updatedManifest: Manifest = {
      ...activeManifest,
      shipmentIds: updatedShipmentIds,
      totalPackages: updatedShipmentIds.length,
      totalShipmentsCount: updatedShipmentIds.length,
      totalWeightKg: updatedWeight,
      tamperSealIds: updatedShipments.map((s) => s.securitySealId).filter(Boolean) as string[],
      updatedAt: new Date().toISOString(),
    };

    if (onUpdateManifest) {
      onUpdateManifest(updatedManifest);
    }

    setIsAddShipmentModalOpen(false);
    setSelectedShipmentIdsToAdd([]);
    setSuccessBanner(
      isAr
        ? `تمت إضافة (${selectedShipmentIdsToAdd.length}) طرد إلى مسودة المانيفست بنجاح.`
        : `Added (${selectedShipmentIdsToAdd.length}) parcel(s) to draft manifest successfully.`
    );
  };

  // ACTION: Remove Shipment from DRAFT Manifest (Rules 36, 37, 38)
  // Crucial: Shipment remains ASSIGNED_TO_TRIP! Trip remains PACKAGES_LINKED!
  const handleConfirmRemoveShipment = () => {
    if (!activeManifest || !shipmentToRemove) return;

    const updatedShipmentIds = activeManifest.shipmentIds.filter((id) => id !== shipmentToRemove.id);
    const updatedShipments = updatedShipmentIds
      .map((id) => shipments.find((s) => s.id === id))
      .filter(Boolean) as Shipment[];

    const updatedWeight = Number(
      updatedShipments
        .reduce((sum, s) => sum + (s.actualWeightKg ?? s.estimatedWeightKg ?? 0), 0)
        .toFixed(2)
    );

    const updatedManifest: Manifest = {
      ...activeManifest,
      shipmentIds: updatedShipmentIds,
      totalPackages: updatedShipmentIds.length,
      totalShipmentsCount: updatedShipmentIds.length,
      totalWeightKg: updatedWeight,
      tamperSealIds: updatedShipments.map((s) => s.securitySealId).filter(Boolean) as string[],
      updatedAt: new Date().toISOString(),
    };

    if (onUpdateManifest) {
      onUpdateManifest(updatedManifest);
    }

    setShipmentToRemove(null);
    setSuccessBanner(
      isAr
        ? `تم استبعاد الطرد [${shipmentToRemove.trackingNumber}] من المانيفست. يبقى الطرد مسنداً للرحلة بانتظار معالجته.`
        : `Package [${shipmentToRemove.trackingNumber}] removed from draft manifest. Assignment to trip is preserved.`
    );
  };

  // ACTION: Mark Manifest READY (Rules 42, 43, 44, 45)
  // Crucial:
  // Manifest: DRAFT -> READY
  // Shipment: remains ASSIGNED_TO_TRIP (NOT IN_TRANSIT)
  // Trip: remains PACKAGES_LINKED (NOT DISPATCHED)
  const handleConfirmMarkReady = () => {
    if (!activeManifest || !readinessChecklist?.isAllPass) return;

    const handoverToken = generateCryptographicHandoverToken({
      manifestId: activeManifest.id,
      travelerId: activeManifest.travelerId,
      agentId: currentUser?.id || 'usr-agent-303',
      totalWeightKg: currentManifestWeight,
      packageCount: activeManifest.shipmentIds.length,
      timestamp: new Date().toISOString(),
    });

    const updatedManifest: Manifest = {
      ...activeManifest,
      status: 'READY',
      currentStatus: 'READY',
      handoverQrSecret: handoverToken,
      handoverToken,
      totalPackages: activeManifest.shipmentIds.length,
      totalShipmentsCount: activeManifest.shipmentIds.length,
      totalWeightKg: currentManifestWeight,
      updatedAt: new Date().toISOString(),
    };

    if (onUpdateManifest) {
      onUpdateManifest(updatedManifest);
    }

    setIsMarkReadyModalOpen(false);
    setSuccessBanner(
      isAr
        ? `تم اعتماد المانيفست [${activeManifest.id}] بنجاح وحالته الآن READY. تم قفل المحتويات وتوليد رمز التسليم الرقمي.`
        : `Manifest [${activeManifest.id}] successfully marked READY. Contents are now locked and handover token generated.`
    );
    onRefreshData();
  };

  return (
    <div className="space-y-6">
      {/* Header (Rule 9) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900">
                  {isAr ? 'المانيفست' : 'Manifests'}
                </h1>
                <span className="text-xs font-mono font-bold text-slate-400">/ Flight Manifests</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? 'إدارة قوائم الطرود المسندة إلى الرحلات ومراجعة الوزن والأختام قبل تسليمها للمسافر.'
                  : 'Manage shipment manifests assigned to flights, verify weight and security seals prior to traveler handover.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Current Hub Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-amber-600" />
            <span>{isAr ? currentHub.nameAr : currentHub.nameEn}</span>
            <span className="font-mono text-[11px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded-md">
              {currentHub.code}
            </span>
          </div>

          {/* Action: Create Manifest */}
          {canCreate && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-xs shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إنشاء مانيفست جديد' : 'Create Manifest'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1 hover:bg-emerald-100 rounded-lg cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* 4 KPI Cards (Rule 10) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Draft Manifests */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500">
              {isAr ? 'مسودات المانيفست' : 'Draft Manifests'}
            </div>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {kpiData.draftCount}
            </div>
          </div>
        </div>

        {/* KPI 2: Ready for Handover */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500">
              {isAr ? 'جاهز للتسليم' : 'Ready for Handover'}
            </div>
            <div className="text-xl font-black text-teal-800 mt-0.5">
              {kpiData.readyCount}
            </div>
          </div>
        </div>

        {/* KPI 3: Packages in Draft */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500">
              {isAr ? 'طرود بالمسودات' : 'Packages in Draft'}
            </div>
            <div className="text-xl font-black text-indigo-900 mt-0.5">
              {kpiData.packagesInDraft}
            </div>
          </div>
        </div>

        {/* KPI 4: Total Manifest Weight */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500">
              {isAr ? 'وزن المانيفستات النشطة' : 'Manifest Total Weight'}
            </div>
            <div className="text-xl font-black text-amber-800 mt-0.5">
              {kpiData.totalActiveWeight} <span className="text-xs font-bold text-slate-500">كغم</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout Area: Manifests List + Workbench / Inspection */}
      <div className="space-y-6">
        {/* Search & Filters Bar (Rules 13, 14) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isAr
                  ? 'البحث برقم المانيفست، رقم الرحلة، اسم المسافر...'
                  : 'Search by Manifest ID, Flight #, Traveler...'
              }
              className="w-full ps-9 pe-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
            >
              <option value="ALL">{isAr ? 'كل الحالات' : 'All Statuses'}</option>
              <option value="DRAFT">{isAr ? 'مسودة (DRAFT)' : 'Draft'}</option>
              <option value="READY">{isAr ? 'جاهز للتسليم (READY)' : 'Ready for Handover'}</option>
              <option value="HANDED_OVER">{isAr ? 'تم التسليم للمسافر' : 'Handed Over'}</option>
              <option value="IN_TRANSIT">{isAr ? 'قيد النقل الجوي' : 'In Transit'}</option>
              <option value="ARRIVED">{isAr ? 'وصل فرع الوصول' : 'Arrived'}</option>
              <option value="CLOSED">{isAr ? 'مغلق ومطابق' : 'Closed'}</option>
              <option value="CANCELLED">{isAr ? 'ملغي' : 'Cancelled'}</option>
            </select>

            {/* Route Filter */}
            <select
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
            >
              <option value="ALL">{isAr ? 'كل المسارات' : 'All Routes'}</option>
              <option value="JO_TO_DZ">{isAr ? 'عمّان ← الجزائر' : 'AMM → ALG'}</option>
              <option value="DZ_TO_JO">{isAr ? 'الجزائر ← عمّان' : 'ALG → AMM'}</option>
            </select>

            {(statusFilter !== 'ALL' || routeFilter !== 'ALL' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ALL');
                  setRouteFilter('ALL');
                  setSearchQuery('');
                }}
                className="px-2.5 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                {isAr ? 'إعادة ضبط' : 'Reset'}
              </button>
            )}
          </div>
        </div>

        {/* Selected Manifest Active Workbench Panel (Rules 25-45) */}
        {activeManifest && (
          <div className="bg-white rounded-2xl border-2 border-amber-400 shadow-md overflow-hidden animate-in fade-in">
            {/* Active Manifest Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-sm sm:text-base font-black text-amber-400 tracking-wider">
                    {activeManifest.manifestNumber || activeManifest.id}
                  </span>
                  <StatusBadge domain="MANIFEST" status={activeManifest.status || activeManifest.currentStatus || 'DRAFT'} locale={locale} size="sm" />
                  {normalizeManifestStatus(activeManifest.status || activeManifest.currentStatus) === 'READY' && (
                    <span className="text-[11px] font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-md border border-teal-500/30">
                      {isAr ? 'محتويات المانيفست مقفلة وجاهزة للتسليم للمسافر' : 'Contents locked — ready for traveler handover'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300 font-medium flex-wrap pt-0.5">
                  <div className="flex items-center gap-1">
                    <Plane className="w-3.5 h-3.5 text-amber-400" />
                    <span>{activeTrip?.airline || activeManifest.airline} ({activeTrip?.flightNumber || activeManifest.flightNumber})</span>
                  </div>
                  <span>•</span>
                  <div>{activeTrip?.travelerName || activeManifest.travelerName || '—'}</div>
                  <span>•</span>
                  <div className="font-bold text-amber-300">
                    {getOriginDisplay(activeManifest.originHubId)} ← {getDestinationDisplay(activeManifest.destinationHubId)}
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {activeTrip?.departureTime
                        ? new Date(activeTrip.departureTime).toLocaleString(isAr ? 'ar-JO' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Controls */}
              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-between md:justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedManifestForQr(activeManifest)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{isAr ? 'رمز QR المشفر' : 'Handover Token QR'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedManifestId(null)}
                  className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs border border-slate-700 transition-colors cursor-pointer"
                >
                  {isAr ? 'إغلاق المعاينة' : 'Close View'}
                </button>
              </div>
            </div>

            {/* Capacity & Weight Dashboard Strip (Rules 30, 31, 32) */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="text-slate-500 font-bold text-[11px]">{isAr ? 'سعة الرحلة المعتمدة' : 'Trip Capacity'}</div>
                <div className="text-base font-black text-slate-900 mt-1">
                  {capacityMetrics.tripCapacity.toFixed(2)} <span className="text-[11px] font-normal text-slate-500">كغم</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="text-slate-500 font-bold text-[11px]">{isAr ? 'وزن المانيفست الفعلي' : 'Manifest Weight'}</div>
                <div className={`text-base font-black mt-1 ${capacityMetrics.isExceeded ? 'text-rose-600' : 'text-amber-800'}`}>
                  {capacityMetrics.manifestWeight.toFixed(2)} <span className="text-[11px] font-normal text-slate-500">كغم</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="text-slate-500 font-bold text-[11px]">{isAr ? 'السعة الشاغرة بعد المانيفست' : 'Remaining Capacity'}</div>
                <div className="text-base font-black text-emerald-700 mt-1">
                  {capacityMetrics.remainingCapacity.toFixed(2)} <span className="text-[11px] font-normal text-slate-500">كغم</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="text-slate-500 font-bold text-[11px]">{isAr ? 'عدد الطرود المشمولة' : 'Included Packages'}</div>
                <div className="text-base font-black text-indigo-900 mt-1">
                  {activeManifestShipments.length} <span className="text-[11px] font-normal text-slate-500">{isAr ? 'طرد' : 'pkgs'}</span>
                </div>
              </div>
            </div>

            {/* Warnings Section (Capacity Exceeded / Assigned Shipments Missing / Blocking Incidents) */}
            <div className="p-4 space-y-2 border-b border-slate-200">
              {capacityMetrics.isExceeded && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    {isAr
                      ? `تحذير حرج: وزن المانيفست (${capacityMetrics.manifestWeight} كغم) يتجاوز سعة الرحلة المتاحة (${capacityMetrics.tripCapacity} كغم). لا يمكن اعتماد المانيفست حتى خفض الوزن.`
                      : `Critical: Manifest total weight exceeds trip capacity. Mark Ready is blocked.`}
                  </span>
                </div>
              )}

              {assignedShipmentsOutsideManifest.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-bold flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {isAr
                        ? `تنبيه: يوجد (${assignedShipmentsOutsideManifest.length}) طرد مسند لهذه الرحلة خارج المانيفست (إجمالي: ${assignedShipmentsOutsideManifest.reduce((s, p) => s + (p.actualWeightKg || p.estimatedWeightKg || 0), 0).toFixed(2)} كغم).`
                        : `Notice: (${assignedShipmentsOutsideManifest.length}) assigned parcel(s) are currently outside this manifest.`}
                    </span>
                  </div>
                  {normalizeManifestStatus(activeManifest.status || activeManifest.currentStatus) === 'DRAFT' && canCreate && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedShipmentIdsToAdd(assignedShipmentsOutsideManifest.map((s) => s.id));
                        setIsAddShipmentModalOpen(true);
                      }}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                    >
                      {isAr ? 'ضم الطرود المتبقية' : 'Add Missing Packages'}
                    </button>
                  )}
                </div>
              )}

              {blockingIncidents.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 font-bold flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    {isAr
                      ? `يوجد (${blockingIncidents.length}) بلاغ تشغيلي مفتوح يعيق اعتماد المانيفست. يجب تسوية البلاغ أولاً.`
                      : `Operational incident is blocking this manifest. Incident resolution required.`}
                  </span>
                </div>
              )}
            </div>

            {/* Packages Table & Controls (Rules 26, 27, 28) */}
            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    {isAr ? 'الطرود المشمولة في المانيفست' : 'Shipment Items in Manifest'} ({activeManifestShipments.length})
                  </h3>
                </div>

                {normalizeManifestStatus(activeManifest.status || activeManifest.currentStatus) === 'DRAFT' && canCreate && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedShipmentIdsToAdd([]);
                      setIsAddShipmentModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إضافة طرد مسند' : 'Add Assigned Package'}</span>
                  </button>
                )}
              </div>

              {activeManifestShipments.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-500 text-xs">
                  <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <div className="font-bold text-slate-700">
                    {isAr ? 'هذا المانيفست لا يحتوي على أي طرود حالياً' : 'This manifest has no packages currently'}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {isAr
                      ? 'قم بإضافة الطرود المسندة لنفس الرحلة لمتابعة تجهيز المانيفست واعتماده.'
                      : 'Add packages assigned to this trip to proceed with verification.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-start">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3 text-start">{isAr ? 'رقم التتبع' : 'Tracking #'}</th>
                        <th className="p-3 text-start">{isAr ? 'الوصف والتصنيف' : 'Description'}</th>
                        <th className="p-3 text-start">{isAr ? 'الوزن الفعلي' : 'Actual Weight'}</th>
                        <th className="p-3 text-start">{isAr ? 'الختم الأمني' : 'Security Seal'}</th>
                        <th className="p-3 text-start">{isAr ? 'حالة الطرد' : 'Status'}</th>
                        {normalizeManifestStatus(activeManifest.status || activeManifest.currentStatus) === 'DRAFT' && canCreate && (
                          <th className="p-3 text-center">{isAr ? 'الإجراء' : 'Action'}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {activeManifestShipments.map((shipment) => {
                        const actualWeight = shipment.actualWeightKg ?? shipment.estimatedWeightKg ?? 0;
                        const hasValidSeal = !!shipment.securitySealId && shipment.securitySealId.trim() !== '';

                        return (
                          <tr key={shipment.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3 font-mono font-bold text-slate-900">
                              {shipment.trackingNumber}
                            </td>
                            <td className="p-3 max-w-[200px] truncate text-slate-600">
                              {shipment.itemDescription}
                            </td>
                            <td className="p-3">
                              {actualWeight > 0 ? (
                                <span className="font-black text-amber-900 font-mono">
                                  {actualWeight.toFixed(2)} كغم
                                </span>
                              ) : (
                                <span className="text-rose-600 font-bold flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  {isAr ? 'غير موزون' : 'Missing Weight'}
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              {hasValidSeal ? (
                                <div className="flex items-center gap-1 font-mono text-[11px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 w-fit">
                                  <Lock className="w-3 h-3 text-teal-600" />
                                  <span>{shipment.securitySealId}</span>
                                </div>
                              ) : (
                                <span className="text-rose-600 font-bold flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  {isAr ? 'بدون ختم أمني' : 'No Seal'}
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              {/* Shipment remains ASSIGNED_TO_TRIP in Stage 02! */}
                              <StatusBadge domain="SHIPMENT" status="ASSIGNED_TO_TRIP" locale={locale} size="sm" />
                            </td>
                            {normalizeManifestStatus(activeManifest.status || activeManifest.currentStatus) === 'DRAFT' && canCreate && (
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => setShipmentToRemove(shipment)}
                                  className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title={isAr ? 'استبعاد الطرد من المسودة' : 'Remove from manifest'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Readiness Checklist Card (Rules 41, 80) */}
              {readinessChecklist && normalizeManifestStatus(activeManifest.status || activeManifest.currentStatus) === 'DRAFT' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>{isAr ? 'قائمة التحقق الأمني والتشغيلي لجاهزية المانيفست' : 'Manifest Operational Readiness Checklist'}</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isAr
                          ? 'يجب استيفاء جميع المعايير الـ (10) لتفعيل اعتماد المانيفست وقفل محتوياته للتسليم.'
                          : 'All criteria must pass before locking and marking manifest READY.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                        readinessChecklist.isAllPass
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {readinessChecklist.passedCount} / {readinessChecklist.totalCount} {isAr ? 'مستوفى' : 'Passed'}
                      </span>
                    </div>
                  </div>

                  {/* Checklist Items Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                    {readinessChecklist.checks.map((item) => (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-colors ${
                          item.pass
                            ? 'bg-white border-slate-200 text-slate-800'
                            : 'bg-rose-50/70 border-rose-200 text-rose-900'
                        }`}
                      >
                        {item.pass ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className={`font-bold ${item.pass ? 'text-slate-800' : 'text-rose-900'}`}>
                            {isAr ? item.labelAr : item.labelEn}
                          </div>
                          {!item.pass && (
                            <div className="text-[11px] font-medium text-rose-700 mt-0.5">
                              {isAr ? item.failReasonAr : item.failReasonEn}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Mark Ready Action Bar */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
                    <div className="text-xs text-slate-500 font-medium">
                      {readinessChecklist.isAllPass ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          {isAr ? 'جميع الشروط مستوفاة بالكامل — المانيفست جاهز للاعتماد' : 'All checks verified — Ready to lock manifest'}
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4" />
                          {isAr ? 'تعذر الاعتماد — يوجد شروط تشغيلية غير مستوفاة أعلاه' : 'Cannot mark ready — unresolved checks above'}
                        </span>
                      )}
                    </div>

                    {canCreate && (
                      <button
                        type="button"
                        disabled={!readinessChecklist.isAllPass}
                        onClick={() => setIsMarkReadyModalOpen(true)}
                        className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isAr ? 'اعتماد المانيفست (جاهز للتسليم)' : 'Mark Manifest Ready'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Ready Status Read-Only Notice (Rule 45, 46) */}
              {normalizeManifestStatus(activeManifest.status || activeManifest.currentStatus) === 'READY' && (
                <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-black text-teal-950 text-xs sm:text-sm">
                        {isAr ? 'المانيفست معتمد ومقفل بالكامل (READY)' : 'Manifest Locked & Ready for Traveler Handover'}
                      </div>
                      <p className="text-[11px] text-teal-800 mt-0.5">
                        {isAr
                          ? 'تم تدقيق الأوزان والطرود والأختام وتوليد التوقيع الرقمي. هذا المانيفست جاهز الآن لمرحلة تسليم المسافر (Stage 03).'
                          : 'Weights, packages, and seals are fully locked. Manifest is now primed for Stage 03 — Traveler Handover.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedManifestForQr(activeManifest)}
                      className="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>{isAr ? 'رمز الاستلام' : 'Handover QR'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('TRAVELER_HANDOVER', { manifestId: activeManifest.id })}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 shadow-xs"
                    >
                      <Plane className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isAr ? 'تسليم للمسافر (Stage 03)' : 'Proceed to Handover'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manifests Table / Cards (Rules 11, 12, 16) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              {isAr ? 'قائمة المانيفستات' : 'Manifests List'} ({filteredManifests.length})
            </span>
          </div>

          {filteredManifests.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs space-y-3">
              <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300" />
              <div className="font-bold text-slate-700 text-sm">
                {isAr ? 'لا توجد مانيفستات حالياً' : 'No manifests found'}
              </div>
              <p className="text-slate-500 max-w-sm mx-auto text-xs">
                {isAr
                  ? 'ابدأ بإنشاء مانيفست لرحلة تحتوي على طرود تمت مطابقتها أو قم بتغيير معايير الفلترة.'
                  : 'Start by creating a manifest for a flight with assigned packages, or reset search filters.'}
              </p>
              {canCreate && eligibleTripsForCreation.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? 'إنشاء مانيفست من رحلة مطابقة' : 'Create Manifest from Linked Trip'}</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View (Rules 11, 12) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5 text-start">{isAr ? 'رقم المانيفست' : 'Manifest ID'}</th>
                      <th className="p-3.5 text-start">{isAr ? 'الرحلة والمسافر' : 'Flight & Traveler'}</th>
                      <th className="p-3.5 text-start">{isAr ? 'المسار وموعد الإقلاع' : 'Route & Departure'}</th>
                      <th className="p-3.5 text-start">{isAr ? 'عدد الطرود' : 'Packages'}</th>
                      <th className="p-3.5 text-start">{isAr ? 'وزن المانيفست' : 'Total Weight'}</th>
                      <th className="p-3.5 text-start">{isAr ? 'السعة المتبقية' : 'Remaining'}</th>
                      <th className="p-3.5 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="p-3.5 text-center">{isAr ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredManifests.map((m) => {
                      const trip = trips.find((t) => t.id === m.tripId);
                      const isSelected = selectedManifestId === m.id;
                      const pkgCount = m.shipmentIds?.length || m.totalPackages || m.totalShipmentsCount || 0;
                      const canonicalStatus = normalizeManifestStatus(m.status || m.currentStatus);

                      const tripCapacity = trip?.availableWeightKg || 0;
                      const remaining = Math.max(0, tripCapacity - (m.totalWeightKg || 0));

                      return (
                        <tr
                          key={m.id}
                          className={`transition-colors cursor-pointer ${
                            isSelected ? 'bg-amber-50/70 border-s-4 border-amber-500' : 'hover:bg-slate-50/70'
                          }`}
                          onClick={() => setSelectedManifestId(m.id)}
                        >
                          <td className="p-3.5 font-mono font-bold text-slate-900">
                            {m.manifestNumber || m.id}
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">
                              {trip?.airline || m.airline} ({trip?.flightNumber || m.flightNumber})
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                              {trip?.travelerName || m.travelerName || '—'}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-800">
                              {getOriginDisplay(m.originHubId)} → {getDestinationDisplay(m.destinationHubId)}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {trip?.departureTime
                                ? new Date(trip.departureTime).toLocaleString(isAr ? 'ar-JO' : 'en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '—'}
                            </div>
                          </td>
                          <td className="p-3.5 font-black text-indigo-950 font-mono">
                            {pkgCount} {isAr ? 'طرد' : 'pkgs'}
                          </td>
                          <td className="p-3.5 font-black text-amber-900 font-mono">
                            {(m.totalWeightKg || 0).toFixed(2)} كغم
                          </td>
                          <td className="p-3.5 font-black text-emerald-700 font-mono">
                            {remaining.toFixed(2)} كغم
                          </td>
                          <td className="p-3.5">
                            <StatusBadge domain="MANIFEST" status={m.status || m.currentStatus || 'DRAFT'} locale={locale} size="sm" />
                          </td>
                          <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedManifestId(m.id)}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
                              >
                                {isAr ? 'معاينة' : 'Open'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setDrawerManifest(m)}
                                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title={isAr ? 'تفاصيل المانيفست' : 'Details'}
                              >
                                <Info className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View (Rules 60, 61, 62) */}
              <div className="sm:hidden divide-y divide-slate-100">
                {filteredManifests.map((m) => {
                  const trip = trips.find((t) => t.id === m.tripId);
                  const isSelected = selectedManifestId === m.id;
                  const pkgCount = m.shipmentIds?.length || m.totalPackages || m.totalShipmentsCount || 0;
                  const canonicalStatus = normalizeManifestStatus(m.status || m.currentStatus);

                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedManifestId(m.id)}
                      className={`p-4 space-y-3 transition-colors cursor-pointer ${
                        isSelected ? 'bg-amber-50/80 border-s-4 border-amber-500' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-slate-900 text-xs">
                          {m.manifestNumber || m.id}
                        </span>
                        <StatusBadge domain="MANIFEST" status={m.status || m.currentStatus || 'DRAFT'} locale={locale} size="sm" />
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="font-bold text-slate-900">
                          {trip?.airline || m.airline} ({trip?.flightNumber || m.flightNumber})
                        </div>
                        <div className="text-slate-500 font-medium truncate max-w-[150px]">
                          {trip?.travelerName || m.travelerName || '—'}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded-xl">
                        <div className="font-bold text-slate-800">
                          {getOriginDisplay(m.originHubId)} → {getDestinationDisplay(m.destinationHubId)}
                        </div>
                        <div className="font-mono text-[11px]">
                          {trip?.departureTime
                            ? new Date(trip.departureTime).toLocaleDateString(isAr ? 'ar-JO' : 'en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : '—'}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-indigo-950">
                            {pkgCount} {isAr ? 'طرد' : 'pkgs'}
                          </span>
                          <span className="font-black text-amber-900">
                            {(m.totalWeightKg || 0).toFixed(2)} كغم
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedManifestId(m.id);
                          }}
                          className="px-3 py-1 bg-slate-900 text-white rounded-lg font-bold text-xs"
                        >
                          {isAr ? 'فتح المانيفست' : 'Open'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sticky Bottom Action Bar on Mobile (Rule 63) */}
      {activeManifest && normalizeManifestStatus(activeManifest.status || activeManifest.currentStatus) === 'DRAFT' && (
        <div className="sm:hidden fixed bottom-0 start-0 end-0 z-40 bg-white border-t border-slate-200 p-3 shadow-lg flex items-center justify-between gap-3">
          <div className="text-xs">
            <div className="font-bold text-slate-900">
              {activeManifestShipments.length} {isAr ? 'طرود' : 'Packages'} • {currentManifestWeight} كغم
            </div>
            <div className="text-[11px] text-slate-500">
              {readinessChecklist?.isAllPass
                ? (isAr ? 'المعايير مستوفاة' : 'Ready to lock')
                : (isAr ? 'يتطلب استيفاء الشروط' : 'Checks required')}
            </div>
          </div>

          <button
            type="button"
            disabled={!readinessChecklist?.isAllPass}
            onClick={() => setIsMarkReadyModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
          >
            {isAr ? 'اعتماد المانيفست' : 'Mark Ready'}
          </button>
        </div>
      )}

      {/* MODAL 1: Create Manifest from Eligible Trip (Rules 17, 18, 19, 20) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {isAr ? 'إنشاء مانيفست جديد من رحلة مسافر' : 'Create Flight Manifest'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isAr
                      ? 'اختر إحدى الرحلات المؤكدة التي تحتوي على طرود تمت مطابقتها لإصدار مسودة المانيفست.'
                      : 'Select a confirmed flight with assigned packages to create a new draft manifest.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 p-1">
              {eligibleTripsForCreation.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs">
                  <Plane className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <div className="font-bold text-slate-700">
                    {isAr ? 'لا توجد رحلات مؤهلة لإنشاء مانيفست حالياً' : 'No eligible trips available'}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                    {isAr
                      ? 'الرحلة المؤهلة يجب أن تكون مؤكدة، وتحتوي على طرد واحد على الأقل تمت مطابقتها معه، وألا تمتلك مانيفست نشطاً بالفعل.'
                      : 'Trips must have matched packages and not possess an active manifest.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      onNavigate('MATCHING');
                    }}
                    className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>{isAr ? 'الانتقال إلى شاشة المطابقة' : 'Go to Matching'}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              ) : (
                eligibleTripsForCreation.map((trip) => {
                  const assignedPkgs = shipments.filter(
                    (s) => s.assignedTripId === trip.id && s.currentStatus === 'ASSIGNED_TO_TRIP'
                  );
                  const assignedWeight = assignedPkgs.reduce(
                    (sum, s) => sum + (s.actualWeightKg ?? s.estimatedWeightKg ?? 0),
                    0
                  );
                  const remaining = Math.max(0, trip.availableWeightKg - assignedWeight);

                  return (
                    <div
                      key={trip.id}
                      className="p-4 bg-slate-50 hover:bg-amber-50/40 border border-slate-200 hover:border-amber-400 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">
                            {trip.airline} ({trip.flightNumber})
                          </span>
                          <span className="text-[11px] font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md">
                            PNR: {trip.pnrCode || 'PNR-OK'}
                          </span>
                          <StatusBadge domain="TRIP" status={trip.status} locale={locale} size="sm" />
                        </div>
                        <div className="text-slate-600 font-medium">
                          {isAr ? 'المسافر المعتمد:' : 'Traveler:'}{' '}
                          <span className="font-bold text-slate-800">{trip.travelerName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                          <span>
                            {getOriginDisplay(trip.originHubId)} → {getDestinationDisplay(trip.destinationHubId)}
                          </span>
                          <span>•</span>
                          <span>
                            {trip.departureTime
                              ? new Date(trip.departureTime).toLocaleString(isAr ? 'ar-JO' : 'en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                        <div className="text-end">
                          <div className="font-black text-indigo-900">
                            {assignedPkgs.length} {isAr ? 'طرود مسندة' : 'packages'}
                          </div>
                          <div className="text-[11px] text-amber-800 font-bold">
                            {assignedWeight.toFixed(2)} كغم / {trip.availableWeightKg} كغم
                          </div>
                          <div className="text-[10px] text-emerald-700 font-medium">
                            {isAr ? `متبقي: ${remaining.toFixed(2)} كغم` : `Rem: ${remaining.toFixed(2)} KG`}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCreateManifestFromTrip(trip)}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5 text-amber-400" />
                          <span>{isAr ? 'إنشاء المانيفست' : 'Create Manifest'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Assigned Shipment to DRAFT Manifest (Rules 33, 34, 35) */}
      {isAddShipmentModalOpen && activeManifest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {isAr ? 'إضافة طرود مسندة إلى المانيفست' : 'Add Assigned Packages to Manifest'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr
                    ? `عرض الطرود المسندة للرحلة [${activeTrip?.flightNumber}] وغير المدرجة في المسودة.`
                    : `Select packages assigned to flight [${activeTrip?.flightNumber}] to include.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddShipmentModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 p-1">
              {assignedShipmentsOutsideManifest.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                  <div className="font-bold text-slate-800">
                    {isAr
                      ? 'جميع الطرود المسندة لهذه الرحلة مضافة بالفعل إلى المانيفست'
                      : 'All packages assigned to this trip are already included in manifest'}
                  </div>
                </div>
              ) : (
                assignedShipmentsOutsideManifest.map((shipment) => {
                  const isChecked = selectedShipmentIdsToAdd.includes(shipment.id);
                  const actualWeight = shipment.actualWeightKg ?? shipment.estimatedWeightKg ?? 0;

                  return (
                    <div
                      key={shipment.id}
                      onClick={() => {
                        setSelectedShipmentIdsToAdd((prev) =>
                          isChecked ? prev.filter((id) => id !== shipment.id) : [...prev, shipment.id]
                        );
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 text-xs ${
                        isChecked
                          ? 'bg-amber-50/90 border-amber-400 ring-1 ring-amber-400'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="w-4 h-4 text-amber-600 rounded-sm"
                        />
                        <div>
                          <div className="font-mono font-bold text-slate-900">{shipment.trackingNumber}</div>
                          <div className="text-slate-500 text-[11px] truncate max-w-xs">{shipment.itemDescription}</div>
                          <div className="text-[10px] text-teal-800 font-mono flex items-center gap-1 mt-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            <span>{shipment.securitySealId || 'NO-SEAL'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-end font-mono font-bold text-amber-900">
                        {actualWeight.toFixed(2)} كغم
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selection Summary & Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
              <div className="text-xs font-bold text-slate-600">
                {selectedShipmentIdsToAdd.length > 0 && (
                  <span>
                    {isAr
                      ? `تم تحديد (${selectedShipmentIdsToAdd.length}) طرد بإجمالي وزن: ${selectedShipmentIdsToAdd
                          .map((id) => shipments.find((s) => s.id === id))
                          .reduce((s, p) => s + (p?.actualWeightKg || p?.estimatedWeightKg || 0), 0)
                          .toFixed(2)} كغم`
                      : `Selected (${selectedShipmentIdsToAdd.length}) parcel(s)`}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddShipmentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={selectedShipmentIdsToAdd.length === 0}
                  onClick={handleConfirmAddShipments}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-amber-400 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {isAr ? 'ضم إلى المانيفست' : 'Add to Manifest'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Remove Shipment from DRAFT Confirmation (Rules 36, 37, 38) */}
      {shipmentToRemove && activeManifest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {isAr ? 'تأكيد استبعاد الطرد من المانيفست' : 'Remove Package from Manifest?'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr ? 'مراجعة بيانات الطرد قبل الحذف من المسودة' : 'Confirm exclusion from current draft manifest'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'رقم التتبع:' : 'Tracking #:'}</span>
                <span className="font-mono font-bold text-slate-900">{shipmentToRemove.trackingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'الوزن الفعلي:' : 'Actual Weight:'}</span>
                <span className="font-black text-amber-800">
                  {(shipmentToRemove.actualWeightKg ?? shipmentToRemove.estimatedWeightKg ?? 0).toFixed(2)} كغم
                </span>
              </div>
            </div>

            <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 font-medium">
              {isAr
                ? 'ملاحظة: استبعاد الطرد من المانيفست لا يلغي إسناده للرحلة، بل يبقى الطرد في حالة (ASSIGNED_TO_TRIP) حتى إعادة ضمه أو إلغاء إسناده.'
                : 'Note: Removing package from manifest does not unassign it from the trip.'}
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShipmentToRemove(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveShipment}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
              >
                {isAr ? 'استبعاد الطرد' : 'Remove Package'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Confirm Mark Ready (Rules 42, 43, 44) */}
      {isMarkReadyModalOpen && activeManifest && activeTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {isAr ? 'تأكيد اعتماد المانيفست (MARK READY)' : 'Confirm Mark Manifest Ready'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr ? 'قفل محتويات المانيفست وتجهيزه لتسليم المسافر' : 'Lock manifest and prepare for traveler handover'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between pb-1.5 border-b border-slate-200">
                <span className="text-slate-500">{isAr ? 'رقم المانيفست:' : 'Manifest ID:'}</span>
                <span className="font-mono font-black text-slate-900">{activeManifest.manifestNumber || activeManifest.id}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-200">
                <span className="text-slate-500">{isAr ? 'الرحلة والمسافر:' : 'Flight & Traveler:'}</span>
                <span className="font-bold text-slate-900">
                  {activeTrip.airline} ({activeTrip.flightNumber}) • {activeTrip.travelerName}
                </span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-200">
                <span className="text-slate-500">{isAr ? 'المسار وموعد الإقلاع:' : 'Route & Departure:'}</span>
                <span className="font-bold text-slate-800">
                  {getOriginDisplay(activeManifest.originHubId)} → {getDestinationDisplay(activeManifest.destinationHubId)}
                </span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-200">
                <span className="text-slate-500">{isAr ? 'عدد الطرود المعتمدة:' : 'Packages Count:'}</span>
                <span className="font-black text-indigo-900 font-mono">{activeManifestShipments.length} {isAr ? 'طرد' : 'items'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'الوزن الإجمالي المحسوب:' : 'Total Weight:'}</span>
                <span className="font-black text-amber-800 font-mono">{currentManifestWeight.toFixed(2)} كغم</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-medium">
              <p className="font-bold text-emerald-950 mb-1">
                {isAr
                  ? 'هل تؤكد أن محتويات المانيفست تمت مراجعتها وأصبحت جاهزة للتسليم للمسافر؟'
                  : 'Do you confirm that all manifest items are verified and ready for traveler handover?'}
              </p>
              <p className="text-[11px] text-emerald-800">
                {isAr
                  ? 'بعد التأكيد، ستتحول حالة المانيفست إلى READY ويتم قفل إضافة أو إزالة الطرود تمهيداً لمرحلة تسليم المسافر (Stage 03).'
                  : 'Once confirmed, the manifest status becomes READY and package contents will be locked.'}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsMarkReadyModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmMarkReady}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md transition-colors cursor-pointer"
              >
                {isAr ? 'تأكيد الاعتماد (CONFIRM READY)' : 'Confirm Ready'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DetailsDrawer Integration (Rules 49, 50) */}
      <DetailsDrawer
        isOpen={!!drawerManifest}
        onClose={() => setDrawerManifest(null)}
        title={drawerManifest ? (drawerManifest.manifestNumber || drawerManifest.id) : ''}
        subtitle={
          drawerManifest
            ? `${getOriginDisplay(drawerManifest.originHubId)} → ${getDestinationDisplay(drawerManifest.destinationHubId)}`
            : ''
        }
        badge={
          drawerManifest ? (
            <StatusBadge domain="MANIFEST" status={drawerManifest.status || drawerManifest.currentStatus || 'DRAFT'} locale={locale} size="sm" />
          ) : undefined
        }
        icon={<FileSpreadsheet className="w-5 h-5" />}
        locale={locale}
      >
        {drawerManifest && (
          <div className="space-y-5 text-xs">
            {/* Trip Profile */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 border-b border-slate-200 pb-1.5">
                {isAr ? 'بيانات الرحلة والمسافر' : 'Flight & Traveler Information'}
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                <div>
                  <span className="text-slate-400 block">{isAr ? 'الرحلة:' : 'Flight:'}</span>
                  <span className="font-bold text-slate-800">{drawerManifest.airline || '—'} ({drawerManifest.flightNumber || '—'})</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{isAr ? 'المسافر:' : 'Traveler:'}</span>
                  <span className="font-bold text-slate-800">{drawerManifest.travelerName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{isAr ? 'عدد الطرود:' : 'Packages:'}</span>
                  <span className="font-bold text-indigo-950 font-mono">
                    {drawerManifest.shipmentIds?.length || drawerManifest.totalPackages || 0}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">{isAr ? 'الوزن الإجمالي:' : 'Total Weight:'}</span>
                  <span className="font-bold text-amber-900 font-mono">{(drawerManifest.totalWeightKg || 0).toFixed(2)} كغم</span>
                </div>
              </div>
            </div>

            {/* QR Token */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-slate-900">{isAr ? 'توقيع الاستلام المشفر' : 'Cryptographic Handover Token'}</div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isAr ? 'رمز تسليم المسافر عند كاونتر المغادرة' : 'Handover verification token'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedManifestForQr(drawerManifest);
                }}
                className="px-3 py-1.5 bg-slate-900 text-amber-400 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{isAr ? 'عرض QR' : 'Show QR'}</span>
              </button>
            </div>

            {/* Packages list */}
            <div className="space-y-2">
              <div className="font-bold text-slate-900">{isAr ? 'الطرود المدرجة' : 'Included Packages'}</div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {drawerManifest.shipmentIds.map((shipId) => {
                  const s = shipments.find((item) => item.id === shipId);
                  if (!s) return null;
                  return (
                    <div key={s.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-mono font-bold text-slate-900">{s.trackingNumber}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{s.itemDescription}</div>
                      </div>
                      <div className="text-end">
                        <div className="font-mono font-bold text-amber-900">
                          {(s.actualWeightKg ?? s.estimatedWeightKg ?? 0).toFixed(2)} كغم
                        </div>
                        <div className="text-[10px] text-teal-700 font-mono">{s.securitySealId}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedManifestId(drawerManifest.id);
                  setDrawerManifest(null);
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {isAr ? 'فتح المانيفست في لوحة العمل' : 'Open in Workbench'}
              </button>
            </div>
          </div>
        )}
      </DetailsDrawer>

      {/* QR Modal (Rule 20, 21) */}
      {selectedManifestForQr && (
        <QRModal
          isOpen={!!selectedManifestForQr}
          onClose={() => setSelectedManifestForQr(null)}
          token={selectedManifestForQr.handoverQrSecret || selectedManifestForQr.handoverToken || selectedManifestForQr.id}
          title={
            isAr
              ? `رمز تسليم المانيفست — ${selectedManifestForQr.manifestNumber || selectedManifestForQr.id}`
              : `Manifest Handover QR — ${selectedManifestForQr.manifestNumber || selectedManifestForQr.id}`
          }
          description={
            isAr
              ? 'رمز مشفر موثق أمنياً لمصادقة تسليم الطرود إلى المسافر في المرحلة التالية (Stage 03).'
              : 'Official cryptographic token for traveler dispatch verification in Stage 03.'
          }
          locale={locale}
        />
      )}
    </div>
  );
};
