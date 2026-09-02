import { UserProfile } from '../profile/UserProfile';
import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Menu,
  X,
  Plane,
  PlusCircle,
  ShieldCheck,
  QrCode,
  Wallet,
  Lock,
  ArrowDownLeft,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Edit3,
  Trash2,
  XCircle, User as UserIcon, Bell, Info, ShieldAlert, RefreshCw, Zap, MessageCircle, Home, Briefcase, Settings, FileText, ChevronRight, History, Scale, MoreHorizontal, Phone
} from 'lucide-react';
import { EscrowWallet, Hub, Locale, Manifest, Shipment, Trip, User } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { QRModal } from '../common/QRModal';
import { TripManager } from './TripManager';
import { BoardingPassCard } from './BoardingPassCard';
import { MyBagWorkspace } from './MyBagWorkspace';
import { InspectionProofModal } from './InspectionProofModal';
import { EditTripModal, CancelTripModal } from './TripEditCancelModals';
import { NewTripModal } from './NewTripModal';
import { TravelerDashboardView } from './TravelerDashboardView';
import { LegalPoliciesView } from './LegalPoliciesView';
import { SecurityDepositsView } from './SecurityDepositsView';
import { SupportSOSView } from './SupportSOSView';
import { TravelerSettingsView } from './TravelerSettingsView';
import { TravelerProfileView } from './TravelerProfileView';
import { MobileMoreMenuDrawer } from './MobileMoreMenuDrawer';
import { FabBottomSheet } from './FabBottomSheet';
import { TravelerWalletWorkspace } from './TravelerWalletWorkspace';
import { formatCurrency, generateCryptographicHandoverToken } from '../../lib/crypto';
import { HUBS_DATA } from '../../lib/constants';

interface TravelerPortalProps {
  currentUser: User;
  wallet: EscrowWallet | null;
  trips: Trip[];
  manifests: Manifest[];
  shipments?: Shipment[];
  locale: Locale;
  hubs?: Hub[];
  onRefreshData: () => void;
  onRegisterTrip: (payload: any) => Promise<boolean>;
  onLockEscrow: (tripId: string) => Promise<boolean>;
  onWithdrawEarnings: (amount: number, payoutMethod: string) => Promise<boolean>;
  onEmergencyUnassign: (tripId: string, reason: string) => Promise<boolean>;
}

export const TravelerPortal: React.FC<TravelerPortalProps> = ({
  currentUser,
  wallet,
  trips,
  manifests,
  shipments = [],
  locale,
  hubs,
  onRefreshData,
  onRegisterTrip,
  onLockEscrow,
  onWithdrawEarnings,
  onEmergencyUnassign,
}) => {
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [localKycStatus, setLocalKycStatus] = useState(currentUser.kycStatus || 'UNVERIFIED');


  const activeHubs = React.useMemo(
    () => (hubs && hubs.length > 0 ? hubs : HUBS_DATA).filter((h) => h.isActive !== false),
    [hubs]
  );

  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'MY_TRIPS' | 'MY_BAG' | 'WALLET' | 'PROFILE' | 'MORE' | 'LEGAL_POLICIES' | 'SECURITY_DEPOSITS' | 'SUPPORT_SOS' | 'SETTINGS'>('DASHBOARD');
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [tripsFilter, setTripsFilter] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [exchangeAmount, setExchangeAmount] = useState<number>(100);
  const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [selectedQRManifest, setSelectedQRManifest] = useState<Manifest | null>(null);
  const [activeHandoverToken, setActiveHandoverToken] = useState<string>('');
  const [selectedShipmentForProof, setSelectedShipmentForProof] = useState<Shipment | null>(null);

  // Register trip form state
  const [originHubId, setOriginHubId] = useState(activeHubs[0]?.id || 'hub-amm');
  const [destHubId, setDestHubId] = useState(activeHubs[1]?.id || activeHubs[0]?.id || 'hub-alg');

  // Auto-sync origin and dest if previously selected branch was deactivated
  React.useEffect(() => {
    if (activeHubs.length > 0) {
      if (!activeHubs.some((h) => h.id === originHubId)) {
        setOriginHubId(activeHubs[0].id);
      }
      if (!activeHubs.some((h) => h.id === destHubId)) {
        setDestHubId(activeHubs[1]?.id || activeHubs[0].id);
      }
    }
  }, [activeHubs, originHubId, destHubId]);

  const [airline, setAirline] = useState('Royal Jordanian (RJ-511)');
  const [flightNumber, setFlightNumber] = useState('RJ511');
  const [pnrCode, setPNRCode] = useState('RJ892B');
  const [availableWeightKg, setAvailableWeightKg] = useState(15.0);
  const [isSubmittingTrip, setIsSubmittingTrip] = useState(false);

  const [isCommitted, setIsCommitted] = useState(false);
  const [ticketImage, setTicketImage] = useState<File | null>(null);
  


  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState(150);
  const [payoutMethod, setPayoutMethod] = useState('IBAN Bank Transfer (Arab Bank)');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Emergency dialog
  const [emergencyTripId, setEmergencyTripId] = useState<string | null>(null);
  const [emergencyReason, setEmergencyReason] = useState('Flight cancelled by airline due to weather');

  // Edit and Cancel Trip Modals State

  const [isOffline, setIsOffline] = useState(false);
  const [hasNewPackage, setHasNewPackage] = useState(true); // Faked for UX demonstration
  const [hasNewEarnings, setHasNewEarnings] = useState(true); // Faked for UX demonstration

  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    if (!navigator.onLine) {
      setIsOffline(true);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Context-aware FAB logic
  const activeTrip = trips.find(t => ['SUBMITTED', 'VERIFIED', 'CONFIRMED', 'PACKAGES_LINKED', 'DISPATCHED', 'SCHEDULED', 'CHECKED_IN', 'IN_TRANSIT', 'IN_FLIGHT', 'ARRIVED'].includes(t.status));
  const hasTripToday = !!activeTrip; // Simplified check for UX Demo

  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);
  const [tripToCancel, setTripToCancel] = useState<Trip | null>(null);

  const travelerTrips = trips.filter((t) => t.travelerId === currentUser.id);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTrip(true);
    const success = await onRegisterTrip({
      travelerId: currentUser.id,
      travelerName: currentUser.fullName,
      travelerPhone: currentUser.phone,
      originHubId,
      destinationHubId: destHubId,
      airline,
      flightNumber,
      pnrCode,
      availableWeightKg,
    });
    setIsSubmittingTrip(false);

    if (success) {
      setActiveTab('MY_TRIPS');
      setIsNewTripModalOpen(false);
      onRefreshData();
    }
  };

  const handleOpenQR = (trip: Trip) => {
    const manifest = manifests.find((m) => m.tripId === trip.id);
    const token = manifest
      ? manifest.handoverQrSecret
      : generateCryptographicHandoverToken({
          manifestId: `man-trip-${trip.id}`,
          travelerId: trip.travelerId,
          agentId: 'usr-agent-303',
          totalWeightKg: trip.allocatedWeightKg || 2.3,
          packageCount: 1,
          timestamp: new Date().toISOString(),
        });

    setSelectedQRManifest(manifest || null);
    setActiveHandoverToken(token);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsWithdrawing(true);
    const success = await onWithdrawEarnings(withdrawAmount, payoutMethod);
    setIsWithdrawing(false);
    if (success) {
      alert(isAr ? 'تم تحويل الأرباح بنجاح إلى حسابك المصرفي!' : 'Payout processed successfully!');
      onRefreshData();
    }
  };

  const handleEmergencyConfirm = async () => {
    if (!emergencyTripId) return;
    await onEmergencyUnassign(emergencyTripId, emergencyReason);
    setEmergencyTripId(null);
    onRefreshData();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-slate-50" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside
          className={`hidden md:flex shrink-0 flex-col bg-white border-${isAr ? 'l' : 'r'} border-slate-200 overflow-y-auto transition-all duration-300 z-20 ${
            isSidebarOpen ? 'w-64' : 'w-20'
          }`}
        >
          
          <div className={`p-4 flex items-center border-b border-slate-100 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {isSidebarOpen && (
              <span className="text-xs font-black text-slate-800 tracking-wider">
                {isAr ? 'الخدمات' : 'SERVICES'}
              </span>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3 space-y-1.5 flex-1">
            {/* Dashboard */}
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-2.5' : 'justify-center p-2.5'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'DASHBOARD' ? 'bg-teal-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'الرئيسية' : 'Dashboard') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'DASHBOARD' ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-700'}`}>
                <Home className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'الرئيسية' : 'Dashboard'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'DASHBOARD' ? 'text-teal-100' : 'text-slate-400'}`}>
                    {isAr ? 'لوحة العمليات' : 'Operations desk'}
                  </div>
                </div>
              )}
            </button>

            {/* My Trips */}
            <button
              onClick={() => setActiveTab('MY_TRIPS')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-2.5' : 'justify-center p-2.5'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'MY_TRIPS' ? 'bg-teal-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'إدارة رحلاتي' : 'My Trips') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'MY_TRIPS' ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-700'}`}>
                <Plane className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate flex-1 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold truncate">{isAr ? 'إدارة رحلاتي' : 'My Trips'}</div>
                    <div className={`text-[10px] truncate ${activeTab === 'MY_TRIPS' ? 'text-teal-100' : 'text-slate-400'}`}>
                      {travelerTrips.length} {isAr ? 'رحلات مسجلة' : 'Registered'}
                    </div>
                  </div>
                  {travelerTrips.some(t => t.status === 'SCHEDULED' || t.status === 'IN_TRANSIT') && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  )}
                </div>
              )}
            </button>

            {/* My Bag */}
            <button
              onClick={() => {
                setActiveTab('MY_BAG');
                setHasNewPackage(false);
              }}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-2.5' : 'justify-center p-2.5'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'MY_BAG' ? 'bg-amber-500 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'حقيبتي' : 'My Bag') : undefined}
            >
              <div className="relative shrink-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === 'MY_BAG' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-600'}`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                {hasNewPackage && (
                  <span className="absolute -top-1 -end-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </div>
              {isSidebarOpen && (
                <div className="truncate flex-1 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold truncate">{isAr ? 'حقيبتي' : 'My Bag'}</div>
                    <div className={`text-[10px] truncate ${activeTab === 'MY_BAG' ? 'text-amber-100' : 'text-slate-400'}`}>
                      {isAr ? 'قائمة الطرود والعهدة' : 'Manifest & custody'}
                    </div>
                  </div>
                  {hasNewPackage && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-500 text-white rounded-full">NEW</span>
                  )}
                </div>
              )}
            </button>

            {/* Wallet */}
            <button
              onClick={() => {
                setActiveTab('WALLET');
                setHasNewEarnings(false);
              }}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-2.5' : 'justify-center p-2.5'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'WALLET' ? 'bg-teal-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'المحفظة' : 'Wallet') : undefined}
            >
              <div className="relative shrink-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === 'WALLET' ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-700'}`}>
                  <Wallet className="w-4 h-4" />
                </div>
                {hasNewEarnings && (
                  <span className="absolute -top-1 -end-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </div>
              {isSidebarOpen && (
                <div className="truncate flex-1 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold truncate">{isAr ? 'المحفظة' : 'Wallet'}</div>
                    <div className={`text-[10px] truncate ${activeTab === 'WALLET' ? 'text-teal-100' : 'text-slate-400'}`}>
                      {wallet ? formatCurrency(wallet.balance, wallet.currency) : '$0.00'}
                    </div>
                  </div>
                  {hasNewEarnings && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                </div>
              )}
            </button>

            {/* Security Deposits */}
            <button
              onClick={() => setActiveTab('SECURITY_DEPOSITS')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-2.5' : 'justify-center p-2.5'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'SECURITY_DEPOSITS' ? 'bg-amber-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'سجل الضمانات المالية' : 'Security Deposits') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'SECURITY_DEPOSITS' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-700'}`}>
                <Lock className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'الضمانات المالية' : 'Security Deposits'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'SECURITY_DEPOSITS' ? 'text-amber-100' : 'text-slate-400'}`}>
                    {isAr ? 'الودائع المحجوزة' : 'Escrow history'}
                  </div>
                </div>
              )}
            </button>
            
            {/* Profile & KYC */}
            <button
              onClick={() => setActiveTab('PROFILE')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-2.5' : 'justify-center p-2.5'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'PROFILE' ? 'bg-indigo-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'حسابي' : 'Profile') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'PROFILE' ? 'bg-indigo-700 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                <UserIcon className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'الملف الشخصي' : 'Profile'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'PROFILE' ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {currentUser.kycStatus === 'VERIFIED' ? (isAr ? 'موثق' : 'Verified') : (isAr ? 'غير موثق' : 'Unverified')}
                  </div>
                </div>
              )}
            </button>

            {/* Legal & Policies */}
            <button
              onClick={() => setActiveTab('LEGAL_POLICIES')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-2.5' : 'justify-center p-2.5'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'LEGAL_POLICIES' ? 'bg-rose-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'الشروط والممنوعات' : 'Legal & Banned Items') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'LEGAL_POLICIES' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-700'}`}>
                <Scale className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'الشروط والممنوعات' : 'Legal & Policies'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'LEGAL_POLICIES' ? 'text-rose-100' : 'text-slate-400'}`}>
                    {isAr ? 'تعهد الأمانة' : 'Trust pledge (Offline)'}
                  </div>
                </div>
              )}
            </button>

            {/* Support & SOS */}
            <button
              onClick={() => setActiveTab('SUPPORT_SOS')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-2.5' : 'justify-center p-2.5'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'SUPPORT_SOS' ? 'bg-rose-700 text-white shadow-md font-bold' : 'text-rose-700 hover:bg-rose-50'
              }`}
              title={!isSidebarOpen ? (isAr ? 'طوارئ المطار والدعم' : 'Support & SOS') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'SUPPORT_SOS' ? 'bg-rose-800 text-white' : 'bg-rose-100 text-rose-700'}`}>
                <Phone className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-black truncate">{isAr ? 'طوارئ ودعم 24/7' : 'Support & SOS'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'SUPPORT_SOS' ? 'text-rose-100' : 'text-rose-500'}`}>
                    {isAr ? 'خط المطار المباشر' : 'Rapid dispatch'}
                  </div>
                </div>
              )}
            </button>

            {/* Settings */}
            <button
              onClick={() => setActiveTab('SETTINGS')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-2.5' : 'justify-center p-2.5'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'SETTINGS' ? 'bg-slate-800 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'الإعدادات' : 'Settings') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'SETTINGS' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
                <Settings className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'الإعدادات' : 'Settings'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'SETTINGS' ? 'text-slate-300' : 'text-slate-400'}`}>
                    {isAr ? 'اللغة والتنبيهات' : 'Preferences'}
                  </div>
                </div>
              )}
            </button>
          </div>
        </aside>


        
        
        {/* Content Area */}
        <main className="flex-1 min-w-0 flex flex-col h-[100dvh] overflow-y-auto bg-slate-50/50 pb-24 md:pb-6 relative">
          
          {/* Offline Mode Banner */}
          {isOffline && (
            <div className="sticky top-0 z-40 bg-slate-800 text-slate-200 text-xs py-2 px-4 flex items-center justify-center gap-2 shadow-sm">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'أنت الآن غير متصل بالإنترنت. تم تفعيل وضع التخزين المؤقت للمسافر.' : 'You are currently offline. Traveler offline mode activated.'}</span>
            </div>
          )}
          
          <div className="p-4 md:p-6 space-y-6">
{currentUser.kycStatus !== 'VERIFIED' && currentUser.kycStatus !== 'PENDING' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">{isAr ? 'حسابك غير موثق' : 'Unverified Account'}</h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {isAr ? 'استكمل بياناتك ووثائقك لتتمكن من إضافة رحلاتك والبدء بكسب الأرباح' : 'Complete your KYC documents to add flights and start earning'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('PROFILE')}
                className="hidden md:flex px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
              >
                {isAr ? 'توثيق الحساب' : 'Verify Now'}
              </button>
            </div>
          )}

          {activeTab === 'DASHBOARD' && (
            <TravelerDashboardView
              currentUser={currentUser}
              wallet={wallet}
              travelerTrips={travelerTrips}
              locale={locale}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onAddNewTrip={() => {
                if (currentUser.kycStatus === 'VERIFIED') {
                  setIsNewTripModalOpen(true);
                } else {
                  setActiveTab('PROFILE');
                }
              }}
              onOpenQR={(trip) => handleOpenQR(trip)}
            />
          )}

          {/* TAB: PROFILE & KYC is handled below with TravelerProfileView */}

                    {/* TAB: MY BAG */}
          {activeTab === 'MY_BAG' && (() => {
            let activeTrip = travelerTrips.find(t => ['SUBMITTED', 'VERIFIED', 'CONFIRMED', 'PACKAGES_LINKED', 'DISPATCHED', 'SCHEDULED', 'CHECKED_IN', 'IN_TRANSIT', 'IN_FLIGHT', 'ARRIVED'].includes(t.status));
            if (!activeTrip && travelerTrips.length > 0) {
              activeTrip = travelerTrips[0];
            }
            if (!activeTrip) {
              // Provide a default active trip if none created yet
              activeTrip = {
                id: 'trip-active-demo-01',
                travelerId: currentUser.id,
                travelerName: currentUser.fullName,
                travelerPhone: currentUser.phone || '+962 79 000 1122',
                travelerRating: 4.9,
                originHubId: 'hub-amm',
                destinationHubId: 'hub-alg',
                departureDate: '2026-09-02T10:30:00Z',
                arrivalDate: '2026-09-02T14:45:00Z',
                departureTime: '10:30',
                arrivalTime: '14:45',
                availableWeightKg: 15,
                allocatedWeightKg: 7.6,
                airline: 'Royal Jordanian (RJ-701)',
                flightNumber: 'RJ-701',
                pnrCode: 'RJ-THOU-889',
                status: 'PACKAGES_LINKED',
                requiredEscrowDeposit: 500,
                isEscrowPaid: true,
                pricePerKgEarned: 24,
                totalEarningsEstimated: 182,
                autoMatchShipments: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              } as unknown as Trip;
            }

            // Real logic: We filter by shipments linked to this trip's manifest if available
            const manifest = manifests.find(m => m.tripId === activeTrip!.id);
            const bagShipments = manifest && manifest.shipmentIds && manifest.shipmentIds.length > 0 
              ? shipments.filter(s => manifest.shipmentIds.includes(s.id)) 
              : [];
            
            return (
              <MyBagWorkspace 
                trip={activeTrip} 
                shipments={bagShipments} 
                locale={locale} 
              />
            );
          })()}

          
          {activeTab === 'MY_TRIPS' && (
            activeTripId ? (
              <TripManager
                trip={travelerTrips.find(t => t.id === activeTripId)!}
                manifests={manifests}
                shipments={shipments || []}
                locale={locale}
                activeHubs={hubs}
                onBack={() => setActiveTripId(null)}
                onLockEscrow={async (tripId) => {
                  await onLockEscrow(tripId);
                  return true;
                }}
                onEmergencyUnassign={async (tripId, reason) => {
                  setEmergencyTripId(tripId);
                  setEmergencyReason(reason);
                  return true;
                }}
                onOpenQR={(trip) => {
                  const m = manifests.find(m => m.tripId === trip.id);
                  if (m) {
                    setSelectedQRManifest(m);
                  }
                }}
                onViewInspection={(shipment) => {
                  setSelectedShipmentForProof(shipment);
                }}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 p-1 bg-slate-200/50 rounded-xl overflow-x-auto">
                    <button 
                      onClick={() => setTripsFilter('ACTIVE')}
                      className={`py-2 px-4 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${tripsFilter === 'ACTIVE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {isAr ? 'نشطة وقادمة' : 'Active & Upcoming'}
                    </button>
                    <button 
                      onClick={() => setTripsFilter('HISTORY')}
                      className={`py-2 px-4 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${tripsFilter === 'HISTORY' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {isAr ? 'سجل الرحلات' : 'History'}
                    </button>
                  </div>
                  <button 
                    onClick={() => setIsNewTripModalOpen(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-colors"
                  >
                    <Plane className="w-4 h-4" />
                    <span>{isAr ? 'إضافة رحلة' : 'Add Flight'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {travelerTrips.filter(t => tripsFilter === 'ACTIVE' ? !['COMPLETED', 'CANCELLED'].includes(t.status) : ['COMPLETED', 'CANCELLED'].includes(t.status)).map((trip) => {
                    const originHub = hubs?.find((h) => h.id === trip.originHubId) || HUBS_DATA.find((h) => h.id === trip.originHubId);
                    const destHub = hubs?.find((h) => h.id === trip.destinationHubId) || HUBS_DATA.find((h) => h.id === trip.destinationHubId);

                    return (
                      <div
                        key={trip.id}
                        className="transition-transform hover:-translate-y-1 cursor-pointer"
                        onClick={() => setActiveTripId(trip.id)}
                      >
                        <BoardingPassCard 
                          trip={trip} 
                          originHub={originHub} 
                          destHub={destHub} 
                          locale={locale} 
                          onCheckIn={async () => {
                            try {
                              const res = await fetch(`/api/trips/${trip.id}/check-in`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
                              if (res.ok) onRefreshData();
                            } catch (e) {}
                          }}
                        />
                      </div>
                    );
                  })}
                  
                  {travelerTrips.filter(t => tripsFilter === 'ACTIVE' ? !['COMPLETED', 'CANCELLED'].includes(t.status) : ['COMPLETED', 'CANCELLED'].includes(t.status)).length === 0 && (
                    <div className="col-span-1 xl:col-span-2 py-12 text-center text-slate-400">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Plane className="w-8 h-8 text-slate-300" />
                      </div>
                      <p>{isAr ? 'لا توجد رحلات في هذا السجل.' : 'No trips in this record.'}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {activeTab === 'WALLET' && (
            <TravelerWalletWorkspace
              wallet={wallet}
              locale={locale}
              onWithdrawEarnings={onWithdrawEarnings}
              onRefreshData={onRefreshData}
              onNavigateToDeposits={() => setActiveTab('SECURITY_DEPOSITS')}
            />
          )}

      
          {/* TAB: MORE */}
          {activeTab === 'MORE' && (
            <div className="space-y-6 pb-20 md:pb-0">
              <div className="bg-slate-900 text-white rounded-3xl p-6 flex items-center gap-4 shadow-lg border border-slate-800">
                <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-teal-500 flex items-center justify-center overflow-hidden shrink-0 font-black text-teal-400 text-xl">
                  {currentUser.fullName ? currentUser.fullName.charAt(0) : 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-black">{currentUser.fullName}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-400 text-xs font-mono">{currentUser.id}</span>
                    <StatusBadge status={currentUser.kycStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING'} type="kyc" locale={locale} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => setActiveTab('MY_TRIPS')} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Plane className="w-5 h-5" />
                    </div>
                    <div className="text-start">
                      <span className="block font-bold text-slate-800">{isAr ? 'إدارة رحلاتي' : 'My Trips'}</span>
                      <span className="text-xs text-slate-500">{isAr ? 'سجل الرحلات السابقة والنشطة' : 'History of previous and active trips'}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 rtl:rotate-180 group-hover:text-teal-600" />
                </button>

                <button onClick={() => setActiveTab('PROFILE')} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div className="text-start">
                      <span className="block font-bold text-slate-800">{isAr ? 'الملف الشخصي والتوثيق (KYC)' : 'Profile & KYC'}</span>
                      <span className="text-xs text-slate-500">{isAr ? 'جواز السفر وتحديث الحساب' : 'Passport & banking info'}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 rtl:rotate-180 group-hover:text-indigo-600" />
                </button>

                <button onClick={() => setActiveTab('SECURITY_DEPOSITS')} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="text-start">
                      <span className="block font-bold text-slate-800">{isAr ? 'سجل الضمانات المالية' : 'Security Deposits'}</span>
                      <span className="text-xs text-slate-500">{isAr ? 'الودائع المحجوزة والمستردة' : 'Active and released escrow deposits'}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 rtl:rotate-180 group-hover:text-amber-600" />
                </button>

                <button onClick={() => setActiveTab('LEGAL_POLICIES')} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div className="text-start">
                      <span className="block font-bold text-slate-800">{isAr ? 'الشروط وقائمة الممنوعات' : 'Terms & Banned Items'}</span>
                      <span className="text-xs text-slate-500">{isAr ? 'تعهد الأمانة والجمارك (متاح Offline)' : 'Trust pledge & regulations'}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 rtl:rotate-180 group-hover:text-rose-600" />
                </button>
                
                <button onClick={() => setActiveTab('SUPPORT_SOS')} className="flex items-center justify-between p-4 bg-rose-50/80 rounded-2xl border border-rose-200 shadow-xs hover:bg-rose-100 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="text-start">
                      <span className="block font-black text-rose-900">{isAr ? 'طوارئ المطار والدعم (24/7 SOS)' : 'Support & Emergency SOS'}</span>
                      <span className="text-xs text-rose-700">{isAr ? 'اتصال مباشر بفريق العمليات' : 'Direct emergency hotline'}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-rose-500 rtl:rotate-180 group-hover:text-rose-700" />
                </button>

                <button onClick={() => setActiveTab('SETTINGS')} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div className="text-start">
                      <span className="block font-bold text-slate-800">{isAr ? 'الإعدادات' : 'Settings'}</span>
                      <span className="text-xs text-slate-500">{isAr ? 'اللغة والإشعارات' : 'Language and notifications'}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 rtl:rotate-180 group-hover:text-slate-600" />
                </button>
              </div>
            </div>
          )}

          {/* TAB: LEGAL & POLICIES */}
          {activeTab === 'LEGAL_POLICIES' && (
            <LegalPoliciesView locale={locale} />
          )}

          {/* TAB: SECURITY DEPOSITS */}
          {activeTab === 'SECURITY_DEPOSITS' && (
            <SecurityDepositsView 
              wallet={wallet} 
              trips={travelerTrips} 
              locale={locale} 
              onOpenSupportSOS={() => setActiveTab('SUPPORT_SOS')}
              onNavigateToTrip={(tripId) => {
                setActiveTripId(tripId);
                setActiveTab('MY_TRIPS');
              }}
            />
          )}

          {/* TAB: SUPPORT & SOS */}
          {activeTab === 'SUPPORT_SOS' && (
            <SupportSOSView locale={locale} />
          )}

          {/* TAB: PROFILE & KYC */}
          {activeTab === 'PROFILE' && (
            <TravelerProfileView
              currentUser={currentUser}
              locale={locale}
              onRefreshData={onRefreshData}
              onNavigateToNewTrip={() => setIsNewTripModalOpen(true)}
              onNavigateToLegal={() => setActiveTab('LEGAL_POLICIES')}
            />
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'SETTINGS' && (
            <TravelerSettingsView 
              locale={locale} 
              currentUser={currentUser}
              onLogout={() => {
                window.location.reload();
              }}
            />
          )}

      {/* Handover QR Modal */}
      <QRModal
        isOpen={!!activeHandoverToken}
        onClose={() => setActiveHandoverToken('')}
        title={isAr ? 'رمز تسليم/استلام الطرود المشفر (HMAC QR)' : 'Mutual Chain-of-Custody QR Pass'}
        handoverToken={activeHandoverToken}
        manifestCode={selectedQRManifest?.manifestCode}
        flightNumber="RJ-511"
        totalWeightKg={selectedQRManifest?.totalWeightKg || 2.3}
        packageCount={selectedQRManifest?.totalPackages || 1}
        locale={locale}
      />

      {/* Emergency Unassign Modal */}
      {emergencyTripId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs space-y-4">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>{isAr ? 'إلغاء طارئ للرحلة وإعادة جدولة الطرود' : 'Flight Emergency & Auto-Reroute'}</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {isAr
                ? 'في حال إلغاء الرحلة من شركة الطيران أو طارئ قاهر، سيقوم النظام تلقائياً بفك حجز ضمانك المالي وإعادة الطرود لطابور الفرع دون أي غرامة.'
                : 'In case of airline cancellation, the system will release your escrow hold with zero penalty and re-queue packages.'}
            </p>

            <div>
              <label className="block font-semibold mb-1">{isAr ? 'سبب الإلغاء الطارئ:' : 'Emergency Reason:'}</label>
              <input
                type="text"
                value={emergencyReason}
                onChange={(e) => setEmergencyReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEmergencyTripId(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleEmergencyConfirm}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700"
              >
                {isAr ? 'تأكيد الإلغاء الطارئ' : 'Confirm Emergency'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspection Proof & Seals Modal */}
      <InspectionProofModal
        isOpen={!!selectedShipmentForProof}
        onClose={() => setSelectedShipmentForProof(null)}
        shipment={selectedShipmentForProof}
        locale={locale}
      />

                </div>
        {/* Register New Flight Trip Modal */}
      <NewTripModal
        isOpen={isNewTripModalOpen}
        onClose={() => setIsNewTripModalOpen(false)}
        hubs={hubs || HUBS_DATA}
        currentUserId={currentUser.id}
        currentUserName={currentUser.fullName}
        currentUserPhone={currentUser.phone}
        locale={locale}
        onSuccess={(newTrip) => {
          onRefreshData();
          setActiveTripId(newTrip.id);
        }}
      />

      {/* Edit Flight Trip Modal */}
      <EditTripModal
        trip={tripToEdit}
        activeHubs={activeHubs}
        locale={locale}
        isOpen={!!tripToEdit}
        onClose={() => setTripToEdit(null)}
        onSuccess={() => {
          onRefreshData();
        }}
      />

      {/* Cancel Flight Trip Modal */}
      <CancelTripModal
        trip={tripToCancel}
        locale={locale}
        isOpen={!!tripToCancel}
        onClose={() => setTripToCancel(null)}
        onSuccess={() => {
          onRefreshData();
        }}
      />
        </main>
      </div>
    
      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around z-40 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {/* 1. Dashboard */}
        <motion.button 
          whileTap={{ scale: 0.92 }}
          onClick={() => setActiveTab('DASHBOARD')}
          className={`flex flex-col items-center justify-center py-1 flex-1 transition-all ${
            activeTab === 'DASHBOARD' ? 'text-teal-600 font-black' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home className={`w-5 h-5 transition-transform ${activeTab === 'DASHBOARD' ? 'scale-110' : ''}`} />
          <span className="text-[10px] mt-1 tracking-tight">{isAr ? 'الرئيسية' : 'Home'}</span>
        </motion.button>

        {/* 2. My Bag (with red dot notification badge) */}
        <motion.button 
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            setActiveTab('MY_BAG');
            setHasNewPackage(false);
          }}
          className={`relative flex flex-col items-center justify-center py-1 flex-1 transition-all ${
            activeTab === 'MY_BAG' ? 'text-amber-600 font-black' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <ShieldCheck className={`w-5 h-5 transition-transform ${activeTab === 'MY_BAG' ? 'scale-110' : ''}`} />
            {hasNewPackage && (
              <span className="absolute -top-1 -end-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">{isAr ? 'حقيبتي' : 'My Bag'}</span>
        </motion.button>

        {/* 3. Central Action: Add Trip or Scan QR */}
        <motion.button 
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            if (hasTripToday) {
              if (activeTrip) {
                handleOpenQR(activeTrip);
              } else {
                setIsFabMenuOpen(true);
              }
            } else {
              setIsNewTripModalOpen(true);
            }
          }}
          className="flex flex-col items-center justify-center py-1 flex-1 transition-all text-teal-600 hover:text-teal-700 cursor-pointer"
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            hasTripToday 
              ? 'bg-slate-800 text-teal-300 shadow-xs' 
              : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200'
          }`}>
            {hasTripToday ? (
              <QrCode className="w-4 h-4" />
            ) : (
              <PlusCircle className="w-4 h-4" />
            )}
          </div>
          <span className="text-[10px] mt-1 font-bold tracking-tight">
            {hasTripToday ? (isAr ? 'مسح باركود' : 'Scan QR') : (isAr ? 'إضافة رحلة' : 'Add Trip')}
          </span>
        </motion.button>

        {/* 4. Wallet (with green dot notification badge) */}
        <motion.button 
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            setActiveTab('WALLET');
            setHasNewEarnings(false);
          }}
          className={`relative flex flex-col items-center justify-center py-1 flex-1 transition-all ${
            activeTab === 'WALLET' ? 'text-teal-600 font-black' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <Wallet className={`w-5 h-5 transition-transform ${activeTab === 'WALLET' ? 'scale-110' : ''}`} />
            {hasNewEarnings && (
              <span className="absolute -top-1 -end-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">{isAr ? 'المحفظة' : 'Wallet'}</span>
        </motion.button>

        {/* 5. More (Hamburger / 3 Dots triggering full slide-up drawer) */}
        <motion.button 
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsMobileMoreOpen(true)}
          className={`flex flex-col items-center justify-center py-1 flex-1 transition-all ${
            ['MORE', 'PROFILE', 'LEGAL_POLICIES', 'SECURITY_DEPOSITS', 'SUPPORT_SOS', 'SETTINGS'].includes(activeTab)
              ? 'text-indigo-600 font-black'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-1 tracking-tight">{isAr ? 'المزيد ☰' : 'More ☰'}</span>
        </motion.button>
      </div>

      {/* Mobile More Slide-Up Drawer */}
      <MobileMoreMenuDrawer
        isOpen={isMobileMoreOpen}
        onClose={() => setIsMobileMoreOpen(false)}
        currentUser={currentUser}
        locale={locale}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsMobileMoreOpen(false);
        }}
      />

      {/* FAB Option Picker Bottom Sheet */}
      <FabBottomSheet
        isOpen={isFabMenuOpen}
        onClose={() => setIsFabMenuOpen(false)}
        locale={locale}
        onOpenNewTrip={() => setIsNewTripModalOpen(true)}
        onOpenScanQR={() => {
          if (activeTrip) {
            handleOpenQR(activeTrip);
          } else {
            setActiveTab('MY_BAG');
          }
        }}
      />
    </div>
  );
};
