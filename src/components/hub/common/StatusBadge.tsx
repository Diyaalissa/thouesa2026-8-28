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
  PauseCircle
} from 'lucide-react';
import { Locale } from '../../../types';
import {
  normalizeShipmentStatus,
  normalizeTripStatus,
  normalizeManifestStatus,
} from '../../../lib/statusNormalizer';

export type BadgeDomain = 'SHIPMENT' | 'TRIP' | 'MANIFEST' | 'INCIDENT' | 'PRICING';

export interface StatusBadgeProps {
  domain: BadgeDomain;
  status: string;
  locale?: Locale;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  domain,
  status,
  locale = 'ar',
  size = 'md',
  className = '',
  showIcon = true,
}) => {
  const isAr = locale === 'ar';

  const canonicalStatus =
    domain === 'SHIPMENT'
      ? normalizeShipmentStatus(status)
      : domain === 'TRIP'
      ? normalizeTripStatus(status)
      : domain === 'MANIFEST'
      ? normalizeManifestStatus(status)
      : status;

  let labelAr = canonicalStatus;
  let labelEn = canonicalStatus;
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = Clock;

  if (domain === 'SHIPMENT') {
    switch (canonicalStatus) {
      case 'PENDING_HUB_DROPOFF':
      case 'PENDING_DROPOFF':
      case 'PENDING':
        labelAr = 'بانتظار الاستلام';
        labelEn = 'Pending Drop-off';
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        Icon = Clock;
        break;
      case 'RECEIVED_AT_ORIGIN':
      case 'RECEIVED_AT_ORIGIN_HUB':
        labelAr = 'مستلم بانتظار الفحص';
        labelEn = 'Received (Pending Inspection)';
        colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
        Icon = Package;
        break;
      case 'INSPECTED_SEALED':
      case 'INSPECTED_AND_SEALED':
        labelAr = 'مفحوص ومختوم أمنياً';
        labelEn = 'Inspected & Sealed';
        colorClasses = 'bg-teal-50 text-teal-700 border-teal-200';
        Icon = ShieldCheck;
        break;
      case 'WEIGHT_ADJUSTMENT_PENDING':
      case 'WEIGHT_DISCREPANCY_PENDING':
        labelAr = 'فرق وزن بانتظار موافقة';
        labelEn = 'Weight Difference Pending';
        colorClasses = 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse';
        Icon = AlertTriangle;
        break;
      case 'ASSIGNED_TO_TRIP':
      case 'ASSIGNED_TO_TRAVELER':
        labelAr = 'مرتبط بمانيفست رحلة';
        labelEn = 'Assigned to Manifest';
        colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        Icon = Plane;
        break;
      case 'IN_TRANSIT':
      case 'IN_TRANSIT_AIR':
      case 'IN_FLIGHT':
        labelAr = 'قيد النقل الجوي';
        labelEn = 'In Transit';
        colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
        Icon = Plane;
        break;
      case 'RECEIVED_AT_DEST':
      case 'RECEIVED_AT_DEST_HUB':
        labelAr = 'وصل فرع الوجهة';
        labelEn = 'Arrived at Dest Hub';
        colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
        Icon = Package;
        break;
      case 'READY_FOR_PICKUP':
      case 'READY_FOR_DELIVERY':
        labelAr = 'جاهز للتسليم النهائي';
        labelEn = 'Ready for Pickup';
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        Icon = CheckCircle2;
        break;
      case 'DELIVERED':
      case 'COMPLETED':
        labelAr = 'تم التسليم بالرمز السري';
        labelEn = 'Delivered (OTP Verified)';
        colorClasses = 'bg-slate-100 text-slate-800 border-slate-300';
        Icon = CheckCircle2;
        break;
      case 'REJECTED_PROHIBITED':
        labelAr = 'مرفوض - مواد محظورة';
        labelEn = 'Rejected (Prohibited)';
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        Icon = XCircle;
        break;
      case 'CUSTOMS_HELD':
        labelAr = 'معلق جمركياً';
        labelEn = 'Customs Hold';
        colorClasses = 'bg-red-50 text-red-700 border-red-200';
        Icon = Lock;
        break;
      default:
        break;
    }
  } else if (domain === 'TRIP') {
    switch (status) {
      case 'PENDING_VERIFICATION':
      case 'PENDING':
        labelAr = 'تنتظر التحقق';
        labelEn = 'Pending Verification';
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        Icon = Clock;
        break;
      case 'VERIFIED':
      case 'CONFIRMED':
        labelAr = 'رحلة معتمدة وموثقة';
        labelEn = 'Verified Trip';
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        Icon = ShieldCheck;
        break;
      case 'NEEDS_UPDATE':
      case 'NEEDS_DOCUMENTS':
        labelAr = 'تتطلب وثائق إضافية';
        labelEn = 'Needs Update';
        colorClasses = 'bg-orange-50 text-orange-700 border-orange-200';
        Icon = AlertTriangle;
        break;
      case 'REJECTED':
        labelAr = 'مرفوضة';
        labelEn = 'Rejected';
        colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
        Icon = XCircle;
        break;
      case 'COMPLETED':
        labelAr = 'مكتملة';
        labelEn = 'Completed';
        colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
        Icon = CheckCircle2;
        break;
      default:
        break;
    }
  } else if (domain === 'MANIFEST') {
    switch (status) {
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
      default:
        break;
    }
  } else if (domain === 'INCIDENT') {
    switch (status) {
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
      case 'ESCALATED':
        labelAr = 'مرفوع للإدارة التشغيلية';
        labelEn = 'Escalated';
        colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
        Icon = ArrowRight;
        break;
      default:
        break;
    }
  } else if (domain === 'PRICING') {
    switch (status) {
      case 'ACTIVE':
        labelAr = 'تعرفة نشطة';
        labelEn = 'Active Rate';
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        Icon = CheckCircle2;
        break;
      case 'INACTIVE':
        labelAr = 'معطلة';
        labelEn = 'Inactive';
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
  }

  const sizeClasses = 
    size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1' :
    size === 'lg' ? 'text-sm px-3.5 py-1.5 gap-2' :
    'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-lg border shadow-2xs whitespace-nowrap ${colorClasses} ${sizeClasses} ${className}`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{isAr ? labelAr : labelEn}</span>
    </span>
  );
};
