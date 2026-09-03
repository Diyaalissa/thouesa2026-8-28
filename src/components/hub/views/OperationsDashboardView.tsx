import React from 'react';
import {
  PackagePlus,
  Scale,
  Plane,
  Split,
  FileSpreadsheet,
  ArrowDownToLine,
  UserCheck,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
} from 'lucide-react';
import { Hub, Locale, Shipment, Trip, Manifest, EmployeeNavSection } from '../../../types';
import { StatusBadge } from '../../common/StatusBadge';

interface OperationsDashboardViewProps {
  currentHub: Hub;
  shipments: Shipment[];
  trips: Trip[];
  manifests: Manifest[];
  locale: Locale;
  onNavigate: (section: EmployeeNavSection) => void;
}

export const OperationsDashboardView: React.FC<OperationsDashboardViewProps> = ({
  currentHub,
  shipments,
  trips,
  manifests,
  locale,
  onNavigate,
}) => {
  const isAr = locale === 'ar';

  // Metrics calculation
  const originShipments = shipments.filter((s) => s.originHubId === currentHub.id || !s.originHubId);
  const destShipments = shipments.filter((s) => s.destinationHubId === currentHub.id);

  const awaitingDropoff = originShipments.filter(
    (s) => s.currentStatus === 'PENDING_DROPOFF' || s.currentStatus === 'PENDING' || s.currentStatus === 'PENDING_HUB_DROPOFF'
  );
  const awaitingInspection = originShipments.filter(
    (s) => s.currentStatus === 'RECEIVED_AT_ORIGIN' || s.currentStatus === 'RECEIVED_AT_ORIGIN_HUB'
  );
  const readyForTransport = originShipments.filter(
    (s) => s.currentStatus === 'INSPECTED_AND_SEALED' || s.currentStatus === 'INSPECTED_SEALED'
  );
  const weightDiscrepancies = originShipments.filter(
    (s) => s.currentStatus === 'WEIGHT_DISCREPANCY_PENDING' || s.currentStatus === 'WEIGHT_ADJUSTMENT_PENDING'
  );

  const pendingTrips = trips.filter((t) => t.originHubId === currentHub.id && t.status === 'SUBMITTED');
  const verifiedTrips = trips.filter(
    (t) => t.originHubId === currentHub.id && (t.status === 'VERIFIED' || t.status === 'CONFIRMED')
  );

  const arrivingAtDest = destShipments.filter(
    (s) => s.currentStatus === 'IN_TRANSIT' || s.currentStatus === 'IN_TRANSIT_AIR' || s.currentStatus === 'IN_FLIGHT'
  );
  const readyForPickup = destShipments.filter(
    (s) => s.currentStatus === 'READY_FOR_PICKUP' || s.currentStatus === 'RECEIVED_AT_DEST'
  );

  const statCards = [
    {
      titleAr: 'بانتظار وصول العميل للفرع',
      titleEn: 'Awaiting Drop-off',
      count: awaitingDropoff.length,
      icon: PackagePlus,
      color: 'border-amber-200 bg-amber-50/50 text-amber-900',
      iconColor: 'bg-amber-100 text-amber-800',
      actionSection: 'ORIGIN_INTAKE' as EmployeeNavSection,
      actionTextAr: 'استقبال الكاونتر',
      actionTextEn: 'Counter Intake',
    },
    {
      titleAr: 'طرود بانتظار الفحص والوزن',
      titleEn: 'Pending Inspection & Scale',
      count: awaitingInspection.length,
      icon: Scale,
      color: 'border-teal-200 bg-teal-50/50 text-teal-900',
      iconColor: 'bg-teal-100 text-teal-800',
      actionSection: 'INSPECTION_WEIGHT' as EmployeeNavSection,
      actionTextAr: 'محطة الفحص',
      actionTextEn: 'Inspect Now',
      urgent: awaitingInspection.length > 0,
    },
    {
      titleAr: 'طرود مفحوصة ومختومة جاهزة للنقل',
      titleEn: 'Ready for Transport',
      count: readyForTransport.length,
      icon: CheckCircle2,
      color: 'border-indigo-200 bg-indigo-50/50 text-indigo-900',
      iconColor: 'bg-indigo-100 text-indigo-800',
      actionSection: 'READY_FOR_TRANSPORT' as EmployeeNavSection,
      actionTextAr: 'عرض الجاهزة',
      actionTextEn: 'View Ready',
    },
    {
      titleAr: 'رحلات مسافرين بانتظار الاعتماد',
      titleEn: 'Trips Pending Verification',
      count: pendingTrips.length,
      icon: Plane,
      color: 'border-sky-200 bg-sky-50/50 text-sky-900',
      iconColor: 'bg-sky-100 text-sky-800',
      actionSection: 'TRIP_VERIFICATION' as EmployeeNavSection,
      actionTextAr: 'تدقيق التذاكر',
      actionTextEn: 'Verify Tickets',
      urgent: pendingTrips.length > 0,
    },
    {
      titleAr: 'طرود جاهزة للتسليم للعميل (OTP)',
      titleEn: 'Ready for Final Delivery',
      count: readyForPickup.length,
      icon: UserCheck,
      color: 'border-purple-200 bg-purple-50/50 text-purple-900',
      iconColor: 'bg-purple-100 text-purple-800',
      actionSection: 'FINAL_DELIVERY' as EmployeeNavSection,
      actionTextAr: 'كاونتر التسليم',
      actionTextEn: 'Delivery Counter',
    },
    {
      titleAr: 'فروقات وزن معلقة',
      titleEn: 'Weight Discrepancies',
      count: weightDiscrepancies.length,
      icon: AlertTriangle,
      color: 'border-rose-200 bg-rose-50/50 text-rose-900',
      iconColor: 'bg-rose-100 text-rose-800',
      actionSection: 'OPERATIONAL_INCIDENTS' as EmployeeNavSection,
      actionTextAr: 'متابعة الحالات',
      actionTextEn: 'Handle Discrepancy',
      urgent: weightDiscrepancies.length > 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome & Shift Overview Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {isAr ? 'الفرع نشط • المناوبة الصباحية' : 'Hub Active • Morning Shift'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            {isAr ? `مركز العمليات اللوجستية — ${currentHub.nameAr}` : `Operations Command — ${currentHub.nameEn}`}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {isAr
              ? 'متابعة فورية لدورة حياة الطرود والشحنات، تدقيق رحلات المسافرين، ومطابقة المانيفستات الرسمية المشفرة.'
              : 'Real-time lifecycle control for parcel intake, traveler flight verifications, and cryptographic manifest dispatch.'}
          </p>
        </div>

        {/* Quick Branch Metrics */}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
          <div className="px-3 py-1 text-center border-e border-slate-200">
            <div className="text-[10px] text-slate-500">{isAr ? 'كود الفرع' : 'Hub Code'}</div>
            <div className="font-mono font-black text-slate-800">{currentHub.code}</div>
          </div>
          <div className="px-3 py-1 text-center border-e border-slate-200">
            <div className="text-[10px] text-slate-500">{isAr ? 'العملة' : 'Currency'}</div>
            <div className="font-bold text-emerald-700">{currentHub.currency}</div>
          </div>
          <div className="px-3 py-1 text-center">
            <div className="text-[10px] text-slate-500">{isAr ? 'الرحلات النشطة' : 'Active Flights'}</div>
            <div className="font-black text-sky-700">{verifiedTrips.length}</div>
          </div>
        </div>
      </div>

      {/* Main Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border transition-all hover:shadow-sm flex flex-col justify-between ${card.color}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-bold opacity-80">{isAr ? card.titleAr : card.titleEn}</span>
                  <div className="text-3xl font-black mt-1 tracking-tight">{card.count}</div>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${card.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
                {card.urgent ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    {isAr ? 'يتطلب إجراء عاجل' : 'Action Required'}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500 font-medium">
                    {isAr ? 'حالة اعتيادية' : 'Normal queue'}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onNavigate(card.actionSection)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-amber-800 transition-colors cursor-pointer"
                >
                  <span>{isAr ? card.actionTextAr : card.actionTextEn}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Section 2: Priority Queues (Awaiting Inspection & Awaiting Traveler Flights) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Task 1: Awaiting Inspection */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {isAr ? 'طرود استلمها الكاونتر وبانتظار الفحص الأمني' : 'Counter-Received Pending Inspection'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isAr ? 'طرد تم استلامه من العميل ويحتاج إلى وزن حقيقي وتثبيت الختم' : 'Parcels requiring scale reading & tamper-seal'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('INSPECTION_WEIGHT')}
              className="text-xs font-bold text-teal-800 hover:underline cursor-pointer"
            >
              {isAr ? 'فتح المحطة' : 'Open Station'}
            </button>
          </div>

          {awaitingInspection.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-700">
                {isAr ? 'لا توجد طرود معلقة بانتظار الفحص' : 'No parcels pending inspection'}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isAr ? 'جميع الطرود المستلمة تم فحصها وختمها بنجاح' : 'All counter packages inspected'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {awaitingInspection.slice(0, 4).map((s) => (
                <div
                  key={s.id}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-amber-700">{s.trackingNumber}</span>
                      <StatusBadge status={s.currentStatus} locale={locale} size="sm" />
                    </div>
                    <div className="text-xs font-semibold text-slate-800 mt-1">{s.itemDescription}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {isAr ? 'المرسل:' : 'Sender:'} {s.senderName} • {s.estimatedWeightKg} {isAr ? 'كغم تقديري' : 'kg est.'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigate('INSPECTION_WEIGHT')}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    {isAr ? 'افحص الآن' : 'Inspect'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Urgent Task 2: Trips Awaiting Flight Verification */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                <Plane className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {isAr ? 'رحلات مسافرين بانتظار تدقيق تذاكر الطيران' : 'Traveler Flights Awaiting Verification'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isAr ? 'تدقيق رقم الـ PNR، أوزان الأمتعة الشاغرة، وتاريخ الإقلاع' : 'PNR, flight ticket & luggage capacity audit'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('TRIP_VERIFICATION')}
              className="text-xs font-bold text-sky-800 hover:underline cursor-pointer"
            >
              {isAr ? 'تدقيق الكل' : 'Audit All'}
            </button>
          </div>

          {pendingTrips.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-700">
                {isAr ? 'لا توجد طلبات رحلات جديدة بانتظار التدقيق' : 'No trips pending verification'}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isAr ? 'يمكنك مراجعة الرحلات المعتمدة لإنشاء المانيفستات' : 'Ready trips can be viewed in Verified Trips'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTrips.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{t.travelerName}</span>
                      <span className="font-mono text-[11px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                        {t.airline} ({t.flightNumber})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">
                      PNR: <span className="font-mono font-bold text-slate-800">{t.pnrCode}</span> • {isAr ? 'السعة المعروضة:' : 'Capacity:'}{' '}
                      <span className="font-bold text-emerald-700">{t.availableWeightKg} كغم</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {isAr ? 'تاريخ الإقلاع:' : 'Departure:'} {new Date(t.departureTime).toLocaleDateString()}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigate('TRIP_VERIFICATION')}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    {isAr ? 'تدقيق' : 'Verify'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
