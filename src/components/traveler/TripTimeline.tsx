import React from 'react';
import { Trip, TripStatus, Locale } from '../../types';
import { CheckCircle2, Clock, Circle } from 'lucide-react';

interface TripTimelineProps {
  trip: Trip;
  locale: Locale;
}

export const TripTimeline: React.FC<TripTimelineProps> = ({ trip, locale }) => {
  const isAr = locale === 'ar';
  
  const timelineSteps = [
    { 
      id: 'SCHEDULED', 
      label: isAr ? 'جدولة واعتماد التذكرة' : 'Scheduled & Verified',
      isCompleted: true // always completed if trip exists
    },
    { 
      id: 'CHECKED_IN', 
      label: isAr ? 'تأكيد السفر (Check-in)' : 'Pre-flight Check-in',
      isCompleted: ['CHECKED_IN', 'PACKAGES_LINKED', 'ESCROW_LOCKED', 'IN_TRANSIT', 'COMPLETED'].includes(trip.status)
    },
    { 
      id: 'PACKAGES_LINKED', 
      label: isAr ? 'ربط الطرود الجاهزة' : 'Packages Linked',
      isCompleted: ['PACKAGES_LINKED', 'ESCROW_LOCKED', 'IN_TRANSIT', 'COMPLETED'].includes(trip.status)
    },
    { 
      id: 'ESCROW_LOCKED', 
      label: isAr ? 'دفع الضمان واستلام الطرود' : 'Escrow Paid & Pickup',
      isCompleted: ['ESCROW_LOCKED', 'IN_TRANSIT', 'COMPLETED'].includes(trip.status)
    },
    { 
      id: 'IN_TRANSIT', 
      label: isAr ? 'التوجه لمكتب الوصول' : 'Transit to Destination',
      isCompleted: ['IN_TRANSIT', 'COMPLETED'].includes(trip.status)
    },
    { 
      id: 'COMPLETED', 
      label: isAr ? 'تسليم وإخلاء طرف' : 'Drop-off & Payout',
      isCompleted: trip.status === 'COMPLETED'
    }
  ];

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900 mb-4">{isAr ? 'مسار الرحلة التشغيلي' : 'Trip Timeline'}</h3>
      <div className="space-y-4">
        {timelineSteps.map((step, idx) => {
          const isLast = idx === timelineSteps.length - 1;
          const isActive = !step.isCompleted && (idx === 0 || timelineSteps[idx - 1].isCompleted);
          
          return (
            <div key={step.id} className="relative flex gap-4">
              {!isLast && (
                <div className={`absolute top-6 bottom-0 w-0.5 ${step.isCompleted ? 'bg-teal-500' : 'bg-slate-200'} rtl:right-[11px] ltr:left-[11px]`} />
              )}
              
              <div className="relative z-10 shrink-0 mt-0.5">
                {step.isCompleted ? (
                  <CheckCircle2 className="w-6 h-6 text-teal-500 fill-teal-50" />
                ) : isActive ? (
                  <div className="w-6 h-6 rounded-full border-2 border-brand-500 flex items-center justify-center bg-white shadow-[0_0_0_4px_rgba(59,130,246,0.1)]">
                    <div className="w-2 h-2 rounded-full bg-brand-500" />
                  </div>
                ) : (
                  <Circle className="w-6 h-6 text-slate-300" />
                )}
              </div>
              
              <div className="pb-4">
                <span className={`text-xs font-bold ${step.isCompleted ? 'text-teal-700' : isActive ? 'text-brand-700' : 'text-slate-400'}`}>
                  {step.label}
                </span>
                {isActive && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    {isAr ? 'الخطوة الحالية المطلوبة' : 'Current required step'}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
