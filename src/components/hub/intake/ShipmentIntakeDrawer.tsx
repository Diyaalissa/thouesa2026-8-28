import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  User,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Package,
  CreditCard,
  Calendar,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  FileWarning,
  Eye,
  Layers,
} from 'lucide-react';
import { Shipment, Locale, Hub, EmployeeNavSection, User as UserType } from '../../../types';
import { StatusBadge } from '../../common/StatusBadge';

interface ShipmentIntakeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  currentHub: Hub;
  currentUser?: UserType;
  locale: Locale;
  onReceiveClick: () => void;
  onRecordIssueClick: () => void;
  onCollectPaymentClick: () => void;
  onNavigate: (section: EmployeeNavSection) => void;
  successMessage?: string;
}

export const ShipmentIntakeDrawer: React.FC<ShipmentIntakeDrawerProps> = ({
  isOpen,
  onClose,
  shipment,
  currentHub,
  currentUser,
  locale,
  onReceiveClick,
  onRecordIssueClick,
  onCollectPaymentClick,
  onNavigate,
  successMessage,
}) => {
  const isAr = locale === 'ar';
  const [copied, setCopied] = useState(false);

  // Desk acceptance interactive checklist state
  const [checklist, setChecklist] = useState({
    identityVerified: false,
    originHubMatches: false,
    packagingIntact: false,
    paymentConditionMet: false,
  });

  if (!isOpen || !shipment) return null;

  const handleCopyTracking = () => {
    navigator.clipboard.writeText(shipment.trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Guardrail 1: Wrong Origin Hub
  const isWrongHub = Boolean(shipment.originHubId && shipment.originHubId !== currentHub.id);

  // Guardrail 2: Already Received
  const isAlreadyReceived =
    shipment.currentStatus === 'RECEIVED_AT_ORIGIN' ||
    shipment.currentStatus === 'RECEIVED_AT_ORIGIN_HUB' ||
    shipment.currentStatus === 'INSPECTED_SEALED' ||
    shipment.currentStatus === 'INSPECTED_AND_SEALED' ||
    shipment.currentStatus === 'ASSIGNED_TO_TRIP' ||
    shipment.currentStatus === 'IN_TRANSIT' ||
    shipment.currentStatus === 'DELIVERED';

  // Guardrail 3: Cancelled or Rejected
  const isCancelledOrRejected =
    shipment.currentStatus === 'CANCELLED' || shipment.currentStatus === 'REJECTED_PROHIBITED';

  // Payment Status
  const isPaymentPending =
    shipment.paymentStatus === 'PENDING_PAYMENT' || shipment.paymentStatus === 'DEPOSIT_PAID';

  const isChecklistComplete =
    checklist.identityVerified &&
    checklist.originHubMatches &&
    checklist.packagingIntact &&
    checklist.paymentConditionMet;

  // Role authorization check (HUB_AGENT, HUB_INSPECTOR, HUB_MANAGER, MASTER_ADMIN can receive; FINANCIAL_OFFICER, PRICING_MANAGER view & collect payment only)
  const isFinancialOrPricingOnly =
    currentUser?.role === 'FINANCIAL_OFFICER' || currentUser?.role === 'PRICING_MANAGER';
  const hasIntakeRole = !isFinancialOrPricingOnly;

  const canReceive =
    !isWrongHub &&
    !isAlreadyReceived &&
    !isCancelledOrRejected &&
    !isPaymentPending &&
    isChecklistComplete &&
    hasIntakeRole;

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className={`fixed inset-y-0 ${
          isAr ? 'left-0' : 'right-0'
        } max-w-2xl w-full bg-white shadow-2xl flex flex-col z-50 transition-transform duration-300 ease-out border-s border-slate-200`}
      >
        {/* Sticky Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-slate-900 text-base sm:text-lg tracking-wider">
                  {shipment.trackingNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyTracking}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title={isAr ? 'نسخ رقم التتبع' : 'Copy Tracking'}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                {copied && (
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    {isAr ? 'تم النسخ' : 'Copied'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500 font-medium">
                  {shipment.serviceType === 'SEND_PARCEL'
                    ? (isAr ? 'طرد شخصي' : 'Personal Parcel')
                    : shipment.serviceType === 'INTERNATIONAL_BUY'
                    ? (isAr ? 'شراء دولي' : 'International Store Buy')
                    : (isAr ? 'شراء محلي' : 'Country Buy')}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-600 font-bold flex items-center gap-1">
                  <span>{currentHub.code}</span>
                  <ArrowIcon className="w-3 h-3 text-slate-400" />
                  <span>{shipment.destinationHubId === 'hub-alg' ? 'ALG-01' : 'AMM-01'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={shipment.currentStatus} locale={locale} />
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700">
          {/* Success Banner if intake just completed */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex flex-col gap-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-950 text-xs sm:text-sm">{successMessage}</h4>
                  <p className="text-[11px] text-emerald-800 mt-1">
                    {isAr
                      ? 'تم تسجيل الطرد بنجاح في سجل الفرع وأصبح متاحاً الآن في شاشة الفحص والوزن والختم الأمني.'
                      : 'Package recorded in hub custody and moved to Inspection & Certified Sealing queue.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate('INSPECTION_WEIGHT')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>{isAr ? 'الانتقال لشاشة الفحص والوزن' : 'Go to Inspection & Weight'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </div>
          )}

          {/* Guardrail 1: Wrong Origin Hub Warning */}
          {isWrongHub && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-black text-rose-950 text-xs sm:text-sm">
                  {isAr ? '⛔ تحذير أمني: لا يمكن استلام هذا الطرد في هذا الفرع' : 'Security Alert: Wrong Origin Hub'}
                </h4>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  {isAr
                    ? `فرع المنشأ المعتمد في بوليصة الشحن هو (${shipment.originHubId})، بينما هذا الفرع هو (${currentHub.id} - ${currentHub.nameAr}). تمنع سياسة THOUESA استلام الطرود خارج محطة الانطلاق المقيدة بالبوليصة.`
                    : `The origin hub registered for this parcel is (${shipment.originHubId}), but current hub is (${currentHub.id}). Policy strictly forbids parcel intake at mismatched branches.`}
                </p>
              </div>
            </div>
          )}

          {/* Guardrail 2: Already Received Banner */}
          {isAlreadyReceived && !successMessage && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-950 text-xs sm:text-sm">
                    {isAr ? 'تم استلام هذا الطرد مسبقاً في الفرع' : 'Parcel Already Received at Hub'}
                  </h4>
                  <p className="text-[11px] text-blue-800 mt-0.5">
                    {isAr
                      ? `تم الاستلام بتاريخ: ${shipment.receivedAtOriginHubAt ? new Date(shipment.receivedAtOriginHubAt).toLocaleString(isAr ? 'ar-JO' : 'en-US') : 'مسجل مسبقاً'} بواسطة الموظف: ${shipment.receivedByEmployeeId || 'موظف الكاونتر'}`
                      : `Received at ${shipment.receivedAtOriginHubAt ? new Date(shipment.receivedAtOriginHubAt).toLocaleString() : 'Earlier'} by ${shipment.receivedByEmployeeId || 'Desk Agent'}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('INSPECTION_WEIGHT')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isAr ? 'معاينة بالفحص' : 'View in Inspection'}</span>
              </button>
            </div>
          )}

          {/* Guardrail 3: Cancelled / Rejected */}
          {isCancelledOrRejected && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-rose-950 text-xs">
                  {isAr ? 'هذا الطلب ملغى أو مرفوض في النظام' : 'Shipment Cancelled or Rejected'}
                </h4>
                <p className="text-[11px] text-rose-800 mt-0.5">
                  {isAr
                    ? 'لا يجوز استلام هذا الطرد في الفرع نظراً لإلغاء الحجز من قبل العميل أو رفضه أمنياً.'
                    : 'Intake cannot be performed because this shipment order has been cancelled or rejected.'}
                </p>
              </div>
            </div>
          )}

          {/* 1. Sender & Recipient Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Sender Information */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-amber-600" />
                  <span>{isAr ? 'بيانات المرسل' : 'Sender Information'}</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{isAr ? 'موثق KYC' : 'KYC Verified'}</span>
                </span>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="font-bold text-slate-900 text-sm">{shipment.senderName}</div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{shipment.senderPhone}</span>
                </div>
                {shipment.senderEmail && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{shipment.senderEmail}</span>
                  </div>
                )}
                <div className="text-[10px] text-slate-400 pt-1">
                  ID: <span className="font-mono">{shipment.senderId}</span>
                </div>
              </div>
            </div>

            {/* Recipient Information */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>{isAr ? 'بيانات المستلم والوجهة' : 'Recipient & Destination'}</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                  {shipment.destinationHubId === 'hub-alg' ? 'الجزائر DZA' : 'الأردن JOR'}
                </span>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="font-bold text-slate-900 text-sm">{shipment.recipientName}</div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{shipment.recipientPhone}</span>
                </div>
                <div className="text-slate-600 text-[11px] line-clamp-2 leading-relaxed">
                  {shipment.recipientAddress}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Route & Journey Visualization */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="text-[11px] font-bold text-slate-500 mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAr ? 'مسار الشحنة المحجوز (غير قابل للتعديل بالكاونتر):' : 'Fixed Routing:'}</span>
            </div>
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
              <div className="text-center sm:text-start">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'فرع المنشأ (المقر الحالي)' : 'Origin Hub'}</span>
                <span className="font-bold text-slate-900 text-xs">
                  {isAr ? currentHub.nameAr : currentHub.nameEn} ({currentHub.code})
                </span>
              </div>
              <div className="flex items-center gap-1 text-amber-600 font-bold px-3">
                <ArrowIcon className="w-4 h-4 animate-pulse" />
              </div>
              <div className="text-center sm:text-end">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'فرع الوصول النهائي' : 'Destination Hub'}</span>
                <span className="font-bold text-slate-900 text-xs">
                  {shipment.destinationHubId === 'hub-alg'
                    ? (isAr ? 'فرع الجزائر الرئيسي (ALG-01)' : 'Algiers Main Hub (ALG-01)')
                    : (isAr ? 'فرع عمان الرئيسي (AMM-01)' : 'Amman Main Hub (AMM-01)')}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Shipment Information & Declared Weight */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
              <Package className="w-4 h-4 text-amber-600" />
              <span>{isAr ? 'تفاصيل الطرد المعلنة' : 'Declared Package Information'}</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'الوزن المعلن' : 'Declared Weight'}</span>
                <span className="font-black text-amber-800 text-sm">{shipment.estimatedWeightKg} كغم</span>
                <span className="text-[9px] text-slate-400 block">{isAr ? '(تقديري من العميل)' : '(Customer Declared)'}</span>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'القيمة المصرحة' : 'Declared Value'}</span>
                <span className="font-bold text-slate-900 text-sm">${shipment.declaredValue} {shipment.currency}</span>
                <span className="text-[9px] text-slate-400 block">{isAr ? '(خاضع للجمارك)' : '(Customs Basis)'}</span>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'نوع التغليف' : 'Package Packaging'}</span>
                <span className="font-medium text-slate-800 text-xs block truncate">
                  {shipment.packageType || (isAr ? 'كرتون مقوى' : 'Carton Box')}
                </span>
                <span className="text-[9px] text-slate-400 block">{isAr ? 'قطعة واحدة' : '1 Piece'}</span>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'موعد التسليم المتوقع' : 'Expected Drop-off'}</span>
                <span className="font-bold text-slate-800 text-xs block truncate">
                  {shipment.preferredDepartureDate || (isAr ? 'اليوم' : 'Today')}
                </span>
                <span className="text-[9px] text-emerald-600 font-bold block">{isAr ? 'مؤكد بالفرع' : 'Confirmed'}</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 block mb-1">
                {isAr ? 'وصف المحتويات المعلنة من العميل:' : 'Declared Package Contents Description:'}
              </span>
              <p className="text-slate-800 text-xs leading-relaxed font-medium">
                {shipment.itemDescription}
              </p>
            </div>
          </div>

          {/* 4. Security Declarations Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <h4 className="font-bold text-slate-900 flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'التصريحات الأمنية الأولية من العميل' : 'Initial Security Declarations'}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-normal">
                {isAr ? 'فحص تفصيلي يتم في المحطة التالية' : 'Full inspection at scale station'}
              </span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2 bg-white rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 block">{isAr ? 'سوائل / عطور' : 'Liquids'}</span>
                <span className="font-bold text-emerald-700 text-xs">
                  {shipment.securityDeclarations?.containsLiquids ? (isAr ? 'نعم ⚠️' : 'Yes') : (isAr ? 'لا (سليم)' : 'No')}
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 block">{isAr ? 'بطاريات ليثيوم' : 'Batteries'}</span>
                <span className="font-bold text-emerald-700 text-xs">
                  {shipment.securityDeclarations?.containsBatteries ? (isAr ? 'نعم ⚠️' : 'Yes') : (isAr ? 'لا (سليم)' : 'No')}
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 block">{isAr ? 'أدوية علاجية' : 'Medication'}</span>
                <span className="font-bold text-emerald-700 text-xs">
                  {shipment.securityDeclarations?.containsMedication ? (isAr ? 'نعم ⚠️' : 'Yes') : (isAr ? 'لا (سليم)' : 'No')}
                </span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 block">{isAr ? 'قابل للكسر' : 'Fragile'}</span>
                <span className={`font-bold text-xs ${shipment.securityDeclarations?.containsFragile ? 'text-amber-700 font-black' : 'text-slate-700'}`}>
                  {shipment.securityDeclarations?.containsFragile ? (isAr ? 'نعم ⚠️' : 'Yes') : (isAr ? 'لا' : 'No')}
                </span>
              </div>
            </div>

            {shipment.securityDeclarations?.containsFragile && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-900 text-[11px]">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold">
                  {isAr
                    ? '⚠️ تنبيه: الصندوق مصرح أنه يحتوي على مواد قابلة للكسر. يرجى تثبيت ملصق (FRAGILE / قابل للكسر) فور الاستلام.'
                    : 'Notice: Contains fragile goods. Please affix FRAGILE sticker upon intake.'}
                </span>
              </div>
            )}
          </div>

          {/* 5. Payment Summary & Counter Collection */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-700" />
                <span>{isAr ? 'ملخص الدفع المالي' : 'Payment Verification'}</span>
              </h4>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${
                  !isPaymentPending
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse'
                }`}
              >
                {!isPaymentPending
                  ? (isAr ? 'مدفوع بالكامل (PAID)' : 'FULLY PAID')
                  : (isAr ? 'مطلوب التحصيل بالكاونتر' : 'PAYMENT REQUIRED')}
              </span>
            </div>

            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 block">{isAr ? 'رسوم الشحن المقدرة:' : 'Shipping Charge:'}</span>
                <span className="font-black text-slate-900 text-base">${shipment.shippingCost} USD</span>
              </div>
              <div className="text-end">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'طريقة الدفع المحددة:' : 'Payment Method:'}</span>
                <span className="font-bold text-slate-700 text-xs">
                  {shipment.paymentMethod || 'WALLET / CLIQ'}
                </span>
              </div>
            </div>

            {isPaymentPending && (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="text-[11px] font-bold text-amber-900">
                    {isAr
                      ? `يتوجب تحصيل مبلغ ($${shipment.shippingCost} USD) قبل تأكيد الاستلام.`
                      : `Collection of $${shipment.shippingCost} USD is required prior to intake.`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onCollectPaymentClick}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
                >
                  {isAr ? 'تحصيل الدفع بالكاونتر' : 'Collect Payment'}
                </button>
              </div>
            )}
          </div>

          {/* 6. Customer Booking Notes */}
          {shipment.customerNotes && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                <FileWarning className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAr ? 'ملاحظات العميل أثناء الحجز:' : 'Customer Booking Notes:'}</span>
              </span>
              <p className="text-slate-800 text-xs italic bg-white p-3 rounded-xl border border-slate-200">
                "{shipment.customerNotes}"
              </p>
            </div>
          )}

          {/* 7. Shipment Lifecycle Timeline */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAr ? 'سجل مراحل الشحنة في النظام:' : 'Shipment Timeline:'}</span>
            </span>

            <div className="space-y-2.5 ps-2">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                <span className="font-medium text-slate-700 text-xs">
                  {isAr ? 'تم إنشاء الحجز وسداد الدفعة' : 'Order Created & Confirmed'}
                </span>
                <span className="text-[10px] text-slate-400 ms-auto">
                  {new Date(shipment.createdAt).toLocaleDateString(isAr ? 'ar-JO' : 'en-US')}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    isAlreadyReceived ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'
                  }`}
                />
                <span className="font-bold text-slate-900 text-xs">
                  {isAr ? 'بانتظار تسليم الطرد في فرع المنشأ' : 'Waiting for Origin Hub Drop-off'}
                </span>
                <span className="text-[10px] text-amber-700 font-bold ms-auto">
                  {isAlreadyReceived ? (isAr ? 'مكتمل' : 'Done') : (isAr ? 'المرحلة الحالية' : 'Current')}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    isAlreadyReceived ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-slate-300'
                  }`}
                />
                <span
                  className={`text-xs ${
                    isAlreadyReceived ? 'font-bold text-emerald-900' : 'text-slate-400'
                  }`}
                >
                  {isAr ? 'تم الاستلام الفعلي بالكاونتر (RECEIVED_AT_ORIGIN)' : 'Received at Origin Hub'}
                </span>
                {isAlreadyReceived && shipment.receivedAtOriginHubAt && (
                  <span className="text-[10px] text-slate-400 ms-auto">
                    {new Date(shipment.receivedAtOriginHubAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="text-xs text-slate-400">
                  {isAr ? 'محطة الفحص والوزن والختم الأمني' : 'Inspection & Certified Sealing'}
                </span>
                <span className="text-[10px] text-slate-400 ms-auto">{isAr ? 'المرحلة القادمة' : 'Next Step'}</span>
              </div>
            </div>
          </div>

          {/* 8. Desk Verification Checklist & Action Buttons */}
          {!isAlreadyReceived && !isWrongHub && !isCancelledOrRejected && (
            <div className="p-4 bg-amber-50/70 border-2 border-amber-300/80 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <h4 className="font-bold text-amber-950 flex items-center gap-1.5 text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-amber-700" />
                  <span>{isAr ? 'قائمة التحقق الإلزامية للاستلام بالكاونتر:' : 'Desk Intake Verification Checklist:'}</span>
                </h4>
                <span className="text-[10px] text-amber-800 font-bold">
                  {isChecklistComplete ? (isAr ? 'جاهز للاستلام ✅' : 'Ready') : (isAr ? 'حدد الشروط' : 'Pending')}
                </span>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2.5 p-2 bg-white/90 rounded-xl border border-amber-200/80 cursor-pointer hover:bg-white transition-colors">
                  <input
                    type="checkbox"
                    checked={checklist.identityVerified}
                    onChange={(e) =>
                      setChecklist((prev) => ({ ...prev, identityVerified: e.target.checked }))
                    }
                    className="w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-800 font-medium select-none">
                    {isAr
                      ? 'تم التحقق من هوية الشخص الحاضر ومطابقتها للمرسل أو وكيله'
                      : 'Customer physical identity verified matching registered sender'}
                  </span>
                </label>

                <label className="flex items-center gap-2.5 p-2 bg-white/90 rounded-xl border border-amber-200/80 cursor-pointer hover:bg-white transition-colors">
                  <input
                    type="checkbox"
                    checked={checklist.originHubMatches}
                    onChange={(e) =>
                      setChecklist((prev) => ({ ...prev, originHubMatches: e.target.checked }))
                    }
                    className="w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-800 font-medium select-none">
                    {isAr
                      ? 'مطابقة فرع المنشأ المعتمد في بوليصة الشحن مع هذا الفرع'
                      : 'Origin hub matches this operational branch'}
                  </span>
                </label>

                <label className="flex items-center gap-2.5 p-2 bg-white/90 rounded-xl border border-amber-200/80 cursor-pointer hover:bg-white transition-colors">
                  <input
                    type="checkbox"
                    checked={checklist.packagingIntact}
                    onChange={(e) =>
                      setChecklist((prev) => ({ ...prev, packagingIntact: e.target.checked }))
                    }
                    className="w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-800 font-medium select-none">
                    {isAr
                      ? 'استلام الطرد فعلياً على الكاونتر بحالة سليمة ظاهرياً وخالٍ من التسريب'
                      : 'Package physically delivered intact with no external damage or leaks'}
                  </span>
                </label>

                <label className="flex items-center gap-2.5 p-2 bg-white/90 rounded-xl border border-amber-200/80 cursor-pointer hover:bg-white transition-colors">
                  <input
                    type="checkbox"
                    checked={checklist.paymentConditionMet}
                    onChange={(e) =>
                      setChecklist((prev) => ({ ...prev, paymentConditionMet: e.target.checked }))
                    }
                    className="w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-800 font-medium select-none">
                    {isAr
                      ? 'استيفاء حالة السداد المالي (أو سيتم التحصيل الآن)'
                      : 'Payment status fulfilled or to be settled now'}
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  disabled={!canReceive}
                  onClick={onReceiveClick}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAr ? 'استلام الطرد (Receive Package)' : 'Confirm Desk Intake'}</span>
                </button>

                <button
                  type="button"
                  onClick={onRecordIssueClick}
                  className="py-3 px-3.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title={isAr ? 'تسجيل ملاحظة إذا كان الطرد تالفاً أو يسرب' : 'Record observation if damaged'}
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>{isAr ? 'تسجيل ملاحظة عند الاستلام' : 'Report Issue'}</span>
                </button>
              </div>

              {!hasIntakeRole && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    {isAr
                      ? 'صلاحية الاستلام الفعلي مخصصة لعمليات الفرع (HUB_AGENT / HUB_INSPECTOR / HUB_MANAGER). بصفتك مسؤول مالي يمكنك مراجعة الشحنة أو تحصيل المدفوعات فقط.'
                      : 'Physical intake is restricted to hub operations staff. Financial officers can inspect details or collect counter payments.'}
                  </span>
                </div>
              )}

              {hasIntakeRole && !isChecklistComplete && (
                <p className="text-[10px] text-amber-800 text-center font-medium">
                  {isAr
                    ? 'يرجى تأكيد جميع بنود التحقق أعلاه لتفعيل زر استلام الطرد.'
                    : 'Complete all checklist items to enable package reception.'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
