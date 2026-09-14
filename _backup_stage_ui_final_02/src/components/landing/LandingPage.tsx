import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plane,
  Box,
  Building2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Calculator,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  TrendingUp,
  AlertCircle,
  PackagePlus,
  Globe2,
  ShoppingBag,
  Search,
  FileCheck,
  Megaphone,
  X,
} from 'lucide-react';
import {
  Currency,
  DailyExchangeRate,
  Hub,
  ItemCategory,
  Locale,
  PublicAnnouncement,
  Shipment,
  ShippingRate,
  Trip,
  UserRole,
} from '../../types';
import { calculateCustomerShippingQuote } from '../../lib/deliveryWindows';
import { getActiveCountries } from '../../lib/countryHelpers';
import { HUBS_DATA, ROUTE_PRICING } from '../../lib/constants';
import { normalizeCountryCode } from '../../lib/statusNormalizer';

interface LandingPageProps {
  locale: Locale;
  hubs?: Hub[];
  trips?: Trip[];
  shipments?: Shipment[];
  announcements?: PublicAnnouncement[];
  shippingRates?: ShippingRate[];
  exchangeRates?: DailyExchangeRate[];
  loading?: boolean;
  onNavigate: (role: UserRole) => void;
  onOpenAuth?: (mode?: 'SIGNIN' | 'SIGNUP' | 'EMPLOYEE') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  locale,
  hubs,
  trips = [],
  shipments = [],
  announcements = [],
  shippingRates = [],
  exchangeRates = [],
  loading = false,
  onNavigate,
  onOpenAuth,
}) => {
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const activeHubs = (hubs && hubs.length > 0 ? hubs : HUBS_DATA).filter(
    (h) => h.isActive !== false
  );

  // Derive dynamic countries from active hubs list
  const activeCountries = React.useMemo(() => {
    return getActiveCountries(activeHubs);
  }, [activeHubs]);

  // Local UI state for dismissed banner IDs
  const [dismissedBannerIds, setDismissedBannerIds] = useState<string[]>([]);

  // Publicly eligible announcements filtering
  const eligibleAnnouncements = React.useMemo(() => {
    if (!announcements || announcements.length === 0) return [];
    const now = Date.now();

    return announcements
      .filter((ann) => {
        if (ann.status !== 'ACTIVE') return false;
        const startTime = new Date(ann.startAt).getTime();
        if (isNaN(startTime) || startTime > now) return false;
        if (ann.endAt) {
          const endTime = new Date(ann.endAt).getTime();
          if (isNaN(endTime) || endTime < now) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const priorityDiff = (b.priority || 0) - (a.priority || 0);
        if (priorityDiff !== 0) return priorityDiff;
        const timeDiff = new Date(b.startAt).getTime() - new Date(a.startAt).getTime();
        if (timeDiff !== 0) return timeDiff;
        return a.id.localeCompare(b.id);
      });
  }, [announcements]);

  const topBannerAnnouncement = React.useMemo(() => {
    return eligibleAnnouncements.find(
      (ann) => ann.placement === 'TOP_BANNER' && !dismissedBannerIds.includes(ann.id)
    );
  }, [eligibleAnnouncements, dismissedBannerIds]);

  const homeFeaturedAnnouncements = React.useMemo(() => {
    return eligibleAnnouncements.filter((ann) => ann.placement === 'HOME_FEATURED').slice(0, 3);
  }, [eligibleAnnouncements]);

  const belowScheduleAnnouncements = React.useMemo(() => {
    return eligibleAnnouncements.filter((ann) => ann.placement === 'BELOW_SCHEDULE').slice(0, 2);
  }, [eligibleAnnouncements]);

  const formatFlightScheduleDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString(isAr ? 'ar-JO' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString || '';
    }
  };

  const getHubDisplay = (hubIdOrCode: string) => {
    const hub = activeHubs.find((h) => h.id === hubIdOrCode || h.code === hubIdOrCode);
    if (hub) {
      return {
        city: isAr ? hub.cityAr : hub.cityEn,
        name: isAr ? hub.nameAr : hub.nameEn,
        code: hub.code || hub.countryCode,
      };
    }
    if (hubIdOrCode?.toLowerCase().includes('amm') || hubIdOrCode?.toLowerCase().includes('jo')) {
      return { city: isAr ? 'عمان' : 'Amman', name: isAr ? 'مركز عمان' : 'Amman Hub', code: 'AMM' };
    }
    if (hubIdOrCode?.toLowerCase().includes('alg') || hubIdOrCode?.toLowerCase().includes('dz')) {
      return { city: isAr ? 'الجزائر' : 'Algiers', name: isAr ? 'مركز الجزائر' : 'Algiers Hub', code: 'ALG' };
    }
    return { city: hubIdOrCode, name: hubIdOrCode, code: hubIdOrCode };
  };

  // Publicly eligible upcoming delivery schedules
  const eligiblePublicTrips = React.useMemo(() => {
    if (!trips || trips.length === 0) return [];
    const now = Date.now();
    const ALLOWED_STATUSES: Array<Trip['status']> = ['VERIFIED', 'CONFIRMED'];

    return trips
      .filter((trip) => {
        if (!ALLOWED_STATUSES.includes(trip.status)) return false;
        const depTime = new Date(trip.departureTime).getTime();
        if (isNaN(depTime) || depTime <= now) return false;
        const available = Number(trip.availableWeightKg) || 0;
        const allocated = Number(trip.allocatedWeightKg) || 0;
        const remaining = Math.max(0, available - allocated);
        return remaining > 0;
      })
      .sort((a, b) => {
        const timeDiff = new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
        if (timeDiff !== 0) return timeDiff;
        return a.id.localeCompare(b.id);
      });
  }, [trips]);

  // Quick Estimate State
  const [originCountryCode, setOriginCountryCode] = useState(activeCountries[0]?.code || 'JO');
  const [destCountryCode, setDestCountryCode] = useState(
    activeCountries[1]?.code || activeCountries[0]?.code || 'DZ'
  );
  const [estWeightKg, setEstWeightKg] = useState(2.0);
  const [estCurrency, setEstCurrency] = useState<Currency>('JOD');

  // Maintain valid selected origin & destination when active countries change
  useEffect(() => {
    if (activeCountries.length > 0) {
      if (!activeCountries.some((c) => c.code === originCountryCode)) {
        setOriginCountryCode(activeCountries[0].code);
      }
      if (!activeCountries.some((c) => c.code === destCountryCode)) {
        setDestCountryCode(activeCountries[1]?.code || activeCountries[0].code);
      }
    }
  }, [activeCountries, originCountryCode, destCountryCode]);

  // Calculate Quick Estimate using shared CUSTOMER_SHIPPING rates & shared FX
  const quoteEstimate = React.useMemo(() => {
    if (originCountryCode === destCountryCode) {
      return {
        available: false,
        error: isAr
          ? 'يرجى اختيار بلد وصول مختلف عن بلد الإرسال للشحن الدولي'
          : 'Please select a destination country different from origin',
      };
    }

    return calculateCustomerShippingQuote({
      shippingRates,
      exchangeRates,
      originCountry: originCountryCode,
      destinationCountry: destCountryCode,
      serviceType: 'SEND_PARCEL',
      billingWeightKg: Math.max(0.5, estWeightKg),
      paymentCurrency: estCurrency,
    });
  }, [
    shippingRates,
    exchangeRates,
    originCountryCode,
    destCountryCode,
    estWeightKg,
    estCurrency,
    isAr,
  ]);

  // Live Public Tracking State
  const [trackingCodeInput, setTrackingCodeInput] = useState('');
  const [trackedShipment, setTrackedShipment] = useState<any | null>(null);
  const [trackingSearched, setTrackingSearched] = useState(false);
  const [isSearchingTracking, setIsSearchingTracking] = useState(false);

  const handleTrackShipment = async (overrideCode?: string) => {
    const code = (overrideCode || trackingCodeInput).trim().toUpperCase();
    if (!code) return;
    setIsSearchingTracking(true);
    setTrackingSearched(true);
    try {
      const res = await fetch(`/api/shipments/track/${encodeURIComponent(code)}`);
      const data = await res.json();
      if (data?.success && data?.shipment) {
        setTrackedShipment(data.shipment);
      } else {
        // Fallback to shared state lookup if client-only
        const matched = shipments.find(
          (s) =>
            s.trackingNumber?.toUpperCase() === code ||
            s.id?.toUpperCase() === code ||
            (s.securitySealId && s.securitySealId.toUpperCase() === code)
        );
        if (matched) {
          setTrackedShipment(matched);
        } else {
          setTrackedShipment(null);
        }
      }
    } catch {
      // Fallback to shared state lookup
      const matched = shipments.find(
        (s) =>
          s.trackingNumber?.toUpperCase() === code ||
          s.id?.toUpperCase() === code ||
          (s.securitySealId && s.securitySealId.toUpperCase() === code)
      );
      setTrackedShipment(matched || null);
    } finally {
      setIsSearchingTracking(false);
    }
  };

  const handleSendNowClick = () => {
    if (onOpenAuth) {
      onOpenAuth('SIGNUP');
    } else {
      onNavigate('SENDER');
    }
  };

  const handleAnnouncementCta = (target?: string) => {
    if (!target) return;
    if (target.startsWith('#')) {
      const el = document.getElementById(target.substring(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (target === 'SENDER' || target === 'TRAVELER' || target === 'HUB_AGENT') {
      onNavigate(target as UserRole);
    } else if (target.startsWith('AUTH:')) {
      const mode = target.split(':')[1] as 'SIGNIN' | 'SIGNUP' | 'EMPLOYEE';
      if (onOpenAuth) onOpenAuth(mode);
    }
  };

  const activeCountriesListText = React.useMemo(() => {
    if (activeCountries.length === 0) return isAr ? 'الأردن، الجزائر' : 'Jordan, Algeria';
    return activeCountries.map((c) => (isAr ? c.nameAr : c.nameEn)).join(isAr ? '، ' : ', ');
  }, [activeCountries, isAr]);

  return (
    <div className="space-y-12 pb-16">
      {/* Dynamic Top Announcement Banner (TOP_BANNER) */}
      {topBannerAnnouncement && (
        <div
          id="landing-top-banner"
          className="relative overflow-hidden bg-gradient-to-r from-brand-900 via-slate-900 to-teal-950 text-white px-4 py-3.5 rounded-2xl border border-brand-500/30 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-300 flex items-center justify-center shrink-0 border border-brand-400/30">
                <Megaphone className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {(topBannerAnnouncement.badgeAr || topBannerAnnouncement.badgeEn) && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-brand-400 text-slate-950 uppercase tracking-wider">
                      {isAr
                        ? topBannerAnnouncement.badgeAr
                        : topBannerAnnouncement.badgeEn || topBannerAnnouncement.badgeAr}
                    </span>
                  )}
                  <span className="font-bold truncate">
                    {isAr
                      ? topBannerAnnouncement.titleAr
                      : topBannerAnnouncement.titleEn || topBannerAnnouncement.titleAr}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] sm:text-xs truncate mt-0.5">
                  {isAr
                    ? topBannerAnnouncement.bodyAr
                    : topBannerAnnouncement.bodyEn || topBannerAnnouncement.bodyAr}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(topBannerAnnouncement.ctaLabelAr || topBannerAnnouncement.ctaLabelEn) && (
                <button
                  onClick={() => handleAnnouncementCta(topBannerAnnouncement.ctaTarget)}
                  className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-400 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isAr
                    ? topBannerAnnouncement.ctaLabelAr
                    : topBannerAnnouncement.ctaLabelEn || topBannerAnnouncement.ctaLabelAr}
                </button>
              )}
              {topBannerAnnouncement.isDismissible && (
                <button
                  onClick={() =>
                    setDismissedBannerIds((prev) => [...prev, topBannerAnnouncement.id])
                  }
                  aria-label={isAr ? 'إغلاق الإعلان' : 'Dismiss announcement'}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1. Hero Section with Luxury Cover Background */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 text-white p-8 md:p-14 border border-slate-800 shadow-2xl">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-25 mix-blend-luminosity scale-105 pointer-events-none"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=2000&q=80')`,
          }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-brand-950/60 pointer-events-none" />
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-400/20 border border-brand-400/30 text-brand-300 text-xs font-semibold mb-6 backdrop-blur-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {isAr
                ? 'ضمان مالي مشدد 100% ومراكز فحص معتمدة'
                : '100% Escrow Guarantee & Physical Hub Network'}
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-6">
            {isAr
              ? 'اشحن طرودك وتسوّق دولياً بأمان عبر المسافرين والضمان المالي'
              : 'Ship Packages & Shop Globally Safely with Verified Travelers & Escrow'}
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
            {isAr
              ? 'منصة ثويسا تجمع بين خدمات إرسال الطرود الشخصية والشراء من المتاجر العالمية والشحن عبر شبكة مراكز فحص معتمدة وتأمين مالي مسترد (Escrow) من المسافرين.'
              : 'THOUESA eliminates blind handovers through a certified Hub-and-Spoke model. Parcels are weighed and tamper-sealed at origin hubs, while travelers lock a refundable financial deposit until delivery.'}
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSendNowClick}
              className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-500/40 transition-all hover:scale-105 cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span>
                {isAr ? 'أرسل طردك الآن (تسجيل / دخول)' : 'Send Now (Sign Up / Sign In)'}
              </span>
              <ArrowIcon className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('TRAVELER')}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm rounded-xl transition-all cursor-pointer backdrop-blur-xs"
            >
              <Plane className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'اكسب كمسافر معتمد' : 'Earn as a Traveler'}</span>
            </button>
          </div>
        </div>

        {/* Operational Scope & Hubs Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 pt-8 border-t border-slate-800/80 text-xs relative z-10">
          <div>
            <span className="text-slate-400 block">{isAr ? 'شبكة الفروع النشطة' : 'Active Operational Hubs'}</span>
            <span className="text-lg font-bold text-slate-100">
              {activeHubs.length} {isAr ? 'مراكز معتمدة' : 'Certified Hubs'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">{isAr ? 'الدول المتاحة حالياً' : 'Operational Countries'}</span>
            <span className="text-lg font-bold text-emerald-400 truncate block" title={activeCountriesListText}>
              {activeCountriesListText}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">{isAr ? 'رحلات ومواعيد التوصيل المعتمدة' : 'Verified Flight Schedules'}</span>
            <span className="text-lg font-bold text-brand-300">
              {eligiblePublicTrips.length} {isAr ? 'رحلة قادمة جاهزة' : 'Upcoming verified trips'}
            </span>
          </div>
        </div>
      </section>

      {/* 2. THE 3 CORE SERVICES CARDS */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="px-3 py-1 bg-brand-400/10 text-brand-300 border border-brand-400/30 rounded-full text-xs font-bold uppercase tracking-wider">
            {isAr ? 'خدمات المنصة الشاملة' : 'Core Logistics Services'}
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-100 mt-2">
            {isAr
              ? 'ثلاث خيارات متكاملة للشحن والتسوق الدولي'
              : 'Three Integrated Services for Global Shipping & Sourcing'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {isAr
              ? 'اختر الخدمة المناسبة لاحتياجك واستمتع بضمان مالي 100% وفحص أمني في المراكز'
              : 'Select your preferred service with full financial escrow and physical hub verification.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Service 1: Send Package */}
          <div
            onClick={handleSendNowClick}
            className="group relative bg-slate-900 border border-slate-800 hover:border-brand-400/60 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-brand-400/10 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-300 border border-brand-400/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Box className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-brand-300 uppercase tracking-wide">
                {isAr ? 'الخدمة الأولى' : 'Service #1'}
              </span>
              <h4 className="text-lg font-black text-white mt-1 mb-2">
                {isAr ? 'إرسال طرد شخصي (أمانات وهدايا)' : 'Send Personal Package'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? 'تسليم طردك لأقرب مركز محلي، يتم وزنه وفحصه ووضع شريط لاصق أمني مشفر (Seal ID) ونقله مع مسافر معتمد.'
                  : 'Drop off items at your local hub. We inspect, weigh, and seal with cryptographic IDs before passenger dispatch.'}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-brand-300 group-hover:text-brand-300">
              <span>{isAr ? 'ابدأ إرسال طرد' : 'Send Package'}</span>
              <ArrowIcon className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Service 2: Buy from International Stores */}
          <div
            onClick={handleSendNowClick}
            className="group relative bg-slate-900 border border-slate-800 hover:border-brand-500/60 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/10 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Globe2 className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-brand-400 uppercase tracking-wide">
                {isAr ? 'الخدمة الثانية' : 'Service #2'}
              </span>
              <h4 className="text-lg font-black text-white mt-1 mb-2">
                {isAr ? 'الشراء من المتاجر العالمية' : 'Buy from Global Stores'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? 'ضع رابط المنتج من Amazon, Apple, AliExpress, eBay أو غيرها، ونقوم بالشراء والشحن لعنوانك مباشرة بأقل رسوم.'
                  : 'Paste product URLs from Amazon, Apple, AliExpress, or eBay. We handle purchasing, receiving, and direct transit.'}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-brand-400 group-hover:text-brand-300">
              <span>{isAr ? 'طلب شراء من متجر عالمي' : 'Order Global Store Items'}</span>
              <ArrowIcon className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Service 3: Buy from Specific Country & Ship */}
          <div
            onClick={handleSendNowClick}
            className="group relative bg-slate-900 border border-slate-800 hover:border-emerald-500/60 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">
                {isAr ? 'الخدمة الثالثة' : 'Service #3'}
              </span>
              <h4 className="text-lg font-black text-white mt-1 mb-2">
                {isAr ? 'الشراء من دولة محددة والشحن' : 'Buy from Specific Country & Ship'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr
                  ? 'اطلب منتجات مميزة من أي دولة بها فرع نشط لـ THOUESA ويقوم كادرنا أو المسافرون بشرائها وتوصيلها لبلدك.'
                  : 'Source local goods from any country with an active THOUESA hub via verified shoppers and travelers.'}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
              <span>{isAr ? 'طلب شراء محلي متخصص' : 'Source from Country'}</span>
              <ArrowIcon className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Announcements (HOME_FEATURED) */}
      {homeFeaturedAnnouncements.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-500" />
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                {isAr ? 'إعلانات وتحديثات منصة ثويسا' : 'Featured Announcements & Platform Updates'}
              </h3>
            </div>
          </div>

          <div
            className={`grid grid-cols-1 ${
              homeFeaturedAnnouncements.length > 1 ? 'md:grid-cols-2 lg:grid-cols-3' : ''
            } gap-5`}
          >
            {homeFeaturedAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-brand-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    {ann.badgeAr || ann.badgeEn ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                        {isAr ? ann.badgeAr : ann.badgeEn || ann.badgeAr}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {isAr ? 'إعلان مميز' : 'Featured'}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {new Date(ann.startAt).toLocaleDateString(isAr ? 'ar-JO' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-2 leading-snug">
                    {isAr ? ann.titleAr : ann.titleEn || ann.titleAr}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isAr ? ann.bodyAr : ann.bodyEn || ann.bodyAr}
                  </p>
                </div>

                {(ann.ctaLabelAr || ann.ctaLabelEn) && (
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => handleAnnouncementCta(ann.ctaTarget)}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isAr ? ann.ctaLabelAr : ann.ctaLabelEn || ann.ctaLabelAr}</span>
                      <ArrowIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. Quick Shipping Rate Estimate (Dynamic Hubs & CUSTOMER_SHIPPING Rates) */}
      <section
        id="shipping-estimate"
        className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {isAr ? 'تقدير تسعيرة الشحن الفورية' : 'Instant Shipping Quote Estimate'}
            </h3>
            <p className="text-xs text-slate-500">
              {isAr
                ? 'تقدير فوري مستند إلى تعرفة الشحن الرسمية المعتمدة والفروع النشطة في المنصة'
                : 'Instant quote estimate based on active certified hubs and official shipping rates'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Controls */}
          <div className="lg:col-span-2 space-y-5 text-xs text-slate-700">
            {/* Dynamic Origin & Destination Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1.5">
                  {isAr ? 'بلد الإرسال (الفرع المصدر)' : 'Origin Country (Hub)'}
                </label>
                <select
                  value={originCountryCode}
                  onChange={(e) => setOriginCountryCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-brand-400"
                >
                  {activeCountries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {isAr ? c.nameAr : c.nameEn} ({c.code}) - {c.activeHubsCount} {isAr ? 'فرع' : 'Hub(s)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1.5">
                  {isAr ? 'بلد الوصول (الفرع الوجهة)' : 'Destination Country (Hub)'}
                </label>
                <select
                  value={destCountryCode}
                  onChange={(e) => setDestCountryCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-brand-400"
                >
                  {activeCountries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {isAr ? c.nameAr : c.nameEn} ({c.code}) - {c.activeHubsCount} {isAr ? 'فرع' : 'Hub(s)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Weight Slider & Currency Picker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-semibold">
                    {isAr ? 'الوزن التقديري (كغم)' : 'Estimated Weight (kg)'}
                  </label>
                  <span className="font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
                    {estWeightKg} {isAr ? 'كغم' : 'kg'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={estWeightKg}
                  onChange={(e) => setEstWeightKg(Number(e.target.value))}
                  className="w-full accent-brand-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1.5">
                  {isAr ? 'عملة العرض التقديري' : 'Display Currency'}
                </label>
                <select
                  value={estCurrency}
                  onChange={(e) => setEstCurrency(e.target.value as Currency)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-brand-400"
                >
                  <option value="JOD">JOD - دينار أردني</option>
                  <option value="DZD">DZD - دينار جزائري</option>
                  <option value="USD">USD - دولار أمريكي</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quotation Summary Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col justify-between border border-slate-800">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
                <span>{isAr ? 'التسعير المعتمد' : 'Official Quote'}</span>
                <span className="font-semibold text-brand-300">
                  {normalizeCountryCode(originCountryCode)} ➔ {normalizeCountryCode(destCountryCode)}
                </span>
              </div>

              {quoteEstimate.available ? (
                <div className="my-5">
                  <span className="text-xs text-slate-400 block">
                    {isAr ? 'التكلفة التقديرية للشحن' : 'Estimated Shipping Fee'}
                  </span>
                  <div className="text-3xl font-black text-white mt-1">
                    {quoteEstimate.paymentAmount?.toFixed(2)} {quoteEstimate.paymentCurrency}
                  </div>
                  {quoteEstimate.baseCurrency && quoteEstimate.baseCurrency !== quoteEstimate.paymentCurrency && (
                    <span className="text-[11px] text-slate-400 block mt-1">
                      {isAr ? 'القيمة بالعملة الأساسية:' : 'Base Currency:'} {quoteEstimate.totalBaseAmount?.toFixed(2)} {quoteEstimate.baseCurrency}
                    </span>
                  )}
                </div>
              ) : (
                <div className="my-5 p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs">
                  <p className="font-bold">{quoteEstimate.error || (isAr ? 'التعرفة غير متوفرة لهذا المسار' : 'Rate unavailable for this route')}</p>
                  <p className="text-slate-400 text-[11px] mt-1">
                    {isAr
                      ? 'يمكنك التواصل مع خدمة العملاء لطلب مسار خاص'
                      : 'You can contact support to request a custom route'}
                  </p>
                </div>
              )}

              <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">{isAr ? 'نوع الخدمة:' : 'Service Type:'}</span>
                  <span className="font-semibold text-slate-200">{isAr ? 'شحن طرود موثقة' : 'Verified Parcel Transit'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isAr ? 'الضمان والأمان:' : 'Security & Escrow:'}</span>
                  <span className="font-semibold text-emerald-400">{isAr ? 'تأمين 100% مسترد' : '100% Locked Escrow'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSendNowClick}
              className="mt-6 w-full py-3 bg-brand-500 hover:bg-brand-400 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-brand-500/30"
            >
              <span>{isAr ? 'متابعة وحجز الشحنة' : 'Book Shipment with Escrow'}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 2.5 Live Public Tracking & Verification Search Bar */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                {isAr
                  ? 'تتبع الشحنة والتحقق من الختم الأمني المباشر'
                  : 'Live Shipment Tracking & Tamper Seal Verification'}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'أدخل رقم التتبع لمشاهدة حالة الشحنة ومراحل النقل لحظياً دون كشف بيانات المسافر الخاصة'
                  : 'Instant tracking by tracking code or tamper seal serial number'}
              </p>
            </div>
          </div>
        </div>

        {/* Tracking Input Search */}
        <div className="flex flex-col sm:flex-row gap-2 max-w-2xl">
          <div className="relative flex-1">
            <input
              type="text"
              value={trackingCodeInput}
              onChange={(e) => setTrackingCodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTrackShipment();
              }}
              placeholder={
                isAr
                  ? 'مثال: TH-JOR-ALG-202608-8841 أو SEAL-AMM-...'
                  : 'e.g. TH-JOR-ALG-202608-8841'
              }
              className="w-full pl-4 pr-10 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 text-xs font-mono focus:outline-none focus:border-brand-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute top-3.5 right-3.5" />
          </div>

          <button
            onClick={() => handleTrackShipment()}
            disabled={isSearchingTracking}
            className="px-6 py-3 bg-brand-500 hover:bg-brand-400 text-white font-bold text-xs rounded-xl transition-colors shrink-0 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSearchingTracking ? (
              <span>{isAr ? 'جاري البحث...' : 'Searching...'}</span>
            ) : (
              <>
                <span>{isAr ? 'تتبع فوري' : 'Track Now'}</span>
                <ArrowIcon className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Tracking Result View */}
        {trackingSearched && trackedShipment && (
          <div className="mt-6 p-5 bg-slate-800/70 border border-slate-700 rounded-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
              <div>
                <span className="text-[11px] text-slate-400">
                  {isAr ? 'رقم التتبع الدولي:' : 'Tracking Number:'}
                </span>
                <div className="text-base font-black text-brand-300 font-mono">
                  {trackedShipment.trackingNumber}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{trackedShipment.currentStatus}</span>
                </span>
                {trackedShipment.securitySealId && (
                  <span className="px-3 py-1 bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded-full text-xs font-mono font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{trackedShipment.securitySealId}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">
                  {isAr ? 'المحتويات المصرحة:' : 'Item Contents:'}
                </span>
                <span className="font-bold text-slate-200">
                  {trackedShipment.title || trackedShipment.itemTitle}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">
                  {isAr ? 'الوزن الفعلي المفحوص:' : 'Verified Weight:'}
                </span>
                <span className="font-bold text-slate-200">
                  {trackedShipment.actualWeightKg || trackedShipment.estimatedWeightKg} kg
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">{isAr ? 'فرع الإرسال:' : 'Origin Hub:'}</span>
                <span className="font-bold text-slate-200">
                  {trackedShipment.originHubCode || 'AMM-01'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">
                  {isAr ? 'فرع الاستلام:' : 'Destination Hub:'}
                </span>
                <span className="font-bold text-slate-200">
                  {trackedShipment.destinationHubCode || 'ALG-01'}
                </span>
              </div>
            </div>

            {trackedShipment.flightNumber && (
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-emerald-400" />
                  <span>
                    {isAr ? 'الرحلة المعينة:' : 'Assigned Flight:'}{' '}
                    <b className="text-white font-mono">
                      {trackedShipment.airline} ({trackedShipment.flightNumber})
                    </b>
                  </span>
                </div>
                <span className="text-slate-400 text-[11px]">
                  {isAr ? 'مرحلة النقل:' : 'Transit Stage:'}{' '}
                  <b className="text-slate-200">{isAr ? 'مسافر معتمد وموثق' : 'Verified Traveler Transit'}</b>
                </span>
              </div>
            )}
          </div>
        )}

        {trackingSearched && !trackedShipment && (
          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-2xl text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold">
                {isAr ? 'لم يتم العثور على شحنة بهذا الرمز' : 'No shipment found with this tracking number'}
              </p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {isAr
                  ? 'يرجى التأكد من كتابة رمز التتبع أو رمز الختم الأمني بشكل صحيح'
                  : 'Please check your tracking number or tamper seal serial code'}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 3. 4-Step Chain of Custody Diagram */}
      <section className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h3 className="text-2xl font-bold text-slate-900">
            {isAr ? 'كيف تضمن منصة ثويسا سلامة شحنتك وحماية العهدة؟' : 'How THOUESA Protects Your Shipment & Guarantees Custody'}
          </h3>
          <p className="text-xs text-slate-500 mt-2">
            {isAr
              ? 'سلسلة عهدة رقمية وميدانية متكاملة تحمي أموالك وطرودك في كل خطوة'
              : 'An unbroken digital & physical chain of custody safeguarding your shipments'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center font-black mb-3">
              1
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1.5">
              {isAr ? '1. فحص وختم أمني في المركز' : '1. Physical Intake & Seal'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isAr
                ? 'يسلم المرسل الطرد لفرع الدولة، يقوم الموظف بفحص المحتويات، قياس الوزن المعتمد، ووضع شريط الختم الأمني المشفر.'
                : 'Sender drops parcel at local hub. Agent inspects contents, checks certified scale weight, and applies serialized tamper seals.'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black mb-3">
              2
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1.5">
              {isAr ? '2. توثيق المسافر وحجز التأمين' : '2. PNR & Escrow Deposit'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isAr
                ? 'يتم تدقيق تذكرة الطيران (PNR) والهوية. يودع المسافر مبلغ تأمين مالي مسترد (Escrow) يعادل القيمة المصرح بها للطرد.'
                : 'Traveler identity & flight ticket (PNR) are verified. A refundable security deposit matching declared value is locked.'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black mb-3">
              3
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1.5">
              {isAr ? '3. تسليم مشفر برمز QR' : '3. Mutual QR Handover'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isAr
                ? 'يسلم الموظف الطرود للمسافر عبر مسح متبادل لرمز QR موقع بتوقيع HMAC لتوثيق انتقال العهدة رقمياً ولحظياً.'
                : 'Origin agent dispatches packages to traveler via mutual HMAC QR scanning, digitally recording custody handover.'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-black mb-3">
              4
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1.5">
              {isAr ? '4. استلام في الوجهة وفك التأمين' : '4. Intake & Escrow Release'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isAr
                ? 'يسلم المسافر الطرود لمركز وجهة الوصول. بعد فحص الأختام، يفك حجز التأمين فوراً، وتحول أرباح المسافر، ويسلم الطرد للمستلم.'
                : 'Destination hub verifies sealed packages via QR. Escrow deposit is unlocked, traveler payout released, and recipient notified.'}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Confirmed Delivery Opportunities & Hub Network */}
      <section id="delivery-schedule" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verified Delivery Schedule */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-brand-500" />
                <h4 className="font-bold text-slate-900 text-sm">
                  {isAr ? 'مواعيد التوصيل والرحلات المعتمدة القادمة' : 'Upcoming Verified Delivery Schedules'}
                </h4>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                {isAr ? 'معتمدة وموثقة' : 'Verified by Hub'}
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              {isAr
                ? 'مواعيد التوصيل القادمة بناءً على الرحلات المعتمدة والمفحوصة في THOUESA.'
                : 'Upcoming delivery schedules based on verified flights across THOUESA hubs.'}
            </p>

            {loading ? (
              <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="inline-block w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-xs text-slate-500 font-medium">
                  {isAr ? 'جاري تحميل مواعيد التوصيل...' : 'Loading delivery schedules...'}
                </p>
              </div>
            ) : eligiblePublicTrips.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-2xl">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700 text-xs">
                  {isAr
                    ? 'لا توجد مواعيد توصيل قادمة متاحة حالياً'
                    : 'No upcoming delivery schedules available at the moment'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {isAr
                    ? 'يتم تحديث المواعيد تلقائياً فور اعتماد وتوثيق رحلات المسافرين من قِبل مراكز العمليات.'
                    : 'Delivery schedules are automatically updated as traveler flights are verified by our hub operations.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {eligiblePublicTrips.slice(0, 5).map((trip) => {
                  const originInfo = getHubDisplay(trip.originHubId);
                  const destInfo = getHubDisplay(trip.destinationHubId);
                  const available = Number(trip.availableWeightKg) || 0;
                  const allocated = Number(trip.allocatedWeightKg) || 0;
                  const remainingKg = Math.max(0, available - allocated);

                  return (
                    <div
                      key={trip.id}
                      onClick={handleSendNowClick}
                      className="group p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>
                            {originInfo.city} ({originInfo.code})
                          </span>
                          <span className="text-slate-400">➔</span>
                          <span>
                            {destInfo.city} ({destInfo.code})
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span className="font-medium text-slate-700">
                            {trip.airline} ({trip.flightNumber})
                          </span>
                          <span>•</span>
                          <span>
                            {isAr ? 'الإقلاع:' : 'Dep:'} {formatFlightScheduleDate(trip.departureTime)}
                          </span>
                          {trip.arrivalTime && (
                            <>
                              <span>•</span>
                              <span>
                                {isAr ? 'الوصول المتوقع:' : 'Arrival:'}{' '}
                                {formatFlightScheduleDate(trip.arrivalTime)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-left shrink-0 mr-2 rtl:mr-0 rtl:ml-2">
                        <span className="font-bold text-emerald-700 block">
                          {remainingKg.toFixed(1)} {isAr ? 'كغم متاحة' : 'kg available'}
                        </span>
                        <span className="text-[10px] text-brand-600 group-hover:underline flex items-center gap-0.5 justify-end">
                          <span>{isAr ? 'اشحن الآن' : 'Ship Now'}</span>
                          <ArrowIcon className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Below Schedule Notice / Announcement Cards */}
            {belowScheduleAnnouncements.length > 0 && (
              <div className="mt-4 space-y-2.5">
                {belowScheduleAnnouncements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{isAr ? ann.titleAr : ann.titleEn || ann.titleAr}</span>
                          {(ann.badgeAr || ann.badgeEn) && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-semibold">
                              {isAr ? ann.badgeAr : ann.badgeEn || ann.badgeAr}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                          {isAr ? ann.bodyAr : ann.bodyEn || ann.bodyAr}
                        </p>
                      </div>
                    </div>
                    {(ann.ctaLabelAr || ann.ctaLabelEn) && (
                      <button
                        onClick={() => handleAnnouncementCta(ann.ctaTarget)}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-xl shrink-0 cursor-pointer self-end sm:self-center"
                      >
                        {isAr ? ann.ctaLabelAr : ann.ctaLabelEn || ann.ctaLabelAr}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              {isAr
                ? `الرحلات المعتمدة المتاحة: ${eligiblePublicTrips.length}`
                : `Verified active schedules: ${eligiblePublicTrips.length}`}
            </span>
            <button
              onClick={handleSendNowClick}
              className="font-bold text-brand-600 hover:text-brand-500 flex items-center gap-1 cursor-pointer"
            >
              <span>{isAr ? 'حجز موعد شحن' : 'Book Delivery Window'}</span>
              <ArrowIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Certified Hub Network Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-500" />
              <h4 className="font-bold text-slate-900 text-sm">
                {isAr ? 'شبكة مراكز الفحص والتخزين المعتمدة (Hubs)' : 'Certified Country Hub Network'}
              </h4>
            </div>
            <span className="text-xs text-slate-500">
              {activeHubs.length} {isAr ? 'مراكز نشطة' : 'Active Hubs'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {activeHubs.map((h) => (
              <div key={h.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">{h.code}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <p className="font-medium text-slate-700 text-[11px] truncate">
                  {isAr ? h.nameAr : h.nameEn}
                </p>
                <p className="text-slate-500 text-[10px] mt-1">{h.operatingHours}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
