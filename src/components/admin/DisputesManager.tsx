import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  UserCheck,
  User,
  Clock,
  FileText,
  DollarSign,
  Lock,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Camera,
  Scale,
  Send,
  AlertCircle,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { Dispute, DisputeStatus, Employee, Hub, Locale, Shipment, UserRole } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { formatCurrency } from '../../lib/crypto';

interface DisputesManagerProps {
  locale: Locale;
  employees: Employee[];
  shipments: Shipment[];
  hubs: Hub[];
  onRefreshAll?: () => void;
}

export const DisputesManager: React.FC<DisputesManagerProps> = ({
  locale,
  employees,
  shipments,
  hubs,
  onRefreshAll,
}) => {
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ChevronLeft : ChevronRight;

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Dual assignment form state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedDestinationEmployeeId, setSelectedDestinationEmployeeId] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [isAssigning, setIsAssigning] = useState(false);

  // Quick Hub Sign-off Modal state
  const [signOffModalOpen, setSignOffModalOpen] = useState(false);
  const [signOffTargetHub, setSignOffTargetHub] = useState<'ORIGIN' | 'DESTINATION'>('DESTINATION');
  const [signOffDecision, setSignOffDecision] = useState<'APPROVED_REFUND' | 'APPROVED_ESCROW_RELEASE' | 'REJECTED'>('APPROVED_REFUND');
  const [signOffNotes, setSignOffNotes] = useState('');
  const [isSubmittingSignOff, setIsSubmittingSignOff] = useState(false);

  // Resolution form state
  const [resolutionAction, setResolutionAction] = useState<'RESOLVED_REFUND' | 'RESOLVED_ESCROW_RELEASE' | 'REJECTED'>('RESOLVED_REFUND');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionErrorMsg, setActionErrorMsg] = useState('');

  // Evidence photo preview modal
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Manual Dispute Modal State
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualShipmentId, setManualShipmentId] = useState(shipments[0]?.id || '');
  const [manualClaimantName, setManualClaimantName] = useState('طارق الهاشمي');
  const [manualClaimantRole, setManualClaimantRole] = useState<UserRole>('SENDER');
  const [manualReason, setManualReason] = useState<Dispute['reason']>('DAMAGED_ITEM');
  const [manualAmount, setManualAmount] = useState(150);
  const [manualDesc, setManualDesc] = useState('');
  const [manualPhoto, setManualPhoto] = useState('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80');
  const [isCreatingManual, setIsCreatingManual] = useState(false);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/disputes');
      const data = await res.json();
      if (data.success && Array.isArray(data.disputes)) {
        setDisputes(data.disputes);
        if (!selectedDisputeId && data.disputes.length > 0) {
          setSelectedDisputeId(data.disputes[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch disputes', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const selectedDispute = disputes.find((d) => d.id === selectedDisputeId) || disputes[0] || null;

  // Pre-fill assignment form when selected dispute changes
  useEffect(() => {
    if (selectedDispute) {
      setSelectedEmployeeId(
        selectedDispute.originReview?.employeeId ||
        selectedDispute.assignedEmployeeId ||
        employees.find((e) => e.assignedHubId === 'hub-amm')?.id ||
        (employees[0]?.id || '')
      );
      setSelectedDestinationEmployeeId(
        selectedDispute.destinationReview?.employeeId ||
        employees.find((e) => e.assignedHubId === 'hub-alg')?.id ||
        (employees[1]?.id || '')
      );
      setSelectedPriority(selectedDispute.priority || 'HIGH');
      setResolutionNotes('');
      setActionSuccessMsg('');
      setActionErrorMsg('');
    }
  }, [selectedDispute, employees]);

  // Handle Assign Both Investigators
  const handleAssignEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;

    setIsAssigning(true);
    setActionSuccessMsg('');
    setActionErrorMsg('');

    try {
      const res = await fetch(`/api/admin/disputes/${selectedDispute.id}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originEmployeeId: selectedEmployeeId,
          destinationEmployeeId: selectedDestinationEmployeeId,
          priority: selectedPriority,
          adminId: 'usr-admin-001',
        }),
      });

      const data = await res.json();
      if (data.success && data.dispute) {
        setActionSuccessMsg(
          isAr
            ? 'تم تكليف محققي الفرعين (الأردن والجزائر) وإرسال إشعارات فورية لهما بنجاح.'
            : 'Both origin and destination investigators assigned and notified successfully.'
        );
        setDisputes((prev) => prev.map((d) => (d.id === data.dispute.id ? data.dispute : d)));
        if (onRefreshAll) onRefreshAll();
      } else {
        setActionErrorMsg(data.error || (isAr ? 'فشل تعيين الموظفين' : 'Failed to assign investigators'));
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Error occurred');
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle Quick Hub Sign-off / Vote
  const handleHubSignOffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;

    setIsSubmittingSignOff(true);
    setActionSuccessMsg('');
    setActionErrorMsg('');

    const targetEmpId =
      signOffTargetHub === 'ORIGIN'
        ? selectedDispute.originReview?.employeeId || selectedEmployeeId
        : selectedDispute.destinationReview?.employeeId || selectedDestinationEmployeeId;

    const targetEmp = employees.find((e) => e.id === targetEmpId);
    const targetHubId =
      signOffTargetHub === 'ORIGIN'
        ? selectedDispute.originHubId || 'hub-amm'
        : selectedDispute.destinationHubId || 'hub-alg';

    try {
      const res = await fetch(`/api/admin/disputes/${selectedDispute.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: targetEmpId,
          employeeName: targetEmp?.fullName || (signOffTargetHub === 'ORIGIN' ? 'عمر النجار' : 'سفيان مرابط'),
          hubId: targetHubId,
          decision: signOffDecision,
          notes: signOffNotes || (isAr ? 'تمت مطابقة شريط الختم الأمني وفحص سجل الشحنة.' : 'Inspected seal security and transit log.'),
          digitalSignature: `HMAC_SEAL_${signOffTargetHub}_${Date.now().toString().slice(-6)}`,
        }),
      });

      const data = await res.json();
      if (data.success && data.dispute) {
        setDisputes((prev) => prev.map((d) => (d.id === data.dispute.id ? data.dispute : d)));
        setActionSuccessMsg(
          data.dispute.consensusReached
            ? (isAr ? 'تم التوافق بالإجماع بين الفرعين (2/2) وتنفيذ الحكم المالي تلقائياً!' : 'Dual consensus reached (2/2)! Ruling executed.')
            : (isAr ? 'تم تسجيل وتوثيق قرار الفرع بنجاح وإشعار الفرع المقابل.' : 'Branch vote recorded & partner hub notified.')
        );
        setSignOffModalOpen(false);
        setSignOffNotes('');
        if (onRefreshAll) onRefreshAll();
      } else {
        setActionErrorMsg(data.error || 'Failed to submit vote');
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Error occurred');
    } finally {
      setIsSubmittingSignOff(false);
    }
  };

  // Handle Resolve Dispute
  const handleResolveDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;

    if (!resolutionNotes.trim()) {
      setActionErrorMsg(isAr ? 'يرجى كتابة نص وحيثيات القرار التحكيمي' : 'Please provide official resolution notes');
      return;
    }

    setIsResolving(true);
    setActionSuccessMsg('');
    setActionErrorMsg('');

    try {
      const res = await fetch(`/api/admin/disputes/${selectedDispute.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolutionStatus: resolutionAction,
          resolutionNotes,
          adminId: 'usr-admin-001',
        }),
      });

      const data = await res.json();
      if (data.success && data.dispute) {
        setActionSuccessMsg(
          resolutionAction === 'RESOLVED_REFUND'
            ? (isAr ? 'تم إصدار قرار التعويض المالي، ورد المبلغ لمحفظة المرسل، وتجميد/خصم الضمان بنجاح.' : 'Dispute resolved with full compensation refund to sender.')
            : (isAr ? 'تم رفض الشكوى والإفراج عن الضمان المالي للمسافر بنجاح.' : 'Dispute rejected & escrow released.')
        );
        setDisputes((prev) => prev.map((d) => (d.id === data.dispute.id ? data.dispute : d)));
        if (onRefreshAll) onRefreshAll();
      } else {
        setActionErrorMsg(data.error || (isAr ? 'فشل معالجة القرار' : 'Failed to resolve dispute'));
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Error occurred');
    } finally {
      setIsResolving(false);
    }
  };

  // Handle Manual Dispute Submission
  const handleCreateManualDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDesc.trim()) {
      alert(isAr ? 'يرجى إدخال تفاصيل الشكوى' : 'Please enter complaint notes');
      return;
    }

    setIsCreatingManual(true);
    try {
      const res = await fetch('/api/admin/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipmentId: manualShipmentId,
          claimantId: 'usr-sender-101',
          claimantName: manualClaimantName,
          claimantRole: manualClaimantRole,
          reason: manualReason,
          description: manualDesc,
          claimAmount: Number(manualAmount),
          evidencePhotos: [manualPhoto],
          priority: 'HIGH',
        }),
      });

      const data = await res.json();
      if (data.success && data.dispute) {
        setDisputes((prev) => [data.dispute, ...prev]);
        setSelectedDisputeId(data.dispute.id);
        setManualModalOpen(false);
        setManualDesc('');
        if (onRefreshAll) onRefreshAll();
      } else {
        alert(data.error || 'Failed to create dispute');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    } finally {
      setIsCreatingManual(false);
    }
  };

  // Filtered list
  const filteredDisputes = disputes.filter((d) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      d.status === statusFilter ||
      (statusFilter === 'PENDING' && (d.status === 'OPEN' || d.status === 'UNDER_REVIEW'));
    const matchesSearch =
      d.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.claimantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.assignedEmployeeName && d.assignedEmployeeName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const openDisputesCount = disputes.filter((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length;
  const resolvedRefundCount = disputes.filter((d) => d.status === 'RESOLVED_REFUND').length;

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header & Stats Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold">
                  {isAr ? 'هيئة التحكيم والامتثال المركزي' : 'Dispute & Escrow Arbitration'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {disputes.length} {isAr ? 'قضية مسجلة' : 'total claims'}
                </span>
              </div>
              <h2 className="text-xl font-black mt-1">
                {isAr ? 'إدارة النزاعات والشكاوى وتعيين الموظفين' : 'Dispute Claims & Staff Assignment'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDisputes}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{isAr ? 'تحديث النزاعات' : 'Refresh'}</span>
            </button>
            <button
              onClick={() => setManualModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'تسجيل نزاع / شكوى يدوية' : '+ New Dispute Claim'}</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-400">
                {isAr ? 'النزاعات النشطة بانتظار البت' : 'Active & Under Review'}
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            </div>
            <p className="text-2xl font-black text-amber-400">{openDisputesCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              {isAr ? 'ودائع الضمان المالي مجمدة حالياً' : 'Traveler escrow frozen until resolution'}
            </p>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-400">
                {isAr ? 'النزاعات المحسومة بالتعويض' : 'Resolved with Refund'}
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-400">{resolvedRefundCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              {isAr ? 'تم صرف التعويض المالي للمرسل' : 'Compensation debited from escrow'}
            </p>
          </div>

          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-400">
                {isAr ? 'الموظفون المتاحون للتحقيق' : 'Assigned Compliance Staff'}
              </span>
              <UserCheck className="w-4 h-4 text-brand-400" />
            </div>
            <p className="text-2xl font-black text-brand-300">{employees.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              {isAr ? 'موظفو الفروع وضباط الامتثال' : 'Branch officers & compliance agents'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isAr ? 'الكل' : 'All'} ({disputes.length})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              statusFilter === 'PENDING'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            {isAr ? 'قيد المراجعة / مفتوح' : 'Open / Under Review'} ({openDisputesCount})
          </button>
          <button
            onClick={() => setStatusFilter('RESOLVED_REFUND')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              statusFilter === 'RESOLVED_REFUND'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            {isAr ? 'تم التعويض' : 'Refunded'} ({resolvedRefundCount})
          </button>
          <button
            onClick={() => setStatusFilter('RESOLVED_ESCROW_RELEASE')}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              statusFilter === 'RESOLVED_ESCROW_RELEASE'
                ? 'bg-brand-600 text-white font-bold'
                : 'bg-brand-50 text-brand-800 hover:bg-brand-100 border border-brand-200'
            }`}
          >
            {isAr ? 'مفرج عن الضمان' : 'Escrow Released'}
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute top-3 right-3 rtl:right-3 rtl:left-auto ltr:left-3 ltr:right-auto" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث برقم الشحنة أو اسم المطالب أو الموظف...' : 'Search tracking #, claimant, staff...'}
            className="w-full py-2 px-9 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-red-500"
          />
        </div>
      </div>

      {/* Master Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Disputes List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
            <span>{isAr ? 'قائمة النزاعات والشكاوى' : 'Dispute Claims List'}</span>
            <span>{filteredDisputes.length} {isAr ? 'نزاع' : 'records'}</span>
          </div>

          {filteredDisputes.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>{isAr ? 'لا توجد نزاعات مطابقة لمعايير البحث' : 'No disputes match your query'}</p>
            </div>
          ) : (
            filteredDisputes.map((disp) => {
              const isSelected = selectedDispute?.id === disp.id;
              return (
                <div
                  key={disp.id}
                  onClick={() => setSelectedDisputeId(disp.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-red-50/80 border-red-400 ring-2 ring-red-400/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-black text-xs text-red-700">{disp.trackingNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        disp.status === 'OPEN'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : disp.status === 'UNDER_REVIEW'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : disp.status === 'RESOLVED_REFUND'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {disp.status === 'OPEN'
                        ? (isAr ? 'نزاع مفتوح جديد' : 'New Open')
                        : disp.status === 'UNDER_REVIEW'
                        ? (isAr ? 'قيد التحقيق والتدقيق' : 'Under Review')
                        : disp.status === 'RESOLVED_REFUND'
                        ? (isAr ? 'تم صرف التعويض' : 'Refund Approved')
                        : (isAr ? 'مغلق / مفرج' : 'Closed')}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-900 truncate mb-1">
                    {disp.reason === 'DAMAGED_ITEM'
                      ? (isAr ? 'تلف أو كسر في محتويات الطرد' : 'Damaged Goods')
                      : disp.reason === 'TAMPERED_SEAL'
                      ? (isAr ? 'اشتباه عبث بالختم الأمني الإلكتروني' : 'Tampered Seal')
                      : disp.reason === 'MISSING_PACKAGE'
                      ? (isAr ? 'فقدان طرد أو نقص محتويات' : 'Missing Package')
                      : (isAr ? 'شكوى تأخر أو مخالفة شروط' : 'Delay / Policy Claim')}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 mt-2">
                    <span>{isAr ? 'المطالب:' : 'Claimant:'} <strong>{disp.claimantName.split(' ')[0]}</strong></span>
                    <span className="font-mono font-bold text-red-600">${disp.claimAmount} USD</span>
                  </div>

                  {/* Staff Assignment Pill */}
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-amber-600" />
                      <span>{disp.assignedEmployeeName ? disp.assignedEmployeeName.split(' ')[0] : (isAr ? 'لم يعين موظف' : 'Unassigned')}</span>
                    </span>
                    {disp.priority && (
                      <span className={`px-1.5 py-0.2 rounded font-bold ${disp.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                        {disp.priority === 'HIGH' ? (isAr ? 'أولوية قصوى' : 'High Priority') : (isAr ? 'عادي' : 'Normal')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Dispute Details, Investigator Assignment & Resolution */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDispute ? (
            <div className="space-y-6">
              {/* Top Banner Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold">
                        {isAr ? 'ملف النزاع والتحكيم المالي' : 'Case Docket'}
                      </span>
                      <h3 className="text-lg font-black font-mono text-slate-900">
                        {selectedDispute.trackingNumber}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {isAr ? 'رقم النزاع المرجعي:' : 'Dispute Ref:'} <strong className="font-mono">{selectedDispute.id}</strong> • {new Date(selectedDispute.createdAt).toLocaleString(isAr ? 'ar-JO' : 'en-US')}
                    </p>
                  </div>

                  <div className="text-right rtl:text-right ltr:text-left">
                    <span className="text-[11px] text-slate-500 block">{isAr ? 'مبلغ المطالبة بالتعويض' : 'Claimed Amount'}</span>
                    <span className="text-xl font-black text-red-600 font-mono">
                      ${selectedDispute.claimAmount.toFixed(2)} USD
                    </span>
                  </div>
                </div>

                {/* Notifications & Feedback */}
                {actionSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{actionSuccessMsg}</span>
                  </div>
                )}
                {actionErrorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{actionErrorMsg}</span>
                  </div>
                )}

                {/* Case Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                    <span className="font-bold text-slate-700 block">{isAr ? 'معلومات الطرف المطالب:' : 'Claimant Information:'}</span>
                    <div className="text-slate-600 space-y-1">
                      <p><strong>{isAr ? 'الاسم:' : 'Name:'}</strong> {selectedDispute.claimantName}</p>
                      <p><strong>{isAr ? 'الصفة القانونية:' : 'Role:'}</strong> {selectedDispute.claimantRole}</p>
                      <p><strong>{isAr ? 'معرف المستخدم:' : 'User ID:'}</strong> <span className="font-mono text-[11px]">{selectedDispute.claimantId}</span></p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                    <span className="font-bold text-slate-700 block">{isAr ? 'حالة الضمان المالي المحجوز (Escrow):' : 'Escrow Security Status:'}</span>
                    <div className="text-slate-600 space-y-1">
                      <p className="flex items-center gap-1.5 text-amber-700 font-bold">
                        <Lock className="w-3.5 h-3.5" />
                        <span>{isAr ? 'وديعة الضمان المالي مجمدة' : 'Escrow Vault Locked'}</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {isAr ? 'لا يمكن للمسافر سحب الأرباح أو الضمان حتى حسم هذا النزاع' : 'Traveler cannot withdraw funds until dispute resolution'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Claim Statement & Reason */}
                <div className="p-4 bg-red-50/50 border border-red-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-red-900 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-red-600" />
                      <span>{isAr ? 'سبب النزاع والتصنيف المعتمد:' : 'Claim Classification & Statement:'}</span>
                    </span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-md text-[10px] font-bold">
                      {selectedDispute.reason}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                    {selectedDispute.description}
                  </p>
                </div>

                {/* Evidence Photos Gallery */}
                {selectedDispute.evidencePhotos && selectedDispute.evidencePhotos.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-slate-500" />
                      <span>{isAr ? 'الأدلة وصور الإثبات المرفقة للتدقيق:' : 'Attached Evidence Photos:'}</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                      {selectedDispute.evidencePhotos.map((url, idx) => (
                        <div
                          key={idx}
                          onClick={() => setPreviewPhoto(url)}
                          className="w-24 h-20 rounded-xl overflow-hidden border border-slate-200 hover:border-red-400 cursor-pointer transition-all shadow-xs relative group"
                        >
                          <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                            {isAr ? 'تكبير' : 'Zoom'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 1. DUAL-HUB ARBITRATION & INVESTIGATION STATUS CARD (التحكيم الثنائي المشترك بين فرع الإرسال وفرع الوصول) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        {isAr ? 'نظام التحكيم الثنائي المشترك (فرع الإرسال + فرع الاستلام)' : 'Dual-Hub Consensus Arbitration (Origin & Destination)'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {isAr ? 'يتطلب النزاع موافقة وتوقيع موظف بلد الإرسال وموظف بلد الاستلام لاعتماد النزاع وصرف التعويض' : 'Requires sign-off from both origin and destination hub officers for mutual consensus'}
                      </p>
                    </div>
                  </div>

                  {/* Consensus Badge */}
                  <div>
                    {selectedDispute.originReview?.decision !== 'PENDING' &&
                    selectedDispute.destinationReview?.decision !== 'PENDING' &&
                    selectedDispute.originReview?.decision === selectedDispute.destinationReview?.decision ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{isAr ? 'إجماع ثنائي مكتمل (2/2)' : 'Dual Consensus (2/2)'}</span>
                      </span>
                    ) : selectedDispute.originReview?.decision !== 'PENDING' ||
                      selectedDispute.destinationReview?.decision !== 'PENDING' ? (
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>{isAr ? 'بانتظار توقيع الفرع الآخر (1/2)' : 'Pending Partner Hub (1/2)'}</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isAr ? 'بانتظار مراجعة الفرعين (0/2)' : 'Awaiting Both Hubs (0/2)'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* The Two Hub Review Cards Side-by-Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Origin Hub Card (e.g. Jordan) */}
                  <div className={`p-4 rounded-2xl border ${
                    selectedDispute.originReview?.decision === 'APPROVED_REFUND'
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : selectedDispute.originReview?.decision === 'REJECTED'
                      ? 'bg-red-50/70 border-red-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">🇯🇴</span>
                        <span className="font-bold text-xs text-slate-900">
                          {selectedDispute.originHubName || (isAr ? 'فرع الإرسال (الأردن)' : 'Origin Hub (Jordan)')}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        selectedDispute.originReview?.decision === 'APPROVED_REFUND'
                          ? 'bg-emerald-200 text-emerald-900'
                          : selectedDispute.originReview?.decision === 'APPROVED_ESCROW_RELEASE'
                          ? 'bg-brand-200 text-brand-900'
                          : selectedDispute.originReview?.decision === 'REJECTED'
                          ? 'bg-red-200 text-red-900'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {selectedDispute.originReview?.decision === 'APPROVED_REFUND'
                          ? (isAr ? 'موافقة على التعويض' : 'Approved Refund')
                          : selectedDispute.originReview?.decision === 'APPROVED_ESCROW_RELEASE'
                          ? (isAr ? 'إفراج عن الضمان' : 'Release Escrow')
                          : selectedDispute.originReview?.decision === 'REJECTED'
                          ? (isAr ? 'رفض الشكوى' : 'Rejected')
                          : (isAr ? 'قيد التدقيق (Pending)' : 'Pending')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <p>
                        <strong className="text-slate-700">{isAr ? 'المحقق المسؤول:' : 'Investigator:'}</strong>{' '}
                        {selectedDispute.originReview?.employeeName || (isAr ? 'عمر النجار (EMP-AMM-101)' : 'Omar Al-Najjar')}
                      </p>
                      {selectedDispute.originReview?.notes && (
                        <p className="p-2 bg-white/80 rounded-xl border border-slate-200/60 text-[11px] text-slate-700 mt-2 font-medium">
                          "{selectedDispute.originReview.notes}"
                        </p>
                      )}
                      {selectedDispute.originReview?.decidedAt && (
                        <p className="text-[10px] text-slate-400 font-mono pt-1">
                          {isAr ? 'تاريخ التوقيع:' : 'Signed:'} {new Date(selectedDispute.originReview.decidedAt).toLocaleString(isAr ? 'ar-JO' : 'en-US')}
                        </p>
                      )}
                      {selectedDispute.originReview?.digitalSignature && (
                        <p className="text-[9px] text-brand-700 font-mono truncate">
                          🔒 {selectedDispute.originReview.digitalSignature}
                        </p>
                      )}

                      {/* Quick Sign-off button for Origin Hub */}
                      <button
                        type="button"
                        onClick={() => {
                          setSignOffTargetHub('ORIGIN');
                          setSignOffDecision('APPROVED_REFUND');
                          setSignOffNotes('');
                          setSignOffModalOpen(true);
                        }}
                        className="w-full mt-2 py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                        <span>{isAr ? 'تسجيل توقيع / مراجعة ضابط فرع الأردن 🇯🇴' : 'Sign/Vote as Jordan Hub Officer 🇯🇴'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Destination Hub Card (e.g. Algeria) */}
                  <div className={`p-4 rounded-2xl border ${
                    selectedDispute.destinationReview?.decision === 'APPROVED_REFUND'
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : selectedDispute.destinationReview?.decision === 'REJECTED'
                      ? 'bg-red-50/70 border-red-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">🇩🇿</span>
                        <span className="font-bold text-xs text-slate-900">
                          {selectedDispute.destinationHubName || (isAr ? 'فرع الوصول (الجزائر)' : 'Destination Hub (Algeria)')}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        selectedDispute.destinationReview?.decision === 'APPROVED_REFUND'
                          ? 'bg-emerald-200 text-emerald-900'
                          : selectedDispute.destinationReview?.decision === 'APPROVED_ESCROW_RELEASE'
                          ? 'bg-brand-200 text-brand-900'
                          : selectedDispute.destinationReview?.decision === 'REJECTED'
                          ? 'bg-red-200 text-red-900'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {selectedDispute.destinationReview?.decision === 'APPROVED_REFUND'
                          ? (isAr ? 'موافقة على التعويض' : 'Approved Refund')
                          : selectedDispute.destinationReview?.decision === 'APPROVED_ESCROW_RELEASE'
                          ? (isAr ? 'إفراج عن الضمان' : 'Release Escrow')
                          : selectedDispute.destinationReview?.decision === 'REJECTED'
                          ? (isAr ? 'رفض الشكوى' : 'Rejected')
                          : (isAr ? 'قيد التدقيق (Pending)' : 'Pending')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <p>
                        <strong className="text-slate-700">{isAr ? 'المحقق المسؤول:' : 'Investigator:'}</strong>{' '}
                        {selectedDispute.destinationReview?.employeeName || (isAr ? 'سفيان مرابط (EMP-ALG-201)' : 'Sofiane Merabet')}
                      </p>
                      {selectedDispute.destinationReview?.notes ? (
                        <p className="p-2 bg-white/80 rounded-xl border border-slate-200/60 text-[11px] text-slate-700 mt-2 font-medium">
                          "{selectedDispute.destinationReview.notes}"
                        </p>
                      ) : (
                        <p className="text-[11px] text-amber-700 italic pt-1">
                          {isAr ? 'بانتظار تسجيل قرار موظف فرع الجزائر لاستكمال التوافق' : 'Awaiting Algiers Hub officer review'}
                        </p>
                      )}
                      {selectedDispute.destinationReview?.decidedAt && (
                        <p className="text-[10px] text-slate-400 font-mono pt-1">
                          {isAr ? 'تاريخ التوقيع:' : 'Signed:'} {new Date(selectedDispute.destinationReview.decidedAt).toLocaleString(isAr ? 'ar-JO' : 'en-US')}
                        </p>
                      )}
                      {selectedDispute.destinationReview?.digitalSignature && (
                        <p className="text-[9px] text-brand-700 font-mono truncate">
                          🔒 {selectedDispute.destinationReview.digitalSignature}
                        </p>
                      )}

                      {/* Quick Sign-off button for Destination Hub */}
                      <button
                        type="button"
                        onClick={() => {
                          setSignOffTargetHub('DESTINATION');
                          setSignOffDecision('APPROVED_REFUND');
                          setSignOffNotes('');
                          setSignOffModalOpen(true);
                        }}
                        className="w-full mt-2 py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                        <span>{isAr ? 'تسجيل توقيع / مراجعة ضابط فرع الجزائر 🇩🇿' : 'Sign/Vote as Algeria Hub Officer 🇩🇿'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. DUAL-HUB ASSIGNMENT SECTION (تعيين موظف فرع الإرسال وموظف فرع الوصول) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        {isAr ? 'تعيين وإشعار محققي الفرعين (الأردن والجزائر)' : 'Assign & Notify Dual Investigators'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {isAr ? 'إرسال إشعار فوري وتكليف رسمي لموظف بلد الإرسال وموظف بلد الاستلام' : 'Sends instant real-time notifications to both hub officers'}
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleAssignEmployee} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Origin Hub Investigator */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isAr ? 'محقق فرع الإرسال (الأردن / عمان):' : 'Origin Investigator (Jordan):'}
                      </label>
                      <select
                        value={selectedEmployeeId}
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-amber-500 font-medium"
                      >
                        {employees
                          .filter((e) => !selectedDispute.originHubId || e.assignedHubId === selectedDispute.originHubId || e.assignedHubId === 'hub-amm')
                          .concat(employees.filter((e) => e.assignedHubId !== selectedDispute.originHubId && e.assignedHubId !== 'hub-amm'))
                          .map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.fullName} ({emp.staffCode}) - [{emp.assignedHubId}]
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Destination Hub Investigator */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isAr ? 'محقق فرع الوصول (الجزائر):' : 'Destination Investigator (Algeria):'}
                      </label>
                      <select
                        defaultValue={selectedDispute.destinationReview?.employeeId || employees.find((e) => e.assignedHubId === 'hub-alg')?.id || employees[1]?.id}
                        id="dest-emp-select"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-amber-500 font-medium"
                      >
                        {employees
                          .filter((e) => !selectedDispute.destinationHubId || e.assignedHubId === selectedDispute.destinationHubId || e.assignedHubId === 'hub-alg')
                          .concat(employees.filter((e) => e.assignedHubId !== selectedDispute.destinationHubId && e.assignedHubId !== 'hub-alg'))
                          .map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.fullName} ({emp.staffCode}) - [{emp.assignedHubId}]
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Send className="w-3 h-3 text-brand-600" />
                      <span>{isAr ? 'سيتم إرسال إشعار فوري في لوحة تحكم كل موظف فور الحفظ' : 'Real-time alert will be pushed to both officers'}</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isAssigning}
                      className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{isAssigning ? (isAr ? 'جاري الحفظ والإشعار...' : 'Saving & Notifying...') : (isAr ? 'حفظ وتكليف الموظفين الاثنين' : 'Assign & Notify Both Officers')}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* 3. ARBITRATION & FINAL RESOLUTION DECISION (قرارات التحكيم والتعويض المالي) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        {isAr ? 'إصدار الحكم والقرار التحكيمي المالي النهائي' : 'Enforce Arbitration & Final Resolution'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {isAr ? 'تنفيذ التسوية المالية الفورية بين المرسل والمسافر وسجل الخزينة' : 'Execute immediate double-entry escrow disbursement or refund'}
                      </p>
                    </div>
                  </div>

                  {selectedDispute.status === 'RESOLVED_REFUND' && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold">
                      {isAr ? 'تم صرف التعويض المالي للمرسل' : 'Refund Approved'}
                    </span>
                  )}
                  {selectedDispute.status === 'RESOLVED_ESCROW_RELEASE' && (
                    <span className="px-3 py-1 bg-brand-100 text-brand-800 rounded-xl text-xs font-bold">
                      {isAr ? 'تم الإفراج عن الضمان المالي' : 'Escrow Released'}
                    </span>
                  )}
                </div>

                {selectedDispute.status === 'RESOLVED_REFUND' || selectedDispute.status === 'RESOLVED_ESCROW_RELEASE' || selectedDispute.status === 'REJECTED' ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-700 font-bold">
                      <span>{isAr ? 'القرار التحكيمي المعتمد:' : 'Enacted Ruling:'}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {selectedDispute.resolvedAt ? new Date(selectedDispute.resolvedAt).toLocaleString() : ''}
                      </span>
                    </div>
                    <p className="text-slate-800 leading-relaxed font-medium">
                      {selectedDispute.resolutionNotes || (isAr ? 'تم اعتماد القرار بواسطة الإدارة المركزية.' : 'Approved by Master Admin.')}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleResolveDispute} className="space-y-4">
                    {/* Action Selector */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Option 1: Approve Refund */}
                      <button
                        type="button"
                        onClick={() => setResolutionAction('RESOLVED_REFUND')}
                        className={`p-4 rounded-2xl border text-right rtl:text-right ltr:text-left transition-all cursor-pointer ${
                          resolutionAction === 'RESOLVED_REFUND'
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-xs text-emerald-800">
                            {isAr ? 'قبول التعويض وصرف المبلغ للمرسل' : 'Approve Full Refund'}
                          </span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {isAr
                            ? `خصم $${selectedDispute.claimAmount} من ضمان المسافر وإيداعها في محفظة المرسل فوراً.`
                            : `Debits $${selectedDispute.claimAmount} from traveler escrow and credits sender.`}
                        </p>
                      </button>

                      {/* Option 2: Reject Claim & Release Escrow */}
                      <button
                        type="button"
                        onClick={() => setResolutionAction('RESOLVED_ESCROW_RELEASE')}
                        className={`p-4 rounded-2xl border text-right rtl:text-right ltr:text-left transition-all cursor-pointer ${
                          resolutionAction === 'RESOLVED_ESCROW_RELEASE'
                            ? 'bg-brand-50 border-brand-500 ring-2 ring-brand-500/20 text-brand-950'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-xs text-brand-800">
                            {isAr ? 'رفض الشكوى والإفراج عن الضمان' : 'Dismiss & Release Escrow'}
                          </span>
                          <XCircle className="w-4 h-4 text-brand-600" />
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {isAr
                            ? 'سلامة الإجراءات والختم، وإعادة الطرد للمسار الطبيعي مع الإفراج عن الضمان.'
                            : 'Validates seal & procedure, dismisses claim, and releases traveler deposit.'}
                        </p>
                      </button>
                    </div>

                    {/* Resolution Statement */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {isAr ? 'حيثيات القرار والأسباب القانونية/المالية للتوثيق في السجل المشفر:' : 'Official Resolution Rationale & Audit Statement:'}
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder={
                          isAr
                            ? 'اكتب شرح القرار التحكيمي (مثال: تم تدقيق صور الختم والتأكد من الضرر، وبناءً عليه تقرر تعويض المرسل خصماً من ضمان المسافر)...'
                            : 'Enter official decision rationale for audit trail...'
                        }
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-red-500 placeholder-slate-400"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isResolving}
                        className={`flex items-center gap-2 px-6 py-2.5 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50 ${
                          resolutionAction === 'RESOLVED_REFUND'
                            ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                            : 'bg-brand-600 hover:bg-brand-500 shadow-brand-600/30'
                        }`}
                      >
                        <Scale className="w-4 h-4" />
                        <span>
                          {isResolving
                            ? (isAr ? 'جاري تنفيذ الحكم...' : 'Enforcing...')
                            : (isAr ? 'اعتماد وتنفيذ القرار التحكيمي فوراً' : 'Enforce & Finalize Ruling')}
                        </span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-400">
              <Scale className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-xs">{isAr ? 'اختر نزاعاً من القائمة لعرض تفاصيل التحكيم' : 'Select a dispute claim to inspect'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Hub Sign-off / Vote Modal */}
      {signOffModalOpen && selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-brand-950/60">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-brand-400" />
                <div>
                  <h3 className="text-sm font-black text-white">
                    {isAr
                      ? `تسجيل قرار وتوقيع ضابط ${signOffTargetHub === 'ORIGIN' ? 'فرع الأردن 🇯🇴' : 'فرع الجزائر 🇩🇿'}`
                      : `Hub Sign-Off: ${signOffTargetHub === 'ORIGIN' ? 'Jordan Hub 🇯🇴' : 'Algeria Hub 🇩🇿'}`}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isAr ? `نزاع شحنة: ${selectedDispute.trackingNumber}` : `Dispute: ${selectedDispute.trackingNumber}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSignOffModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleHubSignOffSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {isAr ? 'القرار التحكيمي المعتمد من قبل هذا الفرع:' : 'Official Hub Decision:'}
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  <label
                    onClick={() => setSignOffDecision('APPROVED_REFUND')}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      signOffDecision === 'APPROVED_REFUND'
                        ? 'bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-200'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="hub_decision"
                      checked={signOffDecision === 'APPROVED_REFUND'}
                      onChange={() => setSignOffDecision('APPROVED_REFUND')}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold block text-white">
                        {isAr ? 'موافقة على التعويض المالي للمرسل (Approve Refund)' : 'Approve Refund'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {isAr
                          ? `الاعتراف بالضرر/الخلل وإقرار تعويض $${selectedDispute.claimAmount}`
                          : `Certify damage & approve $${selectedDispute.claimAmount} refund`}
                      </span>
                    </div>
                  </label>

                  <label
                    onClick={() => setSignOffDecision('APPROVED_ESCROW_RELEASE')}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      signOffDecision === 'APPROVED_ESCROW_RELEASE'
                        ? 'bg-brand-950/50 border-brand-500 ring-2 ring-brand-500/20 text-brand-200'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="hub_decision"
                      checked={signOffDecision === 'APPROVED_ESCROW_RELEASE'}
                      onChange={() => setSignOffDecision('APPROVED_ESCROW_RELEASE')}
                      className="mt-1 text-brand-600 focus:ring-brand-500"
                    />
                    <div>
                      <span className="text-xs font-bold block text-white">
                        {isAr ? 'صحة الإجراءات والإفراج عن الضمان (Release Escrow)' : 'Release Escrow & Dismiss'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {isAr ? 'سلامة الختم وتبرئة المسافر وتسليم الطرد' : 'Validates seal & releases traveler deposit'}
                      </span>
                    </div>
                  </label>

                  <label
                    onClick={() => setSignOffDecision('REJECTED')}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      signOffDecision === 'REJECTED'
                        ? 'bg-red-950/50 border-red-500 ring-2 ring-red-500/20 text-red-200'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="hub_decision"
                      checked={signOffDecision === 'REJECTED'}
                      onChange={() => setSignOffDecision('REJECTED')}
                      className="mt-1 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <span className="text-xs font-bold block text-white">
                        {isAr ? 'رفض الشكوى بشكل قاطع (Reject Claim)' : 'Reject Claim'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {isAr ? 'عدم ثبوت الادعاء أو الإخلال بشروط الخدمة' : 'Unsubstantiated or invalid claim'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {isAr ? 'ملاحظات المحقق وتبرير القرار:' : 'Investigator Notes:'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={signOffNotes}
                  onChange={(e) => setSignOffNotes(e.target.value)}
                  placeholder={
                    isAr
                      ? 'اكتب تقرير الفحص الميداني والمطابقة (مثال: تم فحص الباركود والختم وتبين وجود كسر قبل التحميل)...'
                      : 'Enter physical inspection and verification rationale...'
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                <span className="text-brand-400">🔒</span>
                <span>
                  {isAr ? 'سيتم توليد ختم رقمي مشفر HMAC SHA-256 مرتبط بهوية الموظف' : 'An HMAC-SHA256 digital signature will seal this vote'}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSignOffModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSignOff}
                  className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/30"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isSubmittingSignOff
                      ? (isAr ? 'جاري الاعتماد...' : 'Signing...')
                      : (isAr ? 'تثبيت التوقيع والقرار' : 'Sign & Submit Vote')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Dispute Modal */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-xl text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-red-950/40">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h3 className="text-base font-black text-white">
                  {isAr ? 'تسجيل نزاع / شكوى يدوية (من قبل الإدارة)' : 'Register Manual Dispute Claim'}
                </h3>
              </div>
              <button
                onClick={() => setManualModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualDispute} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {isAr ? 'اختر الشحنة المعنية بالنزاع:' : 'Select Target Shipment:'}
                </label>
                <select
                  value={manualShipmentId}
                  onChange={(e) => setManualShipmentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                >
                  {shipments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.trackingNumber} ({s.itemDescription}) - ${s.declaredValue || s.shippingCost} USD
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{isAr ? 'اسم المطالب:' : 'Claimant Name:'}</label>
                  <input
                    type="text"
                    required
                    value={manualClaimantName}
                    onChange={(e) => setManualClaimantName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{isAr ? 'مبلغ التعويض ($):' : 'Claim Amount ($):'}</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={manualAmount}
                    onChange={(e) => setManualAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">{isAr ? 'سبب النزاع:' : 'Reason:'}</label>
                <select
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="DAMAGED_ITEM">{isAr ? 'تلف أو كسر في محتويات الطرد' : 'Damaged Item'}</option>
                  <option value="TAMPERED_SEAL">{isAr ? 'عبث بالختم الأمني الإلكتروني' : 'Tampered Seal'}</option>
                  <option value="MISSING_PACKAGE">{isAr ? 'فقدان الطرد أو نقص في المحتويات' : 'Missing Package'}</option>
                  <option value="FLIGHT_DELAY_EXTREME">{isAr ? 'تأخر مفرط وإخلال بالموعد' : 'Extreme Delay'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">{isAr ? 'شرح الشكوى والملاحظات:' : 'Complaint Notes:'}</label>
                <textarea
                  rows={3}
                  required
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isCreatingManual}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold"
                >
                  {isCreatingManual ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'تسجيل النزاع' : 'Register Dispute')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Zoom Preview Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 cursor-zoom-out"
        >
          <div className="max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
            <img src={previewPhoto} alt="Zoomed evidence" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
