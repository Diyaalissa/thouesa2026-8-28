import React, { useState } from 'react';
import { User } from '../../types';
import { 
  Camera, MapPin, User as UserIcon, Phone, Mail, FileText, CheckCircle2, ShieldCheck, 
  MapPinned, QrCode, Award, Upload, CreditCard, Building, Bell, Globe, Lock, 
  Fingerprint, Trash2, HelpCircle, MessageCircle, AlertTriangle, ShieldAlert, FileWarning, ExternalLink, ChevronRight,
  Plus, Edit2, X, AlertCircle, Copy, Check, Eye, DollarSign, RefreshCw, Smartphone, Star, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserProfileProps {
  currentUser: User;
  locale: 'en' | 'ar';
  isAr: boolean;
  onNavigate?: (tab: string) => void;
}

interface AddressItem {
  id: string;
  category: 'PERSONAL' | 'RECEIVER';
  title: string;
  recipientName: string;
  phone: string;
  country: string;
  city: string;
  detailedAddress: string;
  isDefault: boolean;
}

interface BankAccountItem {
  id: string;
  type: 'BANK_IBAN' | 'E_WALLET';
  institutionName: string;
  accountHolder: string;
  identifier: string; // IBAN or Wallet Alias / Phone
  currency: string;
  isDefault: boolean;
}

export function UserProfile({ currentUser, locale, isAr, onNavigate }: UserProfileProps) {
  const hasPendingDispute = true;
  const [showQrCode, setShowQrCode] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  
  // KYC State
  const [kycStatus, setKycStatus] = useState<'NONE' | 'PENDING' | 'VERIFIED'>('VERIFIED');
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycDocType, setKycDocType] = useState<'NATIONAL_ID' | 'PASSPORT'>('NATIONAL_ID');
  const [kycDocNumber, setKycDocNumber] = useState('9948201192');
  const [kycExpiryDate, setKycExpiryDate] = useState('2028-11-20');
  const [kycFrontImage, setKycFrontImage] = useState<string>('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80');

  // Loyalty Tier & Points
  const loyaltyTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' = 'GOLD';
  const loyaltyPoints = 2850;
  const nextTierPoints = 3500;
  const completedShipmentsCount = 24;

  // Address Book State
  const [addressTab, setAddressTab] = useState<'ALL' | 'PERSONAL' | 'RECEIVER'>('ALL');
  const [addresses, setAddresses] = useState<AddressItem[]>([
    {
      id: 'addr-1',
      category: 'PERSONAL',
      title: isAr ? 'المنزل الرئيسي' : 'Main Residence',
      recipientName: currentUser.fullName,
      phone: currentUser.phone || '+962 79 123 4567',
      country: isAr ? 'الأردن' : 'Jordan',
      city: isAr ? 'عمان - عبدون' : 'Amman - Abdoun',
      detailedAddress: isAr ? 'شارع دمشق، عمارة 14، الطابق 2' : 'Damascus St, Bldg 14, 2nd Floor',
      isDefault: true
    },
    {
      id: 'addr-2',
      category: 'PERSONAL',
      title: isAr ? 'مكتب العمل' : 'Work Office',
      recipientName: currentUser.fullName,
      phone: currentUser.phone || '+962 79 123 4567',
      country: isAr ? 'الأردن' : 'Jordan',
      city: isAr ? 'عمان - الشميساني' : 'Amman - Shmeisani',
      detailedAddress: isAr ? 'مجمع الأعمال، برج B4، مكتب 301' : 'Business Park, Tower B4, Office 301',
      isDefault: false
    },
    {
      id: 'addr-3',
      category: 'RECEIVER',
      title: isAr ? 'أحمد بن علي (شقيق)' : 'Ahmed Benali (Brother)',
      recipientName: 'أحمد بن علي',
      phone: '+213 550 998 877',
      country: isAr ? 'الجزائر' : 'Algeria',
      city: isAr ? 'الجزائر العاصمة - دالي براهيم' : 'Algiers - Dely Ibrahim',
      detailedAddress: isAr ? 'حي 500 مسكن، عمارة 12، شقة 4' : '500 Housing District, Bldg 12, Apt 4',
      isDefault: false
    },
    {
      id: 'addr-4',
      category: 'RECEIVER',
      title: isAr ? 'سارة بوعلام (شريك تجاري)' : 'Sara Boualem (Business Partner)',
      recipientName: 'سارة بوعلام',
      phone: '+213 770 112 233',
      country: isAr ? 'الجزائر' : 'Algeria',
      city: isAr ? 'وهران - حي مطلع الفجر' : 'Oran - Matlaa El Fajr',
      detailedAddress: isAr ? 'شارع الاستقلال، مقابل المحطة المركزية' : 'Independence St, Opp. Central Hub',
      isDefault: false
    }
  ]);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddressCategory, setNewAddressCategory] = useState<'PERSONAL' | 'RECEIVER'>('PERSONAL');
  const [newAddressTitle, setNewAddressTitle] = useState('');
  const [newAddressRecipient, setNewAddressRecipient] = useState('');
  const [newAddressPhone, setNewAddressPhone] = useState('');
  const [newAddressCountry, setNewAddressCountry] = useState(isAr ? 'الأردن' : 'Jordan');
  const [newAddressCity, setNewAddressCity] = useState('');
  const [newAddressDetail, setNewAddressDetail] = useState('');
  const [newAddressIsDefault, setNewAddressIsDefault] = useState(false);

  // Bank Accounts State
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([
    {
      id: 'bnk-1',
      type: 'BANK_IBAN',
      institutionName: isAr ? 'البنك العربي (Arab Bank)' : 'Arab Bank',
      accountHolder: currentUser.fullName,
      identifier: 'JO94ARAB0120000001234567890123',
      currency: 'JOD',
      isDefault: true
    },
    {
      id: 'bnk-2',
      type: 'E_WALLET',
      institutionName: 'CliQ (Jordan / JOD)',
      accountHolder: currentUser.fullName,
      identifier: 'DIYA.CLIQ@ARAB',
      currency: 'JOD',
      isDefault: false
    },
    {
      id: 'bnk-3',
      type: 'E_WALLET',
      institutionName: 'BaridiMob (Algeria / DZD)',
      accountHolder: 'Diya Al-Hout',
      identifier: '00799999000123456789',
      currency: 'DZD',
      isDefault: false
    }
  ]);

  const [showBankModal, setShowBankModal] = useState(false);
  const [newBankType, setNewBankType] = useState<'BANK_IBAN' | 'E_WALLET'>('BANK_IBAN');
  const [newBankName, setNewBankName] = useState('');
  const [newBankHolder, setNewBankHolder] = useState(currentUser.fullName);
  const [newBankIdentifier, setNewBankIdentifier] = useState('');
  const [newBankCurrency, setNewBankCurrency] = useState('JOD');

  // Preferences & Notifications
  const [notifOrderUpdates, setNotifOrderUpdates] = useState(true);
  const [notifNewTrips, setNotifNewTrips] = useState(true);
  const [notifWalletAlerts, setNotifWalletAlerts] = useState(true);
  const [notifPromotions, setNotifPromotions] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);

  // Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Legal Modal
  const [legalModalType, setLegalModalType] = useState<'TERMS' | 'PRIVACY' | 'BANNED' | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const handleCopyId = () => {
    navigator.clipboard?.writeText(currentUser.id);
    setCopiedId(true);
    triggerToast(isAr ? 'تم نسخ المعرف التعريفي بنجاح.' : 'Account ID copied to clipboard.');
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleSetDefaultAddress = (id: string) => {
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
    triggerToast(isAr ? 'تم تعيين العنوان كافتراضي للطلبات الجديدة.' : 'Default shipping address updated.');
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses(prev => prev.filter(a => a.id !== id));
    triggerToast(isAr ? 'تم حذف العنوان من الدفتر.' : 'Address removed from book.');
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressTitle || !newAddressRecipient || !newAddressCity) return;

    const newAddr: AddressItem = {
      id: `addr-${Date.now()}`,
      category: newAddressCategory,
      title: newAddressTitle,
      recipientName: newAddressRecipient,
      phone: newAddressPhone || currentUser.phone || '',
      country: newAddressCountry,
      city: newAddressCity,
      detailedAddress: newAddressDetail,
      isDefault: newAddressIsDefault || addresses.length === 0
    };

    if (newAddressIsDefault) {
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: false })).concat(newAddr));
    } else {
      setAddresses(prev => [newAddr, ...prev]);
    }

    setShowAddressModal(false);
    setNewAddressTitle('');
    setNewAddressRecipient('');
    setNewAddressCity('');
    setNewAddressDetail('');
    triggerToast(isAr ? 'تم حفظ العنوان الجديد في دفتر العناوين.' : 'New address saved to address book.');
  };

  const handleSetDefaultBank = (id: string) => {
    setBankAccounts(prev => prev.map(b => ({ ...b, isDefault: b.id === id })));
    triggerToast(isAr ? 'تم تعيين الحساب كافتراضي لسحب الأرصدة.' : 'Default payout account set.');
  };

  const handleDeleteBank = (id: string) => {
    setBankAccounts(prev => prev.filter(b => b.id !== id));
    triggerToast(isAr ? 'تم حذف الحساب البنكي.' : 'Account removed.');
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName || !newBankIdentifier) return;

    const newBnk: BankAccountItem = {
      id: `bnk-${Date.now()}`,
      type: newBankType,
      institutionName: newBankName,
      accountHolder: newBankHolder,
      identifier: newBankIdentifier,
      currency: newBankCurrency,
      isDefault: bankAccounts.length === 0
    };

    setBankAccounts(prev => [...prev, newBnk]);
    setShowBankModal(false);
    setNewBankName('');
    setNewBankIdentifier('');
    triggerToast(isAr ? 'تمت إضافة حساب الاسترداد البنكي بنجاح.' : 'Payout account added successfully.');
  };

  const handleSubmitKyc = (e: React.FormEvent) => {
    e.preventDefault();
    setKycStatus('PENDING');
    setShowKycModal(false);
    triggerToast(isAr 
      ? 'تم رفع بيانات الهوية للجمارك وإرسالها للمراجعة الإدارية.' 
      : 'Customs identity submitted & forwarded to compliance review.');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert(isAr ? 'كلمة المرور الجديدة غير متطابقة!' : 'New passwords do not match!');
      return;
    }
    setPasswordSuccess(true);
    setTimeout(() => {
      setPasswordSuccess(false);
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      triggerToast(isAr ? 'تم تحديث كلمة المرور بنجاح.' : 'Password updated successfully.');
    }, 1200);
  };

  const handleDeleteAccount = () => {
    const confirmText = isAr 
      ? 'تنبيه أمان: هل أنت متأكد من رغبتك في حذف الحساب؟ وفقاً للتشريعات المالية والتخليص الجمركي، سيتم أرشفة السجلات المالية ومطابقات الضمان المحجوز لمدة الامتثال القانوني قبل الإلغاء النهائي.' 
      : 'Security Alert: Are you sure you want to delete your account? Under financial & customs compliance, ledger records and locked escrows will be safely archived for the legal period before termination.';
    
    if (window.confirm(confirmText)) {
      triggerToast(isAr ? 'تم استلام طلب حذف الحساب وإحالته للمطابقة القانونية.' : 'Account deletion requested.');
    }
  };

  const filteredAddresses = addresses.filter(a => {
    if (addressTab === 'PERSONAL') return a.category === 'PERSONAL';
    if (addressTab === 'RECEIVER') return a.category === 'RECEIVER';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white border border-brand-500/40 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md"
          >
            <div className="w-7 h-7 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold">{toastMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {isAr ? 'الملف الشخصي وإدارة الحساب' : 'User Profile & Account Settings'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr ? 'إدارة الهوية الرقمية، العناوين، المحافظ البنكية، والامتثال الجمركي.' : 'Manage digital identity, address book, payout accounts, and customs KYC.'}
          </p>
        </div>
      </div>

      {/* 1. Smart Identity Card & Loyalty Tier */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-sm relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-brand-500/5 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Avatar with Camera Trigger */}
          <div className="relative group shrink-0">
            <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl bg-slate-100 ring-2 ring-brand-500/20">
              <img 
                src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&q=80"} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
              />
            </div>
            <button 
              onClick={() => triggerToast(isAr ? 'يمكنك تحديث الصورة الشخصية.' : 'Upload new avatar photo.')}
              className="absolute -bottom-2 -right-2 p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl shadow-lg transition-transform active:scale-90 cursor-pointer"
              title={isAr ? 'تغيير الصورة' : 'Change Avatar'}
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          
          {/* User Details */}
          <div className="flex-1 text-center md:text-start space-y-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 justify-center md:justify-start">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{currentUser.fullName}</h3>
              
              {/* Loyalty Tier Badge */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-full text-xs font-black self-center md:self-auto shadow-2xs">
                <Award className="w-4 h-4 text-amber-500" />
                <span>{isAr ? 'عضوية ذهبية (Gold Member)' : 'Gold Tier Member'}</span>
                <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.2 rounded-full font-mono font-bold">-10% Fees</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-brand-500" /> {currentUser.email}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-brand-500" /> {currentUser.phone || '+962 79 000 0000'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-500" /> {isAr ? 'عمان، الأردن' : 'Amman, Jordan'}
              </span>
            </div>

            {/* Loyalty Progress & Quick Action Bar */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
              {/* Progress to Next Tier */}
              <div className="w-full sm:w-auto flex-1 max-w-sm">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  <span>{isAr ? 'نقاط الولاء وشحنات الترقية' : 'Loyalty Points & Tier Progress'}</span>
                  <span className="text-amber-600 dark:text-amber-400 font-mono font-black">{loyaltyPoints} / {nextTierPoints} PTS</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all"
                    style={{ width: `${(loyaltyPoints / nextTierPoints) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {isAr 
                    ? `أنجزت ${completedShipmentsCount} شحنة ناجحة. متبقي 650 نقطة للوصول للمستوى الماسي (Platinum 💎).` 
                    : `${completedShipmentsCount} completed shipments. 650 pts to Platinum tier.`}
                </span>
              </div>

              {/* ID Barcode / QR Trigger */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyId}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  title={isAr ? 'نسخ معرف الحساب' : 'Copy ID'}
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="font-mono text-[11px]">{currentUser.id}</span>
                </button>

                <button 
                  onClick={() => setShowQrCode(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                >
                  <QrCode className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <span>{isAr ? 'باركود الدفع الكاش 💳' : 'Office Cash Barcode 💳'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Grid: KYC & Bank Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. KYC & Customs Identity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                {isAr ? 'توثيق الهوية للجمارك (Customs KYC)' : 'Customs Identity (KYC)'}
              </h3>
              {kycStatus === 'VERIFIED' ? (
                <span className="flex items-center gap-1 text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 
                  {isAr ? 'موثق ومعتمد جمركياً' : 'Customs Verified'}
                </span>
              ) : kycStatus === 'PENDING' ? (
                <span className="flex items-center gap-1 text-xs font-black text-amber-700 bg-amber-100 px-3 py-1 rounded-full animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5" /> 
                  {isAr ? 'قيد المراجعة الإدارية' : 'Under Review'}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-black text-red-600 bg-red-100 px-3 py-1 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5" /> 
                  {isAr ? 'غير مكتمل' : 'Unverified'}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isAr 
                ? 'تُرسل وثيقة الهوية مباشرة للوحة تحكم الإدارة وتُربط تلقائياً بالبوليصات والتخليص الجمركي للشحنات الدولية، مما يضمن سرعة الفسح دون الحاجة لطلب الوثيقة عند كل شحنة.' 
                : 'Your ID is securely synchronized with customs clearing systems & admin dashboard, eliminating repeated verification on every international shipment.'}
            </p>

            {kycStatus === 'VERIFIED' && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {kycDocType === 'NATIONAL_ID' ? (isAr ? 'بطاقة الأحوال المدنية / الرقم الوطني' : 'National ID') : (isAr ? 'جواز السفر الدولي' : 'Passport')}
                    </span>
                  </div>
                  <p className="font-mono text-slate-500 text-[11px]">#{kycDocNumber} • {isAr ? 'ينتهي في:' : 'Exp:'} {kycExpiryDate}</p>
                </div>
                <button
                  onClick={() => setShowKycModal(true)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {isAr ? 'تحديث / معاينة' : 'Update / View'}
                </button>
              </div>
            )}
          </div>

          {kycStatus !== 'VERIFIED' && (
            <button 
              onClick={() => setShowKycModal(true)}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Upload className="w-4 h-4" />
              <span>{isAr ? 'رفع وثيقة الهوية الرسمية (KYC)' : 'Upload Official ID / Passport'}</span>
            </button>
          )}
        </div>

        {/* 4. Refund Bank Accounts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-brand-500" />
                {isAr ? 'الحسابات البنكية للاسترداد (Payout)' : 'Refund Bank Accounts'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isAr ? 'حسابات تحويل واسترداد الأرصدة والتعويضات بضغطة زر.' : 'Saved accounts for instant wallet balance withdrawal.'}
              </p>
            </div>
            <button 
              onClick={() => setShowBankModal(true)}
              className="p-2 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl transition-transform active:scale-95 cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة حساب' : 'Add'}</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto">
            {bankAccounts.map(bank => (
              <div 
                key={bank.id} 
                className={`p-3.5 border rounded-2xl flex items-center justify-between transition-colors ${
                  bank.isDefault 
                    ? 'bg-brand-50/40 dark:bg-brand-950/20 border-brand-300 dark:border-brand-800' 
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shadow-2xs shrink-0">
                    <CreditCard className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{bank.institutionName}</h4>
                      {bank.isDefault && (
                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          {isAr ? 'أساسي للسحب' : 'Default'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">{bank.identifier}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {!bank.isDefault && (
                    <button
                      onClick={() => handleSetDefaultBank(bank.id)}
                      className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-brand-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      {isAr ? 'جعله أساسي' : 'Set Default'}
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteBank(bank.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                    title={isAr ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Smart Address Book */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-7 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <MapPinned className="w-5 h-5 text-brand-500" />
              {isAr ? 'دفتر العناوين الذكي (Address Book)' : 'Smart Address Book'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr ? 'إدارة عناوينك الشخصية وعناوين المستلمين لتسريع إنشاء الشحنات بضغطة زر.' : 'Manage personal pickup and recipient delivery addresses.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Category Filter */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setAddressTab('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  addressTab === 'ALL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'
                }`}
              >
                {isAr ? 'الكل' : 'All'} ({addresses.length})
              </button>
              <button
                onClick={() => setAddressTab('PERSONAL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  addressTab === 'PERSONAL' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-2xs' : 'text-slate-500'
                }`}
              >
                {isAr ? 'عناويني الشخصية' : 'Personal'} ({addresses.filter(a => a.category === 'PERSONAL').length})
              </button>
              <button
                onClick={() => setAddressTab('RECEIVER')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  addressTab === 'RECEIVER' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-2xs' : 'text-slate-500'
                }`}
              >
                {isAr ? 'المستلمون' : 'Recipients'} ({addresses.filter(a => a.category === 'RECEIVER').length})
              </button>
            </div>

            <button 
              onClick={() => setShowAddressModal(true)}
              className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة عنوان' : 'Add Address'}</span>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {filteredAddresses.map(addr => (
            <div 
              key={addr.id} 
              className={`p-4 border rounded-2xl relative group transition-all ${
                addr.isDefault 
                  ? 'bg-brand-50/30 dark:bg-brand-950/20 border-brand-300 dark:border-brand-800/80 shadow-2xs' 
                  : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {addr.isDefault && (
                <div className="absolute top-3 end-3">
                  <span className="bg-brand-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                    <Check className="w-3 h-3" /> {isAr ? 'العنوان الافتراضي' : 'Default'}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                    addr.category === 'PERSONAL' 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  }`}>
                    {addr.category === 'PERSONAL' ? (isAr ? 'شخصي' : 'Personal') : (isAr ? 'مستلم' : 'Recipient')}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{addr.title}</h4>
                </div>

                <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                  <p className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{addr.recipientName} ({addr.phone})</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-brand-500" />
                    <span>{addr.country} • {addr.city}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    {addr.detailedAddress}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  {!addr.isDefault ? (
                    <button
                      onClick={() => handleSetDefaultAddress(addr.id)}
                      className="text-[11px] font-bold text-brand-600 hover:text-brand-700 transition-colors cursor-pointer"
                    >
                      {isAr ? 'تعيين كافتراضي للطلبات' : 'Set as Default'}
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      {isAr ? 'يتم اختياره تلقائياً عند الإنشاء' : 'Auto-selected in order wizard'}
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                      title={isAr ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column Grid: Preferences & Security */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 5. Preferences & Notifications */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-500" />
            {isAr ? 'التفضيلات ومركز الإشعارات' : 'Preferences & Notifications'}
          </h3>
          
          <div className="space-y-3.5">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{isAr ? 'تحديثات حالة الطلب والشحنات' : 'Order & Tracking Updates'}</p>
                <p className="text-[11px] text-slate-500">{isAr ? 'إشعار فوري عند تغير محطة الطرد' : 'Instant status push on parcel steps'}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={notifOrderUpdates} 
                  onChange={(e) => setNotifOrderUpdates(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-brand-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{isAr ? 'رحلات المسافرين الجديدة' : 'New Traveler Flights'}</p>
                <p className="text-[11px] text-slate-500">{isAr ? 'تنبيه عند فتح مسار رحلة بين الأردن والجزائر' : 'Alert on new routes matching your cities'}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={notifNewTrips} 
                  onChange={(e) => setNotifNewTrips(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-brand-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{isAr ? 'حركات المحفظة والتعويضات' : 'Wallet & Payout Alerts'}</p>
                <p className="text-[11px] text-slate-500">{isAr ? 'تنبيه فوري عند إضافة تعويض أو إيداع' : 'Alert on escrow refund or balance load'}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={notifWalletAlerts} 
                  onChange={(e) => setNotifWalletAlerts(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-brand-600"></div>
              </label>
            </div>
            
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {isAr ? 'العملة الرئيسية' : 'Primary Currency'}
                </label>
                <select 
                  value={selectedCurrency}
                  onChange={(e) => {
                    setSelectedCurrency(e.target.value);
                    triggerToast(isAr ? `تم تحويل العملة المفضلة إلى ${e.target.value}` : `Currency set to ${e.target.value}`);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                >
                  <option value="USD">USD ($) — الدولار الأمريكي</option>
                  <option value="JOD">JOD (د.أ) — الدينار الأردني</option>
                  <option value="DZD">DZD (د.ج) — الدينار الجزائري</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {isAr ? 'لغة الواجهة' : 'App Language'}
                </label>
                <select 
                  defaultValue={locale === 'ar' ? 'العربية' : 'English'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                >
                  <option>العربية (Arabic RTL)</option>
                  <option>English (LTR)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Security & Privacy */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5 text-brand-500" />
              {isAr ? 'الأمان والخصوصية والحماية' : 'Security & Privacy'}
            </h3>
            
            <div className="space-y-3">
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-between p-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-brand-50 transition-colors">
                    <Lock className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-brand-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{isAr ? 'تغيير كلمة المرور' : 'Change Password'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 rtl:rotate-180" />
              </button>
              
              <div className="flex items-center justify-between p-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Fingerprint className="w-4 h-4 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{isAr ? 'تسجيل الدخول الحيوي وتأكيد الدفع' : 'Biometrics & Payment Auth'}</p>
                    <p className="text-[10px] text-slate-500">{isAr ? 'Face ID / بصمة الإصبع' : 'Face ID / Fingerprint protection'}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={biometricsEnabled} 
                    onChange={(e) => {
                      setBiometricsEnabled(e.target.checked);
                      triggerToast(isAr ? 'تم تحديث إعدادات المصادقة الحيوية.' : 'Biometrics setting updated.');
                    }} 
                    className="sr-only peer" 
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-brand-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={handleDeleteAccount} 
              className="w-full flex items-center justify-between p-3 border border-red-200 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/20 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                  <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-start">
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 block">{isAr ? 'حذف الحساب نهائياً' : 'Delete Account'}</span>
                  <span className="text-[10px] text-red-500/70 block">{isAr ? 'يخضع لسياسة حفظ السجلات المالية' : 'Subject to financial retention policies'}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {/* 7. Support & Legal Mandatory Links */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2 mb-2">
          <HelpCircle className="w-5 h-5 text-brand-500" />
          {isAr ? 'الدعم الفني المباشر والروابط القانونية' : 'Direct Support & Legal Policies'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* WhatsApp Direct Link with Auto-Injected ID */}
          <a 
            href={`https://wa.me/962790000000?text=${encodeURIComponent(
              isAr 
                ? `مرحباً فريق دعم منصة THOUESA، رقم معرف حسابي هو: ${currentUser.id}، الاسم: ${currentUser.fullName}. أحتاج لمساعدة في:` 
                : `Hello THOUESA Support, my Account ID is: ${currentUser.id}, Name: ${currentUser.fullName}. I need help with:`
            )}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl hover:bg-emerald-100/80 transition-all group shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="block font-black text-xs text-emerald-900 dark:text-emerald-200">
                  {isAr ? 'محادثة فورية عبر واتساب (WhatsApp)' : 'Direct WhatsApp Support'}
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                  {isAr ? 'مجهز بمعرف حسابك لخدمة فورية بدون انتظار' : 'Auto-injected Account ID for instant priority'}
                </span>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-emerald-600" />
          </a>

          {/* Legal Policies Modal Triggers */}
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => setLegalModalType('TERMS')}
              className="flex flex-col items-center justify-center gap-1.5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-slate-700 dark:text-slate-300 hover:text-brand-600 hover:bg-brand-50 transition-colors border border-slate-200/80 dark:border-slate-700/80 cursor-pointer"
            >
              <FileText className="w-5 h-5 text-brand-500" />
              <span className="text-[10px] font-bold text-center">{isAr ? 'الشروط والأحكام' : 'Terms of Use'}</span>
            </button>

            <button 
              onClick={() => setLegalModalType('PRIVACY')}
              className="flex flex-col items-center justify-center gap-1.5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-slate-700 dark:text-slate-300 hover:text-brand-600 hover:bg-brand-50 transition-colors border border-slate-200/80 dark:border-slate-700/80 cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span className="text-[10px] font-bold text-center">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</span>
            </button>

            <button 
              onClick={() => setLegalModalType('BANNED')}
              className="flex flex-col items-center justify-center gap-1.5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-slate-700 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors border border-slate-200/80 dark:border-slate-700/80 cursor-pointer"
            >
              <FileWarning className="w-5 h-5 text-red-500" />
              <span className="text-[10px] font-bold text-center">{isAr ? 'الممنوعات الجمركية' : 'Banned Items'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. QR Code / Barcode Modal */}
      <AnimatePresence>
        {showQrCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs"
              onClick={() => setShowQrCode(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 text-center z-10"
            >
              <button
                onClick={() => setShowQrCode(false)}
                className="absolute top-4 right-4 rtl:left-4 rtl:right-auto p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center mx-auto mb-3">
                <QrCode className="w-6 h-6" />
              </div>

              <h3 className="font-black text-lg text-slate-900 dark:text-white mb-1">
                {isAr ? 'باركود الدفع النقدي في المكتب' : 'Office Cash Deposit Barcode'}
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                {isAr ? 'أظهر هذا الرمز لمسؤول الاستقبال في محطة عمان أو الجزائر لتعبئة رصيد المحفظة نقداً.' : 'Present this code to the station agent for instant cash deposit.'}
              </p>
              
              {/* High Contrast QR Container */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 inline-block mb-4 shadow-md">
                <QrCode className="w-48 h-48 text-slate-950" />
              </div>
              
              <div className="bg-slate-100 dark:bg-slate-800 py-2.5 px-4 rounded-2xl flex items-center justify-between">
                <div className="text-start">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">{isAr ? 'رقم الحساب' : 'Account ID'}</span>
                  <span className="font-mono font-black text-sm text-slate-900 dark:text-white">{currentUser.id}</span>
                </div>
                <button
                  onClick={handleCopyId}
                  className="px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold shadow-2xs hover:bg-slate-50 cursor-pointer"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : (isAr ? 'نسخ' : 'Copy')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. KYC Modal */}
      <AnimatePresence>
        {showKycModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs"
              onClick={() => setShowKycModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/60 dark:bg-emerald-950/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">
                      {isAr ? 'توثيق الهوية الرسمية للجمارك' : 'Customs Official KYC Verification'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isAr ? 'بيانات مؤمنة وتُحفظ للتخليص الجمركي القانوني' : 'Securely stored for international customs clearance'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowKycModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full bg-white dark:bg-slate-800">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitKyc} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'نوع الوثيقة الرسمية:' : 'Document Type:'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setKycDocType('NATIONAL_ID')}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                        kycDocType === 'NATIONAL_ID' 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/40' 
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{isAr ? 'بطاقة الهوية الوطنية' : 'National ID Card'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setKycDocType('PASSPORT')}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                        kycDocType === 'PASSPORT' 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-950/40' 
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>{isAr ? 'جواز السفر الدولي' : 'Passport'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'الرقم الوطني / رقم الوثيقة:' : 'Document / ID Number:'}
                    </label>
                    <input
                      type="text"
                      value={kycDocNumber}
                      onChange={(e) => setKycDocNumber(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'تاريخ الانتهاء:' : 'Expiry Date:'}
                    </label>
                    <input
                      type="date"
                      value={kycExpiryDate}
                      onChange={(e) => setKycExpiryDate(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                {/* Upload Preview Area */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'صورة الوثيقة المعتمدة (الوجه الأمامي):' : 'Official Document Image (Front):'}
                  </label>
                  <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center relative overflow-hidden">
                    <img 
                      src={kycFrontImage} 
                      alt="ID Preview" 
                      className="max-h-32 mx-auto rounded-xl object-cover shadow-sm mb-2" 
                    />
                    <p className="text-[11px] text-slate-500 font-bold">{isAr ? 'تم فحص الوثيقة ومطابقتها تقنياً.' : 'Document verified & resolution approved.'}</p>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowKycModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer transition-transform active:scale-95"
                  >
                    {isAr ? 'حفظ وإرسال للاعتماد' : 'Submit for Approval'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Add Address Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs"
              onClick={() => setShowAddressModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-brand-50/60 dark:bg-brand-950/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-600 flex items-center justify-center">
                    <MapPinned className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">
                      {isAr ? 'إضافة عنوان جديد للدفتر' : 'Add New Address'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isAr ? 'عناوين التسليم والاستلام السريعة' : 'Manage quick dispatch & recipient points'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowAddressModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full bg-white dark:bg-slate-800">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'تصنيف العنوان:' : 'Address Category:'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewAddressCategory('PERSONAL')}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                        newAddressCategory === 'PERSONAL' 
                          ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-950/40' 
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>{isAr ? 'عنوان شخصي (المنزل / العمل)' : 'My Personal Address'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewAddressCategory('RECEIVER')}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                        newAddressCategory === 'RECEIVER' 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40' 
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      <span>{isAr ? 'عنوان مستلم (صديق / زبون)' : 'Recipient Delivery Address'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'تسمية العنوان (مثل: منزل عمان):' : 'Address Label:'}
                    </label>
                    <input
                      type="text"
                      value={newAddressTitle}
                      onChange={(e) => setNewAddressTitle(e.target.value)}
                      placeholder={isAr ? 'مثال: البيت، شقة الجزائر' : 'e.g. Home, Algiers Apt'}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'اسم المستلم / الشخص المسؤول:' : 'Recipient Name:'}
                    </label>
                    <input
                      type="text"
                      value={newAddressRecipient}
                      onChange={(e) => setNewAddressRecipient(e.target.value)}
                      placeholder={isAr ? 'الاسم الكامل' : 'Full Name'}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'الدولة:' : 'Country:'}
                    </label>
                    <select
                      value={newAddressCountry}
                      onChange={(e) => setNewAddressCountry(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                    >
                      <option value={isAr ? 'الأردن' : 'Jordan'}>{isAr ? 'الأردن (Jordan 🇯🇴)' : 'Jordan 🇯🇴'}</option>
                      <option value={isAr ? 'الجزائر' : 'Algeria'}>{isAr ? 'الجزائر (Algeria 🇩🇿)' : 'Algeria 🇩🇿'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'المدينة / الحي:' : 'City / District:'}
                    </label>
                    <input
                      type="text"
                      value={newAddressCity}
                      onChange={(e) => setNewAddressCity(e.target.value)}
                      placeholder={isAr ? 'مثال: عمان - الصويفية، وهران' : 'e.g. Amman, Oran'}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'العنوان التفصيلي (الشارع، البناية، الطابق):' : 'Detailed Street Address:'}
                  </label>
                  <textarea
                    rows={2}
                    value={newAddressDetail}
                    onChange={(e) => setNewAddressDetail(e.target.value)}
                    placeholder={isAr ? 'اسم الشارع، رقم البناية، رقم الشقة، علامة مميزة...' : 'Street name, bldg number, apt, landmark...'}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefaultAddr"
                    checked={newAddressIsDefault}
                    onChange={(e) => setNewAddressIsDefault(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="isDefaultAddr" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    {isAr ? 'تعيين هذا العنوان كافتراضي للطلبات الجديدة' : 'Set as default address for future orders'}
                  </label>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 cursor-pointer transition-transform active:scale-95"
                  >
                    {isAr ? 'حفظ العنوان' : 'Save Address'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Add Bank / Payout Account Modal */}
      <AnimatePresence>
        {showBankModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs"
              onClick={() => setShowBankModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-brand-50/60 dark:bg-brand-950/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-600 flex items-center justify-center">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">
                      {isAr ? 'إضافة حساب بنكي للاسترداد المالي' : 'Add Payout Bank / Wallet'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isAr ? 'سحب رصيدك المتاح من المحفظة لحسابك الحقيقي' : 'Withdraw funds directly from your wallet'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowBankModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full bg-white dark:bg-slate-800">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveBank} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'نوع الحساب / وسيلة الاسترداد:' : 'Account Type:'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewBankType('BANK_IBAN')}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                        newBankType === 'BANK_IBAN' 
                          ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-950/40' 
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{isAr ? 'حساب بنكي محلي (IBAN)' : 'Bank Account (IBAN)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewBankType('E_WALLET')}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                        newBankType === 'E_WALLET' 
                          ? 'bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-950/40' 
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>{isAr ? 'محفظة إلكترونية (CliQ / BaridiMob)' : 'E-Wallet (CliQ/BaridiMob)'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'اسم البنك أو المحفظة الإلكترونية:' : 'Bank / Wallet Name:'}
                  </label>
                  <input
                    type="text"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    placeholder={isAr ? 'مثال: البنك العربي، بنك الجزيرة، CliQ' : 'e.g. Arab Bank, BaridiMob, CliQ'}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'اسم المستفيد (كما في البنك):' : 'Account Holder Name:'}
                    </label>
                    <input
                      type="text"
                      value={newBankHolder}
                      onChange={(e) => setNewBankHolder(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'العملة:' : 'Currency:'}
                    </label>
                    <select
                      value={newBankCurrency}
                      onChange={(e) => setNewBankCurrency(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                    >
                      <option value="JOD">JOD (الأردن)</option>
                      <option value="DZD">DZD (الجزائر)</option>
                      <option value="USD">USD (دولار أمريكي)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {newBankType === 'BANK_IBAN' ? (isAr ? 'رقم الآيبان الدولي (IBAN):' : 'IBAN Number:') : (isAr ? 'معرف المحفظة / رقم الهاتف:' : 'Wallet Alias / Number:')}
                  </label>
                  <input
                    type="text"
                    value={newBankIdentifier}
                    onChange={(e) => setNewBankIdentifier(e.target.value)}
                    placeholder={newBankType === 'BANK_IBAN' ? 'JO94ARAB...' : 'alias@cliq or 055...'}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold outline-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowBankModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 cursor-pointer transition-transform active:scale-95"
                  >
                    {isAr ? 'حفظ الحساب' : 'Save Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs"
              onClick={() => setShowPasswordModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-brand-600" />
                  {isAr ? 'تغيير كلمة المرور' : 'Change Password'}
                </h3>
                <button onClick={() => setShowPasswordModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {passwordSuccess ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{isAr ? 'تم تحديث كلمة المرور بنجاح!' : 'Password updated successfully!'}</p>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'كلمة المرور الحالية:' : 'Current Password:'}
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'كلمة المرور الجديدة:' : 'New Password:'}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isAr ? 'تأكيد كلمة المرور الجديدة:' : 'Confirm New Password:'}
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                    />
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-500"
                    >
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      {isAr ? 'تحديث كلمة المرور' : 'Update Password'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Legal Policy Modal */}
      <AnimatePresence>
        {legalModalType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs"
              onClick={() => setLegalModalType(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  {legalModalType === 'TERMS' && <FileText className="w-5 h-5 text-brand-600" />}
                  {legalModalType === 'PRIVACY' && <ShieldCheck className="w-5 h-5 text-emerald-600" />}
                  {legalModalType === 'BANNED' && <FileWarning className="w-5 h-5 text-red-600" />}
                  <span>
                    {legalModalType === 'TERMS' && (isAr ? 'الشروط والأحكام وعقد الوساطة اللوجستية' : 'Terms & Conditions')}
                    {legalModalType === 'PRIVACY' && (isAr ? 'سياسة الخصوصية وحماية البيانات المالية' : 'Privacy Policy')}
                    {legalModalType === 'BANNED' && (isAr ? 'قائمة المواد الممنوعة والشروط الجمركية' : 'Banned Items & Customs Restrictions')}
                  </span>
                </h3>
                <button onClick={() => setLegalModalType(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {legalModalType === 'TERMS' && (
                  <>
                    <p className="font-bold text-slate-900 dark:text-white">1. طبيعة الخدمة والوساطة:</p>
                    <p>تعمل منصة THOUESA كوسيط تقني ولوجستي ينظم مطابقة الشحنات بين المرسلين والمسافرين المعتمدين والمحطات الجمركية الرسمية في الأردن والجزائر.</p>
                    <p className="font-bold text-slate-900 dark:text-white">2. نظام الضمان المالي (Escrow):</p>
                    <p>تُحفظ كافة مبالغ الشحن والشراء في محفظة الضمان المؤمنة ولا تُصرف للمسافر إلا بعد تسليم الطرد وتأكيد العميل أو انقضاء مهلة التحكيم.</p>
                  </>
                )}

                {legalModalType === 'PRIVACY' && (
                  <>
                    <p className="font-bold text-slate-900 dark:text-white">1. جمع البيانات وتوثيق KYC:</p>
                    <p>يتم تخزين بيانات الهوية الوطنية وجوازات السفر في قنوات مشفرة وفق معايير التشفير البنكي ولا تُشارك إلا مع السلطات الجمركية الرسمية للتخليص.</p>
                    <p className="font-bold text-slate-900 dark:text-white">2. أمان المعاملات المالية:</p>
                    <p>تخضع جميع حركات السحب والإيداع لبروتوكولات مكافحة غسيل الأموال والامتثال للمصارف المركزية.</p>
                  </>
                )}

                {legalModalType === 'BANNED' && (
                  <div className="space-y-3">
                    <p className="font-bold text-red-600 dark:text-red-400">يُحظر تماماً نقل أو إرسال أي من المواد التالية تحت طائلة المساءلة القانونية والمصادرة الجمركية:</p>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-700 dark:text-slate-300">
                      <li>المواد القابلة للاشتعال، المتفجرات، والغازات المضغوطة.</li>
                      <li>الأسلحة والذخائر أو أي أجهزة شبيهة.</li>
                      <li>الأدوية الخاضعة للرقابة أو الوصفات الطبية غير المرخصة جمركياً.</li>
                      <li>المبالغ النقدية الكبيرة، المعادن الثمينة غير المصرح بها، والسبائك.</li>
                      <li>البطاريات المستقلة غير المطابقة لمعايير IATA للطيران المدني.</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-end">
                <button
                  onClick={() => setLegalModalType(null)}
                  className="px-5 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'فهمت وموافق' : 'I Understand'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
