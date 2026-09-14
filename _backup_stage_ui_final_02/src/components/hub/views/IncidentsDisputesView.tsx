import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Search,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Hub, Locale, OperationalIncident, EmployeeNavSection, IncidentCategory, IncidentPriority } from '../../../types';
import { INITIAL_INCIDENTS } from '../../../lib/hubOperationsData';

interface IncidentsDisputesViewProps {
  currentHub: Hub;
  locale: Locale;
  onNavigate: (section: EmployeeNavSection) => void;
}

export const IncidentsDisputesView: React.FC<IncidentsDisputesViewProps> = ({
  currentHub,
  locale,
  onNavigate,
}) => {
  const isAr = locale === 'ar';
  const [incidents, setIncidents] = useState<OperationalIncident[]>(INITIAL_INCIDENTS);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<OperationalIncident | null>(null);

  // New incident form state
  const [category, setCategory] = useState<IncidentCategory>('SEAL_MISMATCH');
  const [priority, setPriority] = useState<IncidentPriority>('HIGH');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const incNum = `INC-${Date.now().toString().slice(-4)}`;
    const newInc: OperationalIncident = {
      id: incNum,
      incidentNumber: incNum,
      hubId: currentHub.id,
      hubName: currentHub.nameAr,
      category,
      priority,
      trackingNumber: trackingNumber || undefined,
      description,
      evidencePhotos: [],
      assignedEmployeeId: 'EMP-SEC-01',
      assignedEmployeeName: isAr ? 'ضابط الأمن المناوب' : 'Duty Security Officer',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIncidents([newInc, ...incidents]);
    setShowLogModal(false);
    setDescription('');
    setTrackingNumber('');
  };

  const handleResolveIncident = (incidentId: string) => {
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === incidentId
          ? {
              ...i,
              status: 'RESOLVED',
              updatedAt: new Date().toISOString(),
              resolutionNotes: isAr
                ? 'تم فحص الشحنة ومطابقتها بالتنسيق مع قسم الجودة، وإعادة الختم بختم معتمد جديد.'
                : 'Inspected with QA and resealed with authorized replacement seal.',
            }
          : i
      )
    );
    if (selectedIncident?.id === incidentId) {
      setSelectedIncident(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-black text-slate-900">
              {isAr ? 'سجل الوقائع التشغيلية وحل النزاعات' : 'Operational Incidents & Dispute Resolution'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'توثيق وتتبع بلاغات عبث الأختام، فروقات الأوزان، تأخير الرحلات الجوية، والتعويضات التأمينية.'
              : 'Log and resolve tampered seals, weight discrepancies, flight cancellations, and claims.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowLogModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'تسجيل واقعة جديدة' : 'Log Incident'}</span>
        </button>
      </div>

      {/* Incidents List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            {isAr ? 'الوقائع المسجلة' : 'Recorded Incidents'} ({incidents.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 text-start">{isAr ? 'رقم الواقعة' : 'Incident ID'}</th>
                <th className="p-3 text-start">{isAr ? 'التصنيف' : 'Category'}</th>
                <th className="p-3 text-start">{isAr ? 'الأولوية' : 'Priority'}</th>
                <th className="p-3 text-start">{isAr ? 'المرجع (رقم التتبع)' : 'Tracking #'}</th>
                <th className="p-3 text-start">{isAr ? 'الوصف' : 'Description'}</th>
                <th className="p-3 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="p-3 text-center">{isAr ? 'الإجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-900">{inc.incidentNumber || inc.id}</td>
                  <td className="p-3 font-bold text-slate-700">{inc.category}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inc.priority === 'HIGH'
                          ? 'bg-rose-100 text-rose-800'
                          : inc.priority === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {inc.priority}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-600 font-bold">{inc.trackingNumber || inc.flightNumber || '-'}</td>
                  <td className="p-3 text-slate-700 max-w-xs truncate">{inc.description}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inc.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inc.status === 'ACTION_REQUIRED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inc.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {inc.status !== 'RESOLVED' ? (
                      <button
                        type="button"
                        onClick={() => handleResolveIncident(inc.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
                      >
                        {isAr ? 'تسوية وحل' : 'Resolve'}
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-bold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isAr ? 'محلولة' : 'Closed'}</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl max-w-md w-full space-y-4 text-xs animate-in zoom-in-95">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{isAr ? 'تسجيل بلاغ واقعة تشغيلية جديدة' : 'Log New Operational Incident'}</span>
            </h3>

            <form onSubmit={handleCreateIncident} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'تصنيف الواقعة:' : 'Incident Category:'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="SEAL_MISMATCH">{isAr ? 'شبهة عبث أو عدم تطابق الختم' : 'Seal Mismatch / Tampered'}</option>
                  <option value="WEIGHT_DIFFERENCE">{isAr ? 'فارق كبير في الوزن' : 'Weight Discrepancy'}</option>
                  <option value="PROHIBITED_ITEM">{isAr ? 'اكتشاف مواد محظورة' : 'Prohibited Item Discovered'}</option>
                  <option value="DAMAGED_PACKAGE">{isAr ? 'تلف في محتويات الطرد' : 'Damaged Package'}</option>
                  <option value="TRAVELER_DELAY">{isAr ? 'تأخير أو إلغاء رحلة المسافر' : 'Traveler Delay / Cancel'}</option>
                  <option value="CUSTOMS_HOLD">{isAr ? 'حجز جمركي في المطار' : 'Customs Hold'}</option>
                  <option value="OTHER">{isAr ? 'أخرى' : 'Other'}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'درجة الخطورة والأولوية:' : 'Priority / Severity:'}
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as IncidentPriority)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="HIGH">{isAr ? 'عالية (حرجة)' : 'High / Critical'}</option>
                  <option value="MEDIUM">{isAr ? 'متوسطة' : 'Medium'}</option>
                  <option value="LOW">{isAr ? 'منخفضة' : 'Low'}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'رقم التتبع أو الرحلة (اختياري):' : 'Reference (Tracking / Flight #):'}
                </label>
                <input
                  type="text"
                  placeholder="TH-AMM-ALG-..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'شرح الواقعة بالتفصيل:' : 'Description:'}
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={isAr ? 'أدخل تفاصيل الواقعة والإجراء المتخذ...' : 'Enter details and actions taken...'}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  {isAr ? 'تسجيل الواقعة' : 'Save Incident'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
