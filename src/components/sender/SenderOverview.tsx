import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  Globe2, 
  Wallet, 
  Bell, 
  PlusCircle, 
  Calculator, 
  Copy, 
  CheckCircle2, 
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  MapPin,
  Box,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  RefreshCw,
  Globe,
  DollarSign,
  Send
} from 'lucide-react';
import { Currency, Hub, Locale, Shipment, SystemNotification, User } from '../../types';
import { MiniMapFlightTracker } from './MiniMapFlightTracker';
import { DraftResumptionBanner, OrderDraft } from './DraftResumptionBanner';
import { RealtimePriceCalculator } from './RealtimePriceCalculator';
import { CustomerNotificationsDrawer } from './CustomerNotificationsDrawer';
import { TopUpModal } from './TopUpModal';
import { PullToRefreshWrapper } from './PullToRefreshWrapper';
import { convertCurrency, formatCurrency } from '../../lib/crypto';
import { HUBS_DATA } from '../../lib/constants';

interface SenderOverviewProps {
  currentUser: User;
  walletBalance: number;
  activeShipmentsCount: number;
  onNavigate: (tab: string, extraData?: any) => void;
  isAr: boolean;
  shipments?: Shipment[];
  locale?: Locale;
  onLocaleChange?: (newLocale: Locale) => void;
  onRefreshData?: () => Promise<void> | void;
}

export const SenderOverview: React.FC<SenderOverviewProps> = ({
  currentUser,
  walletBalance,
  activeShipmentsCount,
  onNavigate,
  isAr,
  shipments = [],
  locale = 'ar',
  onLocaleChange,
  onRefreshData,
}) => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [clickedAction, setClickedAction] = useState<string | null>(null);

  // Quick Currency Localizer State (JOD, DZD, USD)
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(() => {
    try {
      return (localStorage.getItem('thouesa_user_currency') as Currency) || 'USD';
    } catch {
      return 'USD';
    }
  });

  const handleCurrencyChange = (currency: Currency) => {
    setSelectedCurrency(currency);
    try {
      localStorage.setItem('thouesa_user_currency', currency);
    } catch {}
  };

  // Sample or live notifications for customer
  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: 'notif-1',
      recipientRole: 'SENDER',
      title: isAr ? 'طردك في الطريق ✈️' : 'Parcel In Flight ✈️',
      message: isAr 
        ? 'تم نقل شحنتك (TH-JO-DZ-8891) على متن رحلة الملكية الأردنية المتجهة للجزائر.'
        : 'Your parcel (TH-JO-DZ-8891) has departed on RJ flight to Algiers.',
      type: 'SHIPMENT_STATUS',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    },
    {
      id: 'notif-2',
      recipientRole: 'SENDER',
      title: isAr ? 'إيداع بالمحفظة الضامنة 💰' : 'Escrow Deposit Confirmed 💰',
      message: isAr 
        ? 'تم تسجيل دفعة العربون (50$) بنجاح في حساب الضمان.'
        : 'Deposit of $50 has been secured in escrow.',
      type: 'WALLET_ESCROW',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    },
    {
      id: 'notif-3',
      recipientRole: 'SENDER',
      title: isAr ? 'رد خدمة العملاء على النزاع' : 'Customer Support Update',
      message: isAr 
        ? 'قام مسؤول النزاعات بمراجعة طلبك وإضافة تقرير وزن جديد.'
        : 'Dispute officer updated the weight verification report.',
      type: 'DISPUTE_UPDATE',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    }
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    // Realistic Skeleton Loading Screen for initial entry
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 650);
    return () => clearTimeout(timer);
  }, []);

  const handleActionClick = (actionId: string, targetTab: string) => {
    setClickedAction(actionId);
    setTimeout(() => {
      setClickedAction(null);
      onNavigate(targetTab);
    }, 400);
  };

  const copyTracking = (trackingNumber: string) => {
    navigator.clipboard.writeText(trackingNumber);
    setToastMessage(isAr ? `تم نسخ رقم التتبع بنجاح (${trackingNumber}) 📋` : `Tracking code copied (${trackingNumber}) 📋`);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleResumeDraft = (draft: OrderDraft) => {
    onNavigate(draft.serviceType, { draftData: draft.data, step: draft.step });
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleTopUpSuccess = (amountUsd: number) => {
    setToastMessage(
      isAr 
        ? `تم شحن رصيد المحفظة بنجاح بقيمة $${amountUsd} ✅`
        : `Successfully topped up $${amountUsd} to escrow wallet ✅`
    );
    if (onRefreshData) onRefreshData();
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter active shipments
  const activeShipments = (shipments || []).filter(
    (s) => s?.currentStatus !== 'DELIVERED' && s?.currentStatus !== 'CANCELLED' && s?.currentStatus !== 'REJECTED'
  );

  // Currency converted wallet balance
  const convertedBalance = convertCurrency(walletBalance, selectedCurrency);
  const formattedBalance = formatCurrency(convertedBalance, selectedCurrency);

  // 1. SKELETON SCREENS (Instant Realistic Mock Skeleton)
  if (isInitialLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-24 md:pb-6 animate-pulse">
        {/* Skeleton Header & Localizer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-200" />
            <div className="space-y-2">
              <div className="w-36 h-4 bg-slate-200 rounded-lg" />
              <div className="w-24 h-3 bg-slate-200 rounded-lg" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-28 h-9 rounded-xl bg-slate-200" />
            <div className="w-10 h-10 rounded-xl bg-slate-200" />
          </div>
        </div>

        {/* Skeleton Draft Banner */}
        <div className="w-full h-18 rounded-2xl bg-slate-200" />

        {/* Skeleton Wallet Card */}
        <div className="w-full h-40 rounded-3xl bg-slate-200" />

        {/* Skeleton 3 Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="h-28 rounded-2xl bg-slate-200" />
          <div className="h-28 rounded-2xl bg-slate-200" />
          <div className="h-28 rounded-2xl bg-slate-200" />
        </div>

        {/* Skeleton Realtime Calculator */}
        <div className="w-full h-56 rounded-3xl bg-slate-200" />

        {/* Skeleton Active Shipments & Mini-Map */}
        <div className="w-full h-64 rounded-3xl bg-slate-200" />
      </div>
    );
  }

  return (
    <PullToRefreshWrapper isAr={isAr} onRefresh={onRefreshData || (() => {})}>
      <div className="space-y-6 max-w-5xl mx-auto pb-24 md:pb-6 relative">
        
        {/* Toast Notification (Copy tracking & events) */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              key="toast"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-full shadow-2xl font-bold text-xs md:text-sm flex items-center gap-2.5 border border-slate-700 pointer-events-none"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals and Drawers */}
        <TopUpModal
          isOpen={isTopUpModalOpen}
          onClose={() => setIsTopUpModalOpen(false)}
          isAr={isAr}
          currentBalance={walletBalance}
          selectedCurrency={selectedCurrency}
          onTopUpSuccess={handleTopUpSuccess}
        />

        <CustomerNotificationsDrawer
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          isAr={isAr}
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onNavigate={onNavigate}
        />

        {/* 2. INTERACTIVE HEADER & QUICK LOCALIZER */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md border border-slate-200/90 rounded-3xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
        >
          {/* User Welcome */}
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-brand-500/20">
                {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-black text-slate-900">
                  {isAr ? `مرحباً، ${currentUser?.fullName?.split(' ')[0] || 'عميلنا العزيز'}` : `Hello, ${currentUser?.fullName?.split(' ')[0] || 'Dear Customer'}`}
                </h1>
                <span className="px-2 py-0.5 bg-brand-50 text-brand-700 text-[10px] font-black rounded-full border border-brand-100">
                  {currentUser?.kycStatus === 'VERIFIED' ? (isAr ? 'حساب موثق ✅' : 'Verified ID ✅') : (isAr ? 'عضوية معتمدة' : 'Member')}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {isAr ? 'منصة الشحن الجوي التشاركي وشراء الأمانات' : 'P2P Air Travel Shipping & International Shopping'}
              </p>
            </div>
          </div>

          {/* Quick Localizer & Notification Bell */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {/* Currency Switcher (1-Click JOD / DZD / USD) */}
            <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
              {(['JOD', 'DZD', 'USD'] as Currency[]).map((cur) => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => handleCurrencyChange(cur)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                    selectedCurrency === cur
                      ? 'bg-white text-slate-900 shadow-xs scale-102'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {cur === 'JOD' ? (isAr ? 'د.أ' : 'JOD') : cur === 'DZD' ? (isAr ? 'د.ج' : 'DZD') : '$'}
                </button>
              ))}
            </div>

            {/* Language Quick Switcher */}
            {onLocaleChange && (
              <div className="flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => onLocaleChange('ar')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    locale === 'ar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  عربي
                </button>
                <button
                  type="button"
                  onClick={() => onLocaleChange('en')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    locale === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  EN
                </button>
              </div>
            )}

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(true)}
              className="relative w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer text-slate-700"
              title={isAr ? 'الإشعارات والتنبيهات' : 'Notifications'}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </motion.div>

        {/* 3. DRAFT RESUMPTION CARD (بطاقة استئناف الطلب) */}
        <DraftResumptionBanner
          isAr={isAr}
          onResumeDraft={handleResumeDraft}
        />

        {/* Contextual Dispute Alert */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-500/10 via-amber-500/10 to-red-500/5 border border-red-200 dark:border-red-900/40 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs hover:border-red-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-red-900">
                  {isAr ? 'مركز النزاعات والضمان (Escrow Guarantee)' : 'Active Dispute & Escrow Center'}
                </span>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-black rounded-full">
                  {isAr ? 'حماية 100%' : '100% Protected'}
                </span>
              </div>
              <p className="text-[11px] text-red-700/90 mt-0.5">
                {isAr 
                  ? 'رصيدك مؤمّن بالكامل. يمكنك مراجعة النزاعات النشطة وإرفاق المستندات في أي وقت.' 
                  : 'Your escrow balance is fully locked until safe delivery is confirmed.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('DISPUTES')}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-transform active:scale-95 shadow-sm shadow-red-500/20 shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <span>{isAr ? 'لوحة النزاعات' : 'Disputes'}</span>
            {isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </motion.div>

        {/* 2. PROMINENT WALLET CARD */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <div className="text-xs text-slate-400 font-bold mb-1.5 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-brand-400" />
                <span>{isAr ? 'الرصيد المتاح بالمحفظة الضامنة' : 'Available Escrow Balance'}</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl md:text-4xl font-black tracking-tight text-white">
                  {formattedBalance}
                </span>
                {selectedCurrency !== 'USD' && (
                  <span className="text-xs font-bold text-slate-400">
                    (${walletBalance.toFixed(2)} USD)
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{isAr ? 'محمي بواسطة الضمان المالي المتبادل (Escrow Lock)' : 'Protected by mutual Escrow smart contract'}</span>
              </div>
            </div>

            {/* Direct Action: Top Up */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsTopUpModalOpen(true)}
                className="px-5 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-black text-xs md:text-sm transition-all flex items-center gap-2 shadow-lg shadow-brand-500/25 active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isAr ? 'إضافة رصيد' : 'Top Up Balance'}</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('WALLET')}
                className="px-4 py-3 bg-white/10 hover:bg-white/15 text-slate-200 rounded-2xl font-bold text-xs md:text-sm transition-all cursor-pointer"
              >
                {isAr ? 'سجل العمليات' : 'History'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* 3. QUICK ACTIONS (3 Main Channels) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-500" />
              {isAr ? 'الإجراءات السريعة والخدمات' : 'Quick Actions & Channels'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            {/* Option 1: Send Parcel */}
            <motion.button
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleActionClick('send', 'SEND_PARCEL')}
              disabled={clickedAction === 'send'}
              className="bg-brand-50/70 hover:bg-brand-100/80 border border-brand-200/80 p-4 md:p-5 rounded-2xl flex flex-col items-start gap-3 text-start transition-all shadow-xs cursor-pointer group disabled:opacity-80"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                {clickedAction === 'send' ? (
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <Package className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-black text-brand-950 text-sm md:text-base">
                  {isAr ? '1. إرسال طرد شخصي' : '1. Send Personal Parcel'}
                </h3>
                <p className="text-[11px] md:text-xs text-brand-800/80 mt-1 leading-relaxed">
                  {isAr ? 'أمانات وهدايا عائلية معفاة جمركياً من الباب للباب' : 'Family gifts & personal luggage door-to-door'}
                </p>
              </div>
            </motion.button>

            {/* Option 2: International Buy */}
            <motion.button
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleActionClick('intl', 'INTERNATIONAL_BUY')}
              disabled={clickedAction === 'intl'}
              className="bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200/80 p-4 md:p-5 rounded-2xl flex flex-col items-start gap-3 text-start transition-all shadow-xs cursor-pointer group disabled:opacity-80"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
                {clickedAction === 'intl' ? (
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <Globe2 className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-black text-indigo-950 text-sm md:text-base">
                  {isAr ? '2. شراء من متجر عالمي' : '2. Global Store Buy'}
                </h3>
                <p className="text-[11px] md:text-xs text-indigo-800/80 mt-1 leading-relaxed">
                  {isAr ? 'شي إن، أمازون، تيمو، زارا بنظام العربون 50%' : 'Amazon, Shein, Temu, Zara with 50% deposit'}
                </p>
              </div>
            </motion.button>

            {/* Option 3: Local Buy */}
            <motion.button
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleActionClick('local', 'SPECIFIC_COUNTRY_BUY')}
              disabled={clickedAction === 'local'}
              className="bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/80 p-4 md:p-5 rounded-2xl flex flex-col items-start gap-3 text-start transition-all shadow-xs cursor-pointer group disabled:opacity-80"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                {clickedAction === 'local' ? (
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <ShoppingBag className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-black text-emerald-950 text-sm md:text-base">
                  {isAr ? '3. شراء محلي من بلد آخر' : '3. Local Market Buy'}
                </h3>
                <p className="text-[11px] md:text-xs text-emerald-800/80 mt-1 leading-relaxed">
                  {isAr ? 'أسواق عمّان، أدوية، حلويات، قطع غيار بضمان الفاتورة' : 'Local stores in Amman/Algiers with invoice proof'}
                </p>
              </div>
            </motion.button>
          </div>
        </div>

        {/* 4. REAL-TIME PRICE CALCULATOR (Instant UI) */}
        <RealtimePriceCalculator
          isAr={isAr}
          selectedCurrency={selectedCurrency}
          activeHubs={HUBS_DATA}
          onStartShipmentWithQuote={(quote) => {
            onNavigate('SEND_PARCEL', { prefillQuote: quote });
          }}
        />

        {/* 5. ACTIVE SHIPMENTS & MINI-MAP FLIGHT TRACKER */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base md:text-lg font-black text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-500" />
              <span>{isAr ? 'شحناتك النشطة والتتبع الجوي' : 'Active Shipments & Flight Radar'}</span>
            </h2>
            {activeShipmentsCount > 0 && (
              <button 
                onClick={() => onNavigate('MY_SHIPMENTS')}
                className="text-xs font-black text-brand-600 hover:text-brand-700 px-3 py-1.5 bg-brand-50 rounded-xl transition-colors cursor-pointer"
              >
                {isAr ? 'عرض الكل' : 'View All'} ({activeShipments.length})
              </button>
            )}
          </div>

          {activeShipments.length > 0 ? (
            <div className="space-y-4">
              {activeShipments.slice(0, 2).map((shipment) => (
                <div key={shipment.id} className="space-y-2">
                  {/* Top Tracking & Meta Header */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm truncate">
                            {shipment.trackingNumber}
                          </span>
                          <button 
                            type="button"
                            onClick={() => copyTracking(shipment.trackingNumber)}
                            title={isAr ? 'نسخ رقم التتبع' : 'Copy Tracking Number'}
                            className="text-slate-400 hover:text-brand-600 transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {shipment.itemDescription || (isAr ? 'طرد شخصي أمانات' : 'Personal Goods')}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onNavigate('MY_SHIPMENTS')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer"
                    >
                      {isAr ? 'التفاصيل' : 'Details'}
                    </button>
                  </div>

                  {/* Mini-Map Flight Tracker Widget */}
                  <MiniMapFlightTracker
                    shipment={shipment}
                    isAr={isAr}
                    onViewDetails={() => onNavigate('MY_SHIPMENTS')}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* 5. AESTHETIC EMPTY STATE */
            <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-8 md:p-12 text-center relative overflow-hidden group">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="w-24 h-24 bg-gradient-to-br from-brand-50 to-indigo-50 rounded-full flex items-center justify-center group-hover:scale-108 transition-transform duration-500">
                  <Box className="w-12 h-12 text-brand-500" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-black shadow-md">
                  ✨
                </div>
              </div>

              <h3 className="font-black text-slate-900 text-base md:text-lg mb-2">
                {isAr ? 'لا توجد شحنات نشطة حالياً' : 'No active shipments right now'}
              </h3>
              <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
                {isAr 
                  ? 'ابدأ بإرسال أمانتك أو شراء منتجك المفضل الآن، وسيتولى المسافرون الموثوقون نقله بسرعة وأمان.' 
                  : 'Start sending your parcel or shopping internationally now. Verified travelers will handle it securely.'}
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button 
                  onClick={() => onNavigate('SEND_PARCEL')}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2.5 rounded-xl font-black text-xs md:text-sm transition-all shadow-md shadow-brand-500/20 active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  <span>{isAr ? 'إرسال طرد شخصي' : 'Send Parcel'}</span>
                </button>
                <button 
                  onClick={() => onNavigate('INTERNATIONAL_BUY')}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Globe2 className="w-4 h-4" />
                  <span>{isAr ? 'شراء من متجر عالمي' : 'Global Buy'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PullToRefreshWrapper>
  );
};
