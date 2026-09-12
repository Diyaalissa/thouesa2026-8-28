import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Scale,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Plane,
  Building2,
  User,
  Phone,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Layers,
  FileCheck,
  Tag,
  Clock,
} from 'lucide-react';
import { Shipment, Locale, Hub, EmployeeNavSection } from '../../../types';
import { HUBS_DATA } from '../../../lib/constants';

interface ReadyShipmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  currentHub: Hub;
  locale: Locale;
  compatibleTripsCount: number;
  onFindMatch: (shipmentId: string) => void;
}

export const ReadyShipmentDrawer: React.FC<ReadyShipmentDrawerProps> = ({
  isOpen,
  onClose,
  shipment,
  currentHub,
  locale,
  compatibleTripsCount,
  onFindMatch,
}) => {
  const isAr = locale === 'ar';
  const [copied, setCopied] = useState(false);

  if (!isOpen || !shipment) return null;

  const destHub = HUBS_DATA.find((h) => h.id === shipment.destinationHubId);
  const destName = isAr
    ? destHub?.cityAr || destHub?.nameAr || shipment.destinationHubId
    : destHub?.cityEn || destHub?.nameEn || shipment.destinationHubId;

  // Handle tracking copy
  const handleCopyTracking = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(shipment.trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Readiness checklist validations
  const isInspected =
    shipment.currentStatus === 'INSPECTED_SEALED' ||
    shipment.currentStatus === 'INSPECTED_AND_SEALED' ||
    Boolean(shipment.inspectedAt);
  const isWeightRecorded = Boolean(shipment.actualWeightKg && shipment.actualWeightKg > 0);
  const isSealValid = Boolean(shipment.securitySealId && shipment.securitySealId.trim().length > 0);
  
  // Hold detection
  const hasHold =
    shipment.isHold ||
    shipment.currentStatus === 'CUSTOMS_HELD' ||
    Boolean(shipment.holdReason);
  const holdExplanation = shipment.holdReason || (isAr ? 'حظر جمركي / أمني مؤقت بانتظار استكمال الوثائق' : 'Customs / security hold pending clearance');

  const isFullyReadyForMatching = isInspected && isWeightRecorded && isSealValid && !hasHold;

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-s border-slate-200 animate-in slide-in-from-right-5 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {isAr ? 'جاهزة للنقل الجوي' : 'READY FOR TRANSPORT'}
              </span>
              {shipment.priority === 'URGENT' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                  {isAr ? 'عاجل جداً' : 'URGENT'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <h2 className="text-base font-mono font-black text-slate-900 tracking-tight">
                {shipment.trackingNumber}
              </h2>
              <button
                type="button"
                onClick={handleCopyTracking}
                title={isAr ? 'نسخ رقم التتبع' : 'Copy Tracking'}
                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAr ? 'المسار التشغيلي المتجه إلى:' : 'Destination route to:'}{' '}
              <strong className="text-slate-800">{destName}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Hold Alert Banner if any */}
          {hasHold && (
            <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-3 text-rose-900">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-black">
                  {isAr ? '⚠️ تنبيه: الطرد عليه حظر تشغيلي / جمركي' : '⚠️ ALERT: Parcel is Under Hold'}
                </div>
                <div className="text-xs text-rose-700 mt-0.5">{holdExplanation}</div>
                <div className="text-[11px] text-rose-600 font-bold mt-1">
                  {isAr
                    ? 'يُمنع إسناد الطرد لأي رحلة لحين رفع الحظر رسمياً من الإدارة الجمركية.'
                    : 'Matching is disabled until customs/administrative hold is officially resolved.'}
                </div>
              </div>
            </div>
          )}

          {/* Key Read-Only Badges (Weight & Seal) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Actual Weight Card (Read-Only) */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                <Scale className="w-4 h-4 text-indigo-600" />
                <span>{isAr ? 'الوزن الفعلي المعتمد' : 'Verified Actual Weight'}</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900">
                  {(shipment.actualWeightKg ?? shipment.estimatedWeightKg ?? 0).toFixed(2)}
                </span>
                <span className="text-xs font-bold text-slate-500">{isAr ? 'كغم' : 'KG'}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {isAr ? 'تم وزنه بميزان الفرع الصناعي (غير قابل للتعديل)' : 'Industrial scale verified (Read-only)'}
              </p>
            </div>

            {/* Security Seal Card (Read-Only) */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                <Lock className="w-4 h-4 text-teal-600" />
                <span>{isAr ? 'الختم الأمني المرقم' : 'Security Seal ID'}</span>
              </div>
              <div className="mt-1 font-mono font-black text-base text-teal-800 flex items-center gap-1">
                <span>{shipment.securitySealId || 'SEAL-NOT-SET'}</span>
                <Check className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-[10px] text-teal-700 font-semibold mt-1">
                {isAr ? 'ختم سليم ومقفل ضد التلاعب (Valid)' : 'Tamper-evident sealed (Valid)'}
              </p>
            </div>
          </div>

          {/* Matching Readiness Checklist */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-2 mb-3">
              <FileCheck className="w-4 h-4 text-indigo-600" />
              <span>{isAr ? 'قائمة جاهزية المطابقة مع المسافرين' : 'Matching Readiness Checklist'}</span>
            </h3>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-700">
                    {isAr ? 'اجتاز الفحص الأمني والمطابقة' : 'Inspection Passed & Verified'}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  {isAr ? 'معتمد ✓' : 'Passed ✓'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-700">
                    {isAr ? 'الوزن الفعلي مسجل ومعتمد' : 'Actual Weight Recorded'}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                  {(shipment.actualWeightKg ?? shipment.estimatedWeightKg ?? 0).toFixed(2)} KG
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-700">
                    {isAr ? 'الختم الأمني مثبت ومطابق' : 'Security Seal Verified & Locked'}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                  {shipment.securitySealId} ✓
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs">
                <div className="flex items-center gap-2">
                  {hasHold ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span className="font-bold text-slate-700">
                    {isAr ? 'خالٍ من أي تعليق جمركي أو حظر' : 'No Customs or Operational Hold'}
                  </span>
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                    hasHold
                      ? 'text-rose-700 bg-rose-50 border-rose-300'
                      : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  }`}
                >
                  {hasHold ? (isAr ? 'حظر نشط ⚠️' : 'HOLD ACTIVE ⚠️') : (isAr ? 'سليم ✓' : 'Clear ✓')}
                </span>
              </div>
            </div>
          </div>

          {/* Inspection Summary (Read-Only) */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                {isAr ? 'ملخص الفحص الأمني الميداني' : 'Security Inspection Summary'}
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                {shipment.inspectedAt ? new Date(shipment.inspectedAt).toLocaleString(locale) : '—'}
              </span>
            </div>

            <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/80 leading-relaxed">
              {shipment.inspectionNotes ||
                (isAr
                  ? 'تم فحص محتوى الطرد يدوياً وبأجهزة المسح الضوئي، والتأكد من خلوه من المحظورات، وتثبيت الختم المرقم بنجاح.'
                  : 'Parcel contents physically and optically scanned. Confirmed non-prohibited and tamper-sealed.')}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>
                {isAr ? 'المفتش المسؤول:' : 'Inspecting Agent:'}{' '}
                <strong className="text-slate-800">{shipment.inspectedByAgentId || 'Agent #303'}</strong>
              </span>
              <span>
                {isAr ? 'موقع الفحص:' : 'Inspection Hub:'}{' '}
                <strong className="text-slate-800">{currentHub.cityAr || currentHub.cityEn}</strong>
              </span>
            </div>
          </div>

          {/* Shipment & Recipient Details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'تفاصيل المستلم والمحتوى' : 'Recipient & Content Overview'}
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">{isAr ? 'المستلم:' : 'Recipient:'}</span>
                <span className="font-bold text-slate-900">{shipment.recipientName}</span>
                <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{shipment.recipientPhone}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">{isAr ? 'المرسل:' : 'Sender:'}</span>
                <span className="font-bold text-slate-900">{shipment.senderName}</span>
                <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{shipment.senderPhone}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-400 block text-[11px]">{isAr ? 'وصف المحتوى:' : 'Item Description:'}</span>
              <p className="font-medium text-slate-800 mt-0.5">{shipment.itemDescription}</p>
            </div>

            {shipment.preferredDepartureDate && (
              <div className="flex items-center gap-2 p-2 bg-indigo-50/60 rounded-xl text-xs text-indigo-900 font-medium">
                <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  {isAr ? 'تاريخ السفر المفضل للعميل:' : 'Customer Preferred Departure:'}{' '}
                  <strong>{new Date(shipment.preferredDepartureDate).toLocaleDateString(locale)}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Compatible Trips Preview Info */}
          <div className="p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Plane className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-indigo-950">
                  {compatibleTripsCount > 0
                    ? isAr
                      ? `${compatibleTripsCount} رحلات مسافرين معتمدة متاحة`
                      : `${compatibleTripsCount} Compatible Verified Trips Available`
                    : isAr
                    ? 'لا توجد رحلات متوافقة فوراً'
                    : 'No compatible trips right now'}
                </div>
                <p className="text-[11px] text-indigo-700">
                  {isAr
                    ? 'انتقل لشاشة المطابقة لمراجعة المسافرين وحجز السعة من أوزانهم.'
                    : 'Navigate to matching to link with traveler luggage space.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>

          <button
            type="button"
            disabled={!isFullyReadyForMatching}
            onClick={() => {
              onFindMatch(shipment.id);
              onClose();
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs shadow-sm transition-colors cursor-pointer ${
              isFullyReadyForMatching
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>{isAr ? '🔗 البحث عن رحلة مناسبة' : '🔗 Find Compatible Trip'}</span>
            <ArrowIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
