import React, { useState } from 'react';
import {
  Handshake,
  UserCheck,
  CheckCircle2,
  Lock,
  QrCode,
  Scan,
  AlertTriangle,
  Plane,
  Scale,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Hub, Locale, Manifest, Shipment, Trip, EmployeeNavSection } from '../../../types';
import { QRModal } from '../../common/QRModal';
import { QRScannerModal } from '../../common/QRScannerModal';

interface TravelerHandoverViewProps {
  currentHub: Hub;
  manifests: Manifest[];
  shipments: Shipment[];
  locale: Locale;
  onHandoverDispatch: (payload: any) => Promise<boolean>;
  onNavigate: (section: EmployeeNavSection) => void;
  onRefreshData: () => void;
}

export const TravelerHandoverView: React.FC<TravelerHandoverViewProps> = ({
  currentHub,
  manifests,
  shipments,
  locale,
  onHandoverDispatch,
  onNavigate,
  onRefreshData,
}) => {
  const isAr = locale === 'ar';

  // Manifests ready for handover at this hub
  const pendingHandoverManifests = manifests.filter(
    (m) =>
      m.currentStatus === 'DRAFT' ||
      m.currentStatus === 'CREATED' ||
      m.currentStatus === 'AWAITING_TRAVELER_HANDOVER'
  );

  const [selectedManifest, setSelectedManifest] = useState<Manifest | null>(
    pendingHandoverManifests[0] || manifests[0] || null
  );

  // Stepper state: 1. Identity, 2. Seals Inspection, 3. Handover QR Token
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [sealsVerified, setSealsVerified] = useState(false);
  const [weightRechecked, setWeightRechecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToken, setSuccessToken] = useState<string | null>(null);

  const handleCompleteHandover = async () => {
    if (!selectedManifest) return;
    setIsSubmitting(true);

    try {
      const ok = await onHandoverDispatch({
        manifestId: selectedManifest.id,
        hubId: currentHub.id,
        travelerId: selectedManifest.assignedTravelerId || 'trav-1',
        dispatchedAt: new Date().toISOString(),
      });

      if (ok) {
        setSuccessToken(selectedManifest.handoverToken || `TOKEN-DISPATCH-${selectedManifest.id}`);
        setCurrentStep(3);
        onRefreshData();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Handshake className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-black text-slate-900">
              {isAr ? 'تسليم الطرود للمسافر المعتمد (Handover Station)' : 'Traveler Handover & Dispatch Station'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'إجراءات التسليم الميداني: التحقق من هوية المسافر، فحص سلامة الأختام، ومصادقة الرمز المشفر للرحلة.'
              : 'Physical handover: verify traveler ID, inspect parcel seals, and exchange cryptographic token.'}
          </p>
        </div>

        {selectedManifest && (
          <div className="text-end">
            <span className="text-[10px] text-slate-400 block">{isAr ? 'المانيفست المحدد:' : 'Selected Manifest:'}</span>
            <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {selectedManifest.manifestNumber || selectedManifest.id}
            </span>
          </div>
        )}
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                currentStep >= 1 ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              1
            </div>
            <span className="text-xs font-bold text-slate-800">
              {isAr ? 'التحقق من هوية المسافر' : 'Traveler ID'}
            </span>
          </div>

          <div className={`flex-1 h-0.5 mx-4 ${currentStep >= 2 ? 'bg-amber-500' : 'bg-slate-200'}`} />

          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                currentStep >= 2 ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              2
            </div>
            <span className="text-xs font-bold text-slate-800">
              {isAr ? 'مطابقة أختام الطرود والوزن' : 'Seals & Weight'}
            </span>
          </div>

          <div className={`flex-1 h-0.5 mx-4 ${currentStep >= 3 ? 'bg-amber-500' : 'bg-slate-200'}`} />

          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                currentStep === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              3
            </div>
            <span className="text-xs font-bold text-slate-800">
              {isAr ? 'التسليم والتشفير الرقمي' : 'Token Exchange'}
            </span>
          </div>
        </div>
      </div>

      {/* Handover Body */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
        {/* STEP 1: Traveler Verification */}
        {currentStep === 1 && (
          <div className="space-y-4 max-w-xl mx-auto text-xs">
            <div className="text-center pb-2">
              <h3 className="text-sm font-black text-slate-900">
                {isAr ? 'المرحلة 1: التحقق من الحضور الشخصي للمسافر' : 'Step 1: Traveler Identity Verification'}
              </h3>
              <p className="text-slate-500 mt-0.5">
                {isAr ? 'تأكد من مطابقة جواز سفر المسافر وتذكرة الطيران المؤكدة للرحلة' : 'Ensure valid passport and confirmed boarding flight'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'اسم المسافر المعتمد:' : 'Verified Traveler:'}</span>
                <strong className="text-slate-900">{selectedManifest?.assignedTravelerName || 'يوسف القاضي'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'الرحلة والشركة:' : 'Flight:'}</span>
                <span className="font-bold text-slate-900">{selectedManifest?.airline} ({selectedManifest?.flightNumber})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'عدد الطرود المخصصة:' : 'Assigned Parcels:'}</span>
                <span className="font-bold text-indigo-900">{selectedManifest?.totalShipmentsCount} طرد</span>
              </div>
            </div>

            <label className="flex items-center gap-2 p-3 bg-amber-50/70 border border-amber-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={identityVerified}
                onChange={(e) => setIdentityVerified(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="font-bold text-amber-950">
                {isAr
                  ? 'أؤكد حضور المسافر شخصياً ومطابقة هويته وجواز سفره وبيانات التذكرة للرحلة الجوية.'
                  : 'I verify traveler is present in person with valid passport and boarding ticket.'}
              </span>
            </label>

            <button
              type="button"
              disabled={!identityVerified}
              onClick={() => setCurrentStep(2)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer text-xs flex items-center justify-center gap-2"
            >
              <span>{isAr ? 'الانتقال لفحص الأختام والوزن' : 'Proceed to Seals Verification'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Seals Inspection & Weight Confirmation */}
        {currentStep === 2 && (
          <div className="space-y-4 max-w-xl mx-auto text-xs">
            <div className="text-center pb-2">
              <h3 className="text-sm font-black text-slate-900">
                {isAr ? 'المرحلة 2: تدقيق الأختام الأمنية ووزن حقيبة النقل' : 'Step 2: Seals Integrity & Luggage Weight Check'}
              </h3>
              <p className="text-slate-500 mt-0.5">
                {isAr ? 'التأكد من سلامة جميع أختام الطرود المدرجة في المانيفست' : 'Inspect all parcel tamper-evident seals before bag closure'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'إجمالي وزن الطرود بالمانيفست:' : 'Manifest Total Weight:'}</span>
                <span className="font-black text-emerald-700 text-sm">{selectedManifest?.totalWeightKg} كغم</span>
              </div>
              <div className="text-[11px] text-slate-500">
                {isAr ? 'يجب وضع الطرود في حقيبة THOUESA المخصصة للنقل الجوي وتثبيت الختم الرئيسي للحقيبة.' : 'Place sealed packages inside authorized THOUESA travel bag.'}
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 p-3 bg-teal-50/70 border border-teal-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={sealsVerified}
                  onChange={(e) => setSealsVerified(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="font-bold text-teal-950">
                  {isAr
                    ? 'تم فحص أختام جميع الطرود والتأكد من عدم تعرضها لأي فتح أو تمزق.'
                    : 'All security seals verified intact and undamaged.'}
                </span>
              </label>

              <label className="flex items-center gap-2 p-3 bg-teal-50/70 border border-teal-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={weightRechecked}
                  onChange={(e) => setWeightRechecked(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="font-bold text-teal-950">
                  {isAr
                    ? 'تم إعادة وزن الحقيبة الكلية على ميزان الفرع ومطابقتها للوزن المصرح.'
                    : 'Total luggage weighed on hub scale and matches airline limits.'}
                </span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer text-xs"
              >
                {isAr ? 'رجوع' : 'Back'}
              </button>

              <button
                type="button"
                disabled={!sealsVerified || !weightRechecked || isSubmitting}
                onClick={handleCompleteHandover}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer text-xs flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <span>
                  {isSubmitting
                    ? (isAr ? 'جارِ توثيق التسليم وإصدار التوقيع...' : 'Recording Handover...')
                    : (isAr ? 'تأكيد التسليم وتوليد رمز الرحلة (DISPATCH)' : 'Confirm Handover & Issue Token (DISPATCH)')}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Cryptographic Token Display & Finished */}
        {currentStep === 3 && (
          <div className="space-y-4 max-w-md mx-auto text-center text-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900">
              {isAr ? 'تم تسليم المانيفست للمسافر بنجاح!' : 'Manifest Dispatched to Traveler!'}
            </h3>
            <p className="text-slate-500">
              {isAr
                ? 'أصبحت الطرود الآن في عهدة المسافر تحت مسار النقل الجوي (IN_TRANSIT_AIR). تم إشعار فرع الوصول برقم المانيفست.'
                : 'Parcels are in traveler custody under flight transit. Destination hub notified.'}
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs space-y-2">
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                {isAr ? 'رمز التسليم المشفر (HMAC Token):' : 'HMAC Handover Token:'}
              </span>
              <div className="font-bold text-slate-900 break-all p-2 bg-white rounded border border-slate-200">
                {successToken}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('OPERATIONS_DASHBOARD')}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer text-xs"
            >
              {isAr ? 'العودة للوحة العمليات' : 'Return to Operations Command'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
