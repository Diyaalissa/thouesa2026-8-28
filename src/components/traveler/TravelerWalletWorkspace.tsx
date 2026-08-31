import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Lock, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Download, 
  FileText, 
  DollarSign, 
  RefreshCw, 
  Building, 
  CreditCard, 
  Send, 
  HelpCircle, 
  X, 
  Plus, 
  Trash2, 
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Calculator
} from 'lucide-react';
import { EscrowWallet, FinancialTransaction, Currency } from '../../types';

interface TravelerWalletWorkspaceProps {
  wallet: EscrowWallet | null;
  transactions?: FinancialTransaction[];
  locale?: string;
  onWithdrawEarnings: (amount: number, destination: string) => Promise<boolean>;
  onRefreshData?: () => void;
  onNavigateToDeposits?: () => void;
}

// Exchange rates relative to USD (USD Base)
const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1.0,
  JOD: 0.709,
  DZD: 134.50,
  SAR: 3.75,
  EGP: 48.50,
};

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  JOD: 'د.أ JOD',
  DZD: 'د.ج DZD',
  SAR: 'ر.س SAR',
  EGP: 'ج.م EGP',
};

export interface BankAccountItem {
  id: string;
  type: 'IBAN' | 'CCP' | 'WALLET' | 'CASH_BRANCH';
  label: string;
  accountNumber: string;
  beneficiaryName: string;
  bankName?: string;
  isDefault?: boolean;
}

export const TravelerWalletWorkspace: React.FC<TravelerWalletWorkspaceProps> = ({
  wallet,
  transactions = [],
  locale = 'ar',
  onWithdrawEarnings,
  onRefreshData,
  onNavigateToDeposits,
}) => {
  const isAr = locale === 'ar';

  // 1. Currency Display State (USD, JOD, DZD)
  const [activeDisplayCurrency, setActiveDisplayCurrency] = useState<Currency>('USD');
  const [activeMobileCardIndex, setActiveMobileCardIndex] = useState<0 | 1>(0);

  // 2. Modals State
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedTxnForReceipt, setSelectedTxnForReceipt] = useState<FinancialTransaction | null>(null);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeTxn, setDisputeTxn] = useState<FinancialTransaction | null>(null);
  const [disputeReason, setDisputeReason] = useState('CALCULATION_ERROR');
  const [disputeNote, setDisputeNote] = useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [disputeSuccessMsg, setDisputeSuccessMsg] = useState(false);

  // Bank Accounts Management State
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<BankAccountItem[]>([
    {
      id: 'acc-1',
      type: 'IBAN',
      label: isAr ? 'البنك العربي - الأردن (IBAN)' : 'Arab Bank Jordan (IBAN)',
      accountNumber: 'JO88 ARAB 0120 0000 0012 3456 7890 01',
      beneficiaryName: 'أحمد مسافر الأردني',
      bankName: 'Arab Bank PLC',
      isDefault: true,
    },
    {
      id: 'acc-2',
      type: 'CCP',
      label: isAr ? 'بريد الجزائر (CCP Algérie Poste)' : 'Algérie Poste (CCP)',
      accountNumber: '0012345678 Clé 45',
      beneficiaryName: 'أحمد مسافر',
      bankName: 'Algérie Poste',
      isDefault: false,
    },
    {
      id: 'acc-3',
      type: 'CASH_BRANCH',
      label: isAr ? 'استلام نقدي فوري من صندوق الفرع' : 'Instant Cash from Branch Treasury',
      accountNumber: isAr ? 'تسليم فوري عند مكتب الوصول' : 'Direct payout at arrival hub desk',
      beneficiaryName: 'استلام بالهوية / جواز السفر',
      bankName: 'THOUESA Hub Desk',
      isDefault: false,
    }
  ]);

  const [newAccountType, setNewAccountType] = useState<'IBAN' | 'CCP' | 'WALLET' | 'CASH_BRANCH'>('IBAN');
  const [newAccountLabel, setNewAccountLabel] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newBeneficiaryName, setNewBeneficiaryName] = useState('');
  const [newBankName, setNewBankName] = useState('');

  // Withdraw Form State
  const [withdrawAmount, setWithdrawAmount] = useState<number>(wallet ? Math.min(wallet.balance, 100) : 50);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('acc-1');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawSuccessBanner, setWithdrawSuccessBanner] = useState(false);

  // Currency Converter State
  const [calcInputAmount, setCalcInputAmount] = useState<number>(100);
  const [calcFromCurrency, setCalcFromCurrency] = useState<Currency>('USD');
  const [calcToCurrency, setCalcToCurrency] = useState<Currency>('JOD');

  // Filter & Search in Transaction History
  const [txnFilterType, setTxnFilterType] = useState<string>('ALL');
  const [txnSearchQuery, setTxnSearchQuery] = useState('');

  // Default sample transactions if none provided
  const sampleTransactions: FinancialTransaction[] = useMemo(() => {
    if (transactions && transactions.length > 0) return transactions;
    return [
      {
        id: 'txn-demo-01',
        transactionCode: 'TXN-EARN-2026-9021',
        walletId: wallet?.id || 'w-sample-01',
        userId: 'usr-traveler-01',
        userName: 'أحمد مسافر',
        type: 'TRAVELER_PAYOUT',
        amount: 182.40,
        currency: 'USD',
        exchangeRateToUsd: 1.0,
        localCurrencyAmount: 129.32,
        idempotencyKey: 'idemp-earning-9021',
        status: 'COMMITTED',
        tripId: 'trip-amm-alg-0824',
        referenceNote: isAr 
          ? 'عمولة نقل 7.6 كغ (رحلة عمان - الجزائر RJ-701) + تحرير ضمان العهدة' 
          : 'Trip earnings 7.6kg (Amman-Algiers RJ-701) + Escrow release',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'txn-demo-02',
        transactionCode: 'TXN-ESC-RELEASE-8812',
        walletId: wallet?.id || 'w-sample-01',
        userId: 'usr-traveler-01',
        userName: 'أحمد مسافر',
        type: 'ESCROW_RELEASE',
        amount: 380.00,
        currency: 'USD',
        exchangeRateToUsd: 1.0,
        localCurrencyAmount: 269.42,
        idempotencyKey: 'idemp-escrow-8812',
        status: 'COMMITTED',
        tripId: 'trip-amm-alg-0824',
        referenceNote: isAr ? 'استرداد ضمان العهدة بالكامل بعد مطابقة أختام الطرود بنجاح' : 'Full Escrow refund released after successful delivery',
        createdAt: new Date(Date.now() - 3600000 * 4.2).toISOString(),
      },
      {
        id: 'txn-demo-03',
        transactionCode: 'TXN-WITHDRAW-7721',
        walletId: wallet?.id || 'w-sample-01',
        userId: 'usr-traveler-01',
        userName: 'أحمد مسافر',
        type: 'HUB_FEE',
        amount: -150.00,
        currency: 'USD',
        exchangeRateToUsd: 1.0,
        localCurrencyAmount: -106.35,
        idempotencyKey: 'idemp-wd-7721',
        status: 'COMMITTED',
        referenceNote: isAr ? 'سحب نقدي فوري من صندوق فرع عمان (وصل إشعار #882)' : 'Instant cash withdrawal from Amman Branch Treasury',
        createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
      },
      {
        id: 'txn-demo-04',
        transactionCode: 'TXN-ESC-HOLD-6610',
        walletId: wallet?.id || 'w-sample-01',
        userId: 'usr-traveler-01',
        userName: 'أحمد مسافر',
        type: 'ESCROW_LOCK',
        amount: 500.00,
        currency: 'USD',
        exchangeRateToUsd: 1.0,
        localCurrencyAmount: 354.50,
        idempotencyKey: 'idemp-lock-6610',
        status: 'PENDING',
        tripId: 'trip-active-02',
        referenceNote: isAr ? 'حجز ضمان العهدة لرحلة الغد (عمان ✈️ الجزائر)' : 'Escrow security hold for active flight manifest',
        createdAt: new Date(Date.now() - 3600000 * 50).toISOString(),
      }
    ];
  }, [transactions, wallet, isAr]);

  // Balance conversion helper
  const convertAmount = (amountUsd: number, targetCurrency: Currency): number => {
    const rate = EXCHANGE_RATES[targetCurrency] || 1.0;
    return amountUsd * rate;
  };

  const formatConverted = (amountUsd: number, targetCurrency: Currency): string => {
    const converted = convertAmount(amountUsd, targetCurrency);
    if (targetCurrency === 'DZD') {
      return `${converted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${CURRENCY_SYMBOLS[targetCurrency]}`;
    }
    if (targetCurrency === 'JOD') {
      return `${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${CURRENCY_SYMBOLS[targetCurrency]}`;
    }
    return `$${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return sampleTransactions.filter((txn) => {
      if (txnFilterType === 'EARNINGS' && txn.type !== 'TRAVELER_PAYOUT') return false;
      if (txnFilterType === 'ESCROW' && !['ESCROW_LOCK', 'ESCROW_RELEASE'].includes(txn.type)) return false;
      if (txnFilterType === 'WITHDRAWALS' && !['HUB_FEE', 'REFUND'].includes(txn.type)) return false;
      
      if (txnSearchQuery) {
        const query = txnSearchQuery.toLowerCase();
        const matchesCode = txn.transactionCode.toLowerCase().includes(query);
        const matchesNote = txn.referenceNote.toLowerCase().includes(query);
        return matchesCode || matchesNote;
      }
      return true;
    });
  }, [sampleTransactions, txnFilterType, txnSearchQuery]);

  // Withdraw submit handler
  const handleExecuteWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || wallet.balance < withdrawAmount || withdrawAmount <= 0) return;

    setIsWithdrawing(true);
    const selectedAcc = savedAccounts.find(a => a.id === selectedAccountId);
    const destinationDesc = selectedAcc 
      ? `${selectedAcc.label} (${selectedAcc.accountNumber})` 
      : 'Default Account';

    const success = await onWithdrawEarnings(withdrawAmount, destinationDesc);
    setIsWithdrawing(false);

    if (success) {
      setIsWithdrawModalOpen(false);
      setWithdrawSuccessBanner(true);
      if (onRefreshData) onRefreshData();
      setTimeout(() => setWithdrawSuccessBanner(false), 6000);
    }
  };

  // Add Account submit handler
  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountLabel || !newAccountNumber) return;

    const newAcc: BankAccountItem = {
      id: `acc-${Date.now()}`,
      type: newAccountType,
      label: newAccountLabel,
      accountNumber: newAccountNumber,
      beneficiaryName: newBeneficiaryName || (isAr ? 'حساب المسافر' : 'Traveler Account'),
      bankName: newBankName || 'Bank',
      isDefault: savedAccounts.length === 0,
    };

    setSavedAccounts([...savedAccounts, newAcc]);
    setSelectedAccountId(newAcc.id);
    setIsAddAccountModalOpen(false);
    setNewAccountLabel('');
    setNewAccountNumber('');
    setNewBeneficiaryName('');
    setNewBankName('');
  };

  // Remove Account
  const handleRemoveAccount = (id: string) => {
    if (savedAccounts.length <= 1) return;
    setSavedAccounts(savedAccounts.filter(a => a.id !== id));
    if (selectedAccountId === id) {
      const remaining = savedAccounts.filter(a => a.id !== id);
      if (remaining.length > 0) setSelectedAccountId(remaining[0].id);
    }
  };

  // Submit dispute handler
  const handleSubmitDispute = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingDispute(true);
    setTimeout(() => {
      setIsSubmittingDispute(false);
      setDisputeSuccessMsg(true);
      setTimeout(() => {
        setDisputeSuccessMsg(false);
        setIsDisputeModalOpen(false);
        setDisputeNote('');
      }, 2500);
    }, 900);
  };

  // Export PDF statement mock
  const handleExportStatement = () => {
    alert(isAr 
      ? '📄 جاري توليد كشف الحساب المالي المعتمد لعام 2026 بصيغة PDF وتنزيله...' 
      : '📄 Generating certified 2026 financial statement PDF...'
    );
  };

  // Converter calculation
  const calculatedOutput = useMemo(() => {
    const inUsd = calcInputAmount / (EXCHANGE_RATES[calcFromCurrency] || 1);
    const outAmount = inUsd * (EXCHANGE_RATES[calcToCurrency] || 1);
    return outAmount;
  }, [calcInputAmount, calcFromCurrency, calcToCurrency]);

  const availableBalanceUsd = wallet?.balance ?? 362.40;
  const lockedEscrowUsd = wallet?.lockedEscrowDeposit ?? 500.00;
  const pendingEarningsUsd = wallet?.pendingEarnings ?? 182.40;

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Success Notification Banner */}
      <AnimatePresence>
        {withdrawSuccessBanner && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-900 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">
                  {isAr ? 'تم استلام طلب السحب بنجاح 💸' : 'Withdrawal Request Submitted Successfully'}
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  {isAr 
                    ? 'تم تسجيل المعاملة وأرسلت تفاصيل الحوالة إلى هاتفك وإلى بريدك الإلكتروني.'
                    : 'The payout has been initiated. Tracking and reference codes have been sent.'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setWithdrawSuccessBanner(false)}
              className="text-emerald-700 hover:text-emerald-900 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar with Currency Toggle & Export PDF */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-teal-400 flex items-center justify-center shadow-xs">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">
              {isAr ? 'محفظة المسافر والمركز المالي' : 'Traveler Financial Center'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAr 
                ? 'فصل دقيق وشفاف بنسبة 100% بين أرباح الرحلات وأموال الضمان المستردة' 
                : '100% Transparent separation of trip earnings and refundable escrow'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Smart Currency Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {isAr ? 'عرض بـ:' : 'Display in:'}
            </span>
            {(['USD', 'JOD', 'DZD'] as Currency[]).map((curr) => (
              <button
                key={curr}
                onClick={() => setActiveDisplayCurrency(curr)}
                className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all ${
                  activeDisplayCurrency === curr
                    ? 'bg-white text-slate-900 shadow-xs scale-102 font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {curr === 'USD' ? '$ USD' : curr === 'JOD' ? '🇯🇴 JOD' : '🇩🇿 DZD'}
              </button>
            ))}
          </div>

          {/* Export Statement PDF */}
          <button
            onClick={handleExportStatement}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            title={isAr ? 'تصدير كشف حساب PDF' : 'Export Statement'}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? 'كشف حساب' : 'Statement'}</span>
          </button>
        </div>
      </div>

      {/* 1. Multi-Currency Balance Dashboard */}
      {/* Mobile Swipe / Tabs for Cards */}
      <div className="md:hidden flex gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveMobileCardIndex(0)}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeMobileCardIndex === 0 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
          }`}
        >
          🟢 {isAr ? 'الرصيد المتاح' : 'Available Balance'}
        </button>
        <button
          onClick={() => setActiveMobileCardIndex(1)}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeMobileCardIndex === 1 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
          }`}
        >
          🟠 {isAr ? 'الرصيد المعلق والضمان' : 'Pending & Escrow'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Available Balance (🟢) */}
        <div className={`rounded-3xl p-6 bg-slate-900 text-white border border-slate-800 relative overflow-hidden shadow-sm flex flex-col justify-between ${
          activeMobileCardIndex === 1 ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {isAr ? 'الرصيد المتاح للسحب الفوري' : 'Available Balance (Ready for Payout)'}
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-teal-300 border border-slate-700">
                {isAr ? 'جاهز 100%' : '100% Unlocked'}
              </span>
            </div>

            <div>
              <div className="text-4xl font-black text-emerald-400 tracking-tight">
                {formatConverted(availableBalanceUsd, activeDisplayCurrency)}
              </div>
              
              {/* Secondary Local Equivalents */}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-bold text-slate-400">
                {activeDisplayCurrency !== 'USD' && (
                  <span className="bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
                    💵 ${availableBalanceUsd.toFixed(2)} USD
                  </span>
                )}
                {activeDisplayCurrency !== 'JOD' && (
                  <span className="bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
                    🇯🇴 {(availableBalanceUsd * EXCHANGE_RATES.JOD).toFixed(2)} JOD
                  </span>
                )}
                {activeDisplayCurrency !== 'DZD' && (
                  <span className="bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
                    🇩🇿 {(availableBalanceUsd * EXCHANGE_RATES.DZD).toLocaleString('en-US', { maximumFractionDigits: 0 })} DZD
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-400 border-t border-slate-800 pt-3">
              {isAr 
                ? 'يشمل صافي عمولات الرحلات المكتملة ومبالغ الضمان المحررة بالكامل بدون أي خصومات خفية.' 
                : 'Includes net earnings from completed trips and fully released escrow guarantees.'}
            </p>
          </div>

          <div className="relative z-10 pt-5 mt-4 border-t border-slate-800/80 flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsWithdrawModalOpen(true)}
              className="flex-1 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{isAr ? 'طلب سحب فوري 💸' : 'Request Instant Payout 💸'}</span>
            </motion.button>

            <button
              onClick={() => setIsAddAccountModalOpen(true)}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
              title={isAr ? 'إدارة طرق السحب والحسابات' : 'Manage Payout Accounts'}
            >
              <CreditCard className="w-4 h-4 text-teal-400" />
              <span className="hidden sm:inline">{isAr ? 'الحسابات' : 'Accounts'}</span>
            </button>
          </div>
        </div>

        {/* Card 2: Pending / Escrow Balance (🟠) */}
        <div className={`rounded-3xl p-6 bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-900 text-white border border-amber-500/30 relative overflow-hidden shadow-sm flex flex-col justify-between ${
          activeMobileCardIndex === 0 ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                  {isAr ? 'الرصيد المعلق والضمان في العهدة' : 'Pending & Active Escrow Hold'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Lock className="w-3 h-3" />
                <span>{isAr ? 'مؤمّن ومحجوز' : 'Protected Hold'}</span>
              </div>
            </div>

            <div>
              <div className="text-4xl font-black text-amber-400 tracking-tight">
                {formatConverted(lockedEscrowUsd + pendingEarningsUsd, activeDisplayCurrency)}
              </div>

              {/* Breakdown in Pill Badges */}
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="p-2.5 bg-slate-800/90 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    {isAr ? 'مبلغ الضمان المسترد المودع:' : 'Refundable Escrow Hold:'}
                  </span>
                  <span className="text-sm font-black text-slate-100">
                    {formatConverted(lockedEscrowUsd, activeDisplayCurrency)}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-800/90 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    {isAr ? 'أرباح الرحلة المتوقعة:' : 'Pending Trip Earnings:'}
                  </span>
                  <span className="text-sm font-black text-teal-400">
                    {formatConverted(pendingEarningsUsd, activeDisplayCurrency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Absolute Trust Note */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-200/90 leading-relaxed font-medium">
                <p>
                  {isAr 
                    ? '✨ يُحرر فوراً إلى رصيدك المتاح بمجرد تسليم الطرود وفحص الأختام في مكتب الوصول.' 
                    : '✨ Automatically released to your Available Balance the moment packages are scanned at the arrival hub desk.'}
                </p>
                {onNavigateToDeposits && (
                  <button
                    onClick={onNavigateToDeposits}
                    className="mt-2 text-xs font-bold text-amber-300 hover:text-white underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isAr ? 'عرض سجل الضمانات وسندات الأمانة 📋' : 'View Security Deposits & Trust Bonds 📋'}</span>
                    <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 mt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>{isAr ? 'حالة العهدة الحالية:' : 'Active Custody Status:'}</span>
            <span className="font-bold text-amber-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {isAr ? 'رحلة مجدولة قيد المطابقة' : 'Scheduled & Monitored'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Split Desktop View: Left (Ledger & Disputes) | Right (Converter & Payment Methods) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* RIGHT COLUMN: Interactive Currency Converter & Saved Payout Methods */}
        <div className="space-y-6 lg:order-2">
          {/* Smart Currency Converter Widget */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Calculator className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-slate-900">
                  {isAr ? 'محول العملات الذكي' : 'Smart Currency Converter'}
                </h3>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md">
                {isAr ? 'أسعار الصرف الرسمية' : 'Live Fixed Rates'}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              {isAr 
                ? 'احسب قيمة الضمان أو الأرباح بالعملة المحلية لتجهيزها نقداً قبل التوجه للفرع.' 
                : 'Calculate your exact escrow or cash payout in local currency before visiting the hub.'}
            </p>

            <div className="space-y-3">
              {/* Input Amount */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {isAr ? 'المبلغ المراد تحويله:' : 'Amount to Convert:'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={calcInputAmount}
                    onChange={(e) => setCalcInputAmount(Math.max(0, Number(e.target.value)))}
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 text-sm focus:bg-white focus:border-teal-500 focus:outline-hidden"
                  />
                  <select
                    value={calcFromCurrency}
                    onChange={(e) => setCalcFromCurrency(e.target.value as Currency)}
                    className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:outline-hidden"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="JOD">JOD (🇯🇴 د.أ)</option>
                    <option value="DZD">DZD (🇩🇿 د.ج)</option>
                    <option value="SAR">SAR (🇸🇦 ر.س)</option>
                    <option value="EGP">EGP (🇪🇬 ج.م)</option>
                  </select>
                </div>
              </div>

              {/* Conversion Result Box */}
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    {isAr ? 'المعادل الفوري المستحق:' : 'Calculated Equivalent:'}
                  </span>
                  <span className="text-xl font-black text-teal-400">
                    {calcToCurrency === 'DZD' 
                      ? `${calculatedOutput.toLocaleString('en-US', { maximumFractionDigits: 0 })} د.ج DZD`
                      : calcToCurrency === 'JOD'
                      ? `${calculatedOutput.toFixed(2)} د.أ JOD`
                      : calcToCurrency === 'SAR'
                      ? `${calculatedOutput.toFixed(2)} ر.س SAR`
                      : calcToCurrency === 'EGP'
                      ? `${calculatedOutput.toFixed(2)} ج.م EGP`
                      : `$${calculatedOutput.toFixed(2)} USD`
                    }
                  </span>
                </div>

                <select
                  value={calcToCurrency}
                  onChange={(e) => setCalcToCurrency(e.target.value as Currency)}
                  className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-xl p-2 focus:outline-hidden"
                >
                  <option value="JOD">🇯🇴 JOD</option>
                  <option value="DZD">🇩🇿 DZD</option>
                  <option value="USD">🇺🇸 USD</option>
                  <option value="SAR">🇸🇦 SAR</option>
                  <option value="EGP">🇪🇬 EGP</option>
                </select>
              </div>
            </div>
          </div>

          {/* Saved Payout Methods Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="font-black text-sm text-slate-900">
                  {isAr ? 'طرق الاستلام المعتمدة' : 'Payout Methods'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddAccountModalOpen(true)}
                className="text-teal-600 hover:text-teal-700 font-black text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة حساب' : 'Add Method'}</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {savedAccounts.map((acc) => (
                <div 
                  key={acc.id}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-700 font-bold text-xs">
                      {acc.type === 'IBAN' ? '🏦' : acc.type === 'CCP' ? '📮' : acc.type === 'CASH_BRANCH' ? '💵' : '💳'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 truncate">{acc.label}</span>
                        {acc.isDefault && (
                          <span className="text-[9px] font-black bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded-md">
                            {isAr ? 'افتراضي' : 'Default'}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 block truncate">
                        {acc.accountNumber}
                      </span>
                    </div>
                  </div>

                  {savedAccounts.length > 1 && (
                    <button
                      onClick={() => handleRemoveAccount(acc.id)}
                      className="text-slate-400 hover:text-rose-500 p-1.5 transition-colors cursor-pointer"
                      title={isAr ? 'حذف الحساب' : 'Remove Account'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Instant Cash Info */}
            <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-start gap-2">
              <span className="text-base leading-none">⚡</span>
              <p className="text-[11px] leading-relaxed">
                {isAr 
                  ? 'يمكنك دائماً استلام أرباحك وضمانك فوراً نقداً من صندوق فرع الوصول بمجرد مسح وتسليم الطرود.' 
                  : 'You can always collect cash payouts instantly from the arrival hub treasury upon package handover.'}
              </p>
            </div>
          </div>
        </div>

        {/* LEFT COLUMN: Transparent Transactions Ledger (2 cols width on desktop) */}
        <div className="lg:col-span-2 space-y-4 lg:order-1">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            {/* Ledger Header & Search Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>{isAr ? 'سجل العمليات والشفافية المالية' : 'Financial Ledger & Receipts'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr 
                    ? 'انقر على أي عملية لعرض الفاتورة التفصيلية، حسابة الكيلوغرامات، أو رفع اعتراض' 
                    : 'Click on any transaction to view detailed receipt calculation or dispute'}
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto w-full sm:w-auto">
                <button
                  onClick={() => setTxnFilterType('ALL')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap transition-colors ${
                    txnFilterType === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {isAr ? 'الكل' : 'All'}
                </button>
                <button
                  onClick={() => setTxnFilterType('EARNINGS')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap transition-colors ${
                    txnFilterType === 'EARNINGS' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🟢 {isAr ? 'أرباح الرحلات' : 'Earnings'}
                </button>
                <button
                  onClick={() => setTxnFilterType('ESCROW')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap transition-colors ${
                    txnFilterType === 'ESCROW' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🔒 {isAr ? 'الضمانات' : 'Escrow'}
                </button>
                <button
                  onClick={() => setTxnFilterType('WITHDRAWALS')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap transition-colors ${
                    txnFilterType === 'WITHDRAWALS' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  💸 {isAr ? 'السحوبات' : 'Payouts'}
                </button>
              </div>
            </div>

            {/* Transactions List */}
            <div className="divide-y divide-slate-100">
              {filteredTransactions.map((txn) => {
                const isPositive = txn.amount > 0;
                const isEscrow = txn.type === 'ESCROW_LOCK' || txn.type === 'ESCROW_RELEASE';
                const isEarnings = txn.type === 'TRAVELER_PAYOUT';

                return (
                  <motion.div
                    key={txn.id}
                    whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.9)' }}
                    onClick={() => setSelectedTxnForReceipt(txn)}
                    className="py-3.5 px-2 -mx-2 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                        isEarnings
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : isEscrow
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                      }`}>
                        {isEarnings ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : isEscrow ? (
                          <Lock className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-slate-900 truncate">
                            {txn.referenceNote}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded-md shrink-0">
                            {txn.transactionCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{new Date(txn.createdAt).toLocaleDateString(isAr ? 'ar-JO' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          <span>•</span>
                          <span className={txn.status === 'COMMITTED' ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                            {txn.status === 'COMMITTED' ? (isAr ? 'مكتملة ومحررة' : 'Committed') : (isAr ? 'معلقة قيد الرحلة' : 'Pending Flight')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-end shrink-0 flex items-center gap-3">
                      <div>
                        <div className={`text-sm font-black ${
                          isPositive ? 'text-emerald-600' : 'text-slate-900'
                        }`}>
                          {isPositive ? '+' : ''}{formatConverted(Math.abs(txn.amount), activeDisplayCurrency)}
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          ${Math.abs(txn.amount).toFixed(2)} USD
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 transition-colors rtl:rotate-180" />
                    </div>
                  </motion.div>
                );
              })}

              {filteredTransactions.length === 0 && (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs">{isAr ? 'لا توجد معاملات مطابقة في السجل المالي.' : 'No matching transactions found.'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Pop-up Receipt Modal (Transparent Breakdown & Dispute Option) */}
      <AnimatePresence>
        {selectedTxnForReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              {/* Receipt Header */}
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">
                      {isAr ? 'فاتورة الحساب المالي المعتمدة' : 'Official Financial Receipt'}
                    </h3>
                    <span className="text-[10px] font-mono text-teal-300">
                      {selectedTxnForReceipt.transactionCode}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTxnForReceipt(null)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Receipt Content */}
              <div className="p-6 space-y-5 text-xs">
                {/* Total Value Pill */}
                <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-bold block mb-1">
                    {isAr ? 'إجمالي المبلغ المحرر / المحول' : 'Total Committed Amount'}
                  </span>
                  <div className="text-3xl font-black text-slate-900">
                    {selectedTxnForReceipt.amount > 0 ? '+' : ''}
                    {formatConverted(Math.abs(selectedTxnForReceipt.amount), activeDisplayCurrency)}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 mt-0.5 block">
                    (${Math.abs(selectedTxnForReceipt.amount).toFixed(2)} USD Ref)
                  </span>
                </div>

                {/* Detailed Breakdown Calculation */}
                <div className="space-y-2.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                  <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-wider mb-2">
                    {isAr ? 'تفاصيل الحسبة والمعايير المالية:' : 'Calculation Formula & Parameters:'}
                  </h4>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>{isAr ? 'الوزن الإجمالي المشحون:' : 'Total Manifest Weight:'}</span>
                    <span className="font-bold text-slate-900 font-mono">7.60 kg</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>{isAr ? 'عمولة الكيلوغرام المتفق عليها:' : 'Agreed Rate per Kg:'}</span>
                    <span className="font-bold text-slate-900 font-mono">$24.00 / kg</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600 border-t border-slate-200 pt-2">
                    <span>{isAr ? 'صافي أرباح الرحلة:' : 'Net Trip Earnings:'}</span>
                    <span className="font-black text-emerald-600 font-mono">$182.40 USD</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>{isAr ? 'حركة الضمان المالي (Escrow):' : 'Escrow Hold Movement:'}</span>
                    <span className="font-black text-teal-600 font-mono">
                      {selectedTxnForReceipt.type === 'ESCROW_RELEASE' ? '+$380.00 USD (محرر بالكامل)' : 'محرر للرصيد'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-900 font-black border-t border-slate-200 pt-2 text-xs">
                    <span>{isAr ? 'الإجمالي النهائي المحرر:' : 'Total Released to Balance:'}</span>
                    <span className="text-teal-600 font-mono">
                      {formatConverted(Math.abs(selectedTxnForReceipt.amount), activeDisplayCurrency)}
                    </span>
                  </div>
                </div>

                {/* Metadata info */}
                <div className="space-y-1.5 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span>{isAr ? 'رمز المطابقة المشفر (Idempotency):' : 'Idempotency Reference:'}</span>
                    <span className="font-mono text-slate-700">{selectedTxnForReceipt.idempotencyKey}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isAr ? 'تاريخ ووقت المعاملة:' : 'Timestamp:'}</span>
                    <span className="font-mono text-slate-700">
                      {new Date(selectedTxnForReceipt.createdAt).toLocaleString(isAr ? 'ar-JO' : 'en-US')}
                    </span>
                  </div>
                </div>

                {/* Dispute Button */}
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => {
                      setDisputeTxn(selectedTxnForReceipt);
                      setSelectedTxnForReceipt(null);
                      setIsDisputeModalOpen(true);
                    }}
                    className="flex-1 py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>{isAr ? 'الاعتراض المالي (فتح تذكرة تدقيق) ⚠️' : 'Report Discrepancy ⚠️'}</span>
                  </button>

                  <button
                    onClick={() => setSelectedTxnForReceipt(null)}
                    className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    {isAr ? 'إغلاق' : 'Close'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Financial Dispute Ticket Modal (Report Discrepancy) */}
      <AnimatePresence>
        {isDisputeModalOpen && disputeTxn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="bg-amber-500 text-slate-950 p-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm">
                      {isAr ? 'فتح تذكرة اعتراض مالي فوري' : 'Financial Dispute Ticket'}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-900 font-bold">
                      {disputeTxn.transactionCode}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsDisputeModalOpen(false)}
                  className="text-slate-900 hover:text-slate-950 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {disputeSuccessMsg ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-black text-slate-900">
                    {isAr ? 'تم استلام طلب الاعتراض المالي!' : 'Dispute Submitted to Finance Desk'}
                  </h4>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    {isAr 
                      ? 'تم تعيين رقم تذكرة (#DSP-8812) وتوجيهها لمدير الخزينة للتدقيق ومطابقة أوزان الطرود خلال ساعتين.'
                      : 'Ticket #DSP-8812 assigned. Treasury desk will audit weight logs and recalculate within 2 hours.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitDispute} className="p-6 space-y-4 text-xs">
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                    {isAr 
                      ? '📌 تضمن منصة THOUESA مراجعة فورية ومباشرة مع سجلات الأختام الرقمية وموازين الفروع لحفظ حق المسافر كاملاً.' 
                      : 'THOUESA guarantees direct audit against certified branch weight scales and digital seals to protect your earnings.'}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isAr ? 'نوع الاعتراض المالي:' : 'Discrepancy Category:'}
                    </label>
                    <select
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                    >
                      <option value="CALCULATION_ERROR">{isAr ? 'خطأ في احتساب وزن الكيلوغرامات أو العمولة' : 'Weight or rate calculation error'}</option>
                      <option value="ESCROW_NOT_RELEASED">{isAr ? 'نقص أو تأخر في تحرير مبلغ الضمان المسترد' : 'Escrow refund missing or delayed'}</option>
                      <option value="CURRENCY_CONVERSION">{isAr ? 'اختلاف في سعر الصرف المعتمد' : 'Exchange rate conversion issue'}</option>
                      <option value="OTHER">{isAr ? 'سبب مالي آخر' : 'Other financial query'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isAr ? 'شرح الملاحظة والمطالبة المالية:' : 'Detailed Notes & Claim:'}
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={disputeNote}
                      onChange={(e) => setDisputeNote(e.target.value)}
                      placeholder={isAr ? 'مثال: الوزن الإجمالي للطرود كان 8.5 كغ وليس 7.6 كغ، يرجى مراجعة وصل وزن الفرع...' : 'Provide specific details regarding weight scale or expected payout...'}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={isSubmittingDispute || !disputeNote.trim()}
                      className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmittingDispute ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{isAr ? 'جارِ الإرسال...' : 'Submitting...'}</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>{isAr ? 'إرسال التذكرة للإدارة المالية' : 'Submit Dispute'}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsDisputeModalOpen(false)}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                    >
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Instant Payout / Withdrawal Modal */}
      <AnimatePresence>
        {isWithdrawModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">
                      {isAr ? 'طلب سحب فوري للأرباح والضمان' : 'Request Instant Payout'}
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      {isAr ? 'الرصيد المتاح للسحب:' : 'Available Balance:'} {formatConverted(availableBalanceUsd, activeDisplayCurrency)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleExecuteWithdraw} className="p-6 space-y-4 text-xs">
                {/* Amount to Withdraw */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700">
                      {isAr ? 'المبلغ المطلوب سحبه ($ USD):' : 'Withdrawal Amount ($ USD):'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(availableBalanceUsd)}
                      className="text-[11px] font-black text-teal-600 hover:text-teal-700 cursor-pointer"
                    >
                      {isAr ? 'سحب كامل الرصيد' : 'Withdraw All'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      max={availableBalanceUsd}
                      step="any"
                      required
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-lg text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-hidden"
                    />
                    <div className="absolute left-3 rtl:left-auto rtl:right-3 top-3.5 text-xs font-bold text-slate-400 pointer-events-none">
                      ≈ {formatConverted(withdrawAmount, activeDisplayCurrency)}
                    </div>
                  </div>
                </div>

                {/* Destination Payout Account */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'طريقة الاستلام والحساب البنكي:' : 'Payout Method / Account:'}
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900"
                  >
                    {savedAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.label} ({acc.accountNumber})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payout Processing Time Note */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>{isAr ? 'الوقت المتوقع للاستلام:' : 'Estimated Payout Time:'}</span>
                    <span className="font-bold text-slate-900">
                      {selectedAccountId === 'acc-3' 
                        ? (isAr ? '⚡ فوري عند شباك الفرع' : '⚡ Instant at Hub Desk') 
                        : (isAr ? '24 - 48 ساعة عمل' : '24 - 48 Business Hours')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>{isAr ? 'رسوم التحويل:' : 'Transfer Fee:'}</span>
                    <span className="font-black text-emerald-600">{isAr ? 'مجاناً 0%' : 'Free 0%'}</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={isWithdrawing || withdrawAmount <= 0 || withdrawAmount > availableBalanceUsd}
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-black rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    {isWithdrawing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{isAr ? 'جارِ تنفيذ التحويل...' : 'Executing...'}</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="w-4 h-4" />
                        <span>{isAr ? 'تأكيد السحب الآن' : 'Confirm Payout'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsWithdrawModalOpen(false)}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Add Bank / Payout Method Modal */}
      <AnimatePresence>
        {isAddAccountModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">
                      {isAr ? 'إضافة طريقة استلام جديدة' : 'Add New Payout Account'}
                    </h3>
                    <span className="text-[10px] text-slate-400">
                      {isAr ? 'IBAN، بريد الجزائر CCP، أو محفظة إلكترونية' : 'IBAN, Algérie Poste CCP, or Mobile Wallet'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddAccountModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddAccount} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'نوع الحساب / طريقة الاستلام:' : 'Account Type:'}
                  </label>
                  <select
                    value={newAccountType}
                    onChange={(e) => setNewAccountType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="IBAN">{isAr ? 'حساب بنكي دولي IBAN (الأردن / الجزائر / عالمي)' : 'IBAN Bank Account'}</option>
                    <option value="CCP">{isAr ? 'بريد الجزائر CCP (Algérie Poste)' : 'Algérie Poste (CCP)'}</option>
                    <option value="WALLET">{isAr ? 'محفظة إلكترونية (CliQ / InstaPay / STC Pay)' : 'Mobile Wallet (CliQ / InstaPay)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'اسم أو وصف الحساب:' : 'Account Description:'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isAr ? 'مثال: البنك العربي أو حساب بريد الجزائر' : 'e.g., Arab Bank Jordan'}
                    value={newAccountLabel}
                    onChange={(e) => setNewAccountLabel(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'رقم الحساب / الآيبان (IBAN / CCP / رقم المحفظة):' : 'Account / IBAN / CCP Number:'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={newAccountType === 'IBAN' ? 'JO88 ARAB 0120 ...' : newAccountType === 'CCP' ? '0012345678 Clé 45' : '+962 79 ...'}
                    value={newAccountNumber}
                    onChange={(e) => setNewAccountNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'اسم المستفيد الرباعي (كما في البنك):' : 'Beneficiary Name:'}
                  </label>
                  <input
                    type="text"
                    placeholder={isAr ? 'الاسم المطابق للهوية' : 'Legal Full Name'}
                    value={newBeneficiaryName}
                    onChange={(e) => setNewBeneficiaryName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    {isAr ? 'حفظ الحساب واعتماده' : 'Save Account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddAccountModalOpen(false)}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
