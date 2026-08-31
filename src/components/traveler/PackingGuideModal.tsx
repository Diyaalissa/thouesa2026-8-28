import React from 'react';
import { Locale } from '../../types';
import { X, Package, ShieldAlert, Droplets, Laptop, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PackingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
}

export const PackingGuideModal: React.FC<PackingGuideModalProps> = ({ isOpen, onClose, locale }) => {
  const isAr = locale === 'ar';
  
  if (!isOpen) return null;

  const tips = [
    {
      icon: Droplets,
      title: isAr ? 'عزل السوائل' : 'Isolate Liquids',
      desc: isAr ? 'ضع الطرود التي تحتوي سوائل في أسفل الحقيبة وداخل أكياس محكمة.' : 'Place liquid packages at the bottom inside sealed bags.',
      color: 'text-blue-500',
      bg: 'bg-blue-50'
    },
    {
      icon: Laptop,
      title: isAr ? 'حماية الإلكترونيات' : 'Protect Electronics',
      desc: isAr ? 'ضع الأجهزة بين الملابس الناعمة في منتصف الحقيبة لامتصاص الصدمات.' : 'Place devices between soft clothes in the middle for shock absorption.',
      color: 'text-purple-500',
      bg: 'bg-purple-50'
    },
    {
      icon: ShieldAlert,
      title: isAr ? 'عدم فك الختم' : 'Do Not Break Seals',
      desc: isAr ? 'يمنع منعاً باتاً فك التغليف الأمني الخاص بالشركة.' : 'Strictly prohibited to break the company tamper-evident security seal.',
      color: 'text-rose-500',
      bg: 'bg-rose-50'
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90dvh]"
        >
          <div className="bg-gradient-to-r from-indigo-600 to-brand-600 p-6 text-white relative">
            <button onClick={onClose} className="absolute top-4 rtl:left-4 ltr:right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
              <Package className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-black">{isAr ? 'دليل التعبئة الآمنة' : 'Safe Packing Guide'}</h2>
            <p className="text-indigo-100 text-xs mt-2 opacity-90">
              {isAr ? 'نصائح لضمان سلامة الطرود داخل حقائبك الشخصية' : 'Tips to ensure package safety inside your personal luggage'}
            </p>
          </div>
          
          <div className="p-6 overflow-y-auto space-y-4">
            {tips.map((tip, idx) => (
              <div key={idx} className="flex gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${tip.bg} ${tip.color}`}>
                  <tip.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{tip.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{tip.desc}</p>
                </div>
              </div>
            ))}
            
            <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                {isAr 
                  ? 'الالتزام بهذه التعليمات يرفع من موثوقيتك كمسافر ويجنبك المساءلة في حال التلف.' 
                  : 'Following these instructions increases your traveler rating and avoids liability for damages.'}
              </p>
            </div>
          </div>
          
          <div className="p-4 border-t border-slate-100">
            <button onClick={onClose} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm">
              {isAr ? 'فهمت التعليمات' : 'I Understand'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
