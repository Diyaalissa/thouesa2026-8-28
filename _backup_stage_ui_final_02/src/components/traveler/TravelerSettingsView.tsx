import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  Globe,
  Clock,
  Radio,
  Wifi,
  WifiOff,
  Bell,
  MapPin,
  Fingerprint,
  Shield,
  Laptop,
  Smartphone,
  Trash2,
  Moon,
  Sun,
  Coffee,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  LogOut,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  Info,
  DollarSign,
  Lock,
  Eye,
  EyeOff,
  Database,
  Compass,
  FileCheck,
  Check
} from 'lucide-react';
import { Locale, User } from '../../types';

interface TravelerSettingsViewProps {
  locale: Locale;
  currentUser?: User | null;
  onLogout?: () => void;
  onLanguageChange?: (locale: Locale) => void;
}

interface ActiveSession {
  id: string;
  device: string;
  type: 'MOBILE' | 'DESKTOP';
  locationAr: string;
  locationEn: string;
  ip: string;
  lastActiveAr: string;
  lastActiveEn: string;
  isCurrent: boolean;
}

export const TravelerSettingsView: React.FC<TravelerSettingsViewProps> = ({
  locale,
  currentUser,
  onLogout,
  onLanguageChange,
}) => {
  const isAr = locale === 'ar';

  // Navigation state for desktop sidebar
  const [activeSection, setActiveSection] = useState<'GENERAL' | 'ROAMING' | 'LOW_DATA' | 'NOTIFICATIONS' | 'SECURITY' | 'OFFLINE' | 'ACCOUNT'>('GENERAL');

  // --- 1. General & Timezone Settings ---
  const [appLanguage, setAppLanguage] = useState<Locale>(locale);
  const [preferredCurrency, setPreferredCurrency] = useState<'USD' | 'JOD' | 'DZD'>(() => {
    return (localStorage.getItem('thouesa_pref_currency') as any) || 'USD';
  });
  const [themeMode, setThemeMode] = useState<'LIGHT' | 'DARK' | 'SYSTEM'>('LIGHT');
  const [timezoneLockMode, setTimezoneLockMode] = useState<'AUTO' | 'ORIGIN_FIXED' | 'DESTINATION_FIXED'>(() => {
    return (localStorage.getItem('thouesa_tz_lock') as any) || 'ORIGIN_FIXED';
  });

  // --- 2. Travel SIM & Roaming Management ---
  const [isRoamingSimActive, setIsRoamingSimActive] = useState(() => {
    return localStorage.getItem('thouesa_roaming_sim_active') === 'true';
  });
  const [roamingPhoneNumber, setRoamingPhoneNumber] = useState(() => {
    return localStorage.getItem('thouesa_roaming_phone') || '+213 770 123 456';
  });
  const [roamingCountry, setRoamingCountry] = useState<'ALGERIA' | 'JORDAN' | 'TURKEY' | 'UAE'>('ALGERIA');
  const [roamingDurationHours, setRoamingDurationHours] = useState<number>(48);

  // --- 3. Low Data Mode Settings ---
  const [lowDataMode, setLowDataMode] = useState(() => {
    return localStorage.getItem('thouesa_low_data_mode') === 'true';
  });
  const [disableHighResImages, setDisableHighResImages] = useState(true);
  const [disableBackgroundSync, setDisableBackgroundSync] = useState(true);
  const [textOnlyUpdates, setTextOnlyUpdates] = useState(false);

  // --- 4. Smart Notifications Control ---
  const [parcelOpportunityAlerts, setParcelOpportunityAlerts] = useState(true);
  const [hotRoutesAlerts, setHotRoutesAlerts] = useState(true);
  const [gpsArrivalReminders, setGpsArrivalReminders] = useState(true);
  const [smsFlightCodes, setSmsFlightCodes] = useState(true);

  // --- 5. Security, Biometrics & Devices ---
  const [biometricAuthEnabled, setBiometricAuthEnabled] = useState(() => {
    return localStorage.getItem('thouesa_biometrics') === 'true';
  });
  const [twoFactorAuthEnabled, setTwoFactorAuthEnabled] = useState(true);
  
  // Registered Active Sessions
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([
    {
      id: 'sess-1',
      device: 'iPhone 15 Pro Max (iOS 18.2)',
      type: 'MOBILE',
      locationAr: 'عمّان، الأردن (مطار الملكة علياء)',
      locationEn: 'Amman, Jordan (QAIA)',
      ip: '188.247.74.12',
      lastActiveAr: 'الآن (الجهاز الحالي)',
      lastActiveEn: 'Now (Current Device)',
      isCurrent: true,
    },
    {
      id: 'sess-2',
      device: 'MacBook Air M2 (macOS Sequoia)',
      type: 'DESKTOP',
      locationAr: 'الجزائر العاصمة (فرع بن عكنون)',
      locationEn: 'Algiers, Algeria (Ben Aknoun Hub)',
      ip: '105.101.44.89',
      lastActiveAr: 'منذ 3 ساعات',
      lastActiveEn: '3 hours ago',
      isCurrent: false,
    },
    {
      id: 'sess-3',
      device: 'Samsung Galaxy S23 (Android 14)',
      type: 'MOBILE',
      locationAr: 'إسطنبول، تركيا',
      locationEn: 'Istanbul, Turkey',
      ip: '88.232.19.4',
      lastActiveAr: 'منذ 4 أيام',
      lastActiveEn: '4 days ago',
      isCurrent: false,
    },
  ]);

  // --- 6. Sync & Offline Management ---
  const [autoDownloadWifi, setAutoDownloadWifi] = useState(true);
  const [cacheSizeMb, setCacheSizeMb] = useState('42.8 MB');
  const [isClearingCache, setIsClearingCache] = useState(false);

  // --- 7. Account Management ---
  const [vacationMode, setVacationMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Feedback Toast
  const [saveToast, setSaveToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });

  const triggerToast = (msg: string) => {
    setSaveToast({ show: true, msg });
    setTimeout(() => setSaveToast({ show: false, msg: '' }), 3500);
  };

  // Handlers
  const handleSaveAll = () => {
    localStorage.setItem('thouesa_pref_currency', preferredCurrency);
    localStorage.setItem('thouesa_tz_lock', timezoneLockMode);
    localStorage.setItem('thouesa_roaming_sim_active', isRoamingSimActive ? 'true' : 'false');
    localStorage.setItem('thouesa_roaming_phone', roamingPhoneNumber);
    localStorage.setItem('thouesa_low_data_mode', lowDataMode ? 'true' : 'false');
    localStorage.setItem('thouesa_biometrics', biometricAuthEnabled ? 'true' : 'false');

    if (onLanguageChange && appLanguage !== locale) {
      onLanguageChange(appLanguage);
    }

    triggerToast(isAr ? 'تم حفظ كافة الإعدادات وتفضيلات التجوال بنجاح!' : 'All settings and travel preferences saved successfully!');
  };

  const handleTerminateOtherSessions = () => {
    setActiveSessions((prev) => prev.filter((s) => s.isCurrent));
    triggerToast(isAr ? 'تم إنهاء وتسجيل الخروج من كافة الأجهزة الأخرى بنجاح!' : 'Successfully signed out from all other active devices!');
  };

  const handleClearCache = () => {
    setIsClearingCache(true);
    setTimeout(() => {
      setCacheSizeMb('0.0 MB');
      setIsClearingCache(false);
      triggerToast(isAr ? 'تم تفريغ ذاكرة التخزين المؤقتة وتحرير المساحة!' : 'Offline cache and manifest logs cleared successfully!');
    }, 1200);
  };

  const navMenuItems = [
    { id: 'GENERAL', labelAr: 'التفضيلات والتوقيت', labelEn: 'General & Timezone', icon: Globe, badgeAr: 'تثبيت التوقيت', badgeEn: 'TZ Lock' },
    { id: 'ROAMING', labelAr: 'شريحة التجوال (SIM)', labelEn: 'Travel SIM & Roaming', icon: Radio, badgeAr: 'رقم بديل', badgeEn: 'Auto Route' },
    { id: 'LOW_DATA', labelAr: 'توفير بيانات السفر', labelEn: 'Low Data Mode', icon: WifiOff, badgeAr: 'باقات التجوال', badgeEn: 'Data Saver' },
    { id: 'NOTIFICATIONS', labelAr: 'الإشعارات الذكية', labelEn: 'Smart Notifications', icon: Bell, badgeAr: 'GPS & رحلات', badgeEn: 'Geo-Alerts' },
    { id: 'SECURITY', labelAr: 'الأمان والأجهزة النشطة', labelEn: 'Security & Active Devices', icon: Shield, badgeAr: 'FaceID & جلسات', badgeEn: 'Biometrics' },
    { id: 'OFFLINE', labelAr: 'المزامنة والوضع غير المتصل', labelEn: 'Sync & Offline Cache', icon: Database, badgeAr: 'بدون إنترنت', badgeEn: 'Offline' },
    { id: 'ACCOUNT', labelAr: 'إدارة الحساب والإجازة', labelEn: 'Account & Vacation', icon: Coffee, badgeAr: 'تجميد مؤقت', badgeEn: 'Vacation' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 md:pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Toast Notification */}
      <AnimatePresence>
        {saveToast.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 start-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-teal-500/40 flex items-center gap-3 text-xs font-bold backdrop-blur-md"
          >
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>{saveToast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. TOP HEADER BANNER */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden space-y-4">
        <div className="absolute top-0 end-0 -mt-6 -me-6 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 start-0 -mb-6 -ms-6 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-400/30 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <Settings className="w-3.5 h-3.5" />
                <span>{isAr ? 'لوحة التحكم المركزية والإعدادات المتقدمة' : 'Control Center & Travel Systems'}</span>
              </span>
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-xs font-mono font-bold">
                {isAr ? 'وضع المسافر الدولي' : 'Global Traveler Mode'}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              {isAr ? 'إعدادات الحساب وتفضيلات السفر الدولي' : 'Account Settings & Travel Preferences'}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              {isAr
                ? 'خصص تجربة سفرك، قم بإدارة أرقام التجوال المؤقتة، وضع توفير البيانات لباقات السفر، وتأمين حسابك عبر الأجهزة النشطة.'
                : 'Tailor your international journey, manage temporary destination SIMs, low-data roaming savers, and biometrics security.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={handleSaveAll}
              className="w-full md:w-auto px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30 cursor-pointer transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{isAr ? 'حفظ التغييرات' : 'Save All Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN LAYOUT: Sidebar (Desktop) + Tab Contents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* === DESKTOP STICKY SIDEBAR (4 Columns) === */}
        <div className="hidden lg:block lg:col-span-4 sticky top-6 space-y-4">
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-2">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-teal-600" />
                {isAr ? 'أقسام الإعدادات' : 'Settings Categories'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">7 MODULES</span>
            </div>

            <nav className="space-y-1">
              {navMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id as any)}
                    className={`w-full p-3 rounded-2xl text-start transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold truncate">{isAr ? item.labelAr : item.labelEn}</span>
                    </div>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                      isActive ? 'bg-slate-800 text-teal-300' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isAr ? item.badgeAr : item.badgeEn}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Roaming Quick Health Card */}
          <div className="p-4 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl border border-indigo-800/60 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black flex items-center gap-1.5 text-indigo-300">
                <Radio className="w-4 h-4" />
                {isAr ? 'حالة التوجيه الدولي' : 'Roaming Status'}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black ${
                isRoamingSimActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
              }`}>
                {isRoamingSimActive ? 'ACTIVE SIM 🟢' : 'PRIMARY 🟡'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {isRoamingSimActive
                ? (isAr ? `يتم توجيه اتصالات فرع ${roamingCountry === 'ALGERIA' ? 'الجزائر' : 'الأردن'} لرقمك المؤقت: ${roamingPhoneNumber}` : `Destination hub calls route to temp SIM: ${roamingPhoneNumber}`)
                : (isAr ? 'لم يتم تفعيل رقم التجوال المؤقت بعد. اتصالات الفروع تصل رقمك الدائم.' : 'Temp travel SIM is inactive. Calls reach your primary number.')}
            </p>
          </div>
        </div>

        {/* === MAIN CONTENT AREA (8 Columns) === */}
        <div className="lg:col-span-8 space-y-6">

          {/* MOBILE QUICK NAVIGATION TABS (Visible only on mobile) */}
          <div className="lg:hidden flex overflow-x-auto gap-2 pb-2 scrollbar-none">
            {navMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as any)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 shrink-0 transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{isAr ? item.labelAr : item.labelEn}</span>
                </button>
              );
            })}
          </div>

          {/* ========================================================
              SECTION 1: التفضيلات العامة وضبط التوقيت (General & Timezone)
             ======================================================== */}
          {(activeSection === 'GENERAL' || window.innerWidth < 1024) && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      {isAr ? '1. التفضيلات العامة وضبط التوقيت (General & Timezone)' : '1. General & Timezone Preferences'}
                    </h2>
                    <span className="text-[11px] text-slate-500">
                      {isAr ? 'لغة الواجهة، العملة المرجعية، وقفل المنطقة الزمنية لتفادي إرباك المواعيد' : 'Language, currency, and airport flight timezone lock'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Language Selection */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-teal-600" />
                  <span>{isAr ? 'لغة التطبيق' : 'Application Language'}</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { code: 'ar', label: 'العربية (RTL)', sub: 'الواجهة باللغة العربية' },
                    { code: 'en', label: 'English (LTR)', sub: 'English Interface' },
                  ].map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setAppLanguage(l.code as Locale)}
                      className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                        appLanguage === l.code
                          ? 'border-teal-600 bg-teal-50/70 text-teal-950 shadow-2xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs font-black block">{l.label}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">{l.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency Selection */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>{isAr ? 'العملة المرجعية للعرض' : 'Primary Reference Currency'}</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { code: 'USD', symbol: '$', labelAr: 'الدولار (USD)', labelEn: 'US Dollar ($)' },
                    { code: 'JOD', symbol: 'د.أ', labelAr: 'الدينار الأردني (JOD)', labelEn: 'Jordanian Dinar' },
                    { code: 'DZD', symbol: 'د.ج', labelAr: 'الدينار الجزائري (DZD)', labelEn: 'Algerian Dinar' },
                  ].map((c) => (
                    <button
                      key={c.code}
                      onClick={() => setPreferredCurrency(c.code as any)}
                      className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                        preferredCurrency === c.code
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black shadow-2xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold'
                      }`}
                    >
                      <span className="text-sm font-mono block mb-0.5">{c.symbol}</span>
                      <span className="text-[11px] block">{isAr ? c.labelAr : c.labelEn}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* [NEW FEATURE]: Timezone Lock (قفل المنطقة الزمنية) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black text-slate-900">
                      {isAr ? 'قفل المنطقة الزمنية لمواعيد الرحلات (Timezone Lock)' : 'Flight Timezone Lock Protocol'}
                    </span>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-100 text-indigo-900 rounded-md">
                    {isAr ? 'موصى به للمسافرين' : 'Recommended'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {isAr
                    ? 'يمنع ارتباك مواعيد الإقلاع والتسليم عند تغير توقيت هاتفك تلقائياً أثناء الهبوط في بلد آخر.'
                    : 'Locks flight time rendering to origin departure hub to prevent missed flights when device timezone shifts upon landing.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {[
                    {
                      id: 'ORIGIN_FIXED',
                      titleAr: 'تثبيت توقيت مكتب المغادرة (الأصل)',
                      titleEn: 'Lock to Departure Hub Time (Origin)',
                      descAr: 'عرض أوقات الرحلة دائماً بتوقيت مطار الإقلاع (توقيت عمّان UTC+3)',
                      descEn: 'Always render schedules in departure airport local time (Amman UTC+3)',
                    },
                    {
                      id: 'AUTO',
                      titleAr: 'المطابقة التلقائية مع توقيت الهاتف',
                      titleEn: 'Auto-Sync with Device Clock',
                      descAr: 'تغيير التوقيت تلقائياً حسب الساعة الحالية للجهاز',
                      descEn: 'Shift timestamps dynamically matching your current device clock',
                    },
                  ].map((tz) => (
                    <button
                      key={tz.id}
                      onClick={() => setTimezoneLockMode(tz.id as any)}
                      className={`p-3 rounded-xl border text-start transition-all cursor-pointer ${
                        timezoneLockMode === tz.id
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-2xs font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">{isAr ? tz.titleAr : tz.titleEn}</span>
                        {timezoneLockMode === tz.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block leading-normal">{isAr ? tz.descAr : tz.descEn}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              SECTION 2: إدارة أرقام التجوال (Travel SIM Management)
             ======================================================== */}
          {(activeSection === 'ROAMING' || window.innerWidth < 1024) && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      {isAr ? '2. إدارة أرقام التجوال (Travel SIM Management)' : '2. Travel SIM & Destination Roaming'}
                    </h2>
                    <span className="text-[11px] text-slate-500">
                      {isAr ? 'توجيه اتصالات مكتب الوجهة لرقمك المحلي الجديد أثناء السفر' : 'Auto-route destination branch calls to your temporary local SIM'}
                    </span>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => setIsRoamingSimActive(!isRoamingSimActive)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                    isRoamingSimActive ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    isRoamingSimActive ? (isAr ? '-translate-x-6' : 'translate-x-6') : ''
                  }`} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isAr
                    ? 'عند وصولك لبلد المقصد وشراء شريحة اتصال محلية (مثل Ooredoo/Djezzy في الجزائر أو Zain في الأردن)، أدخل رقمك المؤقت هنا. سيقوم النظام تلقائياً بتوجيه اتصالات منسقي الفروع ومستلمي الطرود لهذا الرقم دون تعديل رقم ملفك الشخصي الأساسي.'
                    : 'When you arrive and swap to a local travel SIM card, input your temporary roaming number below. Destination hub managers will automatically reach this phone without overriding your primary registered identity.'}
                </p>

                <div className={`p-4 rounded-2xl border transition-all space-y-4 ${
                  isRoamingSimActive ? 'bg-indigo-50/40 border-indigo-200' : 'bg-slate-50 border-slate-200 opacity-60 pointer-events-none'
                }`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Destination Country */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-800">
                        {isAr ? 'دولة الوجهة / الشريحة' : 'Destination Country'}
                      </label>
                      <select
                        value={roamingCountry}
                        onChange={(e) => setRoamingCountry(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="ALGERIA">{isAr ? '🇩🇿 الجزائر (+213)' : '🇩🇿 Algeria (+213)'}</option>
                        <option value="JORDAN">{isAr ? '🇯🇴 الأردن (+962)' : '🇯🇴 Jordan (+962)'}</option>
                        <option value="TURKEY">{isAr ? '🇹🇷 تركيا (+90)' : '🇹🇷 Turkey (+90)'}</option>
                        <option value="UAE">{isAr ? '🇦🇪 الإمارات (+971)' : '🇦🇪 UAE (+971)'}</option>
                      </select>
                    </div>

                    {/* Temporary Phone Input */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-slate-800">
                        {isAr ? 'رقم هاتف التجوال المؤقت' : 'Temporary Roaming Mobile'}
                      </label>
                      <input
                        type="text"
                        value={roamingPhoneNumber}
                        onChange={(e) => setRoamingPhoneNumber(e.target.value)}
                        placeholder="+213 770 123 456"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>

                  {/* Expiration / Duration Pill Selector */}
                  <div className="space-y-1.5 pt-2 border-t border-indigo-100">
                    <label className="text-[11px] font-black text-slate-800 flex items-center justify-between">
                      <span>{isAr ? 'مدة صلاحية التوجيه التلقائي' : 'Auto-Expiration Duration'}</span>
                      <span className="text-indigo-700 font-mono">{roamingDurationHours} {isAr ? 'ساعة' : 'hours'}</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
                      {[24, 48, 72, 168].map((hrs) => (
                        <button
                          key={hrs}
                          onClick={() => setRoamingDurationHours(hrs)}
                          className={`py-2 rounded-xl border transition-all cursor-pointer ${
                            roamingDurationHours === hrs
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {hrs === 168 ? (isAr ? 'أسبوع' : '1 Wk') : `${hrs}h`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              SECTION 3: وضع البيانات المنخفضة للتجوال (Low Data Travel Mode)
             ======================================================== */}
          {(activeSection === 'LOW_DATA' || window.innerWidth < 1024) && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <WifiOff className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      {isAr ? '3. وضع البيانات المنخفضة للتجوال (Low Data Travel Mode)' : '3. Low-Data Roaming Saver'}
                    </h2>
                    <span className="text-[11px] text-slate-500">
                      {isAr ? 'حماية باقة الإنترنت التجوال باهظة الثمن من الاستهلاك غير المحسوب' : 'Prevent costly cellular roaming overage with bandwidth throttles'}
                    </span>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => setLowDataMode(!lowDataMode)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                    lowDataMode ? 'bg-amber-500' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    lowDataMode ? (isAr ? '-translate-x-6' : 'translate-x-6') : ''
                  }`} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isAr
                    ? 'عند تفعيل وضع توفير البيانات، يقلل التطبيق استهلاك الإنترنت بنسبة 85% عبر حجب الصور الثقيلة وتحويل التحديثات إلى نصوص خفيفة.'
                    : 'Low-Data mode cuts bandwidth usage by up to 85% by deferring high-resolution inspection photos and running lightweight status diffs.'}
                </p>

                <div className={`space-y-3 text-xs ${lowDataMode ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                  {/* Feature 1: Blur Thumbnails */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-black text-slate-900 block">
                        {isAr ? 'تحميل صور الطرود بدقة منخفضة فقط' : 'Load Low-Res Thumbnails Only'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {isAr ? 'لا يتم تحميل الصورة الأصلية إلا عند النقر اليدوي عليها' : 'Original raw inspection photos load only upon deliberate click'}
                      </span>
                    </div>
                    <button
                      onClick={() => setDisableHighResImages(!disableHighResImages)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                        disableHighResImages ? 'bg-amber-500' : 'bg-slate-200'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        disableHighResImages ? (isAr ? '-translate-x-5' : 'translate-x-5') : ''
                      }`} />
                    </button>
                  </div>

                  {/* Feature 2: Background Sync Paused */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-black text-slate-900 block">
                        {isAr ? 'إيقاف المزامنة التلقائية في الخلفية' : 'Pause Background Background Polling'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {isAr ? 'تحديث البيانات يتم فقط عند سحب الشاشة للأسفل يدوياً' : 'Data refreshes exclusively when user triggers pull-to-refresh'}
                      </span>
                    </div>
                    <button
                      onClick={() => setDisableBackgroundSync(!disableBackgroundSync)}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                        disableBackgroundSync ? 'bg-amber-500' : 'bg-slate-200'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        disableBackgroundSync ? (isAr ? '-translate-x-5' : 'translate-x-5') : ''
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              SECTION 4: إدارة الإشعارات الذكية (Smart Notifications Control)
             ======================================================== */}
          {(activeSection === 'NOTIFICATIONS' || window.innerWidth < 1024) && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      {isAr ? '4. إدارة الإشعارات والتنبيهات الذكية (Smart Notifications)' : '4. Smart Alerts & Notification Matrix'}
                    </h2>
                    <span className="text-[11px] text-slate-500">
                      {isAr ? 'تنبيهات الطرود الساخنة، رسائل SMS، وتذكيرات الوصول الجغرافي' : 'Parcel matching opportunities, SMS codes, and geo-fence arrival reminders'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 divide-y divide-slate-100 text-xs">
                {/* 1. Parcel Matching Alerts */}
                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5 pe-4">
                    <span className="font-black text-slate-900 block">
                      {isAr ? 'تنبيهات إسناد وفرص الطرود الفورية' : 'Instant Parcel Match Opportunities'}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {isAr ? 'إشعار فوري عند إضافة طرود ذات أرباح عالية مطابقة لخط سير رحلتك' : 'Push alerts when high-yield consignments match your upcoming flight path'}
                    </span>
                  </div>
                  <button
                    onClick={() => setParcelOpportunityAlerts(!parcelOpportunityAlerts)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                      parcelOpportunityAlerts ? 'bg-teal-600' : 'bg-slate-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      parcelOpportunityAlerts ? (isAr ? '-translate-x-6' : 'translate-x-6') : ''
                    }`} />
                  </button>
                </div>

                {/* 2. Hot Routes Alerts */}
                <div className="flex items-center justify-between pt-3">
                  <div className="space-y-0.5 pe-4">
                    <span className="font-black text-slate-900 block">
                      {isAr ? 'تنبيهات المسارات الساخنة (Hot Routes High Demand)' : 'High Demand Route Surge Alerts'}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {isAr ? 'إشعار عند ارتفاع مكافآت الكيلوغرام في مسار عمّان - الجزائر' : 'Notifies you when per-kg payouts surge on major routes'}
                    </span>
                  </div>
                  <button
                    onClick={() => setHotRoutesAlerts(!hotRoutesAlerts)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                      hotRoutesAlerts ? 'bg-teal-600' : 'bg-slate-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      hotRoutesAlerts ? (isAr ? '-translate-x-6' : 'translate-x-6') : ''
                    }`} />
                  </button>
                </div>

                {/* 3. Geo-Fence Arrival Reminder */}
                <div className="flex items-center justify-between pt-3">
                  <div className="space-y-0.5 pe-4">
                    <span className="font-black text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {isAr ? 'تنبيهات الوصول الجغرافي السياقية (GPS Geo-Fencing)' : 'Contextual Geo-Fenced Arrival Reminder'}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {isAr ? 'تذكير ذكي بتسليم العهدة وفك حجز الضمان بمجرد الاقتراب من فرع المقصد' : 'Prompts you to perform mutual handover scan upon nearing destination hub'}
                    </span>
                  </div>
                  <button
                    onClick={() => setGpsArrivalReminders(!gpsArrivalReminders)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                      gpsArrivalReminders ? 'bg-teal-600' : 'bg-slate-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      gpsArrivalReminders ? (isAr ? '-translate-x-6' : 'translate-x-6') : ''
                    }`} />
                  </button>
                </div>

                {/* 4. SMS Fallback Codes */}
                <div className="flex items-center justify-between pt-3">
                  <div className="space-y-0.5 pe-4">
                    <span className="font-black text-slate-900 block">
                      {isAr ? 'رموز التحقق والتسليم عبر رسائل SMS' : 'SMS Handover OTP Backup'}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {isAr ? 'إرسال كود الاستلام كرسالة نصية في حال انقطاع الإنترنت بالمطار' : 'Receive numeric backup handover tokens via offline cellular SMS'}
                    </span>
                  </div>
                  <button
                    onClick={() => setSmsFlightCodes(!smsFlightCodes)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                      smsFlightCodes ? 'bg-teal-600' : 'bg-slate-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      smsFlightCodes ? (isAr ? '-translate-x-6' : 'translate-x-6') : ''
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              SECTION 5: الأمان، الخصوصية وإدارة الأجهزة (Security & Devices)
             ======================================================== */}
          {(activeSection === 'SECURITY' || window.innerWidth < 1024) && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      {isAr ? '5. الأمان وإدارة الأجهزة النشطة (Security & Devices)' : '5. Biometrics & Registered Devices'}
                    </h2>
                    <span className="text-[11px] text-slate-500">
                      {isAr ? 'المصادقة البيومترية، التحقق بخطوتين، وقائمة الأجهزة المتصلة' : 'FaceID lock, two-factor auth, and active session termination'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Biometrics & 2FA Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Fingerprint className="w-4 h-4 text-indigo-600" />
                      {isAr ? 'المصادقة البيومترية' : 'FaceID / Biometrics'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {isAr ? 'قفل إضافي للتطبيق وسحب الأموال' : 'App lock & payout authorization'}
                    </span>
                  </div>
                  <button
                    onClick={() => setBiometricAuthEnabled(!biometricAuthEnabled)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      biometricAuthEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      biometricAuthEnabled ? (isAr ? '-translate-x-5' : 'translate-x-5') : ''
                    }`} />
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-indigo-600" />
                      {isAr ? 'المصادقة الثنائية (2FA)' : 'Two-Factor Auth (2FA)'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {isAr ? 'حماية الدخول من أجهزة جديدة' : 'Secures login on foreign devices'}
                    </span>
                  </div>
                  <button
                    onClick={() => setTwoFactorAuthEnabled(!twoFactorAuthEnabled)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      twoFactorAuthEnabled ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      twoFactorAuthEnabled ? (isAr ? '-translate-x-5' : 'translate-x-5') : ''
                    }`} />
                  </button>
                </div>
              </div>

              {/* [NEW FEATURE]: Active Sessions & Remote Logout */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-slate-700" />
                    {isAr ? 'الأجهزة المسجلة والجلسات النشطة (Active Sessions)' : 'Registered Devices & Active Logins'}
                  </span>

                  {activeSessions.length > 1 && (
                    <button
                      onClick={handleTerminateOtherSessions}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تسجيل الخروج من كافة الأجهزة الأخرى' : 'Sign Out All Other Devices'}</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {activeSessions.map((sess) => (
                    <div
                      key={sess.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                        sess.isCurrent ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                          sess.isCurrent ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {sess.type === 'MOBILE' ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900">{sess.device}</span>
                            {sess.isCurrent && (
                              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[9px] font-black">
                                {isAr ? 'هذا الجهاز' : 'CURRENT'}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {isAr ? sess.locationAr : sess.locationEn} • IP: {sess.ip}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400">
                        {isAr ? sess.lastActiveAr : sess.lastActiveEn}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              SECTION 6: المزامنة والوضع غير المتصل (Sync & Offline Management)
             ======================================================== */}
          {(activeSection === 'OFFLINE' || window.innerWidth < 1024) && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      {isAr ? '6. المزامنة والوضع غير المتصل (Offline & Cache)' : '6. Offline Vault & Storage Cache'}
                    </h2>
                    <span className="text-[11px] text-slate-500">
                      {isAr ? 'تخزين بيانات المانيفست المشفرة للعمل في المطار دون اتصال' : 'Local manifest encryption and storage cleanup'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Feature 1: Pre-download Wi-Fi */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-black text-slate-900 flex items-center gap-1.5">
                      <Wifi className="w-4 h-4 text-teal-600" />
                      {isAr ? 'التحميل التلقائي لبيانات الرحلة عبر Wi-Fi' : 'Auto-Precache Trip Manifests on Wi-Fi'}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {isAr ? 'يحفظ أرقام التتبع وبطاقات الصعود المشفرة للوصول إليها بدون إنترنت في المطار' : 'Pre-caches digital manifest passes and crypto tokens for 100% offline usage'}
                    </span>
                  </div>
                  <button
                    onClick={() => setAutoDownloadWifi(!autoDownloadWifi)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      autoDownloadWifi ? 'bg-teal-600' : 'bg-slate-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      autoDownloadWifi ? (isAr ? '-translate-x-5' : 'translate-x-5') : ''
                    }`} />
                  </button>
                </div>

                {/* Feature 2: Clear Storage Cache */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-black text-slate-900 flex items-center gap-1.5">
                      <Trash2 className="w-4 h-4 text-slate-600" />
                      {isAr ? 'مسح البيانات المؤقتة (Clear Cache)' : 'Purge Cached Travel Assets'}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {isAr ? `المساحة المستخدمة حالياً: ${cacheSizeMb}` : `Currently occupied storage: ${cacheSizeMb}`}
                    </span>
                  </div>

                  <button
                    onClick={handleClearCache}
                    disabled={isClearingCache}
                    className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isClearingCache ? 'animate-spin text-teal-600' : ''}`} />
                    <span>{isAr ? 'تفريغ الذاكرة' : 'Clear Cache'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              SECTION 7: إدارة الحساب (Account Management & Vacation)
             ======================================================== */}
          {(activeSection === 'ACCOUNT' || window.innerWidth < 1024) && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      {isAr ? '7. إدارة الحساب ووضع الإجازة (Account & Vacation)' : '7. Account State & Vacation Mode'}
                    </h2>
                    <span className="text-[11px] text-slate-500">
                      {isAr ? 'إيقاف استقبال العروض مؤقتاً أو إنهاء الجلسة' : 'Temporary pause on route alerts or account termination'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vacation Mode Toggle */}
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-black text-amber-950 flex items-center gap-1.5">
                    <Coffee className="w-4 h-4 text-amber-700" />
                    {isAr ? 'وضع الإجازة (Vacation Mode)' : 'Vacation / Snooze Mode'}
                  </span>
                  <span className="text-[11px] text-amber-800/80 block">
                    {isAr ? 'تجميد استقبال إشعارات وعروض الطرود مؤقتاً أثناء عدم استعدادك للسفر' : 'Temporarily silence consignment dispatch requests while taking time off'}
                  </span>
                </div>

                <button
                  onClick={() => {
                    const next = !vacationMode;
                    setVacationMode(next);
                    triggerToast(next ? (isAr ? 'تم تفعيل وضع الإجازة بنجاح.' : 'Vacation mode activated.') : (isAr ? 'تم استئناف استقبال الفرص.' : 'Ready for flight offers.'));
                  }}
                  className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                    vacationMode ? 'bg-amber-600' : 'bg-slate-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    vacationMode ? (isAr ? '-translate-x-6' : 'translate-x-6') : ''
                  }`} />
                </button>
              </div>

              {/* Danger Zone: Log Out & Account Deletion */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => {
                    if (onLogout) onLogout();
                    else window.location.reload();
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isAr ? 'تسجيل الخروج من الحساب' : 'Log Out from THOUESA'}</span>
                </button>

                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isAr ? 'طلب إغلاق وحذف الحساب' : 'Request Account Deletion'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Bottom Save Action for Mobile */}
          <div className="lg:hidden pt-4">
            <button
              onClick={handleSaveAll}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 cursor-pointer"
            >
              <Check className="w-4 h-4 text-teal-400" />
              <span>{isAr ? 'حفظ كافة التغييرات' : 'Save All Preferences'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-black text-slate-900">
                  {isAr ? 'تأكيد طلب حذف الحساب' : 'Confirm Account Deletion'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isAr
                    ? 'سيتم تدقيق عدم وجود أي عهد أو طرود معلقة أو رصيد ضمان غير محرر قبل مسح البيانات نهائياً من النظام وفق لوائح الأمان الجمركي.'
                    : 'System will verify no open custody consignments or locked escrow balances exist prior to irreversible account termination.'}
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    triggerToast(isAr ? 'تم إرسال طلب إغلاق الحساب للتدقيق الأمني.' : 'Account deletion request submitted for audit.');
                  }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'تأكيد الإغلاق' : 'Confirm Deletion'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
