import React, { useState, useEffect } from 'react';
import {
  Locale,
  UserRole,
  User,
  Shipment,
  Trip,
  Manifest,
  EscrowWallet,
  Hub,
  AuditLog,
  ThemeMode,
  Dispute,
} from './types';
import { DEMO_PROFILES, HUBS_DATA, THEMES } from './lib/constants';
import { Header } from './components/common/Header';
import { AuthModal } from './components/common/AuthModal';
import { LandingPage } from './components/landing/LandingPage';
import { SenderPortal } from './components/sender/SenderPortal';
import { TravelerPortal } from './components/traveler/TravelerPortal';
import { HubPortal } from './components/hub/HubPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { LegalPages } from './components/legal/LegalPages';
import { Footer } from './components/common/Footer';
import { NotificationProvider } from './lib/NotificationContext';
import { Alerts } from './components/common/Alerts';
import { ShieldCheck, Phone, Mail, MapPin, Globe, Sparkles, Scale } from 'lucide-react';

export default function App() {
  const [locale, setLocale] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem('thouesa_locale') as Locale;
      return saved === 'en' || saved === 'ar' ? saved : 'ar';
    } catch {
      return 'ar';
    }
  });
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('thouesa_theme_mode') as ThemeMode;
      return saved || 'light';
    } catch {
      return 'light';
    }
  });
  const [currentRole, setCurrentRole] = useState<UserRole | 'PUBLIC' | 'LEGAL'>('PUBLIC');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentHub, setCurrentHub] = useState<Hub>(HUBS_DATA[0]); // AMM

  useEffect(() => {
    try {
      localStorage.setItem('thouesa_locale', locale);
    } catch (e) {
      console.warn('Could not save locale preference:', e);
    }
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    if (locale === 'ar') {
      document.documentElement.classList.add('font-arabic');
      document.documentElement.classList.remove('font-english');
    } else {
      document.documentElement.classList.add('font-english');
      document.documentElement.classList.remove('font-arabic');
    }
  }, [locale]);

  useEffect(() => {
    try {
      localStorage.setItem('thouesa_theme_mode', themeMode);
    } catch (e) {
      console.warn('Could not save theme preference:', e);
    }
    if (themeMode === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [themeMode]);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'SIGNIN' | 'SIGNUP' | 'EMPLOYEE'>('SIGNUP');

  // App Data State
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [manifests, setManifests] = useState<Manifest[]>([]);
  const [wallet, setWallet] = useState<EscrowWallet | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [hubs, setHubs] = useState<Hub[]>(HUBS_DATA);
  const [isLoading, setIsLoading] = useState(false);

  // Sync user when role changes
  const handleRoleChange = (role: UserRole | 'PUBLIC') => {
    setCurrentRole(role);
    if (role === 'PUBLIC') {
      setCurrentUser(null);
    } else {
      const demoUser = DEMO_PROFILES[role as UserRole];
      if (demoUser) {
        setCurrentUser(demoUser);
        fetchWallet(demoUser.id);
      }
    }
  };

  // Robust Safe Fetch Helper
  const safeFetchJson = async <T = any,>(url: string, options?: RequestInit): Promise<T | null> => {
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      if (!text || text.trim() === '') return null;
      try {
        return JSON.parse(text) as T;
      } catch (parseErr) {
        console.warn(`JSON parse error on ${url}:`, parseErr, 'Raw response:', text.slice(0, 100));
        return null;
      }
    } catch (networkErr) {
      console.warn(`Network error on ${url}:`, networkErr);
      return null;
    }
  };

  // Fetch API State
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [shipRes, tripsRes, manRes, usersRes, auditRes, hubsRes, dispRes] = await Promise.all([
        safeFetchJson('/api/shipments'),
        safeFetchJson('/api/trips'),
        safeFetchJson('/api/manifests'),
        safeFetchJson('/api/users'),
        safeFetchJson('/api/admin/audit-logs'),
        safeFetchJson('/api/hubs'),
        safeFetchJson('/api/admin/disputes'),
      ]);

      if (shipRes?.shipments) setShipments(shipRes.shipments);
      if (tripsRes?.trips) setTrips(tripsRes.trips);
      if (manRes?.manifests) setManifests(manRes.manifests);
      if (usersRes?.users) setUsers(usersRes.users);
      if (auditRes?.auditLogs) setAuditLogs(auditRes.auditLogs);
      if (hubsRes?.hubs) setHubs(hubsRes.hubs);
      if (dispRes?.disputes) setDisputes(dispRes.disputes);
    } catch (err) {
      console.warn('API fetch warning, fallback to seed active data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWallet = async (userId: string) => {
    try {
      const res = await safeFetchJson(`/api/escrow/wallet/${userId}`);
      if (res?.wallet) {
        setWallet(res.wallet);
      }
    } catch (err) {
      console.error('Wallet fetch error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Actions
  const handleCreateShipment = async (payload: any) => {
    try {
      const res = await safeFetchJson('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res?.shipment) {
        await fetchData();
        return true;
      }
      if (res?.error) {
        alert(res.error);
      }
      return false;
    } catch (err) {
      console.error('Shipment creation error:', err);
      return false;
    }
  };

  const handleApproveWeightDiscrepancy = async (shipmentId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await safeFetchJson(`/api/shipments/${shipmentId}/approve-weight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, senderId: currentUser?.id }),
      });
      await fetchData();
    } catch (err) {
      console.error('Weight discrepancy error:', err);
    }
  };

  const handleRegisterTrip = async (payload: any) => {
    try {
      const res = await safeFetchJson('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res?.trip) {
        await fetchData();
        return true;
      }
      if (res?.error) {
        alert(res.error);
      }
      return false;
    } catch (err) {
      console.error('Register trip error:', err);
      return false;
    }
  };

  const handleLockEscrow = async (tripId: string) => {
    try {
      const res = await safeFetchJson(`/api/trips/${tripId}/lock-escrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ travelerId: currentUser?.id }),
      });

      if (res?.success) {
        alert(locale === 'ar' ? 'تم حجز مبلغ التأمين المالي المسترد بنجاح!' : 'Escrow locked successfully!');
        if (currentUser) fetchWallet(currentUser.id);
        await fetchData();
        return true;
      }
      if (res?.error) {
        alert(res.error);
      }
      return false;
    } catch (err) {
      console.error('Lock escrow error:', err);
      return false;
    }
  };

  const handleWithdrawEarnings = async (amount: number, payoutMethod: string) => {
    try {
      const effectiveUserId = currentUser?.id || 'usr-traveler-202';
      const res = await safeFetchJson('/api/escrow/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: effectiveUserId, amount, payoutMethod }),
      });

      if (res?.success) {
        if (currentUser) fetchWallet(currentUser.id);
        else fetchWallet('usr-traveler-202');
        await fetchData();
        return true;
      }
      if (res?.error) {
        alert(res.error);
      }
      return false;
    } catch (err) {
      console.error('Withdraw error:', err);
      return false;
    }
  };

  const handleEmergencyUnassign = async (tripId: string, reason: string) => {
    try {
      await safeFetchJson(`/api/trips/${tripId}/emergency-unassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ travelerId: currentUser?.id, reason }),
      });
      if (currentUser) fetchWallet(currentUser.id);
      await fetchData();
      return true;
    } catch (err) {
      console.error('Emergency error:', err);
      return false;
    }
  };

  const handleInspectShipment = async (payload: any) => {
    try {
      const res = await safeFetchJson(`/api/hubs/intake-inspect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res?.shipment) {
        await fetchData();
        return true;
      }
      if (res?.error) {
        alert(res.error);
      }
      return false;
    } catch (err) {
      console.error('Intake inspect error:', err);
      return false;
    }
  };

  const handleCreateManifest = async (payload: any) => {
    try {
      const res = await safeFetchJson(`/api/manifests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res?.manifest) {
        await fetchData();
        return true;
      }
      if (res?.error) {
        alert(res.error);
      }
      return false;
    } catch (err) {
      console.error('Create manifest error:', err);
      return false;
    }
  };

  const handleHandoverDispatch = async (payload: any) => {
    try {
      const res = await safeFetchJson(`/api/manifests/${payload.manifestId}/handover-dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res?.success) {
        await fetchData();
        return true;
      }
      if (res?.error) {
        alert(res.error);
      }
      return false;
    } catch (err) {
      console.error('Handover dispatch error:', err);
      return false;
    }
  };

  const handleDestinationIntake = async (payload: any) => {
    try {
      const res = await safeFetchJson(`/api/manifests/${payload.manifestId}/destination-intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res?.success) {
        await fetchData();
        return true;
      }
      if (res?.error) {
        alert(res.error);
      }
      return false;
    } catch (err) {
      console.error('Destination intake error:', err);
      return false;
    }
  };

  const handleDeliverToRecipient = async (payload: any) => {
    try {
      const res = await safeFetchJson(`/api/hubs/deliver-recipient`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res?.success) {
        await fetchData();
        return true;
      }
      if (res?.error) {
        alert(res.error);
      }
      return false;
    } catch (err) {
      console.error('Deliver recipient error:', err);
      return false;
    }
  };

  const handleApproveKYC = async (userId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await safeFetchJson(`/api/admin/kyc-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status, adminId: currentUser?.id }),
      });
      await fetchData();
    } catch (err) {
      console.error('KYC approval error:', err);
    }
  };

  const handleTriggerCron = async (jobType: string) => {
    try {
      const res = await safeFetchJson(`/api/cron/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobType }),
      });
      return res;
    } catch (err) {
      console.error('Cron trigger error:', err);
      return null;
    }
  };

  const handleToggleHubStatus = (hubId: string) => {
    setHubs((prev) =>
      prev.map((h) => (h.id === hubId ? { ...h, isActive: h.isActive === false ? true : false } : h))
    );
  };

  const isAr = locale === 'ar';
  const activeTheme = THEMES.find((t) => t.id === themeMode) || THEMES[0];
  const activeHubs = React.useMemo(() => hubs.filter((h) => h.isActive !== false), [hubs]);

  return (
    <NotificationProvider
      currentRole={currentRole === 'LEGAL' ? 'PUBLIC' : currentRole}
      userId={currentUser?.id}
      locale={locale}
    >
      <div
        id="thouesa-root-canvas"
        className={`min-h-screen flex flex-col antialiased transition-colors duration-200 ${
          activeTheme.bgClass
        } ${isAr ? 'font-arabic' : 'font-english'}`}
        dir={isAr ? 'rtl' : 'ltr'}
        lang={locale}
      >
        {/* Brand Header */}
        <Header
          logoUrl="https://www.gstatic.com/mobilesdk/250721_mobilesdk/mono_firebase_dark.svg"
          currentUser={currentUser}
          wallet={wallet}
          currentRole={currentRole}
          onRoleChange={handleRoleChange}
          locale={locale}
          onLocaleChange={setLocale}
          themeMode={themeMode}
          onThemeChange={setThemeMode}
          onOpenAuth={(m) => {
            setAuthModalMode(m || 'SIGNUP');
            setIsAuthModalOpen(true);
          }}
        />

        {/* Global Live Toast Alerts */}
        <Alerts
          locale={locale}
          onNavigateAction={(refId, type) => {
            if (type === 'ESCROW_LOCKED' || type === 'ESCROW_RELEASED' || type === 'TRIP_REGISTERED') {
              setCurrentRole('TRAVELER');
            } else if (type === 'INSPECTION_COMPLETED' || type === 'SHIPMENT_ARRIVED' || type === 'READY_FOR_PICKUP') {
              setCurrentRole('HUB_AGENT');
            } else if (type === 'ORDER_CREATED') {
              setCurrentRole('SENDER');
            }
          }}
        />

      {/* Main View Area */}
      <main className={`flex-1 w-full mx-auto ${['MASTER_ADMIN', 'HUB_AGENT', 'HUB_MANAGER'].includes(currentRole) ? 'p-0 h-[calc(100vh-64px)] overflow-hidden' : 'max-w-7xl px-4 py-6'}`}>
        {currentRole === 'PUBLIC' && (
          <LandingPage
            locale={locale}
            hubs={activeHubs}
            onNavigate={(role) => handleRoleChange(role)}
            onOpenAuth={(m) => {
              setAuthModalMode(m || 'SIGNUP');
              setIsAuthModalOpen(true);
            }}
          />
        )}

        {currentRole === 'SENDER' && (
          <SenderPortal
            currentUser={currentUser || DEMO_PROFILES.SENDER}
            wallet={wallet}
            shipments={shipments}
            locale={locale}
            hubs={activeHubs}
            onRefreshShipments={fetchData}
            onCreateShipment={handleCreateShipment}
            onApproveWeightDiscrepancy={handleApproveWeightDiscrepancy}
          />
        )}

        {currentRole === 'TRAVELER' && (
          <TravelerPortal
            currentUser={currentUser || DEMO_PROFILES.TRAVELER}
            wallet={wallet}
            trips={trips}
            manifests={manifests}
            shipments={shipments}
            locale={locale}
            hubs={activeHubs}
            onRefreshData={fetchData}
            onRegisterTrip={handleRegisterTrip}
            onLockEscrow={handleLockEscrow}
            onWithdrawEarnings={handleWithdrawEarnings}
            onEmergencyUnassign={handleEmergencyUnassign}
          />
        )}

        {(currentRole === 'HUB_AGENT' || currentRole === 'HUB_MANAGER') && (
          <HubPortal
            currentUser={currentUser || DEMO_PROFILES.HUB_AGENT}
            currentHub={currentHub}
            shipments={shipments}
            trips={trips}
            manifests={manifests}
            disputes={disputes}
            locale={locale}
            onSelectHub={(hubId) => {
              const h = hubs.find((item) => item.id === hubId) || HUBS_DATA.find((item) => item.id === hubId);
              if (h) setCurrentHub(h);
            }}
            onInspectShipment={handleInspectShipment}
            onCreateManifest={handleCreateManifest}
            onHandoverDispatch={handleHandoverDispatch}
            onDestinationIntake={handleDestinationIntake}
            onDeliverToRecipient={handleDeliverToRecipient}
            onRefreshData={fetchData}
          />
        )}

        {currentRole === 'MASTER_ADMIN' && (
          <AdminPortal
            currentUser={currentUser || DEMO_PROFILES.MASTER_ADMIN}
            users={users}
            auditLogs={auditLogs}
            locale={locale}
            shipments={shipments}
            hubs={hubs}
            onApproveKYC={handleApproveKYC}
            onTriggerCron={handleTriggerCron}
            onRefreshData={fetchData}
            onToggleHubStatus={handleToggleHubStatus}
          />
        )}

        {currentRole === 'LEGAL' && (
          <LegalPages
            locale={locale}
            onBack={() => setCurrentRole('PUBLIC')}
          />
        )}
      </main>

      {/* Global Unified Footer (Hidden for internal operational portals: Admin & Hub Agents) */}
      {currentRole !== 'MASTER_ADMIN' && currentRole !== 'HUB_AGENT' && currentRole !== 'HUB_MANAGER' && (
        <Footer
          locale={locale}
          themeMode={themeMode}
          hubs={activeHubs}
          onOpenLegal={() => setCurrentRole('LEGAL')}
          onSelectRole={(role) => setCurrentRole(role)}
        />
      )}

      {/* Central Auth & Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        locale={locale}
        initialMode={authModalMode}
        onLoginSuccess={(user, userWallet) => {
          setCurrentUser(user);
          setCurrentRole(user.role);
          if (userWallet) {
            setWallet(userWallet);
          } else {
            fetchWallet(user.id);
          }
          setIsAuthModalOpen(false);
          fetchData();
        }}
      />
    </div>
  </NotificationProvider>
  );
}
