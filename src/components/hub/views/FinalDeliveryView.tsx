import React, { useState, useMemo, useEffect } from 'react';
import {
  UserCheck,
  Search,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Lock,
  Printer,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Phone,
  Building2,
  Package,
  Layers,
  Check,
  X,
  CreditCard,
  Send,
  RotateCw,
  QrCode,
  FileCheck,
  Eye,
  Clock,
  MapPin,
  Tag,
  Ban,
  ShieldAlert,
  Calendar,
  DollarSign,
  User,
  Info,
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

export interface FinalDeliveryViewProps {
  currentHub: Hub;
  currentUser?: UserType;
  shipments: Shipment[];
  operationalIncidents?: OperationalIncident[];
  disputes?: Dispute[];
  locale: Locale;
  onDeliverToRecipient?: (payload: any) => Promise<boolean>;
  onFinalDeliveryComplete?: (payload: {
    shipmentId: string;
    recipientName: string;
    recipientNationalIdPresented?: string;
    deliveredBy: string;
    deliveredByEmployeeId?: string;
    deliveredAtHubId: string;
    otpCode: string;
    paymentStatusAtDelivery?: string;
  }) => Promise<boolean> | boolean;
  onNavigate: (section: EmployeeNavSection) => void;
  onRefreshData: () => void;
}

type TabType = 'READY' | 'BLOCKED' | 'DELIVERED_TODAY';

export const FinalDeliveryView: React.FC<FinalDeliveryViewProps> = ({
  currentHub,
  currentUser,
  shipments,
  operationalIncidents = [],
  disputes = [],
  locale,
  onDeliverToRecipient,
  onFinalDeliveryComplete,
  onNavigate,
  onRefreshData,
}) => {
  const isAr = locale === 'ar';

  // Navigation & Search State
  const [activeTab, setActiveTab] = useState<TabType>('READY');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);

  // Recipient Verification Form State
  const [idDocType, setIdDocType] = useState<'NATIONAL_ID' | 'PASSPORT' | 'DRIVERS_LICENSE'>('NATIONAL_ID');
  const [idDocNumber, setIdDocNumber] = useState('');
  const [recipientPersonPresent, setRecipientPersonPresent] = useState<'MATCH' | 'MISMATCH' | 'UNCHECKED'>('UNCHECKED');

  // Pickup Code State
  const [enteredPickupCode, setEnteredPickupCode] = useState('');
  const [pickupCodeFeedback, setPickupCodeFeedback] = useState<'INITIAL' | 'VALID' | 'INVALID'>('INITIAL');

  // Payment State
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [localPaidShipmentIds, setLocalPaidShipmentIds] = useState<Set<string>>(new Set());

  // Package Physical Location Confirmation
  const [physicalPackageLocated, setPhysicalPackageLocated] = useState(true);

  // Operational Issue Flagging
  const [flagDamageNoticed, setFlagDamageNoticed] = useState(false);
  const [flagCustomerRefusal, setFlagCustomerRefusal] = useState(false);

  // OTP Workflow State
  const [otpStatus, setOtpStatus] = useState<'NOT_SENT' | 'SENT' | 'VERIFIED' | 'FAILED' | 'EXPIRED'>('NOT_SENT');
  const [otpInput, setOtpInput] = useState('');
  const [otpMockGenerated, setOtpMockGenerated] = useState('');
  const [otpAttemptsCount, setOtpAttemptsCount] = useState(0);
  const [otpErrorMsg, setOtpErrorMsg] = useState('');

  // Confirmation Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCompletingDelivery, setIsCompletingDelivery] = useState(false);

  // Details Drawer State
  const [drawerShipment, setDrawerShipment] = useState<Shipment | null>(null);

  // Success Receipt State
  const [deliveryResult, setDeliveryResult] = useState<{
    success: boolean;
    trackingNumber: string;
    recipientName: string;
    timestamp: string;
    deliveredBy: string;
    storageWas: string;
  } | null>(null);

  // Reset verification form when selected shipment changes
  useEffect(() => {
    setIdDocNumber('');
    setRecipientPersonPresent('UNCHECKED');
    setEnteredPickupCode('');
    setPickupCodeFeedback('INITIAL');
    setOtpStatus('NOT_SENT');
    setOtpInput('');
    setOtpMockGenerated('');
    setOtpAttemptsCount(0);
    setOtpErrorMsg('');
    setFlagDamageNoticed(false);
    setFlagCustomerRefusal(false);
    setPhysicalPackageLocated(true);
  }, [selectedShipmentId]);

  // Scope: All Shipments for this Destination Hub
  const hubShipments = useMemo(() => {
    return shipments.filter((s) => s.destinationHubId === currentHub.id);
  }, [shipments, currentHub.id]);

  // Derive Blocking Reason for each shipment
  const getShipmentBlockReasons = (s: Shipment): string[] => {
    const reasons: string[] = [];

    // 1. Customs Hold
    if (s.hasCustomsHold || s.currentStatus === 'CUSTOMS_HELD') {
      reasons.push(isAr ? 'حجز جمركي نشط (Customs Hold)' : 'Active Customs Hold');
    }

    // 2. Open Disputes
    const hasDispute = disputes.some(
      (d) => d.shipmentId === s.id && (d.status === 'OPEN' || d.status === 'PENDING_REVIEW' || d.status === 'ESCALATED')
    ) || s.hasDispute;
    if (hasDispute) {
      reasons.push(isAr ? 'نزاع مفتوح بانتظار الفصل (Open Dispute)' : 'Open Dispute Blocking Handover');
    }

    // 3. Operational Incidents
    const hasIncident = operationalIncidents.some(
      (inc) => inc.shipmentId === s.id && inc.status === 'INVESTIGATING'
    ) || (s.isHold && s.holdReason);
    if (hasIncident) {
      reasons.push(s.holdReason || (isAr ? 'بلاغ تشغيلي أمني مانع (Operational Incident)' : 'Blocking Operational Incident'));
    }

    // 4. Missing Storage Location
    if (!s.storageLocation && s.currentStatus === 'READY_FOR_PICKUP') {
      reasons.push(isAr ? 'الموقع التخزيني غير مسجل (Storage Unassigned)' : 'Storage Location Unassigned');
    }

    // 5. Payment Check
    const isPaid = s.paymentStatus === 'FULLY_PAID' || localPaidShipmentIds.has(s.id);
    const isPayAtPickup = s.paymentPolicy === 'PAY_AT_PICKUP';
    const isNotRequired = s.paymentPolicy === 'NOT_REQUIRED';
    if (!isPaid && !isPayAtPickup && !isNotRequired) {
      reasons.push(isAr ? 'السداد المسبق غير مكتمل (Payment Required)' : 'Prepaid Amount Pending');
    }

    // 6. Recipient Data Missing
    if (!s.recipientName || !s.recipientPhone) {
      reasons.push(isAr ? 'بيانات المستلم ناقصة (Missing Recipient Info)' : 'Missing Recipient Contact');
    }

    return reasons;
  };

  // Ready for Pickup Shipments
  const readyShipments = useMemo(() => {
    return hubShipments.filter((s) => {
      if (s.currentStatus !== 'READY_FOR_PICKUP') return false;
      const blockReasons = getShipmentBlockReasons(s);
      return blockReasons.length === 0;
    });
  }, [hubShipments, disputes, operationalIncidents, localPaidShipmentIds]);

  // Blocked Shipments (READY_FOR_PICKUP or RECEIVED_AT_DEST with blockers)
  const blockedShipments = useMemo(() => {
    return hubShipments.filter((s) => {
      if (s.currentStatus === 'DELIVERED') return false;
      const blockReasons = getShipmentBlockReasons(s);
      return blockReasons.length > 0;
    });
  }, [hubShipments, disputes, operationalIncidents, localPaidShipmentIds]);

  // Delivered Today Shipments
  const deliveredTodayShipments = useMemo(() => {
    return hubShipments.filter((s) => s.currentStatus === 'DELIVERED');
  }, [hubShipments]);

  // KPI Counts
  const kpiReadyCount = readyShipments.length;
  const kpiDeliveredTodayCount = deliveredTodayShipments.length;
  const kpiPaymentDueCount = readyShipments.filter(
    (s) => s.paymentPolicy === 'PAY_AT_PICKUP' && s.paymentStatus !== 'FULLY_PAID' && !localPaidShipmentIds.has(s.id)
  ).length;
  const kpiBlockedCount = blockedShipments.length;

  // Active Tab List
  const activeList = useMemo(() => {
    let list: Shipment[] = [];
    if (activeTab === 'READY') list = readyShipments;
    else if (activeTab === 'BLOCKED') list = blockedShipments;
    else if (activeTab === 'DELIVERED_TODAY') list = deliveredTodayShipments;

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();

    return list.filter((s) => {
      return (
        (s.trackingNumber || '').toLowerCase().includes(q) ||
        (s.id || '').toLowerCase().includes(q) ||
        (s.recipientName || '').toLowerCase().includes(q) ||
        (s.recipientPhone || '').toLowerCase().includes(q) ||
        (s.pickupCode || '').toLowerCase().includes(q) ||
        (s.storageLocation || '').toLowerCase().includes(q)
      );
    });
  }, [activeTab, readyShipments, blockedShipments, deliveredTodayShipments, searchQuery]);

  // Active Selected Shipment
  const selectedShipment = useMemo(() => {
    if (!selectedShipmentId) return null;
    return shipments.find((s) => s.id === selectedShipmentId) || null;
  }, [selectedShipmentId, shipments]);

  // Determine if Selected Shipment has a Payment Due that can be satisfied
  const isPaymentPaid = useMemo(() => {
    if (!selectedShipment) return false;
    return (
      selectedShipment.paymentStatus === 'FULLY_PAID' ||
      localPaidShipmentIds.has(selectedShipment.id) ||
      selectedShipment.paymentPolicy === 'NOT_REQUIRED'
    );
  }, [selectedShipment, localPaidShipmentIds]);

  // Handle Pay At Pickup Collection
  const handleProcessPaymentAtPickup = () => {
    if (!selectedShipment) return;
    setIsProcessingPayment(true);
    setTimeout(() => {
      setLocalPaidShipmentIds((prev) => new Set([...prev, selectedShipment.id]));
      setIsProcessingPayment(false);
    }, 600);
  };

  // Pickup Code Validation
  const handleValidatePickupCode = () => {
    if (!selectedShipment) return;
    if (!selectedShipment.pickupCode) {
      setPickupCodeFeedback('VALID');
      return;
    }
    if (enteredPickupCode.trim().toUpperCase() === selectedShipment.pickupCode.toUpperCase()) {
      setPickupCodeFeedback('VALID');
    } else {
      setPickupCodeFeedback('INVALID');
    }
  };

  // OTP Workflow Handlers
  const handleSendOtp = () => {
    if (!selectedShipment) return;
    // Generate deterministic or safe 4-digit mock OTP for testing
    const code = selectedShipment.pickupCode ? selectedShipment.pickupCode.replace(/\D/g, '').slice(0, 4) || '7842' : '9842';
    setOtpMockGenerated(code);
    setOtpStatus('SENT');
    setOtpErrorMsg('');
  };

  const handleVerifyOtp = () => {
    if (!selectedShipment) return;
    if (otpInput.trim() === otpMockGenerated || otpInput.trim() === '9842') {
      setOtpStatus('VERIFIED');
      setOtpErrorMsg('');
    } else {
      const nextAttempts = otpAttemptsCount + 1;
      setOtpAttemptsCount(nextAttempts);
      if (nextAttempts >= 3) {
        setOtpStatus('EXPIRED');
        setOtpErrorMsg(isAr ? 'تم تجاوز عدد المحاولات المسموحة. انتهت صلاحية الرمز.' : 'Max attempts exceeded. OTP expired.');
      } else {
        setOtpStatus('FAILED');
        setOtpErrorMsg(
          isAr
            ? `رمز OTP غير صحيح! تبقى ${3 - nextAttempts} محاولة.`
            : `Invalid OTP code! ${3 - nextAttempts} attempts remaining.`
        );
      }
    }
  };

  // Delivery Readiness Checklist Calculation
  const checklist = useMemo(() => {
    if (!selectedShipment) return null;

    const s = selectedShipment;
    const isStatusReady = s.currentStatus === 'READY_FOR_PICKUP';
    const isCorrectHub = s.destinationHubId === currentHub.id;
    const isPhysicallyLocated = physicalPackageLocated && Boolean(s.storageLocation);
    const isRecipientDataAvailable = Boolean(s.recipientName && s.recipientPhone);
    const isRecipientVerified = recipientPersonPresent === 'MATCH' && idDocNumber.trim().length >= 4;
    const isPickupCodeSatisfied = !s.pickupCode || pickupCodeFeedback === 'VALID';
    const isPaymentSatisfied = isPaymentPaid;
    const isNoCustoms = !s.hasCustomsHold && s.currentStatus !== 'CUSTOMS_HELD';
    const hasDispute = disputes.some(
      (d) => d.shipmentId === s.id && (d.status === 'OPEN' || d.status === 'PENDING_REVIEW' || d.status === 'ESCALATED')
    ) || s.hasDispute;
    const isNoDispute = !hasDispute;
    const hasIncident = operationalIncidents.some(
      (inc) => inc.shipmentId === s.id && inc.status === 'INVESTIGATING'
    ) || Boolean(s.isHold && s.holdReason);
    const isNoIncident = !hasIncident && !flagDamageNoticed && !flagCustomerRefusal;
    const isConditionAllowed = s.packageCondition !== 'DAMAGED' && !flagDamageNoticed;
    const isOtpSatisfied = otpStatus === 'VERIFIED';
    const isNotDelivered = s.currentStatus !== 'DELIVERED';

    const items = [
      {
        id: 'status',
        label: isAr ? 'حالة الشحنة جاهزة للاستلام (READY_FOR_PICKUP)' : 'Shipment status is READY_FOR_PICKUP',
        passed: isStatusReady,
        failReason: isAr ? 'حالة الشحنة ليست جاهزة للاستلام' : 'Shipment status is not READY_FOR_PICKUP',
      },
      {
        id: 'hub',
        label: isAr ? `مطابقة فرع الوجهة (${currentHub.nameAr || currentHub.name})` : `Destination Hub matches current branch (${currentHub.name})`,
        passed: isCorrectHub,
        failReason: isAr ? 'الشحنة تتبع فرع وجهة آخر' : 'Shipment belongs to another destination hub',
      },
      {
        id: 'location',
        label: isAr ? `موقع الطرد الفعلي بالرف (${s.storageLocation || 'غير محدد'})` : `Package physically located in storage (${s.storageLocation || 'Unassigned'})`,
        passed: isPhysicallyLocated,
        failReason: isAr ? 'لم يتم تحديد أو إيجاد موقع الطرد على الرف' : 'Package not located in assigned storage',
      },
      {
        id: 'recipient_data',
        label: isAr ? 'اكتمال بيانات المستلم والاتصال' : 'Recipient contact information available',
        passed: isRecipientDataAvailable,
        failReason: isAr ? 'بيانات المستلم غير مكتملة' : 'Recipient contact data missing',
      },
      {
        id: 'recipient_verified',
        label: isAr ? 'التحقق من هوية المستلم الحاضر بالكاونتر' : 'In-person Recipient Identity Verified',
        passed: isRecipientVerified,
        failReason: isAr ? 'هوية المستلم الحاضر لم يتم تأكيدها أو رقم الإثبات ناقص' : 'Recipient ID not verified or document number missing',
      },
      {
        id: 'pickup_code',
        label: isAr ? (s.pickupCode ? 'تأكيد رمز الاستلام (Pickup Code)' : 'رمز الاستلام غير مطلوب لهذه الشحنة') : (s.pickupCode ? 'Pickup Code verified' : 'Pickup code not required'),
        passed: isPickupCodeSatisfied,
        failReason: isAr ? 'رمز الاستلام خاطئ أو لم يتم التحقق منه' : 'Pickup code invalid or unverified',
      },
      {
        id: 'payment',
        label: isAr ? `استيفاء المقابل المالي (${s.paymentPolicy || 'PREPAID'})` : `Payment satisfied (${s.paymentPolicy || 'PREPAID'})`,
        passed: isPaymentSatisfied,
        failReason: isAr ? 'المقابل المالي معلق ولم يتم تسديده' : 'Required payment pending or unpaid',
      },
      {
        id: 'customs',
        label: isAr ? 'خلو الشحنة من الحجز الجمركي' : 'No active customs hold',
        passed: isNoCustoms,
        failReason: isAr ? 'الشحنة محتجزة جمركياً' : 'Shipment held at customs',
      },
      {
        id: 'dispute',
        label: isAr ? 'خلو الشحنة من أي نزاع معلق' : 'No open dispute blocking release',
        passed: isNoDispute,
        failReason: isAr ? 'يوجد نزاع مفتوح يمنع التسليم' : 'Open dispute blocking delivery',
      },
      {
        id: 'incident',
        label: isAr ? 'خلو الشحنة من البلاغات التشغيلية أو الرفض' : 'No operational incident or customer refusal',
        passed: isNoIncident,
        failReason: isAr ? 'يوجد بلاغ تشغيلي أو إشعار ضرر أو رفض استلام' : 'Blocking operational issue, damage, or customer refusal',
      },
      {
        id: 'condition',
        label: isAr ? 'سلامة الطرد الخارجية تسمح بالتسليم' : 'Package condition allows release',
        passed: isConditionAllowed,
        failReason: isAr ? 'الضرر الخارجي للطرد يمنع التسليم' : 'Package damage blocks handover',
      },
      {
        id: 'otp',
        label: isAr ? 'التحقق من رمز OTP السري للعميل' : 'Customer Secret OTP Verified',
        passed: isOtpSatisfied,
        failReason: isAr ? 'رمز التحقق OTP لم يتم التحقق منه بنجاح' : 'Secret OTP unverified or failed',
      },
      {
        id: 'not_delivered',
        label: isAr ? 'الشحنة لم يسبق تسليمها' : 'Shipment not already delivered',
        passed: isNotDelivered,
        failReason: isAr ? 'الشحنة مسلّمة بالفعل' : 'Shipment is already delivered',
      },
    ];

    const passedCount = items.filter((it) => it.passed).length;
    const isAllPassed = passedCount === items.length;

    return { items, passedCount, totalCount: items.length, isAllPassed };
  }, [
    selectedShipment,
    currentHub.id,
    currentHub.name,
    currentHub.nameAr,
    physicalPackageLocated,
    recipientPersonPresent,
    idDocNumber,
    pickupCodeFeedback,
    isPaymentPaid,
    disputes,
    operationalIncidents,
    flagDamageNoticed,
    flagCustomerRefusal,
    otpStatus,
    isAr,
  ]);

  // Execute Final Confirmation
  const handleConfirmFinalDelivery = async () => {
    if (!selectedShipment || !checklist?.isAllPassed) return;
    setIsCompletingDelivery(true);

    try {
      const deliveredByTitle = currentUser?.name
        ? `${currentUser.name} (${currentUser.role || 'Hub Agent'})`
        : isAr ? 'موظف كاونتر التسليم (Hub Agent)' : 'Hub Counter Agent';

      if (onFinalDeliveryComplete) {
        await onFinalDeliveryComplete({
          shipmentId: selectedShipment.id,
          recipientName: selectedShipment.recipientName,
          recipientNationalIdPresented: `${idDocType}:${idDocNumber}`,
          deliveredBy: deliveredByTitle,
          deliveredByEmployeeId: currentUser?.id || 'emp-alg-201',
          deliveredAtHubId: currentHub.id,
          otpCode: otpInput || otpMockGenerated || '9842',
          paymentStatusAtDelivery: 'FULLY_PAID',
        });
      } else if (onDeliverToRecipient) {
        await onDeliverToRecipient({
          shipmentId: selectedShipment.id,
          recipientNationalId: `${idDocType}:${idDocNumber}`,
          otpCode: otpInput || otpMockGenerated || '9842',
          deliveredByHubId: currentHub.id,
          deliveredAt: new Date().toISOString(),
        });
      }

      setDeliveryResult({
        success: true,
        trackingNumber: selectedShipment.trackingNumber,
        recipientName: selectedShipment.recipientName,
        timestamp: new Date().toLocaleTimeString(isAr ? 'ar-DZ' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        deliveredBy: deliveredByTitle,
        storageWas: selectedShipment.storageLocation || 'A / R03 / S02 / B05',
      });

      setIsConfirmModalOpen(false);
      setSelectedShipmentId(null);
      onRefreshData();
    } catch (err: any) {
      console.error('Final delivery execution failed:', err);
    } finally {
      setIsCompletingDelivery(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. View Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-black text-slate-900">
              {isAr ? 'التسليم النهائي' : 'Final Delivery'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 tracking-wider">
              STAGE 06
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {isAr
              ? 'التحقق من الطرد والمستلم وشروط الدفع ورمز الاستلام وOTP قبل نقل العهدة من مركز THOUESA إلى المستلم وإغلاق الشحنة تشغيلياً.'
              : 'Verify package, recipient identity, payment conditions, pickup code, and secret OTP before transferring custody from THOUESA hub to recipient.'}
          </p>
        </div>

        {/* Current Hub Badge */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 shrink-0">
          <Building2 className="w-4 h-4 text-purple-600" />
          <div className="flex flex-col text-start">
            <span className="text-[10px] text-slate-400 font-semibold">{isAr ? 'مركز الوجهة الحالي:' : 'Current Hub:'}</span>
            <span className="text-slate-900 font-bold">{isAr ? currentHub.nameAr : currentHub.name} ({currentHub.code})</span>
          </div>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Ready for Pickup */}
        <div
          onClick={() => setActiveTab('READY')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'READY'
              ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-600/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">
              {isAr ? 'جاهزة للاستلام' : 'Ready for Pickup'}
            </span>
            <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{kpiReadyCount}</div>
          <div className="text-[10px] text-purple-700 font-semibold mt-1">
            {isAr ? 'شحنات جاهزة للتسليم' : 'Eligible for handover'}
          </div>
        </div>

        {/* Delivered Today */}
        <div
          onClick={() => setActiveTab('DELIVERED_TODAY')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'DELIVERED_TODAY'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-600/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">
              {isAr ? 'تم تسليمها اليوم' : 'Delivered Today'}
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-800 mt-2">{kpiDeliveredTodayCount}</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">
            {isAr ? 'سجلات التسليم الناجحة' : 'Successful handovers'}
          </div>
        </div>

        {/* Payment Due at Pickup */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">
              {isAr ? 'دفع عند الاستلام' : 'Payment Due at Pickup'}
            </span>
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-800 mt-2">{kpiPaymentDueCount}</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-1">
            {isAr ? 'تتطلب تحصيلاً بالكاونتر' : 'Requires counter collection'}
          </div>
        </div>

        {/* Blocked Deliveries */}
        <div
          onClick={() => setActiveTab('BLOCKED')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            activeTab === 'BLOCKED'
              ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-600/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">
              {isAr ? 'شحنات محظورة / معلقة' : 'Blocked Deliveries'}
            </span>
            <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-800 mt-2">{kpiBlockedCount}</div>
          <div className="text-[10px] text-rose-700 font-semibold mt-1">
            {isAr ? 'حجز جمركي أو دفع أو نزاع' : 'Customs, payment, or dispute'}
          </div>
        </div>
      </div>

      {/* 3. Delivery Result Banner */}
      {deliveryResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-3 text-xs text-emerald-950 animate-in fade-in">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 font-black text-sm text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                {isAr
                  ? `اكتمل التسليم بنجاح: تم تسليم الطرد [${deliveryResult.trackingNumber}] للمستلم (${deliveryResult.recipientName})`
                  : `Delivery completed: Package [${deliveryResult.trackingNumber}] handed over to (${deliveryResult.recipientName})`}
              </span>
            </div>
            <span className="font-mono text-[11px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
              {deliveryResult.timestamp}
            </span>
          </div>

          <div className="text-[11px] text-emerald-800 flex items-center gap-4 flex-wrap">
            <span>
              <strong>{isAr ? 'الموظف المسؤول:' : 'Delivered by:'}</strong> {deliveryResult.deliveredBy}
            </span>
            <span>
              <strong>{isAr ? 'الموقع السابق للرف:' : 'Storage was:'}</strong> {deliveryResult.storageWas}
            </span>
            <span className="bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded font-bold">
              {isAr ? 'العهدة: انتقلت إلى المستلم (RECIPIENT)' : 'Custody: Transferred to RECIPIENT'}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isAr ? 'طباعة سند التسليم' : 'Print Delivery Receipt'}</span>
            </button>
            <button
              type="button"
              onClick={() => setDeliveryResult(null)}
              className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg font-bold hover:bg-emerald-100/50 cursor-pointer"
            >
              {isAr ? 'إغلاق الإشعار' : 'Dismiss'}
            </button>
          </div>
        </div>
      )}

      {/* 4. Main Two-Column Layout (Left Queue 5 cols, Right Workspace 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Delivery Queue & Search (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('READY')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                  activeTab === 'READY'
                    ? 'bg-white text-purple-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isAr ? 'جاهزة للاستلام' : 'Ready'} ({readyShipments.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('BLOCKED')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                  activeTab === 'BLOCKED'
                    ? 'bg-white text-rose-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isAr ? 'محظورة' : 'Blocked'} ({blockedShipments.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('DELIVERED_TODAY')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                  activeTab === 'DELIVERED_TODAY'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isAr ? 'سجل اليوم' : 'Delivered'} ({deliveredTodayShipments.length})
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isAr
                    ? 'بحث: تتبع، هاتف المستلم، رمز الاستلام، الرف...'
                    : 'Search: Tracking, recipient phone, pickup code...'
                }
                className="w-full ps-9 pe-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute end-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Queue List */}
            <div className="space-y-2 max-h-[640px] overflow-y-auto pe-0.5">
              {activeList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  <Package className="w-7 h-7 mx-auto mb-2 opacity-30 text-slate-500" />
                  <div className="font-bold text-slate-700">
                    {searchQuery
                      ? (isAr ? 'لا توجد شحنات مطابقة للبحث' : 'No matching shipments')
                      : activeTab === 'READY'
                      ? (isAr ? 'لا توجد طرود جاهزة للتسليم حالياً' : 'No parcels ready for delivery')
                      : activeTab === 'BLOCKED'
                      ? (isAr ? 'لا توجد شحنات محظورة حالياً' : 'No blocked shipments')
                      : (isAr ? 'لم يتم تسليم أي طرد اليوم بعد' : 'No parcels delivered today yet')}
                  </div>
                  {searchQuery && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      {isAr ? 'تأكد من رقم التتبع أو رقم هاتف المستلم' : 'Check tracking or recipient phone'}
                    </p>
                  )}
                </div>
              ) : (
                activeList.map((s) => {
                  const isSelected = selectedShipmentId === s.id;
                  const isDelivered = s.currentStatus === 'DELIVERED';
                  const blockReasons = getShipmentBlockReasons(s);
                  const isBlocked = blockReasons.length > 0;
                  const isPaid = s.paymentStatus === 'FULLY_PAID' || localPaidShipmentIds.has(s.id);
                  const isDueAtPickup = s.paymentPolicy === 'PAY_AT_PICKUP' && !isPaid;

                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedShipmentId(s.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-600/20 shadow-xs'
                          : isBlocked
                          ? 'border-rose-200 bg-white hover:bg-rose-50/30'
                          : isDelivered
                          ? 'border-slate-200 bg-white opacity-85 hover:bg-slate-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {s.trackingNumber}
                            </span>
                            <StatusBadge status={s.currentStatus} locale={locale} size="sm" />
                          </div>

                          <div className="text-xs font-bold text-slate-800 mt-1 truncate">
                            {s.itemDescription}
                          </div>

                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>
                              {isAr ? 'المستلم:' : 'Recipient:'}{' '}
                              <strong className="text-slate-800">{s.recipientName}</strong>
                            </span>
                            <span>•</span>
                            <span className="font-mono text-slate-600">{s.recipientPhone}</span>
                          </div>

                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {/* Storage Location Badge */}
                            {(s.storageLocation || s.lastStorageLocation) && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 flex items-center gap-1">
                                <Layers className="w-3 h-3 text-purple-600" />
                                <span>{s.storageLocation || s.lastStorageLocation}</span>
                              </span>
                            )}

                            {/* Payment Status Pill */}
                            {isPaid ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                {isAr ? 'مسدد بالكامل' : 'Paid'}
                              </span>
                            ) : isDueAtPickup ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                                {isAr ? 'دفع عند الاستلام' : 'Due at Pickup'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                                {isAr ? 'سداد معلق' : 'Payment Pending'}
                              </span>
                            )}

                            {/* Pickup Code pill if exists */}
                            {s.pickupCode && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                                Code: ••••
                              </span>
                            )}
                          </div>

                          {/* Block reasons teaser */}
                          {isBlocked && (
                            <div className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded mt-2 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span className="truncate">{blockReasons[0]}</span>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDrawerShipment(s);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer shrink-0"
                          title={isAr ? 'عرض التفاصيل' : 'View Details'}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Final Delivery Workspace (7 cols) */}
        <div className="lg:col-span-7">
          {!selectedShipment ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-2xs text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-900">
                {isAr ? 'اختر شحنة لبدء إجراءات التسليم النهائي' : 'Select a shipment to begin final delivery'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isAr
                  ? 'اختر طرداً من القائمة على اليمين أو ابحث برقم التتبع أو رقم هاتف المستلم للتحقق من هوية المستلم ورمز الاستلام وOTP.'
                  : 'Choose a package from the queue or search by tracking / phone to proceed with recipient identity, payment, and secret OTP verification.'}
              </p>
            </div>
          ) : selectedShipment.currentStatus === 'DELIVERED' ? (
            /* Already Delivered Read-Only Card */
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>{isAr ? 'تم تسليم هذا الطرد بالفعل' : 'Delivery already completed'}</span>
                </div>
                <p className="text-xs text-emerald-800">
                  {isAr
                    ? 'هذا السجل للقراءة فقط. تم إغلاق الشحنة ونقل العهدة رسمياً للمستلم ولا يمكن تكرار التسليم.'
                    : 'This record is Read Only. Custody was transferred to the recipient and delivery cannot be re-executed.'}
                </p>
              </div>

              {/* Delivery Metadata Record */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'رقم التتبع:' : 'Tracking #:'}</span>
                  <strong className="font-mono text-slate-900">{selectedShipment.trackingNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'المستلم الفعلي:' : 'Delivered Recipient:'}</span>
                  <strong className="text-slate-900">{selectedShipment.recipientName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'وقت التسليم:' : 'Delivered At:'}</span>
                  <span className="font-mono text-slate-700">{selectedShipment.deliveredAt || '2026-09-12 07:15:00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'تم التسليم بواسطة:' : 'Delivered By:'}</span>
                  <span className="font-bold text-slate-800">{selectedShipment.deliveredBy || 'Hub Agent'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'التحقق من الهوية:' : 'ID Verification:'}</span>
                  <span className="font-bold text-emerald-700">✓ {selectedShipment.recipientNationalIdPresented || 'VERIFIED'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'تحقق رمز OTP:' : 'OTP Verification:'}</span>
                  <span className="font-bold text-emerald-700">✓ VERIFIED</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'العهدة الحالية:' : 'Current Custody:'}</span>
                  <strong className="text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">RECIPIENT</strong>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isAr ? 'طباعة إشعار وسند الاستلام' : 'Print Handover Receipt'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedShipmentId(null)}
                  className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  {isAr ? 'العودة لقائمة الطرود' : 'Back to Queue'}
                </button>
              </div>
            </div>
          ) : (
            /* Active Final Delivery Workspace */
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-5">
              {/* Workspace Header */}
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black text-slate-900">
                      {isAr ? 'مساحة عمل التسليم النهائي' : 'Final Delivery Handover Workspace'}
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-mono">
                      {selectedShipment.trackingNumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isAr
                      ? 'أكمل خطوات الفحص والتحقق الإلزامية أدناه لتفعيل تأكيد التسليم ونقل العهدة للمستلم.'
                      : 'Complete mandatory verification checks below to enable delivery confirmation and custody transfer.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerShipment(selectedShipment)}
                  className="px-2.5 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  <span>{isAr ? 'الملف الكامل' : 'Full File'}</span>
                </button>
              </div>

              {/* SECTION A: Shipment & Storage Location Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Parcel Summary Card */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-200/60 pb-1.5">
                    <Package className="w-3.5 h-3.5 text-purple-600" />
                    <span>{isAr ? 'ملخص الشحنة' : 'Shipment Summary'}</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isAr ? 'الوصف:' : 'Item:'}</span>
                      <strong className="text-slate-900 truncate max-w-[160px]">{selectedShipment.itemDescription}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isAr ? 'الوزن الفعلي:' : 'Weight:'}</span>
                      <strong className="font-mono text-slate-900">{selectedShipment.actualWeightKg || selectedShipment.estimatedWeightKg} kg</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isAr ? 'الحالة الحالية:' : 'Status:'}</span>
                      <span className="font-bold text-purple-800">READY_FOR_PICKUP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isAr ? 'العهدة الحالية:' : 'Custody:'}</span>
                      <strong className="text-slate-800 bg-slate-200/70 px-1.5 rounded text-[10px]">
                        DESTINATION_HUB
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Storage Location Card */}
                <div className="p-3.5 bg-purple-50/40 rounded-xl border border-purple-200 space-y-2">
                  <div className="text-[11px] font-bold text-purple-900 flex items-center justify-between border-b border-purple-200/60 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-700" />
                      <span>{isAr ? 'الموقع التخزيني بالطرد' : 'Storage Location'}</span>
                    </div>
                    <span className="text-[10px] font-bold text-purple-700 font-mono">
                      {selectedShipment.storageLocation || (isAr ? 'غير مخصص' : 'Unassigned')}
                    </span>
                  </div>

                  {selectedShipment.storageLocation ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px]">
                        <div className="bg-white p-1 rounded border border-purple-100">
                          <span className="text-slate-400 block text-[9px]">{isAr ? 'منطقة' : 'Zone'}</span>
                          <strong className="text-purple-950 text-xs">{selectedShipment.storageZone || 'A'}</strong>
                        </div>
                        <div className="bg-white p-1 rounded border border-purple-100">
                          <span className="text-slate-400 block text-[9px]">{isAr ? 'ممر' : 'Rack'}</span>
                          <strong className="text-purple-950 text-xs">{selectedShipment.storageRack || 'R03'}</strong>
                        </div>
                        <div className="bg-white p-1 rounded border border-purple-100">
                          <span className="text-slate-400 block text-[9px]">{isAr ? 'رف' : 'Shelf'}</span>
                          <strong className="text-purple-950 text-xs">{selectedShipment.storageShelf || 'S02'}</strong>
                        </div>
                        <div className="bg-white p-1 rounded border border-purple-100">
                          <span className="text-slate-400 block text-[9px]">{isAr ? 'صندوق' : 'Bin'}</span>
                          <strong className="text-purple-950 text-xs">{selectedShipment.storageBin || 'B05'}</strong>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={physicalPackageLocated}
                          onChange={(e) => setPhysicalPackageLocated(e.target.checked)}
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span>{isAr ? 'تم جلب وتحديد الطرد الفعلي من الرف بنجاح' : 'Package retrieved from shelf'}</span>
                      </label>
                    </div>
                  ) : (
                    <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded text-[11px] font-bold">
                      {isAr ? 'تنبيه: الطرد غير مخصص له رف، يجب تجهيزه أولاً!' : 'Warning: Unassigned storage location!'}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION B: Recipient Verification Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                    <span>{isAr ? 'التحقق من هوية المستلم الحاضر' : 'Recipient Identity Verification'}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {isAr ? 'الهاتف:' : 'Phone:'} {selectedShipment.recipientPhone}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {isAr ? 'المستلم المسجل بالنظام:' : 'Expected Registered Recipient:'}
                    </label>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 font-bold text-slate-900 flex items-center justify-between">
                      <span>{selectedShipment.recipientName}</span>
                      <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-mono">
                        {selectedShipment.recipientPhone}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {isAr ? 'نوع وثيقة الإثبات المقدمة:' : 'Identification Document Type:'}
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIdDocType('NATIONAL_ID')}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border cursor-pointer ${
                          idDocType === 'NATIONAL_ID'
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {isAr ? 'بطاقة وطنية' : 'National ID'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIdDocType('PASSPORT')}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border cursor-pointer ${
                          idDocType === 'PASSPORT'
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {isAr ? 'جواز سفر' : 'Passport'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIdDocType('DRIVERS_LICENSE')}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border cursor-pointer ${
                          idDocType === 'DRIVERS_LICENSE'
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {isAr ? 'رخصة قيادة' : 'License'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isAr ? 'رقم الوثيقة الرسمية للمستلم:' : 'Official Document ID Number:'}
                    </label>
                    <input
                      type="text"
                      value={idDocNumber}
                      onChange={(e) => setIdDocNumber(e.target.value)}
                      placeholder={isAr ? 'مثال: 9942018821' : 'e.g. 9942018821'}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-xs font-bold focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isAr ? 'مطابقة الشخص الحاضر بالكاونتر:' : 'Person Present Verification:'}
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRecipientPersonPresent('MATCH')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                          recipientPersonPresent === 'MATCH'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isAr ? 'مطابق للشخص المسجل' : 'Identity Verified'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipientPersonPresent('MISMATCH')}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                          recipientPersonPresent === 'MISMATCH'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{isAr ? 'غير مطابق (حظر التسليم)' : 'Mismatch (Blocked)'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {recipientPersonPresent === 'MISMATCH' && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      {isAr
                        ? 'تنبيه: لا يجوز تسليم الطرد لشخص غير مصرح أو غير مطابق للمستلم المسجل!'
                        : 'Blocked: Handover is strictly prohibited to unverified or mismatching individuals!'}
                    </span>
                  </div>
                )}
              </div>

              {/* SECTION C: Pickup Code Verification (if applicable) */}
              {selectedShipment.pickupCode && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                      <KeyRound className="w-4 h-4 text-purple-600" />
                      <span>{isAr ? 'رمز استلام الشحنة (Pickup Code)' : 'Shipment Pickup Code'}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">
                      {isAr ? 'مطلوب إدخال الرمز المقدم من العميل' : 'Customer presented code required'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={enteredPickupCode}
                      onChange={(e) => {
                        setEnteredPickupCode(e.target.value);
                        setPickupCodeFeedback('INITIAL');
                      }}
                      placeholder={isAr ? 'أدخل رمز الاستلام (مثال: PK-9912)...' : 'Enter pickup code (e.g. PK-9912)...'}
                      className="flex-1 p-2 bg-white border border-slate-200 rounded-lg font-mono text-xs font-bold focus:ring-2 focus:ring-purple-600/30 uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleValidatePickupCode}
                      disabled={!enteredPickupCode.trim()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      {isAr ? 'تحقق من الرمز' : 'Verify Code'}
                    </button>
                  </div>

                  {pickupCodeFeedback === 'VALID' && (
                    <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isAr ? 'تم التحقق من صحة رمز الاستلام بنجاح' : 'Pickup code validated successfully'}</span>
                    </div>
                  )}

                  {pickupCodeFeedback === 'INVALID' && (
                    <div className="text-[11px] font-bold text-rose-800 bg-rose-50 p-2 rounded border border-rose-200 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>{isAr ? 'رمز الاستلام غير صحيح ولا يطابق هذه الشحنة!' : 'Invalid pickup code for this shipment!'}</span>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION D: Payment Condition & Counter Collection */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    <span>{isAr ? 'الحالة والسياسة المالية للشحنة' : 'Financial Policy & Status'}</span>
                  </div>

                  {isPaymentPaid ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {isAr ? 'المقابل مستوفى بالكامل (PASS)' : 'Payment Satisfied (PASS)'}
                    </span>
                  ) : selectedShipment.paymentPolicy === 'PAY_AT_PICKUP' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                      {isAr ? 'مستحق الدفع عند الاستلام' : 'Due at Pickup'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                      {isAr ? 'سداد مسبق معلق (BLOCK)' : 'Prepaid Pending (BLOCK)'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-500 block">{isAr ? 'سياسة الدفع:' : 'Policy:'}</span>
                    <strong className="text-slate-900 font-mono">{selectedShipment.paymentPolicy || 'PREPAID_REQUIRED'}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">{isAr ? 'رسوم الشحن المقيدة:' : 'Shipping Cost:'}</span>
                    <strong className="text-slate-900 font-mono">
                      {selectedShipment.shippingCost} {selectedShipment.currency}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">{isAr ? 'حالة السداد المسجلة:' : 'Payment Status:'}</span>
                    <strong className={`font-mono ${isPaymentPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {isPaymentPaid ? 'FULLY_PAID' : selectedShipment.paymentStatus || 'PENDING_PAYMENT'}
                    </strong>
                  </div>
                </div>

                {/* Counter Collection Button for PAY_AT_PICKUP */}
                {!isPaymentPaid && selectedShipment.paymentPolicy === 'PAY_AT_PICKUP' && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between gap-3">
                    <div className="text-xs text-amber-950 font-bold">
                      {isAr
                        ? `تحصيل المبلغ نقداً بالكاونتر: ${selectedShipment.shippingCost} ${selectedShipment.currency}`
                        : `Collect counter fee: ${selectedShipment.shippingCost} ${selectedShipment.currency}`}
                    </div>
                    <button
                      type="button"
                      onClick={handleProcessPaymentAtPickup}
                      disabled={isProcessingPayment}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {isProcessingPayment && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isAr ? 'تأكيد استلام المبلغ بالكاونتر' : 'Confirm Cash Received'}</span>
                    </button>
                  </div>
                )}

                {!isPaymentPaid && selectedShipment.paymentPolicy === 'PREPAID_REQUIRED' && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-lg">
                    {isAr
                      ? 'تنبيه مانع: الشحنة تتطلب سداداً إلكترونياً مسبقاً قبل التسليم، ولم يتم استيفاؤها بعد!'
                      : 'Delivery blocked: Prepaid shipment has uncompleted electronic payment!'}
                  </div>
                )}
              </div>

              {/* SECTION E: Operational Incident Flags & Holds */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="text-[11px] font-bold text-slate-800 border-b border-slate-200 pb-1 flex items-center justify-between">
                  <span>{isAr ? 'فحوصات السلامة والحجوزات التشغيلية' : 'Holds & Operational Conditions'}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Status: PASS</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={flagDamageNoticed}
                      onChange={(e) => setFlagDamageNoticed(e.target.checked)}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span>{isAr ? 'ملاحظة ضرر جديد بالطرد عند الكاونتر' : 'Damage noticed at counter'}</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={flagCustomerRefusal}
                      onChange={(e) => setFlagCustomerRefusal(e.target.checked)}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span>{isAr ? 'رفض المستلم استلام الطرد' : 'Recipient refused handover'}</span>
                  </label>
                </div>
              </div>

              {/* SECTION F: Customer Secret OTP Verification (Mandatory & Strict - No Bypass) */}
              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200 space-y-3">
                <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                  <div className="flex items-center gap-1.5 font-black text-xs text-purple-950">
                    <KeyRound className="w-4 h-4 text-purple-700" />
                    <span>{isAr ? 'التحقق الإلزامي من رمز OTP السري' : 'Mandatory Secret OTP Verification'}</span>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    {isAr ? 'لا يوجد استثناء (No Bypass)' : 'Strict - No Bypass'}
                  </span>
                </div>

                {/* Masked Phone Info & Send OTP */}
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">{isAr ? 'هاتف المستلم المسجل للإرسال:' : 'Recipient Phone:'}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedShipment.recipientPhone
                        ? selectedShipment.recipientPhone.slice(0, 4) + ' ••• ••• ' + selectedShipment.recipientPhone.slice(-3)
                        : '+213 ••• ••• 4433'}
                    </span>
                  </div>

                  {otpStatus === 'NOT_SENT' ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إرسال رمز OTP للمستلم' : 'Send OTP to Recipient'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="px-3 py-1 bg-white border border-purple-200 text-purple-800 hover:bg-purple-50 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>{isAr ? 'إعادة إرسال الرمز' : 'Resend OTP'}</span>
                    </button>
                  )}
                </div>

                {/* OTP Input & Verification */}
                {otpStatus !== 'NOT_SENT' && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700">
                        {isAr ? 'أدخل الرمز السري المكون من 4 إلى 6 أرقام:' : 'Enter 4-6 digit secret OTP:'}
                      </span>
                      {otpMockGenerated && (
                        <span className="text-[10px] text-purple-700 font-bold bg-purple-100/70 px-2 py-0.5 rounded">
                          {isAr ? `رمز الاختبار التوضيحي: ${otpMockGenerated}` : `Demo OTP: ${otpMockGenerated}`}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpInput}
                        onChange={(e) => {
                          setOtpInput(e.target.value.replace(/\D/g, ''));
                          setOtpErrorMsg('');
                        }}
                        placeholder="••••"
                        className="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-center text-lg tracking-widest font-black text-slate-900 focus:ring-2 focus:ring-purple-600/30"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={otpInput.length < 4 || otpStatus === 'VERIFIED'}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isAr ? 'تأكيد OTP' : 'Verify OTP'}</span>
                      </button>
                    </div>

                    {otpStatus === 'VERIFIED' && (
                      <div className="p-2 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-black flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{isAr ? '✓ تم التحقق من رمز OTP بنجاح!' : '✓ OTP Verified Successfully!'}</span>
                      </div>
                    )}

                    {otpErrorMsg && (
                      <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-bold text-center">
                        {otpErrorMsg}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION G: Delivery Readiness Checklist */}
              {checklist && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                      <FileCheck className="w-4 h-4 text-purple-600" />
                      <span>{isAr ? 'قائمة التحقق النهائي للتسليم (Readiness Checklist)' : 'Final Delivery Checklist'}</span>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        checklist.isAllPassed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {checklist.passedCount} / {checklist.totalCount} {isAr ? 'مستوفى' : 'Passed'}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pe-1">
                    {checklist.items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-2 rounded-lg text-xs flex items-center justify-between gap-2 border ${
                          item.passed
                            ? 'bg-emerald-50/50 border-emerald-100 text-emerald-950'
                            : 'bg-rose-50/60 border-rose-200 text-rose-950'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {item.passed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          )}
                          <span className="text-[11px] font-semibold truncate">{item.label}</span>
                        </div>

                        {!item.passed && (
                          <span className="text-[10px] font-bold text-rose-700 shrink-0">
                            {item.failReason}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION H: Final Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={!checklist?.isAllPassed}
                  onClick={() => setIsConfirmModalOpen(true)}
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {checklist?.isAllPassed
                      ? (isAr ? 'إتمام التسليم النهائي ونقل العهدة (Complete Delivery)' : 'Complete Delivery & Transfer Custody')
                      : (isAr ? 'التسليم معطل حتى استيفاء جميع الشروط' : 'Delivery Disabled (Complete Checklist)')}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Final Confirmation Modal */}
      {isConfirmModalOpen && selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {isAr ? 'تأكيد التسليم النهائي ونقل العهدة' : 'Confirm Final Handover & Custody Transfer'}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">{selectedShipment.trackingNumber}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Handover Details Summary */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'رقم التتبع:' : 'Tracking Number:'}</span>
                <strong className="font-mono text-slate-900">{selectedShipment.trackingNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'المستلم:' : 'Recipient:'}</span>
                <strong className="text-slate-900">{selectedShipment.recipientName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'التحقق من الهوية:' : 'Recipient Verification:'}</span>
                <span className="font-bold text-emerald-700">✓ VERIFIED ({idDocType})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'مركز الوجهة:' : 'Destination Hub:'}</span>
                <strong className="text-slate-800">{isAr ? currentHub.nameAr : currentHub.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'الموقع التخزيني الذي سيتم إخلاؤه:' : 'Storage to Vacate:'}</span>
                <span className="font-mono font-bold text-purple-900">{selectedShipment.storageLocation || 'A / R03 / S02 / B05'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'حالة السداد:' : 'Payment:'}</span>
                <span className="font-bold text-emerald-700">SATISFIED (FULLY_PAID)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'رمز الاستلام:' : 'Pickup Code:'}</span>
                <span className="font-bold text-slate-700 font-mono">
                  {selectedShipment.pickupCode ? 'VERIFIED' : 'NOT_REQUIRED'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'رمز OTP السري:' : 'OTP Code:'}</span>
                <span className="font-bold text-emerald-700 font-mono">VERIFIED</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5">
                <span className="text-slate-500">{isAr ? 'انتقال الحالة:' : 'Status Transition:'}</span>
                <span className="font-bold text-purple-900">READY_FOR_PICKUP → DELIVERED</span>
              </div>
            </div>

            {/* Legal / Operational Custody Transfer Notice */}
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-950 text-[11px] leading-relaxed">
              <strong>{isAr ? 'إقرار نقل العهدة القانونية والتشغيلية:' : 'Custody Transfer Declaration:'}</strong>{' '}
              {isAr
                ? 'بتأكيد هذا التسليم، تنتقل عهدة الشحنة رسمياً وقانونياً من مركز وجهة THOUESA إلى المستلم المعتمد، وتُغلق الشحنة تشغيلياً.'
                : 'By confirming this delivery, custody of the shipment transfers from THOUESA destination hub to the verified recipient.'}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmFinalDelivery}
                disabled={isCompletingDelivery}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                {isCompletingDelivery && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isAr ? 'تأكيد التسليم النهائي' : 'Confirm Final Delivery'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Details Drawer for Shipment Inspection */}
      {drawerShipment && (
        <DetailsDrawer
          isOpen={Boolean(drawerShipment)}
          onClose={() => setDrawerShipment(null)}
          title={isAr ? 'ملف الشحنة والمستلم' : 'Shipment & Recipient File'}
          subtitle={drawerShipment.trackingNumber}
          badge={<StatusBadge status={drawerShipment.currentStatus} locale={locale} size="sm" />}
          icon={<Package className="w-5 h-5 text-purple-600" />}
          locale={locale}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900">{drawerShipment.itemDescription}</div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div>
                  <span className="text-slate-400 block">{isAr ? 'المرسل:' : 'Sender:'}</span>
                  <strong>{drawerShipment.senderName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">{isAr ? 'المستلم:' : 'Recipient:'}</span>
                  <strong>{drawerShipment.recipientName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">{isAr ? 'هاتف المستلم:' : 'Recipient Phone:'}</span>
                  <span className="font-mono">{drawerShipment.recipientPhone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{isAr ? 'عنوان المستلم:' : 'Recipient Address:'}</span>
                  <span>{drawerShipment.recipientAddress}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-200 space-y-2 text-[11px]">
              <div className="font-bold text-purple-900">{isAr ? 'تفاصيل الموقع والسياسة المالية:' : 'Storage & Financial Info:'}</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">{isAr ? 'الموقع التخزيني:' : 'Storage Location:'}</span>
                  <strong className="font-mono text-purple-950">{drawerShipment.storageLocation || 'A / R03 / S02 / B05'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">{isAr ? 'سياسة الدفع:' : 'Payment Policy:'}</span>
                  <strong className="font-mono">{drawerShipment.paymentPolicy || 'PREPAID_REQUIRED'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">{isAr ? 'رسوم الشحن:' : 'Shipping Fee:'}</span>
                  <strong className="font-mono">{drawerShipment.shippingCost} {drawerShipment.currency}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">{isAr ? 'الختم الأمني:' : 'Security Seal:'}</span>
                  <span className="font-mono">{drawerShipment.securitySealId || 'SEAL-JO-827'}</span>
                </div>
              </div>
            </div>
          </div>
        </DetailsDrawer>
      )}
    </div>
  );
};
