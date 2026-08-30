import re

content = """import React, { useState } from 'react';
import { 
  Package, 
  Building2, 
  Plane, 
  ShieldCheck, 
  Truck, 
  CheckCircle2, 
  FileText,
  Lock,
  ChevronDown,
  ChevronUp,
  Printer,
  QrCode,
  FileSearch,
  Search,
  Box
} from 'lucide-react';
import { Shipment, Hub, Locale } from '../../types';
import { HUBS_DATA } from '../../lib/constants';
import { formatCurrency } from '../../lib/crypto';

interface TrackingTimelineProps {
  shipment: Shipment;
  locale: Locale;
  onOpenWaybill?: (shipment: Shipment) => void;
  onOpenQR?: (shipment: Shipment) => void;
}

interface StepItem {
  key: string;
  statusMatch: string[];
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  icon: React.ElementType;
}

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({ 
  shipment, 
  locale, 
  onOpenWaybill,
  onOpenQR 
}) => {
  const isAr = locale === 'ar';
  const [isExpanded, setIsExpanded] = useState(true);
  
  const originHub = HUBS_DATA.find((h) => h.id === shipment.originHubId) || HUBS_DATA[0];
  const destHub = HUBS_DATA.find((h) => h.id === shipment.destinationHubId) || HUBS_DATA[1];

  // The Exact 6 Steps Requested
  const steps: StepItem[] = [
    {
      key: 'REVIEW',
      statusMatch: ['PENDING_HUB_DROPOFF', 'PENDING_DROPOFF', 'DRAFT', 'PENDING_REVIEW'],
      titleAr: 'قيد المراجعة / بانتظار التأكيد',
      titleEn: 'Under Review / Pending Confirmation',
      descAr: 'تم استلام الطلب وهو قيد المراجعة الإدارية وتأكيد الدفع أو العربون.',
      descEn: 'Order received and is under administrative review and payment confirmation.',
      icon: FileSearch,
    },
    {
      key: 'RECEIVED',
      statusMatch: ['RECEIVED_AT_ORIGIN', 'INSPECTED_SEALED', 'INSPECTED_AND_SEALED', 'WEIGHT_ADJUSTMENT_PENDING'],
      titleAr: 'تم الاستلام في المكتب',
      titleEn: 'Received at Hub',
      descAr: 'تم استلام الطرد أو المنتج فعلياً في مستودعات المنصة وفحصه أمنياً.',
      descEn: 'Parcel or product physically received at our warehouse and security inspected.',
      icon: Building2,
    },
    {
      key: 'AIR_FREIGHT',
      statusMatch: ['ASSIGNED_TO_TRIP', 'IN_TRANSIT'],
      titleAr: 'جاري الشحن الجوي',
      titleEn: 'Air Freight in Progress',
      descAr: 'الطرد الآن في طريقه للوجهة عبر رحلة الطيران المجدولة مع المسافر.',
      descEn: 'Parcel is en route to the destination via scheduled flight with traveler.',
      icon: Plane,
    },
    {
      key: 'CUSTOMS',
      statusMatch: ['CUSTOMS_CLEARANCE', 'CUSTOMS_HELD'],
      titleAr: 'التخليص الجمركي / قيد الفرز',
      titleEn: 'Customs Clearance / Sorting',
      descAr: 'وصل الطرد لبلد الوجهة ويخضع حالياً لإجراءات الفرز والتخليص الجمركي.',
      descEn: 'Parcel arrived at destination and is undergoing sorting and customs clearance.',
      icon: ShieldCheck,
    },
    {
      key: 'READY',
      statusMatch: ['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY'],
      titleAr: 'جاهز للتسليم / قيد التوصيل',
      titleEn: 'Ready for Pickup / Out for Delivery',
      descAr: 'الطرد جاهز للاستلام من المكتب أو في طريقه إليك مع المندوب المحلي.',
      descEn: 'Parcel is ready for pickup or out for delivery with local courier.',
      icon: Truck,
    },
    {
      key: 'DELIVERED',
      statusMatch: ['DELIVERED'],
      titleAr: 'تم التسليم',
      titleEn: 'Delivered',
      descAr: 'تم تسليم الطرد بنجاح للمستلم النهائي.',
      descEn: 'Parcel successfully delivered to the final recipient.',
      icon: CheckCircle2,
    },
  ];

  const currentStepIdx = steps.findIndex((s) => s.statusMatch.includes(shipment.currentStatus)) !== -1 
    ? steps.findIndex((s) => s.statusMatch.includes(shipment.currentStatus))
    : 0; // fallback to 0 if status not found

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
      {/* Visual Timeline Stepper (Vertical Always) */}
      <div className="p-5 sm:p-6">
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute top-5 bottom-5 start-5 w-1 bg-slate-800 rounded-full" />
          <div 
            className="absolute top-5 start-5 w-1 bg-gradient-to-b from-brand-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ 
              height: `${(currentStepIdx / (steps.length - 1)) * 100}%`,
              maxHeight: 'calc(100% - 20px)' 
            }}
          />

          <div className="space-y-6 relative">
            {steps.map((step, idx) => {
              const isPassed = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const Icon = step.icon;
              
              return (
                <div key={step.key} className="flex items-start gap-4 relative z-10">
                  {/* Node Circle */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 transition-all duration-300 shadow-xl ${
                      isCurrent
                        ? 'bg-brand-500 text-white ring-4 ring-brand-500/20 scale-110'
                        : isPassed
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/20'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {isPassed && !isCurrent ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  
                  {/* Content Block */}
                  <div className="flex-1 pt-1">
                    <div
                      className={`text-sm font-bold ${
                        isCurrent
                          ? 'text-brand-400'
                          : isPassed
                          ? 'text-white'
                          : 'text-slate-500'
                      }`}
                    >
                      {isAr ? step.titleAr : step.titleEn}
                    </div>
                    <p className={`text-[11px] sm:text-xs mt-1 leading-relaxed ${isCurrent || isPassed ? 'text-slate-300' : 'text-slate-500'}`}>
                      {isAr ? step.descAr : step.descEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
"""

with open('src/components/tracking/TrackingTimeline.tsx', 'w') as f:
    f.write(content)

print("TrackingTimeline updated.")
