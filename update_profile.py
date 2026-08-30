import re

content = """import React, { useState } from 'react';
import { User } from '../../types';
import { 
  Camera, MapPin, User as UserIcon, Phone, Mail, FileText, CheckCircle2, ShieldCheck, 
  MapPinned, QrCode, Award, Upload, CreditCard, Building, Bell, Globe, Lock, 
  Fingerprint, Trash2, MessageCircle, AlertTriangle, ShieldAlert, FileWarning, ExternalLink,
  Plus, Edit2, X, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserProfileProps {
  currentUser: User;
  locale: 'en' | 'ar';
  isAr: boolean;
}

export function UserProfile({ currentUser, locale, isAr }: UserProfileProps) {
  const [showQrCode, setShowQrCode] = useState(false);
  const [kycStatus, setKycStatus] = useState<'PENDING' | 'VERIFIED' | 'NONE'>('NONE');
  
  const loyaltyTier = 'GOLD'; // PENDING, BRONZE, SILVER, GOLD
  
  const [addresses, setAddresses] = useState([
    { id: 1, type: 'PERSONAL', title: isAr ? 'المنزل' : 'Home', address: 'Amman, Jordan', isDefault: true },
    { id: 2, type: 'RECEIVER', title: isAr ? 'أحمد (مستلم)' : 'Ahmed (Receiver)', address: 'Algiers, Algeria', isDefault: false }
  ]);

  const [bankAccounts, setBankAccounts] = useState([
    { id: 1, type: 'IBAN', bank: 'Arab Bank', number: 'JO12345678901234567890', isDefault: true }
  ]);

  const handleUploadKyc = () => {
    alert(isAr ? 'تم رفع الهوية بنجاح وإرسالها للمراجعة.' : 'ID uploaded successfully and sent for review.');
    setKycStatus('PENDING');
  };

  const handleDeleteAccount = () => {
    const confirmText = isAr ? 'هل أنت متأكد من رغبتك في حذف الحساب؟ سيتم الاحتفاظ بالبيانات المالية للقانون.' : 'Are you sure you want to delete your account? Financial data will be retained for legal purposes.';
    if (confirm(confirmText)) {
      alert(isAr ? 'تم إرسال طلب الحذف.' : 'Deletion request sent.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          {isAr ? 'الملف الشخصي' : 'Profile'}
        </h2>
      </div>

      {/* 1. Identity & Loyalty */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="relative group shrink-0">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl bg-slate-100">
            <img src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&q=80"} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <button className="absolute bottom-0 right-0 p-2 bg-brand-500 hover:bg-brand-600 text-white rounded-full shadow-lg transition-colors">
            <Camera className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 text-center md:text-start">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{currentUser.fullName}</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center justify-center md:justify-start gap-2">
            <Mail className="w-4 h-4" /> {currentUser.email}
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center justify-center md:justify-start gap-2">
            <Phone className="w-4 h-4" /> {currentUser.phone}
          </p>
          
          <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-sm font-bold border border-amber-200 dark:border-amber-800">
              <Award className="w-4 h-4" />
              {isAr ? 'عميل ذهبي' : 'Gold Member'}
            </div>
            
            <button 
              onClick={() => setShowQrCode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-sm font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              {isAr ? 'إظهار الباركود' : 'Show QR ID'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. KYC & Customs Identity */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-500" />
              {isAr ? 'توثيق الهوية (للجمارك)' : 'Customs Identity (KYC)'}
            </h3>
            {kycStatus === 'VERIFIED' ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                <CheckCircle2 className="w-3 h-3" /> {isAr ? 'موثق' : 'Verified'}
              </span>
            ) : kycStatus === 'PENDING' ? (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                <AlertCircle className="w-3 h-3" /> {isAr ? 'قيد المراجعة' : 'Pending'}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isAr ? 'ارفع صورة الهوية أو جواز السفر لتسريع إجراءات التخليص الجمركي. يتم مشاركة هذه البيانات بأمان مع الإدارة فقط.' : 'Upload your National ID or Passport to speed up customs clearance. This data is securely shared only with the administration.'}
          </p>
          
          {kycStatus === 'NONE' && (
            <button 
              onClick={handleUploadKyc}
              className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-brand-600 transition-colors bg-slate-50 dark:bg-slate-800/50"
            >
              <Upload className="w-5 h-5" />
              <span className="font-bold text-sm">{isAr ? 'إرفاق صورة الهوية' : 'Upload ID Image'}</span>
            </button>
          )}
        </div>

        {/* 4. Refund Bank Accounts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-brand-500" />
              {isAr ? 'حسابات الاسترداد' : 'Refund Accounts'}
            </h3>
            <button className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-brand-600 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            {isAr ? 'أضف حسابك البنكي أو محفظتك الإلكترونية لاسترداد الأرصدة المتاحة بسهولة.' : 'Add your bank account or e-wallet to easily withdraw available funds.'}
          </p>
          
          <div className="space-y-3">
            {bankAccounts.map(bank => (
              <div key={bank.id} className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shadow-sm">
                    <CreditCard className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">{bank.bank}</h4>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">{bank.number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {bank.isDefault && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{isAr ? 'أساسي' : 'Default'}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Smart Address Book */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <MapPinned className="w-5 h-5 text-brand-500" />
            {isAr ? 'دفتر العناوين الذكي' : 'Smart Address Book'}
          </h3>
          <button className="flex items-center gap-1.5 text-xs font-bold bg-brand-50 hover:bg-brand-100 text-brand-600 px-3 py-1.5 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> {isAr ? 'إضافة عنوان' : 'Add Address'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map(addr => (
            <div key={addr.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl relative group">
              {addr.isDefault && (
                <div className="absolute top-0 right-0 -mt-2.5 rtl:-mr-2.5 rtl:right-auto rtl:left-0 rtl:-ml-2.5 ltr:-mr-2.5">
                  <span className="bg-brand-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-sm">
                    {isAr ? 'الافتراضي' : 'Default'}
                  </span>
                </div>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {addr.type === 'PERSONAL' ? <UserIcon className="w-4 h-4 text-slate-400" /> : <MapPin className="w-4 h-4 text-slate-400" />}
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">{addr.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{addr.address}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-slate-400 hover:text-brand-500"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 5. Preferences & Notifications */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-brand-500" />
            {isAr ? 'التفضيلات والإشعارات' : 'Preferences & Notifications'}
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{isAr ? 'تحديثات الطلبات' : 'Order Updates'}</p>
                <p className="text-xs text-slate-500">{isAr ? 'تنبيه عند تغير حالة الشحنة' : 'Alert on shipment status change'}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-500"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{isAr ? 'إشعارات المحفظة' : 'Wallet Notifications'}</p>
                <p className="text-xs text-slate-500">{isAr ? 'تنبيه عند الخصم أو الإيداع' : 'Alert on deduction or deposit'}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-500"></div>
              </label>
            </div>
            
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{isAr ? 'لغة التطبيق' : 'App Language'}</span>
                </div>
                <select className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-sm outline-none">
                  <option>العربية</option>
                  <option>English</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Security & Privacy */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-brand-500" />
            {isAr ? 'الأمان والخصوصية' : 'Security & Privacy'}
          </h3>
          
          <div className="space-y-4">
            <button className="w-full flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                  <Lock className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-white">{isAr ? 'تغيير كلمة المرور' : 'Change Password'}</span>
              </div>
              <Edit2 className="w-4 h-4 text-slate-400" />
            </button>
            
            <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Fingerprint className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{isAr ? 'تسجيل الدخول الحيوي' : 'Biometric Login'}</p>
                  <p className="text-[10px] text-slate-500">{isAr ? 'Face ID / البصمة' : 'Face ID / Touch ID'}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-500"></div>
              </label>
            </div>

            <button onClick={handleDeleteAccount} className="w-full flex items-center justify-between p-3 border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-start">
                  <span className="text-sm font-bold text-red-600 dark:text-red-400 block">{isAr ? 'حذف الحساب' : 'Delete Account'}</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 7. Support & Legal */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-brand-500" />
          {isAr ? 'الدعم الفني والروابط الإلزامية' : 'Support & Legal'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a 
            href={`https://wa.me/1234567890?text=Hello, my ID is ${currentUser.id}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            <MessageCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <div>
              <span className="block font-bold text-emerald-800 dark:text-emerald-300">{isAr ? 'تواصل معنا عبر واتساب' : 'Contact via WhatsApp'}</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5 block">{isAr ? 'دعم فني مباشر' : 'Live Support'}</span>
            </div>
          </a>

          <div className="grid grid-cols-2 gap-2">
            <button className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-brand-50 transition-colors">
              <FileText className="w-5 h-5" />
              <span className="text-[10px] font-bold">{isAr ? 'الشروط والأحكام' : 'Terms'}</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-brand-50 transition-colors">
              <ShieldAlert className="w-5 h-5" />
              <span className="text-[10px] font-bold">{isAr ? 'سياسة الخصوصية' : 'Privacy'}</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:text-brand-600 hover:bg-brand-50 transition-colors col-span-2">
              <FileWarning className="w-5 h-5" />
              <span className="text-xs font-bold">{isAr ? 'قائمة الممنوعات والشروط الجمركية' : 'Banned Items & Customs'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQrCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setShowQrCode(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 text-center"
            >
              <button
                onClick={() => setShowQrCode(false)}
                className="absolute top-4 right-4 rtl:left-4 rtl:right-auto p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <h3 className="font-black text-xl text-slate-900 dark:text-white mb-2">{isAr ? 'الرقم التعريفي الخاص بك' : 'Your User ID'}</h3>
              <p className="text-sm text-slate-500 mb-6">{isAr ? 'يرجى إبراز هذا الرمز لموظف المكتب عند الدفع النقدي.' : 'Please present this code to the office agent for cash payment.'}</p>
              
              <div className="bg-white p-4 rounded-2xl border border-slate-200 inline-block mb-4 shadow-sm">
                <QrCode className="w-48 h-48 text-slate-900" />
              </div>
              
              <div className="bg-slate-100 dark:bg-slate-800 py-2 px-4 rounded-xl inline-flex items-center gap-2">
                <span className="text-xs text-slate-500 uppercase">{isAr ? 'رقم الحساب:' : 'Account ID:'}</span>
                <span className="font-mono font-black text-slate-900 dark:text-white">{currentUser.id}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
"""

with open('src/components/profile/UserProfile.tsx', 'w') as f:
    f.write(content)

print("Updated UserProfile.tsx")
