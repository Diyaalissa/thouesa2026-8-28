import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Locale } from '../../../types';

export interface DetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  locale?: Locale;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
  width?: 'md' | 'lg' | 'xl' | 'full';
}

export const DetailsDrawer: React.FC<DetailsDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  icon,
  locale = 'ar',
  children,
  footerActions,
  width = 'lg',
}) => {
  const isAr = locale === 'ar';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClass = 
    width === 'md' ? 'max-w-md' :
    width === 'xl' ? 'max-w-2xl' :
    width === 'full' ? 'max-w-4xl' :
    'max-w-xl';

  return (
    <div className="fixed inset-0 z-50 flex justify-end" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in" 
      />

      {/* Drawer Body */}
      <div
        className={`relative z-10 w-full ${widthClass} bg-white shadow-2xl flex flex-col h-full overflow-hidden border-s border-slate-200 animate-in ${
          isAr ? 'slide-in-from-left' : 'slide-in-from-right'
        } duration-200`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200 shadow-xs">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900 truncate">{title}</h2>
                {badge}
              </div>
              {subtitle && (
                <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors shrink-0 cursor-pointer"
            aria-label={isAr ? 'إغلاق النافذة' : 'Close drawer'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {children}
        </div>

        {/* Footer Actions */}
        {footerActions && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
            {footerActions}
          </div>
        )}
      </div>
    </div>
  );
};
