import React, { useState } from 'react';
import {
  Scale,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  Barcode,
  Tag,
  ArrowRight,
  Info,
  Maximize2,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Hub, Locale, Shipment, EmployeeNavSection } from '../../../types';
import { StatusBadge } from '../../common/StatusBadge';

interface InspectionWeightViewProps {
  currentHub: Hub;
  shipments: Shipment[];
  locale: Locale;
  onInspectShipment: (payload: any) => Promise<boolean>;
  onNavigate: (section: EmployeeNavSection) => void;
  onRefreshData: () => void;
}

export const InspectionWeightView: React.FC<InspectionWeightViewProps> = ({
  currentHub,
  shipments,
  locale,
  onInspectShipment,
  onNavigate,
  onRefreshData,
}) => {
  const isAr = locale === 'ar';

  // Filter parcels needing inspection at this hub
  const parcelsNeedingInspection = shipments.filter(
    (s) =>
      (s.originHubId === currentHub.id || !s.originHubId) &&
      (s.currentStatus === 'RECEIVED_AT_ORIGIN' ||
        s.currentStatus === 'RECEIVED_AT_ORIGIN_HUB' ||
        s.currentStatus === 'WEIGHT_DISCREPANCY_PENDING' ||
        s.currentStatus === 'WEIGHT_ADJUSTMENT_PENDING')
  );

  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    parcelsNeedingInspection[0] || null
  );

  // Form states
  const [actualWeightKg, setActualWeightKg] = useState<number>(
    selectedShipment ? selectedShipment.actualWeightKg || selectedShipment.estimatedWeightKg : 2.0
  );
  const [lengthCm, setLengthCm] = useState<number>(25);
  const [widthCm, setWidthCm] = useState<number>(15);
  const [heightCm, setHeightCm] = useState<number>(10);
  const [securitySealId, setSecuritySealId] = useState<string>(
    `SEAL-${currentHub.code}-${Math.floor(10000 + Math.random() * 90000)}`
  );
  const [packageCondition, setPackageCondition] = useState<'INTACT' | 'REPACKED' | 'EXTERNAL_WEAR'>('INTACT');
  const [inspectionNotes, setInspectionNotes] = useState(
    'تم فحص المحتويات ومطابقتها للشروط الجوية وخلوها من المواد الممنوعة.'
  );
  const [prohibitedCheckPassed, setProhibitedCheckPassed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync form when selected shipment changes
  React.useEffect(() => {
    if (selectedShipment) {
      setActualWeightKg(selectedShipment.actualWeightKg || selectedShipment.estimatedWeightKg || 2.0);
      setSecuritySealId(`SEAL-${currentHub.code}-${Math.floor(10000 + Math.random() * 90000)}`);
      setInspectionNotes('تم فحص المحتويات ومطابقتها للشروط الجوية وخلوها من المواد الممنوعة.');
      setProhibitedCheckPassed(true);
    }
  }, [selectedShipment, currentHub.code]);

  // Weight delta calculation
  const declaredKg = selectedShipment?.estimatedWeightKg || 0;
  const weightDifference = actualWeightKg - declaredKg;
  const isWeightDiscrepancy = Math.abs(weightDifference) > 0.4;

  // Pricing delta estimation based on 7.5 JOD or 1800 DZD per KG
  const pricePerKg = currentHub.currency === 'JOD' ? 7.5 : 1800;
  const priceDelta = Number((weightDifference * pricePerKg).toFixed(2));

  // Volumetric weight (L * W * H / 5000)
  const volumetricWeightKg = Number(((lengthCm * widthCm * heightCm) / 5000).toFixed(2));
  const chargeableWeight = Math.max(actualWeightKg, volumetricWeightKg);

  const handleApproveInspection = async () => {
    if (!selectedShipment) return;
    setIsSubmitting(true);
    setNotification(null);

    try {
      const payload = {
        shipmentId: selectedShipment.id,
        actualWeightKg,
        dimensionsCm: {
          length: lengthCm,
          width: widthCm,
          height: heightCm,
        },
        securitySealId,
        inspectionNotes,
        chargeableWeight,
        packageCondition,
        status: isWeightDiscrepancy ? 'WEIGHT_DISCREPANCY_PENDING' : 'INSPECTED_AND_SEALED',
        weightDiscrepancy: isWeightDiscrepancy
          ? {
              originalKg: declaredKg,
              actualKg: actualWeightKg,
              priceDelta,
              status: 'PENDING_CUSTOMER_APPROVAL',
            }
          : undefined,
      };

      const ok = await onInspectShipment(payload);
      if (ok) {
        if (isWeightDiscrepancy) {
          setNotification({
            type: 'success',
            message: isAr
              ? `تم تسجيل فارق وزن (+${weightDifference.toFixed(1)} كغم) للطرد [${selectedShipment.trackingNumber}]. تم إشعار العميل بفارق السعر (${priceDelta} ${currentHub.currency}).`
              : `Weight discrepancy recorded (+${weightDifference.toFixed(1)} kg) for [${selectedShipment.trackingNumber}]. Sent for customer approval.`,
          });
        } else {
          setNotification({
            type: 'success',
            message: isAr
              ? `تم اعتماد الفحص الأمني وتثبيت الختم [${securitySealId}] بنجاح. الطرد جاهز الآن للنقل.`
              : `Security inspection passed. Seal [${securitySealId}] attached. Package is ready for transport.`,
          });
        }
        onRefreshData();
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Error occurred during inspection submission',
      });
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
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <Scale className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-black text-slate-900">
              {isAr ? 'محطة الفحص الأمني والميزان المعتمد' : 'Security Inspection & Certified Scale Station'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'الوزن الدقيق، التحقق من المواد المحظورة، تثبيت الأختام الأمنية غير القابلة للعبث، ومطابقة الأبعاد الحجمية.'
              : 'Precision weighing, air safety compliance, tamper-evident seal installation, and volumetric metrics.'}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 text-xs font-bold text-teal-900">
          <span>{isAr ? 'الطرود بانتظار الفحص:' : 'Queue:'}</span>
          <span className="font-black text-sm">{parcelsNeedingInspection.length}</span>
        </div>
      </div>

      {/* Alert Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-bold">{notification.message}</span>
          </div>
          {notification.type === 'success' && !isWeightDiscrepancy && (
            <button
              type="button"
              onClick={() => onNavigate('READY_FOR_TRANSPORT')}
              className="px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold transition-colors cursor-pointer text-xs shrink-0"
            >
              {isAr ? 'عرض الطرود الجاهزة للنقل' : 'View Ready Packages'}
            </button>
          )}
        </div>
      )}

      {/* Two-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Queue of Parcels (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">
                {isAr ? 'طابور الفحص بالفرع' : 'Inspection Queue'} ({parcelsNeedingInspection.length})
              </span>
              <span className="text-[10px] text-slate-400">
                {isAr ? 'اضغط لاختيار الطرد' : 'Click to inspect'}
              </span>
            </div>

            {parcelsNeedingInspection.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <div className="text-xs font-bold text-slate-700">
                  {isAr ? 'طابور الفحص مكتمل حالياً' : 'Inspection queue clear'}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isAr ? 'يمكنك التوجه لكاونتر الاستلام لاستقبال شحنات جديدة' : 'Counter intake has pending packages'}
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('ORIGIN_INTAKE')}
                  className="mt-3 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                >
                  {isAr ? 'فتح كاونتر الاستقبال' : 'Go to Intake Desk'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {parcelsNeedingInspection.map((shipment) => {
                  const isSelected = selectedShipment?.id === shipment.id;
                  const hasDiscrepancy =
                    shipment.currentStatus === 'WEIGHT_DISCREPANCY_PENDING' ||
                    shipment.currentStatus === 'WEIGHT_ADJUSTMENT_PENDING';

                  return (
                    <div
                      key={shipment.id}
                      onClick={() => setSelectedShipment(shipment)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-teal-900">
                              {shipment.trackingNumber}
                            </span>
                            <StatusBadge status={shipment.currentStatus} locale={locale} size="sm" />
                          </div>
                          <div className="text-xs font-bold text-slate-900 mt-1">{shipment.itemDescription}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {isAr ? 'المرسل:' : 'Sender:'} {shipment.senderName} • {isAr ? 'المعلن:' : 'Decl:'}{' '}
                            <strong className="text-slate-800">{shipment.estimatedWeightKg} كغم</strong>
                          </div>
                        </div>

                        {hasDiscrepancy && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 shrink-0">
                            {isAr ? 'فارق وزن' : 'Weight Diff'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Inspection Workbench & Scale Controls (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>{isAr ? 'منضدة الفحص وتثبيت الختم الأمني' : 'Inspection Workbench & Sealing'}</span>
              </h2>

              {selectedShipment && (
                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {selectedShipment.trackingNumber}
                </span>
              )}
            </div>

            {!selectedShipment ? (
              <div className="p-12 text-center bg-slate-50 rounded-xl border border-slate-100 text-slate-400">
                <Scale className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <div className="text-xs font-bold text-slate-600">
                  {isAr ? 'اختر شحنة من القائمة لبدء الفحص' : 'Select a parcel to start inspection'}
                </div>
              </div>
            ) : (
              <div className="space-y-5 text-xs">
                {/* 1. Declared vs Actual Scale Reading */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 font-bold block mb-1">
                      {isAr ? 'الوزن المعلن (العميل)' : 'Declared Weight (Sender)'}
                    </span>
                    <div className="text-xl font-black text-slate-800">
                      {declaredKg} <span className="text-xs font-medium">كغم</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-teal-50/80 rounded-xl border border-teal-300 ring-1 ring-teal-300/40">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-teal-950 font-bold">
                        {isAr ? 'قراءة الميزان الفعلي' : 'Scale Reading (Hub)'}
                      </span>
                      <Scale className="w-3.5 h-3.5 text-teal-700" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        max="100"
                        value={actualWeightKg}
                        onChange={(e) => setActualWeightKg(parseFloat(e.target.value) || 0)}
                        className="w-20 p-1 font-black text-lg text-teal-900 bg-white border border-teal-300 rounded-lg text-center"
                      />
                      <span className="font-bold text-teal-900">كغم</span>
                    </div>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border ${
                      isWeightDiscrepancy
                        ? 'bg-rose-50 border-rose-300 text-rose-900'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <span className="text-[11px] font-bold block mb-1">
                      {isAr ? 'فارق الوزن والتكلفة' : 'Weight & Cost Delta'}
                    </span>
                    <div className="font-black text-lg">
                      {weightDifference > 0 ? `+${weightDifference.toFixed(2)}` : weightDifference.toFixed(2)}{' '}
                      <span className="text-xs font-medium">كغم</span>
                    </div>
                    {isWeightDiscrepancy && (
                      <div className="text-[10px] font-bold text-rose-700 mt-0.5">
                        {weightDifference > 0 ? '+' : ''}{priceDelta} {currentHub.currency}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Dimensions & Volumetric weight */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      {isAr ? 'أبعاد الطرد (سم) والوزن الحجمي:' : 'Dimensions (cm) & Volumetric Weight:'}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {isAr ? 'الوزن الحجمي المعتمد:' : 'Volumetric:'} <strong>{volumetricWeightKg} كغم</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500">{isAr ? 'الطول (L)' : 'Length'}</label>
                      <input
                        type="number"
                        value={lengthCm}
                        onChange={(e) => setLengthCm(parseInt(e.target.value) || 0)}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">{isAr ? 'العرض (W)' : 'Width'}</label>
                      <input
                        type="number"
                        value={widthCm}
                        onChange={(e) => setWidthCm(parseInt(e.target.value) || 0)}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">{isAr ? 'الارتفاع (H)' : 'Height'}</label>
                      <input
                        type="number"
                        value={heightCm}
                        onChange={(e) => setHeightCm(parseInt(e.target.value) || 0)}
                        className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-center font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Security Tamper-Evident Seal ID */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-800 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-teal-600" />
                      <span>{isAr ? 'رقم الختم الأمني المعتمد (Tamper-evident Seal ID):' : 'Tamper Seal Barcode ID:'}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setSecuritySealId(`SEAL-${currentHub.code}-${Math.floor(10000 + Math.random() * 90000)}`)
                      }
                      className="text-[11px] text-teal-700 hover:underline font-bold cursor-pointer"
                    >
                      {isAr ? 'توليد ختم جديد' : 'Generate New'}
                    </button>
                  </div>
                  <div className="relative">
                    <Barcode className="w-4 h-4 text-slate-400 absolute start-3 top-3" />
                    <input
                      type="text"
                      value={securitySealId}
                      onChange={(e) => setSecuritySealId(e.target.value)}
                      className="w-full ps-9 pe-3 py-2 bg-slate-50 border border-slate-300 font-mono font-black text-sm rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 text-slate-900"
                    />
                  </div>
                </div>

                {/* 4. Safety & Prohibited Items Checklist */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-800">{isAr ? 'فحص سلامة الطيران الجوي:' : 'Aviation Safety Check:'}</div>
                  <div className="space-y-1.5 text-[11px] text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prohibitedCheckPassed}
                        onChange={(e) => setProhibitedCheckPassed(e.target.checked)}
                        className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                      />
                      <span>
                        {isAr
                          ? 'أقر بخلو الطرد تماماً من السوائل القابلة للاشتعال، بطاريات الليثيوم المنفصلة، والأموال غير المصرح بها.'
                          : 'Package free of flammable liquids, loose lithium batteries, undeclared cash, or prohibited substances.'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* 5. Inspection Notes */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'ملاحظات وتوصيف الفحص:' : 'Inspection Notes:'}
                  </label>
                  <textarea
                    rows={2}
                    value={inspectionNotes}
                    onChange={(e) => setInspectionNotes(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isSubmitting || !prohibitedCheckPassed}
                    onClick={handleApproveInspection}
                    className={`w-full py-3 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                      isWeightDiscrepancy
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-teal-600 hover:bg-teal-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? (isAr ? 'جارِ اعتماد وتشفير الفحص...' : 'Recording Inspection...')
                        : isWeightDiscrepancy
                        ? (isAr ? 'توثيق فارق الوزن وإشعار العميل للموافقة' : 'Submit Weight Discrepancy (Notify Customer)')
                        : (isAr ? 'اعتماد الفحص وتثبيت الختم الأمني (جاهز للنقل)' : 'Approve & Seal Package (Ready for Transport)')}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
