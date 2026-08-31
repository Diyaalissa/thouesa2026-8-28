import React, { useState } from 'react';
import { EscrowWallet, Locale, Trip, User } from '../../types';
import { TravelerGamificationHeader } from './TravelerGamificationHeader';
import { SmartNudgesBanner } from './SmartNudgesBanner';
import { UpcomingTripCard } from './UpcomingTripCard';
import { TravelerFinancialSummaryCard } from './TravelerFinancialSummaryCard';
import { CurrencyExchangeWidget } from './CurrencyExchangeWidget';
import { TravelerQuickActionsCard } from './TravelerQuickActionsCard';
import { RefreshCw, ShieldCheck, Plane, AlertTriangle, ArrowRight } from 'lucide-react';

interface TravelerDashboardViewProps {
  currentUser: User;
  wallet: EscrowWallet | null | undefined;
  travelerTrips: Trip[];
  locale: Locale;
  onNavigateTab: (tab: any) => void;
  onAddNewTrip: () => void;
  onOpenQR: (trip: Trip) => void;
}

export const TravelerDashboardView: React.FC<TravelerDashboardViewProps> = ({
  currentUser,
  wallet,
  travelerTrips,
  locale,
  onNavigateTab,
  onAddNewTrip,
  onOpenQR,
}) => {
  const isAr = locale === 'ar';
  const [isMobileCurrencyModalOpen, setIsMobileCurrencyModalOpen] = useState(false);

  // Determine active/upcoming flight
  const upcomingTrip = travelerTrips.find(t => t.status === 'SCHEDULED' || t.status === 'PENDING');
  const inTransitTrip = travelerTrips.find(t => t.status === 'IN_TRANSIT' || t.status === 'ARRIVED');
  const activeTrip = inTransitTrip || upcomingTrip;

  // Calculate stats
  const totalDeliveredKg = 540;

  return (
    <div className="space-y-6 max-w-7xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Header Greeting & Trust Gamification */}
      <TravelerGamificationHeader
        currentUser={currentUser}
        locale={locale}
        totalDeliveredKg={totalDeliveredKg}
        rating={4.95}
        unreadCount={2}
      />

      {/* KYC Warning Banner if not verified */}
      {currentUser.kycStatus !== 'VERIFIED' && currentUser.kycStatus !== 'PENDING' && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-950">{isAr ? 'حسابك بحاجة لاستكمال التوثيق (KYC)' : 'Account Verification Required'}</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {isAr ? 'يرجى إرفاق صورة جواز السفر ومعلومات الحساب للبدء في حجز الرحلات واستلام الطرود.' : 'Please submit your passport and account details to schedule flights and accept parcels.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('PROFILE')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            {isAr ? 'توثيق الحساب الآن' : 'Verify Now'}
          </button>
        </div>
      )}

      {/* 2. Smart Nudges & Contextual Banner */}
      <SmartNudgesBanner
        activeTrip={activeTrip}
        locale={locale}
        onAddNewTrip={onAddNewTrip}
        onOpenHubMap={() => onNavigateTab('LEGAL_POLICIES')}
      />

      {/* 3. Main Responsive Multi-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left/Center Main Column (Upcoming Trip & Detailed Operational View) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Trip Contextual Card */}
          <UpcomingTripCard
            trip={activeTrip}
            locale={locale}
            onViewBag={() => onNavigateTab('MY_BAG')}
            onAddNewTrip={onAddNewTrip}
          />

          {/* Secondary Quick Stats / Mini Manifest Preview if trip exists */}
          {activeTrip && activeTrip.allocatedWeightKg > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{isAr ? 'جاهزية الشحنات والعهدة' : 'Shipment Custody Readiness'}</h3>
                    <p className="text-xs text-slate-500">{isAr ? 'نظرة سريعة على الطرود المسندة لرحلتك القادمة' : 'Assigned luggage packages status'}</p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateTab('MY_BAG')}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                >
                  <span>{isAr ? 'عرض التفاصيل الكاملة' : 'View Full List'}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-black text-slate-800 block">TH-PKG-8841 (5 kg)</span>
                    <span className="text-[11px] text-slate-500">{isAr ? 'أجهزة إلكترونية شخصية' : 'Personal electronics'}</span>
                  </div>
                  <span className="px-2.5 py-1 bg-teal-100 text-teal-800 font-bold rounded-lg text-[10px]">
                    {isAr ? 'تم الفحص' : 'Verified'}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-black text-slate-800 block">TH-PKG-9022 (3 kg)</span>
                    <span className="text-[11px] text-slate-500">{isAr ? 'وثائق وأوراق قانونية' : 'Legal documents'}</span>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg text-[10px]">
                    {isAr ? 'بانتظار الاستلام' : 'Pending Pickup'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right/Side Rail Column (Sticky Financials, Currency Exchange & Quick Actions) */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6">
          {/* Financial Summary */}
          <TravelerFinancialSummaryCard
            wallet={wallet}
            locale={locale}
            onManageWallet={() => onNavigateTab('WALLET')}
            onOpenDeposits={() => onNavigateTab('SECURITY_DEPOSITS')}
          />

          {/* Desktop Interactive Currency Exchange Widget */}
          <div className="hidden lg:block">
            <CurrencyExchangeWidget locale={locale} />
          </div>

          {/* Quick Actions */}
          <TravelerQuickActionsCard
            locale={locale}
            onAddNewTrip={onAddNewTrip}
            onScanQR={() => {
              if (activeTrip) {
                onOpenQR(activeTrip);
              } else {
                onNavigateTab('MY_BAG');
              }
            }}
            onOpenSupport={() => onNavigateTab('SUPPORT_SOS')}
          />
        </div>
      </div>

      {/* Mobile Currency Converter Bottom Sheet Modal */}
      <CurrencyExchangeWidget
        locale={locale}
        isModal={true}
        isOpen={isMobileCurrencyModalOpen}
        onClose={() => setIsMobileCurrencyModalOpen(false)}
      />
    </div>
  );
};
