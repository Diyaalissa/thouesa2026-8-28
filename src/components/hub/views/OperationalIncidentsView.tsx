import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Plus, 
  Package, 
  Plane, 
  FileSpreadsheet, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  ShieldAlert,
  MessageSquare,
  Paperclip,
  User,
  Building2,
  Calendar
} from 'lucide-react';
import { Hub, IncidentCategory, IncidentPriority, IncidentStatus, Locale, OperationalIncident, User as UserType } from '../../../types';
import { StatusBadge } from '../common/StatusBadge';
import { DetailsDrawer } from '../common/DetailsDrawer';

export interface OperationalIncidentsViewProps {
  incidents: OperationalIncident[];
  currentHub: Hub;
  currentUser: UserType;
  locale: Locale;
  onCreateIncident?: (incident: Partial<OperationalIncident>) => void;
  onUpdateIncidentStatus?: (incidentId: string, status: IncidentStatus, note?: string) => void;
}

export const OperationalIncidentsView: React.FC<OperationalIncidentsViewProps> = ({
  incidents,
  currentHub,
  currentUser,
  locale,
  onCreateIncident,
  onUpdateIncidentStatus,
}) => {
  const isAr = locale === 'ar';

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Incident details drawer
  const [selectedIncident, setSelectedIncident] = useState<OperationalIncident | null>(null);

  // New Incident Drawer
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<IncidentCategory>('WEIGHT_DIFFERENCE');
  const [newPriority, setNewPriority] = useState<IncidentPriority>('HIGH');
  const [newTrackingNumber, setNewTrackingNumber] = useState('');
  const [newFlightNumber, setNewFlightNumber] = useState('');
  const [newManifestId, setNewManifestId] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Action Note Modal / Input inside drawer
  const [actionNote, setActionNote] = useState('');

  const getCategoryLabel = (cat: IncidentCategory) => {
    switch (cat) {
      case 'WEIGHT_DIFFERENCE': return isAr ? 'فارق وزن' : 'Weight Difference';
      case 'PROHIBITED_ITEM': return isAr ? 'مواد ممنوعة' : 'Prohibited Item';
      case 'DAMAGED_PACKAGE': return isAr ? 'طرد متضرر' : 'Damaged Package';
      case 'SEAL_MISMATCH': return isAr ? 'عدم تطابق الختم' : 'Seal Mismatch';
      case 'MISSING_PACKAGE': return isAr ? 'طرد مفقود' : 'Missing Package';
      case 'TRAVELER_CANCELLATION': return isAr ? 'إلغاء رحلة مسافر' : 'Traveler Cancellation';
      case 'TRAVELER_DELAY': return isAr ? 'تأخر المسافر' : 'Traveler Delay';
      case 'MANIFEST_DIFFERENCE': return isAr ? 'اختلاف مانيفست' : 'Manifest Difference';
      case 'CUSTOMS_HOLD': return isAr ? 'حجز جمركي' : 'Customs Hold';
      case 'IDENTITY_ISSUE': return isAr ? 'إشكال هوية' : 'Identity Issue';
      default: return isAr ? 'أخرى' : 'Other';
    }
  };

  const getPriorityBadge = (pri: IncidentPriority) => {
    switch (pri) {
      case 'HIGH':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">{isAr ? 'عالية' : 'HIGH'}</span>;
      case 'MEDIUM':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">{isAr ? 'متوسطة' : 'MED'}</span>;
      case 'LOW':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">{isAr ? 'منخفضة' : 'LOW'}</span>;
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (selectedCategory !== 'ALL' && inc.category !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && inc.status !== selectedStatus) return false;
    if (selectedPriority !== 'ALL' && inc.priority !== selectedPriority) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = inc.incidentNumber.toLowerCase().includes(q);
      const matchTrack = (inc.trackingNumber || '').toLowerCase().includes(q);
      const matchDesc = inc.description.toLowerCase().includes(q);
      const matchManifest = (inc.relatedManifestId || '').toLowerCase().includes(q);
      if (!matchNum && !matchTrack && !matchDesc && !matchManifest) return false;
    }
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreateIncident) return;
    const newIncNum = `INC-${Date.now().toString().slice(-4)}`;
    onCreateIncident({
      incidentNumber: newIncNum,
      category: newCategory,
      priority: newPriority,
      status: 'OPEN',
      hubId: currentHub.id,
      hubName: isAr ? currentHub.nameAr : currentHub.nameEn,
      trackingNumber: newTrackingNumber || undefined,
      flightNumber: newFlightNumber || undefined,
      relatedManifestId: newManifestId || undefined,
      description: newDescription,
      evidencePhotos: [],
      assignedEmployeeId: currentUser.id,
      assignedEmployeeName: currentUser.fullName || 'Operational Agent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsNewIncidentOpen(false);
    setNewDescription('');
    setNewTrackingNumber('');
  };

  const handleStatusChange = (newStatus: IncidentStatus) => {
    if (!selectedIncident || !onUpdateIncidentStatus) return;
    onUpdateIncidentStatus(selectedIncident.id, newStatus, actionNote);
    setSelectedIncident({
      ...selectedIncident,
      status: newStatus,
      resolutionNotes: actionNote || selectedIncident.resolutionNotes,
      updatedAt: new Date().toISOString(),
    });
    setActionNote('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">
                {isAr ? 'مركز الحالات التشغيلية والاستثناءات' : 'Operational Incidents Center'}
              </h1>
              <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
                {incidents.filter((i) => i.status === 'OPEN' || i.status === 'ACTION_REQUIRED').length}{' '}
                {isAr ? 'حالات نشطة' : 'Active'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {isAr 
                  ? 'إدارة الاستثناءات الميدانية والفروقات التشغيلية للطرود والرحلات والأختام الأمنية.' 
                  : 'Field operational exceptions, discrepancies, damaged packages, and seal checks.'}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsNewIncidentOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'فتح بلاغ تشغيلي جديد' : 'Open Incident'}</span>
          </button>
        </div>

        {/* Filters */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              {isAr ? 'نوع الحالة' : 'Category'}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">{isAr ? 'كافة التصنيفات' : 'All Categories'}</option>
              <option value="WEIGHT_DIFFERENCE">{isAr ? 'فارق وزن' : 'Weight Difference'}</option>
              <option value="PROHIBITED_ITEM">{isAr ? 'مواد ممنوعة' : 'Prohibited Item'}</option>
              <option value="DAMAGED_PACKAGE">{isAr ? 'طرد متضرر' : 'Damaged Package'}</option>
              <option value="SEAL_MISMATCH">{isAr ? 'عدم تطابق الختم' : 'Seal Mismatch'}</option>
              <option value="MISSING_PACKAGE">{isAr ? 'طرد مفقود' : 'Missing Package'}</option>
              <option value="TRAVELER_CANCELLATION">{isAr ? 'إلغاء رحلة مسافر' : 'Traveler Cancellation'}</option>
              <option value="TRAVELER_DELAY">{isAr ? 'تأخر المسافر' : 'Traveler Delay'}</option>
              <option value="MANIFEST_DIFFERENCE">{isAr ? 'اختلاف مانيفست' : 'Manifest Difference'}</option>
              <option value="CUSTOMS_HOLD">{isAr ? 'حجز جمركي' : 'Customs Hold'}</option>
              <option value="IDENTITY_ISSUE">{isAr ? 'إشكال هوية' : 'Identity Issue'}</option>
              <option value="OTHER">{isAr ? 'أخرى' : 'Other'}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              {isAr ? 'الحالة' : 'Status'}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="OPEN">{isAr ? 'مفتوح (Open)' : 'Open'}</option>
              <option value="ACTION_REQUIRED">{isAr ? 'يتطلب إجراء عاجل' : 'Action Required'}</option>
              <option value="UNDER_REVIEW">{isAr ? 'قيد المراجعة' : 'Under Review'}</option>
              <option value="RESOLVED">{isAr ? 'تم الحل (Resolved)' : 'Resolved'}</option>
              <option value="ESCALATED">{isAr ? 'مرفوع للإدارة' : 'Escalated'}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              {isAr ? 'الأولوية' : 'Priority'}
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">{isAr ? 'كافة الأولويات' : 'All Priorities'}</option>
              <option value="HIGH">{isAr ? 'عالية (High)' : 'High'}</option>
              <option value="MEDIUM">{isAr ? 'متوسطة (Medium)' : 'Medium'}</option>
              <option value="LOW">{isAr ? 'منخفضة (Low)' : 'Low'}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              {isAr ? 'بحث سريع' : 'Search'}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={isAr ? 'رقم البلاغ، الشحنة، المانيفست...' : 'Search incidents...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl ps-8 pe-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-3.5 text-start">{isAr ? 'رقم البلاغ' : 'Incident ID'}</th>
                <th className="p-3.5 text-start">{isAr ? 'نوع الحالة' : 'Category'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الشحنة / المانيفست / الرحلة' : 'Related Item'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الأولوية' : 'Priority'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الموظف المسؤول' : 'Assigned Agent'}</th>
                <th className="p-3.5 text-start">{isAr ? 'تاريخ البلاغ' : 'Created'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="p-3.5 text-center">{isAr ? 'إجراءات' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <div className="font-bold text-slate-700">
                      {isAr ? 'لا توجد بلاغات تشغيلية مطابقة' : 'No operational incidents found'}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {isAr ? 'كافة العمليات الميدانية تسير بانسيابية تامة' : 'All field operations running smoothly.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      {inc.incidentNumber}
                    </td>

                    <td className="p-3.5 font-semibold text-slate-800">
                      {getCategoryLabel(inc.category)}
                    </td>

                    <td className="p-3.5">
                      <div className="space-y-0.5 font-mono text-[11px]">
                        {inc.trackingNumber && (
                          <div className="flex items-center gap-1 text-slate-800 font-bold">
                            <Package className="w-3 h-3 text-slate-400" />
                            <span>{inc.trackingNumber}</span>
                          </div>
                        )}
                        {inc.relatedManifestId && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <FileSpreadsheet className="w-3 h-3 text-slate-400" />
                            <span>{inc.relatedManifestId}</span>
                          </div>
                        )}
                        {inc.flightNumber && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <Plane className="w-3 h-3 text-slate-400" />
                            <span>{inc.flightNumber}</span>
                          </div>
                        )}
                        {!inc.trackingNumber && !inc.relatedManifestId && !inc.flightNumber && (
                          <span className="text-slate-400">-</span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5">
                      {getPriorityBadge(inc.priority)}
                    </td>

                    <td className="p-3.5 text-slate-800">
                      <div className="font-bold">{inc.assignedEmployeeName}</div>
                      <span className="text-[10px] font-mono text-slate-400">{inc.hubName}</span>
                    </td>

                    <td className="p-3.5 text-slate-500 font-mono">
                      {new Date(inc.createdAt).toLocaleDateString(isAr ? 'ar-JO' : 'en-US')}
                    </td>

                    <td className="p-3.5">
                      <StatusBadge domain="INCIDENT" status={inc.status} locale={locale} size="sm" />
                    </td>

                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedIncident(inc)}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors font-bold cursor-pointer"
                      >
                        {isAr ? 'معاينة' : 'Details'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Details Drawer (Section 41) */}
      {selectedIncident && (
        <DetailsDrawer
          isOpen={true}
          onClose={() => setSelectedIncident(null)}
          title={isAr ? 'تفاصيل البلاغ التشغيلي' : 'Incident Details'}
          subtitle={selectedIncident.incidentNumber}
          locale={locale}
          badge={<StatusBadge domain="INCIDENT" status={selectedIncident.status} locale={locale} size="sm" />}
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          footerActions={
            <div className="flex items-center justify-between w-full gap-2">
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>

              <div className="flex items-center gap-2">
                {selectedIncident.status !== 'RESOLVED' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStatusChange('ACTION_REQUIRED')}
                      className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors"
                    >
                      {isAr ? 'طلب إجراء' : 'Request Action'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange('ESCALATED')}
                      className="px-3 py-1.5 bg-purple-50 text-purple-800 border border-purple-300 rounded-xl text-xs font-bold hover:bg-purple-100 transition-colors"
                    >
                      {isAr ? 'تصعيد للإدارة' : 'Escalate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange('RESOLVED')}
                      className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs"
                    >
                      {isAr ? 'تسوية وحل البلاغ' : 'Resolve'}
                    </button>
                  </>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Identity & Scope */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">{getCategoryLabel(selectedIncident.category)}</span>
                {getPriorityBadge(selectedIncident.priority)}
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 pt-2 border-t border-slate-200">
                <div>{isAr ? 'الفرع:' : 'Hub:'} <span className="font-bold text-slate-900">{selectedIncident.hubName}</span></div>
                <div>{isAr ? 'المسؤول:' : 'Agent:'} <span className="font-bold text-slate-900">{selectedIncident.assignedEmployeeName}</span></div>
                {selectedIncident.trackingNumber && (
                  <div>{isAr ? 'رقم الشحنة:' : 'Tracking:'} <span className="font-mono font-bold text-slate-900">{selectedIncident.trackingNumber}</span></div>
                )}
                {selectedIncident.relatedManifestId && (
                  <div>{isAr ? 'المانيفست:' : 'Manifest:'} <span className="font-mono font-bold text-slate-900">{selectedIncident.relatedManifestId}</span></div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
              <span className="font-bold text-slate-800 block">{isAr ? 'وصف الواقعة الميدانية:' : 'Incident Description:'}</span>
              <p className="text-slate-700 leading-relaxed">{selectedIncident.description}</p>
            </div>

            {/* Resolution notes if present */}
            {selectedIncident.resolutionNotes && (
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-emerald-950 space-y-1">
                <span className="font-bold block flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isAr ? 'ملاحظات المعالجة والإجراء المتخذ:' : 'Resolution Notes:'}</span>
                </span>
                <p className="text-xs">{selectedIncident.resolutionNotes}</p>
              </div>
            )}

            {/* Action Note Input */}
            {selectedIncident.status !== 'RESOLVED' && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="font-bold text-slate-800 block">
                  {isAr ? 'إضافة مذكرة تشغيلية أو توجيه ميداني:' : 'Add Operational Note:'}
                </label>
                <textarea
                  rows={2}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder={isAr ? 'أدخل تفاصيل التوجيه أو التواصل مع العميل/المسافر...' : 'Add resolution instructions...'}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}
          </div>
        </DetailsDrawer>
      )}

      {/* New Incident Drawer */}
      <DetailsDrawer
        isOpen={isNewIncidentOpen}
        onClose={() => setIsNewIncidentOpen(false)}
        title={isAr ? 'تسجيل بلاغ تشغيلي جديد' : 'New Operational Incident'}
        subtitle={isAr ? `فرع: ${isAr ? currentHub.nameAr : currentHub.nameEn}` : `Hub: ${currentHub.code}`}
        locale={locale}
        icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {isAr ? 'نوع وتصنيف الحالة' : 'Incident Category'}
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as IncidentCategory)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500"
            >
              <option value="WEIGHT_DIFFERENCE">{isAr ? 'فارق وزن بين المصرح والميزان' : 'Weight Difference'}</option>
              <option value="PROHIBITED_ITEM">{isAr ? 'مواد محظورة أمنياً أو غير معلنة' : 'Prohibited Item'}</option>
              <option value="DAMAGED_PACKAGE">{isAr ? 'تلف الطرد أو التغليف' : 'Damaged Package'}</option>
              <option value="SEAL_MISMATCH">{isAr ? 'عدم تطابق الختم الأمني للوصول' : 'Seal Mismatch'}</option>
              <option value="MISSING_PACKAGE">{isAr ? 'فقدان طرد مسجل في المانيفست' : 'Missing Package'}</option>
              <option value="TRAVELER_CANCELLATION">{isAr ? 'إلغاء رحلة المسافر بعد الربط' : 'Traveler Cancellation'}</option>
              <option value="TRAVELER_DELAY">{isAr ? 'تأخر موعد الرحلة أو الوصول' : 'Traveler Delay'}</option>
              <option value="MANIFEST_DIFFERENCE">{isAr ? 'اختلاف محتويات المانيفست' : 'Manifest Difference'}</option>
              <option value="CUSTOMS_HOLD">{isAr ? 'حجز أو تفتيش جمركي' : 'Customs Hold'}</option>
              <option value="IDENTITY_ISSUE">{isAr ? 'إشكال هوية المستلم أو المسافر' : 'Identity Issue'}</option>
              <option value="OTHER">{isAr ? 'أخرى' : 'Other'}</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {isAr ? 'مستوى الأولوية' : 'Priority Level'}
            </label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as IncidentPriority)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500"
            >
              <option value="HIGH">{isAr ? 'عالية (فورية)' : 'High (Immediate)'}</option>
              <option value="MEDIUM">{isAr ? 'متوسطة (خلال المناوبة)' : 'Medium (Within Shift)'}</option>
              <option value="LOW">{isAr ? 'منخفضة (متابعة عادية)' : 'Low (Standard)'}</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isAr ? 'رقم التتبع (اختياري)' : 'Tracking Number (Optional)'}
              </label>
              <input
                type="text"
                placeholder="TH-AMM-ALG-..."
                value={newTrackingNumber}
                onChange={(e) => setNewTrackingNumber(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isAr ? 'رقم المانيفست (اختياري)' : 'Manifest ID (Optional)'}
              </label>
              <input
                type="text"
                placeholder="MF-AMM-..."
                value={newManifestId}
                onChange={(e) => setNewManifestId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {isAr ? 'تفاصيل الواقعة وملاحظات الفحص الميداني' : 'Description & Field Notes'}
            </label>
            <textarea
              rows={3}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder={isAr ? 'اكتب بالتفصيل ما تم اكتشافه والإجراء الميداني المتخذ...' : 'Enter details...'}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewIncidentOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs"
            >
              {isAr ? 'تأكيد وفتح البلاغ' : 'Confirm & Open'}
            </button>
          </div>
        </form>
      </DetailsDrawer>
    </div>
  );
};
