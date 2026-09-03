import React, { useState } from 'react';
import {
  CheckCheck,
  Search,
  Filter,
  ArrowRight,
  Split,
  FileSpreadsheet,
  Lock,
  Scale,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Hub, Locale, Shipment, EmployeeNavSection } from '../../../types';
import { StatusBadge } from '../../common/StatusBadge';

interface ReadyForTransportViewProps {
  currentHub: Hub;
  shipments: Shipment[];
  locale: Locale;
  onNavigate: (section: EmployeeNavSection) => void;
}

export const ReadyForTransportView: React.FC<ReadyForTransportViewProps> = ({
  currentHub,
  shipments,
  locale,
  onNavigate,
}) => {
  const isAr = locale === 'ar';
  const [searchQuery, setSearchQuery] = useState('');

  // Parcels that are inspected and sealed, waiting for transport
  const readyParcels = shipments.filter(
    (s) =>
      (s.originHubId === currentHub.id || !s.originHubId) &&
      (s.currentStatus === 'INSPECTED_AND_SEALED' || s.currentStatus === 'INSPECTED_SEALED')
  );

  const filtered = readyParcels.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.trackingNumber.toLowerCase().includes(q) ||
      s.securitySealId?.toLowerCase().includes(q) ||
      s.itemDescription.toLowerCase().includes(q) ||
      s.senderName.toLowerCase().includes(q)
    );
  });

  const totalReadyWeight = Number(
    filtered.reduce((sum, s) => sum + (s.actualWeightKg || s.estimatedWeightKg || 0), 0).toFixed(1)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
              <CheckCheck className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-black text-slate-900">
              {isAr ? 'الطرود الجاهزة للنقل الجوي' : 'Ready for Air Transport'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'الطرود التي اجتازت الفحص الأمني، تم ختمها، وبانتظار المطابقة أو الإدراج في مانيفست رحلة معتمدة.'
              : 'Inspected and sealed parcels ready for matching and manifest allocation.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('MATCHING')}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Split className="w-4 h-4" />
            <span>{isAr ? 'المطابقة مع الرحلات' : 'Smart Match'}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('MANIFESTS')}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>{isAr ? 'بناء المانيفست' : 'Build Manifest'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500">{isAr ? 'إجمالي الطرود الجاهزة:' : 'Ready Parcels:'}</span>
          <div className="text-2xl font-black text-indigo-900 mt-1">{filtered.length}</div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500">{isAr ? 'الوزن الإجمالي الجاهز:' : 'Total Ready Weight:'}</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{totalReadyWeight} <span className="text-xs">كغم</span></div>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500">{isAr ? 'متوسط وزن الطرد:' : 'Avg Package Weight:'}</span>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {filtered.length > 0 ? (totalReadyWeight / filtered.length).toFixed(1) : 0} <span className="text-xs">كغم</span>
          </div>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث برقم التتبع أو الختم الأمني...' : 'Search tracking # or seal ID...'}
              className="w-full ps-9 pe-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <span className="text-xs font-bold text-slate-500">
            {filtered.length} {isAr ? 'طرد جاهز' : 'ready parcels'}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <div className="text-xs font-bold text-slate-600">
              {isAr ? 'لا توجد طرود بانتظار النقل حالياً' : 'No parcels ready for transport'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isAr ? 'قم بفحص وختم الطرود من شاشة الفحص والوزن' : 'Inspect and seal parcels in the inspection station'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-start">{isAr ? 'رقم التتبع' : 'Tracking #'}</th>
                  <th className="p-3 text-start">{isAr ? 'المحتوى' : 'Item Description'}</th>
                  <th className="p-3 text-start">{isAr ? 'الختم الأمني' : 'Security Seal ID'}</th>
                  <th className="p-3 text-start">{isAr ? 'الوزن الفعلي' : 'Actual Weight'}</th>
                  <th className="p-3 text-start">{isAr ? 'المستلم والوجهة' : 'Destination / Recipient'}</th>
                  <th className="p-3 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="p-3 text-center">{isAr ? 'الإجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-black text-indigo-700">{s.trackingNumber}</td>
                    <td className="p-3 font-medium max-w-xs truncate">{s.itemDescription}</td>
                    <td className="p-3 font-mono font-bold text-teal-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>{s.securitySealId || '—'}</span>
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      {s.actualWeightKg || s.estimatedWeightKg} كغم
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{s.recipientName}</div>
                      <div className="text-[11px] text-slate-400">{s.recipientAddress}</div>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={s.currentStatus} locale={locale} size="sm" />
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => onNavigate('MATCHING')}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                      >
                        {isAr ? 'ربط برحلة' : 'Match'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
