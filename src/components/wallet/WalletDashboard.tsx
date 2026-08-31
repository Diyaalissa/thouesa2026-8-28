import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, Sparkles, ArrowRight, ArrowLeft, Download, ShieldCheck, 
  Clock, CheckCircle2, AlertCircle, CreditCard, Banknote, Receipt,
  X, Upload, FileText, Lock
} from 'lucide-react';
import { EscrowWallet, Locale, User, Shipment } from '../../types';
import { formatCurrency } from '../../lib/crypto';
import { motion, AnimatePresence } from 'motion/react';

export interface LedgerTransaction {
  id: string;
  transactionCode: string;
  walletId: string;
  userId: string;
  employeeId?: string;
  type: 'CASH_DEPOSIT' | 'ESCROW_DEDUCTION' | 'SHIPMENT_PAYMENT' | 'ESCROW_REFUND' | 'CASH_WITHDRAWAL' | 'CUSTOMS_FEE';
  amount: number;
  currency: string;
  status: 'COMMITTED' | 'FAILED' | 'PENDING_REVIEW';
  createdAt: string;
  relatedShipmentId?: string;
  note?: string;
  receiptUrl?: string;
}

interface WalletDashboardProps {
  currentUser: User;
  wallet: EscrowWallet | null;
  locale: Locale;
  shipments?: Shipment[];
}

export const WalletDashboard: React.FC<WalletDashboardProps> = ({ currentUser, wallet, locale, shipments = [] }) => {
  const isAr = locale === 'ar';
  const isJordanian = currentUser.phone?.startsWith('+962') || currentUser.country === 'JOR';
  const isAlgerian = currentUser.phone?.startsWith('+213') || currentUser.country === 'DZA';
  
  // Base primary/secondary currency logic
  const primaryCurrency = isJordanian ? 'JOD' : isAlgerian ? 'DZD' : 'USD';
  const secondaryCurrency = isJordanian ? 'DZD' : isAlgerian ? 'JOD' : 'JOD';
  const currencySymbol = primaryCurrency === 'JOD' ? 'د.أ' : primaryCurrency === 'DZD' ? 'د.ج' : '$';

  // Approximate FX conversion rates for display
  // 1 USD = 0.709 JOD, 1 USD = 134.5 DZD => 1 JOD = ~189.7 DZD
  const convertAmount = (amountInUsd: number, target: 'JOD' | 'DZD' | 'USD') => {
    if (target === 'JOD') return amountInUsd * 0.709;
    if (target === 'DZD') return amountInUsd * 134.5;
    return amountInUsd;
  };

  const formatDualCurrency = (amountInUsd: number) => {
    const primVal = convertAmount(amountInUsd, primaryCurrency as any);
    const secVal = convertAmount(amountInUsd, secondaryCurrency as any);
    return {
      primary: formatCurrency(primVal, primaryCurrency as any),
      secondary: formatCurrency(secVal, secondaryCurrency as any),
    };
  };
  
  const [depositAmount, setDepositAmount] = useState<number>(isJordanian ? 50 : isAlgerian ? 5000 : 100);
  const [paymentMethod, setPaymentMethod] = useState(isJordanian ? 'CLIQ' : isAlgerian ? 'BARIDIMOB' : 'CARD');
  const [isDepositing, setIsDepositing] = useState(false);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [receiptFile, setReceiptFile] = useState<string | null>(null);
  
  // Modals state
  const [selectedInvoice, setSelectedInvoice] = useState<LedgerTransaction | null>(null);
  const [showQuickSettle, setShowQuickSettle] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [txFilter, setTxFilter] = useState('ALL');

  // Calculate Reserved Balance (Escrow - 50% down payment for in-progress shipments)
  const reservedBalanceUsd = useMemo(() => {
    return shipments
      .filter(s => ['PENDING_HUB_DROPOFF', 'RECEIVED_AT_ORIGIN', 'IN_TRANSIT', 'CUSTOMS_CLEARANCE', 'CUSTOMS_HELD', 'READY_FOR_DELIVERY'].includes(s.currentStatus))
      .reduce((sum, s) => sum + (s.declaredValue || 0) * 0.5, 0);
  }, [shipments]);

  // Calculate Pending Payments (Quick Settle for arrived packages pending second 50% + customs)
  const pendingPayments = useMemo(() => {
    return shipments.filter(s => s.currentStatus === 'READY_FOR_DELIVERY' || s.currentStatus === 'CUSTOMS_HELD');
  }, [shipments]);
  
  const totalPendingAmountUsd = useMemo(() => {
    return pendingPayments.reduce((sum, s) => {
      const remaining50 = (s.declaredValue || 0) * 0.5;
      const customsFee = s.currentStatus === 'CUSTOMS_HELD' ? 25 : 0;
      return sum + remaining50 + customsFee;
    }, 0);
  }, [pendingPayments]);

  const availableBalanceUsd = wallet?.balance || 0;
  const availableDual = formatDualCurrency(availableBalanceUsd);
  const reservedDual = formatDualCurrency(reservedBalanceUsd);
  const pendingDual = formatDualCurrency(totalPendingAmountUsd);

  useEffect(() => {
    fetchTransactions();
  }, [currentUser.id]);

  const fetchTransactions = async () => {
    setLoadingTx(true);
    // Mocking real-looking ledger records
    setTimeout(() => {
      setTransactions([
        {
          id: 'tx-1',
          transactionCode: 'TXN-9982-DEP',
          walletId: wallet?.id || 'w-1',
          userId: currentUser.id,
          type: 'CASH_DEPOSIT',
          amount: 500,
          currency: 'USD',
          status: 'COMMITTED',
          createdAt: new Date().toISOString(),
          note: isJordanian ? 'إيداع عبر CliQ (معتمد)' : isAlgerian ? 'إيداع عبر بريدي موب (معتمد)' : 'Credit Card Top-up'
        },
        {
          id: 'tx-2',
          transactionCode: 'TXN-9983-ESC',
          walletId: wallet?.id || 'w-1',
          userId: currentUser.id,
          type: 'ESCROW_DEDUCTION',
          amount: -150,
          currency: 'USD',
          status: 'COMMITTED',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          relatedShipmentId: 'SHP-2024-8891',
          note: isAr ? 'خصم عربون 50% لشحنة ملابس وأحذية' : '50% Escrow deposit for apparel shipment'
        },
        {
          id: 'tx-4',
          transactionCode: 'TXN-9985-CUS',
          walletId: wallet?.id || 'w-1',
          userId: currentUser.id,
          type: 'CUSTOMS_FEE',
          amount: -45.50,
          currency: 'USD',
          status: 'COMMITTED',
          createdAt: new Date(Date.now() - 43200000).toISOString(),
          relatedShipmentId: 'SHP-2024-8891',
          note: isAr ? 'رسوم التخليص الجمركي الرسمية (وصل رقم CUS-4921)' : 'Official Customs Clearance Fee (Receipt #CUS-4921)',
          receiptUrl: 'https://images.unsplash.com/photo-1621844781423-f327702e861c?auto=format&fit=crop&q=80&w=600'
        },
        {
          id: 'tx-5',
          transactionCode: 'TXN-9988-DSP',
          walletId: wallet?.id || 'w-1',
          userId: currentUser.id,
          type: 'ESCROW_REFUND',
          amount: 25,
          currency: 'USD',
          status: 'COMMITTED',
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          relatedShipmentId: 'SHP-8812',
          note: isAr ? 'تعويض مالي فوري - نزاع رقم #DSP-0881' : 'Instant Compensation - Dispute #DSP-0881'
        },
        {
          id: 'tx-3',
          transactionCode: 'TXN-9984-REF',
          walletId: wallet?.id || 'w-1',
          userId: currentUser.id,
          type: 'ESCROW_REFUND',
          amount: 150,
          currency: 'USD',
          status: 'COMMITTED',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          relatedShipmentId: 'SHP-2024-7710',
          note: isAr ? 'استرداد عربون كامل - منتج غير متوفر لدى البائع' : 'Full Deposit Refund - Item out of stock'
        }
      ]);
      setLoadingTx(false);
    }, 500);
  };

  const handleDeposit = async () => {
    if (depositAmount <= 0) return;
    setIsDepositing(true);
    
    setTimeout(() => {
      if (paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'CLIQ' || paymentMethod === 'BARIDIMOB') {
        alert(isAr ? 'تم إرسال إشعار الإيداع والوصل بنجاح، ستتم إضافة الرصيد بعد المراجعة السريعة.' : 'Top-up receipt submitted successfully. Balance will be updated after quick verification.');
      } else {
        alert(isAr ? 'تم شحن المحفظة بنجاح.' : 'Wallet topped up successfully.');
      }
      setIsDepositing(false);
      setUploadingReceipt(false);
      setReceiptFile(null);
    }, 1200);
  };

  const handleQuickSettle = () => {
    if (availableBalanceUsd < totalPendingAmountUsd) {
      alert(isAr ? 'رصيدك المتاح غير كافٍ. يرجى شحن المحفظة أولاً.' : 'Insufficient available balance. Please top up your wallet first.');
      return;
    }
    alert(isAr ? `تم تسديد جميع المستحقات المتبقية (${pendingDual.primary}) بنجاح من رصيدك المتاح.` : `Successfully settled all remaining dues (${pendingDual.primary}) from available balance.`);
    setShowQuickSettle(false);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'CASH_DEPOSIT':
      case 'ESCROW_REFUND':
        return <ArrowLeft className="w-5 h-5 text-emerald-500" />;
      case 'ESCROW_DEDUCTION':
      case 'SHIPMENT_PAYMENT':
      case 'CUSTOMS_FEE':
      case 'CASH_WITHDRAWAL':
        return <ArrowRight className="w-5 h-5 text-slate-800 dark:text-slate-200" />;
      default:
        return <Clock className="w-5 h-5 text-slate-500" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'CASH_DEPOSIT': return isAr ? 'إيداع رصيد' : 'Funds Deposit';
      case 'ESCROW_REFUND': return isAr ? 'استرداد رصيد' : 'Funds Refund';
      case 'ESCROW_DEDUCTION': return isAr ? 'خصم عربون ضمان' : 'Escrow Deduction';
      case 'SHIPMENT_PAYMENT': return isAr ? 'دفع مستحقات شحنة' : 'Shipment Payment';
      case 'CUSTOMS_FEE': return isAr ? 'رسوم جمركية' : 'Customs Fee';
      case 'CASH_WITHDRAWAL': return isAr ? 'سحب رصيد' : 'Funds Withdrawal';
      default: return type;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with Quick Settle if pending payments exist */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-brand-500" />
            {isAr ? 'المحفظة المالية والفواتير' : 'Wallet & Invoices'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAr ? 'إدارة أرصدتك، تسديد المستحقات، وعرض الفواتير والوصولات الرسمية.' : 'Manage balances, settle dues, and inspect verified invoices.'}
          </p>
        </div>
        
        {pendingPayments.length > 0 && (
          <button 
            onClick={() => setShowQuickSettle(true)}
            className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-500/25 animate-pulse cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-brand-200" />
            {isAr ? 'تسديد المستحقات السريع' : 'Quick Settle Dues'}
            <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs font-mono font-bold mr-1">
              {pendingDual.primary}
            </span>
          </button>
        )}
      </div>

      {/* Smart Balances Split (Dual Currency Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Available Balance */}
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-950 border border-emerald-800/80 p-6 rounded-3xl shadow-xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {isAr ? 'الرصيد المتاح للاستخدام' : 'Available Balance'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {isAr ? 'جاهز للسحب / الاستخدام' : 'Ready to use'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                {availableDual.primary}
              </div>
              {/* Dual Currency equivalent */}
              <div className="text-xs sm:text-sm font-semibold text-emerald-300/80 font-mono">
                ≈ {availableDual.secondary}
              </div>
            </div>
            <p className="text-xs text-emerald-400/70 mt-3 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isAr ? 'المبلغ الحر في حسابك للدفع أو إتمام الشحنات الجديدة.' : 'Free balance for direct order creation and quick settlement.'}
            </p>
          </div>
        </div>

        {/* Reserved Balance */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-amber-400 tracking-wider uppercase flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-400" />
                {isAr ? 'الرصيد المحجوز (ضمان العربون 50%)' : 'Reserved Balance (Escrow)'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {isAr ? 'مجمد حتى اكتمال الشحن' : 'Locked during transit'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                {reservedDual.primary}
              </div>
              {/* Dual Currency equivalent */}
              <div className="text-xs sm:text-sm font-semibold text-slate-400 font-mono">
                ≈ {reservedDual.secondary}
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              {isAr ? 'إجمالي المبالغ المخصومة كـ (عربون 50%) للطلبات الجارية تحت الضمان المالي.' : 'Total escrow deposits held safely for in-progress deliveries.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Top Up */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm relative overflow-hidden">
            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 mb-6">
              <CreditCard className="w-5 h-5 text-brand-500" />
              {isAr ? 'شحن المحفظة' : 'Add Funds'}
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                  {isAr ? `المبلغ المراد شحنه (${currencySymbol})` : `Top-up Amount (${currencySymbol})`}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-400 font-bold">{currencySymbol}</span>
                  </div>
                  <input 
                    type="number" 
                    min="1" 
                    value={depositAmount} 
                    onChange={(e) => setDepositAmount(Number(e.target.value))} 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-lg text-slate-800 dark:text-white outline-none focus:border-brand-500 transition-all" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                  {isAr ? 'طريقة الدفع (مخصصة حسب بلدك)' : 'Payment Method (Geo-Targeted)'}
                </label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    setUploadingReceipt(false);
                    setReceiptFile(null);
                  }} 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-800 dark:text-white outline-none focus:border-brand-500 transition-all cursor-pointer"
                >
                  {isJordanian && (
                    <>
                      <option value="CLIQ">{isAr ? 'كليك (CliQ) - تحويل فوري أردني' : 'CliQ Instant Transfer (Jordan)'}</option>
                      <option value="CARD">{isAr ? 'البطاقة البنكية (Visa / MasterCard)' : 'Bank Card (Visa / MasterCard)'}</option>
                      <option value="BANK_TRANSFER">{isAr ? 'حوالة بنكية يدوية (IBAN)' : 'Bank Transfer (IBAN)'}</option>
                      <option value="CASH_OFFICE">{isAr ? 'إيداع نقدي في مكتب عمان' : 'Cash Deposit at Amman Hub'}</option>
                    </>
                  )}
                  {isAlgerian && (
                    <>
                      <option value="BARIDIMOB">{isAr ? 'بريدي موب (BaridiMob) / البطاقة الذهبية' : 'BaridiMob / Edahabia (Algeria)'}</option>
                      <option value="CARD">{isAr ? 'بطاقة بنكية دولية (CIB / Visa)' : 'Bank Card (CIB / Visa)'}</option>
                      <option value="BANK_TRANSFER">{isAr ? 'حوالة بنكية يدوية (RIB)' : 'Bank Transfer (RIB)'}</option>
                      <option value="CASH_OFFICE">{isAr ? 'إيداع نقدي في مكتب الجزائر' : 'Cash Deposit at Algiers Hub'}</option>
                    </>
                  )}
                  {!isJordanian && !isAlgerian && (
                    <>
                      <option value="CARD">{isAr ? 'البطاقة البنكية (Credit/Debit Card)' : 'Bank Card (Credit/Debit Card)'}</option>
                      <option value="BANK_TRANSFER">{isAr ? 'حوالة بنكية دولية' : 'International Bank Wire'}</option>
                    </>
                  )}
                </select>
              </div>

              {/* Instructions & In-app Receipt Upload */}
              <AnimatePresence>
                {(paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'CLIQ' || paymentMethod === 'BARIDIMOB' || paymentMethod === 'CASH_OFFICE') && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 mt-2 space-y-3">
                      {paymentMethod === 'CASH_OFFICE' ? (
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                          {isAr ? 'يرجى زيارة مكتبنا وتزويد الموظف بالرقم التعريفي الخاص بك لإيداع المبلغ نقداً:' : 'Please visit our hub office and provide your User ID for instant cash deposit:'}
                          <br/>
                          <span className="inline-block mt-2 font-mono text-base font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-3 py-1 rounded-lg border border-brand-200 dark:border-brand-800">
                            {currentUser.id}
                          </span>
                          <br/>
                          <span className="block mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                            {isAr ? '✓ يُشحن الرصيد فوراً عبر جهاز الكاشير في المكتب' : '✓ Top-up is processed immediately by the cashier'}
                          </span>
                        </p>
                      ) : (
                        <>
                          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 space-y-1">
                            {paymentMethod === 'CLIQ' && (
                              <>
                                <p className="font-bold text-slate-800 dark:text-white">
                                  {isAr ? 'يرجى التحويل عبر تطبيق بنكك عبر CliQ إلى المعرف:' : 'Transfer via CliQ to alias:'}
                                </p>
                                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-brand-200 dark:border-brand-900/50 font-mono font-bold text-brand-600 dark:text-brand-400 text-center text-sm">
                                  Alias: THOUESA-PAY
                                </div>
                              </>
                            )}
                            {paymentMethod === 'BARIDIMOB' && (
                              <>
                                <p className="font-bold text-slate-800 dark:text-white">
                                  {isAr ? 'يرجى التحويل عبر تطبيق BaridiMob إلى رقم الـ RIP:' : 'Transfer via BaridiMob to RIP:'}
                                </p>
                                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-brand-200 dark:border-brand-900/50 font-mono font-bold text-brand-600 dark:text-brand-400 text-center text-xs">
                                  RIP: 00799999000123456789
                                </div>
                              </>
                            )}
                            {paymentMethod === 'BANK_TRANSFER' && (
                              <>
                                <p className="font-bold text-slate-800 dark:text-white">
                                  {isAr ? 'يرجى التحويل للحساب البنكي الرسمي:' : 'Transfer to official bank account:'}
                                </p>
                                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-700 dark:text-slate-300 text-center text-xs">
                                  IBAN: JO12 THOU 0000 0001 2345 6789
                                </div>
                              </>
                            )}
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 pt-1">
                              {isAr ? '⚠️ إرفاق صورة إشعار التحويل إلزامي للمطابقة الفورية.' : '⚠️ Uploading receipt screenshot is mandatory for fast audit.'}
                            </p>
                          </div>
                          
                          <button 
                            type="button"
                            onClick={() => {
                              setReceiptFile('receipt_img.jpg');
                              setUploadingReceipt(true);
                              alert(isAr ? 'تم إرفاق صورة إشعار التحويل بنجاح' : 'Receipt uploaded successfully');
                            }}
                            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              uploadingReceipt 
                                ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' 
                                : 'bg-white dark:bg-slate-700 border border-dashed border-brand-300 dark:border-brand-600 text-brand-600 dark:text-brand-400 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20'
                            }`}
                          >
                            {uploadingReceipt ? (
                              <><CheckCircle2 className="w-4 h-4" /> {isAr ? 'تم إرفاق صورة الوصل' : 'Receipt Attached'}</>
                            ) : (
                              <><Upload className="w-4 h-4" /> {isAr ? 'إرفاق صورة الوصل (إلزامي)' : 'Upload Receipt (Mandatory)'}</>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={handleDeposit} 
                disabled={isDepositing || ((paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'CLIQ' || paymentMethod === 'BARIDIMOB') && !uploadingReceipt) || paymentMethod === 'CASH_OFFICE'} 
                className={`w-full py-3.5 text-white font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  paymentMethod === 'CASH_OFFICE' 
                    ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-75' 
                    : 'bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-brand-500/20'
                }`}
              >
                {isDepositing ? (
                  <span className="animate-pulse">{isAr ? 'جاري التحقق والإرسال...' : 'Verifying & Submitting...'}</span>
                ) : (
                  <>
                    {isAr ? 'تأكيد الشحن' : 'Confirm Top-up'}
                    <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Transaction Ledger */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                {isAr ? 'سجل الحركات المرجعي' : 'Transaction Ledger'}
              </h3>
              
              <div className="flex items-center gap-2">
                <select 
                  value={txFilter}
                  onChange={(e) => setTxFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
                >
                  <option value="ALL">{isAr ? 'جميع الحركات' : 'All Transactions'}</option>
                  <option value="DEPOSIT">{isAr ? 'إيداع واسترداد' : 'Deposits & Refunds'}</option>
                  <option value="DEDUCTION">{isAr ? 'خصم ودفع' : 'Deductions & Payments'}</option>
                </select>
                <button className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 bg-brand-50 dark:bg-brand-900/30 px-3 py-1.5 rounded-lg transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isAr ? 'تحميل الكشف' : 'Export'}</span>
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {loadingTx ? (
                <div className="text-center py-8 text-slate-400 font-bold text-sm animate-pulse">
                  {isAr ? 'جاري تحميل المعاملات...' : 'Loading transactions...'}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-10 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed">
                  <p className="text-slate-500 font-medium text-sm">
                    {isAr ? 'لا توجد معاملات مالية مسجلة بعد' : 'No transactions recorded yet'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Data Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                          <th className="pb-3 font-bold">{isAr ? 'رقم الحركة' : 'Txn ID'}</th>
                          <th className="pb-3 font-bold">{isAr ? 'التاريخ' : 'Date'}</th>
                          <th className="pb-3 font-bold">{isAr ? 'البيان' : 'Description'}</th>
                          <th className="pb-3 font-bold">{isAr ? 'المبلغ' : 'Amount'}</th>
                          <th className="pb-3 font-bold">{isAr ? 'الحالة' : 'Status'}</th>
                          <th className="pb-3 font-bold text-right">{isAr ? 'إجراءات' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {transactions
                          .filter(tx => txFilter === 'ALL' || (txFilter === 'DEPOSIT' && tx.amount > 0) || (txFilter === 'DEDUCTION' && tx.amount < 0))
                          .map((tx) => {
                          const isPositive = tx.amount > 0;
                          return (
                            <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                              <td className="py-3">
                                <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{tx.transactionCode}</span>
                              </td>
                              <td className="py-3">
                                <span className="text-xs text-slate-600 dark:text-slate-400">
                                  {new Date(tx.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-JO' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                    isPositive ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-slate-50 dark:bg-slate-800'
                                  }`}>
                                    {getTransactionIcon(tx.type)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                                      {getTransactionLabel(tx.type)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {tx.relatedShipmentId && (
                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-200 dark:border-slate-700">
                                          {tx.relatedShipmentId}
                                        </span>
                                      )}
                                      {tx.note && (
                                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                          tx.type === 'ESCROW_REFUND' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' : 'text-slate-500'
                                        }`}>
                                          {tx.note}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3">
                                <p className={`text-sm font-black ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
                                  {isPositive ? '+' : ''}{formatCurrency(tx.amount, tx.currency as any)}
                                </p>
                              </td>
                              <td className="py-3">
                                <span className={`text-[10px] font-bold flex items-center gap-1 ${
                                  tx.status === 'COMMITTED' ? 'text-emerald-500' : 'text-amber-500'
                                }`}>
                                  {tx.status === 'COMMITTED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                  {tx.status === 'COMMITTED' ? (isAr ? 'مكتمل' : 'Completed') : (isAr ? 'قيد المراجعة' : 'Pending')}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <button 
                                  onClick={() => setSelectedInvoice(tx)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-brand-600 transition-colors inline-flex"
                                >
                                  <Receipt className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards List */}
                  <div className="md:hidden space-y-3">
                    {transactions
                      .filter(tx => txFilter === 'ALL' || (txFilter === 'DEPOSIT' && tx.amount > 0) || (txFilter === 'DEDUCTION' && tx.amount < 0))
                      .map((tx) => {
                      const isPositive = tx.amount > 0;
                      return (
                        <div key={tx.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-brand-200 dark:hover:border-slate-600 hover:shadow-md rounded-2xl flex flex-col gap-3 transition-all">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                isPositive ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-slate-50 dark:bg-slate-800'
                              }`}>
                                {getTransactionIcon(tx.type)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">
                                  {getTransactionLabel(tx.type)}
                                </p>
                                <span className="font-mono text-[10px] text-slate-400">{tx.transactionCode}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-base font-black ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>
                                {isPositive ? '+' : ''}{formatCurrency(tx.amount, tx.currency as any)}
                              </p>
                              <span className={`text-[10px] font-bold flex items-center justify-end gap-1 mt-1 ${
                                tx.status === 'COMMITTED' ? 'text-emerald-500' : 'text-amber-500'
                              }`}>
                                {tx.status === 'COMMITTED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {tx.status === 'COMMITTED' ? (isAr ? 'مكتمل' : 'Completed') : (isAr ? 'قيد المراجعة' : 'Pending')}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/50 pt-3">
                            <div className="flex flex-wrap items-center gap-2">
                              {tx.relatedShipmentId && (
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-200 dark:border-slate-700">
                                  {tx.relatedShipmentId}
                                </span>
                              )}
                              {tx.note && (
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                  tx.type === 'ESCROW_REFUND' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                  {tx.note}
                                </span>
                              )}
                            </div>
                            <button 
                              onClick={() => setSelectedInvoice(tx)}
                              className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-brand-600 transition-colors"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Quick Settle Modal / Bottom Sheet */}
      <AnimatePresence>
        {showQuickSettle && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setShowQuickSettle(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full sm:w-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                  <Sparkles className="w-5 h-5 text-brand-500" />
                  {isAr ? 'تسديد المستحقات السريع' : 'Quick Settle Dues'}
                </h3>
                <button
                  onClick={() => setShowQuickSettle(false)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {isAr ? 'لديك شحنات وصلت إلى وجهتها وبانتظار تسديد الدفعة النهائية والرسوم الجمركية لإتمام التسليم:' : 'You have arrived orders pending final payment and verified customs fees to complete delivery:'}
                </p>
                <div className="space-y-3">
                  {pendingPayments.map(p => {
                    const remaining50 = (p.declaredValue || 0) * 0.5;
                    const customs = p.currentStatus === 'CUSTOMS_HELD' ? 25 : 0;
                    const totalOrderDue = remaining50 + customs;
                    const dueDual = formatDualCurrency(totalOrderDue);
                    return (
                      <div key={p.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-xs font-bold block text-slate-800 dark:text-white font-mono">{p.trackingNumber}</span>
                            <span className="text-[11px] text-slate-500">{isAr ? 'الدفعة النهائية (50%)' : 'Final Installment (50%)'}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-sm text-slate-900 dark:text-white block">{dueDual.primary}</span>
                            <span className="text-[10px] text-slate-400 font-mono">≈ {dueDual.secondary}</span>
                          </div>
                        </div>
                        {customs > 0 && (
                          <div className="flex justify-between items-center text-[11px] text-amber-600 dark:text-amber-400 pt-1 border-t border-slate-200 dark:border-slate-700/50">
                            <span>{isAr ? '+ رسوم جمركية رسمية موثقة' : '+ Official Customs Duty'}</span>
                            <span className="font-bold">{formatDualCurrency(customs).primary}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-xs text-slate-500 dark:text-slate-400 block">{isAr ? 'الإجمالي المطلوب دفعه:' : 'Total Payable:'}</span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      {isAr ? `رصيدك المتاح: ${availableDual.primary}` : `Available Balance: ${availableDual.primary}`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-brand-600 dark:text-brand-400 block">{pendingDual.primary}</span>
                    <span className="text-xs text-slate-400 font-mono">≈ {pendingDual.secondary}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <button
                  onClick={handleQuickSettle}
                  className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-xl text-sm transition-all shadow-lg shadow-brand-500/20 cursor-pointer"
                >
                  {isAr ? 'تأكيد التسديد من الرصيد المتاح' : 'Confirm Payment from Available Balance'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Invoice Modal / Bottom Sheet */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setSelectedInvoice(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full sm:w-[400px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                  <Receipt className="w-5 h-5 text-slate-400" />
                  {isAr ? 'تفاصيل الفاتورة' : 'Invoice Details'}
                </h3>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="text-center">
                  <div className="text-sm text-slate-500 mb-1">{getTransactionLabel(selectedInvoice.type)}</div>
                  <div className={`text-4xl font-black ${selectedInvoice.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                    {formatCurrency(Math.abs(selectedInvoice.amount), selectedInvoice.currency as any)}
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-2">{selectedInvoice.transactionCode}</div>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-slate-500">{isAr ? 'التاريخ' : 'Date'}</span>
                    <span className="font-bold text-slate-800 dark:text-white">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-slate-500">{isAr ? 'الحالة' : 'Status'}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{isAr ? 'مكتمل' : 'Completed'}</span>
                  </div>
                  {selectedInvoice.relatedShipmentId && (
                    <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="text-slate-500">{isAr ? 'الطلب المرتبط' : 'Related Order'}</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-white">{selectedInvoice.relatedShipmentId}</span>
                    </div>
                  )}
                  {selectedInvoice.note && (
                    <div className="flex justify-between pb-2">
                      <span className="text-slate-500">{isAr ? 'ملاحظات' : 'Notes'}</span>
                      <span className="font-medium text-slate-800 dark:text-white text-right max-w-[200px]">{selectedInvoice.note}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="space-y-2">
                  <button
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-500 text-slate-800 dark:text-white font-bold rounded-xl text-sm transition-all"
                  >
                    <Download className="w-4 h-4" />
                    {isAr ? 'تحميل الفاتورة PDF' : 'Download PDF Invoice'}
                  </button>
                  {selectedInvoice.type === 'CUSTOMS_FEE' && (
                    <button
                      className="w-full flex items-center justify-center gap-2 py-3 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 dark:hover:bg-brand-900/50 text-brand-600 dark:text-brand-400 font-bold rounded-xl text-sm transition-all"
                      onClick={() => alert(isAr ? 'جاري فتح الوصل الجمركي الرسمي...' : 'Opening Official Customs Receipt...')}
                    >
                      <Receipt className="w-4 h-4" />
                      {isAr ? 'عرض وصل الجمارك الرسمي' : 'View Official Customs Receipt'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
