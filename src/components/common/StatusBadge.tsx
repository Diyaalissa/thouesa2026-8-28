import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Plane,
  Package,
  ArrowRight,
  FileText,
  Lock,
  PauseCircle,
  Box,
} from 'lucide-react';
import { Locale, ShipmentStatus, TripStatus, UserRole, KYCStatus } from '../../types';
import {
  CUSTOMER_SHIPMENT_STATUS_LABELS,
  TRAVELER_TRIP_STATUS_LABELS,
} from '../../lib/constants';
import {
  normalizeShipmentStatus,
  normalizeTripStatus,
  normalizeManifestStatus,
} from '../../lib/statusNormalizer';

export type BadgeDomain =
  | 'SHIPMENT'
  | 'TRIP'
  | 'MANIFEST'
  | 'INCIDENT'
  | 'PRICING'
  | 'SETTLEMENT'
  | 'EXCHANGE_RATE'
  | 'RATE'
  | 'GENERIC'
  | string;

export interface StatusBadgeProps {
  status: ShipmentStatus | TripStatus | KYCStatus | UserRole | string;
  domain?: BadgeDomain;
  type?: string;
  locale?: 'ar' | 'en' | Locale;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  domain,
  type,
  locale = 'ar',
  size = 'md',
  className = '',
  showIcon = true,
}) => {
  const isAr = locale === 'ar';
  const effectiveDomain = domain || (type === 'trip' ? 'TRIP' : type === 'shipment' ? 'SHIPMENT' : undefined);

  // Normalize status if domain is explicit
  const canonicalStatus =
    effectiveDomain === 'SHIPMENT'
      ? normalizeShipmentStatus(String(status))
      : effectiveDomain === 'TRIP'
      ? normalizeTripStatus(String(status))
      : effectiveDomain === 'MANIFEST'
      ? normalizeManifestStatus(String(status))
      : String(status);

  let labelAr = canonicalStatus;
  let labelEn = canonicalStatus;
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon: React.ComponentType<{ className?: string }> = Clock;

  // 1. Check explicit domain routing first if specified
  if (effectiveDomain === 'MANIFEST') {
    switch (canonicalStatus) {
      case 'DRAFT':
        labelAr = 'مسودة مانيفست';
        labelEn = 'Draft';
        colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
        Icon = FileText;
        break;
      case 'READY':
        labelAr = 'جاهز للتسليم للمسافر';
        labelEn = 'Ready for Handover';
        colorClasses = 'bg-teal-50 text-teal-700 border-teal-200';
        Icon = ShieldCheck;
        break;
      case 'HANDED_OVER':
      case 'HANDED_TO_TRAVELER':
        labelAr = 'سُلّم للمسافر (في العهدة)';
        labelEn = 'Handed Over';
        colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        Icon = Plane;
        break;
      case 'IN_TRANSIT':
        labelAr = 'قيد النقل الجوي';
        labelEn = 'In Transit';
        colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
        Icon = Plane;
        break;
      case 'ARRIVED':
        labelAr = 'وصل فرع الوجهة';
        labelEn = 'Arrived at Destination';
        colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
        Icon = Package;
        break;
      case 'CLOSED':
        labelAr = 'مغلق ومطابق بالكامل';
        labelEn = 'Closed & Reconciled';
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        Icon = CheckCircle2;
        break;
      case 'DISCREPANCY':
      case 'DISCREPANCY_FLAGGED':
        labelAr = 'فروقات / تعليق أمني';
        labelEn = 'Discrepancy Flagged';
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        Icon = AlertTriangle;
        break;
      case 'CANCELLED':
        labelAr = 'ملغي';
        labelEn = 'Cancelled';
        colorClasses = 'bg-slate-100 text-slate-500 border-slate-300';
        Icon = XCircle;
        break;
      default:
        break;
    }
  } else if (effectiveDomain === 'INCIDENT') {
    switch (canonicalStatus) {
      case 'OPEN':
        labelAr = 'بلاغ مفتوح';
        labelEn = 'Open';
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        Icon = AlertTriangle;
        break;
      case 'UNDER_REVIEW':
        labelAr = 'قيد المراجعة والتحقيق';
        labelEn = 'Under Review';
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        Icon = Clock;
        break;
      case 'ACTION_REQUIRED':
        labelAr = 'يتطلب إجراء عاجل';
        labelEn = 'Action Required';
        colorClasses = 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse';
        Icon = AlertTriangle;
        break;
      case 'RESOLVED':
        labelAr = 'تم الحل والمعالجة';
        labelEn = 'Resolved';
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        Icon = CheckCircle2;
        break;
      case 'CLOSED':
        labelAr = 'مغلق ومؤرشف';
        labelEn = 'Closed';
        colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';
        Icon = ShieldCheck;
        break;
      case 'ESCALATED':
        labelAr = 'مرفوع للإدارة التشغيلية';
        labelEn = 'Escalated';
        colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
        Icon = ArrowRight;
        break;
      default:
        break;
    }
  } else if (effectiveDomain === 'PRICING') {
    switch (canonicalStatus) {
      case 'ACTIVE':
        labelAr = 'تعرفة نشطة';
        labelEn = 'Active Rate';
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        Icon = CheckCircle2;
        break;
      case 'SCHEDULED':
        labelAr = 'مجدولة';
        labelEn = 'Scheduled';
        colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
        Icon = Clock;
        break;
      case 'DRAFT':
        labelAr = 'مسودة';
        labelEn = 'Draft';
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        Icon = FileText;
        break;
      case 'EXPIRED':
        labelAr = 'منتهية الصلاحية';
        labelEn = 'Expired';
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        Icon = XCircle;
        break;
      case 'DISABLED':
      case 'INACTIVE':
        labelAr = 'معطلة';
        labelEn = 'Disabled';
        colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
        Icon = PauseCircle;
        break;
      case 'ARCHIVED':
        labelAr = 'مؤرشفة بسجل الأسعار';
        labelEn = 'Archived';
        colorClasses = 'bg-slate-100 text-slate-500 border-slate-200';
        Icon = FileText;
        break;
      default:
        break;
    }
  } else if (effectiveDomain === 'SETTLEMENT') {
    switch (canonicalStatus) {
      case 'PAID':
      case 'SETTLED':
        labelAr = 'مسدد / مكتمل';
        labelEn = 'Paid / Settled';
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        Icon = CheckCircle2;
        break;
      case 'PENDING_PAYMENT':
      case 'PENDING_PAYOUT':
      case 'PENDING':
        labelAr = 'قيد الانتظار';
        labelEn = 'Pending';
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        Icon = Clock;
        break;
      case 'DRAFT':
      case 'QUOTED':
        labelAr = 'مسودة تسوية';
        labelEn = 'Draft';
        colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
        Icon = FileText;
        break;
      case 'FAILED':
      case 'REVERSED':
      case 'CANCELLED':
        labelAr = 'ملغاة / معكوسة';
        labelEn = 'Failed / Reversed';
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        Icon = XCircle;
        break;
      default:
        break;
    }
  } else if (effectiveDomain === 'EXCHANGE_RATE' || effectiveDomain === 'RATE') {
    switch (canonicalStatus) {
      case 'ACTIVE':
        labelAr = 'نشط';
        labelEn = 'Active';
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        Icon = CheckCircle2;
        break;
      case 'SCHEDULED':
        labelAr = 'مجدول';
        labelEn = 'Scheduled';
        colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
        Icon = Clock;
        break;
      case 'EXPIRED':
        labelAr = 'منتهي';
        labelEn = 'Expired';
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        Icon = XCircle;
        break;
      case 'DISABLED':
        labelAr = 'معطل';
        labelEn = 'Disabled';
        colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
        Icon = PauseCircle;
        break;
      case 'DRAFT':
        labelAr = 'مسودة';
        labelEn = 'Draft';
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        Icon = FileText;
        break;
      default:
        break;
    }
  } else if (effectiveDomain === 'TRIP' || canonicalStatus in TRAVELER_TRIP_STATUS_LABELS) {
    if (canonicalStatus in TRAVELER_TRIP_STATUS_LABELS) {
      const cfg = TRAVELER_TRIP_STATUS_LABELS[canonicalStatus];
      labelAr = cfg.labelAr;
      labelEn = cfg.labelEn;
      colorClasses = cfg.badgeClass;
    } else {
      switch (canonicalStatus) {
        case 'PENDING_VERIFICATION':
        case 'PENDING':
        case 'SUBMITTED':
          labelAr = 'تنتظر التحقق';
          labelEn = 'Pending Verification';
          colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
          break;
        case 'VERIFIED':
        case 'CONFIRMED':
          labelAr = 'رحلة معتمدة وموثقة';
          labelEn = 'Verified Trip';
          colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          break;
        case 'PACKAGES_LINKED':
          labelAr = 'طرود مرتبطة بالرحلة';
          labelEn = 'Packages Linked';
          colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
          break;
        case 'DISPATCHED':
          labelAr = 'غادرت الفرع مع المسافر';
          labelEn = 'Dispatched with Traveler';
          colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
          break;
        case 'COMPLETED':
          labelAr = 'مكتملة';
          labelEn = 'Completed';
          colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
          break;
        case 'REJECTED':
          labelAr = 'مرفوضة';
          labelEn = 'Rejected';
          colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
          break;
        case 'CANCELLED':
          labelAr = 'ملغاة';
          labelEn = 'Cancelled';
          colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
          break;
        default:
          break;
      }
    }

    if (['COMPLETED'].includes(canonicalStatus)) {
      Icon = CheckCircle2;
    } else if (['DISPATCHED', 'IN_TRANSIT', 'IN_FLIGHT', 'ARRIVED'].includes(canonicalStatus)) {
      Icon = Plane;
    } else if (['PACKAGES_LINKED'].includes(canonicalStatus)) {
      Icon = Box;
    } else if (['VERIFIED', 'CONFIRMED', 'CHECKED_IN'].includes(canonicalStatus)) {
      Icon = ShieldCheck;
    } else if (['ESCROW_PAID', 'ESCROW_LOCKED'].includes(canonicalStatus)) {
      Icon = Lock;
    } else if (['DELAYED', 'EMERGENCY_UNASSIGNED', 'SUBMITTED', 'SCHEDULED', 'PENDING_VERIFICATION'].includes(canonicalStatus)) {
      Icon = Clock;
    } else if (['CANCELLED', 'REJECTED'].includes(canonicalStatus)) {
      Icon = XCircle;
    } else {
      Icon = Clock;
    }
  } else if (effectiveDomain === 'SHIPMENT' || canonicalStatus in CUSTOMER_SHIPMENT_STATUS_LABELS) {
    if (canonicalStatus in CUSTOMER_SHIPMENT_STATUS_LABELS) {
      const cfg = CUSTOMER_SHIPMENT_STATUS_LABELS[canonicalStatus];
      labelAr = cfg.labelAr;
      labelEn = cfg.labelEn;
      colorClasses = cfg.badgeClass;
    } else {
      switch (canonicalStatus) {
        case 'PENDING_HUB_DROPOFF':
        case 'PENDING_DROPOFF':
        case 'PENDING':
          labelAr = 'بانتظار الاستلام';
          labelEn = 'Pending Drop-off';
          colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
          break;
        case 'RECEIVED_AT_ORIGIN':
        case 'RECEIVED_AT_ORIGIN_HUB':
          labelAr = 'مستلم بانتظار الفحص';
          labelEn = 'Received (Pending Inspection)';
          colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
          break;
        case 'INSPECTED_SEALED':
        case 'INSPECTED_AND_SEALED':
          labelAr = 'مفحوص ومختوم أمنياً';
          labelEn = 'Inspected & Sealed';
          colorClasses = 'bg-teal-50 text-teal-700 border-teal-200';
          break;
        case 'WEIGHT_ADJUSTMENT_PENDING':
        case 'WEIGHT_DISCREPANCY_PENDING':
          labelAr = 'فرق وزن بانتظار موافقة';
          labelEn = 'Weight Difference Pending';
          colorClasses = 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse';
          break;
        case 'ASSIGNED_TO_TRIP':
        case 'ASSIGNED_TO_TRAVELER':
          labelAr = 'مرتبط بمانيفست رحلة';
          labelEn = 'Assigned to Manifest';
          colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
          break;
        case 'IN_TRANSIT':
        case 'IN_TRANSIT_AIR':
        case 'IN_FLIGHT':
          labelAr = 'قيد النقل الجوي';
          labelEn = 'In Transit';
          colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
          break;
        case 'RECEIVED_AT_DEST':
        case 'RECEIVED_AT_DEST_HUB':
          labelAr = 'وصل فرع الوجهة';
          labelEn = 'Arrived at Dest Hub';
          colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
          break;
        case 'READY_FOR_PICKUP':
        case 'READY_FOR_DELIVERY':
          labelAr = 'جاهز للتسليم النهائي';
          labelEn = 'Ready for Pickup';
          colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          break;
        case 'DELIVERED':
        case 'COMPLETED':
          labelAr = 'تم التسليم بالرمز السري';
          labelEn = 'Delivered (OTP Verified)';
          colorClasses = 'bg-slate-100 text-slate-800 border-slate-300';
          break;
        case 'REJECTED_PROHIBITED':
          labelAr = 'مرفوض - مواد محظورة';
          labelEn = 'Rejected (Prohibited)';
          colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
          break;
        case 'CUSTOMS_HELD':
          labelAr = 'معلق جمركياً';
          labelEn = 'Customs Hold';
          colorClasses = 'bg-red-50 text-red-700 border-red-200';
          break;
        default:
          break;
      }
    }

    if (['DELIVERED', 'COMPLETED'].includes(canonicalStatus)) {
      Icon = CheckCircle2;
    } else if (['IN_TRANSIT', 'IN_TRANSIT_AIR', 'IN_FLIGHT', 'ASSIGNED_TO_TRIP', 'ASSIGNED_TO_TRAVELER'].includes(canonicalStatus)) {
      Icon = Plane;
    } else if (['RECEIVED_AT_ORIGIN', 'RECEIVED_AT_ORIGIN_HUB', 'RECEIVED_AT_DEST', 'RECEIVED_AT_DEST_HUB'].includes(canonicalStatus)) {
      Icon = Box;
    } else if (['INSPECTED_SEALED', 'INSPECTED_AND_SEALED'].includes(canonicalStatus)) {
      Icon = ShieldCheck;
    } else if (['WEIGHT_ADJUSTMENT_PENDING', 'WEIGHT_DISCREPANCY_PENDING', 'CUSTOMS_HELD', 'DISPUTED'].includes(canonicalStatus)) {
      Icon = AlertTriangle;
    } else if (['CANCELLED', 'REJECTED_PROHIBITED'].includes(canonicalStatus)) {
      Icon = XCircle;
    } else {
      Icon = Clock;
    }
  } else {
    // Fallback standard cases (KYC, verification, generic)
    switch (canonicalStatus) {
      case 'VERIFIED':
        labelAr = 'موثق ومعتمد';
        labelEn = 'Verified';
        colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300';
        Icon = ShieldCheck;
        break;
      case 'UNVERIFIED':
        labelAr = 'غير موثق';
        labelEn = 'Unverified';
        colorClasses = 'bg-slate-100 text-slate-600 border-slate-300';
        Icon = AlertTriangle;
        break;
      case 'PAID':
      case 'SETTLED':
        labelAr = 'مسدد';
        labelEn = 'Paid';
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        Icon = CheckCircle2;
        break;
      case 'PENDING':
        labelAr = 'قيد الانتظار';
        labelEn = 'Pending';
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        Icon = Clock;
        break;
      default:
        labelAr = canonicalStatus;
        labelEn = canonicalStatus;
    }
  }

  const sizeClasses =
    size === 'sm'
      ? 'text-[11px] px-2 py-0.5 gap-1'
      : size === 'lg'
      ? 'text-sm px-3.5 py-1.5 gap-2 font-medium'
      : 'text-xs px-2.5 py-1 gap-1.5 font-medium';

  const label = isAr ? labelAr : labelEn;

  return (
    <span
      className={`inline-flex items-center rounded-full border ${sizeClasses} ${colorClasses} tracking-tight whitespace-nowrap transition-colors ${className}`}
    >
      {showIcon && (
        <Icon className={size === 'sm' ? 'w-3 h-3 shrink-0' : size === 'lg' ? 'w-4 h-4 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />
      )}
      <span>{label}</span>
    </span>
  );
};
