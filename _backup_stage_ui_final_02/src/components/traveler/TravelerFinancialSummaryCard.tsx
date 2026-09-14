import React from 'react';
import { Wallet, ArrowUpRight, Lock, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';
import { EscrowWallet, Locale } from '../../types';
import { formatCurrency } from '../../lib/crypto';

interface TravelerFinancialSummaryCardProps {
  wallet: EscrowWallet | null | undefined;
  locale: Locale;
  onManageWallet: () => void;
  onOpenDeposits?: () => void;
}

export const TravelerFinancialSummaryCard: React.FC<TravelerFinancialSummaryCardProps> = ({
  wallet,
  locale,
  onManageWallet,
  onOpenDeposits,
}) => {
  const isAr = locale === 'ar';

  const availableBalance = wallet?.balance || 0;
  const pendingEarnings = wallet?.pendingEarnings || 0;
  const lockedEscrow = wallet?.lockedEscrowDeposit || 0;
  const totalPending = pendingEarnings + lockedEscrow;
  const currency = wallet?.currency || 'USD';

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
          <h3 className="font-black text-sm text-slate-900">{isAr ? 'الملخص المالي السريع' : 'Financial Snapshot'}</h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold">
          {isAr ? 'حساب نشط' : 'Active'}
        </span>
      </div>

      {/* Available Balance (Main Hero Metric) */}
      <div className="p-4 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 rounded-2xl border border-emerald-100 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-bold">{isAr ? 'الرصيد المتاح للسحب الفوري' : 'Available for Payout'}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono tracking-tight">
          {formatCurrency(availableBalance, currency)}
        </div>
        <span className="text-[10px] text-emerald-800 font-medium block">
          {isAr ? 'أرباح الرحلات المكتملة وجاهزة للتحويل' : 'Cleared trip earnings ready for transfer'}
        </span>
      </div>

      {/* Pending & Escrow Metrics */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 block flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>{isAr ? 'أرباح قيد التنفيذ' : 'Pending Earnings'}</span>
          </span>
          <span className="text-sm font-black text-slate-800 font-mono block">
            {formatCurrency(pendingEarnings, currency)}
          </span>
        </div>

        <div 
          onClick={onOpenDeposits}
          className="p-3 bg-slate-50 hover:bg-amber-50/50 rounded-2xl border border-slate-100 hover:border-amber-200 transition-colors cursor-pointer space-y-1"
        >
          <span className="text-[10px] font-bold text-slate-500 block flex items-center gap-1">
            <Lock className="w-3 h-3 text-amber-600" />
            <span>{isAr ? 'الضمان المحجوز' : 'Locked Escrow'}</span>
          </span>
          <span className="text-sm font-black text-amber-700 font-mono block">
            {formatCurrency(lockedEscrow, currency)}
          </span>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={onManageWallet}
        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
      >
        <span>{isAr ? 'إدارة المحفظة وطلب السحب' : 'Manage Wallet & Payout'}</span>
        <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />
      </button>
    </div>
  );
};
