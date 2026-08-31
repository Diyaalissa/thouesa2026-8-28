import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Download, 
  Eye, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  X, 
  HelpCircle, 
  Send, 
  Search, 
  Filter, 
  Calendar, 
  Building, 
  Plane, 
  Scale, 
  Maximize2, 
  DollarSign, 
  Check, 
  ExternalLink,
  Printer,
  Table as TableIcon,
  LayoutGrid,
  Headphones,
  FileCheck2,
  ShieldAlert
} from 'lucide-react';
import { EscrowWallet, Locale, Trip } from '../../types';
import { formatCurrency } from '../../lib/crypto';

export interface SecurityDepositRecord {
  id: string;
  bondNumber: string;
  tripId: string;
  airline: string;
  flightNumber: string;
  route: string;
  originHub: string;
  destHub: string;
  depositAmountUsd: number;
  paymentDate: string;
  paymentBranch: string;
  officerName: string;
  status: 'LOCKED_ESCROW' | 'REFUNDED' | 'DISPUTED';
  refundedDate?: string;
  refundMethod?: string;
  sealNumbers: string[];
  cargoWeightKg: number;
  receiptImageUrl?: string;
  pnrCode: string;
}

interface SecurityDepositsViewProps {
  wallet: EscrowWallet | null;
  trips?: Trip[];
  locale?: Locale;
  onNavigateToTrip?: (tripId: string) => void;
  onOpenSupportSOS?: () => void;
}

export const SecurityDepositsView: React.FC<SecurityDepositsViewProps> = ({
  wallet,
  trips = [],
  locale = 'ar',
  onNavigateToTrip,
  onOpenSupportSOS,
}) => {
  const isAr = locale === 'ar';

  // 1. Tab State: Active vs Refunded
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'REFUNDED'>('ACTIVE');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');
  const [searchQuery, setSearchQuery] = useState('');

  // 2. Receipt Lightbox Modal State
  const [selectedDepositForReceipt, setSelectedDepositForReceipt] = useState<SecurityDepositRecord | null>(null);
  const [receiptZoomLevel, setReceiptZoomLevel] = useState<number>(1);
  const [receiptRotation, setReceiptRotation] = useState<number>(0);

  // 3. Dispute / Inquiry Modal State
  const [inquiryDeposit, setInquiryDeposit] = useState<SecurityDepositRecord | null>(null);
  const [inquiryReason, setInquiryReason] = useState('DELAYED_RELEASE');
  const [inquiryNotes, setInquiryNotes] = useState('');
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [inquirySuccessTicket, setInquirySuccessTicket] = useState<string | null>(null);

  // 4. Sample comprehensive deposits dataset mapped from trips or high-fidelity mock
  const depositRecords: SecurityDepositRecord[] = useMemo(() => {
    return [
      {
        id: 'dep-01',
        bondNumber: 'TH-BOND-2026-9041',
        tripId: 'trip-active-01',
        airline: 'Royal Jordanian',
        flightNumber: 'RJ 501',
        route: isAr ? 'عَمّان (AMM) ✈️ الجزائر (ALG)' : 'Amman (AMM) ✈️ Algiers (ALG)',
        originHub: isAr ? 'فرع عَمّان الرئيسي - مجمع الشميساني' : 'Amman Central Hub (Shmeisani)',
        destHub: isAr ? 'فرع الجزائر الدولي - حيدرة' : 'Algiers Intl Hub (Hydra)',
        depositAmountUsd: 500.00,
        paymentDate: '2026-08-28T14:30:00Z',
        paymentBranch: isAr ? 'فرع عَمّان الرئيسي (كاونتر 2)' : 'Amman Central Hub (Desk #2)',
        officerName: isAr ? 'طارق الكردي (موظف أمانات)' : 'Tariq Al-Kurdi (Hub Officer)',
        status: 'LOCKED_ESCROW',
        sealNumbers: ['SL-JO-99120', 'SL-JO-99121', 'SL-JO-99122'],
        cargoWeightKg: 8.5,
        pnrCode: 'RJ-889B',
      },
      {
        id: 'dep-02',
        bondNumber: 'TH-BOND-2026-8812',
        tripId: 'trip-completed-01',
        airline: 'Air Algérie',
        flightNumber: 'AH 4015',
        route: isAr ? 'الجزائر (ALG) ✈️ عَمّان (AMM)' : 'Algiers (ALG) ✈️ Amman (AMM)',
        originHub: isAr ? 'فرع الجزائر الدولي - حيدرة' : 'Algiers Intl Hub (Hydra)',
        destHub: isAr ? 'فرع عَمّان الرئيسي' : 'Amman Central Hub',
        depositAmountUsd: 380.00,
        paymentDate: '2026-08-20T10:15:00Z',
        refundedDate: '2026-08-22T18:45:00Z',
        paymentBranch: isAr ? 'فرع الجزائر الدولي (صندوق الودائع)' : 'Algiers Intl Hub Treasury',
        refundMethod: isAr ? 'إيداع فوري بالمحفظة (Wallet Auto-Release)' : 'Wallet Auto-Release',
        officerName: isAr ? 'سفيان بلحاج' : 'Sofiane Belhadj',
        status: 'REFUNDED',
        sealNumbers: ['SL-DZ-77210', 'SL-DZ-77211'],
        cargoWeightKg: 6.2,
        pnrCode: 'AH-901K',
      },
      {
        id: 'dep-03',
        bondNumber: 'TH-BOND-2026-7734',
        tripId: 'trip-completed-02',
        airline: 'Saudia Airlines',
        flightNumber: 'SV 622',
        route: isAr ? 'عَمّان (AMM) ✈️ جدة (JED)' : 'Amman (AMM) ✈️ Jeddah (JED)',
        originHub: isAr ? 'فرع عَمّان الرئيسي' : 'Amman Central Hub',
        destHub: isAr ? 'فرع جدة التوزيعي' : 'Jeddah Distribution Hub',
        depositAmountUsd: 650.00,
        paymentDate: '2026-08-10T09:00:00Z',
        refundedDate: '2026-08-11T16:20:00Z',
        paymentBranch: isAr ? 'فرع عَمّان الرئيسي' : 'Amman Central Hub',
        refundMethod: isAr ? 'استلام نقدي من صندوق فرع جدة' : 'Cash Payout at Jeddah Hub',
        officerName: isAr ? 'عمر العبداللات' : 'Omar Abdallat',
        status: 'REFUNDED',
        sealNumbers: ['SL-JO-66430', 'SL-JO-66431', 'SL-JO-66432'],
        cargoWeightKg: 10.0,
        pnrCode: 'SV-442T',
      },
      {
        id: 'dep-04',
        bondNumber: 'TH-BOND-2026-6510',
        tripId: 'trip-completed-03',
        airline: 'Royal Jordanian',
        flightNumber: 'RJ 701',
        route: isAr ? 'عَمّان (AMM) ✈️ الجزائر (ALG)' : 'Amman (AMM) ✈️ Algiers (ALG)',
        originHub: isAr ? 'فرع عَمّان الرئيسي' : 'Amman Central Hub',
        destHub: isAr ? 'فرع الجزائر الدولي' : 'Algiers Intl Hub',
        depositAmountUsd: 420.00,
        paymentDate: '2026-07-28T11:30:00Z',
        refundedDate: '2026-07-30T17:10:00Z',
        paymentBranch: isAr ? 'فرع عَمّان الرئيسي' : 'Amman Central Hub',
        refundMethod: isAr ? 'تحويل للمحفظة' : 'Wallet Transfer',
        officerName: isAr ? 'طارق الكردي' : 'Tariq Al-Kurdi',
        status: 'REFUNDED',
        sealNumbers: ['SL-JO-55201', 'SL-JO-55202'],
        cargoWeightKg: 7.0,
        pnrCode: 'RJ-331Q',
      }
    ];
  }, [isAr]);

  // Financial aggregates
  const activeDepositsList = useMemo(() => {
    return depositRecords.filter(d => d.status === 'LOCKED_ESCROW' || d.status === 'DISPUTED');
  }, [depositRecords]);

  const refundedDepositsList = useMemo(() => {
    return depositRecords.filter(d => d.status === 'REFUNDED');
  }, [depositRecords]);

  const totalActiveDeposits = useMemo(() => {
    return activeDepositsList.reduce((acc, d) => acc + d.depositAmountUsd, 0);
  }, [activeDepositsList]);

  const totalRefundedDeposits = useMemo(() => {
    return refundedDepositsList.reduce((acc, d) => acc + d.depositAmountUsd, 0) + 1450.00; // includes verified lifetime prior record
  }, [refundedDepositsList]);

  // Filtered by active tab and search
  const displayedDeposits = useMemo(() => {
    const list = activeTab === 'ACTIVE' ? activeDepositsList : refundedDepositsList;
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(d => 
      d.bondNumber.toLowerCase().includes(q) ||
      d.flightNumber.toLowerCase().includes(q) ||
      d.route.toLowerCase().includes(q) ||
      d.paymentBranch.toLowerCase().includes(q)
    );
  }, [activeTab, activeDepositsList, refundedDepositsList, searchQuery]);

  // Submit Inquiry / Dispute
  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryDeposit) return;
    setIsSubmittingInquiry(true);

    setTimeout(() => {
      const generatedTicket = `TKT-AUDIT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setIsSubmittingInquiry(false);
      setInquirySuccessTicket(generatedTicket);
      setTimeout(() => {
        setInquirySuccessTicket(null);
        setInquiryDeposit(null);
        setInquiryNotes('');
      }, 3500);
    }, 1000);
  };

  // Open Lightbox handler
  const handleOpenReceipt = (deposit: SecurityDepositRecord) => {
    setSelectedDepositForReceipt(deposit);
    setReceiptZoomLevel(1);
    setReceiptRotation(0);
  };

  // Download Receipt Simulation
  const handleDownloadReceipt = (deposit: SecurityDepositRecord) => {
    alert(isAr 
      ? `📄 جاري تنزيل نسخة رسمية وموقعة من "وصل الأمانة" (سند رقم: ${deposit.bondNumber}) بصيغة PDF المعتمدة...`
      : `📄 Downloading certified Trust Deposit Receipt PDF (${deposit.bondNumber})...`
    );
  };

  return (
    <div className="space-y-6 pb-24 md:pb-10" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Deposits Overview Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-black">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">
                {isAr ? 'سجل الضمانات المالية والودائع (Security Deposits)' : 'Security Deposits Ledger'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr 
                  ? 'توثيق رسمي ومستقل لجميع ودائع الأمانة المستردة وسندات الدفع الموقعة' 
                  : 'Official independent ledger for refundable escrow bonds and signed receipts'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? 'معدل استرداد 100% مضمون' : '100% Guaranteed Release'}</span>
            </div>
          </div>
        </div>

        {/* Top Summary Cards: Total Active vs Total Refunded */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Active Deposits Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                {isAr ? 'إجمالي الضمانات النشطة (حالياً)' : 'Total Active Deposits'}
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <div className="text-3xl font-black text-amber-900">
              ${totalActiveDeposits.toFixed(2)} USD
            </div>
            <div className="text-[11px] text-amber-800/80 font-medium">
              {isAr 
                ? `${activeDepositsList.length} رحلة جارية • تُحرر فور فحص الأختام في مكتب الوصول` 
                : `${activeDepositsList.length} flight in custody • Released on hub handover`}
            </div>
          </div>

          {/* Lifetime Refunded Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                {isAr ? 'إجمالي الضمانات المستردة تاريخياً' : 'Total Refunded (Lifetime)'}
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-emerald-800">
              ${totalRefundedDeposits.toFixed(2)} USD
            </div>
            <div className="text-[11px] text-emerald-700 font-medium">
              {isAr 
                ? 'أعيدت بالكامل إلى محفظتك وصندوقك بدون أي خصومات' 
                : '100% returned to your wallet & cash treasury without deductions'}
            </div>
          </div>

          {/* Legal Protection Commitment */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-teal-400">
                <FileCheck2 className="w-4 h-4" />
                <span>{isAr ? 'توثيق وصل الأمانة الورقي' : 'Signed Paper Bond Vault'}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-2">
                {isAr 
                  ? 'كل مبلغ ضمان يدفع في الفرع يُوثق بسند أمانة ورقي موقّع وممسوح ضوئياً يحميك قانونياً.' 
                  : 'Every deposit is backed by a signed paper trust deed scanned into your digital vault.'}
              </p>
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              {isAr ? 'نظام الأمانات المشفر THOUESA' : 'THOUESA Certified Trust Protocol'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Controls Bar: Tabs (Active 🟡 vs Refunded 🟢), Search & Layout Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Main Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'ACTIVE'
                ? 'bg-amber-500 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🟡</span>
            <span>{isAr ? 'الضمانات النشطة (في العهدة)' : 'Active Deposits'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === 'ACTIVE' ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {activeDepositsList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('REFUNDED')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'REFUNDED'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🟢</span>
            <span>{isAr ? 'الضمانات المستردة (الأرشيف)' : 'Refunded Deposits'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === 'REFUNDED' ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {refundedDepositsList.length}
            </span>
          </button>
        </div>

        {/* Search and Layout Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isAr ? 'بحث برقم السند، الرحلة، أو الفرع...' : 'Search bond #, flight, branch...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ps-8 pe-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-teal-500"
            />
          </div>

          {/* Desktop Table/Card Toggle */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('CARDS')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'CARDS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
              }`}
              title={isAr ? 'عرض بطاقات السندات' : 'Card View'}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
              }`}
              title={isAr ? 'عرض جدول البيانات' : 'Table View'}
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Deposits List: Cards View vs Table View */}
      {viewMode === 'CARDS' || window.innerWidth < 768 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedDeposits.map((record) => {
            const isLocked = record.status === 'LOCKED_ESCROW';
            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-3xl p-5 border transition-all relative overflow-hidden shadow-xs flex flex-col justify-between ${
                  isLocked 
                    ? 'border-amber-400/60 ring-2 ring-amber-500/10' 
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                {/* Header: Bond # & Status Pill */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isLocked ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isLocked ? <Lock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {isAr ? 'سند أمانة رقم:' : 'Security Bond ID:'}
                        </span>
                        <span className="font-mono font-black text-xs text-slate-900">
                          {record.bondNumber}
                        </span>
                      </div>
                    </div>

                    <div className={`px-2.5 py-1 rounded-full text-[11px] font-black flex items-center gap-1.5 ${
                      isLocked 
                        ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isLocked ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      <span>{isLocked ? (isAr ? 'محجوز في العهدة 🟡' : 'Active Escrow 🟡') : (isAr ? 'تم الاسترداد 🟢' : 'Refunded 🟢')}</span>
                    </div>
                  </div>

                  {/* Flight & Amount Details */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4 text-teal-600" />
                        <span className="font-black text-sm text-slate-900">
                          {record.airline} ({record.flightNumber})
                        </span>
                      </div>
                      <span className="text-xs text-slate-600 font-bold block mt-1">
                        {record.route}
                      </span>
                    </div>

                    <div className="text-end">
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        {isAr ? 'مبلغ الضمان:' : 'Deposit Amount:'}
                      </span>
                      <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                        ${record.depositAmountUsd.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Metadata Box */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {isAr ? 'مكان الدفع:' : 'Branch:'}
                      </span>
                      <span className="font-bold text-slate-800">{record.paymentBranch}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {isAr ? 'تاريخ الدفع:' : 'Date Paid:'}
                      </span>
                      <span className="font-mono text-slate-800">
                        {new Date(record.paymentDate).toLocaleDateString(isAr ? 'ar-JO' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {record.refundedDate && (
                      <div className="flex justify-between items-center text-emerald-700 font-semibold border-t border-slate-200/60 pt-1.5">
                        <span>{isAr ? 'تاريخ الاسترداد:' : 'Refunded on:'}</span>
                        <span className="font-mono">
                          {new Date(record.refundedDate).toLocaleDateString(isAr ? 'ar-JO' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-slate-500 text-[11px] border-t border-slate-200/60 pt-1.5">
                      <span>{isAr ? 'الطرود المسندة والأختام:' : 'Cargo & Seals:'}</span>
                      <span className="font-mono font-bold text-slate-700">
                        {record.cargoWeightKg} kg • {record.sealNumbers.length} {isAr ? 'أختام' : 'seals'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons: View Receipt 📄 & Inquire 🎧 */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleOpenReceipt(record)}
                    className="flex-1 py-2.5 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    <span>{isAr ? 'عرض وصل الأمانة 📄' : 'View Receipt 📄'}</span>
                  </motion.button>

                  {isLocked ? (
                    <button
                      onClick={() => setInquiryDeposit(record)}
                      className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title={isAr ? 'استفسار عن الضمان وتأخر التحرير' : 'Inquire about release'}
                    >
                      <Headphones className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isAr ? 'استفسار 🎧' : 'Inquire 🎧'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDownloadReceipt(record)}
                      className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      title={isAr ? 'تحميل الوصل PDF' : 'Download PDF'}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}

          {displayedDeposits.length === 0 && (
            <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700 text-sm">
                {isAr ? 'لا توجد ضمانات مطابقة في هذا التبويب' : 'No matching security deposits in this section'}
              </h4>
              <p className="text-xs text-slate-500">
                {isAr 
                  ? 'جميع الضمانات السابقة مستردة أو قيد الفحص والمطابقة التلقائية.' 
                  : 'All previous deposits are fully refunded or awaiting route matching.'}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Table View for Desktop */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <tr>
                  <th className="p-4 text-start">{isAr ? 'رقم السند' : 'Bond #'}</th>
                  <th className="p-4 text-start">{isAr ? 'الرحلة والمسار' : 'Flight & Route'}</th>
                  <th className="p-4 text-start">{isAr ? 'مبلغ الضمان' : 'Deposit Amount'}</th>
                  <th className="p-4 text-start">{isAr ? 'تاريخ الدفع والفرع' : 'Payment & Branch'}</th>
                  <th className="p-4 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="p-4 text-end">{isAr ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedDeposits.map((record) => {
                  const isLocked = record.status === 'LOCKED_ESCROW';
                  return (
                    <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900">
                        {record.bondNumber}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{record.flightNumber} ({record.airline})</div>
                        <div className="text-[11px] text-slate-500">{record.route}</div>
                      </td>
                      <td className="p-4 font-mono font-black text-sm text-slate-900">
                        ${record.depositAmountUsd.toFixed(2)} USD
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{record.paymentBranch}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {new Date(record.paymentDate).toLocaleDateString(isAr ? 'ar-JO' : 'en-US')}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-black inline-flex items-center gap-1 ${
                          isLocked 
                            ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          <span>{isLocked ? '🟡 محجوز' : '🟢 مسترد'}</span>
                        </span>
                      </td>
                      <td className="p-4 text-end">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenReceipt(record)}
                            className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-teal-600" />
                            <span>{isAr ? 'عرض الوصل' : 'Receipt'}</span>
                          </button>

                          <button
                            onClick={() => handleDownloadReceipt(record)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                            title={isAr ? 'تحميل الوصل PDF' : 'Download PDF'}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {isLocked && (
                            <button
                              onClick={() => setInquiryDeposit(record)}
                              className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Headphones className="w-3 h-3" />
                              <span>{isAr ? 'استفسار' : 'Inquire'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. LIGHTBOX MODAL: Authentic Paper "وصل الأمانة" (Trust Receipt Attachment) */}
      <AnimatePresence>
        {selectedDepositForReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Lightbox Toolbar Header */}
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-white">
                      {isAr ? 'وصل أمانة مالي معتمد (سند استلام عهدة)' : 'Certified Custody Escrow Receipt'}
                    </h3>
                    <span className="text-[11px] font-mono text-teal-400">
                      {selectedDepositForReceipt.bondNumber}
                    </span>
                  </div>
                </div>

                {/* Lightbox Controls (Zoom In/Out, Rotate, Download, Close) */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => setReceiptZoomLevel(prev => Math.min(prev + 0.25, 2.0))}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                    title={isAr ? 'تكبير' : 'Zoom In'}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setReceiptZoomLevel(prev => Math.max(prev - 0.25, 0.75))}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                    title={isAr ? 'تصغير' : 'Zoom Out'}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setReceiptRotation(prev => (prev + 90) % 360)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                    title={isAr ? 'تدوير' : 'Rotate'}
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDownloadReceipt(selectedDepositForReceipt)}
                    className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors cursor-pointer"
                    title={isAr ? 'تحميل المستند' : 'Download Receipt'}
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setSelectedDepositForReceipt(null)}
                    className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer ms-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Receipt Body (Paper Simulation) */}
              <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100 flex items-center justify-center">
                <div 
                  className="w-full max-w-lg bg-[#fffdf7] border-2 border-amber-900/20 rounded-2xl p-6 sm:p-8 shadow-md text-slate-800 relative space-y-6 transition-transform duration-200"
                  style={{
                    transform: `scale(${receiptZoomLevel}) rotate(${receiptRotation}deg)`,
                    transformOrigin: 'center center'
                  }}
                >
                  {/* Official Watermark & Stamp */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none font-black text-6xl text-slate-900 uppercase tracking-widest text-center select-none rotate-[-25deg]">
                    THOUESA VERIFIED
                  </div>

                  {/* Header of Paper Document */}
                  <div className="text-center border-b-2 border-dashed border-amber-900/30 pb-5">
                    <div className="inline-block px-3 py-1 bg-amber-100 text-amber-900 font-mono text-[10px] font-black rounded-md mb-2">
                      وثيقة رسمية • OFFICIAL TRUST BOND
                    </div>
                    <h2 className="text-base font-black text-slate-900 tracking-wide">
                      شركة ثويسا للخدمات اللوجستية ش.م.م
                    </h2>
                    <h3 className="text-xs font-bold text-amber-900 mt-0.5">
                      سند استلام أمانة مالية وتعهد تسليم عهدة طرود
                    </h3>
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-3 pt-2 border-t border-slate-200">
                      <span>رقم السند: {selectedDepositForReceipt.bondNumber}</span>
                      <span>التاريخ: {new Date(selectedDepositForReceipt.paymentDate).toLocaleDateString('en-GB')}</span>
                    </div>
                  </div>

                  {/* Body Clauses */}
                  <div className="text-xs space-y-3 leading-relaxed text-slate-700 font-serif">
                    <p>
                      أقر أنا موظف فرع <strong className="font-sans font-bold text-slate-900">{selectedDepositForReceipt.paymentBranch}</strong>، باستلام مبلغ الضمان النقدي/الإلكتروني المبين أدناه كوديعة أمانة مستردة بالكامل من المسافر المعتمد لدى المنصة:
                    </p>

                    {/* Financial Highlight Box */}
                    <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-center font-sans space-y-1">
                      <span className="text-[11px] font-bold text-amber-800 uppercase block">
                        قيمة مبلغ الضمان المستلم في الصندوق
                      </span>
                      <div className="text-3xl font-black text-slate-900 font-mono">
                        ${selectedDepositForReceipt.depositAmountUsd.toFixed(2)} USD
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        (فقط خمسمائة دولار أمريكي لا غير - مستردة 100%)
                      </span>
                    </div>

                    {/* Cargo & Flight Manifest Details */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-sans pt-2">
                      <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                        <span className="text-slate-400 block text-[9px]">بيانات الرحلة:</span>
                        <span className="font-bold">{selectedDepositForReceipt.airline} ({selectedDepositForReceipt.flightNumber})</span>
                      </div>
                      <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                        <span className="text-slate-400 block text-[9px]">مسار الرحلة:</span>
                        <span className="font-bold">{selectedDepositForReceipt.route}</span>
                      </div>
                      <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                        <span className="text-slate-400 block text-[9px]">وزن الطرود المسندة:</span>
                        <span className="font-bold font-mono">{selectedDepositForReceipt.cargoWeightKg} KG</span>
                      </div>
                      <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                        <span className="text-slate-400 block text-[9px]">أرقام أختام الأمان:</span>
                        <span className="font-bold font-mono text-[10px] truncate block">
                          {selectedDepositForReceipt.sealNumbers.join(', ')}
                        </span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 italic pt-2">
                      * يتعهد النظام بتحرير هذا الضمان فور تسليم الطرود بنفس حالتها وأختامها في فرع وجهة الوصول دون أي تأخير أو استقطاع مالي.
                    </p>
                  </div>

                  {/* Signatures & Official Hub Stamp Section */}
                  <div className="pt-4 border-t-2 border-dashed border-amber-900/30 grid grid-cols-2 gap-4 items-end font-sans">
                    {/* Traveler Signature Box */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold block">توقيع المسافر المستلم:</span>
                      <div className="h-14 border border-slate-300 rounded-lg bg-white p-2 flex items-center justify-center font-serif italic text-sm text-slate-700 select-none">
                        Ahmad Al-Musafir ✍️
                      </div>
                    </div>

                    {/* Official Hub Stamp Box */}
                    <div className="space-y-1 text-end">
                      <span className="text-[10px] text-slate-500 font-bold block text-start">ختم الفرع وتوقيع المسؤول:</span>
                      <div className="h-14 border-2 border-dashed border-teal-700/60 rounded-lg bg-teal-50/50 p-2 flex flex-col items-center justify-center relative overflow-hidden">
                        <span className="text-[9px] font-black text-teal-900 uppercase">THOUESA LOGISTICS</span>
                        <span className="text-[8px] font-mono text-teal-800">OFFICIAL ESCROW STAMP</span>
                        <span className="text-[9px] font-bold text-teal-700 font-mono">APPROVED & SECURED</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lightbox Footer Actions */}
              <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  {isAr ? 'نسخة رقمية معتمدة ومطابقة للأصل الورقي المحفوظ بالفرع' : 'Certified digital copy matching original branch deed'}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadReceipt(selectedDepositForReceipt)}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isAr ? 'تحميل الوصل (PDF)' : 'Download PDF'}</span>
                  </button>
                  <button
                    onClick={() => setSelectedDepositForReceipt(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    {isAr ? 'إغلاق' : 'Close'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. INQUIRY / DISPUTE MODAL: Missing or Delayed Deposit Release */}
      <AnimatePresence>
        {inquiryDeposit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="bg-amber-500 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm">
                      {isAr ? 'استفسار وتدقيق تحرير الضمان المالي' : 'Escrow Deposit Inquiry & Audit'}
                    </h3>
                    <span className="text-[10px] font-mono text-amber-100">
                      {inquiryDeposit.bondNumber}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setInquiryDeposit(null)}
                  className="text-amber-100 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {inquirySuccessTicket ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-slate-900 text-base">
                    {isAr ? 'تم فتح تذكرة التدقيق المالي بنجاح' : 'Audit Ticket Opened Successfully'}
                  </h4>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-black text-teal-700">
                    {inquirySuccessTicket}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isAr 
                      ? 'تم إرسال طلبك بقيد الأولوية العالية إلى قسم الحسابات والعمليات لمطابقة محضر تسليم الرحلة وتحرير المبلغ فوراً.' 
                      : 'High-priority inquiry forwarded to Accounts Audit to verify delivery manifest and release funds.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitInquiry} className="p-6 space-y-4 text-xs">
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
                    <span className="font-bold text-amber-900 block">
                      {inquiryDeposit.flightNumber} • ${inquiryDeposit.depositAmountUsd.toFixed(2)} USD
                    </span>
                    <span className="text-[11px] text-amber-700 block">
                      {inquiryDeposit.route} ({inquiryDeposit.paymentBranch})
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isAr ? 'سبب الاستفسار / الاعتراض:' : 'Inquiry Reason:'}
                    </label>
                    <select
                      value={inquiryReason}
                      onChange={(e) => setInquiryReason(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden"
                    >
                      <option value="DELAYED_RELEASE">{isAr ? 'وصلت الرحلة وتم تسليم الطرود ولم يتحرر الضمان' : 'Flight completed, parcels handed over, deposit still locked'}</option>
                      <option value="SEAL_DISPUTE">{isAr ? 'استفسار بخصوص فحص أختام الطرود في مكتب الوصول' : 'Inquiry regarding parcel seal inspection'}</option>
                      <option value="INCORRECT_AMOUNT">{isAr ? 'خطأ في المبلغ الموثق بالسند' : 'Discrepancy in recorded bond amount'}</option>
                      <option value="URGENT_CASH">{isAr ? 'طلب استلام الضمان نقداً بدلاً من المحفظة' : 'Request cash payout at branch instead of wallet'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isAr ? 'ملاحظات إضافية أو اسم موظف الاستلام:' : 'Additional Notes or Receiving Officer:'}
                    </label>
                    <textarea
                      rows={3}
                      value={inquiryNotes}
                      onChange={(e) => setInquiryNotes(e.target.value)}
                      placeholder={isAr ? 'مثال: قمت بتسليم الطرود للموظف في فرع الجزائر قبل 3 ساعات...' : 'E.g., handed parcels to Hydra Hub officer 3 hours ago...'}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={isSubmittingInquiry}
                      className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingInquiry ? (isAr ? 'جارِ الإرسال...' : 'Sending...') : (isAr ? 'إرسال طلب التدقيق الفوري' : 'Submit Audit Ticket')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInquiryDeposit(null)}
                      className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
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
    </div>
  );
};
