import sys

content = """import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  Globe2, 
  Wallet, 
  Bell, 
  PlusCircle, 
  Calculator, 
  Copy, 
  CheckCircle2, 
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  MapPin,
  Box
} from 'lucide-react';

interface SenderOverviewProps {
  currentUser: any;
  walletBalance: number;
  activeShipmentsCount: number;
  onNavigate: (tab: string) => void;
  isAr: boolean;
  shipments?: any[];
}

export const SenderOverview: React.FC<SenderOverviewProps> = ({
  currentUser,
  walletBalance,
  activeShipmentsCount,
  onNavigate,
  isAr,
  shipments = [],
}) => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Calculator state
  const [calcFrom, setCalcFrom] = useState('');
  const [calcTo, setCalcTo] = useState('');
  const [calcWeight, setCalcWeight] = useState('');
  const [calcResult, setCalcResult] = useState<number | null>(null);

  useEffect(() => {
    // Simulate initial skeleton load
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Instant calculate when inputs change
    if (calcFrom && calcTo && calcWeight && parseFloat(calcWeight) > 0) {
      const weight = parseFloat(calcWeight);
      const baseCost = weight * 15.0; // Mock calculation
      setCalcResult(baseCost);
    } else {
      setCalcResult(null);
    }
  }, [calcFrom, calcTo, calcWeight]);

  const handleTopUp = () => {
    setIsTopUpLoading(true);
    setTimeout(() => {
      setIsTopUpLoading(false);
      onNavigate('WALLET');
    }, 600);
  };

  const copyTracking = (trackingNumber: string) => {
    navigator.clipboard.writeText(trackingNumber);
    setToastMessage(isAr ? 'تم نسخ رقم التتبع بنجاح ✅' : 'Tracking number copied ✅');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const activeShipments = shipments.filter(s => 
    s.currentStatus !== 'DELIVERED' && 
    s.currentStatus !== 'CANCELLED' &&
    s.currentStatus !== 'REJECTED'
  ).slice(0, 3); // show max 3 in overview

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-200 animate-pulse"></div>
            <div className="space-y-2">
              <div className="w-32 h-4 bg-slate-200 rounded animate-pulse"></div>
              <div className="w-24 h-3 bg-slate-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse"></div>
        </div>
        
        {/* Skeleton Wallet */}
        <div className="w-full h-32 rounded-3xl bg-slate-200 animate-pulse"></div>

        {/* Skeleton Actions */}
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 rounded-2xl bg-slate-200 animate-pulse"></div>
          <div className="h-24 rounded-2xl bg-slate-200 animate-pulse"></div>
        </div>

        {/* Skeleton Calculator */}
        <div className="w-full h-48 rounded-3xl bg-slate-200 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 md:pb-6 relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl font-bold text-sm flex items-center gap-2 border border-slate-700"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-black text-lg">
            {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">
              {isAr ? `مرحباً، ${currentUser.fullName?.split(' ')[0]}` : `Hello, ${currentUser.fullName?.split(' ')[0]}`}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {isAr ? 'جاهز لإرسال شحنتك القادمة؟' : 'Ready to send your next parcel?'}
            </p>
          </div>
        </div>
        <button className="relative w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
          <Bell className="w-5 h-5 text-slate-700" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </div>

      {/* Wallet Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400 font-bold mb-1 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              {isAr ? 'الرصيد المتاح' : 'Available Balance'}
            </div>
            <div className="text-4xl font-black tracking-tight">
              ${walletBalance.toFixed(2)}
            </div>
          </div>
          <button 
            onClick={handleTopUp}
            disabled={isTopUpLoading}
            className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-brand-500/25 active:scale-95 disabled:opacity-80"
          >
            {isTopUpLoading ? (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <PlusCircle className="w-4 h-4" />
            )}
            {isTopUpLoading ? (isAr ? 'جاري التحميل...' : 'Loading...') : (isAr ? 'إضافة رصيد' : 'Top Up')}
          </button>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <motion.button 
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('SEND_PARCEL')}
          className="bg-brand-50 hover:bg-brand-100 border border-brand-100 p-5 rounded-2xl flex flex-col items-start gap-3 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-md">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-brand-900 text-sm md:text-base">{isAr ? 'إرسال طرد' : 'Send Parcel'}</h3>
            <p className="text-[10px] md:text-xs text-brand-700 mt-0.5">{isAr ? 'شحن دولي من الباب للباب' : 'International door-to-door'}</p>
          </div>
        </motion.button>
        <motion.button 
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('INTERNATIONAL_BUY')}
          className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 p-5 rounded-2xl flex flex-col items-start gap-3 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-md">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-indigo-900 text-sm md:text-base">{isAr ? 'شراء عالمي' : 'Global Buy'}</h3>
            <p className="text-[10px] md:text-xs text-indigo-700 mt-0.5">{isAr ? 'شراء من أمازون والمتاجر' : 'Shop from Amazon & more'}</p>
          </div>
        </motion.button>
      </div>

      {/* Calculator (Instant) */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Calculator className="w-32 h-32 text-slate-900" />
        </div>
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-5">
          <Calculator className="w-5 h-5 text-emerald-500" />
          {isAr ? 'حاسبة التكلفة السريعة' : 'Quick Cost Calculator'}
        </h2>
        
        <div className="grid grid-cols-3 gap-3 md:gap-4 relative z-10">
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">{isAr ? 'من' : 'From'}</label>
            <select 
              value={calcFrom} 
              onChange={(e) => setCalcFrom(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="">{isAr ? 'اختر' : 'Select'}</option>
              <option value="JO">Jordan</option>
              <option value="DZ">Algeria</option>
              <option value="US">USA</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">{isAr ? 'إلى' : 'To'}</label>
            <select 
              value={calcTo} 
              onChange={(e) => setCalcTo(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="">{isAr ? 'اختر' : 'Select'}</option>
              <option value="DZ">Algeria</option>
              <option value="JO">Jordan</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">{isAr ? 'الوزن (كجم)' : 'Weight (kg)'}</label>
            <input 
              type="number" 
              value={calcWeight}
              onChange={(e) => setCalcWeight(e.target.value)}
              placeholder="1.5"
              min="0.1" step="0.1"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        <AnimatePresence>
          {calcResult !== null && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between overflow-hidden"
            >
              <div>
                <span className="text-xs font-bold text-emerald-600 block mb-0.5">{isAr ? 'التكلفة التقديرية تبدأ من' : 'Estimated Cost'}</span>
                <span className="text-[10px] text-emerald-500/80">{isAr ? '*لا تشمل الجمارك' : '*Excludes customs'}</span>
              </div>
              <div className="text-2xl font-black text-emerald-700">
                ${calcResult.toFixed(2)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Active Shipments */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-500" />
            {isAr ? 'شحناتك النشطة' : 'Active Shipments'}
          </h2>
          {activeShipmentsCount > 0 && (
            <button 
              onClick={() => onNavigate('MY_SHIPMENTS')}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 px-3 py-1.5 bg-brand-50 rounded-lg transition-colors"
            >
              {isAr ? 'عرض الكل' : 'View All'}
            </button>
          )}
        </div>

        {activeShipmentsCount > 0 ? (
          <div className="space-y-3">
            {activeShipments.map(shipment => (
              <div key={shipment.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 bg-brand-50 text-brand-500 rounded-xl flex items-center justify-center shrink-0">
                  <Package className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-800 text-sm truncate">{shipment.trackingNumber}</span>
                    <button 
                      onClick={() => copyTracking(shipment.trackingNumber)}
                      className="text-slate-400 hover:text-brand-500 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{shipment.itemDescription}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 px-2.5 py-1 rounded-md text-[10px] font-bold border border-amber-100">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                    {isAr ? 'في الطريق' : 'In Transit'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-8 text-center relative overflow-hidden group">
            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500">
              <Box className="w-10 h-10 text-brand-500" />
            </div>
            <h3 className="font-black text-slate-800 mb-2">
              {isAr ? 'لا توجد شحنات نشطة حالياً' : 'No active shipments right now'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {isAr ? 'ابدأ بإرسال طردك الأول الآن واستمتع بتجربة شحن مميزة!' : 'Start sending your first parcel now and enjoy a great shipping experience!'}
            </p>
            
            <div className="flex items-center justify-center gap-4 text-brand-300">
              <ArrowLeft className={`w-6 h-6 animate-bounce ${isAr ? '' : 'rotate-180'}`} />
              <button 
                onClick={() => onNavigate('SEND_PARCEL')}
                className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-brand-500/20"
              >
                {isAr ? 'إرسال طرد' : 'Send Parcel'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
"""

with open('src/components/sender/SenderOverview.tsx', 'w') as f:
    f.write(content)
