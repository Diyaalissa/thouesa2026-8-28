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
  XCircle, User as UserIcon,
} from 'lucide-react';
import { EscrowWallet, Hub, Locale, Manifest, Shipment, Trip, User } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { QRModal } from '../common/QRModal';
import { TripManager } from './TripManager';
import { InspectionProofModal } from './InspectionProofModal';
import { EditTripModal, CancelTripModal } from './TripEditCancelModals';
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

  const activeHubs = React.useMemo(
    () => (hubs && hubs.length > 0 ? hubs : HUBS_DATA).filter((h) => h.isActive !== false),
    [hubs]
  );

  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'MY_TRIPS' | 'NEW_TRIP' | 'WALLET' | 'PROFILE'>('MY_TRIPS');
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

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState(150);
  const [payoutMethod, setPayoutMethod] = useState('IBAN Bank Transfer (Arab Bank)');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Emergency dialog
  const [emergencyTripId, setEmergencyTripId] = useState<string | null>(null);
  const [emergencyReason, setEmergencyReason] = useState('Flight cancelled by airline due to weather');

  // Edit and Cancel Trip Modals State
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
<div className="p-4 space-y-2 flex-1">
            <button
              onClick={() => setActiveTab('MY_TRIPS')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'MY_TRIPS' ? 'bg-teal-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'رحلاتي المجدولة' : 'My Flights') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'MY_TRIPS' ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-700'}`}>
                <Plane className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'رحلاتي المجدولة' : 'My Flights'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'MY_TRIPS' ? 'text-teal-100' : 'text-slate-400'}`}>
                    {travelerTrips.length} {isAr ? 'رحلات مسجلة' : 'flights'}
                  </div>
                </div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('NEW_TRIP')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'NEW_TRIP' ? 'bg-teal-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'إضافة رحلة جديدة' : 'Add Flight') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'NEW_TRIP' ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-700'}`}>
                <PlusCircle className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'إضافة رحلة جديدة' : 'Add Flight'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'NEW_TRIP' ? 'text-teal-100' : 'text-slate-400'}`}>
                    {isAr ? 'تسجيل أمتعة متاحة' : 'Register luggage'}
                  </div>
                </div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('WALLET')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'WALLET' ? 'bg-teal-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'محفظة الضمان المالي' : 'Escrow Wallet') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'WALLET' ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-700'}`}>
                <Wallet className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'محفظة الضمان المالي' : 'Escrow Wallet'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'WALLET' ? 'text-teal-100' : 'text-slate-400'}`}>
                    {isAr ? 'الأرصدة والأرباح' : 'Balances & Earnings'}
                  </div>
                </div>
              )}
            </button>
          
            <button
              onClick={() => setActiveTab('PROFILE')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'PROFILE' ? 'bg-teal-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'الملف الشخصي' : 'Profile') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'PROFILE' ? 'bg-teal-700 text-white' : 'bg-teal-100 text-teal-700'}`}>
                <UserIcon className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'الملف الشخصي' : 'Profile'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'PROFILE' ? 'text-teal-100' : 'text-slate-400'}`}>
                    {isAr ? 'الإعدادات والهوية' : 'Settings & ID'}
                  </div>
                </div>
              )}
            </button>
          </div>
        </aside>


        {/* Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50/50 p-4 md:p-6 pb-24 md:pb-6 space-y-6">
      {activeTab === 'PROFILE' && (
        <UserProfile currentUser={currentUser} locale={locale} isAr={isAr} />
      )}

          {/* TAB 1: MY TRIPS */}
      {activeTab === 'MY_TRIPS' && activeTripId && (() => {
        const trip = travelerTrips.find(t => t.id === activeTripId);
        if (!trip) return null;
        return (
          <TripManager 
            trip={trip}
            manifests={manifests}
            shipments={shipments}
            locale={locale}
            activeHubs={activeHubs}
            onBack={() => setActiveTripId(null)}
            onLockEscrow={onLockEscrow}
            onEmergencyUnassign={onEmergencyUnassign}
            onOpenQR={handleOpenQR}
            onViewInspection={(s) => setSelectedShipmentForProof(s)}
            onRefreshData={onRefreshData}
          />
        );
      })()}
      {activeTab === 'MY_TRIPS' && !activeTripId && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {isAr ? 'قائمة رحلات الطيران وسعات الأمتعة المسجلة' : 'Registered Flights & Allocated Luggage'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {travelerTrips.map((trip) => {
              const originHub = hubs?.find((h) => h.id === trip.originHubId) || HUBS_DATA.find((h) => h.id === trip.originHubId);
              const destHub = hubs?.find((h) => h.id === trip.destinationHubId) || HUBS_DATA.find((h) => h.id === trip.destinationHubId);

              return (
                <div
                  key={trip.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 relative"
                >
                  {/* Route & Status */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900">
                        <span>{originHub?.countryCode || 'JOR'}</span>
                        <span>➔</span>
                        <span>{destHub?.countryCode || 'DZA'}</span>
                        <span className="text-xs text-slate-400 font-normal">
                          ({originHub ? (isAr ? originHub.cityAr : originHub.cityEn) : ''} ➔{' '}
                          {destHub ? (isAr ? destHub.cityAr : destHub.cityEn) : ''})
                        </span>
                      </div>
                      <p className="text-xs text-brand-500 font-semibold mt-0.5 flex items-center gap-1">
                        <Plane className="w-3 h-3" />
                        {trip.airline} ({trip.flightNumber}) • PNR: {trip.pnrCode}
                      </p>
                    </div>
                    <StatusBadge status={trip.status} locale={locale} size="sm" />
                  </div>

                  {/* Weight, Earnings & Escrow */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl text-xs text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[11px]">{isAr ? 'السعة المتاحة' : 'Capacity'}</span>
                      <span className="font-bold text-slate-900">{trip.availableWeightKg} كغم</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">{isAr ? 'الأرباح المقدرة' : 'Earnings'}</span>
                      <span className="font-bold text-teal-600">{formatCurrency(trip.totalEarningsEstimated, 'USD')}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">{isAr ? 'مبلغ التأمين' : 'Escrow Hold'}</span>
                      <span className="font-bold text-amber-600">{formatCurrency(trip.requiredEscrowDeposit, 'USD')}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-1 border-t border-slate-100 mt-2">
                    <button
                      onClick={() => setActiveTripId(trip.id)}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-teal-200"
                    >
                      <Plane className="w-4 h-4" />
                      <span>{isAr ? 'إدارة الرحلة والمستندات' : 'Manage Trip & Documents'}</span>
                    </button>

                    {trip.status !== 'CANCELLED' && trip.status !== 'COMPLETED' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setTripToEdit(trip)}
                          disabled={trip.status === 'IN_TRANSIT'}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-slate-200"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                          <span>{isAr ? 'تعديل الرحلة' : 'Edit Flight'}</span>
                        </button>
                        <button
                          onClick={() => setTripToCancel(trip)}
                          disabled={trip.status === 'IN_TRANSIT'}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 text-rose-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-rose-200"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{isAr ? 'إلغاء الرحلة' : 'Cancel Trip'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: REGISTER FLIGHT TRIP */}
      {activeTab === 'NEW_TRIP' && (
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isAr ? 'تسجيل رحلة طيران جديدة وتخصيص وزن الأمتعة' : 'Register New Flight Trip'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'سيتم التحقق من تذكرة الطيران PNR آلياً مع شركات الطيران المعتمدة' : 'Instant PNR airline verification & capacity allocation'}
              </p>
            </div>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">{isAr ? 'مركز المغادرة (Origin Hub)' : 'Origin Hub'}</label>
                <select
                  value={originHubId}
                  onChange={(e) => setOriginHubId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {activeHubs.map((h) => (
                    <option key={h.id} value={h.id}>
                      {isAr ? h.nameAr : h.nameEn} ({h.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">{isAr ? 'مركز وجهة الوصول (Destination Hub)' : 'Destination Hub'}</label>
                <select
                  value={destHubId}
                  onChange={(e) => setDestHubId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {activeHubs.map((h) => (
                    <option key={h.id} value={h.id}>
                      {isAr ? h.nameAr : h.nameEn} ({h.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1">{isAr ? 'شركة الطيران' : 'Airline'}</label>
                <input
                  type="text"
                  value={airline}
                  onChange={(e) => setAirline(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">{isAr ? 'رقم الرحلة' : 'Flight Number'}</label>
                <input
                  type="text"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">{isAr ? 'رمز الحجز (PNR)' : 'PNR Booking Code'}</label>
                <input
                  type="text"
                  value={pnrCode}
                  onChange={(e) => setPNRCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-brand-600"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold">{isAr ? 'سعة الوزن المتاحة للأمتعة (كغم)' : 'Available Luggage Weight (kg)'}</label>
                <span className="font-bold text-teal-600 bg-emerald-50 px-2 py-0.5 rounded-md">{availableWeightKg} كغم</span>
              </div>
              <input
                type="range"
                min="2"
                max="30"
                step="1"
                value={availableWeightKg}
                onChange={(e) => setAvailableWeightKg(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
            </div>

            <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-brand-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-brand-600 shrink-0" />
              <span>
                {isAr
                  ? `أرباحك التقديرية لهذه الرحلة: $${(availableWeightKg * 12.0).toFixed(2)} (تحول لمحفظتك فور التسليم).`
                  : `Estimated payout for this flight: $${(availableWeightKg * 12.0).toFixed(2)}`}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmittingTrip}
              className="w-full py-3 bg-teal-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition-colors"
            >
              {isSubmittingTrip ? (isAr ? 'جارِ التحقق من PNR...' : 'Verifying PNR...') : isAr ? 'توثيق التذكرة وحفظ الرحلة' : 'Register Flight'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: WALLET & EARNINGS PAYOUT */}
      {activeTab === 'WALLET' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wallet Overview Card */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-6">
            <div>
              <span className="text-xs text-slate-400 block">{isAr ? 'إجمالي الرصيد المتاح للسحب' : 'Available Wallet Balance'}</span>
              <div className="text-3xl font-black text-emerald-400 mt-1">
                {wallet ? formatCurrency(wallet.balance, wallet.currency) : '$0.00'}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">{isAr ? 'الضمان المالي المحجوز (Escrow):' : 'Locked Escrow Hold:'}</span>
                <span className="font-bold text-amber-400">
                  {wallet ? formatCurrency(wallet.lockedEscrowDeposit, 'USD') : '$0.00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{isAr ? 'أرباح معلقة قيد الرحلة:' : 'Pending Trip Earnings:'}</span>
                <span className="font-bold text-brand-300">
                  {wallet ? formatCurrency(wallet.pendingEarnings, 'USD') : '$0.00'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300">
              {isAr
                ? 'يفك حجز الضمان المالي آلياً فور مسح رمز الاستلام في فرع وجهة الوصول.'
                : 'Escrow holds are automatically returned to your available balance upon destination hub scan.'}
            </div>
          </div>

          {/* Instant Payout Form */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">{isAr ? 'طلب سحب فوري للأرباح' : 'Request Instant Payout'}</h3>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">{isAr ? 'المبلغ المطلوب سحبه ($)' : 'Amount to Withdraw ($)'}</label>
                <input
                  type="number"
                  min="10"
                  max={wallet?.balance || 500}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">{isAr ? 'طريقة التحويل البنكي / المحفظة' : 'Payout Destination'}</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="IBAN Bank Transfer (Arab Bank Jordan)">{isAr ? 'تحويل بنكي IBAN (البنك العربي - الأردن)' : 'IBAN (Arab Bank Jordan)'}</option>
                  <option value="CCP Algerian Post (Algérie Poste)">{isAr ? 'حساب بريد الجزائر (CCP Algérie Poste)' : 'CCP (Algérie Poste)'}</option>
                  <option value="InstaPay Egypt">{isAr ? 'شبكة إنستاباي مصر (InstaPay Egypt)' : 'InstaPay Egypt'}</option>
                  <option value="STC Pay Saudi Arabia">{isAr ? 'محفظة STC Pay السعودية' : 'STC Pay Saudi Arabia'}</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isWithdrawing || (wallet && wallet.balance < withdrawAmount)}
                className="w-full py-3 bg-teal-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                {isWithdrawing ? (isAr ? 'جارِ التحويل...' : 'Processing...') : isAr ? 'تأكيد تحويل الأرباح الآن' : 'Execute Instant Payout'}
              </button>
            </form>
          </div>
        </div>
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
    
      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between z-40 pb-safe">
        <motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('MY_TRIPS')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'MY_TRIPS' ? 'text-teal-600 scale-110' : 'text-slate-400'}`}
        >
          <Plane className="w-6 h-6" />
          <span className="text-[10px] font-bold">{isAr ? 'رحلاتي' : 'Trips'}</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('NEW_TRIP')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'NEW_TRIP' ? 'text-teal-600 scale-110' : 'text-slate-400'}`}
        >
          <PlusCircle className="w-6 h-6" />
          <span className="text-[10px] font-bold">{isAr ? 'رحلة جديدة' : 'New Trip'}</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('WALLET')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'WALLET' ? 'text-teal-600 scale-110' : 'text-slate-400'}`}
        >
          <Wallet className="w-6 h-6" />
          <span className="text-[10px] font-bold">{isAr ? 'المحفظة' : 'Wallet'}</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('PROFILE')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'PROFILE' ? 'text-teal-600 scale-110' : 'text-slate-400'}`}
        >
          <UserIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold">{isAr ? 'حسابي' : 'Profile'}</span>
        </motion.button>
      </div>
</div>
  );
};
