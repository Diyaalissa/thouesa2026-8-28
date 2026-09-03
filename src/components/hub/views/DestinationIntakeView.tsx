import React, { useState } from 'react';
import {
  ArrowDownToLine,
  Scan,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Boxes,
  UserCheck,
  Search,
  Sparkles,
} from 'lucide-react';
import { Hub, Locale, Manifest, Shipment, EmployeeNavSection } from '../../../types';
import { QRScannerModal } from '../../common/QRScannerModal';

interface DestinationIntakeViewProps {
  currentHub: Hub;
  shipments: Shipment[];
  manifests: Manifest[];
  locale: Locale;
  onDestinationIntake: (payload: any) => Promise<boolean>;
  onNavigate: (section: EmployeeNavSection) => void;
  onRefreshData: () => void;
}

export const DestinationIntakeView: React.FC<DestinationIntakeViewProps> = ({
  currentHub,
  shipments,
  manifests,
  locale,
  onDestinationIntake,
  onNavigate,
  onRefreshData,
}) => {
  const isAr = locale === 'ar';
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedManifestId, setSelectedManifestId] = useState<string>('');
  const [sealCheckIntact, setSealCheckIntact] = useState(true);
  const [intakeNotes, setIntakeNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Shipments arriving at this destination hub
  const incomingShipments = shipments.filter(
    (s) =>
      s.destinationHubId === currentHub.id &&
      (s.currentStatus === 'IN_TRANSIT' ||
        s.currentStatus === 'IN_TRANSIT_AIR' ||
        s.currentStatus === 'IN_FLIGHT' ||
        s.currentStatus === 'CUSTOMS_CLEARANCE')
  );

  const handleScanToken = (token: string) => {
    setScannerOpen(false);
    // Find manifest matching token
    const matched = manifests.find(
      (m) => m.handoverToken === token || m.id === token || m.manifestNumber === token
    );
    if (matched) {
      setSelectedManifestId(matched.id);
    }
  };

  const handleConfirmIntake = async () => {
    if (incomingShipments.length === 0) return;
    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const ok = await onDestinationIntake({
        hubId: currentHub.id,
        manifestId: selectedManifestId || manifests[0]?.id || 'MF-DEST-IN',
        receivedByEmployeeId: 'EMP-DEST-01',
        sealsIntact: sealCheckIntact,
        notes: intakeNotes || (isAr ? `تم الاستلام في فرع وصول ${currentHub.nameAr} وسلامة الأختام.` : `Received at destination ${currentHub.nameEn}`),
      });

      if (ok) {
        setSuccessMessage(
          isAr
            ? `تم تأكيد وصول واستقبال (${incomingShipments.length}) طرد في فرع ${currentHub.nameAr} بنجاح، ونقلها لمرحلة التجهيز للاستلام.`
            : `Destination intake confirmed for (${incomingShipments.length}) parcels. Shifted to pickup shelf preparation.`
        );
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
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <ArrowDownToLine className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-black text-slate-900">
              {isAr ? 'استقبال وصول الرحلات الجوية (Destination Intake)' : 'Destination Hub Flight Arrival Intake'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'استلام الطرود الواصلة مع المسافرين في مطار الوجهة، فحص الأختام الأمنية، وتجهيزها للتسليم النهائي للعملاء.'
              : 'Receive arriving traveler manifests, verify tamper seals integrity, and queue for recipient pickup.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
        >
          <Scan className="w-4 h-4 text-amber-400" />
          <span>{isAr ? 'مسح رمز مانيفست المسافر' : 'Scan Traveler Manifest QR'}</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('PICKUP_PREPARATION')}
            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold transition-colors cursor-pointer text-xs shrink-0"
          >
            {isAr ? 'تجهيز الرفوف واستلام العميل' : 'Proceed to Shelf Allocation'}
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Incoming Shipments List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">
                {isAr ? 'الطرود القادمة في رحلات الطيران النشطة' : 'Arriving Flight Parcels'} ({incomingShipments.length})
              </span>
            </div>

            {incomingShipments.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <div className="font-bold text-slate-700">
                  {isAr ? 'لا توجد طرود في مسار النقل الجوي حالياً' : 'No parcels currently in flight transit'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isAr ? 'جميع الطرود الواصلة تم استقبالها وفحصها' : 'All arriving packages processed'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {incomingShipments.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 text-xs flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-900">{s.trackingNumber}</span>
                        <span className="font-mono text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>{s.securitySealId}</span>
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900 mt-1">{s.itemDescription}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {isAr ? 'المسافر:' : 'Traveler:'} {s.assignedTravelerName || 'يوسف القاضي'} •{' '}
                        {s.actualWeightKg || s.estimatedWeightKg} كغم
                      </div>
                    </div>

                    <div className="text-end">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                        {s.currentStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Intake Actions (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>{isAr ? 'إجراءات استلام الوصول وفحص الأختام' : 'Destination Intake Controls'}</span>
            </h2>

            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-2 p-3 bg-blue-50/70 border border-blue-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={sealCheckIntact}
                  onChange={(e) => setSealCheckIntact(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="font-bold text-blue-950">
                  {isAr
                    ? 'أؤكد مطابقة أرقام الأختام الأمنية وسلامتها بنسبة 100% دون أي عبث.'
                    : 'I verify all security seals match manifest and are 100% intact.'}
                </span>
              </label>

              {!sealCheckIntact && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>{isAr ? 'تنبيه أمني: شبهة عبث بالختم' : 'Security Alert: Seal Tampered'}</span>
                  </div>
                  <p>
                    {isAr
                      ? 'سيتم تسجيل واقعة اشتباه تلقائياً وفتح تحقيق فوري بين فرع المنشأ وفرع الوصول.'
                      : 'An operational incident will be automatically flagged for dual-hub investigation.'}
                  </p>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'ملاحظات استلام الوصول:' : 'Destination Arrival Notes:'}
                </label>
                <textarea
                  rows={3}
                  value={intakeNotes}
                  onChange={(e) => setIntakeNotes(e.target.value)}
                  placeholder={isAr ? 'تم استلام الشحنات من المسافر في المطار بسلامة كاملة...' : 'Arrived safely from flight...'}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <button
                type="button"
                disabled={incomingShipments.length === 0 || isSubmitting}
                onClick={handleConfirmIntake}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? (isAr ? 'جارِ توثيق الوصول...' : 'Confirming Intake...')
                    : (isAr ? 'تأكيد استلام الطرود بفرع الوصول (RECEIVED_DEST)' : 'Confirm Destination Arrival Intake')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scanner Modal */}
      {scannerOpen && (
        <QRScannerModal
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScanSuccess={handleScanToken}
          locale={locale}
          title={isAr ? 'مسح رمز المانيفست أو ختم الطرد' : 'Scan Manifest or Seal QR'}
        />
      )}
    </div>
  );
};
