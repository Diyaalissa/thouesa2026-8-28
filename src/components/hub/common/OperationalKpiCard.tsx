import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Locale } from '../../../types';

export interface OperationalKpiCardProps {
  titleAr: string;
  titleEn: string;
  count: number;
  icon: React.ReactNode;
  colorClass: string;
  badgeText?: string;
  onClick: () => void;
  locale?: Locale;
}

export const OperationalKpiCard: React.FC<OperationalKpiCardProps> = ({
  titleAr,
  titleEn,
  count,
  icon,
  colorClass,
  badgeText,
  onClick,
  locale = 'ar',
}) => {
  const isAr = locale === 'ar';

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white border border-slate-200 hover:border-amber-400 p-4 rounded-2xl shadow-xs hover:shadow-md transition-all text-start group cursor-pointer flex flex-col justify-between"
    >
      <div className="flex items-center justify-between w-full mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
          {icon}
        </div>
        {badgeText ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {badgeText}
          </span>
        ) : (
          <div className="text-slate-400 group-hover:text-amber-600 transition-colors">
            {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {count}
        </div>
        <div className="text-xs font-semibold text-slate-600 mt-1">
          {isAr ? titleAr : titleEn}
        </div>
      </div>
    </button>
  );
};
