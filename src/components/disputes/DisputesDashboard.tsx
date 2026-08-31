import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  AlertOctagon,
  CheckCircle2,
  Clock,
  X,
  Image as ImageIcon,
  Send,
  Star,
  RefreshCcw,
  FileText,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Paperclip,
  User as UserIcon,
  ShieldAlert,
  DollarSign,
  Info,
  Check,
  Bell,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Package,
  Layers,
  Sparkles,
  Smile
} from 'lucide-react';
import { User, Shipment } from '../../types';
import { formatCurrency } from '../../lib/crypto';

export interface DisputeMessage {
  id: string;
  sender: 'USER' | 'ADMIN';
  senderName?: string;
  text: string;
  timestamp: string;
  attachments?: string[];
}

export interface DisputeTicket {
  id: string;
  shipmentId: string;
  trackingNumber: string;
  originCountry: string;
  destCountry: string;
  category: 'DAMAGE' | 'MISSING' | 'DELAY' | 'OVERCHARGE';
  status: 'OPEN' | 'PENDING_USER' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  closedAt?: string;
  slaTargetHours: number; // default 24h
  claimAmount?: number;
  compensationAmount?: number;
  resolutionNote?: string;
  rating?: number;
  ratingFeedback?: string;
  ratingSubmittedAt?: string;
  messages: DisputeMessage[];
  hasUnreadAdminReply?: boolean;
}

interface DisputesDashboardProps {
  currentUser: User;
  isAr: boolean;
  onNavigateToShipment?: (shipmentId: string) => void;
  onNavigateToWallet?: () => void;
}

const INITIAL_MOCK_DISPUTES: DisputeTicket[] = [
  {
    id: 'DSP-1092',
    shipmentId: 'SHP-9921',
    trackingNumber: 'TH-AWB-883921',
    originCountry: 'الأردن (عمان)',
    destCountry: 'الجزائر (العاصمة)',
    category: 'DAMAGE',
    status: 'PENDING_USER',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    slaTargetHours: 24,
    claimAmount: 65,
    hasUnreadAdminReply: true,
    messages: [
      {
        id: 'm1',
        sender: 'USER',
        text: 'وصل الطرد وتوجد كسور في الحافظة الإلكترونية الخارجية للتابلت، أرجو تعويضي بقيمة الصيانة وتجميد الضمان.',
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
        attachments: [
          'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=500&q=80',
          'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=500&q=80'
        ]
      },
      {
        id: 'm2',
        sender: 'ADMIN',
        senderName: 'فريق الامتثال والتحكيم المركزي',
        text: 'مرحباً بك أخي الكريم، نعتذر بشدة عن هذا الإزعاج. تم فحص صور الاستلام في محطة عمان وتبين أن التغليف الخارجي كان سليماً، لكن حدث ضغط أثناء الرحلة الجوية. هل تقبل بتعويض مالي فوري قدره 65$ يُودع بمحفظتك فوراً لإغلاق النزاع ودياً؟',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
      }
    ]
  },
  {
    id: 'DSP-0881',
    shipmentId: 'SHP-8812',
    trackingNumber: 'TH-AWB-471092',
    originCountry: 'دبي (الإمارات)',
    destCountry: 'عمان (الأردن)',
    category: 'OVERCHARGE',
    status: 'CLOSED',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    closedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    slaTargetHours: 24,
    claimAmount: 25,
    compensationAmount: 25,
    resolutionNote: 'تم إرجاع فرق الرسوم الجمركية الإضافية إلى رصيدك المتاح في المحفظة تلقائياً.',
    rating: 5,
    ratingFeedback: 'استجابة سريعة جداً وحل عادل في أقل من 24 ساعة، شكراً لكم.',
    ratingSubmittedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    messages: [
      {
        id: 'm1',
        sender: 'USER',
        text: 'تم خصم رسوم جمركية بقيمة 25$ إضافية بالخطأ عند الاستلام من المحطة رغم سدادي المسبق.',
        timestamp: new Date(Date.now() - 86400000 * 4).toISOString()
      },
      {
        id: 'm2',
        sender: 'ADMIN',
        senderName: 'فريق الحسابات',
        text: 'تمت مراجعة الوصل الجمركي الرسمي، وفعلاً تبين وجود خطأ في قيد التسوية من مدير المحطة. قمنا بإيداع تعويض فوري بقيمة 25$ في محفظتك تحت قيد "تعويض مالي - نزاع رقم #DSP-0881".',
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString()
      }
    ]
  },
  {
    id: 'DSP-0765',
    shipmentId: 'SHP-7765',
    trackingNumber: 'TH-AWB-290114',
    originCountry: 'عمان (الأردن)',
    destCountry: 'وهران (الجزائر)',
    category: 'DELAY',
    status: 'OPEN',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    slaTargetHours: 24,
    claimAmount: 15,
    messages: [
      {
        id: 'm1',
        sender: 'USER',
        text: 'الشحنة متأخرة عن موعد الوصول المتوقع بيومين، أود معرفة السبب الحالي لتأخر الإفراج الجمركي.',
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString()
      }
    ]
  }
];

export function DisputesDashboard({ currentUser, isAr, onNavigateToShipment, onNavigateToWallet }: DisputesDashboardProps) {
  const [disputes, setDisputes] = useState<DisputeTicket[]>(() => {
    const saved = localStorage.getItem('thouesa_disputes_list');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_MOCK_DISPUTES; }
    }
    return INITIAL_MOCK_DISPUTES;
  });

  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(() => {
    return disputes.length > 0 ? disputes[0].id : null;
  });

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'OPEN' | 'PENDING_USER' | 'RESOLVED_CLOSED'>('ALL');
  const [newMessage, setNewMessage] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // CSAT Rating state
  const [ratingHover, setRatingHover] = useState(0);
  const [csatFeedbackText, setCsatFeedbackText] = useState('');
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // New dispute modal state
  const [newDisputeShipmentId, setNewDisputeShipmentId] = useState('SHP-9921');
  const [newDisputeCategory, setNewDisputeCategory] = useState<'DAMAGE' | 'MISSING' | 'DELAY' | 'OVERCHARGE'>('DAMAGE');
  const [newDisputeClaimAmount, setNewDisputeClaimAmount] = useState('45');
  const [newDisputeDescription, setNewDisputeDescription] = useState('');
  const [newDisputeEvidenceUrl, setNewDisputeEvidenceUrl] = useState('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('thouesa_disputes_list', JSON.stringify(disputes));
  }, [disputes]);

  const selectedDispute = disputes.find(d => d.id === selectedDisputeId);

  // Scroll chat to bottom when message arrives
  useEffect(() => {
    if (selectedDisputeId) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedDispute?.messages.length, selectedDisputeId]);

  // Mark as read when selected
  const handleSelectDispute = (id: string) => {
    setSelectedDisputeId(id);
    setDisputes(prev => prev.map(d => d.id === id ? { ...d, hasUnreadAdminReply: false } : d));
  };

  // Re-open logic: check if closed within 7 days
  const canReopen = (dispute: DisputeTicket) => {
    if (dispute.status !== 'CLOSED' && dispute.status !== 'RESOLVED') return false;
    if (!dispute.closedAt) return false;
    const closedDate = new Date(dispute.closedAt);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now.getTime() - closedDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const getRemainingSlaHours = (dispute: DisputeTicket) => {
    const created = new Date(dispute.createdAt).getTime();
    const target = created + (dispute.slaTargetHours * 3600 * 1000);
    const now = Date.now();
    const remainingMs = target - now;
    if (remainingMs <= 0) return 0;
    return Math.ceil(remainingMs / (3600 * 1000));
  };

  // Send message
  const handleSendMessage = () => {
    if (!newMessage.trim() && !newAttachmentUrl.trim()) return;
    if (!selectedDisputeId) return;

    const newMsg: DisputeMessage = {
      id: `msg-${Date.now()}`,
      sender: 'USER',
      senderName: currentUser.fullName,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      attachments: newAttachmentUrl.trim() ? [newAttachmentUrl.trim()] : undefined
    };

    setDisputes(prev => prev.map(d => {
      if (d.id === selectedDisputeId) {
        return {
          ...d,
          status: d.status === 'PENDING_USER' ? 'OPEN' : d.status,
          messages: [...d.messages, newMsg]
        };
      }
      return d;
    }));

    setNewMessage('');
    setNewAttachmentUrl('');
    setShowAttachmentInput(false);

    // Simulate Admin Push Reply if message asks for update
    setTimeout(() => {
      setToastMessage(isAr ? 'تم إرسال إشعار فوري لفريق الدعم لمراجعة ردك.' : 'Instant notification dispatched to support team.');
      setShowNotificationToast(true);
      setTimeout(() => setShowNotificationToast(false), 4000);
    }, 800);
  };

  // Rate CSAT
  const handleRateDispute = (rating: number) => {
    if (!selectedDisputeId) return;
    setDisputes(prev => prev.map(d => {
      if (d.id === selectedDisputeId) {
        return {
          ...d,
          rating,
          ratingFeedback: csatFeedbackText || d.ratingFeedback,
          ratingSubmittedAt: new Date().toISOString()
        };
      }
      return d;
    }));

    setToastMessage(isAr ? 'شكراً لك! تم حفظ تقييمك لمستوى الخدمة ودعم العملاء.' : 'Thank you! Your CSAT rating has been recorded.');
    setShowNotificationToast(true);
    setTimeout(() => setShowNotificationToast(false), 4000);
  };

  // Re-open dispute
  const handleReopen = (id: string) => {
    setDisputes(prev => prev.map(d => {
      if (d.id === id) {
        return {
          ...d,
          status: 'OPEN',
          closedAt: undefined,
          messages: [
            ...d.messages,
            {
              id: `msg-reopen-${Date.now()}`,
              sender: 'USER',
              senderName: currentUser.fullName,
              text: isAr ? 'قام العميل بإعادة فتح النزاع لعدم الرضا عن الحل أو الحاجة لمتابعة إضافية.' : 'Customer re-opened the dispute for further review.',
              timestamp: new Date().toISOString()
            }
          ]
        };
      }
      return d;
    }));

    setToastMessage(isAr ? 'تم إعادة فتح النزاع وإحالته لمدير الامتثال.' : 'Dispute re-opened and routed to compliance manager.');
    setShowNotificationToast(true);
    setTimeout(() => setShowNotificationToast(false), 4000);
  };

  // Create new dispute
  const handleCreateDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisputeDescription.trim()) return;

    const newTicket: DisputeTicket = {
      id: `DSP-${Math.floor(1000 + Math.random() * 9000)}`,
      shipmentId: newDisputeShipmentId,
      trackingNumber: `TH-AWB-${Math.floor(100000 + Math.random() * 900000)}`,
      originCountry: 'عمان (الأردن)',
      destCountry: 'الجزائر (العاصمة)',
      category: newDisputeCategory,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      slaTargetHours: 24,
      claimAmount: parseFloat(newDisputeClaimAmount) || 50,
      messages: [
        {
          id: `msg-init-${Date.now()}`,
          sender: 'USER',
          senderName: currentUser.fullName,
          text: newDisputeDescription,
          timestamp: new Date().toISOString(),
          attachments: newDisputeEvidenceUrl ? [newDisputeEvidenceUrl] : undefined
        }
      ]
    };

    setDisputes(prev => [newTicket, ...prev]);
    setSelectedDisputeId(newTicket.id);
    setIsCreating(false);
    setNewDisputeDescription('');

    // Trigger confirmation and simulated instant Push Notification
    setToastMessage(isAr 
      ? 'تم تسجيل النزاع وتجميد الضمان المالي. سيقوم الفريق بالرد خلال 24 ساعة.' 
      : 'Dispute filed & escrow locked. Response guaranteed within 24h SLA.');
    setShowNotificationToast(true);
    setTimeout(() => setShowNotificationToast(false), 5000);
  };

  const getStatusBadge = (status: DisputeTicket['status']) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            {isAr ? 'مفتوح (قيد المراجعة)' : 'Open (In Review)'}
          </span>
        );
      case 'PENDING_USER':
        return (
          <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0 animate-bounce-subtle">
            <Clock className="w-3.5 h-3.5" />
            {isAr ? 'بانتظار ردك وتأكيدك' : 'Pending Your Reply'}
          </span>
        );
      case 'RESOLVED':
      case 'CLOSED':
        return (
          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isAr ? 'تم الحل والإغلاق' : 'Resolved & Closed'}
          </span>
        );
    }
  };

  const getCategoryLabel = (cat: DisputeTicket['category']) => {
    switch (cat) {
      case 'DAMAGE': return isAr ? 'تلف أو كسر في محتويات الطرد' : 'Damaged Goods / Box';
      case 'MISSING': return isAr ? 'نقص بالمحتويات أو فقدان' : 'Missing Package / Items';
      case 'DELAY': return isAr ? 'تأخير مفرط في التوصيل' : 'Delivery Delay';
      case 'OVERCHARGE': return isAr ? 'رسوم زائدة أو خطأ في الفاتورة' : 'Overcharge / Fee Error';
    }
  };

  const filteredDisputes = disputes.filter(d => {
    if (activeFilter === 'OPEN') return d.status === 'OPEN';
    if (activeFilter === 'PENDING_USER') return d.status === 'PENDING_USER';
    if (activeFilter === 'RESOLVED_CLOSED') return d.status === 'RESOLVED' || d.status === 'CLOSED';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* Toast Notification Simulation */}
      <AnimatePresence>
        {showNotificationToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white border border-brand-500/40 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <p className="text-xs font-bold">{toastMessage}</p>
            <button onClick={() => setShowNotificationToast(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                {isAr ? 'مركز النزاعات والتحكيم المالي' : 'Disputes & Claims Center'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'حماية حقوقك المالية عبر نظام الضمان المشدد (Escrow Guarantee) والرد خلال 24 ساعة.' : 'Escrow protected arbitration with guaranteed 24h SLA response.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreating(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-bold text-xs shadow-md shadow-red-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>{isAr ? 'فتح نزاع جديد' : 'Open New Dispute'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'ALL'
              ? 'bg-slate-900 text-white dark:bg-brand-600'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          {isAr ? 'جميع الشكاوى' : 'All Disputes'} ({disputes.length})
        </button>
        <button
          onClick={() => setActiveFilter('OPEN')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'OPEN'
              ? 'bg-amber-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          {isAr ? 'قيد المراجعة' : 'In Review'} ({disputes.filter(d => d.status === 'OPEN').length})
        </button>
        <button
          onClick={() => setActiveFilter('PENDING_USER')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'PENDING_USER'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          {isAr ? 'بانتظار ردك' : 'Pending You'} ({disputes.filter(d => d.status === 'PENDING_USER').length})
        </button>
        <button
          onClick={() => setActiveFilter('RESOLVED_CLOSED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'RESOLVED_CLOSED'
              ? 'bg-emerald-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          {isAr ? 'تم الحل والمغلقة' : 'Resolved'} ({disputes.filter(d => d.status === 'RESOLVED' || d.status === 'CLOSED').length})
        </button>
      </div>

      {/* Main Grid: Responsive 2-column or 1-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[680px]">
        {/* Left Column: Tickets List (4 Cols on Desktop) */}
        <div className={`lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col ${selectedDisputeId ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
            <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-500" />
              {isAr ? 'قائمة التذاكر' : 'Dispute Tickets'}
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              {filteredDisputes.length} {isAr ? 'تذكرة' : 'tickets'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {filteredDisputes.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ShieldCheck className="w-12 h-12 mx-auto mb-2 opacity-30 text-emerald-500" />
                <p className="text-xs font-bold">{isAr ? 'لا توجد نزاعات في هذا التبويب' : 'No disputes in this filter'}</p>
              </div>
            ) : (
              filteredDisputes.map(dispute => {
                const isSelected = selectedDisputeId === dispute.id;
                const remHours = getRemainingSlaHours(dispute);
                const lastMsg = dispute.messages[dispute.messages.length - 1];

                return (
                  <div
                    key={dispute.id}
                    onClick={() => handleSelectDispute(dispute.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-red-50/40 dark:bg-red-950/20 border-red-500/50 shadow-sm ring-1 ring-red-500/20'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {dispute.hasUnreadAdminReply && (
                      <span className="absolute top-2 start-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                    )}

                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-red-500" />
                        #{dispute.id}
                      </span>
                      {getStatusBadge(dispute.status)}
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 line-clamp-1">
                      {getCategoryLabel(dispute.category)}
                    </h4>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between mb-2">
                      <span className="font-mono">{dispute.trackingNumber}</span>
                      {dispute.status === 'OPEN' && (
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                          {isAr ? `رد متوقع: خلال ${remHours}س` : `SLA: within ${remHours}h`}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800/80 line-clamp-2">
                      {lastMsg?.sender === 'ADMIN' ? (isAr ? 'الإدارة: ' : 'Admin: ') : (isAr ? 'أنت: ' : 'You: ')}
                      {lastMsg?.text}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Master Details & Chat (8 Cols on Desktop) */}
        <div className={`lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col ${selectedDisputeId ? 'flex' : 'hidden lg:flex'}`}>
          {selectedDispute ? (
            <>
              {/* Ticket Top Meta Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setSelectedDisputeId(null)}
                    className="lg:hidden p-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer"
                  >
                    {isAr ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                  </button>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        {getCategoryLabel(selectedDispute.category)}
                      </h3>
                      {getStatusBadge(selectedDispute.status)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                      <span>{isAr ? 'تذكرة رقم:' : 'Ticket:'} <strong className="text-slate-800 dark:text-slate-300 font-mono">#{selectedDispute.id}</strong></span>
                      <span>•</span>
                      <span>{isAr ? 'الشحنة:' : 'Shipment:'} <strong className="text-slate-800 dark:text-slate-300 font-mono">{selectedDispute.trackingNumber}</strong></span>
                      <span>•</span>
                      <span>{isAr ? 'المطالبة:' : 'Claim:'} <strong className="text-red-600 font-bold">${selectedDispute.claimAmount || 0}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Quick actions for related shipment */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {onNavigateToShipment && (
                    <button
                      onClick={() => onNavigateToShipment(selectedDispute.shipmentId)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تفاصيل الطلب' : 'View Order'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 2. SLA Commitment Indicator Bar */}
              {selectedDispute.status === 'OPEN' && (
                <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-b border-emerald-500/20 px-4 py-3 flex items-center justify-between gap-3 text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold">
                      {isAr
                        ? 'تم استلام شكواك وتجميد الضمان، سيقوم فريقنا بالرد خلال 24 ساعة كحد أقصى.'
                        : 'Complaint received & escrow locked. Our arbitration team will respond within 24 hours.'}
                    </p>
                  </div>
                  <span className="text-[11px] font-black bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full shrink-0">
                    {isAr ? `متبقي: ~${getRemainingSlaHours(selectedDispute)} ساعة` : `Remaining: ~${getRemainingSlaHours(selectedDispute)}h`}
                  </span>
                </div>
              )}

              {/* 3. Escrow Compensation Banner (If Resolved) */}
              {selectedDispute.compensationAmount && (
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4 flex items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black">
                        {isAr ? 'تم صرف تعويض مالي بموافقة التحكيم' : 'Arbitration Compensation Approved'}
                      </h4>
                      <p className="text-[11px] text-emerald-100">
                        {isAr 
                          ? `تم إضافة مبلغ $${selectedDispute.compensationAmount} إلى رصيدك المتاح في المحفظة تحت قيد: تعويض مالي - نزاع رقم #${selectedDispute.id}`
                          : `Amount of $${selectedDispute.compensationAmount} deposited into your available wallet balance.`}
                      </p>
                    </div>
                  </div>

                  {onNavigateToWallet && (
                    <button
                      onClick={onNavigateToWallet}
                      className="px-3.5 py-1.5 bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-black rounded-xl transition-all shadow-sm shrink-0 cursor-pointer"
                    >
                      {isAr ? 'عرض المحفظة' : 'View Wallet'}
                    </button>
                  )}
                </div>
              )}

              {/* 4. Chat Thread (Audited Messages) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
                {selectedDispute.messages.map(msg => {
                  const isUser = msg.sender === 'USER';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-start rtl:items-start' : 'items-end rtl:items-end'}`}
                    >
                      <div className={`flex items-end gap-2.5 max-w-[90%] sm:max-w-[80%] ${isUser ? 'flex-row' : 'flex-row-reverse'}`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          isUser ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200' : 'bg-red-600 text-white'
                        }`}>
                          {isUser ? <UserIcon className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                        </div>

                        {/* Bubble */}
                        <div className={`p-4 rounded-2xl shadow-sm text-xs leading-relaxed ${
                          isUser
                            ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-xs rtl:rounded-tr-xs rtl:rounded-tl-2xl'
                            : 'bg-gradient-to-r from-red-600 to-red-700 text-white rounded-tr-xs rtl:rounded-tl-xs rtl:rounded-tr-2xl'
                        }`}>
                          {!isUser && (
                            <div className="text-[10px] font-black text-red-200 mb-1 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>{msg.senderName || (isAr ? 'الإدارة والامتثال المركزي' : 'Support & Compliance')}</span>
                            </div>
                          )}

                          <p className="whitespace-pre-line">{msg.text}</p>

                          {/* Media attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              {msg.attachments.map((url, i) => (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="relative aspect-video rounded-xl overflow-hidden border border-white/20 group cursor-pointer block"
                                >
                                  <img src={url} alt="Evidence" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                                    <ExternalLink className="w-3.5 h-3.5 mr-1" /> {isAr ? 'تكبير' : 'Enlarge'}
                                  </div>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <span className={`text-[10px] text-slate-400 mt-1 px-11 ${isUser ? 'text-start' : 'text-end'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}

                {/* 5. Closed State: CSAT Rating & Re-Open Box */}
                {(selectedDispute.status === 'CLOSED' || selectedDispute.status === 'RESOLVED') && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 text-center space-y-4 shadow-sm"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {isAr ? 'تم إغلاق النزاع وحل المسألة' : 'Dispute Resolved & Closed'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {isAr ? 'نأمل أن نكون قد قدمنا حلاً عادلاً وسريعاً يضمن حقوقك.' : 'We hope our support team resolved your dispute fairly and quickly.'}
                      </p>
                    </div>

                    {/* CSAT Rating Section */}
                    {!selectedDispute.rating ? (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 max-w-md mx-auto space-y-3">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {isAr ? 'ما مدى رضاك عن سرعة وتجاوب الدعم الفني؟ (CSAT)' : 'How satisfied are you with our speed & support?'}
                        </p>
                        
                        <div className="flex justify-center gap-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              onMouseEnter={() => setRatingHover(star)}
                              onMouseLeave={() => setRatingHover(0)}
                              onClick={() => handleRateDispute(star)}
                              className="p-1 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                              title={`${star} / 5`}
                            >
                              <Star
                                className={`w-7 h-7 transition-colors ${
                                  (ratingHover || selectedDispute.rating || 0) >= star
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300 dark:text-slate-600'
                                }`}
                              />
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={csatFeedbackText}
                            onChange={(e) => setCsatFeedbackText(e.target.value)}
                            placeholder={isAr ? 'اكتب ملاحظة إضافية عن أداء الموظف (اختياري)...' : 'Additional feedback on support performance...'}
                            className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80">
                        <div className="flex justify-center gap-1.5 mb-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                selectedDispute.rating! >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {isAr ? 'شكراً لتقييمك! تقييمك يساعد الإدارة في مكافأة الموظفين المتميزين.' : 'Thank you! Your rating helps management evaluate team performance.'}
                        </p>
                        {selectedDispute.ratingFeedback && (
                          <p className="text-[11px] text-slate-500 mt-1 italic">"{selectedDispute.ratingFeedback}"</p>
                        )}
                      </div>
                    )}

                    {/* Re-Open Option (Within 7 Days) */}
                    {canReopen(selectedDispute) && (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-700/80">
                        <button
                          onClick={() => handleReopen(selectedDispute.id)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 mx-auto cursor-pointer transition-colors"
                        >
                          <RefreshCcw className="w-3.5 h-3.5 text-brand-500" />
                          <span>{isAr ? 'إعادة فتح النزاع' : 'Re-open Dispute'}</span>
                        </button>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {isAr ? 'متاح خلال 7 أيام من تاريخ الإغلاق بدلاً من فتح تذكرة جديدة مكررة.' : 'Available within 7 days of closure instead of duplicate tickets.'}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* 6. Reply & Input Area (if not closed) */}
              {selectedDispute.status !== 'CLOSED' && selectedDispute.status !== 'RESOLVED' && (
                <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  {/* Optional Attachment URL Box */}
                  {showAttachmentInput && (
                    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type="url"
                        value={newAttachmentUrl}
                        onChange={(e) => setNewAttachmentUrl(e.target.value)}
                        placeholder={isAr ? 'رابط صورة أو لقطة شاشة كدليل (https://...)' : 'Image / Screenshot URL evidence...'}
                        className="flex-1 bg-transparent text-xs outline-none text-slate-800 dark:text-white"
                      />
                      <button
                        onClick={() => setShowAttachmentInput(false)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-400"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAttachmentInput(!showAttachmentInput)}
                      className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                        showAttachmentInput || newAttachmentUrl
                          ? 'bg-brand-50 border-brand-300 text-brand-600 dark:bg-brand-900/30'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
                      }`}
                      title={isAr ? 'إرفاق صورة أو دليل' : 'Attach photo'}
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={isAr ? 'اكتب رسالتك وتوضيحاتك هنا...' : 'Type your message or clarification...'}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white outline-none focus:border-brand-500"
                    />

                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() && !newAttachmentUrl.trim()}
                      className="p-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer shadow-sm"
                    >
                      <Send className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">{isAr ? 'اختر تذكرة لعرض المحادثة' : 'Select a ticket to view chat'}</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                {isAr ? 'يمكنك متابعة تفاصيل النزاع، الرد على المحكمين، أو فتح تذكرة جديدة.' : 'Track dispute resolution, exchange evidence with arbiters, or file a claim.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 7. Modal: Create New Dispute */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs" dir={isAr ? 'rtl' : 'ltr'}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-red-50/50 dark:bg-red-950/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-600 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {isAr ? 'فتح نزاع وطلب تحكيم مالي' : 'Open Dispute & Claim Escrow'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isAr ? 'سيتم تجميد الضمان فوراً وإشعار الإدارة' : 'Escrow locked immediately & SLA 24h'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreating(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreateDispute} className="p-6 space-y-4 overflow-y-auto">
                {/* 1. Related Shipment Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'رقم الشحنة المرتبطة:' : 'Related Shipment ID:'}
                  </label>
                  <select
                    value={newDisputeShipmentId}
                    onChange={(e) => setNewDisputeShipmentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-brand-500"
                  >
                    <option value="SHP-9921">SHP-9921 (TH-AWB-883921) — عمان ← الجزائر</option>
                    <option value="SHP-8812">SHP-8812 (TH-AWB-471092) — دبي ← عمان</option>
                    <option value="SHP-7765">SHP-7765 (TH-AWB-290114) — عمان ← وهران</option>
                  </select>
                </div>

                {/* 2. Dispute Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'تصنيف المشكلة:' : 'Issue Category:'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['DAMAGE', 'MISSING', 'DELAY', 'OVERCHARGE'] as const).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewDisputeCategory(cat)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-start cursor-pointer ${
                          newDisputeCategory === cat
                            ? 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {getCategoryLabel(cat)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Claim Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'مبلغ التعويض المطلوب ($ USD):' : 'Claim Amount ($ USD):'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newDisputeClaimAmount}
                    onChange={(e) => setNewDisputeClaimAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-white outline-none focus:border-brand-500"
                  />
                </div>

                {/* 4. Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'تفاصيل الشكوى والضرر بالتفصيل:' : 'Complaint Details & Evidence Statement:'}
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newDisputeDescription}
                    onChange={(e) => setNewDisputeDescription(e.target.value)}
                    placeholder={isAr ? 'يرجى توضيح حالة الطرد، سبب الشكوى، وأي معلومات تفيد التحكيم...' : 'Describe item condition, missing contents, or fee mismatch...'}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:border-brand-500 resize-none"
                  />
                </div>

                {/* 5. Evidence Photo URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-red-500" />
                    <span>{isAr ? 'رابط صورة أو لقطة شاشة كدليل إثبات:' : 'Photo / Screenshot Evidence URL:'}</span>
                  </label>
                  <input
                    type="url"
                    value={newDisputeEvidenceUrl}
                    onChange={(e) => setNewDisputeEvidenceUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white outline-none focus:border-brand-500 font-mono"
                  />
                  {newDisputeEvidenceUrl && (
                    <div className="mt-2 w-24 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img src={newDisputeEvidenceUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* SLA Notice */}
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>{isAr ? 'مؤشر الاستجابة: سيتم الرد واتخاذ القرار خلال 24 ساعة كحد أقصى.' : 'Response SLA: Decision guaranteed within 24 hours.'}</span>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                  >
                    {isAr ? 'تأكيد وفتح النزاع' : 'Submit & Lock Escrow'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
