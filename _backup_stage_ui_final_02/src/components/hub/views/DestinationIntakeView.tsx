import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowDownToLine,
  Scan,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lock,
  Unlock,
  Boxes,
  Package,
  UserCheck,
  UserX,
  Search,
  Plane,
  Clock,
  Building2,
  Calendar,
  Scale,
  Eye,
  ArrowRight,
  ArrowLeft,
  Filter,
  RefreshCw,
  QrCode,
  AlertCircle,
  Check,
  X,
  Info,
  Copy,
  ExternalLink,
  FileText,
  FileCheck,
  MapPin,
  WifiOff,
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
import { StatusBadge } from '../common/StatusBadge';
import { DetailsDrawer } from '../common/DetailsDrawer';
import { QRScannerModal } from '../../common/QRScannerModal';
import { QRModal } from '../../common/QRModal';

export interface DestinationIntakeViewProps {
  currentHub: Hub;
  currentUser?: UserType;
  manifests: Manifest[];
  shipments: Shipment[];
  trips: Trip[];
  operationalIncidents?: OperationalIncident[];
  locale: Locale;
  preselectedManifestId?: string;
  onDestinationIntakeComplete: (payload: {
    manifestId: string;
    tripId: string;
    verifiedShipmentIds: string[];
    missingShipmentIds: string[];
    sealMismatchIds: string[];
    damagedShipmentIds: string[];
    custodyFrom: string;
    custodyTo: string;
    status: 'CLOSED' | 'DISCREPANCY';
    notes?: string;
  }) => Promise<boolean>;
  onNavigate: (section: EmployeeNavSection, extra?: any) => void;
  onRefreshData?: () => void;
}

export const DestinationIntakeView: React.FC<DestinationIntakeViewProps> = ({
  currentHub,
  currentUser,
  manifests,
  shipments,
  trips,
  operationalIncidents = [],
  locale,
  preselectedManifestId,
  onDestinationIntakeComplete,
  onNavigate,
  onRefreshData,
}) => {
  const isAr = locale === 'ar';

  // Navigation & Tabs State (Rule 50)
  const [activeTab, setActiveTab] = useState<'AWAITING' | 'COMPLETED' | 'DISCREPANCIES'>('AWAITING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedManifestId, setSelectedManifestId] = useState<string | null>(
    preselectedManifestId || null
  );

  // Mobile Stepper State (Rule 65)
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Package Scanning & Verification State (Rules 17-27)
  const [scanInput, setScanInput] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanNotice, setScanNotice] = useState<{
    type: 'SUCCESS' | 'DUPLICATE' | 'ERROR' | 'UNEXPECTED';
    message: string;
  } | null>(null);

  const [scannedPackageIds, setScannedPackageIds] = useState<Set<string>>(new Set());
  const [unexpectedPackages, setUnexpectedPackages] = useState<
    Array<{ trackingNumber: string; scannedAt: string }>
  >([]);

  // Seals state: shipmentId -> { receivedSeal: string; isMatched: boolean; isMissing: boolean }
  const [sealChecks, setSealChecks] = useState<
    Record<string, { receivedSeal: string; isMatched: boolean; isMissing: boolean }>
  >({});

  // Conditions state: shipmentId -> 'GOOD' | 'DAMAGED' | 'TAMPERED'
  const [packageConditions, setPackageConditions] = useState<
    Record<string, 'GOOD' | 'DAMAGED' | 'TAMPERED'>
  >({});
  const [conditionNotes, setConditionNotes] = useState<Record<string, string>>({});

  // Modals & Submissions
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [discrepancyModalOpen, setDiscrepancyModalOpen] = useState(false);
  const [intakeNotes, setIntakeNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrModalData, setQrModalData] = useState<{ title: string; token: string } | null>(null);

  // Drawer inspection state
  const [drawerItem, setDrawerItem] = useState<{
    type: 'SHIPMENT' | 'TRIP' | 'TRAVELER' | 'MANIFEST';
    data: any;
  } | null>(null);

  // Offline detection (Rule 72)
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
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

  // Sync preselected manifest if changed
  useEffect(() => {
    if (preselectedManifestId) {
      setSelectedManifestId(preselectedManifestId);
      const targetManifest = manifests.find((m) => m.id === preselectedManifestId);
      if (targetManifest) {
        if (targetManifest.status === 'CLOSED') {
          setActiveTab('COMPLETED');
        } else if (targetManifest.status === 'DISCREPANCY' || targetManifest.status === 'DISCREPANCY_FLAGGED') {
          setActiveTab('DISCREPANCIES');
        } else {
          setActiveTab('AWAITING');
        }
      }
    }
  }, [preselectedManifestId, manifests]);

  // Selected manifest, trip, and packages
  const selectedManifest = useMemo(() => {
    return manifests.find((m) => m.id === selectedManifestId) || null;
  }, [manifests, selectedManifestId]);

  const associatedTrip = useMemo(() => {
    if (!selectedManifest) return null;
    return trips.find((t) => t.id === selectedManifest.tripId) || null;
  }, [trips, selectedManifest]);

  const manifestPackages = useMemo(() => {
    if (!selectedManifest || !selectedManifest.shipmentIds) return [];
    return shipments.filter((s) => selectedManifest.shipmentIds.includes(s.id));
  }, [shipments, selectedManifest]);

  // Initialize verification state when a manifest is selected
  useEffect(() => {
    if (selectedManifest && manifestPackages.length > 0) {
      // If manifest is already CLOSED, mark all as scanned and verified
      if (selectedManifest.status === 'CLOSED') {
        setScannedPackageIds(new Set(manifestPackages.map((p) => p.id)));
        const initialSeals: Record<string, { receivedSeal: string; isMatched: boolean; isMissing: boolean }> = {};
        const initialConditions: Record<string, 'GOOD' | 'DAMAGED' | 'TAMPERED'> = {};
        manifestPackages.forEach((p) => {
          initialSeals[p.id] = {
            receivedSeal: p.securitySealId || 'SEAL-OK',
            isMatched: true,
            isMissing: false,
          };
          initialConditions[p.id] = 'GOOD';
        });
        setSealChecks(initialSeals);
        setPackageConditions(initialConditions);
      } else {
        // Reset or initialize default seals and conditions
        const initialConditions: Record<string, 'GOOD' | 'DAMAGED' | 'TAMPERED'> = {};
        const initialSeals: Record<string, { receivedSeal: string; isMatched: boolean; isMissing: boolean }> = {};
        manifestPackages.forEach((p) => {
          initialConditions[p.id] = 'GOOD';
          initialSeals[p.id] = {
            receivedSeal: p.securitySealId || '',
            isMatched: true, // Default to matching expected seal
            isMissing: false,
          };
        });
        setPackageConditions(initialConditions);
        setSealChecks(initialSeals);
        setScannedPackageIds(new Set());
        setUnexpectedPackages([]);
        setScanNotice(null);
      }
    }
  }, [selectedManifestId]);

  // Auto-select first awaiting manifest if none selected
  useEffect(() => {
    if (!selectedManifestId && manifests.length > 0) {
      const firstAwaiting = manifests.find(
        (m) =>
          m.destinationHubId === currentHub.id &&
          (m.status === 'HANDED_OVER' || m.status === 'IN_TRANSIT')
      );
      if (firstAwaiting) {
        setSelectedManifestId(firstAwaiting.id);
      } else {
        const anyHubAwaiting = manifests.find(
          (m) => m.status === 'HANDED_OVER' || m.status === 'IN_TRANSIT'
        );
        if (anyHubAwaiting) {
          setSelectedManifestId(anyHubAwaiting.id);
        } else if (manifests[0]) {
          setSelectedManifestId(manifests[0].id);
        }
      }
    }
  }, [manifests, currentHub.id, selectedManifestId]);

  // Derived Verification & Integrity Checks (Rules 11-14)
  const isWrongHub = useMemo(() => {
    if (!selectedManifest) return false;
    return selectedManifest.destinationHubId !== currentHub.id;
  }, [selectedManifest, currentHub.id]);

  const isTravelerMismatch = useMemo(() => {
    if (!selectedManifest || !associatedTrip) return false;
    return selectedManifest.travelerId !== associatedTrip.travelerId;
  }, [selectedManifest, associatedTrip]);

  const isTripInvalid = useMemo(() => {
    if (!associatedTrip) return false;
    return associatedTrip.status === 'CANCELLED' || associatedTrip.status === 'REJECTED';
  }, [associatedTrip]);

  const isFlightMismatch = useMemo(() => {
    if (!selectedManifest || !associatedTrip) return false;
    if (selectedManifest.flightNumber && associatedTrip.flightNumber) {
      return (
        selectedManifest.flightNumber.replace(/\s+/g, '').toUpperCase() !==
        associatedTrip.flightNumber.replace(/\s+/g, '').toUpperCase()
      );
    }
    return false;
  }, [selectedManifest, associatedTrip]);

  const isAlreadyCompleted = useMemo(() => {
    return selectedManifest?.status === 'CLOSED';
  }, [selectedManifest]);

  // Scanned counts & weights (Rules 28-30)
  const expectedCount = manifestPackages.length;
  const scannedExpectedPackages = useMemo(() => {
    return manifestPackages.filter((p) => scannedPackageIds.has(p.id));
  }, [manifestPackages, scannedPackageIds]);

  const scannedCount = scannedExpectedPackages.length;

  const missingPackages = useMemo(() => {
    return manifestPackages.filter((p) => !scannedPackageIds.has(p.id));
  }, [manifestPackages, scannedPackageIds]);
  const missingCount = missingPackages.length;

  const unexpectedCount = unexpectedPackages.length;

  // Expected weight vs Verified weight
  const expectedWeightKg = useMemo(() => {
    if (selectedManifest && selectedManifest.totalWeightKg) {
      return Number(selectedManifest.totalWeightKg);
    }
    return Number(
      manifestPackages
        .reduce((sum, p) => sum + (p.actualWeightKg || p.estimatedWeightKg || 0), 0)
        .toFixed(2)
    );
  }, [selectedManifest, manifestPackages]);

  const receivedVerifiedWeightKg = useMemo(() => {
    return Number(
      scannedExpectedPackages
        .reduce((sum, p) => sum + (p.actualWeightKg || p.estimatedWeightKg || 0), 0)
        .toFixed(2)
    );
  }, [scannedExpectedPackages]);

  const weightDiscrepancy = useMemo(() => {
    if (scannedCount === expectedCount && expectedCount > 0) {
      return Math.abs(expectedWeightKg - receivedVerifiedWeightKg) > 0.05;
    }
    return false;
  }, [scannedCount, expectedCount, expectedWeightKg, receivedVerifiedWeightKg]);

  // Seal Mismatches & Damaged Items (Rules 22-27, 55, 56)
  const sealMismatches = useMemo(() => {
    return manifestPackages.filter((p) => {
      const check = sealChecks[p.id];
      return check && (!check.isMatched || check.isMissing);
    });
  }, [manifestPackages, sealChecks]);

  const damagedPackages = useMemo(() => {
    return manifestPackages.filter((p) => {
      const cond = packageConditions[p.id];
      return cond === 'DAMAGED' || cond === 'TAMPERED';
    });
  }, [manifestPackages, packageConditions]);

  const allExpectedScanned = expectedCount > 0 && scannedCount === expectedCount;
  const allSealsVerified = manifestPackages.length > 0 && manifestPackages.every((p) => sealChecks[p.id]?.isMatched === true);
  const allConditionsChecked = manifestPackages.length > 0 && manifestPackages.every((p) => !!packageConditions[p.id]);

  const hasDiscrepancies = useMemo(() => {
    return (
      missingCount > 0 ||
      unexpectedCount > 0 ||
      sealMismatches.length > 0 ||
      damagedPackages.length > 0 ||
      weightDiscrepancy ||
      isWrongHub ||
      isTravelerMismatch ||
      isTripInvalid
    );
  }, [
    missingCount,
    unexpectedCount,
    sealMismatches.length,
    damagedPackages.length,
    weightDiscrepancy,
    isWrongHub,
    isTravelerMismatch,
    isTripInvalid,
  ]);

  // 14-Point Intake Readiness Checklist (Rule 39)
  const checklist = useMemo(() => {
    return [
      {
        id: 'dest_hub_correct',
        labelAr: 'مركز الوجهة صحيح ومطابق للموظف الحالي',
        labelEn: 'Destination hub correct & matches current employee hub',
        pass: !isWrongHub,
        failReasonAr: `وجهة المانيفست لا تطابق الفرع الحالي (${currentHub.nameAr})`,
        failReasonEn: `Destination hub does not match current hub (${currentHub.nameEn})`,
      },
      {
        id: 'traveler_verified',
        labelAr: 'المسافر معتمد ومطابق لبيانات المانيفست والرحلة',
        labelEn: 'Traveler verified & matches manifest and trip records',
        pass: !isTravelerMismatch && !!selectedManifest?.travelerId,
        failReasonAr: 'بيانات المسافر في الرحلة تختلف عن المسافر المسجل في المانيفست',
        failReasonEn: 'Traveler on trip differs from traveler registered on manifest',
      },
      {
        id: 'trip_verified',
        labelAr: 'الرحلة الجوية صالحة وغير ملغاة أو مرفوضة',
        labelEn: 'Flight trip valid & not cancelled or rejected',
        pass: !isTripInvalid && !!associatedTrip,
        failReasonAr: 'الرحلة ملغاة أو غير صالحة للاستقبال',
        failReasonEn: 'Trip is cancelled, rejected, or missing',
      },
      {
        id: 'flight_verified',
        labelAr: 'رقم الرحلة وشركة الطيران مطابقة للمانيفست',
        labelEn: 'Flight number & airline match manifest',
        pass: !isFlightMismatch,
        failReasonAr: 'تعارض في رقم الرحلة الجوية المسجل',
        failReasonEn: 'Flight number discrepancy detected',
      },
      {
        id: 'manifest_verified',
        labelAr: 'المانيفست الجوي موثق وموجود في النظام',
        labelEn: 'Air manifest verified & exists in system',
        pass: !!selectedManifest,
        failReasonAr: 'لم يتم العثور على سجل المانيفست',
        failReasonEn: 'Manifest record not found',
      },
      {
        id: 'manifest_status_valid',
        labelAr: 'حالة المانيفست مؤهلة للاستقبال (سُلّم للمسافر / قيد النقل)',
        labelEn: 'Manifest status eligible (HANDED_OVER / IN_TRANSIT)',
        pass:
          selectedManifest?.status === 'HANDED_OVER' ||
          selectedManifest?.status === 'IN_TRANSIT' ||
          (selectedManifest?.status === 'CLOSED' && isAlreadyCompleted),
        failReasonAr: `حالة المانيفست الحالية (${selectedManifest?.status}) غير مؤهلة للاستقبال`,
        failReasonEn: `Current manifest status (${selectedManifest?.status}) not eligible for intake`,
      },
      {
        id: 'all_packages_scanned',
        labelAr: 'تم مسح وتدقيق كافة الطرود المتوقعة بالكامل',
        labelEn: 'All expected packages scanned & accounted for',
        pass: allExpectedScanned,
        failReasonAr: `تم مسح ${scannedCount} من أصل ${expectedCount} طرد`,
        failReasonEn: `Only ${scannedCount} of ${expectedCount} packages scanned`,
      },
      {
        id: 'no_unexpected_packages',
        labelAr: 'لا توجد طرود غير مدرجة أو مجهولة المصدر',
        labelEn: 'No unexpected packages scanned',
        pass: unexpectedCount === 0,
        failReasonAr: `يوجد ${unexpectedCount} طرد غير مدرج في المانيفست`,
        failReasonEn: `${unexpectedCount} unexpected package(s) detected`,
      },
      {
        id: 'all_seals_verified',
        labelAr: 'كافة الأختام الأمنية مطابقة وسليمة 100%',
        labelEn: 'All security seals verified & intact',
        pass: allSealsVerified && sealMismatches.length === 0,
        failReasonAr: `يوجد ${sealMismatches.length} ختم غير مطابق أو مفقود`,
        failReasonEn: `${sealMismatches.length} seal mismatch or missing`,
      },
      {
        id: 'all_conditions_checked',
        labelAr: 'تم فحص الحالة الفيزيائية لكافة الطرود بالكامل',
        labelEn: 'All physical package conditions checked',
        pass: allConditionsChecked,
        failReasonAr: 'لم يتم استكمال فحص حالة كافة الطرود',
        failReasonEn: 'Condition checks incomplete',
      },
      {
        id: 'no_missing_packages',
        labelAr: 'لا توجد أي طرود مفقودة من المانيفست',
        labelEn: 'No missing packages from manifest',
        pass: missingCount === 0,
        failReasonAr: `يوجد ${missingCount} طرد متوقع لم يتم استلامه`,
        failReasonEn: `${missingCount} expected package(s) missing`,
      },
      {
        id: 'no_damaged_packages_blocking',
        labelAr: 'لا توجد طرود متضررة تعيق الإغلاق النظامي',
        labelEn: 'No damaged packages blocking normal closure',
        pass: damagedPackages.length === 0,
        failReasonAr: `تم رصد ${damagedPackages.length} طرد متضرر أو به شبهة عبث`,
        failReasonEn: `${damagedPackages.length} package(s) flagged as damaged/tampered`,
      },
      {
        id: 'no_blocking_incident',
        labelAr: 'لا توجد بلاغات أمنية أو عمليات اشتباه مفتوحة تمنع الاستقبال',
        labelEn: 'No open blocking operational incidents',
        pass: !operationalIncidents.some(
          (inc) =>
            inc.relatedManifestId === selectedManifest?.id &&
            (inc.priority === 'CRITICAL' || inc.priority === 'HIGH') &&
            inc.status === 'OPEN'
        ),
        failReasonAr: 'يوجد بلاغ تشغيلي أمني مفتوح على هذا المانيفست',
        failReasonEn: 'Open critical operational incident linked to this manifest',
      },
      {
        id: 'count_and_weight_consistent',
        labelAr: 'تطابق كامل بين الوزن الإجمالي المتوقع والمستلم فعلياً',
        labelEn: 'Manifest package count & weight consistent',
        pass: scannedCount === expectedCount && !weightDiscrepancy,
        failReasonAr: `فارق وزن بين المتوقع (${expectedWeightKg} كغم) والمستلم (${receivedVerifiedWeightKg} كغم)`,
        failReasonEn: `Weight discrepancy between expected (${expectedWeightKg} KG) and received (${receivedVerifiedWeightKg} KG)`,
      },
    ];
  }, [
    isWrongHub,
    isTravelerMismatch,
    isTripInvalid,
    isFlightMismatch,
    selectedManifest,
    associatedTrip,
    isAlreadyCompleted,
    allExpectedScanned,
    scannedCount,
    expectedCount,
    unexpectedCount,
    allSealsVerified,
    sealMismatches.length,
    allConditionsChecked,
    missingCount,
    damagedPackages.length,
    operationalIncidents,
    weightDiscrepancy,
    expectedWeightKg,
    receivedVerifiedWeightKg,
    currentHub,
  ]);

  const allChecklistPass = checklist.every((item) => item.pass);

  // 4 KPI Cards (Rule 6)
  const kpis = useMemo(() => {
    // 1. Arrivals Awaiting Intake
    const awaitingManifests = manifests.filter(
      (m) =>
        m.destinationHubId === currentHub.id &&
        (m.status === 'HANDED_OVER' || m.status === 'IN_TRANSIT')
    );
    const arrivalsAwaitingCount = awaitingManifests.length;

    // 2. Packages Expected in awaiting manifests
    const packagesExpectedCount = awaitingManifests.reduce((sum, m) => {
      return sum + (m.shipmentIds ? m.shipmentIds.length : m.totalPackages || 0);
    }, 0);

    // 3. Received Today
    const receivedTodayCount = shipments.filter(
      (s) => s.destinationHubId === currentHub.id && s.currentStatus === 'RECEIVED_AT_DEST'
    ).length;

    // 4. Discrepancies
    const discrepanciesCount = manifests.filter(
      (m) =>
        m.destinationHubId === currentHub.id &&
        (m.status === 'DISCREPANCY' || m.status === 'DISCREPANCY_FLAGGED')
    ).length;

    return {
      arrivalsAwaitingCount,
      packagesExpectedCount,
      receivedTodayCount,
      discrepanciesCount,
    };
  }, [manifests, shipments, currentHub.id]);

  // Tab Filtering & Search (Rule 50)
  const filteredManifests = useMemo(() => {
    return manifests.filter((m) => {
      // Tab filter
      if (activeTab === 'AWAITING') {
        if (m.status === 'CLOSED' || m.status === 'DISCREPANCY' || m.status === 'DISCREPANCY_FLAGGED') {
          return false;
        }
      } else if (activeTab === 'COMPLETED') {
        if (m.status !== 'CLOSED') return false;
      } else if (activeTab === 'DISCREPANCIES') {
        if (m.status !== 'DISCREPANCY' && m.status !== 'DISCREPANCY_FLAGGED') return false;
      }

      // Search filter (Rule 7)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = (m.manifestCode || m.id || '').toLowerCase().includes(q);
        const flightMatch = (m.flightNumber || '').toLowerCase().includes(q);
        const travelerMatch = (m.travelerName || m.assignedTravelerName || '').toLowerCase().includes(q);
        const tripMatch = (m.tripId || '').toLowerCase().includes(q);
        return codeMatch || flightMatch || travelerMatch || tripMatch;
      }

      return true;
    });
  }, [manifests, activeTab, searchQuery]);

  // Package Scan Handler (Rules 17-21)
  const handleProcessScan = (codeToScan: string) => {
    const raw = codeToScan.trim();
    if (!raw) return;

    // 1. Search inside current selected manifest
    const matchedPackage = manifestPackages.find(
      (p) =>
        p.trackingNumber.toLowerCase() === raw.toLowerCase() ||
        p.id.toLowerCase() === raw.toLowerCase() ||
        (p.securitySealId && p.securitySealId.toLowerCase() === raw.toLowerCase())
    );

    if (matchedPackage) {
      // 2. Duplicate Check (Rule 19)
      if (scannedPackageIds.has(matchedPackage.id)) {
        setScanNotice({
          type: 'DUPLICATE',
          message: isAr
            ? `تنبيه: الطرد [${matchedPackage.trackingNumber}] تم مسحه مسبقاً، لم تتم زيادة العدد.`
            : `Package already scanned [${matchedPackage.trackingNumber}]. Count not incremented.`,
        });
        setScanInput('');
        return;
      }

      // 3. Mark as Received / Scanned (Rule 18)
      setScannedPackageIds((prev) => new Set(prev).add(matchedPackage.id));

      // Auto-verify seal matching expected
      setSealChecks((prev) => ({
        ...prev,
        [matchedPackage.id]: {
          receivedSeal: matchedPackage.securitySealId || '',
          isMatched: true,
          isMissing: false,
        },
      }));

      setScanNotice({
        type: 'SUCCESS',
        message: isAr
          ? `✓ تم مسح ومطابقة الطرد بنجاح: ${matchedPackage.trackingNumber} (${matchedPackage.actualWeightKg} كغم)`
          : `✓ Package verified & received: ${matchedPackage.trackingNumber} (${matchedPackage.actualWeightKg} KG)`,
      });
      setScanInput('');
    } else {
      // 4. Unexpected Package (Rule 20)
      const existingUnexpected = unexpectedPackages.find(
        (u) => u.trackingNumber.toLowerCase() === raw.toLowerCase()
      );
      if (!existingUnexpected) {
        setUnexpectedPackages((prev) => [
          ...prev,
          { trackingNumber: raw, scannedAt: new Date().toISOString() },
        ]);
      }
      setScanNotice({
        type: 'UNEXPECTED',
        message: isAr
          ? `⚠ طرد غير مدرج (UNEXPECTED PACKAGE): الرمز [${raw}] غير مسجل ضمن هذا المانيفست. تم تسجيل حالة عدم تطابق.`
          : `⚠ UNEXPECTED PACKAGE: Code [${raw}] is not listed in this manifest. Flagged as discrepancy.`,
      });
      setScanInput('');
    }
  };

  // Quick Action: Scan All Expected (For instant testing efficiency)
  const handleScanAllExpected = () => {
    if (!manifestPackages.length) return;
    const allIds = new Set(manifestPackages.map((p) => p.id));
    setScannedPackageIds(allIds);

    const allSeals: Record<string, { receivedSeal: string; isMatched: boolean; isMissing: boolean }> = {};
    const allConds: Record<string, 'GOOD' | 'DAMAGED' | 'TAMPERED'> = {};
    manifestPackages.forEach((p) => {
      allSeals[p.id] = {
        receivedSeal: p.securitySealId || '',
        isMatched: true,
        isMissing: false,
      };
      allConds[p.id] = 'GOOD';
    });
    setSealChecks(allSeals);
    setPackageConditions(allConds);
    setUnexpectedPackages([]);
    setScanNotice({
      type: 'SUCCESS',
      message: isAr
        ? `✓ تم مسح ومطابقة كافة الطرود المتوقعة بالكامل (${manifestPackages.length} طرد).`
        : `✓ All expected packages scanned & verified (${manifestPackages.length} packages).`,
    });
  };

  // Individual Seal Match / Mismatch Toggles (Rules 22-24, 55)
  const handleSetSealStatus = (
    shipmentId: string,
    statusType: 'MATCH' | 'MISMATCH' | 'MISSING',
    customSealValue?: string
  ) => {
    const pkg = manifestPackages.find((p) => p.id === shipmentId);
    if (!pkg) return;

    if (statusType === 'MATCH') {
      setSealChecks((prev) => ({
        ...prev,
        [shipmentId]: {
          receivedSeal: pkg.securitySealId || 'SEAL-OK',
          isMatched: true,
          isMissing: false,
        },
      }));
    } else if (statusType === 'MISMATCH') {
      setSealChecks((prev) => ({
        ...prev,
        [shipmentId]: {
          receivedSeal: customSealValue || 'SEAL-MISMATCH-999',
          isMatched: false,
          isMissing: false,
        },
      }));
    } else if (statusType === 'MISSING') {
      setSealChecks((prev) => ({
        ...prev,
        [shipmentId]: {
          receivedSeal: 'NO_SEAL_PRESENT',
          isMatched: false,
          isMissing: true,
        },
      }));
    }
  };

  // Condition Change Handler (Rules 25-27, 56)
  const handleSetCondition = (
    shipmentId: string,
    cond: 'GOOD' | 'DAMAGED' | 'TAMPERED',
    notes?: string
  ) => {
    setPackageConditions((prev) => ({
      ...prev,
      [shipmentId]: cond,
    }));
    if (notes !== undefined) {
      setConditionNotes((prev) => ({
        ...prev,
        [shipmentId]: notes,
      }));
    }
  };

  // Final Successful Intake Submission (Rules 40-47)
  const handleConfirmSuccessfulIntake = async () => {
    if (!selectedManifest || !allChecklistPass) return;
    if (!isOnline) {
      alert(
        isAr
          ? 'لا يمكن إتمام استلام العهدة أثناء انقطاع الاتصال (Offline).'
          : 'Destination intake cannot be completed while offline.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await onDestinationIntakeComplete({
        manifestId: selectedManifest.id,
        tripId: selectedManifest.tripId,
        verifiedShipmentIds: Array.from(scannedPackageIds),
        missingShipmentIds: [],
        sealMismatchIds: [],
        damagedShipmentIds: [],
        custodyFrom: 'TRAVELER',
        custodyTo: 'DESTINATION_HUB',
        status: 'CLOSED',
        notes: intakeNotes || (isAr ? 'تم استلام الوصول ومطابقة الأختام والطرود بنجاح تام.' : 'Destination intake completed with 100% verification.'),
      });

      if (ok) {
        setConfirmModalOpen(false);
        setActiveTab('COMPLETED');
        if (onRefreshData) onRefreshData();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Discrepancy Halt Submission (Rules 34-37, 54)
  const handleConfirmDiscrepancyHalt = async () => {
    if (!selectedManifest) return;
    setIsSubmitting(true);
    try {
      const ok = await onDestinationIntakeComplete({
        manifestId: selectedManifest.id,
        tripId: selectedManifest.tripId,
        verifiedShipmentIds: Array.from(scannedPackageIds),
        missingShipmentIds: missingPackages.map((p) => p.id),
        sealMismatchIds: sealMismatches.map((p) => p.id),
        damagedShipmentIds: damagedPackages.map((p) => p.id),
        custodyFrom: 'TRAVELER',
        custodyTo: 'EXPLICIT_PER_PACKAGE_STATE',
        status: 'DISCREPANCY',
        notes:
          intakeNotes ||
          (isAr
            ? `تم تسجيل فروقات أمنية في الوصول: ${missingCount} مفقود، ${sealMismatches.length} عدم تطابق أختام، ${damagedPackages.length} متضرر.`
            : `Intake discrepancy flagged: ${missingCount} missing, ${sealMismatches.length} seal mismatch, ${damagedPackages.length} damaged.`),
      });

      if (ok) {
        setDiscrepancyModalOpen(false);
        setActiveTab('DISCREPANCIES');
        if (onRefreshData) onRefreshData();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header (Rule 5) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold shadow-2xs">
              <ArrowDownToLine className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  {isAr ? 'استقبال الوصول' : 'Destination Intake'}
                </h1>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  STAGE 04
                </span>
                {!isOnline && (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200">
                    <WifiOff className="w-3 h-3" />
                    <span>{isAr ? 'غير متصل (Offline)' : 'Offline'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
                {isAr
                  ? 'استلام الرحلات والمانيفستات الواردة والتحقق من الطرود والأختام والحالة قبل نقل العهدة من المسافر إلى مركز الوجهة.'
                  : 'Receive arriving traveler manifests, verify tamper seals and package conditions before custody transfer from traveler to destination hub.'}
              </p>
            </div>
          </div>
        </div>

        {/* Current Destination Hub Badge (Rule 5) */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
          <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="text-start">
            <div className="text-[10px] text-slate-500 font-bold">
              {isAr ? 'مركز الوجهة المعتمد:' : 'Current Destination Hub:'}
            </div>
            <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>{isAr ? currentHub.nameAr : currentHub.nameEn}</span>
              <span className="font-mono text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded font-bold">
                {currentHub.code || currentHub.id}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KPI Cards (Strictly 4 Cards - Rule 6) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Arrivals Awaiting Intake */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">
              {isAr ? 'رحلات بانتظار الاستقبال' : 'Arrivals Awaiting Intake'}
            </span>
            <Plane className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {kpis.arrivalsAwaitingCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>{isAr ? 'رحلات مسافري الوجهة' : 'Arriving flight manifests'}</span>
          </div>
        </div>

        {/* KPI 2: Packages Expected */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">
              {isAr ? 'إجمالي الطرود المتوقعة' : 'Packages Expected'}
            </span>
            <Boxes className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {kpis.packagesExpectedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isAr ? 'بانتظار الفحص ومطابقة الأختام' : 'Awaiting seal & condition check'}
          </div>
        </div>

        {/* KPI 3: Received Today */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">
              {isAr ? 'تم استلامها اليوم' : 'Received Today'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {kpis.receivedTodayCount}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            {isAr ? 'وصلت فرع الوجهة (RECEIVED_AT_DEST)' : 'Arrived at destination hub'}
          </div>
        </div>

        {/* KPI 4: Discrepancies */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">
              {isAr ? 'حالات الفروقات والتعليق' : 'Discrepancies'}
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div
            className={`text-2xl font-black tracking-tight ${
              kpis.discrepanciesCount > 0 ? 'text-amber-600' : 'text-slate-900'
            }`}
          >
            {kpis.discrepanciesCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isAr ? 'فارق أختام أو طرود مفقودة/تالفة' : 'Missing, mismatch or damage'}
          </div>
        </div>
      </div>

      {/* 3. Search & Tabs Toolbar (Rules 7, 50) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('AWAITING')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'AWAITING'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'بانتظار الاستقبال' : 'Awaiting Intake'} ({kpis.arrivalsAwaitingCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('COMPLETED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'COMPLETED'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'الاستقبال المكتمل' : 'Completed Arrivals'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('DISCREPANCIES')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'DISCREPANCIES'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isAr ? 'فروقات وصول' : 'Discrepancies'} ({kpis.discrepanciesCount})
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isAr
                    ? 'بحث برقم المانيفست، الرحلة، المسافر، أو QR...'
                    : 'Search by Manifest ID, Flight, Traveler, QR...'
                }
                className="w-full ps-9 pe-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
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

            {/* Quick Camera Scanner Button */}
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              <Scan className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">{isAr ? 'مسح بالكاميرا' : 'Camera Scan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Layout: LEFT = Arrivals Queue, RIGHT = Workspace (Rule 64) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Arrivals List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  {activeTab === 'AWAITING'
                    ? isAr
                      ? 'قائمة الرحلات المؤهلة للاستقبال'
                      : 'Eligible Arrivals Queue'
                    : activeTab === 'COMPLETED'
                    ? isAr
                      ? 'عمليات الاستقبال المؤكدة والمغلقة'
                      : 'Closed & Completed Arrivals'
                    : isAr
                    ? 'الرحلات المحالة للفحص الأمني'
                    : 'Arrivals Under Discrepancy Review'}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.2 rounded-full bg-slate-100 text-slate-700 font-bold">
                  {filteredManifests.length}
                </span>
              </div>
            </div>

            {/* Empty State (Rule 71) */}
            {filteredManifests.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <div className="text-xs font-bold text-slate-700">
                  {isAr
                    ? 'لا توجد رحلات بانتظار الاستقبال حالياً'
                    : 'No arrivals currently awaiting intake'}
                </div>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  {isAr
                    ? 'جميع المانيفستات الواردة لفرعك تم استلامها ونقل عهدتها بنجاح.'
                    : 'All arriving flight manifests for this destination hub have been processed.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-2">
                {filteredManifests.map((manifest) => {
                  const isSelected = selectedManifestId === manifest.id;
                  const isWrong = manifest.destinationHubId !== currentHub.id;
                  const trip = trips.find((t) => t.id === manifest.tripId);
                  const pkgCount = manifest.shipmentIds ? manifest.shipmentIds.length : manifest.totalPackages || 0;

                  return (
                    <div
                      key={manifest.id}
                      onClick={() => {
                        setSelectedManifestId(manifest.id);
                        setMobileStep(2); // Auto-advance to verify step on mobile
                      }}
                      className={`p-3.5 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50/80 border-2 border-blue-600 shadow-xs'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-black text-xs text-blue-900">
                              {manifest.manifestCode || manifest.id}
                            </span>
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 flex items-center gap-1">
                              <Plane className="w-2.5 h-2.5 text-blue-600" />
                              <span>{manifest.flightNumber || trip?.flightNumber || 'RJ517'}</span>
                            </span>
                            {isWrong && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                                {isAr ? 'فرع آخر' : 'Other Hub'}
                              </span>
                            )}
                          </div>

                          <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                            <span>{manifest.travelerName || manifest.assignedTravelerName || trip?.travelerName || 'المسافر المعتمد'}</span>
                            <span className="text-[11px] text-slate-400 font-normal">
                              ({manifest.originHubId === 'hub-amm' ? 'AMM' : 'ALG'} → {manifest.destinationHubId === 'hub-alg' ? 'ALG' : 'AMM'})
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Boxes className="w-3 h-3 text-slate-400" />
                              <span>{pkgCount} {isAr ? 'طرود' : 'Packages'}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Scale className="w-3 h-3 text-slate-400" />
                              <span>{manifest.totalWeightKg} {isAr ? 'كغم' : 'KG'}</span>
                            </span>
                          </div>
                        </div>

                        <div className="text-end shrink-0 space-y-1">
                          <StatusBadge domain="MANIFEST" status={manifest.status} locale={locale} size="sm" />
                          <div>
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                              manifest.status === 'CLOSED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : manifest.status === 'DISCREPANCY'
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {manifest.status === 'CLOSED'
                                ? (isAr ? 'مستلم ومغلق' : 'Completed')
                                : manifest.status === 'DISCREPANCY'
                                ? (isAr ? 'فروقات وصول' : 'Discrepancy')
                                : (isAr ? 'بانتظار الاستقبال' : 'Awaiting Intake')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Destination Intake Workspace (7 cols - Rules 10-41) */}
        <div className="lg:col-span-7 space-y-4">
          {!selectedManifest ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-2xs space-y-2">
              <Boxes className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">
                {isAr ? 'اختر رحلة وصول لبدء الاستقبال' : 'Select an arriving manifest to begin intake'}
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {isAr
                  ? 'انقر على أي مانيفست من القائمة للمطابقة ونقل العهدة من المسافر.'
                  : 'Click any manifest from the left queue to verify packages, seals, and complete intake.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Workspace Header with Status and Manifest ID */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-black text-blue-950">
                        {selectedManifest.manifestCode || selectedManifest.id}
                      </span>
                      <StatusBadge domain="MANIFEST" status={selectedManifest.status} locale={locale} size="sm" />
                      {isAlreadyCompleted && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {isAr ? 'استقبال مكتمل (READ-ONLY)' : 'Already Completed (READ-ONLY)'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {isAr ? 'رمز التوثيق المشفر للمانيفست:' : 'Cryptographic Handover Token:'}{' '}
                      <span className="font-mono font-bold text-slate-700">
                        {selectedManifest.handoverToken || 'TOKEN-HMAC-VERIFIED'}
                      </span>
                    </div>
                  </div>

                  {/* Chain of Custody Official Visual Tracker (Rules 2, 74) */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs flex items-center gap-2">
                    <div className="text-slate-500 text-[10px] font-bold">
                      {isAr ? 'سلسلة العهدة:' : 'Chain of Custody:'}
                    </div>
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-slate-600 line-through text-[11px]">
                        {isAr ? 'فرع المنشأ' : 'Origin Hub'}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400 rtl:rotate-180" />
                      <span className={`text-[11px] px-1.5 py-0.5 rounded ${
                        isAlreadyCompleted ? 'line-through text-slate-500' : 'bg-indigo-100 text-indigo-800 font-black'
                      }`}>
                        {isAr ? 'المسافر (حالياً)' : 'Traveler (Current)'}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400 rtl:rotate-180" />
                      <span className={`text-[11px] px-1.5 py-0.5 rounded ${
                        isAlreadyCompleted ? 'bg-emerald-100 text-emerald-800 font-black' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isAr ? 'فرع الوجهة (بعد التأكيد)' : 'Dest Hub (Post-Intake)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Critical Guardrail Warnings (Rules 11, 12, 13) */}
                {isWrongHub && (
                  <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">
                        {isAr ? 'استقبال محظور: فرع وصول غير مطابق (WRONG DESTINATION HUB)' : 'INTAKE BLOCKED: Wrong Destination Hub'}
                      </div>
                      <div className="text-[11px] text-rose-800 mt-0.5">
                        {isAr
                          ? `هذا المانيفست موجه إلى (${selectedManifest.destinationHubId})، بينما فرعك الحالي هو (${currentHub.nameAr}). لا يسمح باستقبال الوصول إلا في مركز الوجهة المحدد.`
                          : `This manifest is routed to (${selectedManifest.destinationHubId}), while your current hub is (${currentHub.nameEn}). Intake can only be completed by authorized agents at destination.`}
                      </div>
                    </div>
                  </div>
                )}

                {isTravelerMismatch && (
                  <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs flex items-start gap-2.5">
                    <UserX className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">
                        {isAr ? 'استقبال محظور: عدم تطابق المسافر (TRAVELER MISMATCH)' : 'INTAKE BLOCKED: Traveler Mismatch'}
                      </div>
                      <div className="text-[11px] text-rose-800 mt-0.5">
                        {isAr
                          ? 'المسافر المرتبط بالرحلة لا يطابق المسافر المسجل على هذا المانيفست. يتطلب تحقيقاً أمنياً فورياً.'
                          : 'Traveler on trip record does not match registered traveler on this manifest.'}
                      </div>
                    </div>
                  </div>
                )}

                {isTripInvalid && (
                  <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">
                        {isAr ? 'استقبال محظور: الرحلة الجوية ملغاة أو مرفوضة' : 'INTAKE BLOCKED: Flight Trip Cancelled or Rejected'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Section A, B, C, D: Verification Grid (Rules 11-15) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Flight & Airline */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="text-[10px] text-slate-500 font-bold flex items-center justify-between">
                      <span>{isAr ? 'الرحلة والمسار' : 'Flight & Route'}</span>
                      <Plane className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="font-black text-slate-900 flex items-center gap-1.5">
                      <span className="font-mono">{selectedManifest.flightNumber || associatedTrip?.flightNumber || 'RJ517'}</span>
                      <span className="text-[10px] font-normal text-slate-600">
                        {selectedManifest.airline || associatedTrip?.airline || 'Royal Jordanian'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-slate-400" />
                      <span>
                        {selectedManifest.originHubId === 'hub-amm' ? 'AMM (عمّان)' : 'ALG (الجزائر)'} →{' '}
                        {selectedManifest.destinationHubId === 'hub-alg' ? 'ALG (الجزائر)' : 'AMM (عمّان)'}
                      </span>
                    </div>
                  </div>

                  {/* Traveler Verification */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="text-[10px] text-slate-500 font-bold flex items-center justify-between">
                      <span>{isAr ? 'المسافر الناقل' : 'Verified Traveler'}</span>
                      <UserCheck className="w-3 h-3 text-emerald-600" />
                    </div>
                    <div className="font-black text-slate-900 truncate">
                      {selectedManifest.travelerName || associatedTrip?.travelerName || 'Ahmed Benali'}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span className="text-emerald-700 font-bold">KYC ✓</span>
                      <span>•</span>
                      <span>{associatedTrip?.travelerPhone || '+213 55 998 1122'}</span>
                    </div>
                  </div>

                  {/* Package & Weight Summary */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="text-[10px] text-slate-500 font-bold flex items-center justify-between">
                      <span>{isAr ? 'حمولة المانيفست' : 'Manifest Payload'}</span>
                      <Scale className="w-3 h-3 text-indigo-600" />
                    </div>
                    <div className="font-black text-slate-900">
                      {expectedCount} {isAr ? 'طرود' : 'Packages'} • {expectedWeightKg} {isAr ? 'كغم' : 'KG'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {isAr ? 'المستلم الموثق:' : 'Verified:'}{' '}
                      <span className="font-bold text-blue-900">
                        {scannedCount}/{expectedCount} ({receivedVerifiedWeightKg} KG)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section E: Package Scanning (Rules 17-21) */}
              {!isAlreadyCompleted && (
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Scan className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-900">
                        {isAr ? 'مسح وتدقيق الطرود الواردة (Package Scanning)' : 'Scan Arriving Packages'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleScanAllExpected}
                      className="px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                    >
                      {isAr ? 'مطابقة ومسح الكل تلقائياً (Quick Scan All)' : 'Quick Scan All'}
                    </button>
                  </div>

                  {/* Scan Input Row */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute start-3 top-3" />
                      <input
                        type="text"
                        value={scanInput}
                        onChange={(e) => setScanInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleProcessScan(scanInput);
                          }
                        }}
                        placeholder={
                          isAr
                            ? 'أدخل رقم التتبع أو رقم الختم الأمني واضغط Enter...'
                            : 'Enter Tracking Number or Security Seal and press Enter...'
                        }
                        className="w-full ps-9 pe-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleProcessScan(scanInput)}
                        disabled={!scanInput.trim()}
                        className="absolute end-2 top-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        {isAr ? 'مسح' : 'Scan'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsScannerOpen(true)}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors cursor-pointer"
                      title={isAr ? 'مسح بالكاميرا' : 'Camera Scan'}
                    >
                      <Scan className="w-4 h-4 text-slate-700" />
                    </button>
                  </div>

                  {/* Scan Feedback Banners */}
                  {scanNotice && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in ${
                        scanNotice.type === 'SUCCESS'
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                          : scanNotice.type === 'DUPLICATE'
                          ? 'bg-amber-50 border border-amber-200 text-amber-900'
                          : 'bg-rose-50 border border-rose-200 text-rose-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {scanNotice.type === 'SUCCESS' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : scanNotice.type === 'DUPLICATE' ? (
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span className="font-bold">{scanNotice.message}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setScanNotice(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Section F & G: Expected Packages List (Rules 16, 22-27) */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">
                      {isAr ? 'طرود المانيفست المتوقعة وفحص الأختام' : 'Expected Packages & Tamper Seal Verification'}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.2 rounded-full bg-blue-50 text-blue-700 font-bold">
                      {scannedCount} / {expectedCount}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span className="flex items-center gap-1 text-emerald-700 font-bold">
                      <Check className="w-3.5 h-3.5" />
                      <span>{isAr ? 'سليم ومطابق' : 'Verified'}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-amber-700 font-bold">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{isAr ? 'أختام مشفرة' : 'Encrypted Seals'}</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {manifestPackages.map((pkg) => {
                    const isScanned = scannedPackageIds.has(pkg.id);
                    const sealCheck = sealChecks[pkg.id] || {
                      receivedSeal: pkg.securitySealId || '',
                      isMatched: true,
                      isMissing: false,
                    };
                    const condition = packageConditions[pkg.id] || 'GOOD';

                    return (
                      <div
                        key={pkg.id}
                        className={`p-3.5 rounded-xl border text-xs transition-all ${
                          isScanned
                            ? 'bg-slate-50/90 border-slate-200 shadow-2xs'
                            : 'bg-white border-dashed border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Package Info */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-blue-900 text-xs">
                                {pkg.trackingNumber}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                                  isScanned
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {isScanned ? (
                                  <>
                                    <Check className="w-2.5 h-2.5" />
                                    <span>{isAr ? 'تم الاستلام' : 'Scanned'}</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>{isAr ? 'بانتظار المسح' : 'Unscanned'}</span>
                                  </>
                                )}
                              </span>
                              <StatusBadge domain="SHIPMENT" status={pkg.currentStatus} locale={locale} size="sm" />
                            </div>

                            <div className="font-bold text-slate-800">{pkg.itemDescription}</div>
                            <div className="text-[11px] text-slate-500">
                              {pkg.senderName} → {pkg.recipientName} •{' '}
                              <span className="font-bold text-slate-700">
                                {pkg.actualWeightKg || pkg.estimatedWeightKg} {isAr ? 'كغم' : 'KG'}
                              </span>
                            </div>
                          </div>

                          {/* Controls: Seal & Condition Verification */}
                          {!isAlreadyCompleted && (
                            <div className="flex flex-col sm:items-end gap-2 shrink-0">
                              {/* Seal Check Controls */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-500 font-bold">
                                  {isAr ? 'الختم المتوقع:' : 'Seal:'}
                                </span>
                                <span className="font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded font-bold text-slate-800 flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5 text-teal-600" />
                                  <span>{pkg.securitySealId || 'NO-SEAL'}</span>
                                </span>

                                <select
                                  value={
                                    sealCheck.isMissing
                                      ? 'MISSING'
                                      : !sealCheck.isMatched
                                      ? 'MISMATCH'
                                      : 'MATCH'
                                  }
                                  onChange={(e) => {
                                    handleSetSealStatus(pkg.id, e.target.value as any);
                                  }}
                                  className={`text-[10px] font-bold p-1 rounded border cursor-pointer ${
                                    sealCheck.isMatched && !sealCheck.isMissing
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : 'bg-rose-50 text-rose-800 border-rose-300'
                                  }`}
                                >
                                  <option value="MATCH">{isAr ? '✓ مطابق (Verified)' : '✓ Verified Match'}</option>
                                  <option value="MISMATCH">{isAr ? '⚠ غير مطابق (Mismatch)' : '⚠ Seal Mismatch'}</option>
                                  <option value="MISSING">{isAr ? '⚠ مفقود (Missing Seal)' : '⚠ Seal Missing'}</option>
                                </select>
                              </div>

                              {/* Condition Selector */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-500 font-bold">
                                  {isAr ? 'الحالة:' : 'Condition:'}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleSetCondition(pkg.id, 'GOOD')}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                      condition === 'GOOD'
                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    {isAr ? 'سليم' : 'Good'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSetCondition(pkg.id, 'DAMAGED')}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                      condition === 'DAMAGED'
                                        ? 'bg-rose-600 text-white shadow-2xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    {isAr ? 'تالف' : 'Damaged'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSetCondition(pkg.id, 'TAMPERED')}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                      condition === 'TAMPERED'
                                        ? 'bg-amber-600 text-white shadow-2xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    {isAr ? 'شبهة عبث' : 'Tampered'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Condition Notes when Damaged or Tampered */}
                        {condition !== 'GOOD' && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <input
                              type="text"
                              value={conditionNotes[pkg.id] || ''}
                              onChange={(e) => handleSetCondition(pkg.id, condition, e.target.value)}
                              placeholder={
                                isAr
                                  ? 'سجل ملاحظات التلف أو تفاصيل الضرر المرصود...'
                                  : 'Record damage details or evidence note...'
                              }
                              className="w-full p-1.5 bg-white border border-rose-200 rounded-lg text-[11px] text-rose-900"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section H: Expected vs Received Summary (Rules 28-31) */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900">
                    {isAr ? 'ملخص المطابقة والمقارنة (Expected vs Received)' : 'Expected vs Received Reconciliation'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 font-bold">
                    {scannedCount}/{expectedCount} {isAr ? 'طرد' : 'Parcels'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[10px] text-slate-500 font-bold">
                      {isAr ? 'الطرود المتوقعة' : 'Expected'}
                    </div>
                    <div className="text-base font-black text-slate-900">{expectedCount}</div>
                    <div className="text-[10px] text-slate-500">{expectedWeightKg} KG</div>
                  </div>

                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="text-[10px] text-blue-700 font-bold">
                      {isAr ? 'المستلم الموثق' : 'Received'}
                    </div>
                    <div className="text-base font-black text-blue-950">{scannedCount}</div>
                    <div className="text-[10px] text-blue-800">{receivedVerifiedWeightKg} KG</div>
                  </div>

                  <div
                    className={`p-2.5 rounded-xl border ${
                      missingCount > 0
                        ? 'bg-rose-50 border-rose-300 text-rose-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="text-[10px] font-bold">
                      {isAr ? 'طرود مفقودة' : 'Missing'}
                    </div>
                    <div className="text-base font-black">{missingCount}</div>
                    <div className="text-[10px]">
                      {missingCount === 0 ? (isAr ? 'لا يوجد مفقود' : 'None') : (isAr ? 'تعليق الإغلاق' : 'Blocks Closure')}
                    </div>
                  </div>

                  <div
                    className={`p-2.5 rounded-xl border ${
                      sealMismatches.length > 0 || damagedPackages.length > 0 || unexpectedCount > 0
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="text-[10px] font-bold">
                      {isAr ? 'فروقات وتلف' : 'Discrepancies'}
                    </div>
                    <div className="text-base font-black">
                      {sealMismatches.length + damagedPackages.length + unexpectedCount}
                    </div>
                    <div className="text-[10px]">
                      {unexpectedCount > 0 ? `+${unexpectedCount} ${isAr ? 'غير مدرج' : 'Unexpected'}` : (isAr ? 'فحص دقيق' : 'Reviewed')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section I: Discrepancies Review Section (Rules 32-37) */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900">
                    {isAr ? 'حالة التوافق الأمني (Discrepancy Status)' : 'Security Integrity & Discrepancies'}
                  </span>
                  {!hasDiscrepancies ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>{isAr ? 'جاهز للاستقبال (PASS)' : 'Intake Readiness: PASS'}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{isAr ? 'يتطلب مراجعة (REQUIRES REVIEW)' : 'REQUIRES REVIEW'}</span>
                    </span>
                  )}
                </div>

                {!hasDiscrepancies ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {isAr
                        ? 'لا توجد أي فروقات مسجلة. كافة الطرود المتوقعة مطابقة وأختامها سليمة، وجاهزة لنقل العهدة لفرع الوجهة.'
                        : 'No discrepancies detected. All expected packages accounted for with verified seals and conditions.'}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-1.5">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{isAr ? 'تنبيه تشغيلي: تم رصد فروقات وصول تمنع الإغلاق التلقائي' : 'Operational Warning: Discrepancies Detected'}</span>
                      </div>
                      <ul className="list-disc list-inside text-[11px] text-amber-900 space-y-0.5 ps-1">
                        {missingCount > 0 && (
                          <li>
                            {isAr ? `طرد متوقع مفقود (${missingCount}):` : `Missing Package(s) (${missingCount}):`}{' '}
                            <span className="font-mono font-bold">
                              {missingPackages.map((p) => p.trackingNumber).join(', ')}
                            </span>
                          </li>
                        )}
                        {sealMismatches.length > 0 && (
                          <li>
                            {isAr
                              ? `عدم تطابق في الأختام الأمنية (${sealMismatches.length}):`
                              : `Security Seal Mismatch (${sealMismatches.length}):`}{' '}
                            <span className="font-mono font-bold">
                              {sealMismatches.map((p) => p.trackingNumber).join(', ')}
                            </span>
                          </li>
                        )}
                        {damagedPackages.length > 0 && (
                          <li>
                            {isAr
                              ? `طرود بها تلف أو شبهة عبث (${damagedPackages.length}):`
                              : `Damaged or Tampered Packages (${damagedPackages.length}):`}{' '}
                            <span className="font-mono font-bold">
                              {damagedPackages.map((p) => p.trackingNumber).join(', ')}
                            </span>
                          </li>
                        )}
                        {unexpectedCount > 0 && (
                          <li>
                            {isAr
                              ? `طرود غير مدرجة في المانيفست (${unexpectedCount}):`
                              : `Unexpected Packages (${unexpectedCount}):`}{' '}
                            <span className="font-mono font-bold">
                              {unexpectedPackages.map((u) => u.trackingNumber).join(', ')}
                            </span>
                          </li>
                        )}
                        {weightDiscrepancy && (
                          <li>
                            {isAr
                              ? `فارق في الوزن الإجمالي المعاير: متوقع ${expectedWeightKg} كغم، مستلم ${receivedVerifiedWeightKg} كغم`
                              : `Total weight discrepancy: expected ${expectedWeightKg} KG vs verified ${receivedVerifiedWeightKg} KG`}
                          </li>
                        )}
                      </ul>
                    </div>

                    {!isAlreadyCompleted && (
                      <button
                        type="button"
                        onClick={() => setDiscrepancyModalOpen(true)}
                        className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        <span>
                          {isAr
                            ? 'تسجيل حالة عدم تطابق وإيقاف الإغلاق (Flag Discrepancy & Halt Closure)'
                            : 'Flag Discrepancy & Halt Normal Closure'}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Section J: 14-Point Intake Readiness Checklist (Rule 39) */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">
                      {isAr ? 'قائمة الجاهزية التشغيلية (Intake Readiness Checklist - 14 Checks)' : 'Intake Readiness Checklist (14 Criteria)'}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      allChecklistPass
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {checklist.filter((c) => c.pass).length} / {checklist.length} PASS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {checklist.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-2 rounded-xl border flex items-start gap-2 ${
                        item.pass
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                          : 'bg-rose-50/60 border-rose-200 text-rose-950'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {item.pass ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-rose-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-[11px] leading-snug">
                          {isAr ? item.labelAr : item.labelEn}
                        </div>
                        {!item.pass && (
                          <div className="text-[10px] text-rose-700 mt-0.5">
                            {isAr ? item.failReasonAr : item.failReasonEn}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section K: Final Confirmation CTA (Rules 40, 41, 51, 52) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
                {isAlreadyCompleted ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-2">
                    <div className="font-black flex items-center gap-2 text-emerald-800">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>{isAr ? 'تم استقبال هذا الوصول وإغلاقه مسبقاً' : 'Destination Intake Already Completed'}</span>
                    </div>
                    <div className="text-[11px] text-emerald-900 grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200">
                      <div>
                        {isAr ? 'تاريخ الاستلام:' : 'Received At:'}{' '}
                        <span className="font-bold">{selectedManifest.receiptTimestamp || '2026-09-12'}</span>
                      </div>
                      <div>
                        {isAr ? 'المركز المستلم:' : 'Destination Hub:'}{' '}
                        <span className="font-bold">{currentHub.nameAr}</span>
                      </div>
                      <div>
                        {isAr ? 'عدد الطرود المستلمة:' : 'Parcels:'}{' '}
                        <span className="font-bold">{expectedCount} {isAr ? 'طرد' : 'Packages'}</span>
                      </div>
                      <div>
                        {isAr ? 'الوزن المعتمد:' : 'Verified Weight:'}{' '}
                        <span className="font-bold">{expectedWeightKg} KG</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs text-slate-500">
                      {isAr
                        ? 'بتأكيد استلام الوصول، تنتقل العهدة القانونية والمسؤولية الكاملة لكافة الطرود الموثقة من المسافر إلى فرع الوجهة.'
                        : 'By confirming destination intake, legal custody of all verified packages transfers from traveler to destination hub.'}
                    </div>

                    <button
                      type="button"
                      disabled={!allChecklistPass || isSubmitting || !isOnline}
                      onClick={() => setConfirmModalOpen(true)}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        allChecklistPass && isOnline
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isSubmitting
                          ? isAr
                            ? 'جارِ تأكيد الاستلام ونقل العهدة...'
                            : 'Confirming Intake & Custody Transfer...'
                          : isAr
                          ? 'تأكيد استلام الوصول ونقل العهدة (Complete Destination Intake)'
                          : 'Complete Destination Intake'}
                      </span>
                    </button>

                    {!allChecklistPass && (
                      <div className="text-center text-[11px] text-slate-400">
                        {isAr
                          ? 'زر التأكيد معطل حتى استيفاء جميع معايير الجاهزية الـ 14'
                          : 'Button disabled until all 14 checklist requirements PASS'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Final Confirmation Modal (Rule 41) */}
      {confirmModalOpen && selectedManifest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <ArrowDownToLine className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  {isAr ? 'تأكيد استلام الوصول النهائي' : 'Confirm Destination Arrival Intake'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'المانيفست:' : 'Manifest:'}</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedManifest.manifestCode || selectedManifest.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'المسافر:' : 'Traveler:'}</span>
                  <span className="font-bold text-slate-900">
                    {selectedManifest.travelerName || associatedTrip?.travelerName || 'Ahmed Benali'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'الرحلة:' : 'Flight:'}</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedManifest.flightNumber || associatedTrip?.flightNumber || 'RJ517'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'المسار:' : 'Route:'}</span>
                  <span className="font-bold text-slate-900">
                    {selectedManifest.originHubId === 'hub-amm' ? 'AMM' : 'ALG'} →{' '}
                    {selectedManifest.destinationHubId === 'hub-alg' ? 'ALG' : 'AMM'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200/80 pt-2">
                  <span className="text-slate-500">{isAr ? 'الطرود المستلمة والمفحوصة:' : 'Verified Packages:'}</span>
                  <span className="font-black text-emerald-700">
                    {scannedCount} / {expectedCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'الطرود المفقودة:' : 'Missing Packages:'}</span>
                  <span className="font-bold text-slate-900">{missingCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'مشاكل الأختام والتلف:' : 'Seal Issues / Damage:'}</span>
                  <span className="font-bold text-slate-900">
                    {sealMismatches.length + damagedPackages.length}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200/80 pt-2 font-bold">
                  <span className="text-slate-700">{isAr ? 'الوزن الإجمالي المعاير:' : 'Total Verified Weight:'}</span>
                  <span className="text-blue-900">{receivedVerifiedWeightKg} KG</span>
                </div>
              </div>

              {/* Official Custody Transfer Legal Text (Rule 41) */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-950 text-[11px] leading-relaxed">
                {isAr
                  ? 'بتأكيد هذا الاستقبال، تنتقل المسؤولية القانونية والعهدة لكافة الطرود المستلمة من المسافر إلى فرع الوجهة. تصبح الشحنات بحالة (RECEIVED_AT_DEST)، والمانيفست بحالة (CLOSED)، والرحلة (COMPLETED).'
                  : 'By confirming, custody of all verified packages transfers from the traveler to the destination hub.'}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'ملاحظات موظف الاستقبال (اختياري):' : 'Intake Notes (Optional):'}
                </label>
                <textarea
                  rows={2}
                  value={intakeNotes}
                  onChange={(e) => setIntakeNotes(e.target.value)}
                  placeholder={
                    isAr
                      ? 'تم استلام كافة الطرود وفحص الأختام بنجاح...'
                      : 'Received in good condition...'
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSuccessfulIntake}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? isAr
                      ? 'جارِ التأكيد...'
                      : 'Confirming...'
                    : isAr
                    ? 'تأكيد الاستلام ونقل العهدة'
                    : 'Confirm Intake & Transfer Custody'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discrepancy Modal (Rule 37) */}
      {discrepancyModalOpen && selectedManifest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  {isAr ? 'تسجيل حالة فروقات وصول (Flag Discrepancy)' : 'Flag Arrival Discrepancy'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDiscrepancyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 text-[11px] leading-relaxed">
                {isAr
                  ? 'سيتم تحويل المانيفست إلى حالة (DISCREPANCY) ولن يتم إغلاق المانيفست أو الرحلة. الطرود المفقودة لن تتحول إلى RECEIVED_AT_DEST وستبقى قيد المتابعة.'
                  : 'Manifest will be moved to DISCREPANCY. It will NOT be closed, and the trip will NOT be marked completed. Missing packages will not be marked received.'}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'سبب وملاحظات التحقيق في الفروقات:' : 'Discrepancy Investigation Notes:'}
                </label>
                <textarea
                  rows={3}
                  value={intakeNotes}
                  onChange={(e) => setIntakeNotes(e.target.value)}
                  placeholder={
                    isAr
                      ? 'تفاصيل الختم غير المطابق أو الطرود غير المستلمة...'
                      : 'Provide details on seal mismatch, damage, or missing parcels...'
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDiscrepancyModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDiscrepancyHalt}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? isAr
                      ? 'جارِ التسجيل...'
                      : 'Recording...'
                    : isAr
                    ? 'تسجيل كحالة فروقات وصول'
                    : 'Record Discrepancy & Halt'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal (Rule 7) */}
      {isScannerOpen && (
        <QRScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={(scannedCode) => {
            setIsScannerOpen(false);
            handleProcessScan(scannedCode);
          }}
          locale={locale}
          title={isAr ? 'مسح رمز تتبع الطرد أو الختم الأمني' : 'Scan Package Tracking or Seal QR'}
        />
      )}

      {/* Details Drawer for deep inspections */}
      {drawerItem && (
        <DetailsDrawer
          isOpen={!!drawerItem}
          onClose={() => setDrawerItem(null)}
          title={
            drawerItem.type === 'SHIPMENT'
              ? isAr
                ? 'تفاصيل الشحنة'
                : 'Shipment Details'
              : drawerItem.type === 'TRIP'
              ? isAr
                ? 'تفاصيل الرحلة'
                : 'Trip Details'
              : isAr
              ? 'تفاصيل المانيفست'
              : 'Manifest Details'
          }
          locale={locale}
        >
          <div className="p-4 space-y-4 text-xs">
            <pre className="bg-slate-50 p-3 rounded-xl overflow-x-auto text-[11px] font-mono border border-slate-200">
              {JSON.stringify(drawerItem.data, null, 2)}
            </pre>
          </div>
        </DetailsDrawer>
      )}
    </div>
  );
};
