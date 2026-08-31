import React from 'react';
import { 
  Plane, ShieldCheck, Wallet, Lock, User as UserIcon, Scale, 
  Settings, Phone, LogOut, ChevronRight, X, Sparkles, AlertCircle
} from 'lucide-react';
import { Locale, User } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface MobileMoreMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  locale: Locale;
  activeTab: string;
  onSelectTab: (tab: any) => void;
}

export const MobileMoreMenuDrawer: React.FC<MobileMoreMenuDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  locale,
  activeTab,
  onSelectTab,
}) => {
  const isAr = locale === 'ar';

  if (!isOpen) return null;

  const handleItemClick = (tab: string) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden bg-slate-900/60 backdrop-blur-xs transition-opacity">
      {/* Backdrop tap to close */}
      <div className="flex-1 w-full" onClick={onClose} />

      {/* Drawer Container */}
      <div 
        className="w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 pb-8 shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-200"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Drag Handle & Close */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-900">{isAr ? 'القائمة الكاملة والمزيد' : 'Full Menu & Services'}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Mini Profile Header */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center gap-3.5 mb-5 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-teal-500 flex items-center justify-center font-black text-teal-400">
            {currentUser.fullName ? currentUser.fullName.charAt(0) : 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm truncate">{currentUser.fullName}</h3>
              <StatusBadge status={currentUser.kycStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING'} type="kyc" locale={locale} />
            </div>
            <span className="text-[11px] text-slate-400 font-mono block mt-0.5 truncate">{currentUser.phone || currentUser.email}</span>
          </div>
        </div>

        {/* Section 1: Operations */}
        <div className="space-y-1 mb-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 block mb-1">
            {isAr ? 'العمليات والرحلات' : 'OPERATIONS & TRIPS'}
          </span>

          <button
            onClick={() => handleItemClick('MY_TRIPS')}
            className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
              activeTab === 'MY_TRIPS' ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <Plane className="w-4 h-4" />
              </div>
              <div className="text-start">
                <span className="block text-xs font-bold">{isAr ? 'إدارة رحلاتي' : 'My Trips'}</span>
                <span className="text-[10px] text-slate-400">{isAr ? 'إضافة رحلات وتتبع المسار' : 'Manage flights & routes'}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 rtl:rotate-180" />
          </button>

          <button
            onClick={() => handleItemClick('SECURITY_DEPOSITS')}
            className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
              activeTab === 'SECURITY_DEPOSITS' ? 'bg-amber-50 text-amber-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div className="text-start">
                <span className="block text-xs font-bold">{isAr ? 'سجل الضمانات المالية' : 'Security Deposits'}</span>
                <span className="text-[10px] text-slate-400">{isAr ? 'الودائع النشطة والمستردة' : 'Active & released holds'}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 rtl:rotate-180" />
          </button>
        </div>

        {/* Section 2: Account & Compliance */}
        <div className="space-y-1 mb-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 block mb-1">
            {isAr ? 'الحساب والامتثال القانوني' : 'ACCOUNT & LEGAL'}
          </span>

          <button
            onClick={() => handleItemClick('PROFILE')}
            className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
              activeTab === 'PROFILE' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="text-start">
                <span className="block text-xs font-bold">{isAr ? 'الملف الشخصي والتوثيق (KYC)' : 'Profile & KYC'}</span>
                <span className="text-[10px] text-slate-400">{isAr ? 'جواز السفر وتحديث الحساب' : 'Passport & banking info'}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 rtl:rotate-180" />
          </button>

          <button
            onClick={() => handleItemClick('LEGAL_POLICIES')}
            className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
              activeTab === 'LEGAL_POLICIES' ? 'bg-rose-50 text-rose-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
              <div className="text-start">
                <span className="block text-xs font-bold">{isAr ? 'الشروط وقائمة الممنوعات' : 'Terms & Banned Items'}</span>
                <span className="text-[10px] text-slate-400">{isAr ? 'تعهد الأمانة والجمارك (Offline)' : 'Trust pledge & regulations'}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 rtl:rotate-180" />
          </button>
        </div>

        {/* Section 3: Support & System */}
        <div className="space-y-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 block mb-1">
            {isAr ? 'الدعم والمساعدة' : 'SUPPORT & HELP'}
          </span>

          <button
            onClick={() => handleItemClick('SUPPORT_SOS')}
            className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all ${
              activeTab === 'SUPPORT_SOS' ? 'bg-rose-100 text-rose-800 font-bold' : 'bg-rose-50/70 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-200 text-rose-800 flex items-center justify-center font-bold">
                <Phone className="w-4 h-4" />
              </div>
              <div className="text-start">
                <span className="block text-xs font-black">{isAr ? 'مركز الدعم والطوارئ (24/7 SOS)' : 'Support & Emergency (SOS)'}</span>
                <span className="text-[10px] text-rose-600 font-medium">{isAr ? 'اتصال مباشر بفريق العمليات' : 'Direct emergency hotline'}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-400 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
