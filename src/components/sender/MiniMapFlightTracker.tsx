import React from 'react';
import { motion } from 'motion/react';
import { Plane, MapPin, CheckCircle2, Clock, ShieldAlert, ArrowRight, ArrowLeft } from 'lucide-react';
import { Shipment, ShipmentStatus } from '../../types';

interface MiniMapFlightTrackerProps {
  shipment: Shipment;
  isAr: boolean;
  onViewDetails?: () => void;
}

// Calculate progress percentage and stage details based on shipment status
function getShipmentFlightStage(status?: string): {
  progress: number;
  labelAr: string;
  labelEn: string;
  badgeColor: string;
  isFlying: boolean;
} {
  switch (status) {
    case 'ORDER_CREATED':
    case 'PENDING_APPROVAL':
    case 'PENDING_HUB_DROPOFF':
      return {
        progress: 0.12,
        labelAr: 'بانتظار التسليم للفرع',
        labelEn: 'Awaiting Hub Dropoff',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        isFlying: false,
      };
    case 'RECEIVED_AT_ORIGIN_HUB':
    case 'HUB_INSPECTION_PASSED':
    case 'PACKAGED_AND_LABELED':
      return {
        progress: 0.28,
        labelAr: 'تم الفحص والتجهيز للشحن',
        labelEn: 'Inspected & Packaged',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        isFlying: false,
      };
    case 'ASSIGNED_TO_TRAVELER':
    case 'MANIFESTED_FOR_FLIGHT':
      return {
        progress: 0.45,
        labelAr: 'تم التجهيز مع المسافر المعتمد',
        labelEn: 'Handed to Verified Traveler',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        isFlying: false,
      };
    case 'IN_TRANSIT_AIR':
    case 'IN_TRANSIT':
      return {
        progress: 0.62,
        labelAr: 'في الأجواء ✈️ الشحنة في طريقها',
        labelEn: 'In Flight ✈️ En Route',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse',
        isFlying: true,
      };
    case 'CUSTOMS_CLEARANCE':
    case 'CUSTOMS_HOLD':
      return {
        progress: 0.78,
        labelAr: 'التخليص الجمركي بمطار الوصول',
        labelEn: 'Destination Customs Clearance',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        isFlying: false,
      };
    case 'RECEIVED_AT_DEST_HUB':
    case 'READY_FOR_PICKUP':
    case 'OUT_FOR_DELIVERY':
      return {
        progress: 0.90,
        labelAr: 'جاهز للاستلام / قيد التوصيل',
        labelEn: 'Ready for Pickup / Out for Delivery',
        badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
        isFlying: false,
      };
    case 'DELIVERED':
    case 'ESCROW_RELEASED':
      return {
        progress: 1.0,
        labelAr: 'تم التسليم بنجاح',
        labelEn: 'Successfully Delivered',
        badgeColor: 'bg-green-100 text-green-800 border-green-200',
        isFlying: false,
      };
    default:
      return {
        progress: 0.50,
        labelAr: 'قيد المتابعة اللوجستية',
        labelEn: 'In Logistics Transit',
        badgeColor: 'bg-brand-100 text-brand-800 border-brand-200',
        isFlying: true,
      };
  }
}

export const MiniMapFlightTracker: React.FC<MiniMapFlightTrackerProps> = ({
  shipment,
  isAr,
  onViewDetails,
}) => {
  const stage = getShipmentFlightStage(shipment?.currentStatus);
  const isRtl = isAr;

  // Extract origin and destination airport / hub codes
  const destHubId = shipment.destinationHubId || (shipment as any).destHubId || 'hub-alg';
  const originCode = shipment.originHubId?.includes('amm') ? 'AMM' : shipment.originHubId?.includes('alg') ? 'ALG' : 'AMM';
  const destCode = destHubId.includes('alg') ? 'ALG' : destHubId.includes('orn') ? 'ORN' : destHubId.includes('amm') ? 'AMM' : 'ALG';
  
  const originCity = originCode === 'AMM' ? (isAr ? 'عمّان، الأردن 🇯🇴' : 'Amman, Jordan 🇯🇴') : (isAr ? 'الجزائر العاصمة 🇩🇿' : 'Algiers, Algeria 🇩🇿');
  const destCity = destCode === 'ALG' ? (isAr ? 'الجزائر العاصمة 🇩🇿' : 'Algiers, Algeria 🇩🇿') : destCode === 'ORN' ? (isAr ? 'وهران، الجزائر 🇩🇿' : 'Oran, Algeria 🇩🇿') : (isAr ? 'عمّان، الأردن 🇯🇴' : 'Amman, Jordan 🇯🇴');

  // Curve geometry for SVG arc
  // Start: (28, 48), Control: (150, 10), End: (272, 48)
  const p0 = { x: 28, y: 48 };
  const p1 = { x: 150, y: 8 };
  const p2 = { x: 272, y: 48 };

  // Calculate coordinates on quadratic bezier at t: B(t) = (1-t)^2*P0 + 2*(1-t)*t*P1 + t^2*P2
  const t = Math.max(0.05, Math.min(0.95, stage.progress));
  const planeX = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
  const planeY = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;

  // Calculate tangent vector for plane rotation
  const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
  const dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
  let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
  if (isRtl) {
    // Mirror angle if displayed in RTL
    // We keep standard Left-to-Right flight path for natural flight metaphor
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-750 rounded-2xl p-4 md:p-5 text-white shadow-md relative overflow-hidden">
      {/* Background World/Grid Map Texture */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      <div className="absolute -top-10 -right-10 w-36 h-36 bg-brand-500/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* Header Info */}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span className="text-xs font-bold text-slate-300">
            {isAr ? 'تتبع مسار شحنة الطلب' : 'Shipment Route Tracking'}
          </span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${stage.badgeColor}`}>
          {isAr ? stage.labelAr : stage.labelEn}
        </span>
      </div>

      {/* Interactive Flight Arc SVG */}
      <div className="relative z-10 my-2 px-2">
        <svg viewBox="0 0 300 70" className="w-full h-16 md:h-20 overflow-visible">
          {/* Defs for gradients */}
          <defs>
            <linearGradient id={`flightGrad-${shipment.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id={`activeArc-${shipment.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Full background dotted arc */}
          <path
            d={`M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.18)"
            strokeWidth="2.5"
            strokeDasharray="4 4"
          />

          {/* Active completed path */}
          <path
            d={`M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}`}
            fill="none"
            stroke={`url(#activeArc-${shipment.id})`}
            strokeWidth="3.5"
            strokeDasharray="300"
            strokeDashoffset={300 * (1 - t)}
            strokeLinecap="round"
          />

          {/* Origin Airport Dot */}
          <circle cx={p0.x} cy={p0.y} r="6" fill="#0ea5e9" className="shadow-lg" />
          <circle cx={p0.x} cy={p0.y} r="10" fill="#0ea5e9" fillOpacity="0.25" className="animate-pulse" />

          {/* Destination Airport Dot */}
          <circle cx={p2.x} cy={p2.y} r="6" fill="#a855f7" />
          <circle cx={p2.x} cy={p2.y} r="10" fill="#a855f7" fillOpacity="0.25" />

          {/* Moving Airplane Marker */}
          <g transform={`translate(${planeX}, ${planeY}) rotate(${angleDeg})`}>
            {/* Pulsing Radar Wave around plane */}
            {stage.isFlying && (
              <circle cx="0" cy="0" r="14" fill="#10b981" fillOpacity="0.25">
                <animate attributeName="r" values="8;18;8" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
              </circle>
            )}

            {/* Glowing Plane Background */}
            <circle cx="0" cy="0" r="9" fill="#10b981" className="filter drop-shadow-md" />

            {/* Plane Icon SVG Vector */}
            <path
              d="M-4,-4 L4,0 L-4,4 L-2,0 Z"
              fill="#ffffff"
            />
          </g>
        </svg>

        {/* Airport Hub Labels under endpoints */}
        <div className="flex items-center justify-between text-xs mt-1">
          <div className="flex flex-col items-start">
            <span className="font-black text-sky-400 text-sm tracking-wider">{originCode}</span>
            <span className="text-[11px] text-slate-400">{originCity}</span>
          </div>

          {/* Center Flight Status Badge */}
          <div className="text-center">
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
              {Math.round(stage.progress * 100)}% {isAr ? 'مكتمل' : 'Completed'}
            </span>
          </div>

          <div className="flex flex-col items-end">
            <span className="font-black text-purple-400 text-sm tracking-wider">{destCode}</span>
            <span className="text-[11px] text-slate-400">{destCity}</span>
          </div>
        </div>
      </div>

      {/* Flight & Package Metadata Bar */}
      <div className="relative z-10 mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2 truncate">
          <Plane className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <span className="truncate font-medium">
            {isAr ? 'طيران مجدول: الملكية الأردنية / الخطوط الجزائرية' : 'Scheduled Air Route: RJ / Air Algérie'}
          </span>
        </div>

        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1 shrink-0 transition-colors"
          >
            <span>{isAr ? 'تفاصيل التتبع' : 'Full Timeline'}</span>
            {isAr ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
          </button>
        )}
      </div>
    </div>
  );
};
