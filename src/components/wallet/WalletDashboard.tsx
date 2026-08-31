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
  const isJordanian = currentUser.phone?.startsWith('+962');
  const isAlgerian = currentUser.phone?.startsWith('+213');
  const userCurrency = isJordanian ? 'JOD' : isAlgerian ? 'DZD' : 'USD';
  const currencySymbol = userCurrency === 'JOD' ? 'د.أ' : userCurrency === 'DZD' ? 'د.ج' : '$';
  const secondaryCurrency = isAlgerian ? 'DZD' : 'JOD'; // Just as an example for dual currency
  
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [isDepositing, setIsDepositing] = useState(false);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  
  // Modals state
  const [selectedInvoice, setSelectedInvoice] = useState<LedgerTransaction | null>(null);
  const [showQuickSettle, setShowQuickSettle] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [txFilter, setTxFilter] = useState('ALL');

  // Calculate Reserved Balance (Escrow)
  const reservedBalance = useMemo(() => {
    return shipments
      .filter(s => ['PENDING_HUB_DROPOFF', 'RECEIVED_AT_ORIGIN', 'IN_TRANSIT', 'CUSTOMS_CLEARANCE', 'CUSTOMS_HELD', 'READY_FOR_DELIVERY'].includes(s.currentStatus))
      .reduce((sum, s) => sum + (s.declaredValue || 0) * 0.5, 0); // Assuming 50% escrow
  }, [shipments]);

  // Calculate Pending Payments (Quick Settle)
  const pendingPayments = useMemo(() => {
    return shipments.filter(s => s.currentStatus === 'READY_FOR_DELIVERY' || s.currentStatus === 'CUSTOMS_HELD');
  }, [shipments]);
  
  const totalPendingAmount = pendingPayments.reduce((sum, s) => sum + (s.declaredValue || 0) * 0.5, 0); // Remaining 50%

  useEffect(() => {
    fetchTransactions();
  }, [currentUser.id]);

  const fetchTransactions = async () => {
    setLoadingTx(true);
    // Mocking transactions for UI demonstration based on requirements
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
          note: 'Bank Transfer (Verified)'
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
          note: '50% Deposit for Shipment'
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
          note: isAr ? 'رسوم التخليص الجمركي الرسمية' : 'Official Customs Clearance Fee',
          receiptUrl: 'https://example.com/receipt.jpg'
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
          note: isAr ? 'تعويض مالي - نزاع رقم #DSP-0881' : 'Compensation - Dispute #DSP-0881'
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
          relatedShipmentId: 'SHP-2024-8891',
          note: isAr ? 'استرداد عربون - منتج غير متوفر' : 'Deposit Refund - Item Unavailable'
        }
      ]);
      setLoadingTx(false);
    }, 800);
  };

  const handleDeposit = async () => {
    if (depositAmount <= 0) return;
    setIsDepositing(true);
    
    setTimeout(() => {
      if (paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'INSTANT_TRANSFER') {
        alert(isAr ? 'تم إرسال طلب الشحن وهو قيد المراجعة من الإدارة.' : 'Top-up request sent and is pending review by admin.');
      } else if (paymentMethod === 'CASH_OFFICE') {
        // Handled by UI instructions only
      } else {
        alert(isAr ? 'تم شحن المحفظة بنجاح.' : 'Wallet topped up successfully.');
      }
      setIsDepositing(false);
      setDepositAmount(100);
      setUploadingReceipt(false);
    }, 1500);
  };

  const handleQuickSettle = () => {
    alert(isAr ? 'تم تسديد المستحقات بنجاح.' : 'Dues settled successfully.');
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
            {isAr ? 'إدارة أرصدتك، تسديد المستحقات، وعرض الفواتير بوضوح.' : 'Manage balances, settle dues, and view invoices clearly.'}
          </p>
        </div>
        
        {pendingPayments.length > 0 && (
          <button 
            onClick={() => setShowQuickSettle(true)}
            className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-500/25 animate-pulse"
          >
            <Sparkles className="w-5 h-5" />
            {isAr ? 'تسديد المستحقات السريع' : 'Quick Settle Dues'}
            <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm ml-2">
              {formatCurrency(totalPendingAmount, 'USD')}
            </span>
          </button>
        )}
      </div>

      {/* Smart Balances Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Available Balance */}
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 border border-emerald-800 p-6 rounded-3xl shadow-xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-emerald-400 font-bold tracking-wide uppercase">{isAr ? 'الرصيد المتاح' : 'Available Balance'}</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-3">
              <div className="text-4xl md:text-5xl font-black text-white tracking-tight">
                {wallet ? formatCurrency(wallet.balance, 'USD') : '$0.00'}
              </div>
              {/* Dual Currency Display */}
              <div className="text-sm font-bold text-emerald-400/80">
                ≈ {formatCurrency((wallet?.balance || 0) * 0.71, 'JOD')}
              </div>
            </div>
            <p className="text-xs text-emerald-500/80 mt-2">
              {isAr ? 'المبلغ الحر الجاهز للاستخدام في أي وقت.' : 'Free balance ready to use anytime.'}
            </p>
          </div>
        </div>

        {/* Reserved Balance */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-700/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400 font-bold tracking-wide uppercase">{isAr ? 'الرصيد المحجوز (ضمان)' : 'Reserved Balance (Escrow)'}</span>
              <Lock className="w-5 h-5 text-slate-500" />
            </div>
            <div className="text-3xl md:text-4xl font-black text-white tracking-tight">
              {formatCurrency(reservedBalance, 'USD')}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {isAr ? 'إجمالي المبالغ المخصومة كعربون للطلبات قيد التنفيذ.' : 'Total amounts locked as deposits for ongoing orders.'}
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
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{isAr ? `المبلغ المراد شحنه (${currencySymbol})` : `Top-up Amount (${currencySymbol})`}</label>
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
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{isAr ? 'طريقة الدفع (حسب دولتك)' : 'Payment Method (Geo-Targeted)'}</label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm text-slate-800 dark:text-white outline-none focus:border-brand-500 transition-all cursor-pointer"
                >
                  <option value="CARD">{isAr ? 'البطاقة البنكية (Credit/Debit Card)' : 'Bank Card'}</option>
                  {isJordanian && (
                    <option value="INSTANT_TRANSFER">{isAr ? 'إي فواتيركم / كليك' : 'eFawateerCom / CliQ'}</option>
                  )}
                  {isAlgerian && (
                    <option value="INSTANT_TRANSFER">{isAr ? 'البطاقة الذهبية / بريدي موب' : 'Edahabia / BaridiMob'}</option>
                  )}
                  <option value="BANK_TRANSFER">{isAr ? 'حوالة بنكية يدوية' : 'Manual Bank Transfer'}</option>
                </select>
              </div>

              {/* Instructions & In-app Receipt Upload */}
              <AnimatePresence>
                {(paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'INSTANT_TRANSFER' || paymentMethod === 'CASH_OFFICE') && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 mt-2 space-y-3">
                      {paymentMethod === 'CASH_OFFICE' ? (
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          {isAr ? 'يرجى زيارة مكتبنا وتزويد الموظف بالرقم التعريفي الخاص بك:' : 'Please visit our office and provide your ID to the agent:'}
                          <br/>
                          <span className="inline-block mt-2 font-mono text-lg font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 px-3 py-1 rounded-lg border border-brand-200 dark:border-brand-800">{currentUser.id}</span>
                          <br/>
                          <span className="block mt-2 text-xs">{isAr ? 'سيتم شحن رصيدك فور استلام المبلغ نقداً.' : 'Your balance will be topped up instantly upon cash receipt.'}</span>
                        </p>
                      ) : (
                        <>
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            {paymentMethod === 'INSTANT_TRANSFER' && isJordanian && (
                              <>{isAr ? 'يرجى التحويل عبر كليك (CliQ) إلى المعرف التالي ثم إرفاق الوصل إجبارياً:' : 'Please transfer via CliQ to the following alias and upload receipt (Mandatory):'}<br/><strong className="text-slate-800 dark:text-white block mt-1 text-sm">Alias: THOUESA</strong></>
                            )}
                            {paymentMethod === 'INSTANT_TRANSFER' && isAlgerian && (
                              <>{isAr ? 'يرجى التحويل عبر بريدي موب إلى المعرف التالي ثم إرفاق الوصل إجبارياً:' : 'Please transfer via BaridiMob to the following RIP and upload receipt (Mandatory):'}<br/><strong className="text-slate-800 dark:text-white block mt-1 text-sm">RIP: 007999990000000000</strong></>
                            )}
                            {paymentMethod === 'BANK_TRANSFER' && (
                              <>{isAr ? 'يرجى تحويل المبلغ للحساب البنكي التالي ثم إرفاق الوصل إجبارياً:' : 'Please transfer to the following bank account and upload receipt (Mandatory):'}<br/><strong className="text-slate-800 dark:text-white block mt-1">IBAN: JO12 3456 7890 1234 5678 90</strong></>
                            )}
                          </p>
                          <button 
                            onClick={() => {
                              alert(isAr ? 'تم إرفاق صورة الوصل بنجاح' : 'Receipt uploaded successfully');
                              setUploadingReceipt(true);
                            }}
                            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors ${uploadingReceipt ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' : 'bg-white dark:bg-slate-700 border border-dashed border-brand-300 dark:border-brand-600 text-brand-600 dark:text-brand-400 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20'}`}
                          >
                            {uploadingReceipt ? (
                              <><CheckCircle2 className="w-4 h-4" /> {isAr ? 'تم إرفاق الوصل' : 'Receipt Uploaded'}</>
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
                disabled={isDepositing || ((paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'INSTANT_TRANSFER') && !uploadingReceipt) || paymentMethod === 'CASH_OFFICE'} 
                className={`w-full py-3.5 text-white font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 ${paymentMethod === 'CASH_OFFICE' ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 disabled:opacity-50'}`}
              >
                {isDepositing ? (
                  <span className="animate-pulse">{isAr ? 'جاري التنفيذ...' : 'Processing...'}</span>
                ) : (
                  <>
                    {isAr ? 'متابعة الدفع' : 'Proceed to Payment'}
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
                  {isAr ? 'لديك طلبات وصلت وبانتظار دفع النصف المتبقي لإتمام التسليم:' : 'You have arrived orders pending final payment to complete delivery:'}
                </p>
                <div className="space-y-3">
                  {pendingPayments.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-sm font-bold block text-slate-800 dark:text-white">Order {p.trackingNumber}</span>
                        <span className="text-xs text-slate-500">{isAr ? 'الدفعة النهائية' : 'Final Payment'}</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{formatCurrency((p.declaredValue || 0) * 0.5, 'USD')}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-slate-600 dark:text-slate-400">{isAr ? 'الإجمالي المطلوب:' : 'Total Required:'}</span>
                  <span className="text-2xl font-black text-brand-600 dark:text-brand-400">{formatCurrency(totalPendingAmount, 'USD')}</span>
                </div>
              </div>
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <button
                  onClick={handleQuickSettle}
                  className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-xl text-sm transition-all"
                >
                  {isAr ? 'دفع من المحفظة المتاحة' : 'Pay from Available Balance'}
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
