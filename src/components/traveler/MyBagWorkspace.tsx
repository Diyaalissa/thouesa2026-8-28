import React, { useState, useMemo, useEffect } from 'react';
import { Trip, Shipment, Locale, ItemCategory } from '../../types';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { 
  Package, Search, CheckCircle2, AlertTriangle, ShieldCheck, 
  MapPin, Clock, QrCode, Grid, List, Check, X, Camera,
  WifiOff, Wifi, Eye, ShieldAlert, Sparkles, Scale, Info, ArrowRight,
  SlidersHorizontal, CheckSquare, Square, RefreshCw, Lock
} from 'lucide-react';
import { formatCurrency } from '../../lib/crypto';
import { ReportIssueModal } from './ReportIssueModal';
import { ImageLightboxModal } from './ImageLightboxModal';
import { CustodyHandoverQRModal } from './CustodyHandoverQRModal';
import { InspectionProofModal } from './InspectionProofModal';
import { CustomsDutyModal } from './CustomsDutyModal';
import { CustomsDutyRecord } from '../../types';

export const categoriesList = [
  { id: 'ELECTRONICS', nameAr: 'إلكترونيات وأجهزة', nameEn: 'Electronics', icon: '📱', isSensitive: true },
  { id: 'DOCUMENTS', nameAr: 'مستندات وأوراق', nameEn: 'Documents', icon: '📄', isSensitive: false },
  { id: 'CLOTHING_TEXTILES', nameAr: 'ملابس ومنسوجات', nameEn: 'Clothing & Textiles', icon: '👕', isSensitive: false },
  { id: 'MEDICATIONS_PERMITTED', nameAr: 'أدوية ومكملات (مسموحة)', nameEn: 'Medications', icon: '💊', isSensitive: true },
  { id: 'GIFTS_COSMETICS', nameAr: 'هدايا وعطور', nameEn: 'Gifts & Cosmetics', icon: '🎁', isSensitive: true },
  { id: 'FOOD_COMMERCIAL_PACKED', nameAr: 'مواد غذائية معلبة', nameEn: 'Packed Food', icon: '🥫', isSensitive: false },
  { id: 'OTHER_SAFE_GOODS', nameAr: 'سلع أخرى (آمنة)', nameEn: 'Other Safe Goods', icon: '📦', isSensitive: false }
];

// Fallback high-fidelity sample shipments if no manifest exists yet for the trip
const DEFAULT_SAMPLE_BAG: Shipment[] = [
  {
    id: 'shp-sample-01',
    idempotencyKey: 'idemp-sample-01',
    trackingNumber: 'TH-JOR-ALG-2026-8841',
    senderId: 'usr-snd-01',
    senderName: 'طارق حسونة (Tariq Hassouneh)',
    senderPhone: '+962 79 123 4567',
    originHubId: 'hub-amm',
    destinationHubId: 'hub-alg',
    recipientName: 'كريم بلقاسم (Karim Belkacem)',
    recipientPhone: '+213 55 123 4567',
    recipientAddress: 'شارع ديدوش مراد، الجزائر العاصمة',
    itemCategory: 'ELECTRONICS',
    itemDescription: 'ساعة ذكية Apple Watch Series 9 أصلية بكرتونتها المصنعية',
    itemCondition: 'NEW_PERSONAL',
    estimatedWeightKg: 0.8,
    actualWeightKg: 0.85,
    declaredValue: 380,
    currency: 'USD',
    dimensionsCm: { length: 15, width: 12, height: 6 },
    itemPhotos: [
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&auto=format&fit=crop&q=80',
    ],
    inspectionPhotos: [
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80',
    ],
    securitySealId: 'SEAL-AMM-98231',
    inspectionNotes: 'تم فحص الرقم التسلسلي ومطابقة الجهاز مع الفاتورة الرسمية والتأكد من خلوه من أي مواد محظورة.',
    currentStatus: 'INSPECTED_AND_SEALED',
    shippingCost: 35,
    customsDutyEstimated: 25,
    escrowDepositRequired: 380,
    insuranceFee: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'shp-sample-02',
    idempotencyKey: 'idemp-sample-02',
    trackingNumber: 'TH-JOR-ALG-2026-9022',
    senderId: 'usr-snd-02',
    senderName: 'مكتب المحاماة الدولي',
    senderPhone: '+962 78 555 1234',
    originHubId: 'hub-amm',
    destinationHubId: 'hub-alg',
    recipientName: 'الدكتور عمار زروقي',
    recipientPhone: '+213 66 987 6543',
    recipientAddress: 'حي حيدرة، الجزائر العاصمة',
    itemCategory: 'DOCUMENTS',
    itemDescription: 'ملف وثائق قانونية مصدقة ومغلفة بظرف أمني مقاوم للماء',
    itemCondition: 'USED_PERSONAL',
    estimatedWeightKg: 0.5,
    actualWeightKg: 0.45,
    declaredValue: 50,
    currency: 'USD',
    dimensionsCm: { length: 30, width: 22, height: 2 },
    itemPhotos: [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
    ],
    securitySealId: 'SEAL-AMM-98232',
    inspectionNotes: 'مستندات وأوراق رسمية غير قابلة للفتح، تم التأكد عبر الماسح الضوئي الأمني.',
    currentStatus: 'INSPECTED_AND_SEALED',
    shippingCost: 25,
    customsDutyEstimated: 0,
    escrowDepositRequired: 50,
    insuranceFee: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'shp-sample-03',
    idempotencyKey: 'idemp-sample-03',
    trackingNumber: 'TH-JOR-ALG-2026-7731',
    senderId: 'usr-snd-03',
    senderName: 'سارة العبداللات',
    senderPhone: '+962 77 444 8899',
    originHubId: 'hub-amm',
    destinationHubId: 'hub-alg',
    recipientName: 'منال قاسي',
    recipientPhone: '+213 77 222 3344',
    recipientAddress: 'بئر مراد رايس، الجزائر',
    itemCategory: 'CLOTHING_TEXTILES',
    itemDescription: 'ملابس أطفال مطرزة وعباءة تقليدية جديدة',
    itemCondition: 'NEW_PERSONAL',
    estimatedWeightKg: 3.5,
    actualWeightKg: 3.4,
    declaredValue: 120,
    currency: 'USD',
    dimensionsCm: { length: 40, width: 30, height: 10 },
    itemPhotos: [
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80',
    ],
    securitySealId: 'SEAL-AMM-98233',
    inspectionNotes: 'أقمشة وملابس شخصية جديدة، تم تغليفها داخل كيس هوائي محكم الإغلاق.',
    currentStatus: 'INSPECTED_AND_SEALED',
    shippingCost: 45,
    customsDutyEstimated: 10,
    escrowDepositRequired: 120,
    insuranceFee: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'shp-sample-04',
    idempotencyKey: 'idemp-sample-04',
    trackingNumber: 'TH-JOR-ALG-2026-6140',
    senderId: 'usr-snd-04',
    senderName: 'صيدلية النور - عمان',
    senderPhone: '+962 6 560 1122',
    originHubId: 'hub-amm',
    destinationHubId: 'hub-alg',
    recipientName: 'ياسين بومدين',
    recipientPhone: '+213 55 888 9900',
    recipientAddress: 'شارع العربي بن مهيدي، وهران',
    itemCategory: 'MEDICATIONS_PERMITTED',
    itemDescription: 'مكملات غذائية وفيتامينات مرخصة ومصحوبة بالوصفة الطبية الأصلية',
    itemCondition: 'NEW_PERSONAL',
    estimatedWeightKg: 1.2,
    actualWeightKg: 1.15,
    declaredValue: 95,
    currency: 'USD',
    dimensionsCm: { length: 20, width: 15, height: 8 },
    itemPhotos: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    ],
    securitySealId: 'SEAL-AMM-98234',
    inspectionNotes: 'أدوية ومكملات في عبواتها الأصلية المحكمة ومرفق تقرير الطبيب المعتمد.',
    currentStatus: 'INSPECTED_AND_SEALED',
    shippingCost: 30,
    customsDutyEstimated: 0,
    escrowDepositRequired: 95,
    insuranceFee: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'shp-sample-05',
    idempotencyKey: 'idemp-sample-05',
    trackingNumber: 'TH-JOR-ALG-2026-5519',
    senderId: 'usr-snd-05',
    senderName: 'متجر العطور الشرقية',
    senderPhone: '+962 79 333 2211',
    originHubId: 'hub-amm',
    destinationHubId: 'hub-alg',
    recipientName: 'سامية بوزيد',
    recipientPhone: '+213 66 111 2233',
    recipientAddress: 'الأبيار، الجزائر العاصمة',
    itemCategory: 'GIFTS_COSMETICS',
    itemDescription: 'طقم عطور وبخور زيتي فاخر مغلف كهدية (سعة السوائل مطابقة لشروط الطيران)',
    itemCondition: 'NEW_PERSONAL',
    estimatedWeightKg: 1.8,
    actualWeightKg: 1.75,
    declaredValue: 160,
    currency: 'USD',
    dimensionsCm: { length: 25, width: 20, height: 12 },
    itemPhotos: [
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format&fit=crop&q=80',
    ],
    securitySealId: 'SEAL-AMM-98235',
    inspectionNotes: 'عبوات غير قابلة للكسر وموضوعة داخل غلاف ماص للصدمات ومطابقة لمعايير IATA.',
    currentStatus: 'INSPECTED_AND_SEALED',
    shippingCost: 38,
    customsDutyEstimated: 18,
    escrowDepositRequired: 160,
    insuranceFee: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface MyBagWorkspaceProps {
  trip: Trip;
  shipments: Shipment[];
  locale: Locale;
}

export const MyBagWorkspace: React.FC<MyBagWorkspaceProps> = ({ trip, shipments, locale }) => {
  const isAr = locale === 'ar';
  
  // Use provided shipments or fallback to default high-fidelity bag items
  const activeBagShipments = useMemo(() => {
    return shipments && shipments.length > 0 ? shipments : DEFAULT_SAMPLE_BAG;
  }, [shipments]);

  const [currentShipments, setCurrentShipments] = useState<Shipment[]>(activeBagShipments);

  // Sync state when props change
  useEffect(() => {
    setCurrentShipments(activeBagShipments);
  }, [activeBagShipments]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [checkedPackages, setCheckedPackages] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Modals state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxShipment, setLightboxShipment] = useState<Shipment | null>(null);
  const [reportingShipment, setReportingShipment] = useState<Shipment | null>(null);
  const [proofShipment, setProofShipment] = useState<Shipment | null>(null);
  const [customsDutyShipment, setCustomsDutyShipment] = useState<Shipment | null>(null);
  const [isHandoverQRModalOpen, setIsHandoverQRModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 6000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Initialize all categories as expanded
  useEffect(() => {
    const cats = new Set(currentShipments.map(s => s.itemCategory));
    setExpandedCategories(cats);
  }, [currentShipments]);

  // Filtered shipments based on search & category
  const filteredShipments = useMemo(() => {
    let list = currentShipments;
    
    if (selectedCategoryFilter !== 'ALL') {
      list = list.filter(s => s.itemCategory === selectedCategoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => 
        s.trackingNumber.toLowerCase().includes(q) || 
        s.itemDescription.toLowerCase().includes(q) ||
        (s.recipientName && s.recipientName.toLowerCase().includes(q))
      );
    }

    return list;
  }, [currentShipments, searchQuery, selectedCategoryFilter]);

  // Grouped by Category
  const categorizedShipments = useMemo(() => {
    const grouped = {} as Record<string, Shipment[]>;
    filteredShipments.forEach(s => {
      if (!grouped[s.itemCategory]) grouped[s.itemCategory] = [];
      grouped[s.itemCategory].push(s);
    });
    return grouped;
  }, [filteredShipments]);

  // Metrics
  const totalPackages = currentShipments.length;
  const totalWeight = currentShipments.reduce((acc, s) => acc + (s.actualWeightKg || s.estimatedWeightKg), 0);
  const totalValue = currentShipments.reduce((acc, s) => acc + (s.declaredValue || 0), 0);
  const totalBookedCapacity = trip.availableWeightKg || 15;
  const progressPercent = totalPackages === 0 ? 0 : Math.round((checkedPackages.size / totalPackages) * 100);
  const isAllChecked = checkedPackages.size === totalPackages && totalPackages > 0;

  // Custody Status Determination
  let custodyStatusText = isAr ? 'بانتظار التفتيش 🟡' : 'Pending Inspection 🟡';
  let custodyStatusBg = 'bg-amber-500/15 text-amber-900 border-amber-300';

  if (trip.status === 'IN_TRANSIT' || trip.status === 'PACKAGES_LINKED' || trip.status === 'ESCROW_LOCKED') {
    custodyStatusText = isAr ? 'في العهدة 🟢' : 'In Custody 🟢';
    custodyStatusBg = 'bg-emerald-500/15 text-emerald-950 border-emerald-300';
  } else if (trip.status === 'ARRIVED' || trip.status === 'COMPLETED') {
    custodyStatusText = isAr ? 'تم التسليم وإخلاء الطرف ⚫' : 'Delivered & Cleared ⚫';
    custodyStatusBg = 'bg-slate-800 text-slate-100 border-slate-700';
  }

  const toggleCategory = (cat: string) => {
    const next = new Set(expandedCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setExpandedCategories(next);
  };

  const toggleCheck = (id: string) => {
    const next = new Set(checkedPackages);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedPackages(next);
  };

  const checkAll = () => {
    setCheckedPackages(new Set(currentShipments.map(s => s.id)));
  };

  const uncheckAll = () => {
    setCheckedPackages(new Set());
  };

  const handleReportIssue = (shipmentId: string, issueType: string, notes: string) => {
    // Remove package temporarily from bag state
    setCurrentShipments(prev => prev.filter(s => s.id !== shipmentId));
    setCheckedPackages(prev => {
      const next = new Set(prev);
      next.delete(shipmentId);
      return next;
    });
  };

  const handleRecordCustomsDuty = (record: CustomsDutyRecord) => {
    setCurrentShipments(prev =>
      prev.map(s => (s.id === record.shipmentId ? { ...s, customsDutyRecord: record } : s))
    );
    setToastMessage(
      isAr
        ? `✅ تم توثيق وصل الجمرك للطرد بنجاح بمبلغ ${record.dutyAmountPaid} ${record.dutyCurrency}. يرجى الاحتفاظ بالوصل الورقي الأصلي للمطابقة في فرع الوصول.`
        : `✅ Customs receipt of ${record.dutyAmountPaid} ${record.dutyCurrency} recorded. Keep physical paper receipt for destination reimbursement.`
    );
  };

  const getCategoryInfo = (catCode: string) => {
    const cat = categoriesList.find(c => c.id === catCode);
    return cat || { id: catCode, nameAr: catCode, nameEn: catCode, icon: '📦', isSensitive: false };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 lg:pb-8" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Dynamic Toast Confirmation */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            className="p-4 bg-emerald-900 text-emerald-50 rounded-2xl shadow-xl border border-emerald-700 flex items-center justify-between gap-3 text-xs font-bold"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🛂</span>
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 rounded-lg hover:bg-emerald-800 text-emerald-300"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header Banner with Offline Caching Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              {isAr ? 'شاشة حقيبتي ومطابقة العهدة (My Bag / Manifest)' : 'My Bag & Custody Manifest'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAr 
              ? 'مساحة العمل الميدانية لفحص وتفتيش الطرود ومطابقتها للأختام الأمنية أمام الجمارك وفي المكاتب.' 
              : 'Interactive workspace to inspect certified parcels, verify security seals, and perform handovers.'}
          </p>
        </div>

        {/* Offline Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold shrink-0 self-start sm:self-center shadow-2xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <Wifi className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isAr ? 'جاهز للعمل بدون إنترنت (محفوظ محلياً)' : 'Offline Ready (Locally Cached)'}</span>
        </div>
      </div>

      {/* 2. Main Layout Grid: Split Screen on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* ========================================================================= */}
        {/* Left Column on RTL / Main Workspace on Center */}
        {/* ========================================================================= */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Quick Search & Filter Toolbar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 ${isAr ? 'right-3.5' : 'left-3.5'} text-slate-400`} />
                <input 
                  type="text"
                  placeholder={isAr ? 'ابحث برقم التتبع أو الوصف (يعمل بدون إنترنت)...' : 'Search by tracking # or description (offline)...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full py-2.5 ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:bg-white focus:outline-none focus:border-teal-500 transition-all`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`absolute top-1/2 -translate-y-1/2 ${isAr ? 'left-3' : 'right-3'} text-slate-400 hover:text-slate-600`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* View Switcher (Desktop) */}
              <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button 
                  onClick={() => setViewMode('cards')}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    viewMode === 'cards' 
                      ? 'bg-white text-slate-900 shadow-xs font-black' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title={isAr ? 'عرض البطاقات' : 'Cards View'}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    viewMode === 'table' 
                      ? 'bg-white text-slate-900 shadow-xs font-black' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title={isAr ? 'عرض الجدول' : 'Table View'}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
              <button
                onClick={() => setSelectedCategoryFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategoryFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {isAr ? 'الكل' : 'All'} ({currentShipments.length})
              </button>

              {categoriesList.map((cat) => {
                const count = currentShipments.filter(s => s.itemCategory === cat.id).length;
                if (count === 0) return null;
                const isSelected = selectedCategoryFilter === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryFilter(cat.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-xs font-black'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{isAr ? cat.nameAr : cat.nameEn}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Desktop Bulk Actions Bar */}
            <div className="hidden lg:flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-500 font-bold">
                <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
                <span>{isAr ? 'الإجراءات المجمعة:' : 'Bulk Inspection:'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={checkAll}
                  className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {isAr ? 'تحديد الكل كمفحوص ✅' : 'Mark All Checked ✅'}
                </button>
                <button
                  onClick={uncheckAll}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {isAr ? 'إلغاء التحديد' : 'Deselect All'}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Gestures Guidance Tip */}
          <div className="lg:hidden flex items-center justify-between p-3 bg-amber-50/80 rounded-2xl border border-amber-200/60 text-[11px] text-amber-900 font-medium">
            <span className="flex items-center gap-1.5">
              <span>👉 اسحب لليمين للتأكيد (✅)</span>
              <span className="opacity-40">|</span>
              <span>👈 اسحب لليسار للإبلاغ (⚠️)</span>
            </span>
          </div>

          {/* Categorized Packages List */}
          <div className="space-y-5">
            {Object.entries(categorizedShipments).map(([categoryCode, items]: [string, Shipment[]]) => {
              const catInfo = getCategoryInfo(categoryCode);
              const isExpanded = expandedCategories.has(categoryCode);
              const isAllCatChecked = items.every(item => checkedPackages.has(item.id));
              const categoryCheckedCount = items.filter(item => checkedPackages.has(item.id)).length;

              return (
                <div key={categoryCode} className="space-y-3">
                  {/* Category Section Header (Collapsible) */}
                  <button 
                    onClick={() => toggleCategory(categoryCode)}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-100/80 hover:bg-slate-200/70 rounded-2xl transition-all border border-slate-200/70 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{catInfo.icon}</span>
                      <h3 className="font-black text-sm text-slate-900">
                        {isAr ? catInfo.nameAr : catInfo.nameEn}
                      </h3>
                      <span className="px-2 py-0.5 bg-white text-slate-700 rounded-full text-[11px] font-bold shadow-2xs border border-slate-200">
                        {categoryCheckedCount} / {items.length} {isAr ? 'طرد' : 'pkgs'}
                      </span>
                      {catInfo.isSensitive && (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-lg border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          {isAr ? 'انتباه جمركي' : 'Customs Attention'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isAllCatChecked && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">{isAr ? 'مكتمل' : 'All Checked'}</span>
                        </span>
                      )}
                      <span className="text-xs text-slate-400 group-hover:text-slate-700 transition-colors font-mono">
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                  </button>

                  {/* Section Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        {viewMode === 'cards' || (typeof window !== 'undefined' && window.innerWidth < 1024) ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pb-2">
                            {items.map(item => (
                              <EnhancedSwipeablePackageCard
                                key={item.id}
                                item={item}
                                isChecked={checkedPackages.has(item.id)}
                                onToggleCheck={() => toggleCheck(item.id)}
                                onReport={() => setReportingShipment(item)}
                                onViewProof={() => setProofShipment(item)}
                                onRecordDuty={() => setCustomsDutyShipment(item)}
                                onImageClick={(url) => {
                                  setLightboxImage(url);
                                  setLightboxShipment(item);
                                }}
                                isAr={isAr}
                              />
                            ))}
                          </div>
                        ) : (
                          /* Desktop Data Table View */
                          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-xs text-start">
                              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                                <tr>
                                  <th className="p-3 w-10 text-center"></th>
                                  <th className="p-3">{isAr ? 'صورة الطرد والوصف' : 'Photo & Description'}</th>
                                  <th className="p-3">{isAr ? 'الوزن الفعلي' : 'Actual Weight'}</th>
                                  <th className="p-3">{isAr ? 'القيمة' : 'Value'}</th>
                                  <th className="p-3">{isAr ? 'تنبيه جمركي وأختام' : 'Customs & Seals'}</th>
                                  <th className="p-3 w-36 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {items.map(item => {
                                  const isChecked = checkedPackages.has(item.id);
                                  const isSensitive = item.itemCategory === 'ELECTRONICS' || item.itemCategory === 'GIFTS_COSMETICS';
                                  const photoUrl = item.itemPhotos?.[0] || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600';
                                  const duty = item.customsDutyRecord;

                                  return (
                                    <tr 
                                      key={item.id} 
                                      className={`hover:bg-slate-50/80 transition-colors ${isChecked ? 'bg-emerald-50/40' : ''}`}
                                    >
                                      <td className="p-3 text-center">
                                        <input 
                                          type="checkbox" 
                                          checked={isChecked}
                                          onChange={() => toggleCheck(item.id)}
                                          className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                                        />
                                      </td>
                                      <td className="p-3">
                                        <div className="flex items-center gap-3">
                                          <img 
                                            src={photoUrl} 
                                            alt="item" 
                                            className="w-11 h-11 rounded-xl object-cover cursor-pointer hover:opacity-80 border border-slate-200 shrink-0 shadow-2xs"
                                            onClick={() => {
                                              setLightboxImage(photoUrl);
                                              setLightboxShipment(item);
                                            }}
                                          />
                                          <div>
                                            <p className="font-bold text-slate-900 text-xs line-clamp-1">{item.itemDescription}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                              <span className="text-[10px] font-mono text-slate-400">{item.trackingNumber}</span>
                                              {duty && (
                                                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded text-[9px] font-bold border border-amber-300">
                                                  🛂 {duty.dutyAmountPaid} {duty.dutyCurrency}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-3 font-mono font-black text-slate-800">
                                        {(item.actualWeightKg || item.estimatedWeightKg).toFixed(2)} kg
                                      </td>
                                      <td className="p-3 font-mono font-bold text-slate-700">
                                        ${item.declaredValue}
                                      </td>
                                      <td className="p-3">
                                        <div className="flex flex-col gap-1 items-start">
                                          {isSensitive ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md text-[10px] font-bold border border-rose-200">
                                              <AlertTriangle className="w-3 h-3" />
                                              {isAr ? 'أعلى الحقيبة ⚠️' : 'Top Luggage ⚠️'}
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold border border-emerald-200">
                                              <ShieldCheck className="w-3 h-3" />
                                              {isAr ? 'آمن' : 'Standard'}
                                            </span>
                                          )}
                                          {item.securitySealId && (
                                            <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1 py-0.5 rounded">
                                              🔒 {item.securitySealId}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="p-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          <button
                                            onClick={() => setCustomsDutyShipment(item)}
                                            className={`p-1.5 rounded-lg transition-colors cursor-pointer text-[10px] font-bold flex items-center gap-1 ${
                                              duty 
                                                ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                                : 'text-amber-700 hover:bg-amber-50 border border-transparent'
                                            }`}
                                            title={isAr ? 'توثيق رسوم جمركية' : 'Customs Duty'}
                                          >
                                            <span>🛂</span>
                                            <span className="hidden xl:inline">{isAr ? 'جمركة' : 'Duty'}</span>
                                          </button>
                                          <button
                                            onClick={() => setProofShipment(item)}
                                            className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                                            title={isAr ? 'تقرير الفحص والأختام' : 'Inspection Proof'}
                                          >
                                            <Eye className="w-4 h-4" />
                                          </button>
                                          <button 
                                            onClick={() => setReportingShipment(item)}
                                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                            title={isAr ? 'إبلاغ عن مشكلة' : 'Report Issue'}
                                          >
                                            <AlertTriangle className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {filteredShipments.length === 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
                <Package className="w-12 h-12 mx-auto text-slate-300 stroke-1" />
                <h4 className="text-base font-bold text-slate-700">
                  {isAr ? 'لا توجد طرود مطابقة لمعايير البحث' : 'No parcels match your search filters'}
                </h4>
                <p className="text-xs text-slate-400">
                  {isAr ? 'جرب البحث برقم تتبع آخر أو إلغاء تصفية الفئات.' : 'Try a different tracking keyword or reset category filter.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Right Column / Sticky Custody Summary & Progress Bar (Desktop & Tablet) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-6">
          
          {/* Custody Summary Dark Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-slate-800 space-y-6">
            {/* Glow backdrop */}
            <div className="absolute top-0 right-0 w-60 h-60 bg-teal-500/10 blur-[80px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-teal-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-slate-900">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base">{isAr ? 'ملخص العهدة والأمانة' : 'Custody Summary'}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    #{trip.id.substring(0, 8).toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Custody Status Badge */}
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${custodyStatusBg}`}>
                {custodyStatusText}
              </span>
            </div>

            {/* Metrics 4-Grid */}
            <div className="grid grid-cols-2 gap-3 relative z-10">
              <div className="bg-slate-800/70 p-3.5 rounded-2xl border border-slate-700/60 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">
                  {isAr ? 'إجمالي الطرود' : 'Total Packages'}
                </span>
                <span className="text-2xl font-black font-mono">{totalPackages}</span>
              </div>

              <div className="bg-slate-800/70 p-3.5 rounded-2xl border border-slate-700/60 space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">
                  {isAr ? 'الوزن الفعلي المحجوز' : 'Actual Weight'}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black font-mono text-emerald-400">{totalWeight.toFixed(1)}</span>
                  <span className="text-[10px] text-slate-400 font-bold">/ {totalBookedCapacity} kg</span>
                </div>
              </div>

              <div className="col-span-2 bg-slate-800/70 p-3.5 rounded-2xl border border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">
                    {isAr ? 'إجمالي القيمة التقديرية (للضمان)' : 'Total Declared Value'}
                  </span>
                  <span className="text-[10px] text-teal-400 font-bold">
                    {isAr ? 'ضمان مسترد 100%' : '100% Refundable'}
                  </span>
                </div>
                <div className="text-xl font-black font-mono text-white">
                  ${totalValue.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400 block">
                  {isAr 
                    ? 'يُعرض لمعرفة قيمة الضمان المالي المسترد بالكامل فور تسليم الطرود.' 
                    : 'Shown to reflect total escrow refundable upon final parcel delivery.'}
                </span>
              </div>
            </div>

            {/* Inspection Progress Bar */}
            <div className="space-y-2 relative z-10 pt-2 border-t border-slate-800">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>{isAr ? 'تقدم الفحص والتفتيش' : 'Inspection Progress'}</span>
                </span>
                <span className="text-teal-400 font-mono">
                  {checkedPackages.size} / {totalPackages} ({progressPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-700">
                <div 
                  className="bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400">
                {isAllChecked 
                  ? (isAr ? '🎉 تم فحص وتأكيد جميع الطرود بنجاح. أنت جاهز للاستلام/التسليم.' : '🎉 All packages verified! Ready for custody handover.') 
                  : (isAr ? `باقي ${totalPackages - checkedPackages.size} طرود بحاجة للمعاينة البصرية والتأكيد.` : `${totalPackages - checkedPackages.size} parcels remaining for visual inspection.`)}
              </p>
            </div>

            {/* Desktop Smart Action Button Inside Sidebar */}
            <div className="pt-2 relative z-10">
              <button
                onClick={() => setIsHandoverQRModalOpen(true)}
                disabled={!isAllChecked}
                className={`w-full py-4 px-6 rounded-2xl font-black text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer
                  ${isAllChecked 
                    ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 hover:shadow-teal-500/25 hover:-translate-y-0.5' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}`}
              >
                {trip.status === 'IN_TRANSIT' || trip.status === 'ARRIVED' ? (
                  <>
                    <QrCode className="w-5 h-5" />
                    <span>{isAr ? 'توليد كود تسليم العهدة 📱' : 'Generate Delivery QR 📱'}</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    <span>{isAr ? 'امسح الباركود لاستلام العهدة 📷' : 'Scan QR to Receive Custody 📷'}</span>
                  </>
                )}
              </button>

              {!isAllChecked && (
                <p className="text-center text-[10px] text-amber-300 font-bold mt-2.5 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl">
                  {isAr ? '🔒 يرجى تحديد وفحص جميع الطرود بالأعلى لتفعيل زر الاستلام.' : '🔒 Please inspect and verify all parcels to unlock action.'}
                </p>
              )}
            </div>
          </div>

          {/* Customs Luggage Packing Advice */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Info className="w-4 h-4" />
              </div>
              <h4 className="font-black text-xs text-slate-900">
                {isAr ? 'إرشادات ترتيب الحقيبة الجمركية' : 'Customs Packing Guideline'}
              </h4>
            </div>
            <ul className="text-[11px] text-slate-600 space-y-1.5 leading-relaxed list-disc list-inside">
              <li>{isAr ? 'ضع الأجهزة الإلكترونية والهدايا الثمينة في الطبقة العليا للحقيبة.' : 'Place electronics & declared gifts at the top layer of your bag.'}</li>
              <li>{isAr ? 'احتفظ بنسخة مانيفست الشحن الرقمية على هاتفك لإبرازها لمفتش الجمارك.' : 'Keep digital manifest handy for customs inspection.'}</li>
              <li>{isAr ? 'لا تكسر الأختام الأمنية البلاستيكية المشفرة قبل وصول مكتب الوجهة.' : 'Never break tamper seals before destination hub handover.'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Sticky Bottom Action Button for Mobile (Thumb-friendly Floating Bar) */}
      {/* ========================================================================= */}
      <div className="lg:hidden fixed bottom-18 left-4 right-4 z-40">
        <div className="bg-slate-900/95 backdrop-blur-md p-3.5 rounded-3xl shadow-2xl border border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-300 font-bold">
              {isAr ? 'تقدم الفحص:' : 'Progress:'} <span className="text-teal-400 font-mono">{checkedPackages.size}/{totalPackages}</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">{totalWeight.toFixed(1)} kg</span>
          </div>

          <button
            onClick={() => setIsHandoverQRModalOpen(true)}
            disabled={!isAllChecked}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer
              ${isAllChecked 
                ? 'bg-teal-500 text-slate-950 shadow-teal-500/20' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
          >
            {trip.status === 'IN_TRANSIT' || trip.status === 'ARRIVED' ? (
              <>
                <QrCode className="w-4 h-4" />
                <span>{isAr ? 'توليد كود تسليم العهدة 📱' : 'Generate Delivery QR 📱'}</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>{isAr ? 'امسح الباركود لاستلام العهدة 📷' : 'Scan QR to Receive Custody 📷'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Modals & Dialogs */}
      {/* ========================================================================= */}
      
      {/* 1. Report Issue Modal */}
      <ReportIssueModal
        isOpen={!!reportingShipment}
        onClose={() => setReportingShipment(null)}
        shipment={reportingShipment}
        locale={locale}
        onSubmitReport={handleReportIssue}
      />

      {/* 2. Image Lightbox Zoom Modal */}
      <ImageLightboxModal
        isOpen={!!lightboxImage}
        imageUrl={lightboxImage}
        shipment={lightboxShipment}
        locale={locale}
        onClose={() => {
          setLightboxImage(null);
          setLightboxShipment(null);
        }}
      />

      {/* 3. Custody Handover QR Modal */}
      <CustodyHandoverQRModal
        isOpen={isHandoverQRModalOpen}
        onClose={() => setIsHandoverQRModalOpen(false)}
        trip={trip}
        totalWeight={totalWeight}
        packageCount={totalPackages}
        locale={locale}
        mode={trip.status === 'IN_TRANSIT' || trip.status === 'ARRIVED' ? 'DELIVER_AT_DEST' : 'RECEIVE_AT_ORIGIN'}
      />

      {/* 4. Inspection & Digital Seal Proof Modal */}
      <InspectionProofModal
        isOpen={!!proofShipment}
        onClose={() => setProofShipment(null)}
        shipment={proofShipment}
        locale={locale}
      />

      {/* 5. Customs Duty Incurred & Tax Receipt Upload Modal */}
      <CustomsDutyModal
        isOpen={!!customsDutyShipment}
        onClose={() => setCustomsDutyShipment(null)}
        shipment={customsDutyShipment}
        locale={locale}
        onSubmitDutyRecord={handleRecordCustomsDuty}
      />
    </div>
  );
};

// ============================================================================
// Enhanced Swipeable Package Card Subcomponent (Mobile + Cards View)
// ============================================================================
interface EnhancedSwipeableCardProps {
  item: Shipment;
  isChecked: boolean;
  onToggleCheck: () => void;
  onReport: () => void;
  onViewProof: () => void;
  onRecordDuty: () => void;
  onImageClick: (url: string) => void;
  isAr: boolean;
}

const EnhancedSwipeablePackageCard: React.FC<EnhancedSwipeableCardProps> = ({
  item,
  isChecked,
  onToggleCheck,
  onReport,
  onViewProof,
  onRecordDuty,
  onImageClick,
  isAr,
}) => {
  const controls = useAnimation();
  const photoUrl = item.itemPhotos?.[0] || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600';
  const isSensitive = item.itemCategory === 'ELECTRONICS' || item.itemCategory === 'GIFTS_COSMETICS' || item.itemCategory === 'MEDICATIONS_PERMITTED';
  const duty = item.customsDutyRecord;

  const handleDragEnd = (event: any, info: any) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    // In RTL: dragging right is positive offset
    if (offset > 70 || velocity > 400) {
      if (!isChecked) onToggleCheck();
      controls.start({ x: 0 });
    } 
    // Dragging left (negative offset)
    else if (offset < -70 || velocity < -400) {
      onReport();
      controls.start({ x: 0 });
    } 
    else {
      controls.start({ x: 0 });
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-100 border border-slate-200/80 shadow-2xs">
      {/* Background Swipe Actions Indicators */}
      <div className="absolute inset-0 flex items-center justify-between px-5 font-bold text-xs">
        <div className="flex items-center gap-1.5 text-emerald-600 font-black">
          <Check className="w-5 h-5" />
          <span>{isAr ? 'تأكيد الفحص ✅' : 'Verified ✅'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-rose-600 font-black">
          <span>{isAr ? 'إبلاغ ⚠️' : 'Report ⚠️'}</span>
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>

      {/* Draggable Card Surface */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.25}
        onDragEnd={handleDragEnd}
        animate={controls}
        className={`relative z-10 flex flex-col p-4 bg-white rounded-3xl shadow-sm transition-all border ${
          isChecked 
            ? 'border-emerald-400 bg-emerald-50/15' 
            : 'border-slate-200/80 hover:border-slate-300'
        }`}
      >
        <div className="flex items-start gap-3.5">
          {/* Photo with Tap to Lightbox */}
          <div className="relative shrink-0 group">
            <img 
              src={photoUrl} 
              alt="package photo" 
              className="w-20 h-20 sm:w-22 sm:h-22 object-cover rounded-2xl border border-slate-200 shadow-2xs group-hover:opacity-90 transition-opacity cursor-zoom-in"
              onClick={() => onImageClick(photoUrl)}
            />
            {/* Checkbox Trigger Pill */}
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCheck();
              }}
              className={`absolute -bottom-2 -end-2 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-md transition-all cursor-pointer ${
                isChecked 
                  ? 'bg-emerald-500 text-white scale-110' 
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
              }`}
              title={isAr ? 'تأكيد الفحص' : 'Check inspection'}
            >
              <Check className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
          
          {/* Content Details */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-start justify-between gap-1.5">
              <h4 className="font-black text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug">
                {item.itemDescription}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <p className="text-[10px] font-mono text-slate-400">
                {item.trackingNumber}
              </p>
              {duty && (
                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded text-[9px] font-black border border-amber-300">
                  🛂 {duty.dutyAmountPaid} {duty.dutyCurrency}
                </span>
              )}
            </div>

            {/* Weight & Declared Value */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 font-mono">
                {(item.actualWeightKg || item.estimatedWeightKg).toFixed(2)} kg
              </span>
              <span className="text-[11px] font-bold text-slate-600 font-mono">
                ${item.declaredValue}
              </span>
              {item.securitySealId && (
                <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" />
                  <span>{item.securitySealId}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Customs Advice & Action Footer */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          {isSensitive ? (
            <div className="flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-xl border border-rose-200/70">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>{isAr ? '⚠️ يوضع بأعلى الحقيبة' : '⚠️ Top of Bag for Customs'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-xl border border-emerald-200/70">
              <ShieldCheck className="w-3 h-3 shrink-0" />
              <span>{isAr ? 'طرد آمن ومطابق' : 'Customs Cleared'}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            {/* Customs Duty Button */}
            <button
              onClick={onRecordDuty}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer text-[11px] font-bold flex items-center gap-1 ${
                duty 
                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
              title={isAr ? 'بروتوكول الرسوم الجمركية' : 'Customs Duty Incurred'}
            >
              <span>🛂</span>
              <span className="hidden sm:inline">
                {isAr ? (duty ? 'الوصل الجمركي' : 'تمت جمركته') : (duty ? 'Receipt' : 'Duty')}
              </span>
            </button>

            <button
              onClick={onViewProof}
              className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-xl transition-colors cursor-pointer text-[11px] font-bold flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'الأختام' : 'Proof'}</span>
            </button>

            <button
              onClick={onReport}
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-[11px] font-bold flex items-center gap-1"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'إبلاغ' : 'Report'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
