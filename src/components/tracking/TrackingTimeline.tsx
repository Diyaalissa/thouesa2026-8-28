import React from 'react';
import { 
  Building2, 
  Plane, 
  ShieldCheck, 
  Truck, 
  CheckCircle2, 
  FileSearch,
  Lock,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Shipment, Locale } from '../../types';
import { HUBS_DATA } from '../../lib/constants';

interface TrackingTimelineProps {
  shipment: Shipment;
  locale: Locale;
  onOpenWaybill?: (shipment: Shipment) => void;
  onOpenCustomsReceipt?: () => void;
}

interface StepItem {
  key: string;
  stepNumber: number;
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
  onOpenCustomsReceipt 
}) => {
  const isAr = locale === 'ar';
  
  const originHub = HUBS_DATA.find((h) => h.id === shipment.originHubId) || HUBS_DATA[0];
  const destHub = HUBS_DATA.find((h) => h.id === shipment.destinationHubId) || HUBS_DATA[1];

  // The Exact 6 Core Steps Defined in User Specification:
  // 1. قيد المراجعة / بانتظار التأكيد
  // 2. تم الاستلام في المكتب
  // 3. جاري الشحن الجوي
  // 4. التخليص الجمركي / قيد الفرز
  // 5. جاهز للتسليم / قيد التوصيل
  // 6. تم التسليم
  const steps: StepItem[] = [
    {
      key: 'REVIEW',
      stepNumber: 1,
      statusMatch: ['DRAFT', 'PENDING', 'PENDING_REVIEW', 'PENDING_HUB_DROPOFF', 'PENDING_DROPOFF'],
      titleAr: 'قيد المراجعة / بانتظار التأكيد',
      titleEn: 'Under Review / Pending Confirmation',
      descAr: 'تم استلام الطلب وهو قيد المراجعة الإدارية وتأكيد الدفع أو إيداع العربون المالي.',
      descEn: 'Order submitted and is under administrative review and payment/deposit confirmation.',
      icon: FileSearch,
    },
    {
      key: 'RECEIVED',
      stepNumber: 2,
      statusMatch: ['RECEIVED_AT_ORIGIN', 'INSPECTED_SEALED', 'INSPECTED_AND_SEALED', 'WEIGHT_ADJUSTMENT_PENDING', 'WEIGHT_DISCREPANCY_PENDING'],
      titleAr: 'تم الاستلام في المكتب',
      titleEn: 'Received at Origin Hub',
      descAr: `تم استلام الطرد أو المنتج في مستودع (${originHub?.nameAr || 'المكتب الرئيسي'})، وفحصه وتأمينه بقفل إلكتروني.`,
      descEn: `Parcel/item physically received at (${originHub?.nameEn || 'Main Hub'}), inspected and securely sealed.`,
      icon: Building2,
    },
    {
      key: 'AIR_FREIGHT',
      stepNumber: 3,
      statusMatch: ['ASSIGNED_TO_TRIP', 'IN_TRANSIT'],
      titleAr: 'جاري الشحن الجوي',
      titleEn: 'Air Freight in Progress',
      descAr: `الطرد الآن في رحلة الشحن الجوي باتجاه (${destHub?.cityAr || 'بلد الوجهة'}) مع المسافر المعتمد.`,
      descEn: `Parcel is in air transit towards (${destHub?.cityEn || 'Destination Hub'}) with verified traveler.`,
      icon: Plane,
    },
    {
      key: 'CUSTOMS',
      stepNumber: 4,
      statusMatch: ['CUSTOMS_CLEARANCE', 'CUSTOMS_HELD', 'RECEIVED_AT_DEST'],
      titleAr: 'التخليص الجمركي / قيد الفرز',
      titleEn: 'Customs Clearance & Sorting',
      descAr: `وصلت الشحنة إلى مطار الوجهة وتخضع حالياً للفرز الجمركي والتدقيق الرسمي.`,
      descEn: `Shipment arrived at destination airport and is undergoing customs clearance & sorting.`,
      icon: ShieldCheck,
    },
    {
      key: 'READY',
      stepNumber: 5,
      statusMatch: ['READY_FOR_PICKUP', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY'],
      titleAr: 'جاهز للتسليم / قيد التوصيل',
      titleEn: 'Ready for Pickup / Out for Delivery',
      descAr: 'الشحنة جاهزة للاستلام من المكتب أو في طريقها مع مندوب التوصيل النهائي.',
      descEn: 'Parcel is ready for pickup at the destination hub or out with local courier.',
      icon: Truck,
    },
    {
      key: 'DELIVERED',
      stepNumber: 6,
      statusMatch: ['DELIVERED'],
      titleAr: 'تم التسليم',
      titleEn: 'Delivered & Closed',
      descAr: 'تم تسليم الشحنة بنجاح للمستلم بعد استيفاء التأكيد وإغلاق ملف الطلب.',
      descEn: 'Shipment safely handed over to recipient and order successfully completed.',
      icon: CheckCircle2,
    },
  ];

  // Determine current active step index
  let currentStepIdx = steps.findIndex((s) => s.statusMatch.includes(shipment.currentStatus));
  if (currentStepIdx === -1) {
    if (shipment.currentStatus === 'CANCELLED' || shipment.currentStatus === 'REJECTED_PROHIBITED') {
      currentStepIdx = 0;
    } else {
      currentStepIdx = 0;
    }
  }

  // Format intelligent step timestamps
  const getStepTimestamp = (idx: number) => {
    const createdDate = new Date(shipment.createdAt || Date.now());
    if (idx === 0) {
      return createdDate.toLocaleTimeString(isAr ? 'ar-JO' : 'en-US', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
    }
    if (idx <= currentStepIdx) {
      const stepDate = new Date(createdDate.getTime() + idx * 10 * 3600000);
      return stepDate.toLocaleTimeString(isAr ? 'ar-JO' : 'en-US', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Stepper Header */}
      <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 font-black text-xs">
            {currentStepIdx + 1}/6
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              {isAr ? 'مسار التتبع والخط الزمني' : 'Shipment Tracking Path'}
            </h4>
            <p className="text-[11px] text-slate-400">
              {isAr 
                ? `المرحلة الحالية: ${steps[currentStepIdx]?.titleAr}`
                : `Current Step: ${steps[currentStepIdx]?.titleEn}`
              }
            </p>
          </div>
        </div>

        {shipment.securitySealId && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-mono font-bold border border-emerald-500/20">
            <Lock className="w-3 h-3 text-emerald-400" />
            {shipment.securitySealId}
          </span>
        )}
      </div>

      {/* Visual Timeline Stepper (Vertical Always) */}
      <div className="relative">
        {/* Background Grey Track Line */}
        <div className="absolute top-6 bottom-6 start-5 w-0.5 bg-slate-800 -translate-x-1/2 rtl:translate-x-1/2" />
        
        {/* Active Colored Progress Line */}
        <div 
          className="absolute top-6 start-5 w-0.5 bg-gradient-to-b from-brand-500 via-emerald-500 to-emerald-400 -translate-x-1/2 rtl:translate-x-1/2 transition-all duration-500"
          style={{ 
            height: `${(currentStepIdx / (steps.length - 1)) * 100}%`,
            maxHeight: 'calc(100% - 32px)' 
          }}
        />

        <div className="space-y-6 relative">
          {steps.map((step, idx) => {
            const isPassed = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            const isUpcoming = idx > currentStepIdx;
            const Icon = step.icon;
            const timestamp = getStepTimestamp(idx);
            
            return (
              <div key={step.key} className="flex items-start gap-4 relative z-10 group">
                {/* Node Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 shadow-md ${
                    isCurrent
                      ? 'bg-brand-500 text-white ring-4 ring-brand-500/20 shadow-lg shadow-brand-500/30 scale-105 animate-pulse'
                      : isPassed
                      ? 'bg-emerald-500 text-white shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                      : 'bg-slate-800 text-slate-500 border border-slate-700/80'
                  }`}
                >
                  {isPassed ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <Icon className={`w-4 h-4 ${isCurrent ? 'text-white' : ''}`} />
                  )}
                </div>
                
                {/* Content Block */}
                <div className={`flex-1 pt-1 p-3 rounded-2xl transition-all ${
                  isCurrent 
                    ? 'bg-brand-950/20 border border-brand-500/30 shadow-sm' 
                    : isPassed 
                    ? 'bg-slate-900/40 border border-slate-800/60' 
                    : 'bg-transparent'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs sm:text-sm font-bold ${
                          isCurrent
                            ? 'text-brand-400 font-black'
                            : isPassed
                            ? 'text-white'
                            : 'text-slate-500'
                        }`}
                      >
                        {isAr ? step.titleAr : step.titleEn}
                      </span>

                      {/* Step Tag */}
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-300 text-[10px] font-black border border-brand-500/30">
                          {isAr ? 'الحالة الحالية' : 'Current'}
                        </span>
                      )}
                      {isPassed && (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[9px] font-bold">
                          ✓ {isAr ? 'مكتمل' : 'Done'}
                        </span>
                      )}
                    </div>

                    {/* Step Timestamp */}
                    {timestamp && (
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {timestamp}
                      </span>
                    )}
                  </div>

                  <p className={`text-[11px] sm:text-xs mt-1.5 leading-relaxed ${
                    isCurrent ? 'text-slate-200' : isPassed ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {isAr ? step.descAr : step.descEn}
                  </p>

                  {/* Contextual Badges per Step */}
                  {isCurrent && step.key === 'AIR_FREIGHT' && (
                    <div className="mt-2.5 flex items-center gap-2 text-[11px] font-bold text-sky-400 bg-sky-950/40 p-2 rounded-xl border border-sky-900/40">
                      <Plane className="w-3.5 h-3.5" />
                      <span>{shipment.airline || 'Royal Jordanian'} • {shipment.flightNumber || 'RJ511'}</span>
                    </div>
                  )}

                  {isCurrent && step.key === 'CUSTOMS' && onOpenCustomsReceipt && (
                    <div className="mt-2.5 flex items-center justify-between text-[11px] font-bold text-amber-300 bg-amber-950/40 p-2.5 rounded-xl border border-amber-900/40">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>{isAr ? 'تم استخراج وتوثيق الوصل الجمركي' : 'Official customs receipt attached'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={onOpenCustomsReceipt}
                        className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {isAr ? 'عرض الوصل' : 'View Receipt'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
