import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  FileText, 
  Upload, 
  Camera, 
  QrCode, 
  Briefcase, 
  Award, 
  CreditCard, 
  Globe, 
  Plane, 
  Phone, 
  Mail, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ExternalLink, 
  HelpCircle, 
  Lock, 
  Bell, 
  Sparkles, 
  Scale, 
  LogOut, 
  ChevronRight, 
  Eye, 
  UserCheck, 
  Zap, 
  Luggage, 
  AlertCircle,
  Copy,
  Share2,
  Info,
  DollarSign,
  Sun,
  Palmtree
} from 'lucide-react';
import { User, Locale, KYCStatus, Currency } from '../../types';

interface TravelerProfileViewProps {
  currentUser: User;
  locale?: Locale;
  onRefreshData?: () => void;
  onNavigateToNewTrip?: (route?: { origin: string; dest: string }) => void;
  onNavigateToLegal?: () => void;
  onSignOut?: () => void;
}

interface VisaRecord {
  id: string;
  country: string;
  visaType: string;
  visaNumber: string;
  issueDate: string;
  expiryDate: string;
  isMultipleEntry: boolean;
  documentUrl?: string;
  status: 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON';
}

interface BankAccountRecord {
  id: string;
  type: 'IBAN' | 'CCP' | 'CLIQ' | 'CASH_HUB';
  bankName: string;
  accountNumber: string;
  beneficiaryName: string;
  currency: string;
  isDefault: boolean;
}

interface RouteSubscription {
  id: string;
  originCode: string;
  originName: string;
  destCode: string;
  destName: string;
  activeDemandKg: number;
  surgeMultiplier: number;
  isSubscribed: boolean;
}

export const TravelerProfileView: React.FC<TravelerProfileViewProps> = ({
  currentUser,
  locale = 'ar',
  onRefreshData,
  onNavigateToNewTrip,
  onNavigateToLegal,
  onSignOut,
}) => {
  const isAr = locale === 'ar';

  // 1. Core Profile & KYC State
  const [kycStatus, setKycStatus] = useState<KYCStatus>(currentUser.kycStatus || 'VERIFIED');
  const [fullName, setFullName] = useState(currentUser.fullName || 'أحمد المسافر');
  const [email, setEmail] = useState(currentUser.email || 'ahmad.traveler@thouesa.com');
  const [phone, setPhone] = useState(currentUser.phone || '+962 7 9123 4567');
  const [passportNumber, setPassportNumber] = useState(currentUser.passportNumber || 'P98421034');
  const [nationalId, setNationalId] = useState(currentUser.nationalId || '9851023948');
  const [nationality, setNationality] = useState(currentUser.nationality || (isAr ? 'أردني' : 'Jordanian'));
  const [passportExpiryDate, setPassportExpiryDate] = useState('2027-10-18');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80');

  // Edit Mode State
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [infoSavedSuccess, setInfoSavedSuccess] = useState(false);

  // 2. Camera Overlay / Scanner Modal State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraScanTarget, setCameraScanTarget] = useState<'PASSPORT' | 'SELFIE' | 'VISA'>('PASSPORT');
  const [isCapturing, setIsCapturing] = useState(false);
  const [passportScanUploaded, setPassportScanUploaded] = useState(true);
  const [selfieUploaded, setSelfieUploaded] = useState(true);

  // 3. Luggage Profile State (Feature #2)
  const [luggageType, setLuggageType] = useState<'HARD_SHELL' | 'SOFT_SHELL' | 'BACKPACK'>('HARD_SHELL');
  const [bagAllowance, setBagAllowance] = useState('2x 23kg Check-in + 1x 8kg Cabin');
  const [hasFragilePaddedSleeves, setHasFragilePaddedSleeves] = useState(true);
  const [hasTSALocks, setHasTSALocks] = useState(true);

  // 4. Emergency & Digital Delegation State (Feature #3)
  const [emergencyName, setEmergencyName] = useState('طارق المسافر (الأخ)');
  const [emergencyRelation, setEmergencyRelation] = useState(isAr ? 'أخ' : 'Brother');
  const [emergencyPhone, setEmergencyPhone] = useState('+962 7 9888 1234');
  
  // Digital Delegation Modal State
  const [isDelegationModalOpen, setIsDelegationModalOpen] = useState(false);
  const [delegateFullName, setDelegateFullName] = useState('');
  const [delegateIdNumber, setDelegateIdNumber] = useState('');
  const [delegatePhone, setDelegatePhone] = useState('');
  const [delegateRelationship, setDelegateRelationship] = useState(isAr ? 'أخ / قريب' : 'Brother / Relative');
  const [delegationAuthorizedManifest, setDelegationAuthorizedManifest] = useState('MNF-AMM-ALG-2026-901');
  const [activeDelegationPass, setActiveDelegationPass] = useState<{
    token: string;
    delegateName: string;
    delegateId: string;
    expiresAt: string;
    qrCode: string;
  } | null>(null);

  // 5. Visas & Residencies Vault State (Feature #1)
  const [visas, setVisas] = useState<VisaRecord[]>([
    {
      id: 'visa-01',
      country: isAr ? 'الجزائر 🇩🇿' : 'Algeria 🇩🇿',
      visaType: isAr ? 'تأشيرة دخول متعددة (Business C)' : 'Multiple Entry Business C',
      visaNumber: 'DZ-VISA-2026-891',
      issueDate: '2026-01-10',
      expiryDate: '2027-01-09',
      isMultipleEntry: true,
      status: 'ACTIVE',
    },
    {
      id: 'visa-02',
      country: isAr ? 'الأردن 🇯🇴' : 'Jordan 🇯🇴',
      visaType: isAr ? 'مواطن / هوية وطنية' : 'Citizen / National Passport',
      visaNumber: 'JOR-NAT-984210',
      issueDate: '2022-05-15',
      expiryDate: '2032-05-14',
      isMultipleEntry: true,
      status: 'ACTIVE',
    }
  ]);
  const [isAddingVisaModalOpen, setIsAddingVisaModalOpen] = useState(false);
  const [newVisaCountry, setNewVisaCountry] = useState(isAr ? 'المملكة العربية السعودية 🇸🇦' : 'Saudi Arabia 🇸🇦');
  const [newVisaType, setNewVisaType] = useState('Tourist / Umrah Visa');
  const [newVisaNumber, setNewVisaNumber] = useState('');
  const [newVisaExpiry, setNewVisaExpiry] = useState('2027-06-30');

  // 6. Bank Accounts State (Feature #5)
  const [bankAccounts, setBankAccounts] = useState<BankAccountRecord[]>([
    {
      id: 'bank-01',
      type: 'IBAN',
      bankName: isAr ? 'البنك العربي (Arab Bank - Jordan)' : 'Arab Bank (Jordan)',
      accountNumber: 'JO45ARAB00000001234567890123',
      beneficiaryName: 'Ahmad M. Al-Musafir',
      currency: 'USD',
      isDefault: true,
    },
    {
      id: 'bank-02',
      type: 'CCP',
      bankName: isAr ? 'بريد الجزائر (BaridiMob / Algérie Poste)' : 'Algérie Poste (BaridiMob)',
      accountNumber: '00799999001234567890',
      beneficiaryName: 'Ahmad Al-Musafir',
      currency: 'DZD',
      isDefault: false,
    },
    {
      id: 'bank-03',
      type: 'CLIQ',
      bankName: isAr ? 'كليك الأردن (CLIQ Instant Alias)' : 'CLIQ Jordan Alias',
      accountNumber: 'AHMAD_EXP',
      beneficiaryName: 'Ahmad Al-Musafir',
      currency: 'JOD',
      isDefault: false,
    }
  ]);
  const [isAddingBankModalOpen, setIsAddingBankModalOpen] = useState(false);
  const [newBankType, setNewBankType] = useState<'IBAN' | 'CCP' | 'CLIQ' | 'CASH_HUB'>('IBAN');
  const [newBankName, setNewBankName] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newBeneficiary, setNewBeneficiary] = useState('');

  // 7. Route Subscriptions & Vacation Mode (Feature #6)
  const [vacationMode, setVacationMode] = useState(false);
  const [preferredCurrency, setPreferredCurrency] = useState<Currency>('USD');
  const [preferredLanguage, setPreferredLanguage] = useState<Locale>(locale);

  const [routeSubscriptions, setRouteSubscriptions] = useState<RouteSubscription[]>([
    {
      id: 'sub-01',
      originCode: 'AMM',
      originName: isAr ? 'عَمّان (AMM)' : 'Amman (AMM)',
      destCode: 'ALG',
      destName: isAr ? 'الجزائر (ALG)' : 'Algiers (ALG)',
      activeDemandKg: 38.5,
      surgeMultiplier: 1.25,
      isSubscribed: true,
    },
    {
      id: 'sub-02',
      originCode: 'ALG',
      originName: isAr ? 'الجزائر (ALG)' : 'Algiers (ALG)',
      destCode: 'AMM',
      destName: isAr ? 'عَمّان (AMM)' : 'Amman (AMM)',
      activeDemandKg: 24.0,
      surgeMultiplier: 1.15,
      isSubscribed: true,
    },
    {
      id: 'sub-03',
      originCode: 'AMM',
      originName: isAr ? 'عَمّان (AMM)' : 'Amman (AMM)',
      destCode: 'JED',
      destName: isAr ? 'جدة (JED)' : 'Jeddah (JED)',
      activeDemandKg: 45.0,
      surgeMultiplier: 1.30,
      isSubscribed: false,
    },
    {
      id: 'sub-04',
      originCode: 'ALG',
      originName: isAr ? 'الجزائر (ALG)' : 'Algiers (ALG)',
      destCode: 'IST',
      destName: isAr ? 'إسطنبول (IST)' : 'Istanbul (IST)',
      activeDemandKg: 19.5,
      surgeMultiplier: 1.10,
      isSubscribed: false,
    }
  ]);

  // Passport Expiry Calculation
  const passportExpiryDetails = useMemo(() => {
    const today = new Date();
    const expiry = new Date(passportExpiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);

    let status: 'VALID' | 'WARNING_SOON' | 'EXPIRED' = 'VALID';
    if (diffDays <= 0) {
      status = 'EXPIRED';
    } else if (diffDays <= 90) {
      status = 'WARNING_SOON'; // Less than 3 months
    }

    return {
      daysRemaining: diffDays,
      monthsRemaining: diffMonths,
      status,
      formattedDate: expiry.toLocaleDateString(isAr ? 'ar-JO' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    };
  }, [passportExpiryDate, isAr]);

  // Save profile info
  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInfo(true);
    setTimeout(() => {
      setIsSavingInfo(false);
      setIsEditingInfo(false);
      setInfoSavedSuccess(true);
      setTimeout(() => setInfoSavedSuccess(false), 3000);
    }, 600);
  };

  // Generate Digital Delegation QR Pass
  const handleCreateDelegation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegateFullName || !delegateIdNumber || !delegatePhone) return;

    const token = `DEL-AUTH-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

    setActiveDelegationPass({
      token,
      delegateName: delegateFullName,
      delegateId: delegateIdNumber,
      expiresAt,
      qrCode: `THOUESA:DELEGATION:${token}:${delegateIdNumber}`,
    });
  };

  // Toggle Route Subscription
  const handleToggleRouteSubscription = (routeId: string) => {
    setRouteSubscriptions(prev => prev.map(r => {
      if (r.id === routeId) {
        return { ...r, isSubscribed: !r.isSubscribed };
      }
      return r;
    }));
  };

  // Set Default Bank
  const handleSetDefaultBank = (bankId: string) => {
    setBankAccounts(prev => prev.map(b => ({
      ...b,
      isDefault: b.id === bankId
    })));
  };

  // Add Visa Handler
  const handleAddVisa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisaNumber) return;

    const newV: VisaRecord = {
      id: `visa-${Date.now()}`,
      country: newVisaCountry,
      visaType: newVisaType,
      visaNumber: newVisaNumber,
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: newVisaExpiry,
      isMultipleEntry: true,
      status: 'ACTIVE'
    };

    setVisas(prev => [newV, ...prev]);
    setIsAddingVisaModalOpen(false);
    setNewVisaNumber('');
  };

  // Add Bank Handler
  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountNumber || !newBankName) return;

    const newB: BankAccountRecord = {
      id: `bank-${Date.now()}`,
      type: newBankType,
      bankName: newBankName,
      accountNumber: newAccountNumber,
      beneficiaryName: newBeneficiary || fullName,
      currency: newBankType === 'CCP' ? 'DZD' : newBankType === 'CLIQ' ? 'JOD' : 'USD',
      isDefault: bankAccounts.length === 0
    };

    setBankAccounts(prev => [...prev, newB]);
    setIsAddingBankModalOpen(false);
    setNewAccountNumber('');
    setNewBankName('');
    setNewBeneficiary('');
  };

  // Camera Capture Simulation
  const handleTriggerCapture = () => {
    setIsCapturing(true);
    setTimeout(() => {
      setIsCapturing(false);
      setIsCameraModalOpen(false);
      if (cameraScanTarget === 'PASSPORT') {
        setPassportScanUploaded(true);
        alert(isAr ? '✅ تم التقاط وتدقيق وضوح صورة جواز السفر بنجاح عبر الذكاء الاصطناعي!' : '✅ Passport photo scanned and validated with optical guideline!');
      } else if (cameraScanTarget === 'SELFIE') {
        setSelfieUploaded(true);
        alert(isAr ? '✅ تم التحقق من الصورة الشخصية الحية (Biometric Liveness Check) بنجاح!' : '✅ Live biometric selfie verified successfully!');
      }
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. TOP HEADER: Profile Identity & Verification Status Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs relative overflow-hidden space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Avatar & Main Identity */}
          <div className="flex items-center gap-5">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden border-3 border-teal-500 shadow-md bg-slate-100 relative">
                <img 
                  src={avatarUrl} 
                  alt={fullName} 
                  className="w-full h-full object-cover" 
                />
                <button 
                  onClick={() => {
                    setCameraScanTarget('SELFIE');
                    setIsCameraModalOpen(true);
                  }}
                  className="absolute inset-0 bg-slate-950/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
                >
                  <Camera className="w-5 h-5 mb-1 text-teal-300" />
                  <span>{isAr ? 'تغيير الصورة' : 'Change'}</span>
                </button>
              </div>

              {/* Status Dot */}
              <div className="absolute -bottom-1 -end-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-xs" title={isAr ? 'حساب نشط' : 'Active Account'}>
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-black text-slate-900">{fullName}</h1>
                
                {/* Verification Badge */}
                {kycStatus === 'VERIFIED' ? (
                  <span className="px-3 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-full text-xs font-black flex items-center gap-1.5 shadow-2xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{isAr ? 'حساب موثق رسمياً 🟢' : 'Verified Traveler 🟢'}</span>
                  </span>
                ) : kycStatus === 'PENDING' ? (
                  <span className="px-3 py-1 bg-amber-50 border border-amber-300 text-amber-800 rounded-full text-xs font-black flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>{isAr ? 'قيد مراجعة الوثائق 🟡' : 'Under Review 🟡'}</span>
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-rose-50 border border-rose-300 text-rose-800 rounded-full text-xs font-black flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>{isAr ? 'غير موثق - يرجى الرفع 🔴' : 'Unverified 🔴'}</span>
                  </span>
                )}

                {/* Loyalty Tier Pill */}
                <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-black flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-700" />
                  <span>{isAr ? 'مسافر ذهبي 🌟 (Gold Courier)' : 'Gold Courier 🌟'}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {email}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {nationality}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setIsEditingInfo(!isEditingInfo)}
              className="flex-1 md:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>{isEditingInfo ? (isAr ? 'إلغاء التعديل' : 'Cancel Edit') : (isAr ? 'تعديل البيانات' : 'Edit Profile')}</span>
            </button>

            <button
              onClick={() => setIsDelegationModalOpen(true)}
              className="flex-1 md:flex-initial px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <QrCode className="w-4 h-4" />
              <span>{isAr ? 'تفويض تسليم طارئ 🔏' : 'Digital Delegation'}</span>
            </button>
          </div>
        </div>

        {/* Edit Info Inline Form */}
        <AnimatePresence>
          {isEditingInfo && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSaveInfo}
              className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">{isAr ? 'الاسم الكامل:' : 'Full Name:'}</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{isAr ? 'رقم الهاتف:' : 'Phone Number:'}</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{isAr ? 'رقم جواز السفر:' : 'Passport Number:'}</label>
                <input
                  type="text"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{isAr ? 'تاريخ انتهاء الجواز:' : 'Passport Expiry Date:'}</label>
                <input
                  type="date"
                  value={passportExpiryDate}
                  onChange={(e) => setPassportExpiryDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
                  required
                />
              </div>

              <div className="col-span-full flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingInfo}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  {isSavingInfo ? <Clock className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{isAr ? 'حفظ التحديثات' : 'Save Changes'}</span>
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {infoSavedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'تم تحديث بيانات الملف الشخصي بنجاح!' : 'Profile updated successfully!'}</span>
          </div>
        )}

        {/* 1.1 Passport Expiry Warning Banner (If applicable) */}
        {passportExpiryDetails.status === 'WARNING_SOON' && (
          <div className="p-4 bg-amber-500/10 border border-amber-400 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-black block">
                {isAr ? '⚠️ تنبيه وشيك: جواز السفر ينتهي خلال أقل من 3 أشهر!' : '⚠️ Urgent: Passport expires in less than 3 months!'}
              </span>
              <p className="text-amber-800 leading-relaxed font-medium">
                {isAr 
                  ? `ينتهي جواز سفرك المسجل بتاريخ (${passportExpiryDetails.formattedDate}). تشترط سلطات الطيران والجمارك صلاحية 6 أشهر للسفر الدولي. يرجى تجديد الجواز ورفع النسخة المحدثة لتجنب تعليق حجز الرحلات.`
                  : `Your passport expires on (${passportExpiryDetails.formattedDate}). International flights require 6 months validity. Please renew and re-upload to avoid trip creation suspension.`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. MAIN GRID LAYOUT: Desktop Multi-Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* === LEFT/MAIN COLUMN (8 COLUMNS): KYC Documents, Luggage Profile, Visas, Payouts === */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* SECTION 1: Document Upload Center & Camera Guideline Scanner */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-black text-sm text-slate-900">
                    {isAr ? 'مركز رفع الوثائق وتوثيق الهوية (KYC Document Center)' : 'KYC Document Center'}
                  </h2>
                  <span className="text-[11px] text-slate-500">
                    {isAr ? 'المطابقة الجمركية وإثبات الشخصية المشفر' : 'Encrypted identity verification for customs clearance'}
                  </span>
                </div>
              </div>

              <span className="text-xs font-mono font-bold text-slate-400">
                256-bit SSL Vault 🔒
              </span>
            </div>

            {/* Document Upload Slots Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Passport Slot */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-teal-500/40 bg-teal-50/30 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-teal-600" />
                      {isAr ? 'صفحة بيانات جواز السفر' : 'Passport Bio-Page'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                      {isAr ? 'تم التحقق 🟢' : 'Verified'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {isAr ? 'صورة واضحة كاملة مع شريط المقروئية الآلية (MRZ).' : 'Clear full page with readable MRZ lines.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-teal-200/50">
                  <button
                    onClick={() => {
                      setCameraScanTarget('PASSPORT');
                      setIsCameraModalOpen(true);
                    }}
                    className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إعادة المسح الذكي 📷' : 'Scan with Camera'}</span>
                  </button>
                  
                  <button 
                    onClick={() => alert(isAr ? 'جاري معاينة صورة جواز السفر المعتمدة...' : 'Previewing certified passport document...')}
                    className="p-2 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                    title={isAr ? 'معاينة المستند' : 'Preview Document'}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Live Selfie Slot */}
              <div className="p-4 rounded-2xl border-2 border-dashed border-indigo-500/40 bg-indigo-50/30 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      {isAr ? 'الصورة الشخصية الحية (Selfie)' : 'Live Biometric Selfie'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                      {isAr ? 'تمت المطابقة 🟢' : 'Matched'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {isAr ? 'مطابقة حيوية بالذكاء الاصطناعي مع صورة الجواز لمنع انتحال الهوية.' : 'Biometric match against passport photo.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-indigo-200/50">
                  <button
                    onClick={() => {
                      setCameraScanTarget('SELFIE');
                      setIsCameraModalOpen(true);
                    }}
                    className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{isAr ? 'التقاط سيلفي جديد 🤳' : 'Retake Selfie'}</span>
                  </button>
                  
                  <button 
                    onClick={() => alert(isAr ? 'الصورة الشخصية الحية مطابقة بنسبة 99.8% مع الجواز.' : 'Live selfie matched 99.8% with passport.')}
                    className="p-2 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                    title={isAr ? 'معاينة' : 'Preview'}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Luggage & Handling Profile (السعة الفنية وسجل الحقائب) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-black text-sm text-slate-900">
                    {isAr ? 'السعة الفنية ونوع الحقائب (Luggage & Handling Profile)' : 'Luggage & Handling Profile'}
                  </h2>
                  <span className="text-[11px] text-slate-500">
                    {isAr ? 'يحدد النظام أولوية ربط الطرود الحساسة (عطور وإلكترونيات) بناءً على نوع حقائبك' : 'Determines algorithmic fragile assignment based on bag armor'}
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full text-[10px] font-black">
                {isAr ? 'أولوية شحن أعلى +25%' : '+25% Priority Match'}
              </span>
            </div>

            {/* Luggage Type Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'HARD_SHELL',
                  title: isAr ? 'حقائب صلبة (Hard-Shell)' : 'Hard-Shell Suitcase',
                  desc: isAr ? 'بولي كربونات / ألومنيوم مقاوم للصدمات والكسر' : 'Polycarbonate / Aluminum shock-resistant armor',
                  icon: '🛡️',
                  badge: isAr ? 'موصى به للطرود الحساسة' : 'Fragile Ready',
                  isRecommended: true
                },
                {
                  id: 'SOFT_SHELL',
                  title: isAr ? 'حقائب قماشية (Soft-Shell)' : 'Soft-Shell Suitcase',
                  desc: isAr ? 'قماش نايلون مرن مناسب للملابس والوثائق' : 'Flexible fabric suited for apparel & documents',
                  icon: '🧳',
                  badge: isAr ? 'طرود قياسية' : 'Standard Parcels',
                  isRecommended: false
                },
                {
                  id: 'BACKPACK',
                  title: isAr ? 'حقائب ظهر (Backpack)' : 'Backpack / Duffel',
                  desc: isAr ? 'حمولة يدوية خفيفة للشحن السريع والشخصي' : 'Cabin duffel for urgent light courier items',
                  icon: '🎒',
                  badge: isAr ? 'شحن فوري سريع' : 'Light Courier',
                  isRecommended: false
                }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setLuggageType(item.id as any)}
                  className={`p-4 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    luggageType === item.id 
                      ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20 shadow-xs' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{item.icon}</span>
                      {item.isRecommended && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded-md">
                          {isAr ? 'علاوة خاصة' : 'Surge Bonus'}
                        </span>
                      )}
                    </div>
                    <h3 className="font-black text-xs text-slate-900">{item.title}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                  </div>

                  <span className={`text-[10px] font-bold block pt-2 border-t ${
                    luggageType === item.id ? 'border-amber-300 text-amber-900' : 'border-slate-100 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                </button>
              ))}
            </div>

            {/* Bag Specs & Security Checks */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-800 block">
                    {isAr ? 'سعة الحقائب المعتادة لكل رحلة:' : 'Typical Baggage Capacity Allowance:'}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    {isAr ? 'يتم إشغال الوزن المتاح للشحن حسب الوزن غير المستخدم في تذكرتك' : 'Unused ticket allowance utilized for cargo'}
                  </span>
                </div>
                <input
                  type="text"
                  value={bagAllowance}
                  onChange={(e) => setBagAllowance(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800 sm:w-64"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasFragilePaddedSleeves}
                    onChange={(e) => setHasFragilePaddedSleeves(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded-md"
                  />
                  <span className="text-slate-700 font-medium">
                    {isAr ? 'أمتلك فواصل وأكياس هوائية مبطنة للطرود الحساسة' : 'Equipped with padded bubble sleeves for fragile cargo'}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasTSALocks}
                    onChange={(e) => setHasTSALocks(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded-md"
                  />
                  <span className="text-slate-700 font-medium">
                    {isAr ? 'الحقائب مزودة بأقفال أمان جمركية (TSA Certified Locks)' : 'Bags equipped with TSA Certified Travel Locks'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* SECTION 3: Visa & Residency Vault (خزانة تأشيرات السفر والإقامة) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-black text-sm text-slate-900">
                    {isAr ? 'خزانة تأشيرات السفر والإقامة (Visa & Residency Vault)' : 'Visa & Residency Vault'}
                  </h2>
                  <span className="text-[11px] text-slate-500">
                    {isAr ? 'إثبات الأهلية القانونية لدخول وجهات الشحن دون تعقيدات جمركية' : 'Proof of legal entry into destination countries'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsAddingVisaModalOpen(true)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة تأشيرة' : 'Add Visa'}</span>
              </button>
            </div>

            {/* Visa List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {visas.map((visa) => (
                <div 
                  key={visa.id} 
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-xs">{visa.country}</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-black">
                        {isAr ? 'سارية 🟢' : 'Active 🟢'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-600 font-bold block">{visa.visaType}</span>
                    <span className="text-[10px] font-mono text-slate-400 block">{visa.visaNumber}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-200 text-slate-500">
                    <span>{isAr ? 'تنتهي في:' : 'Expires:'} {visa.expiryDate}</span>
                    <span className="font-bold text-teal-700">{visa.isMultipleEntry ? (isAr ? 'دخول متعدد' : 'Multiple') : (isAr ? 'دخول مفرد' : 'Single')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: Bank Payout Methods (حسابات الاستلام البنكية) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-black text-sm text-slate-900">
                    {isAr ? 'حسابات استلام الأرباح (Payout Accounts)' : 'Payout Accounts'}
                  </h2>
                  <span className="text-[11px] text-slate-500">
                    {isAr ? 'إدارة الحسابات البنكية والبريدية لتحويل أرباح الرحلات' : 'Manage bank accounts, CCP, and digital payout routes'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsAddingBankModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة حساب' : 'Add Account'}</span>
              </button>
            </div>

            {/* Bank Accounts List */}
            <div className="space-y-3">
              {bankAccounts.map((account) => (
                <div
                  key={account.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                    account.isDefault 
                      ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-400/30' 
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                      account.type === 'CCP' 
                        ? 'bg-amber-100 text-amber-800' 
                        : account.type === 'CLIQ' 
                        ? 'bg-indigo-100 text-indigo-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {account.type}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-slate-900">{account.bankName}</span>
                        {account.isDefault && (
                          <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[9px] font-black">
                            {isAr ? 'الحساب الافتراضي' : 'Default'}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs text-slate-600 block mt-0.5">{account.accountNumber}</span>
                      <span className="text-[10px] text-slate-400">{account.beneficiaryName} ({account.currency})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!account.isDefault && (
                      <button
                        onClick={() => handleSetDefaultBank(account.id)}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        {isAr ? 'تعيين كافتراضي' : 'Set Default'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === RIGHT COLUMN (4 COLUMNS): Trust Badges, Emergency Contact, Route Subscriptions, Legal === */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* SECTION 5: Trust & Badges Showcase (الموثوقية والأوسمة) */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">
                    {isAr ? 'سجل الموثوقية والأوسمة' : 'Trust & Badges Showcase'}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    Verified Courier Score: 99.8%
                  </span>
                </div>
              </div>

              <span className="text-xl">🌟</span>
            </div>

            {/* Key Metrics Stats */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'الوزن المنقول' : 'Weight Shipped'}</span>
                <span className="text-lg font-black font-mono text-amber-400">48.5 KG</span>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'الرحلات الناجحة' : 'Trips Completed'}</span>
                <span className="text-lg font-black font-mono text-emerald-400">14 {isAr ? 'رحلة' : 'Trips'}</span>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'نسبة الالتزام' : 'Punctuality'}</span>
                <span className="text-lg font-black font-mono text-teal-300">100%</span>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">{isAr ? 'معدل التلف' : 'Damage Rate'}</span>
                <span className="text-lg font-black font-mono text-emerald-400">0.0% 🛡️</span>
              </div>
            </div>

            {/* Smart Badges Collection */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {isAr ? 'الأوسمة الذكية المعتمدة:' : 'Active Smart Badges:'}
              </span>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700 flex items-center gap-2.5">
                  <span className="text-base">🛡️</span>
                  <div>
                    <span className="font-bold text-white block">{isAr ? 'ناقل آمن (Zero Damage Master)' : 'Zero Damage Master'}</span>
                    <span className="text-[10px] text-slate-400">{isAr ? 'لم يُسجل أي تلف أو فقدان لأي طرد' : 'No parcels damaged in carrier history'}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700 flex items-center gap-2.5">
                  <span className="text-base">⏱️</span>
                  <div>
                    <span className="font-bold text-white block">{isAr ? 'دقيق في المواعيد (Punctual Courier)' : 'Punctual Courier'}</span>
                    <span className="text-[10px] text-slate-400">{isAr ? 'تسليم خلال أقل من 3 ساعات من الوصول' : 'Handover within 3h of landing'}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700 flex items-center gap-2.5">
                  <span className="text-base">💼</span>
                  <div>
                    <span className="font-bold text-white block">{isAr ? 'خبير الحماية الصلبة (Hard-Shell Pro)' : 'Hard-Shell Armor Pro'}</span>
                    <span className="text-[10px] text-slate-400">{isAr ? 'معتمد لنقل العطور والإلكترونيات الحساسة' : 'Certified for high-value delicate goods'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 6: Next of Kin & Emergency Data (بيانات الطوارئ) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  {isAr ? 'جهة اتصال الطوارئ (Next of Kin)' : 'Emergency Contact'}
                </h3>
                <span className="text-[11px] text-slate-500">
                  {isAr ? 'للتواصل العاجل في حال تعثر الرحلة أو الطوارئ' : 'Direct contact in unforeseen circumstances'}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'اسم الشخص:' : 'Contact Person:'}</span>
                <span className="font-bold text-slate-900">{emergencyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'صلة القرابة:' : 'Relationship:'}</span>
                <span className="font-bold text-slate-900">{emergencyRelation}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">{isAr ? 'رقم الهاتف:' : 'Phone Number:'}</span>
                <span className="font-bold text-slate-900">{emergencyPhone}</span>
              </div>
            </div>
          </div>

          {/* SECTION 7: Smart Route Subscriptions (الاشتراك الذكي بالمسارات) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    {isAr ? 'الاشتراك بالمسارات (Route Surge)' : 'Route Subscriptions'}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {isAr ? 'تنبيهات فورية عند زيادة الطلب على خطوطك' : 'Instant push alerts when high cargo demand surges'}
                  </span>
                </div>
              </div>

              <span className="text-xs">🔥</span>
            </div>

            {/* Vacation Mode Toggle */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Palmtree className="w-4 h-4 text-amber-700" />
                <div>
                  <span className="font-bold text-amber-900 block">{isAr ? 'وضع الإجازة (Vacation Mode)' : 'Vacation Mode'}</span>
                  <span className="text-[10px] text-amber-700">{isAr ? 'إيقاف إشعارات تكدس الطرود مؤقتاً' : 'Temporarily mute cargo surge alerts'}</span>
                </div>
              </div>

              <button
                onClick={() => setVacationMode(!vacationMode)}
                className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                  vacationMode ? 'bg-amber-600' : 'bg-slate-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  vacationMode ? (isAr ? '-translate-x-5' : 'translate-x-5') : ''
                }`} />
              </button>
            </div>

            {/* Subscribed Routes List */}
            <div className="space-y-2.5">
              {routeSubscriptions.map((route) => (
                <div
                  key={route.id}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-black text-slate-900 block">
                      {route.originName} ✈️ {route.destName}
                    </span>
                    <span className="text-[10px] text-teal-700 font-bold block">
                      {route.activeDemandKg} kg {isAr ? 'بانتظار مسافر' : 'pending'} • {isAr ? 'علاوة' : 'Surge'} +{Math.round((route.surgeMultiplier - 1) * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onNavigateToNewTrip && (
                      <button
                        onClick={() => onNavigateToNewTrip({ origin: route.originCode, dest: route.destCode })}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer text-[10px] font-bold"
                        title={isAr ? 'برمجة رحلة الآن' : 'Book Flight'}
                      >
                        <Zap className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleRouteSubscription(route.id)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-colors cursor-pointer ${
                        route.isSubscribed
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {route.isSubscribed ? (isAr ? 'مشترك ✓' : 'Subscribed ✓') : (isAr ? 'اشتراك' : 'Subscribe')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 8: Legal Terms, Trust Pledge & Sign Out */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
              <Scale className="w-4 h-4 text-slate-600" />
              <span>{isAr ? 'الامتثال القانوني وتعهد الأمانات' : 'Legal Compliance & Charter'}</span>
            </div>

            <div className="space-y-2 text-xs">
              {onNavigateToLegal && (
                <button
                  onClick={onNavigateToLegal}
                  className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>{isAr ? 'عرض تعهد الأمانة والممنوعات 📋' : 'Trust Charter & Banned Items 📋'}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 rtl:rotate-180" />
                </button>
              )}

              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="w-full p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 flex items-center justify-center gap-2 cursor-pointer transition-colors mt-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isAr ? 'تسجيل الخروج من الحساب' : 'Sign Out'}</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* === MODAL 1: CAMERA SCANNER GUIDELINE OVERLAY MODAL === */}
      <AnimatePresence>
        {isCameraModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 text-white rounded-3xl border border-slate-800 overflow-hidden shadow-2xl space-y-4"
            >
              {/* Header */}
              <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-teal-400" />
                  <h3 className="font-black text-sm">
                    {cameraScanTarget === 'PASSPORT' 
                      ? (isAr ? 'إطار التقاط جواز السفر الذكي' : 'Smart Passport Scanner Frame')
                      : (isAr ? 'فحص المطابقة الحيوية (Biometric Liveness)' : 'Biometric Liveness Frame')}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsCameraModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Simulated Camera Viewfinder with Guideline Overlay */}
              <div className="px-6 py-4 flex flex-col items-center">
                <div className="relative w-full aspect-4/3 bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-700 flex items-center justify-center">
                  
                  {/* Visual Video Simulation */}
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:16px_16px]" />

                  {/* Optical Guideline Frame */}
                  {cameraScanTarget === 'PASSPORT' ? (
                    <div className="w-[85%] h-[70%] border-2 border-dashed border-teal-400 rounded-xl relative flex flex-col justify-between p-3 bg-teal-500/5">
                      <div className="flex justify-between text-[9px] font-mono text-teal-300">
                        <span>[PASSPORT TOP EDGE]</span>
                        <span>[PHOTO BOX]</span>
                      </div>
                      <div className="border-t border-dashed border-teal-400/60 pt-2 text-center text-[10px] font-mono text-teal-300">
                        &lt;&lt;&lt; ALIGN MRZ CODE LINES HERE &gt;&gt;&gt;
                      </div>
                    </div>
                  ) : (
                    <div className="w-48 h-56 border-2 border-dashed border-indigo-400 rounded-full flex items-center justify-center bg-indigo-500/5">
                      <span className="text-[10px] font-bold text-indigo-300 text-center px-4">
                        {isAr ? 'ضع وجهك داخل الإطار وافتح عينيك' : 'Center your face within frame'}
                      </span>
                    </div>
                  )}

                  {/* Live Scan Line Animation */}
                  <div className="absolute left-0 right-0 h-0.5 bg-teal-400 shadow-[0_0_12px_#2dd4bf] animate-bounce" />
                </div>

                <p className="text-xs text-slate-400 text-center mt-3">
                  {cameraScanTarget === 'PASSPORT'
                    ? (isAr ? 'تأكد من عدم وجود انعكاسات ضوئية على صفحة الجواز' : 'Ensure no glare on the passport photo')
                    : (isAr ? 'انظر مباشرة إلى الكاميرا في إضاءة جيدة' : 'Look straight into the lens in good lighting')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setIsCameraModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  onClick={handleTriggerCapture}
                  disabled={isCapturing}
                  className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer"
                >
                  {isCapturing ? <Clock className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  <span>{isCapturing ? (isAr ? 'جاري الفحص والمعالجة...' : 'Processing...') : (isAr ? 'التقاط الصورة والتحقق' : 'Capture & Verify')}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* === MODAL 2: DIGITAL DELEGATION (QR PASS & TOKEN) === */}
      <AnimatePresence>
        {isDelegationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
            >
              <div className="p-5 bg-teal-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm">
                      {isAr ? 'إصدار تفويض رقمي لتسليم العهدة' : 'Issue Digital Custody Delegation'}
                    </h3>
                    <span className="text-[10px] text-teal-100 font-mono">
                      Emergency Handoff Protocol
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsDelegationModalOpen(false);
                    setActiveDelegationPass(null);
                  }}
                  className="p-1 rounded-lg text-teal-100 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 text-xs">
                {activeDelegationPass ? (
                  /* Active Generated QR Pass */
                  <div className="space-y-4 text-center">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-1">
                      <div className="flex items-center justify-center gap-1.5 font-black text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{isAr ? 'تم إنشاء رمز التفويض الرقمي بنجاح' : 'Delegation Pass Generated'}</span>
                      </div>
                      <p className="text-[11px] text-emerald-700">
                        {isAr 
                          ? 'يقوم المفوَّض بتقديم هذا الرمز لموظف الفرع بالوجهة لتسليم الطرود رسمياً نيابة عنك.' 
                          : 'Delegate presents this QR code to the hub desk officer to surrender parcels officially.'}
                      </p>
                    </div>

                    {/* QR Code Container */}
                    <div className="w-48 h-48 mx-auto p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-md flex flex-col items-center justify-center">
                      <QrCode className="w-36 h-36 text-slate-900" />
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-mono text-xs text-start">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">{isAr ? 'رمز التفويض المشفر:' : 'Token:'}</span>
                        <span className="font-bold text-teal-700">{activeDelegationPass.token}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">{isAr ? 'اسم المفوض:' : 'Delegate:'}</span>
                        <span className="font-bold text-slate-900">{activeDelegationPass.delegateName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">{isAr ? 'رقم هوية المفوض:' : 'ID #:'}</span>
                        <span className="font-bold text-slate-900">{activeDelegationPass.delegateId}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => alert(isAr ? 'تم نسخ رابط ورسالة التفويض لمشاركتها عبر واتساب!' : 'Delegation pass copied!')}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{isAr ? 'مشاركة بطاقة التفويض (WhatsApp / SMS)' : 'Share Delegation Pass'}</span>
                    </button>
                  </div>
                ) : (
                  /* Form to create delegation */
                  <form onSubmit={handleCreateDelegation} className="space-y-3.5">
                    <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-[11px] leading-relaxed">
                      {isAr 
                        ? 'في حال تعرضك لطارئ أو عائق صحي يمنعك من تسليم الطرود شخصياً لمكتب الوجهة، يمكنك تفويض شخص موثوق بتسليمها رسمياً عبر هذا السند.'
                        : 'Authorize a trusted person to deliver parcels to the hub counter on your behalf in emergencies.'}
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{isAr ? 'الاسم الكامل للشخص المفوَّض:' : 'Delegate Full Name:'}</label>
                      <input
                        type="text"
                        value={delegateFullName}
                        onChange={(e) => setDelegateFullName(e.target.value)}
                        placeholder={isAr ? 'مثال: محمد سعيد العبداللات' : 'e.g. Tariq Al-Musafir'}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">{isAr ? 'رقم الهوية / الجواز:' : 'National ID / Passport:'}</label>
                        <input
                          type="text"
                          value={delegateIdNumber}
                          onChange={(e) => setDelegateIdNumber(e.target.value)}
                          placeholder="99210492"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">{isAr ? 'صلة القرابة:' : 'Relationship:'}</label>
                        <input
                          type="text"
                          value={delegateRelationship}
                          onChange={(e) => setDelegateRelationship(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{isAr ? 'رقم هاتف المفوَّض في بلد الوجهة:' : 'Delegate Phone Number:'}</label>
                      <input
                        type="text"
                        value={delegatePhone}
                        onChange={(e) => setDelegatePhone(e.target.value)}
                        placeholder="+213 555 12 34 56"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>{isAr ? 'توليد باركود التفويض الرقمي المشفر' : 'Generate Encrypted Delegation Pass'}</span>
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* === MODAL 3: ADD VISA MODAL === */}
      <AnimatePresence>
        {isAddingVisaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xl"
            >
              <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  <h3 className="font-black text-sm">{isAr ? 'إضافة تأشيرة / إقامة جديدة' : 'Add Visa / Residency'}</h3>
                </div>
                <button onClick={() => setIsAddingVisaModalOpen(false)} className="text-indigo-100 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddVisa} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isAr ? 'الدولة:' : 'Country:'}</label>
                  <input
                    type="text"
                    value={newVisaCountry}
                    onChange={(e) => setNewVisaCountry(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isAr ? 'نوع التأشيرة / الإقامة:' : 'Visa Type:'}</label>
                  <input
                    type="text"
                    value={newVisaType}
                    onChange={(e) => setNewVisaType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isAr ? 'رقم التأشيرة:' : 'Visa Number:'}</label>
                  <input
                    type="text"
                    value={newVisaNumber}
                    onChange={(e) => setNewVisaNumber(e.target.value)}
                    placeholder="SA-VISA-90412"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isAr ? 'تاريخ انتهاء الصلاحية:' : 'Expiry Date:'}</label>
                  <input
                    type="date"
                    value={newVisaExpiry}
                    onChange={(e) => setNewVisaExpiry(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer mt-2"
                >
                  {isAr ? 'حفظ التأشيرة في الخزانة' : 'Save Visa to Vault'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* === MODAL 4: ADD BANK ACCOUNT MODAL === */}
      <AnimatePresence>
        {isAddingBankModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xl"
            >
              <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  <h3 className="font-black text-sm">{isAr ? 'إضافة حساب بنكي / بريدي جديد' : 'Add Bank / Payout Account'}</h3>
                </div>
                <button onClick={() => setIsAddingBankModalOpen(false)} className="text-emerald-100 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddBank} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isAr ? 'نوع الحساب:' : 'Account Type:'}</label>
                  <select
                    value={newBankType}
                    onChange={(e) => setNewBankType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="IBAN">{isAr ? 'تحويل بنكي دولي (IBAN)' : 'International Bank (IBAN)'}</option>
                    <option value="CCP">{isAr ? 'بريد الجزائر (CCP / BaridiMob)' : 'Algérie Poste (CCP)'}</option>
                    <option value="CLIQ">{isAr ? 'كليك الأردن (CLIQ Instant Alias)' : 'CLIQ Jordan'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isAr ? 'اسم البنك / الفرع:' : 'Bank Name:'}</label>
                  <input
                    type="text"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    placeholder={isAr ? 'مثال: بنك الاتحاد / BDL' : 'e.g. Bank of Jordan / BDL'}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isAr ? 'رقم الحساب / الآيبان / المعرف:' : 'Account Number / IBAN / Alias:'}</label>
                  <input
                    type="text"
                    value={newAccountNumber}
                    onChange={(e) => setNewAccountNumber(e.target.value)}
                    placeholder="JO..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isAr ? 'اسم المستفيد المطابق للهوية:' : 'Beneficiary Name:'}</label>
                  <input
                    type="text"
                    value={newBeneficiary}
                    onChange={(e) => setNewBeneficiary(e.target.value)}
                    placeholder={fullName}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer mt-2"
                >
                  {isAr ? 'حفظ الحساب واعتماده' : 'Save Payout Account'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
