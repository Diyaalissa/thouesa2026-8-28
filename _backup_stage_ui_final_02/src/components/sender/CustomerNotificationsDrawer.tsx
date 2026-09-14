import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Package, 
  ShieldAlert, 
  Wallet, 
  CheckCircle2, 
  Info, 
  Clock, 
  ExternalLink,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { SystemNotification } from '../../types';

interface CustomerNotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isAr: boolean;
  notifications: SystemNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigate: (tab: string) => void;
}

export const CustomerNotificationsDrawer: React.FC<CustomerNotificationsDrawerProps> = ({
  isOpen,
  onClose,
  isAr,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigate,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'SHIPMENT_STATUS':
      case 'SHIPMENT_CREATED':
      case 'DELIVERY':
        return <Package className="w-4 h-4 text-brand-600" />;
      case 'DISPUTE_UPDATE':
      case 'DISPUTE':
        return <ShieldAlert className="w-4 h-4 text-red-600" />;
      case 'PAYMENT_RECEIVED':
      case 'WALLET_ESCROW':
        return <Wallet className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: isAr ? -400 : 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: isAr ? -400 : 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  {isAr ? 'الإشعارات والتنبيهات' : 'Notifications'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {unreadCount > 0
                    ? isAr
                      ? `لديك ${unreadCount} تنبيهات غير مقروءة`
                      : `You have ${unreadCount} unread alerts`
                    : isAr
                    ? 'جميع التنبيهات مقروءة'
                    : 'All caught up'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub-header Filter Tabs & Mark All Read */}
          <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {isAr ? 'الكل' : 'All'} ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('UNREAD')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filter === 'UNREAD' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {isAr ? 'غير المقروءة' : 'Unread'} ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{isAr ? 'تحديد الكل كمقروء' : 'Mark all read'}</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-slate-700">
                  {isAr ? 'لا توجد إشعارات جديدة حالياً' : 'No notifications here'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {isAr ? 'ستصلك التحديثات اللحظية هنا فور تغيير حالة طرودك' : 'Live updates will appear here instantly'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => {
                    onMarkAsRead(notif.id);
                    if (notif.type?.includes('DISPUTE')) onNavigate('DISPUTES');
                    else if (notif.type?.includes('WALLET') || notif.type?.includes('PAYMENT')) onNavigate('WALLET');
                    else onNavigate('MY_SHIPMENTS');
                    onClose();
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    notif.isRead
                      ? 'bg-white border-slate-150 hover:bg-slate-50/80 text-slate-700'
                      : 'bg-brand-50/60 border-brand-200/80 hover:bg-brand-50 text-slate-900 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      {getIcon(notif.type || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-black truncate">{notif.title}</span>
                        <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1 font-medium">
                          <Clock className="w-2.5 h-2.5" />
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString(isAr ? 'ar-JO' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : 'الآن'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                    </div>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
