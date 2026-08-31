import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Trash2, ArrowRight, ArrowLeft, Clock, Box, Globe2, ShoppingBag } from 'lucide-react';

export interface OrderDraft {
  serviceType: 'SEND_PARCEL' | 'INTERNATIONAL_BUY' | 'SPECIFIC_COUNTRY_BUY';
  titleAr: string;
  titleEn: string;
  summary: string;
  step?: number;
  lastUpdated: string;
  data?: any;
}

interface DraftResumptionBannerProps {
  isAr: boolean;
  onResumeDraft: (draft: OrderDraft) => void;
}

export const DraftResumptionBanner: React.FC<DraftResumptionBannerProps> = ({
  isAr,
  onResumeDraft,
}) => {
  const [draft, setDraft] = useState<OrderDraft | null>(null);

  useEffect(() => {
    // Check if there is an active draft in localStorage
    try {
      const saved = localStorage.getItem('thouesa_order_draft');
      if (saved) {
        setDraft(JSON.parse(saved));
      } else {
        // Provide a default active draft for the demo if user began an order
        const initialDraft: OrderDraft = {
          serviceType: 'SEND_PARCEL',
          titleAr: 'طرد شخصي (هدايا وإلكترونيات) إلى الجزائر',
          titleEn: 'Personal Parcel (Gifts & Electronics) to Algiers',
          summary: '2.5 كجم • استلام من فرع الجزائر',
          step: 2,
          lastUpdated: new Date().toLocaleTimeString(isAr ? 'ar-JO' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
        };
        setDraft(initialDraft);
      }
    } catch {
      // Fallback
    }
  }, [isAr]);

  const handleDiscard = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.removeItem('thouesa_order_draft');
    } catch {}
    setDraft(null);
  };

  if (!draft) return null;

  const ServiceIcon = draft.serviceType === 'INTERNATIONAL_BUY' 
    ? Globe2 
    : draft.serviceType === 'SPECIFIC_COUNTRY_BUY' 
    ? ShoppingBag 
    : Box;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg shadow-brand-500/20 border border-brand-400/30 cursor-pointer group"
        onClick={() => onResumeDraft(draft)}
      >
        {/* Glow & Particles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Rocket className="w-5 h-5 animate-bounce" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs md:text-sm font-black text-white truncate">
                  {isAr ? 'لديك طلب غير مكتمل، اضغط هنا للمتابعة 🚀' : 'You have an unfinished order, tap to resume 🚀'}
                </span>
              </div>
              <p className="text-[11px] md:text-xs text-brand-100 font-medium truncate mt-0.5">
                {isAr ? draft.titleAr : draft.titleEn} {draft.summary ? `• ${draft.summary}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onResumeDraft(draft)}
              className="px-3.5 py-1.5 bg-white text-brand-700 hover:bg-brand-50 rounded-xl text-xs font-black transition-all shadow-sm flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              <span>{isAr ? 'متابعة' : 'Resume'}</span>
              {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleDiscard}
              title={isAr ? 'إلغاء وحذف المسودة' : 'Discard Draft'}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-white/80 hover:text-white" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
