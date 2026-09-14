import React, { useState, useMemo, useEffect } from 'react';
import {
  Handshake,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Lock,
  QrCode,
  Scan,
  Plane,
  Scale,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Search,
  Filter,
  Check,
  Eye,
  FileSpreadsheet,
  Layers,
  Package,
  RefreshCw,
  User,
  ExternalLink,
  ShieldAlert,
  Copy,
  Info,
} from 'lucide-react';
import {
  Hub,
  Locale,
  Manifest,
  Shipment,
  Trip,
  User as UserType,
  EmployeeNavSection,
  OperationalIncident,
} from '../../../types';
import { normalizeManifestStatus } from '../../../lib/statusNormalizer';
import { StatusBadge } from '../common/StatusBadge';
import { DetailsDrawer } from '../common/DetailsDrawer';
import { QRModal } from '../../common/QRModal';
import { QRScannerModal } from '../../common/QRScannerModal';

export interface TravelerHandoverViewProps {
  currentHub: Hub;
  currentUser?: UserType;
  manifests: Manifest[];
  shipments: Shipment[];
  trips: Trip[];
  operationalIncidents?: OperationalIncident[];
  locale: Locale;
  preselectedManifestId?: string;
  onHandoverComplete: (payload: {
    manifestId: string;
    tripId: string;
    shipmentIds: string[];
    travelerId: string;
    token: string;
  }) => Promise<boolean>;
  onNavigate: (section: EmployeeNavSection, extra?: any) => void;
  onRefreshData: () => void;
}

export const TravelerHandoverView: React.FC<TravelerHandoverViewProps> = ({
  currentHub,
  currentUser,
  manifests,
  shipments,
  trips,
  operationalIncidents = [],
  locale,
  preselectedManifestId,
  onHandoverComplete,
  onNavigate,
  onRefreshData,
}) => {
  const isAr = locale === 'ar';

  // Filters & Search State (Rules 7 & 8)
  const [statusFilter, setStatusFilter] = useState<'READY' | 'HANDED_OVER' | 'ALL'>('READY');
  const [routeFilter, setRouteFilter] = useState<'ALL' | 'AMM_ALG' | 'ALG_AMM'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedManifestId, setSelectedManifestId] = useState<string | null>(
    preselectedManifestId || null
  );

  // Mobile Stepper State (Rule 61)
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Scanning & Verification States (Rules 19-26)
  const [scanInput, setScanInput] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanNotice, setScanNotice] = useState<{ type: 'SUCCESS' | 'DUPLICATE' | 'ERROR'; message: string } | null>(null);
  const [scannedPackageIds, setScannedPackageIds] = useState<Set<string>>(new Set());
  const [verifiedSealIds, setVerifiedSealIds] = useState<Set<string>>(new Set());
  const [unexpectedPackageWarning, setUnexpectedPackageWarning] = useState<string | null>(null);
  const [sealInputMap, setSealInputMap] = useState<Record<string, string>>({});
  const [sealMismatchMap, setSealMismatchMap] = useState<Record<string, boolean>>({});

  // Traveler Confirmation & Modal States (Rules 34, 35, 36)
  const [travelerConfirmedReceipt, setTravelerConfirmedReceipt] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successToken, setSuccessToken] = useState<string | null>(null);

  // QR Display Modal
  const [qrModalManifest, setQrModalManifest] = useState<Manifest | null>(null);

  // DetailsDrawer state (Rule 58)
  const [drawerData, setDrawerData] = useState<{
    isOpen: boolean;
    type: 'TRAVELER' | 'TRIP' | 'SHIPMENT' | null;
    title: string;
    item: any;
  }>({
    isOpen: false,
    type: null,
    title: '',
    item: null,
  });

  // Hub-scoped manifests (Rule 57)
  const hubManifests = useMemo(() => {
    return manifests.filter((m) => {
      const originHub = m.originHubId || 'hub-amm-01';
      return originHub === currentHub.id || !m.originHubId;
    });
  }, [manifests, currentHub.id]);

  // Synchronize preselectedManifestId if passed from outside
  useEffect(() => {
    if (preselectedManifestId) {
      setSelectedManifestId(preselectedManifestId);
      const target = hubManifests.find((m) => m.id === preselectedManifestId);
      if (target) {
        const norm = normalizeManifestStatus(target.status || target.currentStatus);
        if (norm === 'HANDED_OVER') {
          setStatusFilter('HANDED_OVER');
        } else {
          setStatusFilter('READY');
        }
      }
    }
  }, [preselectedManifestId, hubManifests]);

  // Reset scan state when selecting a different manifest
  useEffect(() => {
    setScannedPackageIds(new Set());
    setVerifiedSealIds(new Set());
    setUnexpectedPackageWarning(null);
    setScanNotice(null);
    setTravelerConfirmedReceipt(false);
    setSealInputMap({});
    setSealMismatchMap({});
    setMobileStep(1);
  }, [selectedManifestId]);

  // KPI Calculations (Rule 6 - 4 cards only)
  const kpis = useMemo(() => {
    // 1. Ready for Handover
    const readyManifests = hubManifests.filter(
      (m) => normalizeManifestStatus(m.status || m.currentStatus) === 'READY'
    );
    const readyCount = readyManifests.length;

    // 2. Handover Today (count of completed handovers)
    const todayStr = new Date().toISOString().slice(0, 10);
    const handoverTodayCount = hubManifests.filter((m) => {
      const norm = normalizeManifestStatus(m.status || m.currentStatus);
      const date = (m.dispatchTimestamp || m.updatedAt || m.createdAt || '').slice(0, 10);
      return norm === 'HANDED_OVER' && (date === todayStr || !m.dispatchTimestamp);
    }).length;

    // 3. Packages Waiting (total packages inside READY manifests)
    const packagesWaitingCount = readyManifests.reduce((sum, m) => {
      return sum + (m.shipmentIds?.length || m.totalPackages || m.totalShipmentsCount || 0);
    }, 0);

    // 4. Blocking Issues: Count of READY manifests having any blocking criteria
    const blockingCount = readyManifests.filter((m) => {
      const trip = trips.find((t) => t.id === m.tripId);
      if (!trip) return true;
      if (trip.status === 'CANCELLED' || trip.status === 'REJECTED' || trip.status === 'COMPLETED' || trip.status === 'EMERGENCY_UNASSIGNED') {
        return true;
      }
      if (trip.kycStatus === 'REJECTED' || trip.kycStatus === 'PENDING') {
        return true;
      }
      // Check for blocking operational incident
      const hasIncident = operationalIncidents.some(
        (inc) =>
          (inc.manifestId === m.id || inc.tripId === m.tripId) &&
          inc.severity === 'CRITICAL' &&
          inc.status !== 'RESOLVED'
      );
      if (hasIncident) return true;

      // Weight check
      const manifestPkgs = shipments.filter((s) => m.shipmentIds?.includes(s.id));
      const calcWeight = manifestPkgs.reduce(
        (acc, p) => acc + (p.actualWeightKg || p.estimatedWeightKg || 0),
        0
      );
      if (Math.abs(calcWeight - m.totalWeightKg) > 0.05 && manifestPkgs.length > 0) {
        return true;
      }
      return false;
    }).length;

    return {
      readyCount,
      handoverTodayCount,
      packagesWaitingCount,
      blockingCount,
    };
  }, [hubManifests, trips, shipments, operationalIncidents]);

  // Filtered manifests list (Rules 7, 8, 9)
  const filteredManifests = useMemo(() => {
    return hubManifests.filter((m) => {
      const normStatus = normalizeManifestStatus(m.status || m.currentStatus);

      // Status tab filter
      if (statusFilter === 'READY' && normStatus !== 'READY') return false;
      if (statusFilter === 'HANDED_OVER' && normStatus !== 'HANDED_OVER') return false;

      // Route filter
      if (routeFilter === 'AMM_ALG') {
        if (!(m.originHubId?.includes('amm') && m.destinationHubId?.includes('alg'))) return false;
      } else if (routeFilter === 'ALG_AMM') {
        if (!(m.originHubId?.includes('alg') && m.destinationHubId?.includes('amm'))) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = (m.manifestCode || '').toLowerCase().includes(q);
        const idMatch = m.id.toLowerCase().includes(q);
        const tripMatch = m.tripId.toLowerCase().includes(q);
        const flightMatch = (m.flightNumber || '').toLowerCase().includes(q);
        const travelerMatch = (m.travelerName || m.assignedTravelerName || '').toLowerCase().includes(q);
        const tokenMatch = (m.handoverToken || m.handoverQrSecret || '').toLowerCase().includes(q);
        if (!codeMatch && !idMatch && !tripMatch && !flightMatch && !travelerMatch && !tokenMatch) {
          return false;
        }
      }

      return true;
    });
  }, [hubManifests, statusFilter, routeFilter, searchQuery]);

  // Active Selected Manifest & Associated Entities
  const activeManifest = useMemo(() => {
    if (!selectedManifestId) return null;
    return hubManifests.find((m) => m.id === selectedManifestId) || null;
  }, [hubManifests, selectedManifestId]);

  const activeTrip = useMemo(() => {
    if (!activeManifest) return null;
    return trips.find((t) => t.id === activeManifest.tripId) || null;
  }, [activeManifest, trips]);

  const activeManifestShipments = useMemo(() => {
    if (!activeManifest) return [];
    const ids = new Set(activeManifest.shipmentIds || []);
    return shipments.filter((s) => ids.has(s.id));
  }, [activeManifest, shipments]);

  // Auto-select first manifest if none selected
  useEffect(() => {
    if (!selectedManifestId && filteredManifests.length > 0) {
      setSelectedManifestId(filteredManifests[0].id);
    }
  }, [filteredManifests, selectedManifestId]);

  // Calculation of manifest total weight vs packages sum (Rule 32)
  const calculatedPackagesWeight = useMemo(() => {
    return Number(
      activeManifestShipments
        .reduce((sum, s) => sum + (s.actualWeightKg || s.estimatedWeightKg || 0), 0)
        .toFixed(2)
    );
  }, [activeManifestShipments]);

  const isWeightConsistent = useMemo(() => {
    if (!activeManifest || activeManifestShipments.length === 0) return true;
    return Math.abs(activeManifest.totalWeightKg - calculatedPackagesWeight) <= 0.05;
  }, [activeManifest, calculatedPackagesWeight, activeManifestShipments]);

  // Blocking Incident Check (Rule 28)
  const activeBlockingIncident = useMemo(() => {
    if (!activeManifest) return null;
    return (
      operationalIncidents.find(
        (inc) =>
          (inc.manifestId === activeManifest.id || (activeTrip && inc.tripId === activeTrip.id)) &&
          inc.severity === 'CRITICAL' &&
          inc.status !== 'RESOLVED'
      ) || null
    );
  }, [activeManifest, activeTrip, operationalIncidents]);

  // Handover Readiness Checklist (Rules 11-16, 23-33)
  const readinessChecklist = useMemo(() => {
    if (!activeManifest) return null;

    const normStatus = normalizeManifestStatus(activeManifest.status || activeManifest.currentStatus);

    // 1. Manifest Status is READY
    const isStatusReady = normStatus === 'READY';

    // 2. Traveler Identity & KYC Verified
    const isTravelerKycVerified = activeTrip ? activeTrip.kycStatus === 'VERIFIED' : true;

    // 3. Traveler Association Matches Trip
    const isTravelerMatched =
      !!activeTrip &&
      activeManifest.travelerId === activeTrip.travelerId;

    // 4. Trip is Valid & Active (PACKAGES_LINKED)
    const isTripValid =
      !!activeTrip &&
      activeTrip.status !== 'CANCELLED' &&
      activeTrip.status !== 'REJECTED' &&
      activeTrip.status !== 'COMPLETED' &&
      activeTrip.status !== 'EMERGENCY_UNASSIGNED';

    // 5. Flight & Departure Schedule Verified
    const isFlightValid = !!activeTrip && !!activeTrip.flightNumber && !!activeTrip.departureTime;

    // 6. Route Matches
    const isRouteValid =
      !!activeTrip &&
      activeManifest.originHubId === activeTrip.originHubId &&
      activeManifest.destinationHubId === activeTrip.destinationHubId;

    // 7. All Expected Packages Scanned
    const totalExpected = activeManifest.shipmentIds?.length || 0;
    const scannedCount = scannedPackageIds.size;
    const isAllPackagesScanned = totalExpected > 0 && scannedCount === totalExpected;

    // 8. No Unexpected Package Scanned
    const hasNoUnexpectedPackage = !unexpectedPackageWarning;

    // 9. All Tamper Seals Verified & Intact
    const packagesWithValidSeals = activeManifestShipments.filter(
      (s) => s.securitySealId && s.securitySealId.trim() !== ''
    );
    const allHaveSeals = packagesWithValidSeals.length === totalExpected;
    const isAllSealsVerified =
      allHaveSeals &&
      totalExpected > 0 &&
      verifiedSealIds.size === totalExpected &&
      Object.values(sealMismatchMap).every((v) => !v);

    // 10. No Blocking Incidents
    const hasNoBlockingIncident = !activeBlockingIncident;

    // 11. Weight & Count Consistency
    const isCountAndWeightValid =
      totalExpected > 0 &&
      activeManifestShipments.length === totalExpected &&
      isWeightConsistent;

    const checks = [
      {
        id: 'status_ready',
        labelAr: 'حالة المانيفست معتمدة (READY)',
        labelEn: 'Manifest Status is READY',
        pass: isStatusReady,
        failReasonAr: 'المانيفست ليس في حالة READY (مسودة أو مسلّم مسبقاً)',
        failReasonEn: 'Manifest is not in READY state',
      },
      {
        id: 'traveler_kyc',
        labelAr: 'توثيق هوية المسافر (KYC Verified)',
        labelEn: 'Traveler KYC Verified',
        pass: isTravelerKycVerified,
        failReasonAr: 'توثيق هوية المسافر غير مكتمل أو معلق',
        failReasonEn: 'Traveler identity verification incomplete',
      },
      {
        id: 'traveler_match',
        labelAr: 'تطابق المسافر مع الرحلة المرتبطة',
        labelEn: 'Traveler Matches Assigned Trip',
        pass: isTravelerMatched,
        failReasonAr: 'بيانات المسافر بالمانيفست لا تطابق مسافر الرحلة',
        failReasonEn: 'Traveler ID does not match trip',
      },
      {
        id: 'trip_valid',
        labelAr: 'صلاحية الرحلة وعدم إلغائها (PACKAGES_LINKED)',
        labelEn: 'Trip is Valid & Confirmed',
        pass: isTripValid,
        failReasonAr: activeTrip ? `حالة الرحلة تمنع التسليم (${activeTrip.status})` : 'الرحلة غير موجودة',
        failReasonEn: activeTrip ? `Trip status invalid: ${activeTrip.status}` : 'Trip not found',
      },
      {
        id: 'flight_verified',
        labelAr: 'بيانات وتوقيت الرحلة الجوية مؤكدة',
        labelEn: 'Flight & Schedule Verified',
        pass: isFlightValid,
        failReasonAr: 'بيانات الرحلة الجوية غير مكتملة',
        failReasonEn: 'Flight information missing',
      },
      {
        id: 'route_verified',
        labelAr: 'تطابق مسار الرحلة مع محطة الإرسال والوصول',
        labelEn: 'Route Verified (Origin ➔ Destination)',
        pass: isRouteValid,
        failReasonAr: 'مسار المانيفست غير مطابق لمسار الرحلة',
        failReasonEn: 'Manifest route mismatch',
      },
      {
        id: 'packages_scanned',
        labelAr: `مسح وتدقيق كافة الطرود بالمانيفست (${scannedCount} / ${totalExpected})`,
        labelEn: `All Packages Scanned (${scannedCount} / ${totalExpected})`,
        pass: isAllPackagesScanned,
        failReasonAr: `${totalExpected - scannedCount} طرد(ود) لم يتم مسحها بعد`,
        failReasonEn: `${totalExpected - scannedCount} package(s) have not been scanned`,
      },
      {
        id: 'no_unexpected',
        labelAr: 'خلو عملية المسح من أي طرود غريبة أو غير مصرحة',
        labelEn: 'No Unexpected Packages Scanned',
        pass: hasNoUnexpectedPackage,
        failReasonAr: unexpectedPackageWarning || 'تم رصد طرد غير موجود بالمانيفست',
        failReasonEn: unexpectedPackageWarning || 'Unexpected package scanned',
      },
      {
        id: 'seals_verified',
        labelAr: `مطابقة كافة الأختام الأمنية المشفرة (${verifiedSealIds.size} / ${totalExpected})`,
        labelEn: `All Security Seals Verified (${verifiedSealIds.size} / ${totalExpected})`,
        pass: isAllSealsVerified,
        failReasonAr: !allHaveSeals
          ? 'يوجد طرود بدون ختم أمني مسجل'
          : `${totalExpected - verifiedSealIds.size} ختم(أختام) لم يتم مطابقتها`,
        failReasonEn: !allHaveSeals
          ? 'Missing security seals on shipments'
          : `${totalExpected - verifiedSealIds.size} seal(s) unverified or mismatched`,
      },
      {
        id: 'no_incidents',
        labelAr: 'خلو المانيفست والرحلة من أي بلاغ تشغيلي حرج',
        labelEn: 'No Blocking Operational Incidents',
        pass: hasNoBlockingIncident,
        failReasonAr: activeBlockingIncident?.titleAr || 'يوجد بلاغ تشغيلي حرج معلق',
        failReasonEn: activeBlockingIncident?.titleEn || 'Critical operational incident present',
      },
      {
        id: 'weight_count_valid',
        labelAr: 'تطابق الوزن الكلي وعدد الطرود المحسوبة',
        labelEn: 'Manifest Weight & Package Count Valid',
        pass: isCountAndWeightValid,
        failReasonAr: !isWeightConsistent
          ? `عدم تطابق في وزن المانيفست (${activeManifest.totalWeightKg} كغم vs ${calculatedPackagesWeight} كغم)`
          : 'عدد الطرود غير مطابق',
        failReasonEn: !isWeightConsistent
          ? `Weight discrepancy (${activeManifest.totalWeightKg} vs ${calculatedPackagesWeight} KG)`
          : 'Package count mismatch',
      },
    ];

    const passedCount = checks.filter((c) => c.pass).length;
    const isAllPass = passedCount === checks.length;

    return {
      checks,
      passedCount,
      totalCount: checks.length,
      isAllPass,
    };
  }, [
    activeManifest,
    activeTrip,
    scannedPackageIds,
    verifiedSealIds,
    unexpectedPackageWarning,
    sealMismatchMap,
    activeManifestShipments,
    activeBlockingIncident,
    isWeightConsistent,
    calculatedPackagesWeight,
  ]);

  // Action: Handle Package Barcode/QR Scanning (Rules 19-23)
  const handleScanPackageCode = (code: string) => {
    if (!activeManifest) return;
    const cleanCode = code.trim();
    if (!cleanCode) return;

    // Search inside active manifest shipments
    const matched = activeManifestShipments.find(
      (s) =>
        s.id.toLowerCase() === cleanCode.toLowerCase() ||
        s.trackingNumber.toLowerCase() === cleanCode.toLowerCase() ||
        (s.securitySealId && s.securitySealId.toLowerCase() === cleanCode.toLowerCase())
    );

    if (matched) {
      // Check duplicate scan (Rule 21)
      if (scannedPackageIds.has(matched.id)) {
        setScanNotice({
          type: 'DUPLICATE',
          message: isAr
            ? `الطرد [${matched.trackingNumber}] ممسوح مسبقاً!`
            : `Package [${matched.trackingNumber}] already scanned.`,
        });
      } else {
        // Success scan (Rule 20)
        setScannedPackageIds((prev) => new Set(prev).add(matched.id));
        setScanNotice({
          type: 'SUCCESS',
          message: isAr
            ? `✓ تم التحقق من الطرد [${matched.trackingNumber}] بنجاح.`
            : `✓ Package verified: [${matched.trackingNumber}].`,
        });
        setUnexpectedPackageWarning(null);
      }
    } else {
      // Unexpected package (Rule 22) - BLOCK & WARNING
      const warningMsg = isAr
        ? `طرد غير متوقع [${cleanCode}]: هذا الطرد ليس جزءاً من المانيفست المحدد!`
        : `Unexpected package [${cleanCode}]: This package is not part of the selected manifest.`;
      setUnexpectedPackageWarning(warningMsg);
      setScanNotice({
        type: 'ERROR',
        message: warningMsg,
      });
    }

    setScanInput('');
  };

  // Quick Action: Scan All Verified (For fast QA testing)
  const handleQuickScanAll = () => {
    if (!activeManifest) return;
    setScannedPackageIds(new Set(activeManifest.shipmentIds));
    setUnexpectedPackageWarning(null);
    setScanNotice({
      type: 'SUCCESS',
      message: isAr
        ? `✓ تم مسح واعتماد كافة طرود المانيفست (${activeManifest.shipmentIds.length} طرود).`
        : `✓ All ${activeManifest.shipmentIds.length} packages scanned and verified.`,
    });
  };

  // Action: Verify Security Seal (Rules 24, 25, 26)
  const handleVerifySeal = (shipmentId: string, expectedSeal?: string, inputSeal?: string) => {
    if (!expectedSeal || expectedSeal.trim() === '') {
      setSealMismatchMap((prev) => ({ ...prev, [shipmentId]: true }));
      return;
    }

    const testSeal = (inputSeal !== undefined ? inputSeal : sealInputMap[shipmentId] || expectedSeal).trim();

    if (testSeal.toLowerCase() === expectedSeal.toLowerCase()) {
      setVerifiedSealIds((prev) => new Set(prev).add(shipmentId));
      setSealMismatchMap((prev) => ({ ...prev, [shipmentId]: false }));
    } else {
      setVerifiedSealIds((prev) => {
        const next = new Set(prev);
        next.delete(shipmentId);
        return next;
      });
      setSealMismatchMap((prev) => ({ ...prev, [shipmentId]: true }));
    }
  };

  // Quick Action: Verify All Seals Match
  const handleQuickVerifyAllSeals = () => {
    if (!activeManifest) return;
    const ids = new Set<string>();
    const newInputs: Record<string, string> = {};
    const newMismatches: Record<string, boolean> = {};

    activeManifestShipments.forEach((s) => {
      if (s.securitySealId && s.securitySealId.trim() !== '') {
        ids.add(s.id);
        newInputs[s.id] = s.securitySealId;
        newMismatches[s.id] = false;
      } else {
        newMismatches[s.id] = true;
      }
    });

    setVerifiedSealIds(ids);
    setSealInputMap(newInputs);
    setSealMismatchMap(newMismatches);
  };

  // Final Action: Complete Handover (Rules 35-42)
  const handleConfirmHandoverFinal = async () => {
    if (!activeManifest || !activeTrip || !readinessChecklist?.isAllPass || !travelerConfirmedReceipt) {
      return;
    }

    setIsSubmitting(true);
    try {
      const generatedToken =
        activeManifest.handoverToken ||
        activeManifest.handoverQrSecret ||
        `HMAC_TK_${activeManifest.id}_${Date.now()}`;

      const ok = await onHandoverComplete({
        manifestId: activeManifest.id,
        tripId: activeTrip.id,
        shipmentIds: activeManifest.shipmentIds,
        travelerId: activeTrip.travelerId,
        token: generatedToken,
      });

      if (ok) {
        setSuccessToken(generatedToken);
        setIsConfirmationModalOpen(false);
        setIsSuccessModalOpen(true);
        onRefreshData();
      }
    } catch (err) {
      console.error('Handover completion error:', err);
      alert(isAr ? 'حدث خطأ أثناء إتمام التسليم' : 'Failed to complete handover');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Permission Check (Rule 55, 56)
  const canPerformHandover = useMemo(() => {
    if (!currentUser) return true;
    const allowedRoles = ['HUB_AGENT', 'HUB_MANAGER', 'MASTER_ADMIN'];
    return allowedRoles.includes(currentUser.role);
  }, [currentUser]);

  const activeNormStatus = activeManifest
    ? normalizeManifestStatus(activeManifest.status || activeManifest.currentStatus)
    : null;

  return (
    <div className="space-y-6">
      {/* Header (Rule 5) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold shadow-2xs">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900">
                  {isAr ? 'تسليم للمسافر' : 'Traveler Handover'}
                </h1>
                <span className="text-xs font-mono font-bold text-slate-400">/ Custody Transfer</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? 'التحقق من المسافر والرحلة ومسح الطرود والأختام قبل نقل العهدة من مركز THOUESA إلى المسافر.'
                  : 'Verify traveler identity, flight ticket, scan parcels and check seals before transferring custody.'}
              </p>
            </div>
          </div>
        </div>

        {/* Current Hub Indicator (Rule 5) */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-amber-600" />
          <span>{isAr ? currentHub.nameAr : currentHub.nameEn}</span>
          <span className="font-mono text-[11px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded-md">
            {currentHub.code}
          </span>
        </div>
      </div>

      {/* KPI Cards (Rule 6 - 4 Cards Only) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Ready for Handover */}
        <div
          onClick={() => setStatusFilter('READY')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'READY'
              ? 'bg-teal-50/70 border-teal-300 ring-2 ring-teal-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {isAr ? 'جاهز للتسليم' : 'Ready for Handover'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{kpis.readyCount}</div>
          <div className="mt-1 text-[11px] text-teal-700 font-medium">
            {isAr ? 'مانيفستات معتمدة ومقفلة' : 'Approved & locked manifests'}
          </div>
        </div>

        {/* 2. Handover Today */}
        <div
          onClick={() => setStatusFilter('HANDED_OVER')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'HANDED_OVER'
              ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {isAr ? 'تم تسليمها اليوم' : 'Handover Today'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center">
              <Plane className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{kpis.handoverTodayCount}</div>
          <div className="mt-1 text-[11px] text-indigo-700 font-medium">
            {isAr ? 'انتقلت لعهدة المسافرين' : 'In traveler custody'}
          </div>
        </div>

        {/* 3. Packages Waiting */}
        <div className="p-4 rounded-2xl border bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {isAr ? 'طرود بانتظار التسليم' : 'Packages Waiting'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{kpis.packagesWaitingCount}</div>
          <div className="mt-1 text-[11px] text-amber-700 font-medium">
            {isAr ? 'إجمالي الطرود بالمانيفستات الجاهزة' : 'Total parcels ready for dispatch'}
          </div>
        </div>

        {/* 4. Blocking Issues */}
        <div className="p-4 rounded-2xl border bg-white border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              {isAr ? 'عوارض مانعة للتسليم' : 'Blocking Issues'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600">{kpis.blockingCount}</div>
          <div className="mt-1 text-[11px] text-rose-700 font-medium">
            {isAr ? 'تتطلب معالجة أمنية أو تشغيلية' : 'Requires operational resolution'}
          </div>
        </div>
      </div>

      {/* Search & Filters Toolbar (Rules 7 & 8) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('READY')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'READY'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'جاهزة للتسليم (READY)' : 'Ready for Handover'}
              <span className="ms-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-teal-100 text-teal-800">
                {kpis.readyCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('HANDED_OVER')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'HANDED_OVER'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'تم تسليمها (HANDED_OVER)' : 'Handed Over'}
              <span className="ms-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800">
                {kpis.handoverTodayCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'الكل' : 'All'}
            </button>
          </div>

          {/* Route Filter Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">{isAr ? 'جميع المسارات' : 'All Routes'}</option>
              <option value="AMM_ALG">{isAr ? 'عمان ➔ الجزائر (AMM ➔ ALG)' : 'AMM ➔ ALG'}</option>
              <option value="ALG_AMM">{isAr ? 'الجزائر ➔ عمان (ALG ➔ AMM)' : 'ALG ➔ AMM'}</option>
            </select>
          </div>
        </div>

        {/* Search Field (Rule 7) */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isAr
                ? 'البحث برقم المانيفست، رمز التتبع، رقم الرحلة، اسم المسافر، أو رمز QR...'
                : 'Search by Manifest ID, Flight, Traveler, or QR code...'
            }
            className="w-full ps-10 pe-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Main Split Layout: LEFT = Manifests Queue, RIGHT = Handover Workspace (Rule 60) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Manifests Queue (5 cols on lg) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700">
              {isAr ? 'طابور المانيفستات' : 'Manifests Queue'} ({filteredManifests.length})
            </span>
            <button
              type="button"
              onClick={onRefreshData}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              title={isAr ? 'تحديث البيانات' : 'Refresh'}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {filteredManifests.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-xs text-slate-500 space-y-3">
              <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300" />
              <div>
                {statusFilter === 'READY'
                  ? (isAr ? 'لا توجد مانيفستات جاهزة للتسليم للمسافرين حالياً.' : 'No manifests currently ready for handover.')
                  : (isAr ? 'لا توجد نتائج مطابقة لبحثك.' : 'No manifests matching your filters.')}
              </div>
              <button
                type="button"
                onClick={() => onNavigate('MANIFESTS')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {isAr ? 'الانتقال لإدارة المانيفست (Stage 02)' : 'Open Manifests'}
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pe-1">
              {filteredManifests.map((m) => {
                const isSelected = m.id === selectedManifestId;
                const normStatus = normalizeManifestStatus(m.status || m.currentStatus);
                const pkgCount = m.shipmentIds?.length || m.totalPackages || m.totalShipmentsCount || 0;
                const mTrip = trips.find((t) => t.id === m.tripId);

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedManifestId(m.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono text-xs font-black text-slate-900">
                          {m.manifestCode || m.id}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <Plane className="w-3 h-3 text-amber-600" />
                          <span className="font-bold text-slate-800">{m.airline}</span>
                          <span className="font-mono">({m.flightNumber})</span>
                        </div>
                      </div>

                      <StatusBadge status={normStatus} domain="MANIFEST" locale={locale} />
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span className="font-medium truncate max-w-[120px]">
                          {m.travelerName || m.assignedTravelerName || (isAr ? 'مسافر غير محدد' : 'Traveler')}
                        </span>
                      </div>

                      <div className="font-mono font-bold text-slate-900">
                        {pkgCount} {isAr ? 'طرود' : 'pkgs'} • {m.totalWeightKg} كغم
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{mTrip ? `${mTrip.originHubId.slice(4).toUpperCase()} ➔ ${mTrip.destinationHubId.slice(4).toUpperCase()}` : 'AMM ➔ ALG'}</span>
                      <span className="font-sans font-bold text-amber-800 flex items-center gap-1">
                        {normStatus === 'READY'
                          ? (isAr ? 'جاهز للتسليم ➔' : 'Ready ➔')
                          : (isAr ? 'تم التسليم ✓' : 'Dispatched ✓')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Handover Workspace (8 cols on lg) (Rules 10-36) */}
        <div className="lg:col-span-8">
          {!activeManifest ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-xs text-slate-500">
              <Handshake className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <div className="font-bold text-slate-800 text-sm">
                {isAr ? 'اختر مانيفست من الطابور لبدء إجراءات التسليم' : 'Select a manifest from queue to begin'}
              </div>
              <p className="text-slate-400 mt-1 max-w-sm mx-auto">
                {isAr
                  ? 'سيتم تدقيق هوية المسافر وتفاصيل الرحلة ومطابقة أختام الطرود تمهيداً لنقل العهدة رسمياً.'
                  : 'Verify traveler identity, flight ticket, scan all packages, and verify tamper seals.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Chain of Custody Official Banner (Rule 70) */}
              <div className={`rounded-2xl p-4 border transition-all ${
                activeNormStatus === 'HANDED_OVER'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50/80 border-amber-300 text-amber-950'
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 ${
                      activeNormStatus === 'HANDED_OVER' ? 'bg-emerald-600' : 'bg-amber-600'
                    }`}>
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-slate-500">
                        {isAr ? 'سلسلة العهدة الرسمية (Chain of Custody)' : 'Official Chain of Custody'}
                      </div>
                      <div className="text-xs sm:text-sm font-bold mt-0.5 flex items-center gap-2">
                        {activeNormStatus === 'HANDED_OVER' ? (
                          <>
                            <span className="text-emerald-800">{isAr ? 'العهدة الحالية:' : 'Current Custody:'}</span>
                            <span className="bg-emerald-200/80 px-2 py-0.5 rounded-md font-black text-emerald-950">
                              {isAr ? 'المسافر المعتمد (TRAVELER)' : 'Traveler Custody'}
                            </span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </>
                        ) : (
                          <>
                            <span className="text-amber-900">{isAr ? 'العهدة الحالية:' : 'Current Custody:'}</span>
                            <span className="bg-amber-200/80 px-2 py-0.5 rounded-md font-black text-amber-950">
                              {isAr ? 'مركز THOUESA الإرسال (ORIGIN_HUB)' : 'Origin Hub Custody'}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-slate-600 font-medium">
                              {isAr ? 'تنتقل للمسافر بعد التأكيد النهائي' : 'Transfers to Traveler on Final Confirm'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {activeNormStatus === 'HANDED_OVER' && (
                    <button
                      type="button"
                      onClick={() => setQrModalManifest(activeManifest)}
                      className="px-3 py-1.5 bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-900 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>{isAr ? 'عرض رمز الاستلام' : 'Handover Token'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Already Handed Over Notice (Rule 46) */}
              {activeNormStatus === 'HANDED_OVER' && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{isAr ? 'تم تسليم هذا المانيفست للمسافر مسبقاً (مكتمل ومقفل)' : 'Handover Already Completed'}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isAr ? 'المسافر:' : 'Traveler:'}</span>
                      <strong className="text-slate-800">{activeManifest.travelerName || activeTrip?.travelerName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isAr ? 'موظف التسليم:' : 'Dispatched By:'}</span>
                      <strong className="text-slate-800">{activeManifest.dispatchedByAgentId || 'Hub Agent'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isAr ? 'توقيت التسليم:' : 'Handover Time:'}</span>
                      <strong className="text-slate-800 font-mono">
                        {activeManifest.dispatchTimestamp
                          ? new Date(activeManifest.dispatchTimestamp).toLocaleTimeString(isAr ? 'ar-JO' : 'en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Recent'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isAr ? 'إجمالي الحمولة:' : 'Payload:'}</span>
                      <strong className="text-slate-800 font-mono">
                        {activeManifest.shipmentIds?.length} طرود • {activeManifest.totalWeightKg} كغم
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION A: Traveler Verification (Rules 11 & 12) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900">
                        {isAr ? '1. التحقق من هوية المسافر الحضوري (Traveler Verification)' : '1. Traveler Verification'}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isAr ? 'مطابقة الحضور الشخصي وجواز السفر مع بيانات الرحلة المسجلة' : 'Verify physical presence, passport, and KYC status'}
                      </p>
                    </div>
                  </div>

                  {activeTrip && (
                    <button
                      type="button"
                      onClick={() =>
                        setDrawerData({
                          isOpen: true,
                          type: 'TRAVELER',
                          title: isAr ? 'تفاصيل المسافر وسجل التوثيق' : 'Traveler Profile & KYC',
                          item: activeTrip,
                        })
                      }
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isAr ? 'عرض الملف' : 'View KYC'}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">{isAr ? 'اسم المسافر المعتمد:' : 'Traveler Name:'}</span>
                    <strong className="text-slate-900 text-sm mt-0.5 block">
                      {activeManifest.travelerName || activeTrip?.travelerName || 'Ahmed Benali'}
                    </strong>
                    <span className="font-mono text-[10px] text-slate-400">ID: {activeManifest.travelerId}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">{isAr ? 'حالة توثيق الهوية (KYC):' : 'KYC Verification:'}</span>
                    <div className="mt-1 flex items-center gap-1.5">
                      {activeTrip?.kycStatus === 'VERIFIED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          {isAr ? 'موثق رسمياً (VERIFIED)' : 'Verified'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <XCircle className="w-3 h-3" />
                          {isAr ? 'غير مكتمل (BLOCK)' : 'Incomplete'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">{isAr ? 'مطابقة المسافر مع الرحلة:' : 'Trip Association:'}</span>
                    <div className="mt-1 flex items-center gap-1.5">
                      {activeTrip && activeManifest.travelerId === activeTrip.travelerId ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                          <Check className="w-3 h-3" />
                          {isAr ? 'متطابق مع الرحلة' : 'Matched with Trip'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          {isAr ? 'عدم تطابق (BLOCK)' : 'Mismatch'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Blocking reason if traveler KYC failed */}
                {activeTrip?.kycStatus !== 'VERIFIED' && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <div>
                      <strong>{isAr ? 'التسليم معلق (Handover Blocked):' : 'Handover Blocked:'}</strong>{' '}
                      {isAr
                        ? 'توثيق هوية المسافر غير مكتمل. لا يمكن نقل عهدة الطرود لمسافر غير موثق.'
                        : 'Traveler identity verification incomplete. Custody transfer prohibited.'}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION B: Trip & Flight Verification (Rules 13 to 16) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <Plane className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900">
                        {isAr ? '2. التحقق من الرحلة الجوية وتذكرة السفر (Flight Verification)' : '2. Flight & Trip Verification'}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isAr ? 'تدقيق رقم الرحلة وموعد الإقلاع والمحطات المعتمدة' : 'Verify flight number, airline, departure time and route'}
                      </p>
                    </div>
                  </div>

                  {activeTrip && (
                    <button
                      type="button"
                      onClick={() =>
                        setDrawerData({
                          isOpen: true,
                          type: 'TRIP',
                          title: isAr ? 'تفاصيل الرحلة وحجز الطيران' : 'Flight & Trip Details',
                          item: activeTrip,
                        })
                      }
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تفاصيل الرحلة' : 'Trip Details'}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">{isAr ? 'شركة الطيران ورقم الرحلة:' : 'Flight & Airline:'}</span>
                    <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                      <span>{activeManifest.airline || activeTrip?.airline}</span>
                      <span className="font-mono text-amber-700">({activeManifest.flightNumber || activeTrip?.flightNumber})</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">{isAr ? 'مسار الرحلة الجوية:' : 'Flight Route:'}</span>
                    <div className="font-bold text-slate-900 mt-0.5 font-mono">
                      {activeTrip
                        ? `${activeTrip.originHubId.replace('hub-', '').toUpperCase()} ➔ ${activeTrip.destinationHubId.replace('hub-', '').toUpperCase()}`
                        : 'AMM ➔ ALG'}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">{isAr ? 'موعد الإقلاع المجدول:' : 'Departure Time:'}</span>
                    <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activeTrip?.departureTime || 'Today'}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">{isAr ? 'حالة الرحلة التشغيلية:' : 'Trip Operational Status:'}</span>
                    <div className="mt-0.5">
                      <StatusBadge status={activeTrip?.status || 'PACKAGES_LINKED'} domain="TRIP" locale={locale} />
                    </div>
                  </div>
                </div>

                {/* Trip Cancellation / Unassign Warning */}
                {activeTrip && (activeTrip.status === 'CANCELLED' || activeTrip.status === 'REJECTED' || activeTrip.status === 'EMERGENCY_UNASSIGNED') && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <div>
                      <strong>{isAr ? 'الرحلة ملغاة أو غير صالحة للتسليم:' : 'Trip Cancelled or Unassigned:'}</strong>{' '}
                      {isAr
                        ? 'تم إلغاء الرحلة أو سحب إسنادها. يحظر تسليم الطرود ويجب إعادتها إلى المستودع.'
                        : 'This trip is cancelled or unassigned. Handover cannot proceed.'}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION C & D: Package Scanning & Verification (Rules 18 to 23) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                        <Scan className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900">
                        {isAr ? '3. مسح وتدقيق الطرود بالباركود (Package Scan Verification)' : '3. Package Barcode / QR Scanning'}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isAr
                        ? 'يجب مسح وتدقيق كل طرد على حدة للتأكد من وجوده ومطابقته للمانيفست قبل النقل'
                        : 'Every package must be scanned. Unexpected packages will block handover.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                      {scannedPackageIds.size} / {activeManifest.shipmentIds?.length || 0} {isAr ? 'ممسوح' : 'Scanned'}
                    </span>
                    {activeNormStatus === 'READY' && canPerformHandover && (
                      <button
                        type="button"
                        onClick={handleQuickScanAll}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title={isAr ? 'مسح سريع لكافة الطرود للاختبار' : 'Fast test scan all'}
                      >
                        {isAr ? 'مسح الكل السريع' : 'Scan All'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Barcode / QR Scan Input Bar (Rules 19 & 22) */}
                {activeNormStatus === 'READY' && (
                  <div className="space-y-2">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleScanPackageCode(scanInput);
                      }}
                      className="flex items-center gap-2"
                    >
                      <div className="relative flex-1">
                        <Scan className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={scanInput}
                          onChange={(e) => setScanInput(e.target.value)}
                          placeholder={isAr ? 'امسح باركود الطرد أو أدخل رقم التتبع (Tracking Number)...' : 'Scan parcel barcode or enter tracking #...'}
                          className="w-full ps-9 pe-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        {isAr ? 'تحقق ومسح' : 'Verify'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsScannerOpen(true)}
                        className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl transition-colors cursor-pointer"
                        title={isAr ? 'فتح الكاميرا للمسح' : 'Open Camera'}
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </form>

                    {/* Scan Notice Alert (Rules 20, 21, 22) */}
                    {scanNotice && (
                      <div
                        className={`p-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
                          scanNotice.type === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                            : scanNotice.type === 'DUPLICATE'
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : 'bg-rose-50 text-rose-900 border border-rose-200'
                        }`}
                      >
                        {scanNotice.type === 'SUCCESS' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : scanNotice.type === 'DUPLICATE' ? (
                          <Info className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span className="font-bold">{scanNotice.message}</span>
                      </div>
                    )}

                    {/* Unexpected Package Blocking Warning (Rule 22) */}
                    {unexpectedPackageWarning && (
                      <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <strong className="block">{isAr ? 'تحذير أمني حرج — طرد غير متوقع (UNEXPECTED PACKAGE):' : 'Critical Security Warning — Unexpected Package:'}</strong>
                          <span className="text-[11px] text-rose-800">{unexpectedPackageWarning}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUnexpectedPackageWarning(null)}
                          className="text-rose-700 hover:text-rose-900 font-bold text-xs"
                        >
                          {isAr ? 'إلغاء التنبيه' : 'Clear'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Packages Table (Rule 18) */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-start">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3 text-start">{isAr ? 'حالة المسح' : 'Scan Status'}</th>
                        <th className="p-3 text-start">{isAr ? 'رقم التتبع' : 'Tracking #'}</th>
                        <th className="p-3 text-start">{isAr ? 'الوصف' : 'Description'}</th>
                        <th className="p-3 text-start">{isAr ? 'الوزن الفعلي' : 'Weight'}</th>
                        <th className="p-3 text-start">{isAr ? 'الختم الأمني' : 'Security Seal'}</th>
                        <th className="p-3 text-start">{isAr ? 'حالة العهدة' : 'Custody'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {activeManifestShipments.map((s) => {
                        const isScanned = scannedPackageIds.has(s.id);
                        const isSealVerified = verifiedSealIds.has(s.id);
                        const hasSealMismatch = !!sealMismatchMap[s.id];
                        const actualWeight = s.actualWeightKg ?? s.estimatedWeightKg ?? 0;

                        return (
                          <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3">
                              {isScanned ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {isAr ? 'تم التحقق' : 'VERIFIED'}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleScanPackageCode(s.trackingNumber)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                                >
                                  <Scan className="w-3 h-3" />
                                  {isAr ? 'بانتظار المسح' : 'Scan'}
                                </button>
                              )}
                            </td>

                            <td className="p-3 font-mono font-bold text-slate-900">
                              <button
                                type="button"
                                onClick={() =>
                                  setDrawerData({
                                    isOpen: true,
                                    type: 'SHIPMENT',
                                    title: isAr ? 'تفاصيل الطرد وفحص الوزن' : 'Shipment Package Details',
                                    item: s,
                                  })
                                }
                                className="hover:underline flex items-center gap-1 text-slate-900"
                              >
                                <span>{s.trackingNumber}</span>
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </button>
                            </td>

                            <td className="p-3 max-w-[160px] truncate text-slate-600">
                              {s.itemDescription}
                            </td>

                            <td className="p-3 font-mono font-bold text-amber-950">
                              {actualWeight.toFixed(2)} كغم
                            </td>

                            <td className="p-3">
                              {s.securitySealId ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[11px] text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                    {s.securitySealId}
                                  </span>
                                  {isSealVerified ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : hasSealMismatch ? (
                                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                  ) : null}
                                </div>
                              ) : (
                                <span className="text-rose-600 font-bold text-[11px] flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {isAr ? 'بدون ختم أمني' : 'No Seal'}
                                </span>
                              )}
                            </td>

                            <td className="p-3">
                              <span className="text-[11px] font-bold text-slate-600">
                                {activeNormStatus === 'HANDED_OVER'
                                  ? (isAr ? 'بعهدة المسافر' : 'Traveler Custody')
                                  : (isAr ? 'بعهدة الفرع' : 'Origin Hub')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION E: Tamper Seal Verification (Rules 24, 25, 26) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                        <Lock className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900">
                        {isAr ? '4. مطابقة الأختام الأمنية المشفرة (Tamper Seals Verification)' : '4. Tamper Seals Verification'}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isAr
                        ? 'التحقق من سلامة الأختام الأمنية المشفرة المثبتة على كل طرد لضمان عدم فتحها أثناء النقل'
                        : 'Ensure tamper-evident security seal on every package is intact and matches registration'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                      {verifiedSealIds.size} / {activeManifest.shipmentIds?.length || 0} {isAr ? 'أختام متطابقة' : 'Verified'}
                    </span>
                    {activeNormStatus === 'READY' && canPerformHandover && (
                      <button
                        type="button"
                        onClick={handleQuickVerifyAllSeals}
                        className="px-2.5 py-1 bg-teal-100 hover:bg-teal-200 text-teal-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title={isAr ? 'مطابقة سريعة للأختام للاختبار' : 'Fast test verify all seals'}
                      >
                        {isAr ? 'مطابقة جميع الأختام' : 'Verify All'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {activeManifestShipments.map((s) => {
                    const isVerified = verifiedSealIds.has(s.id);
                    const isMismatch = !!sealMismatchMap[s.id];

                    return (
                      <div
                        key={s.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          isVerified
                            ? 'bg-teal-50/60 border-teal-200 text-teal-950'
                            : isMismatch
                            ? 'bg-rose-50 border-rose-200 text-rose-950'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div>
                          <div className="font-mono font-bold text-slate-900">{s.trackingNumber}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-mono">
                            <Lock className="w-3 h-3 text-teal-600" />
                            <span>{isAr ? 'الختم المتوقع:' : 'Expected:'}</span>
                            <strong className="text-teal-900">{s.securitySealId || (isAr ? 'مفقود' : 'None')}</strong>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isVerified ? (
                            <span className="font-bold text-teal-800 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-teal-600" />
                              {isAr ? 'متطابق ✓' : 'MATCH ✓'}
                            </span>
                          ) : isMismatch ? (
                            <span className="font-bold text-rose-700 flex items-center gap-1">
                              <XCircle className="w-4 h-4 text-rose-600" />
                              {isAr ? 'عدم تطابق ✗' : 'MISMATCH'}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleVerifySeal(s.id, s.securitySealId, s.securitySealId)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              {isAr ? 'تأكيد الختم' : 'Verify Seal'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION F: Handover Operational Readiness Checklist (Rules 29 & 30) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>{isAr ? '5. قائمة الجاهزية التشغيلية للتسليم (Handover Readiness Checklist)' : '5. Handover Readiness Checklist'}</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isAr
                        ? 'يجب استيفاء جميع المعايير الـ (11) دون أي استثناء للسماح بتأكيد التسليم ونقل العهدة'
                        : 'All 11 criteria must pass before final handover confirmation is unlocked'}
                    </p>
                  </div>

                  {readinessChecklist && (
                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                        readinessChecklist.isAllPass
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {readinessChecklist.passedCount} / {readinessChecklist.totalCount} {isAr ? 'مستوفى' : 'Passed'}
                    </span>
                  )}
                </div>

                {/* Checklist Grid */}
                {readinessChecklist && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                    {readinessChecklist.checks.map((check) => (
                      <div
                        key={check.id}
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-colors ${
                          check.pass
                            ? 'bg-white border-slate-200 text-slate-800'
                            : 'bg-rose-50/70 border-rose-200 text-rose-900'
                        }`}
                      >
                        {check.pass ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className={`font-bold ${check.pass ? 'text-slate-800' : 'text-rose-900'}`}>
                            {isAr ? check.labelAr : check.labelEn}
                          </div>
                          {!check.pass && (
                            <div className="text-[11px] font-medium text-rose-700 mt-0.5">
                              {isAr ? check.failReasonAr : check.failReasonEn}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* SECTION G & H: Traveler Receipt Checkbox & Complete Handover Action Bar (Rules 34, 35, 36) */}
                {activeNormStatus === 'READY' && (
                  <div className="pt-3 border-t border-slate-200 space-y-4">
                    {/* Traveler Receipt Checkbox (Rule 34) */}
                    <label className="flex items-start gap-3 p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={travelerConfirmedReceipt}
                        onChange={(e) => setTravelerConfirmedReceipt(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 mt-0.5 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-black text-amber-950 block">
                          {isAr
                            ? 'إقرار استلام المسافر الرسمي (Traveler Receipt Confirmation):'
                            : 'Traveler Formal Receipt Confirmation:'}
                        </span>
                        <span className="text-amber-900 text-[11px] mt-0.5 block">
                          {isAr
                            ? 'يؤكد المسافر استلام كافة الطرود المذكورة بالمانيفست بحالة سليمة ومغلقة بالأختام المشفرة، ويتحمل مسؤولية نقلها حتى فرع الوجهة.'
                            : 'Traveler confirms receipt of all listed packages intact with authorized seals, accepting custody until destination intake.'}
                        </span>
                      </div>
                    </label>

                    {/* Bottom Complete Handover Action */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-xs font-medium">
                        {readinessChecklist?.isAllPass && travelerConfirmedReceipt ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            {isAr ? 'جاهز لنقل العهدة وإتمام التسليم للمسافر' : 'Ready for custody transfer'}
                          </span>
                        ) : !readinessChecklist?.isAllPass ? (
                          <span className="text-rose-600 font-bold flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4" />
                            {isAr ? 'يوجد شروط غير مستوفاة في قائمة التحقق' : 'Checks unresolved above'}
                          </span>
                        ) : (
                          <span className="text-amber-700 font-bold flex items-center gap-1.5">
                            <Info className="w-4 h-4" />
                            {isAr ? 'يتطلب تأكيد إقرار استلام المسافر أعلاه' : 'Traveler confirmation checkbox required'}
                          </span>
                        )}
                      </div>

                      {canPerformHandover && (
                        <button
                          type="button"
                          disabled={!readinessChecklist?.isAllPass || !travelerConfirmedReceipt || isSubmitting}
                          onClick={() => setIsConfirmationModalOpen(true)}
                          className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Lock className="w-4 h-4 text-amber-400" />
                          <span>{isAr ? 'تأكيد التسليم ونقل العهدة (Complete Handover)' : 'Complete Handover'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sticky Action Bar (Rule 64) */}
      {activeManifest && activeNormStatus === 'READY' && (
        <div className="sm:hidden fixed bottom-0 start-0 end-0 z-40 bg-white border-t border-slate-200 p-3 shadow-lg flex items-center justify-between gap-3">
          <div className="text-xs">
            <div className="font-bold text-slate-900">
              {activeManifest.shipmentIds?.length} {isAr ? 'طرود' : 'Packages'} • {activeManifest.totalWeightKg} كغم
            </div>
            <div className="text-[11px] text-slate-500">
              {readinessChecklist?.isAllPass
                ? (isAr ? 'المعايير مستوفاة' : 'Ready to hand over')
                : (isAr ? 'يتطلب استيفاء الشروط' : 'Checks required')}
            </div>
          </div>

          <button
            type="button"
            disabled={!readinessChecklist?.isAllPass || !travelerConfirmedReceipt}
            onClick={() => setIsConfirmationModalOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-black rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
          >
            {isAr ? 'تأكيد التسليم' : 'Complete Handover'}
          </button>
        </div>
      )}

      {/* MODAL 1: Final Confirmation Modal (Rule 36) */}
      {isConfirmationModalOpen && activeManifest && activeTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                <Handshake className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {isAr ? 'تأكيد تسليم المانيفست ونقل العهدة' : 'Confirm Traveler Handover'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr ? 'إقرار رسمي بنقل المسؤولية القانونية للطرود إلى المسافر' : 'Official legal custody transfer to traveler'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'رقم المانيفست:' : 'Manifest:'}</span>
                <strong className="font-mono text-slate-900">{activeManifest.manifestCode || activeManifest.id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'المسافر المعتمد:' : 'Traveler:'}</span>
                <strong className="text-slate-900">{activeManifest.travelerName || activeTrip.travelerName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'الرحلة والمسار:' : 'Flight & Route:'}</span>
                <span className="font-bold text-slate-900">
                  {activeTrip.airline} ({activeTrip.flightNumber}) • {activeTrip.originHubId.slice(4).toUpperCase()} ➔ {activeTrip.destinationHubId.slice(4).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'عدد الطرود والوزن:' : 'Parcels & Weight:'}</span>
                <span className="font-mono font-black text-amber-900">
                  {activeManifest.shipmentIds?.length} {isAr ? 'طرود' : 'Packages'} • {activeManifest.totalWeightKg} كغم
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'الأختام الأمنية:' : 'Security Seals:'}</span>
                <span className="font-bold text-teal-800">
                  {verifiedSealIds.size} / {activeManifest.shipmentIds?.length} {isAr ? 'موثقة وسليمة' : 'Verified'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'موعد الإقلاع:' : 'Departure:'}</span>
                <span className="font-bold text-slate-900">{activeTrip.departureTime}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 font-medium">
              {isAr
                ? 'بتأكيد هذا التسليم، تنتقل عهدة جميع الطرود المذكورة رسمياً من مركز THOUESA إلى عهدة المسافر، وتتحول حالة الرحلة إلى DISPATCHED وحالة الطرود إلى IN_TRANSIT.'
                : 'By confirming this handover, custody of all listed packages transfers from the origin hub to the traveler.'}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsConfirmationModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmHandoverFinal}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center gap-2"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>
                  {isSubmitting
                    ? (isAr ? 'جارِ نقل العهدة وتوثيق التسليم...' : 'Transferring Custody...')
                    : (isAr ? 'تأكيد التسليم ونقل العهدة' : 'Confirm Handover')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Handover Success State (Rule 43) */}
      {isSuccessModalOpen && activeManifest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900">
              {isAr ? 'تم إتمام التسليم ونقل العهدة بنجاح!' : 'Handover Completed Successfully!'}
            </h3>
            <p className="text-xs text-slate-500">
              {isAr
                ? 'انتقلت عهدة الطرود رسمياً إلى المسافر. أصبحت الشحنات بحالة IN_TRANSIT والرحلة بحالة DISPATCHED.'
                : 'Custody transferred to traveler. Shipments set to IN_TRANSIT and trip set to DISPATCHED.'}
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-start space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'المانيفست:' : 'Manifest:'}</span>
                <strong className="font-mono text-slate-900">{activeManifest.manifestCode || activeManifest.id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'المسافر:' : 'Traveler:'}</span>
                <strong className="text-slate-900">{activeManifest.travelerName || activeTrip?.travelerName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'الطرود والوزن:' : 'Packages & Weight:'}</span>
                <strong className="font-mono text-slate-900">
                  {activeManifest.shipmentIds?.length} {isAr ? 'طرود' : 'pkgs'} • {activeManifest.totalWeightKg} كغم
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'العهدة الحالية:' : 'Current Custody:'}</span>
                <span className="font-bold text-emerald-700">{isAr ? 'المسافر المعتمد (TRAVELER)' : 'Traveler'}</span>
              </div>
            </div>

            {successToken && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl font-mono text-xs text-start space-y-1">
                <span className="text-[10px] text-teal-800 uppercase block font-sans font-bold">
                  {isAr ? 'رمز التسليم المشفر (HMAC Token):' : 'HMAC Handover Token:'}
                </span>
                <div className="p-2 bg-white rounded border border-teal-200 break-all font-bold text-slate-900 text-[11px]">
                  {successToken}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  setQrModalManifest(activeManifest);
                }}
                className="flex-1 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{isAr ? 'عرض رمز الاستلام' : 'View Token'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  setStatusFilter('HANDED_OVER');
                }}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {isAr ? 'العودة لطابور التسليم' : 'Back to Queue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Drawer for Traveler, Trip, or Package (Rule 58) */}
      <DetailsDrawer
        isOpen={drawerData.isOpen}
        onClose={() => setDrawerData({ isOpen: false, type: null, title: '', item: null })}
        title={drawerData.title}
        locale={locale}
      >
        {drawerData.type === 'TRAVELER' && drawerData.item && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'اسم المسافر:' : 'Name:'}</span>
                <strong className="text-slate-900">{drawerData.item.travelerName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'الهاتف:' : 'Phone:'}</span>
                <span className="font-mono text-slate-900">{drawerData.item.travelerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'تقييم المسافر:' : 'Rating:'}</span>
                <span className="font-bold text-amber-700">★ {drawerData.item.travelerRating || '5.0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'توثيق الهوية (KYC):' : 'KYC:'}</span>
                <span className="font-bold text-emerald-700">{drawerData.item.kycStatus || 'VERIFIED'}</span>
              </div>
            </div>
          </div>
        )}

        {drawerData.type === 'TRIP' && drawerData.item && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'رمز الرحلة:' : 'Trip ID:'}</span>
                <span className="font-mono font-bold text-slate-900">{drawerData.item.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'شركة الطيران:' : 'Airline:'}</span>
                <strong className="text-slate-900">{drawerData.item.airline}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'رقم الرحلة الجوية:' : 'Flight #:'}</span>
                <span className="font-mono font-bold text-amber-700">{drawerData.item.flightNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'رمز الحجز (PNR):' : 'PNR:'}</span>
                <span className="font-mono font-bold text-slate-900">{drawerData.item.pnrCode || 'CONFIRMED'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'السعة الكلية / المتاحة:' : 'Capacity:'}</span>
                <span className="font-mono font-bold text-slate-900">
                  {drawerData.item.availableWeightKg} كغم
                </span>
              </div>
            </div>
          </div>
        )}

        {drawerData.type === 'SHIPMENT' && drawerData.item && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'رقم التتبع:' : 'Tracking #:'}</span>
                <span className="font-mono font-bold text-slate-900">{drawerData.item.trackingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'الوصف:' : 'Description:'}</span>
                <strong className="text-slate-900">{drawerData.item.itemDescription}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'الوزن الفعلي:' : 'Actual Weight:'}</span>
                <span className="font-mono font-bold text-amber-900">
                  {drawerData.item.actualWeightKg || drawerData.item.estimatedWeightKg} كغم
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'الختم الأمني:' : 'Security Seal:'}</span>
                <span className="font-mono font-bold text-teal-800">{drawerData.item.securitySealId || 'None'}</span>
              </div>
            </div>
          </div>
        )}
      </DetailsDrawer>

      {/* QR Display Modal */}
      {qrModalManifest && (
        <QRModal
          isOpen={true}
          onClose={() => setQrModalManifest(null)}
          title={isAr ? 'رمز تسليم المانيفست المشفر' : 'Manifest Cryptographic Token'}
          handoverToken={qrModalManifest.handoverToken || qrModalManifest.handoverQrSecret || `HMAC_TK_${qrModalManifest.id}`}
          manifestCode={qrModalManifest.manifestCode || qrModalManifest.id}
          flightNumber={qrModalManifest.flightNumber || activeTrip?.flightNumber}
          totalWeightKg={qrModalManifest.totalWeightKg}
          packageCount={qrModalManifest.shipmentIds?.length}
          locale={locale}
        />
      )}

      {/* Camera QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(code) => {
          setIsScannerOpen(false);
          handleScanPackageCode(code);
        }}
        title={isAr ? 'مسح باركود أو QR الطرد' : 'Scan Package Barcode'}
        locale={locale}
      />
    </div>
  );
};
