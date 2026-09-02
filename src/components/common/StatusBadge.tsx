import React from 'react';
import { ShipmentStatus, TripStatus, UserRole, KYCStatus } from '../../types';
import { ShieldCheck, Clock, CheckCircle2, AlertTriangle, XCircle, Plane, Box, Lock, UserCheck } from 'lucide-react';
import { CUSTOMER_SHIPMENT_STATUS_LABELS, TRAVELER_TRIP_STATUS_LABELS } from '../../lib/constants';

interface StatusBadgeProps {
  status: ShipmentStatus | TripStatus | KYCStatus | UserRole | string;
  locale?: 'ar' | 'en';
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, locale = 'ar', size = 'md' }) => {
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status;
  let Icon = Clock;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  }[size];

  // 1. Check if it's a known trip status in TRAVELER_TRIP_STATUS_LABELS
  if (status in TRAVELER_TRIP_STATUS_LABELS) {
    const cfg = TRAVELER_TRIP_STATUS_LABELS[status];
    label = locale === 'ar' ? cfg.labelAr : cfg.labelEn;
    colorClasses = cfg.badgeClass;

    if (['COMPLETED'].includes(status)) {
      Icon = CheckCircle2;
    } else if (['DISPATCHED', 'IN_TRANSIT', 'IN_FLIGHT', 'ARRIVED'].includes(status)) {
      Icon = Plane;
    } else if (['PACKAGES_LINKED'].includes(status)) {
      Icon = Box;
    } else if (['VERIFIED', 'CONFIRMED', 'CHECKED_IN'].includes(status)) {
      Icon = ShieldCheck;
    } else if (['ESCROW_PAID', 'ESCROW_LOCKED'].includes(status)) {
      Icon = Lock;
    } else if (['DELAYED', 'EMERGENCY_UNASSIGNED', 'SUBMITTED', 'SCHEDULED'].includes(status)) {
      Icon = Clock;
    } else if (['CANCELLED', 'REJECTED'].includes(status)) {
      Icon = XCircle;
    } else {
      Icon = Clock;
    }

    return (
      <span
        className={`inline-flex items-center rounded-full border ${sizeClasses} ${colorClasses} tracking-tight whitespace-nowrap transition-colors`}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{label}</span>
      </span>
    );
  }

  // 2. Check if it's a known shipment status in CUSTOMER_SHIPMENT_STATUS_LABELS
  if (status in CUSTOMER_SHIPMENT_STATUS_LABELS) {
    const cfg = CUSTOMER_SHIPMENT_STATUS_LABELS[status];
    label = locale === 'ar' ? cfg.labelAr : cfg.labelEn;
    colorClasses = cfg.badgeClass;

    if (['DELIVERED', 'COMPLETED'].includes(status)) {
      Icon = CheckCircle2;
    } else if (['IN_TRANSIT', 'IN_TRANSIT_AIR', 'IN_FLIGHT', 'ASSIGNED_TO_TRIP', 'ASSIGNED_TO_TRAVELER'].includes(status)) {
      Icon = Plane;
    } else if (['RECEIVED_AT_ORIGIN', 'RECEIVED_AT_ORIGIN_HUB', 'RECEIVED_AT_DEST', 'RECEIVED_AT_DEST_HUB'].includes(status)) {
      Icon = Box;
    } else if (['INSPECTED_SEALED', 'INSPECTED_AND_SEALED'].includes(status)) {
      Icon = ShieldCheck;
    } else if (['WEIGHT_ADJUSTMENT_PENDING', 'WEIGHT_DISCREPANCY_PENDING', 'CUSTOMS_HELD', 'DISPUTED'].includes(status)) {
      Icon = AlertTriangle;
    } else if (['CANCELLED', 'REJECTED_PROHIBITED'].includes(status)) {
      Icon = XCircle;
    } else {
      Icon = Clock;
    }

    return (
      <span
        className={`inline-flex items-center rounded-full border ${sizeClasses} ${colorClasses} tracking-tight whitespace-nowrap transition-colors`}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{label}</span>
      </span>
    );
  }

  switch (status) {
    case 'VERIFIED':
      label = locale === 'ar' ? 'موثق ومعتمد' : 'Verified';
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      Icon = ShieldCheck;
      break;
    case 'UNVERIFIED':
      label = locale === 'ar' ? 'غير موثق' : 'Unverified';
      colorClasses = 'bg-slate-100 text-slate-600 border-slate-300';
      Icon = AlertTriangle;
      break;
    default:
      label = String(status);
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border ${sizeClasses} ${colorClasses} tracking-tight whitespace-nowrap transition-colors`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </span>
  );
};
