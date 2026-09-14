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
  ArrowRight, 
  ShieldAlert,
  ShieldCheck,
  MessageSquare,
  Paperclip,
  User,
  Building2,
  Calendar,
  Lock,
  Layers,
  Info,
  Check,
  XCircle,
  Eye,
  AlertCircle
} from 'lucide-react';
import { 
  Hub, 
  IncidentCategory, 
  IncidentEntityType, 
  IncidentPriority, 
  IncidentStatus, 
  Locale, 
  OperationalIncident, 
  User as UserType 
} from '../../../types';
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
  const [selectedEntityType, setSelectedEntityType] = useState<string>('ALL');
  const [selectedBlocking, setSelectedBlocking] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Incident details drawer
  const [selectedIncident, setSelectedIncident] = useState<OperationalIncident | null>(null);

  // New Incident Drawer
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false);
  const [newIncidentNumber, setNewIncidentNumber] = useState('');
  const [newCategory, setNewCategory] = useState<IncidentCategory>('MISSING_PACKAGE');
  const [newEntityType, setNewEntityType] = useState<IncidentEntityType>('MANIFEST');
  const [newReferenceNumber, setNewReferenceNumber] = useState('');
  const [newPriority, setNewPriority] = useState<IncidentPriority>('HIGH');
  const [newIsBlocking, setNewIsBlocking] = useState<boolean>(true);
  const [newAssignedRole, setNewAssignedRole] = useState('Hub Manager');
  const [newTrackingNumber, setNewTrackingNumber] = useState('');
  const [newManifestId, setNewManifestId] = useState('');
  const [newFlightNumber, setNewFlightNumber] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Action Note Modal / Input inside drawer
  const [actionNote, setActionNote] = useState('');

  const getCategoryLabel = (cat: IncidentCategory) => {
    switch (cat) {
      case 'MISSING_PACKAGE': return isAr ? 'طرد مفقود (Missing Package)' : 'Missing Package';
      case 'WEIGHT_DIFFERENCE': return isAr ? 'فارق وزن (Weight Difference)' : 'Weight Difference';
      case 'PROHIBITED_ITEM': return isAr ? 'مواد ممنوعة (Prohibited Item)' : 'Prohibited Item';
      case 'DAMAGED_PACKAGE': return isAr ? 'طرد متضرر (Damaged Package)' : 'Damaged Package';
      case 'SEAL_MISMATCH': return isAr ? 'عدم تطابق الختم (Seal Mismatch)' : 'Seal Mismatch';
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
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">{isAr ? 'عالية (High)' : 'HIGH'}</span>;
      case 'MEDIUM':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">{isAr ? 'متوسطة (Med)' : 'MED'}</span>;
      case 'LOW':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">{isAr ? 'منخفضة (Low)' : 'LOW'}</span>;
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (selectedCategory !== 'ALL' && inc.category !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && inc.status !== selectedStatus) return false;
    if (selectedPriority !== 'ALL' && inc.priority !== selectedPriority) return false;
    if (selectedEntityType !== 'ALL' && (inc.entityType || 'MANIFEST') !== selectedEntityType) return false;
    if (selectedBlocking === 'YES' && !inc.isBlocking) return false;
    if (selectedBlocking === 'NO' && inc.isBlocking) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNum = (inc.incidentNumber || inc.id || '').toLowerCase().includes(q);
      const matchTrack = (inc.trackingNumber || '').toLowerCase().includes(q);
      const matchDesc = (inc.description || '').toLowerCase().includes(q);
      const matchManifest = (inc.relatedManifestId || '').toLowerCase().includes(q);
      const matchRef = (inc.referenceNumber || '').toLowerCase().includes(q);
      const matchType = (inc.type || inc.category || '').toLowerCase().includes(q);
      const matchRole = (inc.assignedRole || inc.assignedEmployeeName || '').toLowerCase().includes(q);
      if (!matchNum && !matchTrack && !matchDesc && !matchManifest && !matchRef && !matchType && !matchRole) return false;
    }
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreateIncident) return;
    const generatedId = newIncidentNumber.trim() || `INC-${Date.now().toString().slice(-4)}`;
    onCreateIncident({
      id: generatedId,
      incidentNumber: generatedId,
      type: newCategory,
      category: newCategory,
      entityType: newEntityType,
      referenceNumber: newReferenceNumber.trim() || newManifestId || newTrackingNumber || 'MF-0142',
      priority: newPriority,
      status: 'OPEN',
      isBlocking: newIsBlocking,
      hubId: currentHub.id,
      hubName: isAr ? currentHub.nameAr : currentHub.nameEn,
      trackingNumber: newTrackingNumber || undefined,
      flightNumber: newFlightNumber || undefined,
      relatedManifestId: newManifestId || (newEntityType === 'MANIFEST' ? newReferenceNumber : undefined),
      description: newDescription,
      evidencePhotos: [],
      assignedEmployeeId: currentUser.id,
      assignedEmployeeName: currentUser.fullName || 'Operational Agent',
      assignedRole: newAssignedRole || 'Hub Manager',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsNewIncidentOpen(false);
    setNewIncidentNumber('');
    setNewDescription('');
    setNewReferenceNumber('');
    setNewTrackingNumber('');
    setNewManifestId('');
  };

  const handleStatusTransition = (nextStatus: IncidentStatus) => {
    if (!selectedIncident || !onUpdateIncidentStatus) return;
    onUpdateIncidentStatus(selectedIncident.id, nextStatus, actionNote);
    setSelectedIncident({
      ...selectedIncident,
      status: nextStatus,
      resolutionNotes: actionNote || selectedIncident.resolutionNotes,
      updatedAt: new Date().toISOString(),
    });
    setActionNote('');
  };

  return (
    <div className="space-y-6">
      {/* Header & KPI Summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">
                {isAr ? 'إدارة البلاغات التشغيلية والاستثناءات الميدانية' : 'Operational Incidents & Exceptions'}
              </h1>
              <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
                {incidents.filter((i) => i.status === 'OPEN' || i.status === 'UNDER_REVIEW' || i.status === 'ACTION_REQUIRED').length}{' '}
                {isAr ? 'حالات نشطة' : 'Active'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                {isAr 
                  ? 'تسجيل وتتبع الحالات التشغيلية المانعة والطارئة وفق دورة حياة مستقلة دون المساس التلقائي بحالات المانيفست أو الرحلات.' 
                  : 'Track blocking operational exceptions independently without automatic mutations to trips or manifests.'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setNewIncidentNumber('INC-0142');
                setNewCategory('MISSING_PACKAGE');
                setNewEntityType('MANIFEST');
                setNewReferenceNumber('MF-0142');
                setNewTrackingNumber('TH-0182');
                setNewDescription('Expected shipment TH-0182 was not received at destination hub.');
                setNewAssignedRole('Hub Manager');
                setNewIsBlocking(true);
                setIsNewIncidentOpen(true);
              }}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-slate-300"
            >
              {isAr ? 'نموذج INC-0142 القياسي' : 'Preset: INC-0142'}
            </button>
            <button
              type="button"
              onClick={() => {
                setNewIncidentNumber('');
                setNewCategory('MISSING_PACKAGE');
                setNewEntityType('MANIFEST');
                setNewReferenceNumber('');
                setNewTrackingNumber('');
                setNewDescription('');
                setNewAssignedRole('Hub Manager');
                setNewIsBlocking(true);
                setIsNewIncidentOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'فتح بلاغ تشغيلي جديد' : 'New Incident'}</span>
            </button>
          </div>
        </div>

        {/* LifeCycle Tracker Banner */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-500" />
              <span>{isAr ? 'تسلسل دورة حياة البلاغ التشغيلي:' : 'Incident LifeCycle Stages:'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold flex-wrap">
              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">OPEN</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">UNDER_REVIEW</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">ACTION_REQUIRED</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">RESOLVED</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-300">CLOSED</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              {isAr ? 'نوع الحالة (Type)' : 'Type / Category'}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">{isAr ? 'كافة الأنواع' : 'All Types'}</option>
              <option value="MISSING_PACKAGE">{isAr ? 'طرد مفقود (MISSING_PACKAGE)' : 'MISSING_PACKAGE'}</option>
              <option value="WEIGHT_DIFFERENCE">{isAr ? 'فارق وزن (WEIGHT_DIFFERENCE)' : 'WEIGHT_DIFFERENCE'}</option>
              <option value="PROHIBITED_ITEM">{isAr ? 'مواد ممنوعة (PROHIBITED_ITEM)' : 'PROHIBITED_ITEM'}</option>
              <option value="DAMAGED_PACKAGE">{isAr ? 'طرد متضرر (DAMAGED_PACKAGE)' : 'DAMAGED_PACKAGE'}</option>
              <option value="SEAL_MISMATCH">{isAr ? 'عدم تطابق الختم (SEAL_MISMATCH)' : 'SEAL_MISMATCH'}</option>
              <option value="TRAVELER_CANCELLATION">{isAr ? 'إلغاء رحلة مسافر' : 'TRAVELER_CANCELLATION'}</option>
              <option value="TRAVELER_DELAY">{isAr ? 'تأخر المسافر' : 'TRAVELER_DELAY'}</option>
              <option value="MANIFEST_DIFFERENCE">{isAr ? 'اختلاف مانيفست' : 'MANIFEST_DIFFERENCE'}</option>
              <option value="CUSTOMS_HOLD">{isAr ? 'حجز جمركي' : 'CUSTOMS_HOLD'}</option>
              <option value="IDENTITY_ISSUE">{isAr ? 'إشكال هوية' : 'IDENTITY_ISSUE'}</option>
              <option value="OTHER">{isAr ? 'أخرى' : 'OTHER'}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              {isAr ? 'الكيان المرتبط (Entity)' : 'Entity'}
            </label>
            <select
              value={selectedEntityType}
              onChange={(e) => setSelectedEntityType(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">{isAr ? 'كافة الكيانات' : 'All Entities'}</option>
              <option value="MANIFEST">{isAr ? 'مانيفست (MANIFEST)' : 'MANIFEST'}</option>
              <option value="SHIPMENT">{isAr ? 'شحنة (SHIPMENT)' : 'SHIPMENT'}</option>
              <option value="TRIP">{isAr ? 'رحلة (TRIP)' : 'TRIP'}</option>
              <option value="TRAVELER">{isAr ? 'مسافر (TRAVELER)' : 'TRAVELER'}</option>
              <option value="CUSTOMS">{isAr ? 'جمارك (CUSTOMS)' : 'CUSTOMS'}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              {isAr ? 'حالة البلاغ (Status)' : 'Status'}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="OPEN">OPEN (مفتوح)</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW (قيد المراجعة)</option>
              <option value="ACTION_REQUIRED">ACTION_REQUIRED (يتطلب إجراء)</option>
              <option value="RESOLVED">RESOLVED (تم الحل)</option>
              <option value="CLOSED">CLOSED (مغلق)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              {isAr ? 'حظر تشغيلي (Blocking)' : 'Blocking'}
            </label>
            <select
              value={selectedBlocking}
              onChange={(e) => setSelectedBlocking(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">{isAr ? 'الكل' : 'All'}</option>
              <option value="YES">{isAr ? 'حظر تشغيلي (YES)' : 'Blocking: YES'}</option>
              <option value="NO">{isAr ? 'غير مانع (NO)' : 'Blocking: NO'}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              {isAr ? 'بحث سريع' : 'Search'}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={isAr ? 'INC-0142، MF-0142، TH-0182...' : 'Search INC, MF, TH...'}
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
                <th className="p-3.5 text-start">{isAr ? 'رقم البلاغ (Incident ID)' : 'Incident ID'}</th>
                <th className="p-3.5 text-start">{isAr ? 'النوع (Type)' : 'Type'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الكيان (Entity)' : 'Entity'}</th>
                <th className="p-3.5 text-start">{isAr ? 'المرجع (Reference)' : 'Reference'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الحالة (Status)' : 'Status'}</th>
                <th className="p-3.5 text-center">{isAr ? 'حظر تشغيلي (Blocking)' : 'Blocking'}</th>
                <th className="p-3.5 text-start">{isAr ? 'المسؤول (Assigned To)' : 'Assigned To'}</th>
                <th className="p-3.5 text-start">{isAr ? 'الوصف (Description)' : 'Description'}</th>
                <th className="p-3.5 text-center">{isAr ? 'إجراءات' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <div className="font-bold text-slate-700">
                      {isAr ? 'لا توجد بلاغات تشغيلية مطابقة' : 'No operational incidents found'}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {isAr ? 'كافة العمليات الميدانية تسير وفق المعايير التشغيلية المعتمدة' : 'All field operations running smoothly.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => {
                  const entity = inc.entityType || (inc.relatedManifestId ? 'MANIFEST' : inc.trackingNumber ? 'SHIPMENT' : 'SYSTEM');
                  const ref = inc.referenceNumber || inc.relatedManifestId || inc.trackingNumber || inc.flightNumber || '-';
                  const assigned = inc.assignedRole || inc.assignedEmployeeName || 'Hub Manager';
                  const isBlocking = inc.isBlocking !== false;

                  return (
                    <tr key={inc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span>{inc.incidentNumber || inc.id}</span>
                        </div>
                      </td>

                      <td className="p-3.5 font-semibold text-slate-800 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-mono text-[11px] font-bold border border-slate-200">
                          {inc.type || inc.category}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono text-slate-700 font-bold whitespace-nowrap">
                        <span className="text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {entity}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono text-slate-900 font-bold whitespace-nowrap">
                        {ref}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <StatusBadge domain="INCIDENT" status={inc.status} locale={locale} size="sm" />
                      </td>

                      <td className="p-3.5 text-center whitespace-nowrap">
                        {isBlocking ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px] border border-rose-300 inline-flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            <span>YES</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold text-[10px] border border-slate-200">
                            NO
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-slate-800 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{assigned}</div>
                        <span className="text-[10px] font-mono text-slate-400">{inc.assignedEmployeeName}</span>
                      </td>

                      <td className="p-3.5 text-slate-600 max-w-xs truncate" title={inc.description}>
                        {inc.description}
                      </td>

                      <td className="p-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedIncident(inc)}
                          className="px-3 py-1.5 text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isAr ? 'معاينة وإدارة' : 'Manage'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Details Drawer & Independent Lifecycle Manager */}
      {selectedIncident && (
        <DetailsDrawer
          isOpen={true}
          onClose={() => setSelectedIncident(null)}
          title={isAr ? 'تفاصيل البلاغ وإدارة الحالة التشغيلية' : 'Incident Details & LifeCycle Management'}
          subtitle={selectedIncident.incidentNumber || selectedIncident.id}
          locale={locale}
          badge={<StatusBadge domain="INCIDENT" status={selectedIncident.status} locale={locale} size="sm" />}
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          width="xl"
          footerActions={
            <div className="flex items-center justify-between w-full gap-2">
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>

              <div className="text-[11px] text-slate-400 font-mono">
                {isAr ? 'استقلالية الكيان: تغيير الحالة لا يعدل حالة المانيفست/الرحلة تلقائياً' : 'Entity-Independent LifeCycle'}
              </div>
            </div>
          }
        >
          <div className="space-y-5 text-xs">
            {/* Essential Specification Card */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-mono font-black text-sm">
                    {selectedIncident.incidentNumber || selectedIncident.id}
                  </span>
                  <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-700 font-bold">
                    {selectedIncident.type || selectedIncident.category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {selectedIncident.isBlocking !== false ? (
                    <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-[10px] font-bold">
                      Blocking: YES
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-slate-700 text-slate-300 rounded-full text-[10px] font-bold">
                      Blocking: NO
                    </span>
                  )}
                </div>
              </div>

              {/* Grid metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <div className="text-slate-400">{isAr ? 'الكيان (Entity)' : 'Entity'}</div>
                  <div className="font-bold text-indigo-300 font-mono mt-0.5">
                    {selectedIncident.entityType || (selectedIncident.relatedManifestId ? 'MANIFEST' : 'SHIPMENT')}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">{isAr ? 'المرجع (Reference)' : 'Reference'}</div>
                  <div className="font-bold text-amber-300 font-mono mt-0.5">
                    {selectedIncident.referenceNumber || selectedIncident.relatedManifestId || selectedIncident.trackingNumber || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">{isAr ? 'المسؤول (Assigned To)' : 'Assigned To'}</div>
                  <div className="font-bold text-emerald-300 mt-0.5">
                    {selectedIncident.assignedRole || selectedIncident.assignedEmployeeName || 'Hub Manager'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">{isAr ? 'الحالة الحالية' : 'Current Status'}</div>
                  <div className="font-bold text-white mt-0.5 font-mono">
                    {selectedIncident.status}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="pt-2 border-t border-slate-800">
                <div className="text-slate-400 text-[10px] mb-1">{isAr ? 'الوصف التشغيلي (Description):' : 'Description:'}</div>
                <div className="text-slate-100 font-medium text-xs leading-relaxed bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  {selectedIncident.description}
                </div>
              </div>
            </div>

            {/* Strict Sequential LifeCycle Stage Transitions */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>{isAr ? 'الانتقال التسلسلي لحالة البلاغ التشغيلي:' : 'Sequential Status Transitions:'}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">OPEN → UNDER_REVIEW → ACTION_REQUIRED → RESOLVED → CLOSED</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                {/* 1. OPEN */}
                <button
                  type="button"
                  onClick={() => handleStatusTransition('OPEN')}
                  className={`p-2.5 rounded-xl text-center border font-bold transition-all cursor-pointer ${
                    selectedIncident.status === 'OPEN'
                      ? 'bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-500'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-[10px] font-mono">STEP 1</div>
                  <div className="text-xs mt-0.5">OPEN</div>
                  <div className="text-[9px] text-slate-500 font-normal">{isAr ? 'فتح البلاغ' : 'Opened'}</div>
                </button>

                {/* 2. UNDER_REVIEW */}
                <button
                  type="button"
                  onClick={() => handleStatusTransition('UNDER_REVIEW')}
                  className={`p-2.5 rounded-xl text-center border font-bold transition-all cursor-pointer ${
                    selectedIncident.status === 'UNDER_REVIEW'
                      ? 'bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-500'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-[10px] font-mono">STEP 2</div>
                  <div className="text-xs mt-0.5">UNDER_REVIEW</div>
                  <div className="text-[9px] text-slate-500 font-normal">{isAr ? 'قيد المراجعة' : 'In Review'}</div>
                </button>

                {/* 3. ACTION_REQUIRED */}
                <button
                  type="button"
                  onClick={() => handleStatusTransition('ACTION_REQUIRED')}
                  className={`p-2.5 rounded-xl text-center border font-bold transition-all cursor-pointer ${
                    selectedIncident.status === 'ACTION_REQUIRED'
                      ? 'bg-orange-50 border-orange-300 text-orange-800 ring-2 ring-orange-500'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-[10px] font-mono">STEP 3</div>
                  <div className="text-xs mt-0.5">ACTION_REQUIRED</div>
                  <div className="text-[9px] text-slate-500 font-normal">{isAr ? 'مطلوب إجراء' : 'Action Req'}</div>
                </button>

                {/* 4. RESOLVED */}
                <button
                  type="button"
                  onClick={() => handleStatusTransition('RESOLVED')}
                  className={`p-2.5 rounded-xl text-center border font-bold transition-all cursor-pointer ${
                    selectedIncident.status === 'RESOLVED'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-500'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-[10px] font-mono">STEP 4</div>
                  <div className="text-xs mt-0.5">RESOLVED</div>
                  <div className="text-[9px] text-slate-500 font-normal">{isAr ? 'معالجة البلاغ' : 'Resolved'}</div>
                </button>

                {/* 5. CLOSED */}
                <button
                  type="button"
                  onClick={() => handleStatusTransition('CLOSED')}
                  className={`p-2.5 rounded-xl text-center border font-bold transition-all cursor-pointer ${
                    selectedIncident.status === 'CLOSED'
                      ? 'bg-slate-800 border-slate-900 text-white ring-2 ring-slate-700'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-[10px] font-mono">STEP 5</div>
                  <div className="text-xs mt-0.5">CLOSED</div>
                  <div className="text-[9px] text-slate-500 font-normal">{isAr ? 'إغلاق نهائي' : 'Closed'}</div>
                </button>
              </div>
            </div>

            {/* Entity Independence Warning & Guarantee Box */}
            <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl text-sky-950 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-xs">
                <Info className="w-4 h-4 text-sky-600 shrink-0" />
                <span>{isAr ? 'ضمان استقلالية الكيان المرتبط (Entity Independence Principle)' : 'Entity Independence Principle'}</span>
              </div>
              <p className="text-[11px] leading-relaxed text-sky-900">
                {isAr
                  ? 'حل هذا البلاغ (RESOLVED أو CLOSED) لا يؤدي إطلاقاً إلى تغيير تلقائي في حالة المانيفست (Manifest ≠ CLOSED)، أو إغلاق الرحلة (Trip ≠ COMPLETED)، أو تغيير حالة الشحنة المفقودة (Shipment ≠ RECEIVED_AT_DEST). تخضع كل شاشة تشغيلية لتقييم شروطها المستقلة بصورة صارمة.'
                  : 'Resolving this incident does NOT automatically set Manifest to CLOSED, Trip to COMPLETED, or Shipment to RECEIVED_AT_DEST. Operational screens independently re-evaluate their respective criteria.'}
              </p>
            </div>

            {/* Resolution Note & Operational Instructions */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <label className="font-bold text-slate-800 block text-xs flex items-center justify-between">
                <span>{isAr ? 'مذكرة المعالجة أو التوجيه الإداري:' : 'Resolution Notes & Field Directives:'}</span>
                {selectedIncident.resolutionNotes && (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                    {isAr ? 'مسجل مسبقاً' : 'Previously Recorded'}
                  </span>
                )}
              </label>

              {selectedIncident.resolutionNotes && (
                <div className="p-2.5 bg-white border border-emerald-200 rounded-xl text-slate-800 font-mono text-[11px] leading-relaxed">
                  {selectedIncident.resolutionNotes}
                </div>
              )}

              <textarea
                rows={2}
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder={isAr ? 'أدخل ملاحظة التحقيق أو التوجيه الإداري لتحديث السجل...' : 'Enter resolution directive or investigation notes...'}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-amber-500"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleStatusTransition(selectedIncident.status)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isAr ? 'حفظ المذكرة التشغيلية' : 'Save Directive Note'}
                </button>
              </div>
            </div>
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
        width="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {/* Incident ID & Preset */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isAr ? 'رقم البلاغ (Incident ID)' : 'Incident ID'}
              </label>
              <input
                type="text"
                placeholder="INC-0142"
                value={newIncidentNumber}
                onChange={(e) => setNewIncidentNumber(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono font-bold focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isAr ? 'المسؤول المكلّف (Assigned To)' : 'Assigned To'}
              </label>
              <select
                value={newAssignedRole}
                onChange={(e) => setNewAssignedRole(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 font-bold"
              >
                <option value="Hub Manager">Hub Manager (مدير الفرع)</option>
                <option value="Lead Inspector">Lead Inspector (رئيس المفتشين)</option>
                <option value="Security Officer">Security Officer (ضابط الأمن)</option>
                <option value="Operations Director">Operations Director (مدير العمليات)</option>
              </select>
            </div>
          </div>

          {/* Type / Category & Entity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isAr ? 'نوع وتصنيف الحالة (Type)' : 'Incident Type'}
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as IncidentCategory)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500"
              >
                <option value="MISSING_PACKAGE">MISSING_PACKAGE (طرد مفقود)</option>
                <option value="WEIGHT_DIFFERENCE">WEIGHT_DIFFERENCE (فارق وزن)</option>
                <option value="PROHIBITED_ITEM">PROHIBITED_ITEM (مواد ممنوعة)</option>
                <option value="DAMAGED_PACKAGE">DAMAGED_PACKAGE (طرد متضرر)</option>
                <option value="SEAL_MISMATCH">SEAL_MISMATCH (عدم تطابق الختم)</option>
                <option value="TRAVELER_CANCELLATION">TRAVELER_CANCELLATION (إلغاء رحلة)</option>
                <option value="TRAVELER_DELAY">TRAVELER_DELAY (تأخر مسافر)</option>
                <option value="MANIFEST_DIFFERENCE">MANIFEST_DIFFERENCE (فارق مانيفست)</option>
                <option value="CUSTOMS_HOLD">CUSTOMS_HOLD (حجز جمركي)</option>
                <option value="IDENTITY_ISSUE">IDENTITY_ISSUE (إشكال هوية)</option>
                <option value="OTHER">OTHER (أخرى)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isAr ? 'الكيان المتأثر (Entity)' : 'Entity Affected'}
              </label>
              <select
                value={newEntityType}
                onChange={(e) => setNewEntityType(e.target.value as IncidentEntityType)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 font-bold"
              >
                <option value="MANIFEST">MANIFEST (مانيفست رحلة)</option>
                <option value="SHIPMENT">SHIPMENT (طرد أو شحنة)</option>
                <option value="TRIP">TRIP (رحلة مسافر)</option>
                <option value="TRAVELER">TRAVELER (مسافر معتمد)</option>
                <option value="CUSTOMS">CUSTOMS (جمارك)</option>
              </select>
            </div>
          </div>

          {/* Reference & Blocking */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isAr ? 'المرجع المرتبط (Reference)' : 'Reference (e.g. MF-0142)'}
              </label>
              <input
                type="text"
                placeholder="MF-0142"
                value={newReferenceNumber}
                onChange={(e) => setNewReferenceNumber(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono font-bold focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isAr ? 'حظر العمليات (Blocking)' : 'Blocking Operations'}
              </label>
              <select
                value={newIsBlocking ? 'YES' : 'NO'}
                onChange={(e) => setNewIsBlocking(e.target.value === 'YES')}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:ring-2 focus:ring-amber-500 font-bold"
              >
                <option value="YES">YES (يمنع إتمام العمليات لحين الحل)</option>
                <option value="NO">NO (غير مانع - متابعة تدقيقية)</option>
              </select>
            </div>
          </div>

          {/* Optional identifiers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isAr ? 'رقم الشحنة / التتبع (اختياري)' : 'Tracking Number (Optional)'}
              </label>
              <input
                type="text"
                placeholder="TH-0182"
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
                placeholder="MF-0142"
                value={newManifestId}
                onChange={(e) => setNewManifestId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {isAr ? 'تفاصيل الواقعة الميدانية (Description)' : 'Incident Description'}
            </label>
            <textarea
              rows={3}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder={isAr ? 'Expected shipment TH-0182 was not received at destination hub.' : 'Describe field issue...'}
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
