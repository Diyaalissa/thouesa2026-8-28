import React, { useState } from 'react';
import { User } from '../../types';
import { Camera, MapPin, User as UserIcon, Phone, Mail, FileText, CheckCircle2, ShieldCheck, MapPinned } from 'lucide-react';

interface UserProfileProps {
  currentUser: User;
  locale: 'en' | 'ar';
  isAr: boolean;
}

export function UserProfile({ currentUser, locale, isAr }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: currentUser.fullName || '',
    phone: currentUser.phone || '',
    email: currentUser.email || '',
    address: currentUser.address || '',
    receiverAddress: '', // Default receiver address for Sender portal context
    nationalId: currentUser.nationalId || '',
  });

  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&q=80');
  const [idFrontUrl, setIdFrontUrl] = useState(currentUser.idDocumentFrontUrl || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate save
    setIsEditing(false);
    alert(isAr ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          {isAr ? 'الملف الشخصي' : 'Profile'}
        </h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-sm transition-colors"
          >
            {isAr ? 'تعديل البيانات' : 'Edit Profile'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatars and ID */}
        <div className="space-y-6">
          {/* Profile Photo */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="relative group mb-4">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-brand-100 dark:border-brand-800/50">
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              {isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6" />
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setAvatarUrl(URL.createObjectURL(e.target.files[0]));
                    }
                  }} />
                </label>
              )}
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{formData.fullName}</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{currentUser.role.replace('_', ' ')}</p>
            
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>{isAr ? 'حساب موثق' : 'Verified Account'}</span>
            </div>
          </div>

          {/* ID Document */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-500" />
              {isAr ? 'صورة الهوية الوطنية' : 'National ID Photo'}
            </h4>
            
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800/50 relative group aspect-[1.6]">
              {idFrontUrl ? (
                <img src={idFrontUrl} alt="ID Front" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                  <FileText className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-xs font-medium px-4 text-center">
                    {isAr ? 'لم يتم إرفاق صورة الهوية' : 'No ID photo attached'}
                  </span>
                </div>
              )}
              
              {isEditing && (
                <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-8 h-8 mb-2" />
                  <span className="text-sm font-bold">{isAr ? 'تحميل صورة الهوية' : 'Upload ID Photo'}</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setIdFrontUrl(URL.createObjectURL(e.target.files[0]));
                    }
                  }} />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-8">
            
            {/* Personal Info */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <UserIcon className="w-5 h-5 text-brand-500" />
                {isAr ? 'المعلومات الشخصية' : 'Personal Information'}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">{isAr ? 'الاسم الكامل' : 'Full Name'}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 start-0 pl-3 rtl:pr-3 rtl:pl-0 flex items-center pointer-events-none">
                      <UserIcon className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      name="fullName"
                      disabled={true}
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full pl-10 rtl:pr-10 rtl:pl-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 disabled:opacity-70"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">{isAr ? 'رقم الهوية / الجواز' : 'ID / Passport Number'}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 start-0 pl-3 rtl:pr-3 rtl:pl-0 flex items-center pointer-events-none">
                      <FileText className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      name="nationalId"
                      disabled={!isEditing}
                      value={formData.nationalId}
                      onChange={handleChange}
                      className="w-full pl-10 rtl:pr-10 rtl:pl-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 disabled:opacity-70"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">{isAr ? 'رقم الهاتف' : 'Phone Number'}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 start-0 pl-3 rtl:pr-3 rtl:pl-0 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      disabled={!isEditing}
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 rtl:pr-10 rtl:pl-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 disabled:opacity-70"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 start-0 pl-3 rtl:pr-3 rtl:pl-0 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      disabled={!isEditing}
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 rtl:pr-10 rtl:pl-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 disabled:opacity-70"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <MapPin className="w-5 h-5 text-brand-500" />
                {isAr ? 'العناوين' : 'Addresses'}
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                    {isAr ? 'عنواني (المرسل / المسافر)' : 'My Address (Sender / Traveler)'}
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 start-0 pl-3 rtl:pr-3 rtl:pl-0 flex items-start pointer-events-none">
                      <MapPin className="h-4 w-4 text-slate-400" />
                    </div>
                    <textarea
                      name="address"
                      disabled={!isEditing}
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      rows={2}
                      className="w-full pl-10 rtl:pr-10 rtl:pl-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 disabled:opacity-70 resize-none"
                      placeholder={isAr ? 'أدخل عنوانك بالتفصيل...' : 'Enter your full address...'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                    {isAr ? 'عنوان المستلم الافتراضي (اختياري)' : 'Default Receiver Address (Optional)'}
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 start-0 pl-3 rtl:pr-3 rtl:pl-0 flex items-start pointer-events-none">
                      <MapPinned className="h-4 w-4 text-slate-400" />
                    </div>
                    <textarea
                      name="receiverAddress"
                      disabled={!isEditing}
                      value={formData.receiverAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, receiverAddress: e.target.value }))}
                      rows={2}
                      className="w-full pl-10 rtl:pr-10 rtl:pl-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 disabled:opacity-70 resize-none"
                      placeholder={isAr ? 'أدخل عنوان المستلم بالتفصيل...' : 'Enter receiver full address...'}
                    />
                  </div>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-500 hover:bg-brand-500 transition-colors flex items-center gap-2 shadow-lg shadow-brand-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isAr ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
