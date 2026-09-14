import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Package,
  ShieldCheck,
  Lock,
  DollarSign,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Plane,
  X,
  Clock,
} from 'lucide-react';
import { Locale, NotificationType } from '../../types';
import { useNotifications } from '../../lib/NotificationContext';

interface NotificationsBellProps {
  locale: Locale;
  isLight?: boolean;
  onNavigateAction?: (referenceId?: string, type?: NotificationType) => void;
}

export const NotificationsBell: React.FC<NotificationsBellProps> = ({
  locale,
  isLight = false,
  onNavigateAction,
}) => {
  const isAr = locale === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isConnected,
  } = useNotifications();

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'ORDER_CREATED':
        return <Package className="w-4 h-4 text-brand-400" />;
      case 'KYC_SUBMITTED':
      case 'INSPECTION_COMPLETED':
        return <ShieldCheck className="w-4 h-4 text-purple-400" />;
      case 'ESCROW_LOCKED':
        return <Lock className="w-4 h-4 text-amber-400" />;
      case 'ESCROW_RELEASED':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'SHIPMENT_ARRIVED':
      case 'READY_FOR_PICKUP':
      case 'DELIVERED_TO_DEST':
        return <CheckCircle2 className="w-4 h-4 text-teal-400" />;
      case 'IN_TRANSIT':
      case 'TRIP_REGISTERED':
        return <Plane className="w-4 h-4 text-cyan-400" />;
      case 'WEIGHT_DISCREPANCY':
      case 'DISPUTE_RAISED':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      default:
        return <Radio className="w-4 h-4 text-brand-400" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const now = new Date();
      const date = new Date(isoString);
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
      if (diffMinutes < 1) return isAr ? 'الآن' : 'just now';
      if (diffMinutes < 60) return isAr ? `منذ ${diffMinutes} دقيقة` : `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return isAr ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
      return isAr ? `منذ يومين` : '2d ago';
    } catch {
      return '';
    }
  };

  return (
    <div className="relative">
      <button
        id="header-notifications-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all cursor-pointer shadow-xs ${
          isLight
            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
        }`}
        title={isAr ? 'الإشعارات الحية' : 'Live Notifications'}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-slate-900 animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Flyout Dropdown */}
      {isOpen && (
        <div
          dir={isAr ? 'rtl' : 'ltr'}
          className={`absolute ${
            isAr ? 'left-0 sm:-left-12' : 'right-0 sm:-right-12'
          } mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl border z-50 overflow-hidden ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-slate-900 border-slate-800 text-white'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
                }`}
              />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {isAr ? 'مركز الإشعارات والعمليات اللحظية' : 'Live Operations Feed'}
              </h4>
              <span className="px-1.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300 text-[10px] font-bold">
                {unreadCount} {isAr ? 'جديد' : 'new'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] text-brand-500 dark:text-brand-300 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>{isAr ? 'تحديد الكل كمقروء' : 'Mark all read'}</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List of alerts */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" />
                <p>{isAr ? 'لا توجد إشعارات جديدة حالياً' : 'No new notifications'}</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    markAsRead(n.id);
                    if (onNavigateAction && n.referenceId) {
                      onNavigateAction(n.referenceId, n.type);
                      setIsOpen(false);
                    }
                  }}
                  className={`p-3.5 text-xs transition-colors cursor-pointer flex items-start gap-3 ${
                    !n.isRead
                      ? 'bg-brand-50/70 dark:bg-brand-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700/60 mt-0.5">
                    {getIconForType(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {isAr ? n.titleAr : n.titleEn}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0 font-medium">
                        <Clock className="w-2.5 h-2.5" />
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                      {isAr ? n.messageAr : n.messageEn}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
            <Radio
              className={`w-3 h-3 ${
                isConnected ? 'text-emerald-500 animate-pulse' : 'text-slate-500'
              }`}
            />
            <span>
              {isAr
                ? isConnected
                  ? 'البث اللحظي للعمليات متصل (SSE Active)'
                  : 'جاري الاتصال بالبث المباشر...'
                : isConnected
                ? 'Real-time Operations Stream Connected'
                : 'Connecting to operations stream...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

