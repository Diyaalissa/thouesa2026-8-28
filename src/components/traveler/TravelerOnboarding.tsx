import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, Upload, ShieldCheck, CheckCircle2, Clock, AlertTriangle, FileText } from 'lucide-react';
import { User } from '../../types';

interface Props {
  currentUser: User;
  locale: 'en' | 'ar';
  onSubmit: (data: any) => Promise<void>;
}

export const TravelerOnboarding: React.FC<Props> = ({ currentUser, locale, onSubmit }) => {
  const isAr = locale === 'ar';
  const [step, setStep] = useState(1);
  const [passportImg, setPassportImg] = useState<File | null>(null);
  const [selfieImg, setSelfieImg] = useState<File | null>(null);
  const [pnr, setPnr] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const kycStatus = currentUser.kycStatus || 'UNVERIFIED';

  if (kycStatus === 'PENDING') {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 ">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">
            {isAr ? 'حسابك قيد المراجعة' : 'Account Under Review'}
          </h2>
          <p className="text-slate-500 mb-6">
            {isAr 
              ? 'تم استلام مستنداتك وهي الآن قيد المراجعة والاعتماد من قبل الإدارة. يرجى الانتظار.' 
              : 'Your documents have been received and are pending admin approval. Please wait.'}
          </p>
        </motion.div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!agreed || !pnr || !passportImg || !selfieImg) return;
    setIsSubmitting(true);
    await onSubmit({ pnr, passportImg, selfieImg });
    setIsSubmitting(false);
  };

  return (
    <div className="w-full flex flex-col items-center bg-transparent ">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-brand-600 p-6 md:p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full" />
          <ShieldCheck className="w-16 h-16 mx-auto mb-4 relative z-10" />
          <h1 className="text-2xl md:text-3xl font-black relative z-10">
            {isAr ? 'اعتماد المسافر الأمني' : 'Traveler Security Verification'}
          </h1>
          <p className="mt-2 text-brand-100 relative z-10 text-sm">
            {isAr 
              ? 'خطوات إلزامية لتوثيق حسابك والسماح لك بنقل الأمانات عبر المنصة' 
              : 'Mandatory steps to verify your account and allow you to transport parcels'}
          </p>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          <div className="space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Camera className="w-5 h-5 text-brand-500" />
              {isAr ? '1. رفع المستندات (KYC)' : '1. Upload Documents (KYC)'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors relative">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setPassportImg(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3 ${passportImg ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  {passportImg ? <CheckCircle2 className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                </div>
                <span className="text-sm font-bold block mb-1">
                  {passportImg ? passportImg.name : (isAr ? 'صورة جواز السفر' : 'Passport Copy')}
                </span>
                <span className="text-xs text-slate-400">
                  {isAr ? 'صفحة البيانات بوضوح' : 'Clear data page'}
                </span>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors relative">
                <input 
                  type="file" 
                  accept="image/*"
                  capture="user"
                  onChange={(e) => setSelfieImg(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3 ${selfieImg ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  {selfieImg ? <CheckCircle2 className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
                </div>
                <span className="text-sm font-bold block mb-1">
                  {selfieImg ? selfieImg.name : (isAr ? 'سيلفي مع الجواز' : 'Selfie with Passport')}
                </span>
                <span className="text-xs text-slate-400">
                  {isAr ? 'للمطابقة الأمنية' : 'For identity matching'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-500" />
              {isAr ? '2. التذكرة الإلكترونية' : '2. E-Ticket Information'}
            </h3>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">
                {isAr ? 'رقم التذكرة الإلكترونية (PNR)' : 'PNR Code'}
              </label>
              <input
                type="text"
                value={pnr}
                onChange={(e) => setPnr(e.target.value.toUpperCase())}
                placeholder="e.g. RJ892B"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-lg focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-brand-500" />
              {isAr ? '3. إقرار قانوني' : '3. Legal Declaration'}
            </h3>
            <label className="flex items-start gap-3 p-4 bg-amber-50/50 border border-amber-200/50 rounded-xl cursor-pointer hover:bg-amber-50 transition-colors">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-5 h-5 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
              />
              <span className="text-sm text-slate-700 leading-relaxed">
                {isAr 
                  ? 'أوافق على شروط نقل الأمانات عبر المنصة وأتحمل المسؤولية القانونية الكاملة عن التطابق مع قوانين الطيران والجمارك الدولية.' 
                  : 'I agree to the terms of transporting parcels and assume full legal responsibility for compliance with international aviation and customs laws.'}
              </span>
            </label>
          </div>

          <button
            disabled={!agreed || !pnr || !passportImg || !selfieImg || isSubmitting}
            onClick={handleSubmit}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors"
          >
            {isSubmitting 
              ? (isAr ? 'جاري الإرسال...' : 'Submitting...') 
              : (isAr ? 'إرسال طلب الاعتماد' : 'Submit Verification Request')}
          </button>
        </div>
      </div>
    </div>
  );
};
