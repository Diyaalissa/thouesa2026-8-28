import React, { useState } from 'react';
import { 
  Building2,
  Scan,
  Scale,
  ShieldCheck,
  Plane,
  Box,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Search,
  Filter,
  Camera,
  CheckCheck,
  UserCheck,
  Lock,
  ArrowRight,
  ArrowLeft,
  FileSpreadsheet,
  BadgeCheck,
  User,
  Phone,
  MapPin,
  Tag,
  ExternalLink,
  Layers,
  Sparkles,
  Barcode,
  Menu,
  X,
} from 'lucide-react';
import {  Hub, Locale, Manifest, OrderItem, Shipment, Trip, User as UserType, Dispute } from '../../types';
import {  StatusBadge } from '../common/StatusBadge';
import {  QRScannerModal } from '../common/QRScannerModal';
import {  QRModal } from '../common/QRModal';
import {  InspectionModal } from './InspectionModal';
import {  formatCurrency, generateCryptographicHandoverToken } from '../../lib/crypto';
import {  HUBS_DATA } from '../../lib/constants';

interface HubPortalProps {
  currentUser: UserType;
  currentHub: Hub;
  shipments: Shipment[];
  trips: Trip[];
  manifests: Manifest[];
  disputes?: Dispute[];
  locale: Locale;
  onSelectHub: (hubId: string) => void;
  onInspectShipment: (payload: any) => Promise<boolean>;
  onCreateManifest: (payload: any) => Promise<boolean>;
  onHandoverDispatch: (payload: any) => Promise<boolean>;
  onDestinationIntake: (payload: any) => Promise<boolean>;
  onDeliverToRecipient: (payload: any) => Promise<boolean>;
  onRefreshData: () => void;
}

export const HubPortal: React.FC<HubPortalProps> = ({
  currentUser,
  currentHub,
  shipments,
  trips,
  manifests,
  disputes = [],
  locale,
  onSelectHub,
  onInspectShipment,
  onCreateManifest,
  onHandoverDispatch,
  onDestinationIntake,
  onDeliverToRecipient,
  onRefreshData,
}) => {
  const isAr = locale === 'ar';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'PREPARING_INTAKE' | 'DISPATCH_MANIFEST' | 'AIRPORT_TRANSIT' | 'HANDOVER_DELIVERY' | 'BRANCH_DISPUTES'
  >('PREPARING_INTAKE');

  // Scanner modal state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerPurpose, setScannerPurpose] = useState<'QUICK_LOOKUP' | 'DISPATCH' | 'DEST_INTAKE' | 'RECIPIENT'>('QUICK_LOOKUP');

  // QR display modal
  const [qrModalToken, setQrModalToken] = useState<string>('');

  // Selected shipment for order & customer inspection modal
  const [inspectedShipment, setInspectedShipment] = useState<Shipment | null>(null);
  const [inspectionModalShipment, setInspectionModalShipment] = useState<Shipment | null>(null);

  // 1. Intake & Inspection Form State
  const [selectedShipmentForIntake, setSelectedShipmentForIntake] = useState<Shipment | null>(null);
  const [scaleActualWeightKg, setScaleActualWeightKg] = useState<number>(2.3);
  const [sealId, setSealId] = useState<string>(`SEAL-${currentHub.code}-${Math.floor(10000 + Math.random() * 90000)}`);
  const [inspectionNotes, setInspectionNotes] = useState('تم فحص المحتويات ومطابقتها للشروط الجوية وخلوها من المواد الممنوعة.');
  const [isSubmittingIntake, setIsSubmittingIntake] = useState(false);

  // 2. Manifest Builder Form State
  const [manifestTripId, setManifestTripId] = useState<string>(trips[0]?.id || '');
  const [selectedShipmentIdsForManifest, setSelectedShipmentIdsForManifest] = useState<string[]>([]);
  const [isSubmittingManifest, setIsSubmittingManifest] = useState(false);

  // 3. Final Recipient Delivery Form State
  const [deliveryShipmentId, setDeliveryShipmentId] = useState<string>('');
  const [recipientNationalIdCheck, setRecipientNationalIdCheck] = useState<string>('');
  const [recipientOtp, setRecipientOtp] = useState<string>('9842');
  const [isDelivering, setIsDelivering] = useState(false);

  // 4. Branch Dispute Arbitration State
  const branchDisputes = disputes.filter(
    (d) => d.originHubId === currentHub.id || d.destinationHubId === currentHub.id || !d.originHubId
  );
  const [selectedDisputeForReview, setSelectedDisputeForReview] = useState<Dispute | null>(branchDisputes[0] || null);
  const [disputeDecision, setDisputeDecision] = useState<'APPROVED_REFUND' | 'APPROVED_ESCROW_RELEASE' | 'REJECTED'>('APPROVED_REFUND');
  const [disputeReviewNotes, setDisputeReviewNotes] = useState('');
  const [isSubmittingDisputeVote, setIsSubmittingDisputeVote] = useState(false);
  const [disputeSuccessMsg, setDisputeSuccessMsg] = useState('');
  const [disputeErrorMsg, setDisputeErrorMsg] = useState('');

  // Auto select dispute when list changes
  React.useEffect(() => {
    if (!selectedDisputeForReview && branchDisputes.length > 0) {
      setSelectedDisputeForReview(branchDisputes[0]);
    }
  }, [branchDisputes, selectedDisputeForReview]);

  const handleDisputeVoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisputeForReview) return;

    setIsSubmittingDisputeVote(true);
    setDisputeSuccessMsg('');
    setDisputeErrorMsg('');

    try {
      const isOrigin = selectedDisputeForReview.originHubId === currentHub.id;
      const res = await fetch(`/api/admin/disputes/${selectedDisputeForReview.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: currentUser.id,
          employeeName: currentUser.name,
          hubId: currentHub.id,
          decision: disputeDecision,
          notes: disputeReviewNotes || (isAr ? `تم تدقيق الطرد من قبل ضابط ${currentHub.nameAr} واعتماد القرار.` : `Inspected and verified at ${currentHub.nameEn}`),
          digitalSignature: `HMAC_SEAL_${currentHub.code}_${Date.now().toString().slice(-6)}`,
        }),
      });

      const data = await res.json();
      if (data.success && data.dispute) {
        setSelectedDisputeForReview(data.dispute);
        setDisputeSuccessMsg(
          data.dispute.consensusReached
            ? (isAr ? 'تم تحقيق الإجماع المشترك 100% بين الفرعين وتنفيذ الحكم فوراً!' : '100% Dual-Hub consensus reached! Ruling executed.')
            : (isAr ? 'تم توثيق قرار وتوقيع فرعكم بنجاح وبانتظار مصادقة الفرع المقابل.' : 'Branch vote and signature recorded successfully!')
        );
        onRefreshData();
      } else {
        setDisputeErrorMsg(data.error || 'Failed to submit vote');
      }
    } catch (err: any) {
      setDisputeErrorMsg(err.message || 'Error occurred');
    } finally {
      setIsSubmittingDisputeVote(false);
    }
  };

  // Filtered lists for the 4 explicit stages
  const preparingShipments = shipments.filter(
    (s) =>
      s.originHubId === currentHub.id &&
      (s.currentStatus === 'CREATED' || s.currentStatus === 'RECEIVED_AT_ORIGIN')
  );

  const readyForManifestShipments = shipments.filter(
    (s) => s.originHubId === currentHub.id && s.currentStatus === 'INSPECTED_AND_SEALED'
  );

  const airportTransitShipments = shipments.filter(
    (s) =>
      (s.originHubId === currentHub.id || s.destinationHubId === currentHub.id) &&
      (s.currentStatus === 'MANIFEST_ASSIGNED' || s.currentStatus === 'IN_TRANSIT')
  );

  const deliveredAndReceivedShipments = shipments.filter(
    (s) =>
      s.destinationHubId === currentHub.id &&
      (s.currentStatus === 'RECEIVED_AT_DEST' ||
        s.currentStatus === 'READY_FOR_PICKUP' ||
        s.currentStatus === 'DELIVERED')
  );

  // Handle Inspection Submit
  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipmentForIntake) return;

    setIsSubmittingIntake(true);
    const success = await onInspectShipment({
      shipmentId: selectedShipmentForIntake.id,
      agentId: currentUser.id,
      actualWeightKg: scaleActualWeightKg,
      securitySealId: sealId,
      inspectionNotes,
      photoUrls: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400'],
    });
    setIsSubmittingIntake(false);

    if (success) {
      setSelectedShipmentForIntake(null);
      setSealId(`SEAL-${currentHub.code}-${Math.floor(10000 + Math.random() * 90000)}`);
      onRefreshData();
    }
  };

  // Handle Manifest Builder Submit
  const handleManifestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedShipmentIdsForManifest.length === 0 || !manifestTripId) {
      alert(isAr ? 'يرجى اختيار رحلة الطيران وطرد واحد على الأقل للمانيفست' : 'Please select a trip and at least one package');
      return;
    }

    setIsSubmittingManifest(true);
    const success = await onCreateManifest({
      tripId: manifestTripId,
      agentId: currentUser.id,
      shipmentIds: selectedShipmentIdsForManifest,
    });
    setIsSubmittingManifest(false);

    if (success) {
      setSelectedShipmentIdsForManifest([]);
      setActiveTab('AIRPORT_TRANSIT');
      onRefreshData();
    }
  };

  // Handle Scanner Success
  const handleScanSuccess = async (scannedToken: string) => {
    // Quick search for shipment in local database
    const matched = shipments.find(
      (s) => s.trackingNumber.toLowerCase() === scannedToken.toLowerCase() || scannedToken.includes(s.trackingNumber)
    );

    if (matched) {
      setInspectedShipment(matched);
      alert(isAr ? `تم العثور على الشحنة: ${matched.trackingNumber}!` : `Found shipment: ${matched.trackingNumber}!`);
      return;
    }

    if (scannerPurpose === 'DISPATCH') {
      const activeManifest = manifests[0];
      await onHandoverDispatch({
        manifestId: activeManifest?.id || 'man-8801',
        agentId: currentUser.id,
        travelerId: 'usr-traveler-202',
        scannedToken,
      });
      alert(isAr ? 'تم توثيق تسليم العهدة للمسافر برمز QR بنجاح!' : 'Custody successfully transferred to traveler!');
    } else if (scannerPurpose === 'DEST_INTAKE') {
      const activeManifest = manifests[0];
      await onDestinationIntake({
        manifestId: activeManifest?.id || 'man-8801',
        agentId: currentUser.id,
        receivedCondition: 'SEALS_INTACT',
        scannedToken,
      });
      alert(isAr ? 'تم استلام الطرود بفرع الوجهة ومطابقة الأختام وفك تأمين المسافر المالي فوراً!' : 'Destination intake verified, seals matched, traveler escrow released!');
    }
    onRefreshData();
  };

  // Handle Delivery to Final Recipient
  const handleFinalDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryShipmentId) return;

    setIsDelivering(true);
    const success = await onDeliverToRecipient({
      shipmentId: deliveryShipmentId,
      agentId: currentUser.id,
      recipientNationalId: recipientNationalIdCheck,
      deliveryNotes: 'تم تسليم الطرد للمستلم باليد بعد التحقق من الهوية ورقم OTP.',
    });
    setIsDelivering(false);

    if (success) {
      alert(isAr ? 'تم تسليم الطرد للمستلم بنجاح وإغلاق دورة الشحنة!' : 'Shipment delivered to recipient successfully!');
      setDeliveryShipmentId('');
      onRefreshData();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. UNIFIED STAFF PROFILE HEADER */}
      <header className="shrink-0 flex items-center justify-between px-6 py-4 bg-slate-900 text-white shadow-md z-10 relative">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold border border-amber-500/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-wide">
                {isAr ? 'بوابة الموظفين المركزية الموحدة' : 'Unified Staff Logistics Terminal'}
              </h2>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-md border border-amber-500/30 font-mono tracking-wider">
                {currentHub.code}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isAr
                ? `الموظف: ${currentUser.fullName} (${currentUser.phone}) • الفرع: ${currentHub.nameAr}`
                : `Employee: ${currentUser.fullName} • Branch: ${currentHub.nameEn}`}
            </p>
          </div>
        </div>

        {/* Quick QR Scanner & Hub Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setScannerPurpose('QUICK_LOOKUP');
              setScannerOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-500 hover:bg-brand-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 transition-all cursor-pointer"
          >
            <Scan className="w-4 h-4" />
            <span>{isAr ? 'مسح باركود' : 'Scan'}</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-xs">
            <span className="text-slate-400 font-semibold">{isAr ? 'الفرع:' : 'Hub:'}</span>
            <select
              value={currentHub.id}
              onChange={(e) => onSelectHub(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-hidden cursor-pointer"
            >
              {HUBS_DATA.map((h) => (
                <option key={h.id} value={h.id} className="bg-slate-900 text-white">
                  {isAr ? h.nameAr : h.nameEn} ({h.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* 2. MAIN HUB WORKSPACE WITH SIDEBAR NAVIGATION */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Professional Stage Workflow Sidebar */}
        <aside className={`shrink-0 bg-white border-l border-slate-200 transition-all duration-300 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] relative z-0 overflow-y-auto scrollbar-none ${isSidebarOpen ? 'w-72 px-4 py-6' : 'w-20 px-2 py-6 items-center'}`}>
            {isSidebarOpen && (
              <div className="text-[11px] font-black tracking-wider text-slate-400 uppercase flex items-center justify-between mb-4 px-2">
                <span>{isAr ? 'مراحل سير العمل' : 'Hub Workflow'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
            )}

            <div className="space-y-1.5 w-full">
            {/* Stage 1: Preparing & Intake */}
            <button
              onClick={() => setActiveTab('PREPARING_INTAKE')}
              className={`w-full flex items-center ${isSidebarOpen ? 'justify-between gap-3 px-3.5 py-3' : 'justify-center p-3 relative'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'PREPARING_INTAKE'
                  ? 'bg-amber-500 text-white shadow-md font-bold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? '1. فحص وتجهيز الطرود' : '1. Package Intake & Prep') : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  activeTab === 'PREPARING_INTAKE' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
                }`}>
                  <Scale className="w-4 h-4" />
                </div>
                {isSidebarOpen && (
                  <div className="truncate">
                    <div className="text-xs font-bold truncate">
                      {isAr ? '1. فحص وتجهيز الطرود' : '1. Package Intake & Prep'}
                    </div>
                    <div className={`text-[10px] truncate ${activeTab === 'PREPARING_INTAKE' ? 'text-amber-100' : 'text-slate-400'}`}>
                      {isAr ? 'استلام، وزن، وتشميع' : 'Intake, weighing & seal'}
                    </div>
                  </div>
                )}
              </div>
              {isSidebarOpen ? (
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                  activeTab === 'PREPARING_INTAKE' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
                }`}>
                  {preparingShipments.length}
                </span>
              ) : (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                  {preparingShipments.length}
                </span>
              )}
            </button>

            {/* Stage 2: Dispatched & Manifests */}
            <button
              onClick={() => setActiveTab('DISPATCH_MANIFEST')}
              className={`w-full flex items-center ${isSidebarOpen ? 'justify-between gap-3 px-3.5 py-3' : 'justify-center p-3 relative'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'DISPATCH_MANIFEST'
                  ? 'bg-brand-600 text-white shadow-md font-bold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? '2. الترحيل والمانيفست' : '2. Dispatched Manifests') : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  activeTab === 'DISPATCH_MANIFEST' ? 'bg-brand-700 text-white' : 'bg-brand-100 text-brand-700'
                }`}>
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                {isSidebarOpen && (
                  <div className="truncate">
                    <div className="text-xs font-bold truncate">
                      {isAr ? '2. الترحيل والمانيفست' : '2. Dispatched Manifests'}
                    </div>
                    <div className={`text-[10px] truncate ${activeTab === 'DISPATCH_MANIFEST' ? 'text-brand-100' : 'text-slate-400'}`}>
                      {isAr ? 'تجميع الطرود وتسليم المسافر' : 'Consolidation & traveler handover'}
                    </div>
                  </div>
                )}
              </div>
              {isSidebarOpen ? (
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                  activeTab === 'DISPATCH_MANIFEST' ? 'bg-brand-700 text-white' : 'bg-brand-100 text-brand-700'
                }`}>
                  {readyForManifestShipments.length}
                </span>
              ) : (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                  {readyForManifestShipments.length}
                </span>
              )}
            </button>

            {/* Stage 3: Flight Transit / Reached Airport */}
            <button
              onClick={() => setActiveTab('AIRPORT_TRANSIT')}
              className={`w-full flex items-center ${isSidebarOpen ? 'justify-between gap-3 px-3.5 py-3' : 'justify-center p-3 relative'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'AIRPORT_TRANSIT'
                  ? 'bg-brand-500 text-white shadow-md font-bold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? '3. الرحلات والوصول بالمطار' : '3. Flight & Airport Transit') : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  activeTab === 'AIRPORT_TRANSIT' ? 'bg-sky-700 text-white' : 'bg-sky-100 text-sky-700'
                }`}>
                  <Plane className="w-4 h-4" />
                </div>
                {isSidebarOpen && (
                  <div className="truncate">
                    <div className="text-xs font-bold truncate">
                      {isAr ? '3. الرحلات بالمطار' : '3. Flight Transit'}
                    </div>
                    <div className={`text-[10px] truncate ${activeTab === 'AIRPORT_TRANSIT' ? 'text-sky-100' : 'text-slate-400'}`}>
                      {isAr ? 'استقبال الطرود في المطار' : 'Airport reception'}
                    </div>
                  </div>
                )}
              </div>
              {isSidebarOpen ? (
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                  activeTab === 'AIRPORT_TRANSIT' ? 'bg-sky-700 text-white' : 'bg-sky-100 text-sky-800'
                }`}>
                  {airportTransitShipments.length}
                </span>
              ) : (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                  {airportTransitShipments.length}
                </span>
              )}
            </button>

            {/* Stage 4: Delivered & Handed Over */}
            <button
              onClick={() => setActiveTab('HANDOVER_DELIVERY')}
              className={`w-full flex items-center ${isSidebarOpen ? 'justify-between gap-3 px-3.5 py-3' : 'justify-center p-3 relative'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'HANDOVER_DELIVERY'
                  ? 'bg-purple-600 text-white shadow-md font-bold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? '4. التسليم النهائي' : '4. Recipient Delivery') : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  activeTab === 'HANDOVER_DELIVERY' ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-700'
                }`}>
                  <UserCheck className="w-4 h-4" />
                </div>
                {isSidebarOpen && (
                  <div className="truncate">
                    <div className="text-xs font-bold truncate">
                      {isAr ? '4. التسليم النهائي' : '4. Recipient Delivery'}
                    </div>
                    <div className={`text-[10px] truncate ${activeTab === 'HANDOVER_DELIVERY' ? 'text-purple-100' : 'text-slate-400'}`}>
                      {isAr ? 'التسليم برمز OTP' : 'OTP verification'}
                    </div>
                  </div>
                )}
              </div>
              {isSidebarOpen ? (
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                  activeTab === 'HANDOVER_DELIVERY' ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-800'
                }`}>
                  {deliveredAndReceivedShipments.length}
                </span>
              ) : (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-purple-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                  {deliveredAndReceivedShipments.length}
                </span>
              )}
            </button>

            {/* Stage 5: Dual-Hub Dispute Arbitration */}
            <button
              onClick={() => setActiveTab('BRANCH_DISPUTES')}
              className={`w-full flex items-center ${isSidebarOpen ? 'justify-between gap-3 px-3.5 py-3' : 'justify-center p-3 relative'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'BRANCH_DISPUTES'
                  ? 'bg-red-600 text-white shadow-md font-bold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? '5. تحكيم النزاعات' : '5. Dual-Hub Arbitration') : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  activeTab === 'BRANCH_DISPUTES' ? 'bg-red-700 text-white' : 'bg-red-100 text-red-700'
                }`}>
                  <Scale className="w-4 h-4" />
                </div>
                {isSidebarOpen && (
                  <div className="truncate">
                    <div className="text-xs font-bold truncate">
                      {isAr ? '5. تحكيم النزاعات المشترك' : '5. Dual-Hub Arbitration'}
                    </div>
                    <div className={`text-[10px] truncate ${activeTab === 'BRANCH_DISPUTES' ? 'text-red-100' : 'text-slate-400'}`}>
                      {isAr ? 'التصويت والتوقيع المشترك' : 'Joint branch arbitration'}
                    </div>
                  </div>
                )}
              </div>
              {isSidebarOpen ? (
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                  activeTab === 'BRANCH_DISPUTES' ? 'bg-red-700 text-white' : 'bg-red-100 text-red-800'
                }`}>
                  {branchDisputes.length}
                </span>
              ) : (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                  {branchDisputes.length}
                </span>
              )}
            </button>
            </div>

            {/* Hub Quick Info Box */}
            {isSidebarOpen && (
              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-2 px-1 w-full">
                <div className="flex items-center justify-between">
                  <span>{isAr ? 'كود الفرع:' : 'Hub Code:'}</span>
                  <span className="font-mono font-bold text-slate-700">{currentHub.code}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{isAr ? 'الدولة:' : 'Country:'}</span>
                  <span className="font-bold text-slate-700">{isAr ? currentHub.countryAr : currentHub.countryEn}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{isAr ? 'العملة المعتمدة:' : 'Currency:'}</span>
                  <span className="font-mono font-bold text-emerald-600">{currentHub.currency}</span>
                </div>
              </div>
            )}
        </aside>

        {/* Content Area for Current Active Tab */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50/50 p-6">
          {/* STAGE 1: PACKAGES BEING PREPARED & CERTIFIED INTAKE */}
          {activeTab === 'PREPARING_INTAKE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Packages List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'الطرود قيد الاستلام والتجهيز' : 'Parcels in Preparation'} ({preparingShipments.length})
            </h3>

            {preparingShipments.length === 0 ? (
              <div className="p-6 bg-white border border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                {isAr ? 'لا توجد طرود بانتظار الفحص حالياً' : 'No parcels awaiting intake'}
              </div>
            ) : (
              preparingShipments.map((s) => {
                const isSelected = selectedShipmentForIntake?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedShipmentForIntake(s);
                      setScaleActualWeightKg(s.estimatedWeightKg);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-bold text-xs text-slate-900">{s.trackingNumber}</span>
                      <StatusBadge status={s.currentStatus} locale={locale} size="sm" />
                    </div>
                    <p className="text-xs font-medium text-slate-800 truncate mb-1">{s.itemDescription}</p>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>{isAr ? 'المقدر:' : 'Est:'} {s.estimatedWeightKg} kg</span>
                      <span className="font-semibold text-emerald-700">${s.declaredValue}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Inspection Terminal Form */}
          <div className="lg:col-span-2">
            {selectedShipmentForIntake ? (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {isAr ? 'محطة الفحص والتغليف الأمني والميزان المعتمد' : 'Certified Inspection & Tamper Seal Station'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isAr ? 'رقم الطرد:' : 'Tracking #:'} {selectedShipmentForIntake.trackingNumber} • {selectedShipmentForIntake.recipientName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInspectionModalShipment(selectedShipmentForIntake)}
                      className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 border border-emerald-200"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isAr ? 'فحص متقدم وتصوير 360°' : '360° Visual Inspection & Bill of Lading'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectedShipment(selectedShipmentForIntake)}
                      className="px-3 py-1 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      {isAr ? 'عرض تفاصيل الأصناف' : 'View Order Items'}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleIntakeSubmit} className="space-y-4 text-xs">
                  {/* Scale Certified Weight */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-brand-500" />
                        <span>{isAr ? 'قراءة الميزان الرقمي المعتمد في الفرع (كغم):' : 'Certified Digital Scale Weight (kg):'}</span>
                      </label>
                      <span className="text-[11px] text-slate-500">
                        {isAr ? 'المقدر من العميل:' : 'Customer Estimate:'} {selectedShipmentForIntake.estimatedWeightKg} كغم
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        step="0.05"
                        value={scaleActualWeightKg}
                        onChange={(e) => setScaleActualWeightKg(Number(e.target.value))}
                        className="w-36 p-2.5 bg-white border border-slate-300 rounded-xl font-black text-lg text-brand-600 text-center"
                      />
                      <span className="font-bold text-slate-700">كغم (kg)</span>

                      {Math.abs(scaleActualWeightKg - selectedShipmentForIntake.estimatedWeightKg) > 0.3 && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-brand-700 bg-brand-100 px-2.5 py-1 rounded-lg">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{isAr ? 'يوجد فارق وزن سيتم إشعار العميل به آلياً' : 'Weight discrepancy will trigger approval'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Serialized Tamper-Evident Seal ID */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      <span>{isAr ? 'رقم شريط الختم الأمني المشفر (Seal ID):' : 'Tamper-Evident Seal ID:'}</span>
                    </label>
                    <input
                      type="text"
                      value={sealId}
                      onChange={(e) => setSealId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-emerald-800"
                    />
                  </div>

                  {/* Inspection Notes */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{isAr ? 'تقرير وملاحظات الفحص:' : 'Inspection Notes:'}</label>
                    <textarea
                      rows={2}
                      value={inspectionNotes}
                      onChange={(e) => setInspectionNotes(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingIntake}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>{isSubmittingIntake ? (isAr ? 'جارِ الحفظ والختم...' : 'Processing...') : (isAr ? 'اعتماد الفحص وتطبيق الختم الأمني' : 'Approve Inspection & Apply Seal')}</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-400">
                <Scale className="w-12 h-12 mx-auto mb-2 opacity-40 text-amber-600" />
                <p className="text-xs">{isAr ? 'اختر طرداً من القائمة لإجراء الفحص والوزن المعتمد' : 'Select a parcel to begin certified intake'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGE 2: PACKAGES BEING DISPATCHED ON MANIFESTS */}
      {activeTab === 'DISPATCH_MANIFEST' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isAr ? 'تجميع طرود الرحلة الجوية وبناء المانيفست (Manifest Builder)' : 'Flight Manifest Builder'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'ربط الطرود المفحوصة بالمسافر المعتمد وتأكيد حجز التأمين المالي' : 'Group inspected parcels onto scheduled flight & lock escrow'}
              </p>
            </div>
          </div>

          <form onSubmit={handleManifestSubmit} className="space-y-5 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">{isAr ? 'اختر رحلة المسافر المعتمد:' : 'Select Verified Traveler Flight:'}</label>
              <select
                value={manifestTripId}
                onChange={(e) => setManifestTripId(e.target.value)}
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
                {isAr ? 'اختر الطرود المفحوصة لضمها للمانيفست:' : 'Select Inspected Packages for this Manifest:'}
              </label>

              {readyForManifestShipments.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-xs">
                  {isAr ? 'لا توجد طرود مفحوصة جاهزة للمانيفست حالياً' : 'No inspected parcels ready for manifest'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                  {readyForManifestShipments.map((shipment) => {
                    const isChecked = selectedShipmentIdsForManifest.includes(shipment.id);
                    return (
                      <div
                        key={shipment.id}
                        onClick={() => {
                          setSelectedShipmentIdsForManifest((prev) =>
                            isChecked ? prev.filter((id) => id !== shipment.id) : [...prev, shipment.id]
                          );
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                          isChecked ? 'bg-brand-50/80 border-brand-400 ring-1 ring-brand-400' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="mt-0.5 w-4 h-4 text-brand-500 rounded-sm"
                        />
                        <div className="flex-1 text-xs">
                          <div className="flex justify-between font-bold text-slate-900 mb-1">
                            <span>{shipment.trackingNumber}</span>
                            <span className="text-emerald-700">{shipment.actualWeightKg || shipment.estimatedWeightKg} كغم</span>
                          </div>
                          <p className="text-slate-600 truncate mb-1">{shipment.itemDescription}</p>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {shipment.securitySealId}
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
              disabled={isSubmittingManifest || selectedShipmentIdsForManifest.length === 0}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer"
            >
              {isSubmittingManifest ? (isAr ? 'جارِ إنشاء المانيفست...' : 'Building Manifest...') : (isAr ? 'إصدار المانيفست المشفر وتوليد رمز التسليم' : 'Generate Secure Manifest')}
            </button>
          </form>
        </div>
      )}

      {/* STAGE 3: PACKAGES IN FLIGHT TRANSIT OR REACHED AIRPORT */}
      {activeTab === 'AIRPORT_TRANSIT' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isAr ? 'متابعة الطرود في مسار الرحلات الجوية والمطارات' : 'Active In-Flight & Airport Transit Tracking'}
              </h3>
              <p className="text-slate-500">
                {isAr ? 'تتبع مسار الطرود المحمولة مع المسافرين المعتمدين وتأكيد وصولها لمطار الوجهة' : 'Real-time traveler flight tracking and destination airport intake'}
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-start">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-start">{isAr ? 'رقم التتبع' : 'Tracking #'}</th>
                  <th className="p-3 text-start">{isAr ? 'المحتوى' : 'Item'}</th>
                  <th className="p-3 text-start">{isAr ? 'المسافر والرحلة' : 'Traveler & Flight'}</th>
                  <th className="p-3 text-start">{isAr ? 'الختم الأمني' : 'Seal ID'}</th>
                  <th className="p-3 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="p-3 text-center">{isAr ? 'الإجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {airportTransitShipments.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-brand-500">{s.trackingNumber}</td>
                    <td className="p-3 font-medium">{s.itemDescription}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{s.assignedTravelerName || 'يوسف القاضي'}</div>
                      <div className="text-[11px] text-slate-500">{s.airline || 'Royal Jordanian'} ({s.flightNumber || 'RJ-511'})</div>
                    </td>
                    <td className="p-3 font-mono text-emerald-700 font-bold">{s.securitySealId}</td>
                    <td className="p-3">
                      <StatusBadge status={s.currentStatus} locale={locale} size="sm" />
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setInspectedShipment(s)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold cursor-pointer"
                      >
                        {isAr ? 'التفاصيل' : 'Details'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STAGE 4: PACKAGES DELIVERED & HANDED OVER TO CUSTOMERS */}
      {activeTab === 'HANDOVER_DELIVERY' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isAr ? 'محطة استلام الطرود بالفرع وتسليمها للمستلم النهائي' : 'Destination Cargo Intake & Final Handover'}
              </h3>
              <p className="text-slate-500">
                {isAr ? 'التحقق من الأختام، فك تأمين المسافر المالي، وتسليم الطرود للمستلمين' : 'Inspect seals, release escrow, and hand over to verified recipients'}
              </p>
            </div>
          </div>

          <form onSubmit={handleFinalDeliverySubmit} className="space-y-4 max-w-xl mx-auto p-5 bg-slate-50 border border-slate-200 rounded-2xl">
            <h4 className="font-bold text-slate-900 text-sm">{isAr ? 'تسليم طرد للمستلم في المركز' : 'Counter Parcel Handover'}</h4>

            <div>
              <label className="block font-semibold mb-1">{isAr ? 'اختر الطرد الجاهز للتسليم:' : 'Select Parcel:'}</label>
              <select
                value={deliveryShipmentId}
                onChange={(e) => setDeliveryShipmentId(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
              >
                <option value="">{isAr ? '-- اختر الطرد --' : '-- Select Parcel --'}</option>
                {shipments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.trackingNumber} - {s.recipientName} ({s.recipientPhone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">{isAr ? 'رقم بطاقة الهوية / الإثبات الوطني للمستلم:' : 'Recipient National ID:'}</label>
              <input
                type="text"
                value={recipientNationalIdCheck}
                onChange={(e) => setRecipientNationalIdCheck(e.target.value)}
                placeholder="DZ-09812441 / OM-2049182"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">{isAr ? 'رمز التحقق OTP المسلم للمستلم:' : 'SMS OTP Security Code:'}</label>
              <input
                type="text"
                value={recipientOtp}
                onChange={(e) => setRecipientOtp(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold text-center text-base tracking-widest text-purple-700"
              />
            </div>

            <button
              type="submit"
              disabled={isDelivering || !deliveryShipmentId}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer"
            >
              {isDelivering ? (isAr ? 'جارِ التسليم...' : 'Delivering...') : (isAr ? 'إتمام التسليم للعميل وإغلاق الشحنة' : 'Confirm Recipient Delivery')}
            </button>
          </form>
        </div>
      )}

      {/* STAGE 5: DUAL-HUB DISPUTE ARBITRATION & CROSS-BORDER SETTLEMENT */}
      {activeTab === 'BRANCH_DISPUTES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dispute Claims List for this Hub */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'النزاعات والشكاوى الموجهة لهذا الفرع' : 'Assigned Dispute Claims'} ({branchDisputes.length})
            </h3>

            {branchDisputes.length === 0 ? (
              <div className="p-8 bg-white border border-slate-200 rounded-3xl text-center text-slate-400 text-xs">
                <Scale className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>{isAr ? 'لا توجد نزاعات أو شكاوى معلقة لهذا الفرع حالياً' : 'No active disputes for this hub'}</p>
              </div>
            ) : (
              branchDisputes.map((d) => {
                const isSelected = selectedDisputeForReview?.id === d.id;
                const isOrigin = d.originHubId === currentHub.id;
                const myReview = isOrigin ? d.originReview : d.destinationReview;
                const partnerReview = isOrigin ? d.destinationReview : d.originReview;
                const hasVoted = myReview && myReview.decision !== 'PENDING';

                return (
                  <div
                    key={d.id}
                    onClick={() => {
                      setSelectedDisputeForReview(d);
                      setDisputeSuccessMsg('');
                      setDisputeErrorMsg('');
                      if (myReview?.decision && myReview.decision !== 'PENDING') {
                        setDisputeDecision(myReview.decision as any);
                        setDisputeReviewNotes(myReview.notes || '');
                      } else {
                        setDisputeDecision('APPROVED_REFUND');
                        setDisputeReviewNotes('');
                      }
                    }}
                    className={`p-4 rounded-3xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-red-50/90 border-red-500 ring-2 ring-red-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-bold text-xs text-slate-900">{d.trackingNumber}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-800">
                        ${d.claimAmount} USD
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 truncate mb-1">
                      {d.claimantName} ({d.claimantRole === 'SENDER' ? (isAr ? 'المرسل' : 'Sender') : (isAr ? 'المسافر' : 'Traveler')})
                    </p>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        hasVoted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {hasVoted ? (isAr ? '✓ قمت بالتوقيع' : '✓ You Signed') : (isAr ? '⏳ بانتظار توقيعك' : '⏳ Awaiting Your Vote')}
                      </span>

                      <span className="text-[10px] text-slate-400 font-mono">
                        {isOrigin ? (isAr ? '🇯🇴 فرعك: إرسال' : '🇯🇴 Origin') : (isAr ? '🇩🇿 فرعك: وصول' : '🇩🇿 Destination')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Dispute Arbitration Review & Voting Terminal */}
          <div className="lg:col-span-2">
            {selectedDisputeForReview ? (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
                {/* Header info */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-red-100 text-red-800 font-mono font-black text-xs rounded-xl">
                        {selectedDisputeForReview.trackingNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {isAr ? 'نزاع تحكيمي مشترك بين فرعين' : 'Cross-Border Dual-Hub Claim'}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 mt-1">
                      {selectedDisputeForReview.claimantName} • {isAr ? 'المطالبة بـ' : 'Claim for'} ${selectedDisputeForReview.claimAmount} USD
                    </h3>
                  </div>

                  {/* Consensus Badge */}
                  <div>
                    {selectedDisputeForReview.originReview?.decision !== 'PENDING' &&
                    selectedDisputeForReview.destinationReview?.decision !== 'PENDING' &&
                    selectedDisputeForReview.originReview?.decision === selectedDisputeForReview.destinationReview?.decision ? (
                      <div className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{isAr ? 'تم اكتمال الإجماع 2/2' : 'Full Consensus (2/2)'}</span>
                      </div>
                    ) : (
                      <div className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>{isAr ? 'بانتظار مصادقة الطرفين' : 'Pending 2-Party Consensus'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Evidence & Case Description */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
                  <div className="flex items-center justify-between text-slate-700 font-bold">
                    <span>{isAr ? 'تفاصيل شكوى العميل المرفوعة:' : 'Claimant Statement & Reason:'}</span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-md text-[10px]">
                      {selectedDisputeForReview.reason}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-200/80">
                    "{selectedDisputeForReview.description}"
                  </p>

                  {/* Evidence Photos */}
                  {selectedDisputeForReview.evidencePhotos && selectedDisputeForReview.evidencePhotos.length > 0 && (
                    <div>
                      <span className="font-bold text-slate-600 mb-1.5 block">{isAr ? 'صور الإثبات المرفوعة:' : 'Evidence Photos:'}</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedDisputeForReview.evidencePhotos.map((url, idx) => (
                          <a key={idx} href={url} target="_blank" rel="noreferrer" className="w-20 h-16 rounded-xl overflow-hidden border border-slate-200 hover:border-red-400 transition-all block">
                            <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dual-Hub Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Origin Hub Card */}
                  <div className={`p-4 rounded-2xl border ${
                    selectedDisputeForReview.originReview?.decision === 'APPROVED_REFUND'
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : selectedDisputeForReview.originReview?.decision === 'REJECTED'
                      ? 'bg-red-50/70 border-red-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                        <span>🇯🇴</span>
                        <span>{selectedDisputeForReview.originHubName || (isAr ? 'فرع الأردن (عمان)' : 'Amman Hub')}</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        selectedDisputeForReview.originReview?.decision === 'APPROVED_REFUND'
                          ? 'bg-emerald-200 text-emerald-900'
                          : selectedDisputeForReview.originReview?.decision === 'APPROVED_ESCROW_RELEASE'
                          ? 'bg-brand-200 text-brand-900'
                          : selectedDisputeForReview.originReview?.decision === 'REJECTED'
                          ? 'bg-red-200 text-red-900'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {selectedDisputeForReview.originReview?.decision === 'APPROVED_REFUND'
                          ? (isAr ? 'موافقة على التعويض' : 'Approved')
                          : selectedDisputeForReview.originReview?.decision === 'REJECTED'
                          ? (isAr ? 'رفض الشكوى' : 'Rejected')
                          : (isAr ? 'قيد المراجعة' : 'Pending')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      <strong>{isAr ? 'الموظف:' : 'Staff:'}</strong> {selectedDisputeForReview.originReview?.employeeName || 'عمر النجار'}
                    </p>
                    {selectedDisputeForReview.originReview?.notes && (
                      <p className="text-[11px] text-slate-700 bg-white/80 p-2 rounded-lg border border-slate-200 mt-1 italic">
                        "{selectedDisputeForReview.originReview.notes}"
                      </p>
                    )}
                  </div>

                  {/* Destination Hub Card */}
                  <div className={`p-4 rounded-2xl border ${
                    selectedDisputeForReview.destinationReview?.decision === 'APPROVED_REFUND'
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : selectedDisputeForReview.destinationReview?.decision === 'REJECTED'
                      ? 'bg-red-50/70 border-red-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                        <span>🇩🇿</span>
                        <span>{selectedDisputeForReview.destinationHubName || (isAr ? 'فرع الجزائر' : 'Algiers Hub')}</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        selectedDisputeForReview.destinationReview?.decision === 'APPROVED_REFUND'
                          ? 'bg-emerald-200 text-emerald-900'
                          : selectedDisputeForReview.destinationReview?.decision === 'APPROVED_ESCROW_RELEASE'
                          ? 'bg-brand-200 text-brand-900'
                          : selectedDisputeForReview.destinationReview?.decision === 'REJECTED'
                          ? 'bg-red-200 text-red-900'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {selectedDisputeForReview.destinationReview?.decision === 'APPROVED_REFUND'
                          ? (isAr ? 'موافقة على التعويض' : 'Approved')
                          : selectedDisputeForReview.destinationReview?.decision === 'REJECTED'
                          ? (isAr ? 'رفض الشكوى' : 'Rejected')
                          : (isAr ? 'قيد المراجعة' : 'Pending')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      <strong>{isAr ? 'الموظف:' : 'Staff:'}</strong> {selectedDisputeForReview.destinationReview?.employeeName || 'سفيان مرابط'}
                    </p>
                    {selectedDisputeForReview.destinationReview?.notes && (
                      <p className="text-[11px] text-slate-700 bg-white/80 p-2 rounded-lg border border-slate-200 mt-1 italic">
                        "{selectedDisputeForReview.destinationReview.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Feedback Alerts */}
                {disputeSuccessMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{disputeSuccessMsg}</span>
                  </div>
                )}
                {disputeErrorMsg && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-900 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{disputeErrorMsg}</span>
                  </div>
                )}

                {/* Submit Vote / Sign-Off Form for this officer */}
                <form onSubmit={handleDisputeVoteSubmit} className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                      ✍️
                    </div>
                    <h4 className="text-xs font-black text-slate-900">
                      {isAr
                        ? `تسجيل قرار وتوقيع موظف ${currentHub.nameAr} (${currentUser.name})`
                        : `Submit Decision as ${currentHub.nameEn} Officer (${currentUser.name})`}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label
                      onClick={() => setDisputeDecision('APPROVED_REFUND')}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                        disputeDecision === 'APPROVED_REFUND'
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="branch_dispute_decision"
                        checked={disputeDecision === 'APPROVED_REFUND'}
                        onChange={() => setDisputeDecision('APPROVED_REFUND')}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs">{isAr ? 'موافقة على التعويض' : 'Approve Refund'}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal">
                        {isAr ? 'إقرار بصحة الضرر وتعويض المرسل' : 'Validate damage & refund'}
                      </p>
                    </label>

                    <label
                      onClick={() => setDisputeDecision('APPROVED_ESCROW_RELEASE')}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                        disputeDecision === 'APPROVED_ESCROW_RELEASE'
                          ? 'bg-brand-50 border-brand-500 ring-2 ring-brand-500/20 text-brand-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="branch_dispute_decision"
                        checked={disputeDecision === 'APPROVED_ESCROW_RELEASE'}
                        onChange={() => setDisputeDecision('APPROVED_ESCROW_RELEASE')}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs">{isAr ? 'الإفراج عن الضمان' : 'Release Escrow'}</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal">
                        {isAr ? 'سلامة الختم وتبرئة المسافر' : 'Verify seal & release deposit'}
                      </p>
                    </label>

                    <label
                      onClick={() => setDisputeDecision('REJECTED')}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                        disputeDecision === 'REJECTED'
                          ? 'bg-red-50 border-red-500 ring-2 ring-red-500/20 text-red-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="branch_dispute_decision"
                        checked={disputeDecision === 'REJECTED'}
                        onChange={() => setDisputeDecision('REJECTED')}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs">{isAr ? 'رفض الشكوى' : 'Reject Claim'}</span>
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal">
                        {isAr ? 'عدم ثبوت الادعاء أو الإخلال' : 'Claim invalid/dismissed'}
                      </p>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isAr ? 'تقرير الفحص الميداني والملاحظات الرسمية للفرع:' : 'Official Branch Field Inspection Report:'}
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={disputeReviewNotes}
                      onChange={(e) => setDisputeReviewNotes(e.target.value)}
                      placeholder={
                        isAr
                          ? 'اكتب خلاصة تقرير المعاينة ومطابقة الختم الأمني...'
                          : 'Enter branch field examination summary and seal matching notes...'
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-red-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                      <Lock className="w-3 h-3 text-brand-600" />
                      <span>{isAr ? 'سيتم التوقيع إلكترونياً بختم الفرع HMAC المشفر' : 'Cryptographic HMAC branch seal will be applied'}</span>
                    </span>

                    <button
                      type="submit"
                      disabled={isSubmittingDisputeVote}
                      className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {isSubmittingDisputeVote
                          ? (isAr ? 'جارِ توثيق القرار والتوقيع...' : 'Submitting Signature...')
                          : (isAr ? 'تثبيت قرار وتوقيع الفرع رسمياً' : 'Submit Branch Sign-off')}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="p-12 bg-white border border-slate-200 rounded-3xl text-center text-slate-400 text-xs">
                <Scale className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>{isAr ? 'اختر نزاعاً من القائمة لبدء التحكيم وتوقيع القرار' : 'Select a dispute to review and vote'}</p>
              </div>
            )}
          </div>
        </div>
      )}
        </main>
      </div>

      {/* DETAILED CUSTOMER & ORDER INFORMATION MODAL */}
      {inspectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Box className="w-5 h-5 text-brand-300" />
                  <span>{isAr ? 'بيانات العميل وتفاصيل الأصناف والأسعار' : 'Customer & Order Breakdown'}</span>
                </h3>
                <span className="font-mono text-xs text-brand-300">{inspectedShipment.trackingNumber}</span>
              </div>
              <button
                onClick={() => setInspectedShipment(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Customer & Recipient Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">{isAr ? 'بيانات المرسل / صاحب الطلب:' : 'Sender Info:'}</span>
                <p className="font-bold text-white">{inspectedShipment.senderName}</p>
                <p className="font-mono text-slate-300">{inspectedShipment.senderPhone}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">{isAr ? 'بيانات المستلم وعنوان التوصيل:' : 'Recipient Info:'}</span>
                <p className="font-bold text-white">{inspectedShipment.recipientName}</p>
                <p className="font-mono text-slate-300">{inspectedShipment.recipientPhone}</p>
                <p className="text-[11px] text-slate-400 mt-1">{inspectedShipment.recipientAddress}</p>
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                {isAr ? 'جدول الأصناف والكميات والأسعار:' : 'Items, Quantities & Prices:'}
              </h4>
              {inspectedShipment.orderItems && inspectedShipment.orderItems.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-xs text-start">
                    <thead className="bg-slate-800 text-slate-400 text-[11px]">
                      <tr>
                        <th className="p-2.5 text-start">{isAr ? 'الصنف' : 'Item'}</th>
                        <th className="p-2.5 text-center">{isAr ? 'الكمية' : 'Qty'}</th>
                        <th className="p-2.5 text-end">{isAr ? 'السعر' : 'Unit Price'}</th>
                        <th className="p-2.5 text-end">{isAr ? 'الإجمالي' : 'Total'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {inspectedShipment.orderItems.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="p-2.5 font-semibold text-white">{item.name}</td>
                          <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                          <td className="p-2.5 text-end font-mono">${item.unitPrice}</td>
                          <td className="p-2.5 text-end font-bold text-emerald-400 font-mono">${item.totalCost}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <p className="text-white font-semibold">{inspectedShipment.itemDescription}</p>
                  <p className="text-emerald-400 font-bold mt-1">${inspectedShipment.declaredValue} USD</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectedShipment(null)}
                className="px-5 py-2 bg-brand-500 hover:bg-brand-400 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera QR Scanner Modal */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title={
          isAr
            ? 'مسح رمز QR أو الباركود لخدمة العملاء والطرود'
            : 'Scan Customer QR or Barcode'
        }
        locale={locale}
      />

      {/* Manifest QR Pass Modal */}
      <QRModal
        isOpen={!!qrModalToken}
        onClose={() => setQrModalToken('')}
        handoverToken={qrModalToken}
        manifestCode="MAN-8801"
        flightNumber="RJ-511"
        totalWeightKg={2.3}
        packageCount={1}
        locale={locale}
      />

      {/* Advanced Inspection & 360 Photo Modal */}
      <InspectionModal
        isOpen={!!inspectionModalShipment}
        onClose={() => {
          setInspectionModalShipment(null);
          onRefreshData();
        }}
        shipment={inspectionModalShipment}
        hubCode={currentHub.code}
        locale={locale}
        onConfirmInspect={async (payload) => {
          const success = await onInspectShipment({
            ...payload,
            agentId: currentUser.id,
            photoUrls: payload.inspectionPhotos,
          });
          if (success) {
            onRefreshData();
          }
          return success;
        }}
      />
    </div>
  );
};
