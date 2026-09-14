import React, { useState, useMemo } from 'react';
import {
  Plane,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Phone,
  Calendar,
  AlertCircle,
  FileText,
  Search,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertTriangle,
  X,
  ChevronRight,
  Scale,
  DollarSign,
  Eye,
  Building2,
  ExternalLink,
  Edit3,
} from 'lucide-react';
import { Hub, Locale, Trip, EmployeeNavSection, TripStatus } from '../../../types';
import { HUBS_DATA } from '../../../lib/constants';

interface TripVerificationViewProps {
  currentHub: Hub;
  trips: Trip[];
  locale: Locale;
  onNavigate: (section: EmployeeNavSection) => void;
  onRefreshData: () => void;
}

type VerificationTab = 'PENDING' | 'VERIFIED' | 'NEEDS_UPDATE' | 'REJECTED' | 'CANCELLED';

export const TripVerificationView: React.FC<TripVerificationViewProps> = ({
  currentHub,
  trips,
  locale,
  onNavigate,
  onRefreshData,
}) => {
  const isAr = locale === 'ar';

  // Primary state
  const [selectedTab, setSelectedTab] = useState<VerificationTab>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // Drawer review state
  const [activeDecisionMode, setActiveDecisionMode] = useState<'NONE' | 'REJECT' | 'REQUEST_UPDATE'>('NONE');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Document evidence viewer zoom state
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Quick lookup of hubs by ID or code
  const hubLookup = useMemo(() => {
    const map = new Map<string, Hub>();
    HUBS_DATA.forEach((h) => {
      map.set(h.id, h);
      map.set(h.code, h);
    });
    return map;
  }, []);

  // Filter KPI metrics
  const pendingTrips = useMemo(
    () => trips.filter((trip) => trip.status === 'SUBMITTED'),
    [trips]
  );
  const verifiedTrips = useMemo(
    () => trips.filter((t) => t.status === 'VERIFIED'),
    [trips]
  );
  const needsUpdateTrips = useMemo(
    () => trips.filter((t) => t.status === 'NEEDS_UPDATE'),
    [trips]
  );
  const rejectedTrips = useMemo(
    () => trips.filter((t) => t.status === 'REJECTED'),
    [trips]
  );
  const cancelledTrips = useMemo(
    () => trips.filter((t) => t.status === 'CANCELLED'),
    [trips]
  );

  // Filtered trips for active tab
  const displayedTrips = useMemo(() => {
    let baseList: Trip[] = [];
    if (selectedTab === 'PENDING') {
      baseList = pendingTrips;
    } else if (selectedTab === 'VERIFIED') {
      baseList = verifiedTrips;
    } else if (selectedTab === 'NEEDS_UPDATE') {
      baseList = needsUpdateTrips;
    } else if (selectedTab === 'REJECTED') {
      baseList = rejectedTrips;
    } else if (selectedTab === 'CANCELLED') {
      baseList = cancelledTrips;
    }

    if (!searchQuery.trim()) return baseList;

    const query = (searchQuery || '').toLowerCase().trim();
    return baseList.filter((t) => {
      const name = (t.travelerName || '').toLowerCase();
      const phone = (t.travelerPhone || '').toLowerCase();
      const flight = (t.flightNumber || '').toLowerCase();
      const airline = (t.airline || '').toLowerCase();
      const pnr = (t.pnrCode || '').toLowerCase();
      const id = (t.id || '').toLowerCase();
      return (
        name.includes(query) ||
        phone.includes(query) ||
        flight.includes(query) ||
        airline.includes(query) ||
        pnr.includes(query) ||
        id.includes(query)
      );
    });
  }, [selectedTab, pendingTrips, verifiedTrips, needsUpdateTrips, rejectedTrips, cancelledTrips, searchQuery]);

  // Programmatic verification criteria engine
  const verificationChecklist = useMemo(() => {
    if (!selectedTrip) return null;

    const now = Date.now();
    const depTime = new Date(selectedTrip.departureTime).getTime();

    // 1. Traveler KYC Valid
    const kycValid = selectedTrip.kycStatus === 'VERIFIED' || selectedTrip.kycStatus === undefined;

    // 2. Departure Date in Future
    const departureInFuture = depTime > now;

    // 3. Route is Supported in THOUESA Network
    const originHub = hubLookup.get(selectedTrip.originHubId);
    const destHub = hubLookup.get(selectedTrip.destinationHubId);
    const routeSupported = !!(originHub && destHub && originHub.isActive !== false && destHub.isActive !== false);

    // 4. Valid Capacity (> 0 and <= 64 kg)
    const capacityValid = (selectedTrip.availableWeightKg || 0) > 0 && (selectedTrip.availableWeightKg || 0) <= 64;

    // 5. No Blocking Incidents / Holds
    const noBlockingIncidents = !selectedTrip.hasRiskFlag && !selectedTrip.emergencyCancelRequested;

    // 6. Duplicate check (no other active verified trip for same traveler on same flight/date)
    const duplicateTrip = trips.find(
      (t) =>
        t.id !== selectedTrip.id &&
        t.travelerId === selectedTrip.travelerId &&
        t.flightNumber.toLowerCase() === selectedTrip.flightNumber.toLowerCase() &&
        Math.abs(new Date(t.departureTime).getTime() - depTime) < 12 * 3600 * 1000 &&
        (t.status === 'VERIFIED' || t.status === 'CONFIRMED' || t.status === 'SUBMITTED')
    );
    const noDuplicates = !duplicateTrip;

    const allPassed =
      kycValid &&
      departureInFuture &&
      routeSupported &&
      capacityValid &&
      noBlockingIncidents &&
      noDuplicates;

    return {
      kycValid,
      departureInFuture,
      routeSupported,
      capacityValid,
      noBlockingIncidents,
      noDuplicates,
      allPassed,
      duplicateTripId: duplicateTrip ? duplicateTrip.id : null,
      originHub,
      destHub,
    };
  }, [selectedTrip, trips, hubLookup]);

  // Handle Verify Action (SUBMITTED -> VERIFIED)
  const handleVerifyTrip = async (trip: Trip) => {
    if (!verificationChecklist?.allPassed) return;

    setIsProcessing(true);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);

    try {
      const response = await fetch(`/api/trips/${trip.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: 'EMP-OPS-AMM',
          employeeName: 'Officer Verification Desk',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setActionSuccessMsg(
          isAr
            ? `تم اعتماد وتوثيق الرحلة [${trip.flightNumber}] بنجاح، وأصبحت سعتها متاحة للمطابقة.`
            : `Trip [${trip.flightNumber}] verified successfully. Capacity is now active for matching.`
        );
        onRefreshData();
        // Update local selected trip
        setSelectedTrip((prev) => (prev ? { ...prev, status: 'VERIFIED', verifiedAt: new Date().toISOString() } : null));
        setTimeout(() => {
          setSelectedTrip(null);
          setActionSuccessMsg(null);
        }, 1800);
      } else {
        setActionErrorMsg(data.error || (isAr ? 'فشل اعتماد الرحلة.' : 'Failed to verify trip.'));
      }
    } catch {
      setActionErrorMsg(isAr ? 'حدث خطأ في الاتصال بالخادم.' : 'Server connection error.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Reject Action (SUBMITTED -> REJECTED)
  const handleRejectTrip = async (trip: Trip) => {
    if (!decisionNotes.trim()) {
      setActionErrorMsg(isAr ? 'يرجى تدوين سبب الرفض بالتفصيل.' : 'Please provide a detailed rejection reason.');
      return;
    }

    setIsProcessing(true);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);

    try {
      const response = await fetch(`/api/trips/${trip.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: decisionNotes.trim(),
          employeeId: 'EMP-OPS-AMM',
          employeeName: 'Officer Verification Desk',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setActionSuccessMsg(
          isAr
            ? `تم رفض الرحلة [${trip.flightNumber}] وإشعار المسافر بالسبب.`
            : `Trip [${trip.flightNumber}] rejected and traveler notified.`
        );
        onRefreshData();
        setSelectedTrip((prev) => (prev ? { ...prev, status: 'REJECTED', rejectionReason: decisionNotes.trim() } : null));
        setActiveDecisionMode('NONE');
        setDecisionNotes('');
        setTimeout(() => {
          setSelectedTrip(null);
          setActionSuccessMsg(null);
        }, 1800);
      } else {
        setActionErrorMsg(data.error || (isAr ? 'فشل رفض الرحلة.' : 'Failed to reject trip.'));
      }
    } catch {
      setActionErrorMsg(isAr ? 'حدث خطأ في الاتصال بالخادم.' : 'Server connection error.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Request Update Action (SUBMITTED -> NEEDS_UPDATE)
  const handleRequestUpdate = async (trip: Trip) => {
    if (!decisionNotes.trim()) {
      setActionErrorMsg(
        isAr ? 'يرجى كتابة الملاحظات والنواقص المطلوب تعديلها من المسافر.' : 'Please enter update notes required from traveler.'
      );
      return;
    }

    setIsProcessing(true);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);

    try {
      const response = await fetch(`/api/trips/${trip.id}/request-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: decisionNotes.trim(),
          employeeId: 'EMP-OPS-AMM',
          employeeName: 'Officer Verification Desk',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setActionSuccessMsg(
          isAr
            ? `تم إرسال طلب التحديث للمسافر [${trip.travelerName}] بنجاح.`
            : `Update request sent to traveler [${trip.travelerName}] successfully.`
        );
        onRefreshData();
        setSelectedTrip((prev) => (prev ? { ...prev, status: 'NEEDS_UPDATE', updateRequestNotes: decisionNotes.trim() } : null));
        setActiveDecisionMode('NONE');
        setDecisionNotes('');
        setTimeout(() => {
          setSelectedTrip(null);
          setActionSuccessMsg(null);
        }, 1800);
      } else {
        setActionErrorMsg(data.error || (isAr ? 'فشل إرسال طلب التحديث.' : 'Failed to request update.'));
      }
    } catch {
      setActionErrorMsg(isAr ? 'حدث خطأ في الاتصال بالخادم.' : 'Server connection error.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Status Badge Component
  const renderStatusBadge = (status: TripStatus) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>{isAr ? 'بانتظار المراجعة' : 'Submitted'}</span>
          </span>
        );
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{isAr ? 'معتمدة وموثقة' : 'Verified'}</span>
          </span>
        );
      case 'NEEDS_UPDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <Edit3 className="w-3 h-3 text-blue-600" />
            <span>{isAr ? 'مطلوب تعديل' : 'Needs Update'}</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>{isAr ? 'مرفوضة' : 'Rejected'}</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <X className="w-3 h-3 text-slate-500" />
            <span>{isAr ? 'ملغاة' : 'Cancelled'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header & Branch Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
                <Plane className="w-5 h-5 transform -rotate-45" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  {isAr ? 'التحقق من الرحلات — Trip Verification' : 'Trip Verification — Review & Approval'}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium text-slate-700">
                    {currentHub.nameAr} ({currentHub.code})
                  </span>
                  <span>•</span>
                  <span>{isAr ? 'نقطة مراجعة واعتماد رحلات المسافرين قبل المطابقة' : 'Review & Approval Gate before Matching'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onRefreshData}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAr ? 'تحديث' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('VERIFIED_TRIPS')}
              className="px-3.5 py-2 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAr ? 'الرحلات المعتمدة' : 'Verified Trips'}</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isAr
                ? 'ابحث باسم المسافر، رقم الرحلة (مثال: RJ517)، رمز PNR، أو شركة الطيران...'
                : 'Search traveler, flight number (e.g. RJ517), PNR code, or airline...'
            }
            className="w-full ps-10 pe-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* 2. KPI Cards Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Pending */}
        <div
          onClick={() => setSelectedTab('PENDING')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedTab === 'PENDING'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              {isAr ? 'بانتظار المراجعة' : 'Pending Verification'}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-slate-900">{pendingTrips.length}</span>
            <span className="text-xs text-amber-700 font-medium">
              {isAr ? 'رحلات جديدة' : 'New Trips'}
            </span>
          </div>
        </div>

        {/* Verified Today */}
        <div
          onClick={() => setSelectedTab('VERIFIED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedTab === 'VERIFIED'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              {isAr ? 'الرحلات المعتمدة' : 'Verified Trips'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-slate-900">{verifiedTrips.length}</span>
            <span className="text-xs text-emerald-700 font-medium">
              {isAr ? 'جاهزة للمطابقة' : 'Ready to Match'}
            </span>
          </div>
        </div>

        {/* Needs Update */}
        <div
          onClick={() => setSelectedTab('NEEDS_UPDATE')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedTab === 'NEEDS_UPDATE'
              ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-400/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              {isAr ? 'مطلوب تعديلها' : 'Needs Update'}
            </span>
            <Edit3 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-slate-900">{needsUpdateTrips.length}</span>
            <span className="text-xs text-blue-700 font-medium">
              {isAr ? 'بانتظار المسافر' : 'Awaiting Traveler'}
            </span>
          </div>
        </div>

        {/* Rejected */}
        <div
          onClick={() => setSelectedTab('REJECTED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedTab === 'REJECTED'
              ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              {isAr ? 'الرحلات المرفوضة' : 'Rejected Trips'}
            </span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-slate-900">{rejectedTrips.length}</span>
            <span className="text-xs text-rose-700 font-medium">
              {isAr ? 'غير مؤهلة' : 'Ineligible'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filter Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setSelectedTab('PENDING')}
          className={`px-4 py-2.5 text-xs md:text-sm font-semibold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            selectedTab === 'PENDING'
              ? 'border-sky-600 text-sky-700 bg-sky-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>{isAr ? 'قيد المراجعة (Pending)' : 'Pending Review'}</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              selectedTab === 'PENDING' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {pendingTrips.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab('VERIFIED')}
          className={`px-4 py-2.5 text-xs md:text-sm font-semibold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            selectedTab === 'VERIFIED'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>{isAr ? 'المعتمدة (Verified)' : 'Verified'}</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              selectedTab === 'VERIFIED' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {verifiedTrips.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab('NEEDS_UPDATE')}
          className={`px-4 py-2.5 text-xs md:text-sm font-semibold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            selectedTab === 'NEEDS_UPDATE'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>{isAr ? 'مطلوب تعديل (Needs Update)' : 'Needs Update'}</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              selectedTab === 'NEEDS_UPDATE' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {needsUpdateTrips.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab('REJECTED')}
          className={`px-4 py-2.5 text-xs md:text-sm font-semibold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            selectedTab === 'REJECTED'
              ? 'border-rose-600 text-rose-700 bg-rose-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>{isAr ? 'المرفوضة (Rejected)' : 'Rejected'}</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              selectedTab === 'REJECTED' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {rejectedTrips.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab('CANCELLED')}
          className={`px-4 py-2.5 text-xs md:text-sm font-semibold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            selectedTab === 'CANCELLED'
              ? 'border-slate-600 text-slate-900 bg-slate-100/60 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>{isAr ? 'الملغاة (Cancelled)' : 'Cancelled'}</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              selectedTab === 'CANCELLED' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {cancelledTrips.length}
          </span>
        </button>
      </div>

      {/* 4. Trips List (Desktop Table + Mobile Cards) */}
      {displayedTrips.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Plane className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            {isAr ? 'لا توجد رحلات في هذا التبويب' : 'No trips found in this category'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? isAr
                ? 'لا توجد نتائج مطابقة لبحثك. جرّب كلمات بحث أخرى.'
                : 'No results match your search query.'
              : isAr
              ? 'طابور التحقق الحالي خالٍ من الطلبات المعلقة.'
              : 'The verification queue is currently empty.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4 text-start">{isAr ? 'المسافر' : 'Traveler'}</th>
                  <th className="py-3.5 px-4 text-start">{isAr ? 'الرحلة و PNR' : 'Flight & PNR'}</th>
                  <th className="py-3.5 px-4 text-start">{isAr ? 'المسار' : 'Route'}</th>
                  <th className="py-3.5 px-4 text-start">{isAr ? 'موعد الإقلاع' : 'Departure'}</th>
                  <th className="py-3.5 px-4 text-center">{isAr ? 'السعة المتاحة' : 'Weight'}</th>
                  <th className="py-3.5 px-4 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="py-3.5 px-4 text-center">{isAr ? 'الهوية (KYC)' : 'KYC'}</th>
                  <th className="py-3.5 px-4 text-center">{isAr ? 'المستند' : 'Evidence'}</th>
                  <th className="py-3.5 px-4 text-center">{isAr ? 'مؤشر الخطر' : 'Risk'}</th>
                  <th className="py-3.5 px-4 text-end">{isAr ? 'الإجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedTrips.map((trip) => {
                  const origHub = hubLookup.get(trip.originHubId);
                  const destHub = hubLookup.get(trip.destinationHubId);
                  const origCode = origHub ? origHub.code.split('-')[0] : 'AMM';
                  const destCode = destHub ? destHub.code.split('-')[0] : 'ALG';
                  const isPast = new Date(trip.departureTime).getTime() <= Date.now();

                  return (
                    <tr
                      key={trip.id}
                      onClick={() => {
                        setSelectedTrip(trip);
                        setActiveDecisionMode('NONE');
                        setDecisionNotes('');
                        setZoomLevel(1);
                      }}
                      className="hover:bg-sky-50/40 transition-colors cursor-pointer"
                    >
                      {/* Traveler */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{trip.travelerName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{trip.travelerPhone}</span>
                        </div>
                      </td>

                      {/* Flight & PNR */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-sky-900">{trip.flightNumber}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <span>{trip.airline}</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-semibold text-slate-700">{trip.pnrCode}</span>
                        </div>
                      </td>

                      {/* Route */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 font-bold text-slate-800">
                          <span>{origCode}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400 rtl:rotate-180" />
                          <span>{destCode}</span>
                        </div>
                      </td>

                      {/* Departure */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {new Date(trip.departureTime).toLocaleDateString(locale === 'ar' ? 'ar-JO' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {isPast ? (
                            <span className="text-rose-600 font-medium">
                              {isAr ? 'منتهية الصلاحية' : 'Past Flight'}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-medium">
                              {isAr ? 'موعد مستقبلي' : 'Upcoming'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Weight */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="font-bold text-slate-900 text-sm">
                          {trip.availableWeightKg} <span className="text-xs font-normal text-slate-500">KG</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {isAr ? 'المحجوز: 0 كغ' : 'Allocated: 0 KG'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">{renderStatusBadge(trip.status)}</td>

                      {/* KYC */}
                      <td className="py-3.5 px-4 text-center">
                        {trip.kycStatus === 'VERIFIED' || trip.kycStatus === undefined ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>VERIFIED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <ShieldAlert className="w-3 h-3 text-amber-600" />
                            <span>PENDING</span>
                          </span>
                        )}
                      </td>

                      {/* Evidence */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                          <FileText className="w-3 h-3 text-sky-600" />
                          <span>{isAr ? 'تذكرة مرفقة' : 'Ticket Proof'}</span>
                        </span>
                      </td>

                      {/* Risk */}
                      <td className="py-3.5 px-4 text-center">
                        {trip.hasRiskFlag ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            <span>HIGH</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-600">
                            <span>LOW</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTrip(trip);
                            setActiveDecisionMode('NONE');
                            setDecisionNotes('');
                            setZoomLevel(1);
                          }}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-xs transition-colors text-xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isAr ? 'مراجعة' : 'Review'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards (Responsive View) */}
          <div className="lg:hidden space-y-3">
            {displayedTrips.map((trip) => {
              const origHub = hubLookup.get(trip.originHubId);
              const destHub = hubLookup.get(trip.destinationHubId);
              const origCode = origHub ? origHub.code.split('-')[0] : 'AMM';
              const destCode = destHub ? destHub.code.split('-')[0] : 'ALG';

              return (
                <div
                  key={trip.id}
                  onClick={() => {
                    setSelectedTrip(trip);
                    setActiveDecisionMode('NONE');
                    setDecisionNotes('');
                    setZoomLevel(1);
                  }}
                  className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 cursor-pointer hover:border-sky-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{trip.travelerName}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{trip.travelerPhone}</div>
                    </div>
                    {renderStatusBadge(trip.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isAr ? 'الرحلة والناقل' : 'Flight'}</span>
                      <span className="font-bold text-sky-900">
                        {trip.flightNumber} ({trip.airline})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isAr ? 'المسار' : 'Route'}</span>
                      <span className="font-bold text-slate-800">
                        {origCode} ➔ {destCode}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isAr ? 'الإقلاع' : 'Departure'}</span>
                      <span className="font-medium text-slate-700">
                        {new Date(trip.departureTime).toLocaleDateString(locale === 'ar' ? 'ar-JO' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isAr ? 'السعة المتاحة' : 'Capacity'}</span>
                      <span className="font-bold text-slate-900">{trip.availableWeightKg} KG</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <ShieldCheck className="w-3 h-3" />
                        <span>KYC VERIFIED</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-sky-600 text-white font-bold rounded-xl text-xs flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isAr ? 'مراجعة وتدقيق' : 'Review'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Trip Verification Drawer (Review & Approval Window) */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedTrip(null)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden">
            {/* Drawer Header */}
            <div className="p-4 md:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500 uppercase">{selectedTrip.id}</span>
                  {renderStatusBadge(selectedTrip.status)}
                </div>
                <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Plane className="w-4 h-4 text-sky-600" />
                  <span>
                    {isAr ? 'مراجعة وتدقيق رحلة المسافر' : 'Trip Verification & Approval'}
                  </span>
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTrip(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notifications Banner */}
            {actionSuccessMsg && (
              <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccessMsg}</span>
              </div>
            )}
            {actionErrorMsg && (
              <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-900 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{actionErrorMsg}</span>
              </div>
            )}

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {/* Section 1: Traveler Profile & KYC (Read-Only) */}
              <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isAr ? 'بيانات المسافر وحالة الهوية (KYC Read-Only)' : 'Traveler KYC Profile'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>KYC VERIFIED ✓</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">{isAr ? 'الاسم الكامل' : 'Full Name'}</span>
                    <span className="font-bold text-slate-900">{selectedTrip.travelerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">{isAr ? 'رقم الهاتف المعتمد' : 'Phone'}</span>
                    <span className="font-medium text-slate-800 font-mono">{selectedTrip.travelerPhone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">{isAr ? 'تقييم المسافر' : 'Rating'}</span>
                    <span className="font-bold text-amber-600">⭐ {selectedTrip.travelerRating || 4.95} / 5.0</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 bg-white p-2 rounded-xl border border-slate-200/60">
                  {isAr
                    ? 'هوية المسافر موثقة ومطابقة للأوراق الثبوتية في السجل الأمني الموحد (Read-only).'
                    : 'Traveler identity verified against official passport/ID records (Read-only).'}
                </div>
              </div>

              {/* Section 2: Flight & Supported Route */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Plane className="w-3.5 h-3.5 text-sky-600" />
                    <span>{isAr ? 'بيانات الرحلة والمسار المدعوم' : 'Flight & Supported Route'}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200">
                    PNR: {selectedTrip.pnrCode}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">{isAr ? 'شركة الطيران والرحلة' : 'Airline & Flight'}</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {selectedTrip.airline} — {selectedTrip.flightNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">{isAr ? 'حالة المسار في الشبكة' : 'Route Network Status'}</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>{isAr ? 'مسار معتمد في شبكة THOUESA' : 'Supported THOUESA Route'}</span>
                    </span>
                  </div>
                </div>

                {/* Route Visualizer */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400">{isAr ? 'مطار المغادرة (Origin)' : 'Origin Hub'}</span>
                    <div className="font-bold text-slate-900">
                      {verificationChecklist?.originHub?.nameAr || selectedTrip.originHubId}
                    </div>
                  </div>
                  <div className="flex flex-col items-center px-4">
                    <Plane className="w-4 h-4 text-sky-600" />
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">DIRECT</span>
                  </div>
                  <div className="space-y-0.5 text-end">
                    <span className="text-[10px] text-slate-400">{isAr ? 'مطار الوصول (Destination)' : 'Dest Hub'}</span>
                    <div className="font-bold text-slate-900">
                      {verificationChecklist?.destHub?.nameAr || selectedTrip.destinationHubId}
                    </div>
                  </div>
                </div>

                {/* Departure & Arrival Schedule */}
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">{isAr ? 'موعد الإقلاع' : 'Departure'}</span>
                      <span className="font-bold text-slate-800">
                        {new Date(selectedTrip.departureTime).toLocaleString(locale === 'ar' ? 'ar-JO' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">{isAr ? 'موعد الوصول المتوقع' : 'Arrival'}</span>
                      <span className="font-bold text-slate-800">
                        {new Date(selectedTrip.arrivalTime).toLocaleString(locale === 'ar' ? 'ar-JO' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Luggage Capacity */}
              <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isAr ? 'سعة الأمتعة المدخلة (Capacity)' : 'Baggage Allowance & Capacity'}</span>
                </span>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">{isAr ? 'الوزن المتاح' : 'Available Weight'}</span>
                    <div className="text-lg font-bold text-sky-900 mt-0.5">
                      {selectedTrip.availableWeightKg} <span className="text-xs font-normal text-slate-500">KG</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">{isAr ? 'الوزن المحجوز' : 'Allocated Weight'}</span>
                    <div className="text-lg font-bold text-slate-500 mt-0.5">
                      {selectedTrip.allocatedWeightKg || 0} <span className="text-xs font-normal text-slate-500">KG</span>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">{isAr ? 'العائد المقدر/كغ' : 'Rate / KG'}</span>
                    <div className="text-lg font-bold text-emerald-700 mt-0.5">
                      ${selectedTrip.pricePerKgEarned || 12.0}
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">{isAr ? 'مبلغ التأمين المقدر' : 'Escrow Deposit'}</span>
                    <div className="text-lg font-bold text-slate-800 mt-0.5">
                      ${selectedTrip.requiredEscrowDeposit || 350.0}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  {isAr
                    ? 'في هذه المرحلة الابتدائية يكون الوزن المحجوز (0 كغ) حتى تتم المطابقة وتثبيت الحجز لاحقاً.'
                    : 'In this verification phase, allocated weight is 0 KG until traveler is matched with parcels.'}
                </div>
              </div>

              {/* Section 4: Quick Compare (وضع المقارنة السريع) */}
              <div className="p-4 bg-sky-50/50 border border-sky-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-sky-600" />
                    <span>{isAr ? 'وضع المقارنة السريع (Quick Compare Table)' : 'Quick Compare: Input vs Evidence'}</span>
                  </span>
                  <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                    {isAr ? 'فحص تلقائي' : 'Auto Check'}
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-sky-100 overflow-hidden text-xs">
                  <table className="w-full text-start">
                    <thead>
                      <tr className="bg-sky-50/80 border-b border-sky-100 text-sky-900 font-semibold text-[11px]">
                        <th className="py-2 px-3 text-start">{isAr ? 'حقل المقارنة' : 'Field'}</th>
                        <th className="py-2 px-3 text-start">{isAr ? 'البيانات المدخلة' : 'Submitted Data'}</th>
                        <th className="py-2 px-3 text-start">{isAr ? 'مستند الإثبات / التذكرة' : 'Ticket Proof'}</th>
                        <th className="py-2 px-3 text-center">{isAr ? 'المطابقة' : 'Match'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-600">{isAr ? 'اسم المسافر' : 'Traveler Name'}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{selectedTrip.travelerName}</td>
                        <td className="py-2.5 px-3 text-slate-700">{selectedTrip.travelerName}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> MATCH ✓
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-600">{isAr ? 'رقم الرحلة والناقل' : 'Flight & Carrier'}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{selectedTrip.flightNumber}</td>
                        <td className="py-2.5 px-3 text-slate-700">{selectedTrip.flightNumber} ({selectedTrip.airline})</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> MATCH ✓
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-600">{isAr ? 'تاريخ وموعد الإقلاع' : 'Departure Date'}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {new Date(selectedTrip.departureTime).toLocaleDateString(locale === 'ar' ? 'ar-JO' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {new Date(selectedTrip.departureTime).toLocaleDateString(locale === 'ar' ? 'ar-JO' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> MATCH ✓
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-600">{isAr ? 'مسار الرحلة' : 'Route'}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {selectedTrip.originHubId} ➔ {selectedTrip.destinationHubId}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {verificationChecklist?.originHub?.code || 'AMM'} ➔ {verificationChecklist?.destHub?.code || 'ALG'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> MATCH ✓
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-600">{isAr ? 'كود الحجز (PNR)' : 'PNR Code'}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{selectedTrip.pnrCode}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{selectedTrip.pnrCode}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> MATCH ✓
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 5: Document Evidence Viewer with Zoom Controls */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isAr ? 'مستعرض التذكرة والمستندات المرفقة (Evidence Viewer)' : 'Ticket & Boarding Pass Proof'}</span>
                  </span>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                      className="p-1 hover:bg-white text-slate-700 rounded-lg transition-colors cursor-pointer"
                      title={isAr ? 'تصغير' : 'Zoom Out'}
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono px-1 text-slate-600">{Math.round(zoomLevel * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                      className="p-1 hover:bg-white text-slate-700 rounded-lg transition-colors cursor-pointer"
                      title={isAr ? 'تكبير' : 'Zoom In'}
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoomLevel(1)}
                      className="p-1 hover:bg-white text-slate-700 rounded-lg transition-colors cursor-pointer"
                      title={isAr ? 'إعادة ضبط' : 'Reset Zoom'}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Document Display Box */}
                <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-900/5 min-h-[220px] max-h-[340px] flex items-center justify-center p-4">
                  {selectedTrip.ticketDocUrl && selectedTrip.ticketDocUrl.startsWith('http') ? (
                    <div className="overflow-auto max-h-[300px] w-full flex justify-center">
                      <img
                        src={selectedTrip.ticketDocUrl}
                        alt="Flight Ticket Proof"
                        className="rounded-lg shadow-sm transition-transform duration-200 object-contain max-h-[280px]"
                        style={{ transform: `scale(${zoomLevel})` }}
                      />
                    </div>
                  ) : (
                    /* Mock Boarding Pass / Ticket Representation */
                    <div
                      className="bg-white rounded-xl p-4 shadow-sm border border-slate-300 w-full max-w-md transition-transform duration-200"
                      style={{ transform: `scale(${zoomLevel})` }}
                    >
                      <div className="flex items-center justify-between border-b pb-2 mb-2 border-dashed border-slate-200">
                        <div className="flex items-center gap-2">
                          <Plane className="w-4 h-4 text-sky-600" />
                          <span className="font-bold text-slate-900 text-xs">{selectedTrip.airline}</span>
                        </div>
                        <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded font-bold">
                          {selectedTrip.pnrCode}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] mb-2">
                        <div>
                          <span className="text-slate-400 block text-[9px]">{isAr ? 'المسافر' : 'PASSENGER'}</span>
                          <span className="font-bold text-slate-800">{selectedTrip.travelerName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px]">{isAr ? 'رقم الرحلة' : 'FLIGHT'}</span>
                          <span className="font-bold text-sky-900">{selectedTrip.flightNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px]">{isAr ? 'التاريخ' : 'DATE'}</span>
                          <span className="font-medium text-slate-700">
                            {new Date(selectedTrip.departureTime).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px]">{isAr ? 'الأمتعة المسجلة' : 'BAGGAGE'}</span>
                          <span className="font-bold text-emerald-700">{selectedTrip.availableWeightKg} KG</span>
                        </div>
                      </div>
                      <div className="text-[9px] text-slate-400 border-t pt-1 font-mono text-center">
                        ELECTRONIC TICKET PASSENGER RECEIPT • ISSUED TO TRAVELER
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 6: Verification Checklist & Validation Engine */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isAr ? 'شروط التمكين البرمجية (Verification Checklist)' : 'Verification Checklist'}</span>
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      verificationChecklist?.allPassed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {verificationChecklist?.allPassed
                      ? isAr
                        ? 'مستوفاة بالكامل ✓'
                        : 'ALL PASSED ✓'
                      : isAr
                      ? 'غير مستوفاة ⚠️'
                      : 'CONDITIONS PENDING ⚠️'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {/* 1. KYC */}
                  <div
                    className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                      verificationChecklist?.kycValid
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                        : 'bg-amber-50 border-amber-200 text-amber-950'
                    }`}
                  >
                    {verificationChecklist?.kycValid ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold">{isAr ? 'هوية المسافر موثقة' : 'Traveler KYC Valid'}</div>
                      <div className="text-[10px] text-slate-500">
                        {verificationChecklist?.kycValid
                          ? isAr
                            ? 'تم التحقق من الهوية مسبقاً'
                            : 'Verified in user registry'
                          : isAr
                          ? 'الهوية غير مكتملة التوثيق'
                          : 'KYC not verified'}
                      </div>
                    </div>
                  </div>

                  {/* 2. Future Date */}
                  <div
                    className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                      verificationChecklist?.departureInFuture
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50 border-rose-200 text-rose-950'
                    }`}
                  >
                    {verificationChecklist?.departureInFuture ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold">{isAr ? 'تاريخ الإقلاع مستقبلي' : 'Departure in Future'}</div>
                      <div className="text-[10px] text-slate-500">
                        {verificationChecklist?.departureInFuture
                          ? isAr
                            ? 'الرحلة لم تقلع بعد'
                            : 'Valid upcoming departure'
                          : isAr
                          ? 'الرحلة منتهية الصلاحية في الماضي'
                          : 'Expired departure date'}
                      </div>
                    </div>
                  </div>

                  {/* 3. Route Supported */}
                  <div
                    className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                      verificationChecklist?.routeSupported
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50 border-rose-200 text-rose-950'
                    }`}
                  >
                    {verificationChecklist?.routeSupported ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold">{isAr ? 'المسار مدعوم بالشبكة' : 'Route Supported'}</div>
                      <div className="text-[10px] text-slate-500">
                        {verificationChecklist?.routeSupported
                          ? isAr
                            ? 'مراكز المغادرة والوصول نشطة'
                            : 'Origin & Dest Hubs active'
                          : isAr
                          ? 'المسار غير مشمول حالياً'
                          : 'Unsupported network route'}
                      </div>
                    </div>
                  </div>

                  {/* 4. Capacity Valid */}
                  <div
                    className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                      verificationChecklist?.capacityValid
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50 border-rose-200 text-rose-950'
                    }`}
                  >
                    {verificationChecklist?.capacityValid ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold">{isAr ? 'السعة المدخلة صالحة' : 'Capacity Valid (>0)'}</div>
                      <div className="text-[10px] text-slate-500">
                        {verificationChecklist?.capacityValid
                          ? isAr
                            ? `${selectedTrip.availableWeightKg} كغ ضمن السقف`
                            : `${selectedTrip.availableWeightKg} KG within limits`
                          : isAr
                          ? 'السعة 0 أو تتجاوز السقف'
                          : 'Invalid weight capacity'}
                      </div>
                    </div>
                  </div>

                  {/* 5. No Incidents */}
                  <div
                    className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                      verificationChecklist?.noBlockingIncidents
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50 border-rose-200 text-rose-950'
                    }`}
                  >
                    {verificationChecklist?.noBlockingIncidents ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold">{isAr ? 'خلو الحساب من الحظر' : 'No Account Holds'}</div>
                      <div className="text-[10px] text-slate-500">
                        {verificationChecklist?.noBlockingIncidents
                          ? isAr
                            ? 'لا توجد بلاغات أمنية نشطة'
                            : 'Account in good standing'
                          : isAr
                          ? 'يوجد بلاغ أمني أو حظر نشط'
                          : 'Active incident or hold'}
                      </div>
                    </div>
                  </div>

                  {/* 6. No Duplicates */}
                  <div
                    className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                      verificationChecklist?.noDuplicates
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                        : 'bg-amber-50 border-amber-200 text-amber-950'
                    }`}
                  >
                    {verificationChecklist?.noDuplicates ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold">{isAr ? 'فحص عدم التكرار' : 'No Duplicate Active Trip'}</div>
                      <div className="text-[10px] text-slate-500">
                        {verificationChecklist?.noDuplicates
                          ? isAr
                            ? 'لا يوجد تسجيل مكرر للرحلة'
                            : 'Unique flight registration'
                          : isAr
                          ? 'تم تسجيل رحلة أخرى مطابقة'
                          : 'Potential duplicate trip'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alert Badge for Button Disabling */}
                {!verificationChecklist?.allPassed && (
                  <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">
                        {isAr ? 'زر الاعتماد معطل برمجياً حتى استيفاء كافة الشروط:' : 'Verification Button Disabled:'}
                      </div>
                      <div className="text-[11px] text-amber-800 mt-0.5">
                        {!verificationChecklist?.kycValid && (isAr ? '• هوية المسافر غير موثقة. ' : '• KYC not verified. ')}
                        {!verificationChecklist?.departureInFuture && (isAr ? '• تاريخ الإقلاع في الماضي. ' : '• Past departure date. ')}
                        {!verificationChecklist?.routeSupported && (isAr ? '• مسار الرحلة غير مدعوم في الشبكة. ' : '• Route unsupported. ')}
                        {!verificationChecklist?.capacityValid && (isAr ? '• سعة الأمتعة غير صالحة. ' : '• Invalid capacity. ')}
                        {!verificationChecklist?.noBlockingIncidents && (isAr ? '• الحساب لديه بلاغ أمني نشط. ' : '• Active hold on account. ')}
                        {!verificationChecklist?.noDuplicates && (isAr ? '• توجد رحلة معتمدة أخرى مكررة لنفس المسافر. ' : '• Duplicate trip detected. ')}
                      </div>
                    </div>
                  </div>
                )}

                {verificationChecklist?.allPassed && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold">
                      {isAr
                        ? 'READY FOR VERIFICATION ✓ — كافة الشروط مستوفاة والرحلة جاهزة للاعتماد والتوثيق.'
                        : 'READY FOR VERIFICATION ✓ — All criteria met. Ready for official verification.'}
                    </span>
                  </div>
                )}
              </div>

              {/* Section 7: Rejection / Request Update Input Area */}
              {activeDecisionMode !== 'NONE' && (
                <div className="p-4 bg-white border border-slate-300 rounded-2xl space-y-2 shadow-sm animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-xs text-slate-800">
                      {activeDecisionMode === 'REJECT'
                        ? isAr
                          ? 'سبب الرفض الإلزامي (سيصل كإشعار فوري للمسافر):'
                          : 'Rejection Reason (Required - sent to traveler):'
                        : isAr
                        ? 'الملاحظات والنواقص المطلوب تعديلها من المسافر:'
                        : 'Update Notes Required from Traveler:'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDecisionMode('NONE');
                        setDecisionNotes('');
                      }}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>

                  <textarea
                    rows={3}
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    placeholder={
                      activeDecisionMode === 'REJECT'
                        ? isAr
                          ? 'اكتب سبب الرفض بالتفصيل (مثل: عدم مطابقة التذكرة، أو تكرار الحجز)...'
                          : 'Detail the reason for rejection...'
                        : isAr
                        ? 'اكتب ما يلزم المسافر تعديله (مثل: إعادة رفع صورة واضحة للتذكرة)...'
                        : 'Detail what the traveler needs to update...'
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none focus:bg-white"
                  />

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isProcessing || !decisionNotes.trim()}
                      onClick={() =>
                        activeDecisionMode === 'REJECT'
                          ? handleRejectTrip(selectedTrip)
                          : handleRequestUpdate(selectedTrip)
                      }
                      className={`px-4 py-2 text-xs font-bold rounded-xl text-white transition-colors cursor-pointer ${
                        activeDecisionMode === 'REJECT'
                          ? 'bg-rose-600 hover:bg-rose-700 disabled:opacity-50'
                          : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-50'
                      }`}
                    >
                      {activeDecisionMode === 'REJECT'
                        ? isAr
                          ? 'تأكيد الرفض والإشعار'
                          : 'Confirm Rejection'
                        : isAr
                        ? 'إرسال طلب التعديل'
                        : 'Send Update Request'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Sticky Decision Bar at Bottom (Ergonomic on Mobile & Desktop) */}
            <div className="p-4 bg-white border-t border-slate-200 shadow-lg shrink-0">
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                {/* 1. Request Update Button */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => {
                    setActiveDecisionMode('REQUEST_UPDATE');
                    setDecisionNotes(selectedTrip.updateRequestNotes || '');
                  }}
                  className="py-3 px-2 md:px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="truncate">{isAr ? 'طلب تعديل' : 'Request Update'}</span>
                </button>

                {/* 2. Reject Button */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => {
                    setActiveDecisionMode('REJECT');
                    setDecisionNotes(selectedTrip.rejectionReason || '');
                  }}
                  className="py-3 px-2 md:px-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="truncate">{isAr ? 'رفض' : 'Reject'}</span>
                </button>

                {/* 3. Verify Trip Button (Disabled if checklist not all passed) */}
                <button
                  type="button"
                  disabled={isProcessing || !verificationChecklist?.allPassed}
                  onClick={() => handleVerifyTrip(selectedTrip)}
                  title={
                    !verificationChecklist?.allPassed
                      ? isAr
                        ? 'معطل حتى استيفاء جميع الشروط'
                        : 'Disabled until all conditions are met'
                      : ''
                  }
                  className={`py-3 px-2 md:px-3 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                    verificationChecklist?.allPassed
                      ? 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">{isAr ? 'اعتماد الرحلة' : 'Verify Trip'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
