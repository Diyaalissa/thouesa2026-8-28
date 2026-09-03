import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Plane,
  QrCode,
  Lock,
  CheckCircle2,
  Printer,
  Search,
  ArrowRight,
  Handshake,
} from 'lucide-react';
import { Hub, Locale, Manifest, Shipment, Trip, EmployeeNavSection } from '../../../types';
import { QRModal } from '../../common/QRModal';

interface ManifestsViewProps {
  currentHub: Hub;
  manifests: Manifest[];
  shipments: Shipment[];
  trips: Trip[];
  locale: Locale;
  onCreateManifest: (payload: any) => Promise<boolean>;
  onNavigate: (section: EmployeeNavSection) => void;
  onRefreshData: () => void;
}

export const ManifestsView: React.FC<ManifestsViewProps> = ({
  currentHub,
  manifests,
  shipments,
  trips,
  locale,
  onCreateManifest,
  onNavigate,
  onRefreshData,
}) => {
  const isAr = locale === 'ar';
  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');
  const [selectedManifestForQr, setSelectedManifestForQr] = useState<Manifest | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string>(trips[0]?.id || '');
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Ready parcels for manifest
  const readyParcels = shipments.filter(
    (s) =>
      (s.originHubId === currentHub.id || !s.originHubId) &&
      (s.currentStatus === 'INSPECTED_AND_SEALED' ||
        s.currentStatus === 'INSPECTED_SEALED' ||
        s.currentStatus === 'ASSIGNED_TO_TRIP')
  );

  const handleCreateManifestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTripId || selectedShipmentIds.length === 0) return;

    setIsSubmitting(true);
    setSuccessMsg('');
    try {
      const selectedTrip = trips.find((t) => t.id === selectedTripId);
      const manifestId = `MF-${currentHub.code}-${Date.now().toString().slice(-6)}`;
      const totalWeightKg = shipments
        .filter((s) => selectedShipmentIds.includes(s.id))
        .reduce((sum, s) => sum + (s.actualWeightKg || s.estimatedWeightKg || 0), 0);

      const ok = await onCreateManifest({
        manifestId,
        tripId: selectedTripId,
        travelerId: selectedTrip?.travelerId || 'trav-1',
        travelerName: selectedTrip?.travelerName || 'Traveler',
        airline: selectedTrip?.airline || 'Airline',
        flightNumber: selectedTrip?.flightNumber || 'FLIGHT',
        shipmentIds: selectedShipmentIds,
        totalWeightKg,
        originHubId: currentHub.id,
      });

      if (ok) {
        setSuccessMsg(
          isAr
            ? `تم إنشاء المانيفست المشفر [${manifestId}] بنجاح، وتوليد رمز QR للتسليم.`
            : `Manifest [${manifestId}] generated successfully with cryptographic handover token.`
        );
        setActiveTab('LIST');
        setSelectedShipmentIds([]);
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
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-black text-slate-900">
              {isAr ? 'المانيفست الجوي ومطابقة الرحلات' : 'Flight Manifest & Traveler Dispatch'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'إنشاء مانيفست الرحلة المشفر، توثيق الطرود المحمولة مع المسافر، وإصدار توقيع الاستلام الرقمي.'
              : 'Official cryptographic flight manifest creation, traveler assignment, and digital dispatch.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'LIST' ? (
            <button
              type="button"
              onClick={() => setActiveTab('CREATE')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إنشاء مانيفست جديد' : 'New Manifest'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('LIST')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              {isAr ? 'عرض قائمة المانيفستات' : 'View Manifests List'}
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('TRAVELER_HANDOVER')}
            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold transition-colors cursor-pointer text-xs shrink-0"
          >
            {isAr ? 'بدء إجراءات تسليم المسافر' : 'Go to Traveler Handover'}
          </button>
        </div>
      )}

      {/* CREATE TAB: Manifest Builder */}
      {activeTab === 'CREATE' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            {isAr ? 'بناء وتشفير مانيفست الرحلة الجوية' : 'Flight Manifest Builder Form'}
          </h2>

          <form onSubmit={handleCreateManifestSubmit} className="space-y-5 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                {isAr ? 'اختر رحلة المسافر المعتمد:' : 'Select Verified Flight:'}
              </label>
              <select
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.travelerName} • {t.airline} ({t.flightNumber}) • السعة: {t.availableWeightKg} كغم • PNR: {t.pnrCode}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-2">
                {isAr ? 'اختر الطرود المفحوصة والمختومة لضمها للمانيفست:' : 'Select Inspected Packages for this Manifest:'}
              </label>

              {readyParcels.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500">
                  {isAr ? 'لا توجد طرود مفحوصة جاهزة للمانيفست حالياً' : 'No inspected parcels ready for manifest'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-1">
                  {readyParcels.map((shipment) => {
                    const isChecked = selectedShipmentIds.includes(shipment.id);
                    return (
                      <div
                        key={shipment.id}
                        onClick={() => {
                          setSelectedShipmentIds((prev) =>
                            isChecked ? prev.filter((id) => id !== shipment.id) : [...prev, shipment.id]
                          );
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                          isChecked
                            ? 'bg-amber-50/80 border-amber-400 ring-1 ring-amber-400 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="mt-0.5 w-4 h-4 text-amber-600 rounded-sm"
                        />
                        <div className="flex-1 text-xs">
                          <div className="flex justify-between font-bold text-slate-900 mb-1">
                            <span className="font-mono">{shipment.trackingNumber}</span>
                            <span className="text-emerald-700">
                              {shipment.actualWeightKg || shipment.estimatedWeightKg} كغم
                            </span>
                          </div>
                          <p className="text-slate-600 truncate mb-1">{shipment.itemDescription}</p>
                          <div className="text-[11px] text-teal-700 font-mono flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>{shipment.securitySealId}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || selectedShipmentIds.length === 0}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>
                {isSubmitting
                  ? (isAr ? 'جارِ إنشاء المانيفست وتشفيره...' : 'Generating Manifest...')
                  : (isAr ? `إصدار المانيفست وتشفير (${selectedShipmentIds.length}) طرد` : `Issue Manifest with (${selectedShipmentIds.length}) Parcels`)}
              </span>
            </button>
          </form>
        </div>
      )}

      {/* LIST TAB: Active Manifests Table */}
      {activeTab === 'LIST' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              {isAr ? 'المانيفستات الصادرة والنشطة' : 'Active Manifests'} ({manifests.length})
            </span>
          </div>

          {manifests.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <div className="font-bold text-slate-700">
                {isAr ? 'لا توجد مانيفستات مصدرة بعد' : 'No manifests issued yet'}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-start">{isAr ? 'رقم المانيفست' : 'Manifest #'}</th>
                    <th className="p-3 text-start">{isAr ? 'المسافر والرحلة' : 'Traveler & Flight'}</th>
                    <th className="p-3 text-start">{isAr ? 'عدد الطرود' : 'Parcels'}</th>
                    <th className="p-3 text-start">{isAr ? 'الوزن الإجمالي' : 'Total Weight'}</th>
                    <th className="p-3 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="p-3 text-center">{isAr ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {manifests.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900">{m.manifestNumber || m.id}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{m.assignedTravelerName || 'يوسف القاضي'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {m.airline || 'Royal Jordanian'} ({m.flightNumber || 'RJ-511'})
                        </div>
                      </td>
                      <td className="p-3 font-bold text-indigo-900">{m.totalShipmentsCount} {isAr ? 'طرد' : 'items'}</td>
                      <td className="p-3 font-bold text-emerald-700">{m.totalWeightKg} كغم</td>
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {m.currentStatus}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedManifestForQr(m)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                            title={isAr ? 'عرض رمز QR المشفر' : 'View QR Token'}
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigate('TRAVELER_HANDOVER')}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
                          >
                            {isAr ? 'تسليم المسافر' : 'Handover'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* QR Modal */}
      {selectedManifestForQr && (
        <QRModal
          isOpen={!!selectedManifestForQr}
          onClose={() => setSelectedManifestForQr(null)}
          token={selectedManifestForQr.handoverToken || selectedManifestForQr.id}
          title={isAr ? `رمز الاستلام المشفر — ${selectedManifestForQr.manifestNumber || selectedManifestForQr.id}` : `Manifest Handover QR`}
          description={isAr ? 'امسح هذا الرمز من تطبيق المسافر أو فرع الوصول لمصادقة التسليم الأمني.' : 'Scan via traveler app or destination hub to verify handover.'}
          locale={locale}
        />
      )}
    </div>
  );
};
