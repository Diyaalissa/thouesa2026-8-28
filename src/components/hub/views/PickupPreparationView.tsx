import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  ArrowRight,
  UserCheck,
  ShieldCheck,
  Clock,
  Layers,
  Filter,
  Eye,
  RefreshCw,
  AlertCircle,
  Phone,
  Lock,
  Building2,
  Package,
  Tag,
  ArrowUpRight,
  Sparkles,
  Info,
  Calendar,
  DollarSign,
  User,
  Check,
  X,
} from 'lucide-react';
import {
  Hub,
  Locale,
  Shipment,
  EmployeeNavSection,
  User as UserType,
  OperationalIncident,
  Dispute,
} from '../../../types';
import { StatusBadge } from '../../common/StatusBadge';
import { DetailsDrawer } from '../common/DetailsDrawer';

interface PickupPreparationViewProps {
  currentHub: Hub;
  currentUser?: UserType;
  shipments: Shipment[];
  operationalIncidents?: OperationalIncident[];
  disputes?: Dispute[];
  locale: Locale;
  onPickupPreparationComplete?: (payload: {
    shipmentId: string;
    storageLocation: string;
    storageZone?: string;
    storageRack?: string;
    storageShelf?: string;
    storageBin?: string;
    preparedBy: string;
  }) => Promise<boolean> | boolean;
  onNavigate: (section: EmployeeNavSection) => void;
  onRefreshData: () => void;
}

type TabType = 'AWAITING' | 'READY' | 'BLOCKED';

interface StorageParts {
  zone: string;
  rack: string;
  shelf: string;
  bin: string;
}

export const PickupPreparationView: React.FC<PickupPreparationViewProps> = ({
  currentHub,
  currentUser,
  shipments,
  operationalIncidents = [],
  disputes = [],
  locale,
  onPickupPreparationComplete,
  onNavigate,
  onRefreshData,
}) => {
  const isAr = locale === 'ar';

  // 1. Navigation & Tab State
  const [activeTab, setActiveTab] = useState<TabType>('AWAITING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);

  // Filters
  const [filterPayment, setFilterPayment] = useState<string>('ALL');
  const [filterStorage, setFilterStorage] = useState<string>('ALL');
  const [filterHold, setFilterHold] = useState<string>('ALL');

  // Storage Assignment Form State
  const [storageParts, setStorageParts] = useState<StorageParts>({
    zone: 'A',
    rack: 'R03',
    shelf: 'S02',
    bin: 'B05',
  });

  // Modal & Drawer State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drawerShipment, setDrawerShipment] = useState<Shipment | null>(null);
  const [lastPreparedShipment, setLastPreparedShipment] = useState<{
    trackingNumber: string;
    recipientName: string;
    storageLocation: string;
    preparedAt: string;
  } | null>(null);

  // 2. Filter Shipments by Current Hub
  const hubShipments = useMemo(() => {
    return (shipments || []).filter((s) => s.destinationHubId === currentHub.id);
  }, [shipments, currentHub.id]);

  // Helper to detect blocking reasons for any shipment
  const evaluateShipmentBlockers = (s: Shipment) => {
    const blockers: string[] = [];
    const warnings: string[] = [];

    // 1. Status Check
    const isReceived =
      s.currentStatus === 'RECEIVED_AT_DEST' || s.currentStatus === 'RECEIVED_AT_DEST_HUB';
    if (!isReceived && s.currentStatus !== 'READY_FOR_PICKUP') {
      blockers.push(
        isAr
          ? `حالة الشحنة غير مؤهلة (${s.currentStatus})، يجب أن تكون في مركز الوجهة`
          : `Invalid status (${s.currentStatus}), must be RECEIVED_AT_DEST`
      );
    }

    // 2. Customs Hold
    if (s.hasCustomsHold || s.currentStatus === 'CUSTOMS_HELD') {
      blockers.push(
        isAr
          ? `حجز جمركي: ${s.customsHoldReason || s.holdReason || 'تدقيق جمركي بمطار الوصول'}`
          : `Customs Hold: ${s.customsHoldReason || s.holdReason || 'Inspection in progress'}`
      );
    }

    // 3. Operational Incidents
    const openIncidents = operationalIncidents.filter(
      (inc) =>
        (inc.relatedShipmentId === s.id || inc.trackingNumber === s.trackingNumber) &&
        (inc.status === 'OPEN' || inc.status === 'ACTION_REQUIRED')
    );
    if (openIncidents.length > 0) {
      blockers.push(
        isAr
          ? `بلاغ تشغيلي أمني مفتوح: ${openIncidents[0].description}`
          : `Open operational incident: ${openIncidents[0].description}`
      );
    }

    // 4. Generic Holds
    if (s.isHold && !s.hasCustomsHold && openIncidents.length === 0) {
      blockers.push(
        isAr
          ? `حظر تشغيلي: ${s.holdReason || 'مراجعة أمنية وإدارية مطلوبة'}`
          : `Operational Hold: ${s.holdReason || 'Administrative review required'}`
      );
    }

    // 5. Disputes
    const openDispute = disputes.find(
      (d) =>
        (d.shipmentId === s.id || d.trackingNumber === s.trackingNumber) &&
        d.status !== 'RESOLVED' &&
        d.status !== 'REJECTED'
    );
    if (s.currentStatus === 'DISPUTED' || s.hasDispute || openDispute) {
      blockers.push(
        isAr
          ? `نزاع قائم غير محلول: ${s.disputeReason || openDispute?.reason || 'مراجعة النزاع مطلوبة'}`
          : `Dispute review required: ${s.disputeReason || openDispute?.reason || 'Active dispute'}`
      );
    }

    // 6. Recipient Data Check
    if (!s.recipientName || s.recipientName.trim().length === 0) {
      blockers.push(isAr ? 'بيانات اسم المستلم مفقودة' : 'Recipient name required');
    }
    if (!s.recipientPhone || s.recipientPhone.trim().length < 6) {
      blockers.push(isAr ? 'رقم هاتف المستلم مفقود أو غير صالح' : 'Recipient phone required');
    }

    // 7. Payment Policy Check
    const isPaid = s.paymentStatus === 'FULLY_PAID';
    const isPayAtPickup = s.paymentPolicy === 'PAY_AT_PICKUP';
    const isNotRequired = s.paymentPolicy === 'NOT_REQUIRED';

    if (!isPaid && !isPayAtPickup && !isNotRequired) {
      // Required prepayment is pending
      blockers.push(
        isAr
          ? 'سداد الرسوم مسبقاً إلزامي ولم يكتمل (Payment Pending)'
          : 'Required prepayment is not complete. Payment pending'
      );
    } else if (isPayAtPickup && !isPaid) {
      warnings.push(
        isAr
          ? 'رسوم الشحن مستحقة عند الاستلام في كاونتر التسليم'
          : 'Payment due at pickup (to be collected at Final Delivery)'
      );
    }

    // 8. Package Condition
    if (s.packageCondition === 'DAMAGED') {
      blockers.push(
        isAr ? 'الطرود المتضررة محظورة من الإفراج قبل التحقيق' : 'Package damaged - release blocked'
      );
    }

    return {
      isBlocked: blockers.length > 0,
      blockers,
      warnings,
      isPayAtPickup: isPayAtPickup && !isPaid,
    };
  };

  // 3. Classify Shipments into Queues
  const { awaitingQueue, readyQueue, blockedQueue } = useMemo(() => {
    const awaiting: Shipment[] = [];
    const ready: Shipment[] = [];
    const blocked: Shipment[] = [];

    hubShipments.forEach((s) => {
      if (s.currentStatus === 'READY_FOR_PICKUP') {
        ready.push(s);
        return;
      }

      // Must be RECEIVED_AT_DEST or RECEIVED_AT_DEST_HUB
      if (
        s.currentStatus === 'RECEIVED_AT_DEST' ||
        s.currentStatus === 'RECEIVED_AT_DEST_HUB' ||
        s.currentStatus === 'CUSTOMS_HELD' ||
        s.currentStatus === 'DISPUTED'
      ) {
        const evaluation = evaluateShipmentBlockers(s);
        if (evaluation.isBlocked) {
          blocked.push(s);
        } else {
          awaiting.push(s);
        }
      }
    });

    // Default Sort (Rule 12):
    // 1. Priority/Urgent
    // 2. Oldest arrived shipment
    // 3. Payment cleared
    // 4. Recently arrived
    const sortFn = (a: Shipment, b: Shipment) => {
      const pMap: Record<string, number> = { URGENT: 3, HIGH: 2, NORMAL: 1 };
      const pDiff = (pMap[b.priority || 'NORMAL'] || 1) - (pMap[a.priority || 'NORMAL'] || 1);
      if (pDiff !== 0) return pDiff;

      const timeA = new Date(a.arrivalAtDestinationAt || a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.arrivalAtDestinationAt || b.updatedAt || b.createdAt).getTime();
      return timeA - timeB; // Oldest arrived first
    };

    awaiting.sort(sortFn);
    ready.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    blocked.sort(sortFn);

    return { awaitingQueue: awaiting, readyQueue: ready, blockedQueue: blocked };
  }, [hubShipments, operationalIncidents, disputes]);

  // Active list based on active tab
  const activeList = useMemo(() => {
    if (activeTab === 'AWAITING') return awaitingQueue;
    if (activeTab === 'READY') return readyQueue;
    return blockedQueue;
  }, [activeTab, awaitingQueue, readyQueue, blockedQueue]);

  // Filter and Search applied to active list
  const filteredShipments = useMemo(() => {
    return activeList.filter((s) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          (s.trackingNumber || '').toLowerCase().includes(q) ||
          (s.id || '').toLowerCase().includes(q) ||
          (s.recipientName || '').toLowerCase().includes(q) ||
          (s.recipientPhone || '').toLowerCase().includes(q) ||
          (s.senderName || '').toLowerCase().includes(q) ||
          (s.securitySealId || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Payment Filter
      if (filterPayment !== 'ALL') {
        const isPaid = s.paymentStatus === 'FULLY_PAID';
        const isPayAtPickup = s.paymentPolicy === 'PAY_AT_PICKUP';
        if (filterPayment === 'PAID' && !isPaid) return false;
        if (filterPayment === 'PENDING_PAYMENT' && (isPaid || isPayAtPickup)) return false;
        if (filterPayment === 'PAY_AT_PICKUP' && !isPayAtPickup) return false;
      }

      // Storage Filter
      if (filterStorage !== 'ALL') {
        const hasStorage = Boolean(s.storageLocation && s.storageLocation.trim().length > 0);
        if (filterStorage === 'ASSIGNED' && !hasStorage) return false;
        if (filterStorage === 'UNASSIGNED' && hasStorage) return false;
      }

      // Hold Filter
      if (filterHold !== 'ALL') {
        const evaluation = evaluateShipmentBlockers(s);
        if (filterHold === 'CLEAR' && evaluation.isBlocked) return false;
        if (filterHold === 'ON_HOLD' && !evaluation.isBlocked) return false;
      }

      return true;
    });
  }, [activeList, searchQuery, filterPayment, filterStorage, filterHold]);

  // Selected Shipment
  const selectedShipment = useMemo(() => {
    if (!selectedShipmentId) return null;
    return hubShipments.find((s) => s.id === selectedShipmentId) || null;
  }, [selectedShipmentId, hubShipments]);

  // Auto-select first shipment if none selected or selection not in active tab
  useEffect(() => {
    if (filteredShipments.length > 0) {
      if (!selectedShipmentId || !filteredShipments.some((s) => s.id === selectedShipmentId)) {
        setSelectedShipmentId(filteredShipments[0].id);
      }
    } else {
      setSelectedShipmentId(null);
    }
  }, [filteredShipments, selectedShipmentId]);

  // Sync storage inputs when selecting a shipment that already has storage assigned
  useEffect(() => {
    if (selectedShipment?.storageLocation) {
      const parts = selectedShipment.storageLocation.split('/').map((p) => p.trim());
      if (parts.length >= 4) {
        setStorageParts({
          zone: parts[0],
          rack: parts[1],
          shelf: parts[2],
          bin: parts[3],
        });
      } else if (selectedShipment.storageZone) {
        setStorageParts({
          zone: selectedShipment.storageZone || 'A',
          rack: selectedShipment.storageRack || 'R03',
          shelf: selectedShipment.storageShelf || 'S02',
          bin: selectedShipment.storageBin || 'B05',
        });
      }
    }
  }, [selectedShipment]);

  // Derived Formatted Storage
  const formattedStorageLocation = useMemo(() => {
    const { zone, rack, shelf, bin } = storageParts;
    return `${zone} / ${rack} / ${shelf} / ${bin}`;
  }, [storageParts]);

  // Role permissions check (Rule 59 & 60)
  const canPrepare = useMemo(() => {
    const role = currentUser?.role;
    if (!role) return true; // Default fallback for dev environment
    if (role === 'HUB_AGENT' || role === 'HUB_MANAGER' || role === 'MASTER_ADMIN') return true;
    return Boolean(currentUser?.permissions?.includes('delivery.prepare'));
  }, [currentUser]);

  // 4. Checklist & Readiness Calculation (Rules 38 & 89)
  const readinessReport = useMemo(() => {
    if (!selectedShipment) return null;

    const s = selectedShipment;
    const evaluation = evaluateShipmentBlockers(s);

    const hasValidStorage = Boolean(
      storageParts.zone.trim() &&
        storageParts.rack.trim() &&
        storageParts.shelf.trim() &&
        storageParts.bin.trim()
    );

    const isAlreadyReady = s.currentStatus === 'READY_FOR_PICKUP';
    const isDelivered = s.currentStatus === 'DELIVERED';
    const isReceivedStatus =
      s.currentStatus === 'RECEIVED_AT_DEST' || s.currentStatus === 'RECEIVED_AT_DEST_HUB';
    const isHubMatch = s.destinationHubId === currentHub.id;
    const isCustodyOk = s.custody === 'DESTINATION_HUB' || !s.custody;
    const isRecipientOk = Boolean(s.recipientName && s.recipientPhone && s.recipientPhone.trim().length > 5);
    const isPaymentOk =
      s.paymentStatus === 'FULLY_PAID' ||
      s.paymentPolicy === 'PAY_AT_PICKUP' ||
      s.paymentPolicy === 'NOT_REQUIRED';
    const isNoCustoms = !s.hasCustomsHold && s.currentStatus !== 'CUSTOMS_HELD';
    const isNoIncident =
      !s.isHold &&
      operationalIncidents.filter(
        (inc) =>
          (inc.relatedShipmentId === s.id || inc.trackingNumber === s.trackingNumber) &&
          (inc.status === 'OPEN' || inc.status === 'ACTION_REQUIRED')
      ).length === 0;
    const isNoDispute = s.currentStatus !== 'DISPUTED' && !s.hasDispute;
    const isConditionOk = s.packageCondition !== 'DAMAGED';

    const checks = [
      {
        id: 'status_received',
        labelAr: 'وصول الطرد فعلياً واستلامه بمركز الوجهة (RECEIVED_AT_DEST)',
        labelEn: 'Parcel arrived & received at destination hub',
        pass: isReceivedStatus,
        errorText: isAr ? 'الحالة الحالية ليست وصل مركز الوجهة' : 'Status is not RECEIVED_AT_DEST',
      },
      {
        id: 'hub_match',
        labelAr: `تطابق مركز الوجهة المحدد مع فرع الموظف (${currentHub.nameAr})`,
        labelEn: `Destination hub matches employee branch (${currentHub.nameEn})`,
        pass: isHubMatch,
        errorText: isAr ? 'الفرع غير متطابق مع وجهة الطرد' : 'Hub mismatch',
      },
      {
        id: 'hub_custody',
        labelAr: 'حضانة الطرد في عهدة مركز الوجهة (DESTINATION_HUB Custody)',
        labelEn: 'Package custody held by Destination Hub',
        pass: isCustodyOk,
        errorText: isAr ? 'العهدة ليست لدى مركز الوجهة' : 'Custody is not Destination Hub',
      },
      {
        id: 'recipient_data',
        labelAr: `اكتمال وصحة بيانات المستلم (${s.recipientName} • ${s.recipientPhone || 'هاتف مفقود'})`,
        labelEn: `Recipient data verified (${s.recipientName} • ${s.recipientPhone || 'Missing Phone'})`,
        pass: isRecipientOk,
        errorText: isAr ? 'بيانات المستلم أو رقم الهاتف مفقودة' : 'Recipient name or phone required',
      },
      {
        id: 'payment_condition',
        labelAr:
          s.paymentPolicy === 'PAY_AT_PICKUP'
            ? 'سياسة الدفع: مستحق عند الاستلام بالكاونتر (مسموح بالتجهيز)'
            : isPaymentOk
            ? 'سداد الرسوم بالكامل (Paid in Full)'
            : 'شرط الدفع المسبق غير مكتمل (Payment Pending)',
        labelEn:
          s.paymentPolicy === 'PAY_AT_PICKUP'
            ? 'Policy: Pay at pickup (Allowed to prepare)'
            : isPaymentOk
            ? 'Fully paid'
            : 'Prepayment pending',
        pass: isPaymentOk,
        errorText: isAr ? 'مطلوب سداد الرسوم مسبقاً قبل التجهيز' : 'Prepayment required before pickup',
      },
      {
        id: 'customs_clear',
        labelAr: 'خلو الطرد من أي حجز أو تدقيق جمركي (No Customs Hold)',
        labelEn: 'No customs hold',
        pass: isNoCustoms,
        errorText: isAr ? `حجز جمركي: ${s.customsHoldReason || 'مراجعة مطلوبة'}` : 'Customs hold active',
      },
      {
        id: 'incident_clear',
        labelAr: 'خلو الطرد من البلاغات التشغيلية والحظر الأمني (No Open Incidents)',
        labelEn: 'No blocking operational incident',
        pass: isNoIncident,
        errorText: isAr ? 'يوجد بلاغ تشغيلي مانع' : 'Operational incident blocks pickup',
      },
      {
        id: 'dispute_clear',
        labelAr: 'عدم وجود نزاع معلق حول الشحنة (No Dispute)',
        labelEn: 'No active dispute',
        pass: isNoDispute,
        errorText: isAr ? 'مراجعة النزاع مطلوبة' : 'Dispute review required',
      },
      {
        id: 'package_condition',
        labelAr: 'سلامة الطرد الفيزيائية وصلاحيته للتسليم (Condition OK)',
        labelEn: 'Package condition intact',
        pass: isConditionOk,
        errorText: isAr ? 'الطرود المتضررة محظورة من الإفراج' : 'Damaged package hold',
      },
      {
        id: 'storage_assigned',
        labelAr: `تخصيص موقع التخزين بالمركز (${formattedStorageLocation})`,
        labelEn: `Storage location assigned (${formattedStorageLocation})`,
        pass: hasValidStorage,
        errorText: isAr ? 'يرجى تحديد موقع الرف والتخزين كاملاً' : 'Storage location required',
      },
      {
        id: 'not_already_ready',
        labelAr: 'الشحنة قيد التجهيز ولم تجهز مسبقاً (Not Already Prepared)',
        labelEn: 'Not already prepared for pickup',
        pass: !isAlreadyReady,
        errorText: isAr ? 'تم تجهيز الشحنة مسبقاً' : 'Already prepared for pickup',
      },
      {
        id: 'not_delivered',
        labelAr: 'الشحنة لم يتم تسليمها بعد للمستلم (Not Delivered)',
        labelEn: 'Not yet delivered',
        pass: !isDelivered,
        errorText: isAr ? 'تم تسليم الطرد مسبقاً' : 'Already delivered',
      },
    ];

    const passedCount = checks.filter((c) => c.pass).length;
    const totalCount = checks.length;
    const allPassed = passedCount === totalCount;

    return {
      checks,
      passedCount,
      totalCount,
      allPassed,
      isAlreadyReady,
      isBlocked: evaluation.isBlocked,
      blockers: evaluation.blockers,
      warnings: evaluation.warnings,
      isPayAtPickup: evaluation.isPayAtPickup,
    };
  }, [selectedShipment, currentHub, storageParts, formattedStorageLocation, operationalIncidents, isAr]);

  // 5. Action: Confirm Preparation
  const handleConfirmReadyForPickup = async () => {
    if (!selectedShipment || !readinessReport?.allPassed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (onPickupPreparationComplete) {
        await onPickupPreparationComplete({
          shipmentId: selectedShipment.id,
          storageLocation: formattedStorageLocation,
          storageZone: storageParts.zone,
          storageRack: storageParts.rack,
          storageShelf: storageParts.shelf,
          storageBin: storageParts.bin,
          preparedBy: currentUser?.fullName || currentUser?.staffCode || 'Hub Agent',
        });
      } else {
        // Fallback local mutation
        selectedShipment.currentStatus = 'READY_FOR_PICKUP';
        selectedShipment.custody = 'DESTINATION_HUB';
        selectedShipment.storageLocation = formattedStorageLocation;
        selectedShipment.preparedForPickupAt = new Date().toISOString();
        selectedShipment.preparedForPickupBy =
          currentUser?.fullName || currentUser?.staffCode || 'Hub Agent';
      }

      setLastPreparedShipment({
        trackingNumber: selectedShipment.trackingNumber,
        recipientName: selectedShipment.recipientName,
        storageLocation: formattedStorageLocation,
        preparedAt: new Date().toLocaleTimeString(isAr ? 'ar-DZ' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });

      setIsConfirmModalOpen(false);
      onRefreshData();
    } catch (err) {
      console.error('Error confirming pickup preparation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick preset shelf handler
  const handlePresetSelect = (code: string) => {
    switch (code) {
      case 'RACK-A-01':
        setStorageParts({ zone: 'A', rack: 'R01', shelf: 'S01', bin: 'B01' });
        break;
      case 'RACK-A-02':
        setStorageParts({ zone: 'A', rack: 'R02', shelf: 'S02', bin: 'B04' });
        break;
      case 'RACK-A-04':
        setStorageParts({ zone: 'A', rack: 'R04', shelf: 'S01', bin: 'B02' });
        break;
      case 'RACK-B-01':
        setStorageParts({ zone: 'B', rack: 'R01', shelf: 'S02', bin: 'B05' });
        break;
      case 'RACK-B-05':
        setStorageParts({ zone: 'B', rack: 'R05', shelf: 'S03', bin: 'B01' });
        break;
      case 'ZONE-C-FLOOR':
        setStorageParts({ zone: 'C', rack: 'R01', shelf: 'S01', bin: 'B01' });
        break;
      default:
        break;
    }
  };

  // KPI calculations (Rule 6: exactly 4 cards)
  const kpiStoragePending = useMemo(() => {
    return awaitingQueue.filter((s) => !s.storageLocation || s.storageLocation.trim().length === 0)
      .length;
  }, [awaitingQueue]);

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header (Rules 4 & 5) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900">
                  {isAr ? 'تجهيز للاستلام' : 'Pickup Preparation'}
                </h1>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                  Stage 05
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'مراجعة الطرود المستلمة في مركز الوجهة، التحقق من جاهزية المستلم والحالة التشغيلية وتحديد موقع التخزين قبل جعل الطرد جاهزاً للاستلام.'
                  : 'Review parcels received at destination hub, verify recipient & operational readiness, and assign storage location before marking ready for pickup.'}
              </p>
            </div>
          </div>
        </div>

        {/* Current Hub & Counter Quick Link */}
        <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center gap-2 text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-purple-600" />
            <span className="font-bold">{isAr ? currentHub.nameAr : currentHub.nameEn}</span>
            <span className="font-mono text-[10px] text-slate-400">({currentHub.code})</span>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('FINAL_DELIVERY')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors cursor-pointer border border-slate-200"
          >
            <UserCheck className="w-3.5 h-3.5 text-slate-600" />
            <span>{isAr ? 'كاونتر التسليم النهائي' : 'Delivery Counter'}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>
      </div>

      {/* 2. KPI Cards (Rule 6: 4 Operational Cards Only) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Awaiting Preparation */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500">
              {isAr ? 'بانتظار التجهيز' : 'Awaiting Preparation'}
            </div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{awaitingQueue.length}</div>
            <div className="text-[10px] text-slate-400">
              {isAr ? 'حالة RECEIVED_AT_DEST' : 'Status: RECEIVED_AT_DEST'}
            </div>
          </div>
        </div>

        {/* 2. Ready Today */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500">
              {isAr ? 'جاهزة للاستلام' : 'Ready for Pickup'}
            </div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{readyQueue.length}</div>
            <div className="text-[10px] text-slate-400">
              {isAr ? 'جاهزة بكاونتر التسليم' : 'Available at counter'}
            </div>
          </div>
        </div>

        {/* 3. Payment / Hold Review */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500">
              {isAr ? 'مراجعة الحجز والدفع' : 'Payment / Hold Review'}
            </div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{blockedQueue.length}</div>
            <div className="text-[10px] text-slate-400">
              {isAr ? 'حجز جمركي / بلاغ / دفع' : 'Customs / Hold / Pending'}
            </div>
          </div>
        </div>

        {/* 4. Storage Pending */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500">
              {isAr ? 'بانتظار تخصيص الرف' : 'Storage Pending'}
            </div>
            <div className="text-xl font-black text-slate-900 mt-0.5">{kpiStoragePending}</div>
            <div className="text-[10px] text-slate-400">
              {isAr ? 'موقع الرف غير محدد' : 'No shelf assigned yet'}
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Banner (Rule 44) */}
      {lastPreparedShipment && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-emerald-900 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-emerald-950 text-sm">
                {isAr
                  ? `أصبح الطرد [${lastPreparedShipment.trackingNumber}] جاهزاً للاستلام!`
                  : `Shipment [${lastPreparedShipment.trackingNumber}] is now READY_FOR_PICKUP!`}
              </div>
              <div className="text-[11px] text-emerald-800 mt-0.5">
                {isAr
                  ? `المستلم: ${lastPreparedShipment.recipientName} • موقع التخزين: ${lastPreparedShipment.storageLocation} • العهدة: مركز الوجهة (DESTINATION_HUB)`
                  : `Recipient: ${lastPreparedShipment.recipientName} • Storage: ${lastPreparedShipment.storageLocation} • Custody: DESTINATION_HUB`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setLastPreparedShipment(null)}
              className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 font-bold rounded-xl text-xs cursor-pointer"
            >
              {isAr ? 'متابعة التجهيز' : 'Continue Preparation'}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('FINAL_DELIVERY')}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{isAr ? 'فتح كاونتر التسليم' : 'Open Delivery Counter'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Role Permission Alert if Read-Only */}
      {!canPrepare && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {isAr
              ? 'تنبيه صلاحيات: حسابك الحالي يمتلك صلاحية العرض فقط. مطلوب دور HUB_AGENT أو HUB_MANAGER لتأكيد جاهزية الاستلام.'
              : 'Permission Notice: Your role has view-only access. HUB_AGENT or HUB_MANAGER is required to mark ready.'}
          </span>
        </div>
      )}

      {/* 3. Main Workspace: Tabs & Queue (7 cols) + Workspace (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Queue & Filters (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-4">
            {/* Tabs (Rule 46) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('AWAITING')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'AWAITING'
                      ? 'bg-white text-purple-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{isAr ? 'بانتظار التجهيز' : 'Awaiting Prep'}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                      activeTab === 'AWAITING' ? 'bg-purple-100 text-purple-900' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {awaitingQueue.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('READY')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'READY'
                      ? 'bg-white text-emerald-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAr ? 'جاهزة للاستلام' : 'Ready'}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                      activeTab === 'READY' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {readyQueue.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('BLOCKED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'BLOCKED'
                      ? 'bg-white text-rose-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>{isAr ? 'محظورة / تدقيق' : 'Blocked'}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                      activeTab === 'BLOCKED' ? 'bg-rose-100 text-rose-900' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {blockedQueue.length}
                  </span>
                </button>
              </div>

              <span className="text-xs text-slate-400 font-mono">
                {filteredShipments.length} {isAr ? 'شحنة' : 'parcels'}
              </span>
            </div>

            {/* Search & Filters Bar (Rules 10 & 11) */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isAr
                      ? 'بحث برقم التتبع، اسم المستلم، الهاتف، أو الختم الأمني...'
                      : 'Search tracking, recipient, phone, or seal ID...'
                  }
                  className="w-full ps-9 pe-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                  <Filter className="w-3 h-3" />
                  <span>{isAr ? 'تصفية:' : 'Filters:'}</span>
                </div>

                <select
                  value={filterPayment}
                  onChange={(e) => setFilterPayment(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700"
                >
                  <option value="ALL">{isAr ? 'حالة الدفع: الكل' : 'Payment: All'}</option>
                  <option value="PAID">{isAr ? 'مسددة بالكامل' : 'Paid in Full'}</option>
                  <option value="PAY_AT_PICKUP">{isAr ? 'الدفع عند الاستلام' : 'Pay at Pickup'}</option>
                  <option value="PENDING_PAYMENT">{isAr ? 'سداد معلق' : 'Payment Pending'}</option>
                </select>

                <select
                  value={filterStorage}
                  onChange={(e) => setFilterStorage(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700"
                >
                  <option value="ALL">{isAr ? 'الرف: الكل' : 'Storage: All'}</option>
                  <option value="ASSIGNED">{isAr ? 'مخصص بالرف' : 'Assigned'}</option>
                  <option value="UNASSIGNED">{isAr ? 'غير مخصص' : 'Unassigned'}</option>
                </select>

                <select
                  value={filterHold}
                  onChange={(e) => setFilterHold(e.target.value)}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700"
                >
                  <option value="ALL">{isAr ? 'الحظر: الكل' : 'Holds: All'}</option>
                  <option value="CLEAR">{isAr ? 'سليمة بدون حظر' : 'No Holds'}</option>
                  <option value="ON_HOLD">{isAr ? 'تخضع لحظر / تدقيق' : 'On Hold'}</option>
                </select>

                {(searchQuery || filterPayment !== 'ALL' || filterStorage !== 'ALL' || filterHold !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterPayment('ALL');
                      setFilterStorage('ALL');
                      setFilterHold('ALL');
                    }}
                    className="text-[11px] text-purple-600 hover:text-purple-800 font-bold ms-auto cursor-pointer"
                  >
                    {isAr ? 'إلغاء التصفية' : 'Clear Filters'}
                  </button>
                )}
              </div>
            </div>

            {/* Shipment Cards List */}
            {filteredShipments.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                <Boxes className="w-10 h-10 mx-auto mb-2 opacity-30 text-purple-600" />
                <div className="font-bold text-slate-700 text-sm">
                  {searchQuery || filterPayment !== 'ALL' || filterStorage !== 'ALL'
                    ? isAr
                      ? 'لا توجد طرود مطابقة لمعايير البحث'
                      : 'No shipments match current search/filter'
                    : activeTab === 'AWAITING'
                    ? isAr
                      ? 'لا توجد طرود بانتظار التجهيز للاستلام حالياً'
                      : 'No parcels awaiting pickup preparation'
                    : activeTab === 'READY'
                    ? isAr
                      ? 'لا توجد طرود في حالة جاهزة للاستلام'
                      : 'No parcels ready for pickup yet'
                    : isAr
                    ? 'لا توجد طرود محظورة أو معلقة'
                    : 'No blocked parcels'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                  {activeTab === 'AWAITING'
                    ? isAr
                      ? 'تظهر هنا الشحنات التي اكتمل استلامها في فرع الوجهة (RECEIVED_AT_DEST) لتحديد الرف والتحقق من جاهزيتها.'
                      : 'Parcels received at destination hub will appear here for shelf allocation & operational review.'
                    : ''}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredShipments.map((s) => {
                  const isSelected = selectedShipment?.id === s.id;
                  const evalRes = evaluateShipmentBlockers(s);
                  const hasStorage = Boolean(s.storageLocation && s.storageLocation.trim().length > 0);
                  const isReady = s.currentStatus === 'READY_FOR_PICKUP';

                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedShipmentId(s.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-600/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-black text-purple-950">
                              {s.trackingNumber}
                            </span>
                            <StatusBadge status={s.currentStatus} locale={locale} size="sm" />
                            {s.priority === 'URGENT' && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[10px] font-black">
                                {isAr ? 'عاجل' : 'URGENT'}
                              </span>
                            )}
                          </div>

                          <div className="text-xs font-bold text-slate-900 truncate">
                            {s.itemDescription || (isAr ? 'طرد شخصي معتمد' : 'Authorized parcel')}
                          </div>

                          {/* Recipient info */}
                          <div className="text-[11px] text-slate-600 flex items-center gap-2 flex-wrap">
                            <span>
                              {isAr ? 'المستلم:' : 'Recipient:'}{' '}
                              <strong className="text-slate-900">{s.recipientName || '—'}</strong>
                            </span>
                            {s.recipientPhone ? (
                              <span className="font-mono text-slate-500">• {s.recipientPhone}</span>
                            ) : (
                              <span className="text-rose-600 font-bold">• {isAr ? 'الهاتف مفقود' : 'No Phone'}</span>
                            )}
                            <span className="text-slate-400">•</span>
                            <span className="font-bold text-slate-700">
                              {s.actualWeightKg || s.estimatedWeightKg} KG
                            </span>
                          </div>

                          {/* Badges bar */}
                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            {/* Payment condition */}
                            {s.paymentStatus === 'FULLY_PAID' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                <span>{isAr ? 'مسدد' : 'Paid'}</span>
                              </span>
                            ) : s.paymentPolicy === 'PAY_AT_PICKUP' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                <span>{isAr ? 'الدفع بالاستلام' : 'Pay at Pickup'}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{isAr ? 'سداد معلق' : 'Payment Pending'}</span>
                              </span>
                            )}

                            {/* Storage assignment */}
                            {hasStorage ? (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-purple-600" />
                                <span>{s.storageLocation}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                <span>{isAr ? 'الرف غير محدد' : 'No Shelf'}</span>
                              </span>
                            )}

                            {/* Blockers or Warnings */}
                            {evalRes.isBlocked && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{isAr ? 'محظور التجهيز' : 'Blocked'}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick action / Status indicator */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {isReady ? (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isAr ? 'جاهز' : 'Ready'}</span>
                            </span>
                          ) : evalRes.isBlocked ? (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>{isAr ? 'تدقيق' : 'Review'}</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedShipmentId(s.id);
                              }}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                            >
                              {isAr ? 'تجهيز' : 'Prepare'}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDrawerShipment(s);
                            }}
                            className="text-[11px] text-slate-400 hover:text-purple-600 flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{isAr ? 'الملف' : 'Dossier'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Pickup Preparation Workspace (5 cols) (Rules 14-41) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-5 sticky top-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-600" />
                <span>{isAr ? 'مساحة تجهيز الاستلام' : 'Pickup Preparation Workspace'}</span>
              </h2>
              {selectedShipment && (
                <button
                  type="button"
                  onClick={() => setDrawerShipment(selectedShipment)}
                  className="text-xs text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تفاصيل كاملة' : 'Full Details'}</span>
                </button>
              )}
            </div>

            {!selectedShipment ? (
              <div className="p-12 text-center bg-slate-50 rounded-xl border border-slate-100 text-slate-400 text-xs">
                <Boxes className="w-8 h-8 mx-auto mb-2 opacity-30 text-purple-600" />
                <div className="font-bold text-slate-700">
                  {isAr ? 'اختر شحنة من القائمة لبدء التجهيز' : 'Select a parcel to begin preparation'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isAr
                    ? 'سيتم تدقيق الحالات التشغيلية وتخصيص الرف قبل اعتمادها للاستلام'
                    : 'Verify recipient, operational holds and assign shelf location'}
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* A. Shipment Summary (Rule 15) */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{isAr ? 'رقم التتبع:' : 'Tracking Number:'}</span>
                    <span className="font-mono font-black text-purple-950 text-sm">
                      {selectedShipment.trackingNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{isAr ? 'الحالة الحالية:' : 'Current Status:'}</span>
                    <StatusBadge status={selectedShipment.currentStatus} locale={locale} size="sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{isAr ? 'العهدة الحالية:' : 'Current Custody:'}</span>
                    <span className="font-bold text-slate-800 px-2 py-0.5 rounded bg-slate-200 font-mono text-[10px]">
                      DESTINATION_HUB
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{isAr ? 'الوزن الفعلي:' : 'Actual Weight:'}</span>
                    <span className="font-bold text-slate-900">
                      {selectedShipment.actualWeightKg || selectedShipment.estimatedWeightKg} KG
                    </span>
                  </div>
                  {selectedShipment.securitySealId && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{isAr ? 'الختم الأمني:' : 'Security Seal:'}</span>
                      <span className="font-mono text-purple-900 font-bold">
                        {selectedShipment.securitySealId}
                      </span>
                    </div>
                  )}
                </div>

                {/* B. Recipient Information (Rules 16, 17, 18) */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-purple-600" />
                      <span>{isAr ? 'بيانات جهة التسليم الفعلية (المستلم)' : 'Actual Recipient Data'}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {isAr ? 'المستلم ≠ المرسل' : 'Recipient ≠ Sender'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500">{isAr ? 'اسم المستلم:' : 'Recipient Name:'}</span>
                    <strong className="text-slate-900 text-xs">{selectedShipment.recipientName || '—'}</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{isAr ? 'هاتف المستلم:' : 'Recipient Phone:'}</span>
                    {selectedShipment.recipientPhone ? (
                      <span className="font-mono font-bold text-slate-900">
                        {selectedShipment.recipientPhone}
                      </span>
                    ) : (
                      <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {isAr ? 'رقم الهاتف مفقود (مطلوب)' : 'Phone Required'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-500 shrink-0">{isAr ? 'العنوان / المدينة:' : 'Address:'}</span>
                    <span className="text-slate-700 text-end truncate">
                      {selectedShipment.recipientAddress || (isAr ? 'استلام من كاونتر الفرع' : 'Hub Pickup')}
                    </span>
                  </div>
                </div>

                {/* C. Payment & Hold Condition (Rules 19-29) */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-purple-600" />
                      <span>{isAr ? 'حالة السداد والسياسة المالية' : 'Payment Condition'}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500">{isAr ? 'سياسة الدفع:' : 'Payment Policy:'}</span>
                    <span className="font-bold text-slate-800">
                      {selectedShipment.paymentPolicy === 'PAY_AT_PICKUP'
                        ? isAr
                          ? 'الدفع عند الاستلام (Pay at Pickup)'
                        : 'Pay at Pickup'
                        : selectedShipment.paymentPolicy === 'NOT_REQUIRED'
                        ? isAr
                          ? 'غير مطلوب'
                        : 'Not Required'
                        : isAr
                        ? 'سداد مسبق إلزامي (Prepaid)'
                        : 'Prepaid Required'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{isAr ? 'حالة الدفع المسجلة:' : 'Recorded Status:'}</span>
                    {selectedShipment.paymentStatus === 'FULLY_PAID' ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                        {isAr ? 'مسدد بالكامل' : 'Paid in Full'}
                      </span>
                    ) : selectedShipment.paymentPolicy === 'PAY_AT_PICKUP' ? (
                      <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold">
                        {isAr ? 'يُحصّل عند التسليم' : 'Due at Pickup'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                        {isAr ? 'معلق (يمنع التجهيز)' : 'Payment Pending (Blocks Ready)'}
                      </span>
                    )}
                  </div>

                  {readinessReport?.warnings && readinessReport.warnings.length > 0 && (
                    <div className="p-2 bg-sky-50 border border-sky-200 rounded-lg text-[11px] text-sky-900">
                      {readinessReport.warnings.map((w, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {readinessReport?.blockers && readinessReport.blockers.length > 0 && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-rose-950">
                        <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{isAr ? 'موانع التجهيز للاستلام:' : 'Blocking Issues:'}</span>
                      </div>
                      {readinessReport.blockers.map((b, idx) => (
                        <div key={idx} className="ps-5 text-[11px]">
                          • {b}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* D. Storage Assignment Form (Rules 30-36) */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-purple-600" />
                      <span>{isAr ? 'تخصيص موقع التخزين بالمركز' : 'Storage Assignment'}</span>
                    </span>
                    <span className="font-mono text-purple-900 font-bold bg-purple-100 px-2 py-0.5 rounded text-[11px]">
                      {formattedStorageLocation}
                    </span>
                  </div>

                  {/* Preset Quick Selectors */}
                  <div>
                    <label className="block text-[11px] text-slate-500 font-bold mb-1">
                      {isAr ? 'نماذج جاهزة سريعة:' : 'Quick Presets:'}
                    </label>
                    <select
                      onChange={(e) => handlePresetSelect(e.target.value)}
                      defaultValue=""
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-xs text-slate-800"
                    >
                      <option value="" disabled>
                        {isAr ? '-- اختر رداً نموذجياً أو عدل الحقول بالأسفل --' : '-- Choose Preset --'}
                      </option>
                      <option value="RACK-A-01">الرف A-01 (صناديق وطرود صغيرة) - A / R01 / S01 / B01</option>
                      <option value="RACK-A-02">الرف A-02 (إلكترونيات وأجهزة دقيقة) - A / R02 / S02 / B04</option>
                      <option value="RACK-A-04">الرف A-04 (وثائق وأدوية مرخصة) - A / R04 / S01 / B02</option>
                      <option value="RACK-B-01">الرف B-01 (أمتعة وملابس متوسطة) - B / R01 / S02 / B05</option>
                      <option value="RACK-B-05">الرف B-05 (هدايا وعطور مغلفة) - B / R05 / S03 / B01</option>
                      <option value="ZONE-C-FLOOR">منطقة C (أحجام كبيرة / حقائب أرضية) - C / R01 / S01 / B01</option>
                    </select>
                  </div>

                  {/* Manual Grid Fields */}
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        {isAr ? 'المنطقة (Zone)' : 'Zone'}
                      </label>
                      <input
                        type="text"
                        value={storageParts.zone}
                        onChange={(e) => setStorageParts({ ...storageParts, zone: e.target.value.toUpperCase() })}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-center font-mono font-bold text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        {isAr ? 'الممر (Rack)' : 'Rack'}
                      </label>
                      <input
                        type="text"
                        value={storageParts.rack}
                        onChange={(e) => setStorageParts({ ...storageParts, rack: e.target.value.toUpperCase() })}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-center font-mono font-bold text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        {isAr ? 'الرف (Shelf)' : 'Shelf'}
                      </label>
                      <input
                        type="text"
                        value={storageParts.shelf}
                        onChange={(e) => setStorageParts({ ...storageParts, shelf: e.target.value.toUpperCase() })}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-center font-mono font-bold text-slate-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        {isAr ? 'الصندوق (Bin)' : 'Bin'}
                      </label>
                      <input
                        type="text"
                        value={storageParts.bin}
                        onChange={(e) => setStorageParts({ ...storageParts, bin: e.target.value.toUpperCase() })}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-center font-mono font-bold text-slate-800 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* E. Pickup Readiness Checklist (Rules 37, 38, 39, 89) */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>{isAr ? 'قائمة التحقق من جاهزية الاستلام' : 'Pickup Readiness Checklist'}</span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-black ${
                        readinessReport?.allPassed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {readinessReport?.passedCount} / {readinessReport?.totalCount}{' '}
                      {isAr ? 'شروط محققة' : 'checks passed'}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-56 overflow-y-auto pe-1">
                    {readinessReport?.checks.map((check) => (
                      <div
                        key={check.id}
                        className={`p-2 rounded-lg border flex items-start gap-2 text-[11px] ${
                          check.pass
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                            : 'bg-rose-50/70 border-rose-200 text-rose-950 font-bold'
                        }`}
                      >
                        {check.pass ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div>{isAr ? check.labelAr : check.labelEn}</div>
                          {!check.pass && (
                            <div className="text-[10px] text-rose-700 font-normal mt-0.5">
                              ✕ {check.errorText}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary Action Button (Rules 40, 48, 49) */}
                {readinessReport?.isAlreadyReady ? (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-900 space-y-1">
                    <div className="font-bold flex items-center justify-center gap-1.5 text-emerald-950">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{isAr ? 'تم تجهيز الطرد مسبقاً بالرف' : 'Already Prepared for Pickup'}</span>
                    </div>
                    <div className="text-[11px] text-emerald-800">
                      {isAr
                        ? `الموقع: ${selectedShipment.storageLocation || formattedStorageLocation} • بانتظار حضور المستلم في كاونتر التسليم`
                        : `Location: ${selectedShipment.storageLocation} • Awaiting counter pickup`}
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('FINAL_DELIVERY')}
                      className="mt-2 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
                    >
                      {isAr ? 'الانتقال لكاونتر التسليم النهائي' : 'Go to Delivery Counter'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={!readinessReport?.allPassed || !canPrepare || isSubmitting}
                    onClick={() => setIsConfirmModalOpen(true)}
                    className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {readinessReport?.allPassed
                        ? isAr
                          ? 'تأكيد الجاهزية للاستلام (Mark Ready for Pickup)'
                          : 'Mark Ready for Pickup'
                        : isAr
                        ? 'غير مؤهل للاستلام (يرجى معالجة الموانع أولاً)'
                        : 'Cannot Prepare (Resolve Blockers First)'}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Confirmation Modal (Rule 41) */}
      {isConfirmModalOpen && selectedShipment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  {isAr ? 'تأكيد جاهزية الطرد للاستلام' : 'Confirm Pickup Preparation'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">{selectedShipment.trackingNumber}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'المستلم:' : 'Recipient:'}</span>
                <strong className="text-slate-900">{selectedShipment.recipientName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'هاتف المستلم:' : 'Phone:'}</span>
                <span className="font-mono text-slate-900">{selectedShipment.recipientPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'مركز الوجهة:' : 'Destination Hub:'}</span>
                <span className="text-slate-900 font-bold">{isAr ? currentHub.nameAr : currentHub.nameEn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'موقع الرف والتخزين:' : 'Storage Location:'}</span>
                <span className="font-mono font-black text-purple-900 bg-purple-100 px-2 py-0.5 rounded">
                  {formattedStorageLocation}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'حالة السداد:' : 'Payment:'}</span>
                <span className="font-bold text-slate-800">
                  {selectedShipment.paymentPolicy === 'PAY_AT_PICKUP'
                    ? isAr
                      ? 'مستحق عند الاستلام'
                      : 'Due at Pickup'
                    : isAr
                    ? 'مسدد بالكامل'
                    : 'Fully Paid'}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between">
                <span className="text-slate-500">{isAr ? 'الحالة الجديدة:' : 'New Status:'}</span>
                <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  READY_FOR_PICKUP
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>{isAr ? 'الحضانة بعد التأكيد:' : 'Custody:'}</span>
                <span className="font-mono font-bold text-slate-700">DESTINATION_HUB</span>
              </div>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-950">
              <p className="font-bold">
                {isAr
                  ? 'هل تؤكد أن الطرد تم فحصه وتخزينه بالرف وأصبح جاهزاً للاستلام من العميل؟'
                  : 'Do you confirm that the parcel is stored on the assigned shelf and ready for customer pickup?'}
              </p>
              <p className="text-[10px] text-purple-800 mt-1">
                {isAr
                  ? 'ملاحظة: تظل العهدة لدى مركز الوجهة حتى يكتمل التسليم الفعلي والتحقق من الهوية بكاونتر التسليم (Stage 06).'
                  : 'Notice: Package remains in Destination Hub custody until delivered at counter.'}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmReadyForPickup}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{isAr ? 'تأكيد الجاهزية' : 'Confirm Ready'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. DetailsDrawer (Rule 63) */}
      {drawerShipment && (
        <DetailsDrawer
          isOpen={Boolean(drawerShipment)}
          onClose={() => setDrawerShipment(null)}
          title={isAr ? 'ملف الشحنة التشغيلي' : 'Shipment Operational Dossier'}
          subtitle={drawerShipment.trackingNumber}
          locale={locale}
          badge={<StatusBadge status={drawerShipment.currentStatus} locale={locale} size="sm" />}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 border-b border-slate-200 pb-1.5">
                {isAr ? 'المحتوى والخصائص الفيزيائية' : 'Physical Attributes'}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-500 block text-[11px]">{isAr ? 'الوصف:' : 'Description:'}</span>
                  <span className="font-bold text-slate-800">{drawerShipment.itemDescription}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">{isAr ? 'الوزن الفعلي:' : 'Weight:'}</span>
                  <span className="font-bold text-slate-800">
                    {drawerShipment.actualWeightKg || drawerShipment.estimatedWeightKg} KG
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">{isAr ? 'القيمة المصرحة:' : 'Declared Value:'}</span>
                  <span className="font-bold text-slate-800">
                    {drawerShipment.declaredValue} {drawerShipment.currency}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">{isAr ? 'الختم الأمني:' : 'Security Seal:'}</span>
                  <span className="font-mono text-purple-900 font-bold">
                    {drawerShipment.securitySealId || '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 border-b border-slate-200 pb-1.5">
                {isAr ? 'المستلم والوجهة' : 'Recipient & Hub'}
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'اسم المستلم:' : 'Recipient:'}</span>
                  <strong className="text-slate-900">{drawerShipment.recipientName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'الهاتف:' : 'Phone:'}</span>
                  <span className="font-mono text-slate-800">{drawerShipment.recipientPhone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'العنوان:' : 'Address:'}</span>
                  <span className="text-slate-700">{drawerShipment.recipientAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'موقع الرف:' : 'Storage:'}</span>
                  <span className="font-mono text-purple-900 font-bold">
                    {drawerShipment.storageLocation || isAr ? 'غير محدد' : 'Not assigned'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 border-b border-slate-200 pb-1.5">
                {isAr ? 'سلسلة الحضانة (Chain of Custody)' : 'Chain of Custody'}
              </div>
              <div className="space-y-2 text-[11px] pt-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {isAr ? 'الاستلام بمركز المنشأ (عمان)' : 'Origin Intake (Amman Hub)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {isAr ? 'النقل عبر المسافر الجوي المعتمد' : 'Air Transport by Verified Traveler'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {isAr ? 'الاستلام في مركز الوجهة (الجزائر)' : 'Destination Intake (Algiers Hub)'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {isAr ? 'التسليم للمستلم والتحقق من الهوية (المرحلة 06)' : 'Delivery to Recipient (Stage 06)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DetailsDrawer>
      )}
    </div>
  );
};
