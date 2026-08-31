import React, { useState } from 'react';
import { Sparkles, Bell, Check, X, ShieldCheck, Award } from 'lucide-react';
import { Locale, User } from '../../types';

interface TravelerGamificationHeaderProps {
  currentUser: User;
  locale: Locale;
  totalDeliveredKg?: number;
  rating?: number;
  unreadCount?: number;
  onOpenNotifications?: () => void;
}

export const TravelerGamificationHeader: React.FC<TravelerGamificationHeaderProps> = ({
  currentUser,
  locale,
  totalDeliveredKg = 540,
  rating = 4.95,
  unreadCount = 2,
  onOpenNotifications,
}) => {
  const isAr = locale === 'ar';
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Tier determination logic
  let tierName = isAr ? 'مسافر ذهبي 🌟' : 'Gold Traveler 🌟';
  let tierBg = 'from-amber-500/15 via-amber-500/10 to-amber-600/5 text-amber-900 border-amber-300';
  let badgeColor = 'bg-amber-500 text-white';

  if (totalDeliveredKg >= 1000) {
    tierName = isAr ? 'مسافر بلاتيني 💎' : 'Platinum Traveler 💎';
    tierBg = 'from-indigo-500/15 via-purple-500/10 to-indigo-600/5 text-indigo-950 border-indigo-300';
    badgeColor = 'bg-indigo-600 text-white';
  } else if (totalDeliveredKg < 200) {
    tierName = isAr ? 'مسافر فضي 🛡️' : 'Silver Traveler 🛡️';
    tierBg = 'from-slate-500/15 via-slate-500/10 to-slate-600/5 text-slate-800 border-slate-300';
    badgeColor = 'bg-slate-600 text-white';
  }

  const firstName = currentUser.fullName?.split(' ')[0] || (isAr ? 'المسافر' : 'Traveler');

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Greeting & Trust Tier */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
          <span>{isAr ? `مرحباً يا ${firstName}` : `Welcome back, ${firstName}`}</span>
          <span className="inline-block hover:scale-125 transition-transform cursor-default">✈️</span>
        </h1>

        <div className="flex flex-wrap items-center gap-2.5 mt-2">
          {/* Gamification Trust Tier Badge */}
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border bg-gradient-to-r ${tierBg} shadow-2xs`}>
            <Award className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs font-black">
              {tierName}
            </span>
            <span className="text-[11px] font-medium opacity-80 border-s border-amber-300/60 ps-2">
              {isAr ? `تم نقل ${totalDeliveredKg} كغ بنجاح` : `${totalDeliveredKg} kg delivered`}
            </span>
          </div>

          {/* Rating Pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
            <span className="text-amber-500 font-black">★</span>
            <span>{rating.toFixed(2)}</span>
            <span className="text-[10px] text-emerald-600 font-medium">({isAr ? 'تقييم الامتثال' : 'Compliance'})</span>
          </div>
        </div>
      </div>

      {/* Notifications Button & Dropdown */}
      <div className="relative flex items-center gap-2 self-end sm:self-center">
        <button
          onClick={() => {
            setShowNotificationsModal(!showNotificationsModal);
            if (onOpenNotifications) onOpenNotifications();
          }}
          className="relative w-11 h-11 bg-white border border-slate-200 hover:border-teal-400 rounded-2xl flex items-center justify-center text-slate-700 hover:text-teal-700 shadow-2xs hover:bg-teal-50/50 transition-all cursor-pointer group"
          title={isAr ? 'الإشعارات والتحديثات' : 'Notifications'}
        >
          <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
          {unreadCount > 0 && (
            <span className="absolute top-2 end-2 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 ring-2 ring-white"></span>
            </span>
          )}
        </button>

        {/* Notifications Popover Modal */}
        {showNotificationsModal && (
          <div className="absolute top-13 end-0 w-80 sm:w-96 bg-white rounded-3xl border border-slate-200 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-teal-600" />
                <span className="font-black text-sm text-slate-900">{isAr ? 'التنبيهات والإشعارات' : 'Notifications'}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full">{unreadCount}</span>
              </div>
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto my-2 text-xs">
              <div className="py-3 space-y-1 hover:bg-slate-50 rounded-xl px-2 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{isAr ? 'تأكيد إسناد شحنة جديدة' : 'New Parcel Assigned'}</span>
                  <span className="text-[10px] text-slate-400 font-mono">10m ago</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {isAr
                    ? 'تم ربط طرد وزنه 5 كغ (إلكترونيات معتمدة) برحلتك القادمة إلى الجزائر.'
                    : 'A 5 kg parcel (certified electronics) was linked to your flight to Algiers.'}
                </p>
              </div>

              <div className="py-3 space-y-1 hover:bg-slate-50 rounded-xl px-2 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{isAr ? 'تذكير موعد الضمان المالي' : 'Escrow Deposit Reminder'}</span>
                  <span className="text-[10px] text-slate-400 font-mono">2h ago</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {isAr
                    ? 'يرجى مراجعة فرع عمان قبل الساعة 18:00 لإيداع الضمان واستلام بطاقة الإفراج.'
                    : 'Please visit Amman Hub before 18:00 to deposit escrow and collect release pass.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowNotificationsModal(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer text-center"
            >
              {isAr ? 'إغلاق التنبيهات' : 'Close'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
