import React, { useState, useEffect } from 'react';
import { Wallet, Sparkles, ArrowRight, ArrowLeft, Download, ShieldCheck, Clock, CheckCircle2, AlertCircle, CreditCard, Banknote } from 'lucide-react';
import { EscrowWallet, Locale, User } from '../../types';
import { formatCurrency } from '../../lib/crypto';

export interface LedgerTransaction {
  id: string;
  transactionCode: string;
  walletId: string;
  userId: string;
  employeeId?: string;
  type: 'CASH_DEPOSIT_TO_EMPLOYEE' | 'ESCROW_DEPOSIT_BY_TRAVELER' | 'SHIPMENT_PAYMENT' | 'ESCROW_RELEASE' | 'CASH_WITHDRAWAL_FROM_EMPLOYEE';
  amount: number;
  currency: string;
  status: 'COMMITTED' | 'FAILED';
  createdAt: string;
}

interface WalletDashboardProps {
  currentUser: User;
  wallet: EscrowWallet | null;
  locale: Locale;
}

export const WalletDashboard: React.FC<WalletDashboardProps> = ({ currentUser, wallet, locale }) => {
  const isAr = locale === 'ar';
  const isJordanian = currentUser.phone?.startsWith('+962');
  const isAlgerian = currentUser.phone?.startsWith('+213');
  const userCurrency = isJordanian ? 'JOD' : isAlgerian ? 'DZD' : 'USD';
  const currencySymbol = userCurrency === 'JOD' ? 'د.أ' : userCurrency === 'DZD' ? 'د.ج' : '$';

  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [isDepositing, setIsDepositing] = useState(false);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [currentUser.id]);

  const fetchTransactions = async () => {
    setLoadingTx(true);
    try {
      const res = await fetch(`/api/wallets/${currentUser.id}/transactions`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to load transactions', err);
    }
    setLoadingTx(false);
  };

  const handleDeposit = async () => {
    if (depositAmount <= 0) return;
    setIsDepositing(true);
    
    // Convert to USD for backend consistency
    const rateToUsd = userCurrency === 'JOD' ? (1 / 0.71) : userCurrency === 'DZD' ? (1 / 140) : 1;
    const amountInUsd = Number((depositAmount * rateToUsd).toFixed(2));
    
    try {
      const res = await fetch('/api/wallets/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, employeeId: 'emp-amm-101', amount: amountInUsd, currency: 'USD' })
      });
      if (res.ok) {
        alert(isAr ? `تم شحن المحفظة بنجاح بمبلغ ${depositAmount} ${currencySymbol} (ما يعادل ${amountInUsd} $)` : `Wallet topped up successfully with ${depositAmount} ${currencySymbol} (~$${amountInUsd})`);
        window.location.reload();
      }
    } catch(err) {
      console.error(err);
    }
    setIsDepositing(false);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'CASH_DEPOSIT_TO_EMPLOYEE':
        return <Banknote className="w-5 h-5 text-emerald-500" />;
      case 'SHIPMENT_PAYMENT':
        return <ArrowRight className="w-5 h-5 text-red-500" />;
      case 'ESCROW_DEPOSIT_BY_TRAVELER':
        return <ShieldCheck className="w-5 h-5 text-amber-500" />;
      case 'ESCROW_RELEASE':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'CASH_WITHDRAWAL_FROM_EMPLOYEE':
        return <ArrowLeft className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-slate-500" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'CASH_DEPOSIT_TO_EMPLOYEE':
        return isAr ? 'إيداع رصيد (شحن المحفظة)' : 'Wallet Top-up';
      case 'SHIPMENT_PAYMENT':
        return isAr ? 'دفع رسوم شحنة' : 'Shipment Payment';
      case 'ESCROW_DEPOSIT_BY_TRAVELER':
        return isAr ? 'تجميد رصيد ضمان (مسافر)' : 'Escrow Deposit (Traveler)';
      case 'ESCROW_RELEASE':
        return isAr ? 'تحرير رصيد ضمان' : 'Escrow Release';
      case 'CASH_WITHDRAWAL_FROM_EMPLOYEE':
        return isAr ? 'سحب رصيد (أرباح)' : 'Funds Withdrawal';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        {/* Background Decorative Pattern */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-brand-500/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-indigo-600 text-white shadow-inner flex items-center justify-center">
              <Wallet className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">
                {isAr ? 'المحفظة المالية' : 'Financial Wallet'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {isAr ? 'إدارة أرصدتك وإضافة أموال لشحن طرودك بسهولة' : 'Manage your balances and top up funds easily'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Balances & Rates */}
        <div className="space-y-6">
          {/* Main Balance Card (Credit Card Style) */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 p-6 rounded-3xl shadow-xl relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="relative z-10">
              <span className="text-sm text-slate-400 font-bold block mb-1 tracking-wide uppercase">{isAr ? 'الرصيد المتاح' : 'Available Balance'}</span>
              <div className="text-4xl md:text-5xl font-black text-white tracking-tight">
                {wallet ? formatCurrency(wallet.balance, wallet.currency) : '$0.00'}
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-end">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">{isAr ? 'مبالغ مجمدة (ضمان)' : 'Locked Escrow'}</span>
                  <span className="font-bold text-lg text-amber-400">
                    {wallet ? formatCurrency(wallet.lockedEscrowDeposit, 'USD') : '$0.00'}
                  </span>
                </div>
                <div>
                  <ShieldCheck className="w-8 h-8 text-white/20" />
                </div>
              </div>
            </div>
          </div>

          {/* Exchange Rates Info Card */}
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4">
            <h4 className="font-bold text-sm flex items-center gap-2 text-slate-800">
              <Sparkles className="w-5 h-5 text-brand-500" />
              {isAr ? 'أسعار الصرف المعتمدة' : 'Official Exchange Rates'}
            </h4>
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl text-sm">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 border-dashed">
                <span className="text-slate-500 font-bold flex items-center gap-2">
                  <div className="w-6 h-4 bg-slate-200 rounded overflow-hidden relative">
                    <div className="absolute inset-0 bg-blue-800"></div>
                    <div className="absolute top-0 left-0 w-[40%] h-full bg-red-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-[8px] text-white">US</div>
                  </div>
                  1 USD
                </span>
                <span className="font-black text-slate-800">140 DZD</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500 font-bold flex items-center gap-2">
                  <div className="w-6 h-4 bg-slate-200 rounded overflow-hidden relative">
                    <div className="absolute inset-0 bg-black"></div>
                    <div className="absolute top-[33%] left-0 w-full h-[33%] bg-white"></div>
                    <div className="absolute bottom-0 left-0 w-full h-[33%] bg-green-600"></div>
                    <div className="absolute left-0 top-0 h-full w-0 border-t-[8px] border-b-[8px] border-l-[10px] border-t-transparent border-b-transparent border-l-red-600"></div>
                  </div>
                  1 USD
                </span>
                <span className="font-black text-slate-800">0.71 JOD</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              {isAr ? 'يتم تحديث أسعار الصرف بمرونة من قبل الإدارة لتسهيل المعاملات المحلية.' : 'Rates flexibly configured by management to facilitate local transactions.'}
            </p>
          </div>
        </div>

        {/* Right Column: Top Up & History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Top Up Section */}
          <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            
            <div className="relative z-10">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-brand-500" />
                {isAr ? 'إضافة رصيد (شحن المحفظة)' : 'Top Up Wallet'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">{isAr ? `المبلغ المراد شحنه (${currencySymbol})` : `Top-up Amount (${currencySymbol})`}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-slate-400 font-bold">{currencySymbol}</span>
                    </div>
                    <input 
                      type="number" 
                      min="1" 
                      value={depositAmount} 
                      onChange={(e) => setDepositAmount(Number(e.target.value))} 
                      className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-black text-lg text-slate-800 outline-none focus:border-brand-500 focus:bg-white transition-all" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">{isAr ? 'طريقة الدفع' : 'Payment Method'}</label>
                  <select 
                    value={paymentMethod} 
                    onChange={(e) => setPaymentMethod(e.target.value)} 
                    className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-brand-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="CARD">{isAr ? 'البطاقة البنكية (Credit/Debit Card)' : 'Bank Card'}</option>
                    {isJordanian && (
                      <option value="INSTANT_TRANSFER">{isAr ? 'تحويل فوري (إي فواتيركم / كليك)' : 'Instant Transfer (CliQ / eFawateerCom)'}</option>
                    )}
                    {isAlgerian && (
                      <option value="INSTANT_TRANSFER">{isAr ? 'تحويل فوري (البطاقة الذهبية / بريدي موب)' : 'Instant Transfer (Edahabia / BaridiMob)'}</option>
                    )}
                    {!isJordanian && !isAlgerian && (
                      <option value="INSTANT_TRANSFER">{isAr ? 'تحويل فوري (Instant Transfer)' : 'Instant Transfer'}</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="pt-6">
                <button 
                  onClick={handleDeposit} 
                  disabled={isDepositing} 
                  className="w-full md:w-auto px-8 py-3.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:hover:bg-brand-600 text-white font-black rounded-xl text-sm transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2"
                >
                  {isDepositing ? (
                    <span className="animate-pulse">{isAr ? 'جاري التنفيذ...' : 'Processing...'}</span>
                  ) : (
                    <>
                      {isAr ? 'متابعة الدفع الآمن' : 'Proceed to Secure Payment'}
                      <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
            <h3 className="text-lg font-black text-slate-800 flex items-center justify-between">
              <span>{isAr ? 'السجل المالي (آخر المعاملات)' : 'Recent Transactions'}</span>
              <button className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 bg-brand-50 px-3 py-1.5 rounded-lg transition-colors">
                <Download className="w-3.5 h-3.5" />
                {isAr ? 'تحميل الكشف' : 'Export'}
              </button>
            </h3>
            
            <div className="space-y-3">
              {loadingTx ? (
                <div className="text-center py-8 text-slate-400 font-bold text-sm animate-pulse">
                  {isAr ? 'جاري تحميل المعاملات...' : 'Loading transactions...'}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                  <div className="w-12 h-12 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6" />
                  </div>
                  <p className="text-slate-500 font-medium text-sm">
                    {isAr ? 'لا توجد معاملات مالية مسجلة بعد' : 'No transactions recorded yet'}
                  </p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="p-4 bg-white border border-slate-100 hover:border-brand-200 hover:shadow-md rounded-2xl flex items-center justify-between transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        tx.amount > 0 ? 'bg-emerald-50' : 'bg-red-50'
                      }`}>
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{getTransactionLabel(tx.type)}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-500 font-medium">
                            {new Date(tx.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-JO' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                            {tx.transactionCode}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-base font-black ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount, tx.currency as any)}
                      </p>
                      {tx.status === 'COMMITTED' ? (
                        <span className="text-[10px] font-bold text-emerald-500 flex items-center justify-end gap-1 mt-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {isAr ? 'مكتمل' : 'Completed'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-red-500 flex items-center justify-end gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {isAr ? 'فشل' : 'Failed'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
