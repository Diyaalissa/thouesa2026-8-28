import React from 'react';
import {
  Package,
  ShieldCheck,
  Lock,
  DollarSign,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Plane,
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { Locale, NotificationType, SystemNotification } from '../../types';
import { useNotifications, ToastAlert } from '../../lib/NotificationContext';

interface AlertsProps {
  locale: Locale;
  onNavigateAction?: (referenceId?: string, type?: NotificationType) => void;
}

export const Alerts: React.FC<AlertsProps> = ({ locale, onNavigateAction }) => {
  const isAr = locale === 'ar';
  const { activeToasts, dismissToast } = useNotifications();

  if (!activeToasts || activeToasts.length === 0) {
    return null;
  }

  const getAlertConfig = (type: NotificationType) => {
    switch (type) {
      case 'ESCROW_LOCKED':
        return {
          icon: <Lock className="w-5 h-5 text-amber-400" />,
          accentBorder: 'border-amber-500/40',
          accentBg: 'bg-amber-500/10 dark:bg-amber-950/40',
          badgeTextAr: 'حجز وديعة ضمان',
          badgeTextEn: 'Escrow Locked',
          badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        };
      case 'ESCROW_RELEASED':
        return {
          icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
          accentBorder: 'border-emerald-500/40',
          accentBg: 'bg-emerald-500/10 dark:bg-emerald-950/40',
          badgeTextAr: 'تحرير أرباح الضمان',
          badgeTextEn: 'Escrow Released',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
      case 'SHIPMENT_ARRIVED':
      case 'DELIVERED_TO_DEST':
      case 'READY_FOR_PICKUP':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-teal-400" />,
          accentBorder: 'border-teal-500/40',
          accentBg: 'bg-teal-500/10 dark:bg-teal-950/40',
          badgeTextAr: 'وصول الشحنة للفرع',
          badgeTextEn: 'Shipment Arrived',
          badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
        };
      case 'IN_TRANSIT':
      case 'TRIP_REGISTERED':
        return {
          icon: <Plane className="w-5 h-5 text-cyan-400" />,
          accentBorder: 'border-cyan-500/40',
          accentBg: 'bg-cyan-500/10 dark:bg-cyan-950/40',
          badgeTextAr: 'شحنة قيد الطيران',
          badgeTextEn: 'In Flight',
          badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        };
      case 'ORDER_CREATED':
        return {
          icon: <Package className="w-5 h-5 text-brand-400" />,
          accentBorder: 'border-brand-500/40',
          accentBg: 'bg-brand-500/10 dark:bg-brand-950/40',
          badgeTextAr: 'طلب شحن جديد',
          badgeTextEn: 'Shipment Created',
          badgeClass: 'bg-brand-500/20 text-brand-400 border-brand-500/30',
        };
      case 'INSPECTION_COMPLETED':
      case 'KYC_SUBMITTED':
        return {
          icon: <ShieldCheck className="w-5 h-5 text-indigo-400" />,
          accentBorder: 'border-indigo-500/40',
          accentBg: 'bg-indigo-500/10 dark:bg-indigo-950/40',
          badgeTextAr: 'توثيق واكتمال فحص',
          badgeTextEn: 'Inspection Verified',
          badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        };
      case 'DISPUTE_RAISED':
      case 'WEIGHT_DISCREPANCY':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
          accentBorder: 'border-rose-500/40',
          accentBg: 'bg-rose-500/10 dark:bg-rose-950/40',
          badgeTextAr: 'تنبيه نزاع / وزن',
          badgeTextEn: 'Dispute / Discrepancy',
          badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        };
      default:
        return {
          icon: <Radio className="w-5 h-5 text-sky-400" />,
          accentBorder: 'border-sky-500/40',
          accentBg: 'bg-sky-500/10 dark:bg-sky-950/40',
          badgeTextAr: 'تحديث مباشر',
          badgeTextEn: 'Live Status Update',
          badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        };
    }
  };

  return (
    <aside
      aria-label={isAr ? 'مركز التنبيهات المباشرة' : 'Live Alerts Notifications'}
      dir={isAr ? 'rtl' : 'ltr'}
      className={`fixed z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[calc(100%-2rem)] pointer-events-none transition-all duration-300 ${
        isAr ? 'bottom-4 left-4 sm:left-6' : 'bottom-4 right-4 sm:right-6'
      }`}
    >
      {activeToasts.map((toast: ToastAlert) => {
        const config = getAlertConfig(toast.type);

        return (
          <div
            key={toast.toastId}
            role="alert"
            className={`pointer-events-auto w-full rounded-2xl p-4 shadow-2xl border backdrop-blur-xl bg-slate-900/95 text-white ${
              config.accentBorder
            } transition-all transform animate-in slide-in-from-bottom-5 duration-300 hover:shadow-brand-500/10 relative overflow-hidden`}
          >
            {/* Top glowing edge indicator */}
            <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-80`} />

            <div className="flex items-start gap-3">
              {/* Alert Icon Badge */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${config.accentBg} ${config.accentBorder}`}
              >
                {config.icon}
              </div>

              {/* Alert Content */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black border font-mono ${config.badgeClass}`}
                    >
                      {isAr ? config.badgeTextAr : config.badgeTextEn}
                    </span>
                    <h5 className="text-xs font-black text-white truncate">
                      {isAr ? toast.titleAr : toast.titleEn}
                    </h5>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => dismissToast(toast.toastId)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                    title={isAr ? 'إغلاق' : 'Dismiss'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {isAr ? toast.messageAr : toast.messageEn}
                </p>

                {/* Footer details: Reference code and time */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{isAr ? 'الآن' : 'Just now'}</span>
                    {toast.referenceId && (
                      <span className="text-slate-500">| #{toast.referenceId.slice(-8)}</span>
                    )}
                  </div>

                  {onNavigateAction && toast.referenceId && (
                    <button
                      onClick={() => {
                        onNavigateAction(toast.referenceId, toast.type);
                        dismissToast(toast.toastId);
                      }}
                      className="text-brand-400 hover:text-brand-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>{isAr ? 'عرض التفاصيل' : 'View details'}</span>
                      {isAr ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </aside>
  );
};
