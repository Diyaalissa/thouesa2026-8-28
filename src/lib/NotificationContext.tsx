import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Locale, SystemNotification, UserRole } from '../types';

export interface ToastAlert extends SystemNotification {
  toastId: string;
}

interface NotificationContextType {
  notifications: SystemNotification[];
  unreadCount: number;
  activeToasts: ToastAlert[];
  isConnected: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissToast: (toastId: string) => void;
  pushLocalAlert: (notification: Omit<SystemNotification, 'id' | 'createdAt' | 'isRead'>) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  currentRole: UserRole | 'PUBLIC';
  userId?: string;
  locale: Locale;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  currentRole,
  userId,
  locale,
}) => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeToasts, setActiveToasts] = useState<ToastAlert[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // 1. Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?role=${currentRole}&userId=${userId || ''}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.notifications || [];
        setNotifications(list);
        const unread = list.filter((n: SystemNotification) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    }
  }, [currentRole, userId]);

  // 2. Dismiss Toast with animation timing
  const dismissToast = useCallback((toastId: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  }, []);

  // 3. Push real-time toast to screen & list
  const triggerToast = useCallback(
    (notification: SystemNotification) => {
      const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const toastItem: ToastAlert = {
        ...notification,
        toastId,
      };

      setActiveToasts((prev) => [toastItem, ...prev.slice(0, 3)]); // Keep max 4 concurrent toasts on screen

      // Auto dismiss after 6.5s (longer for HIGH priority)
      const duration = notification.priority === 'HIGH' ? 8500 : 5500;
      setTimeout(() => {
        dismissToast(toastId);
      }, duration);
    },
    [dismissToast]
  );

  // 4. Connect to Server-Sent Events (SSE) stream
  useEffect(() => {
    fetchNotifications();

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/notifications/stream?role=${currentRole}&userId=${userId || ''}`);

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && payload.id) {
            // Check if notification applies to current role or user
            const appliesToRole =
              !payload.targetRole ||
              payload.targetRole === 'ALL' ||
              payload.targetRole === currentRole;
            const appliesToUser = !payload.targetUserId || payload.targetUserId === userId;

            if (appliesToRole && appliesToUser) {
              setNotifications((prev) => [payload, ...prev.slice(0, 79)]);
              setUnreadCount((prev) => prev + 1);
              triggerToast(payload);
            }
          }
        } catch (err) {
          console.error('Failed to parse incoming SSE notification payload:', err);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        // Browser automatically attempts reconnect for EventSource
      };
    } catch (sseErr) {
      console.warn('SSE connection init error:', sseErr);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [currentRole, userId, fetchNotifications, triggerToast]);

  // 5. Mark single notification as read
  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // 6. Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: currentRole, userId }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // 7. Manual/local push for immediate frontend actions (e.g. Escrow Locked, Shipment Created)
  const pushLocalAlert = (notification: Omit<SystemNotification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotif: SystemNotification = {
      ...notification,
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setUnreadCount((prev) => prev + 1);
    triggerToast(newNotif);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        activeToasts,
        isConnected,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        dismissToast,
        pushLocalAlert,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
