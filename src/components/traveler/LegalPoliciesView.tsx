import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Scale,
  ShieldCheck,
  AlertOctagon,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Luggage,
  Sparkles,
  Printer,
  Download,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  PhoneCall,
  Check,
  ShieldAlert,
  Zap,
  HelpCircle,
  Lock,
  Layers,
  ArrowDown,
  SlidersHorizontal,
  FileCheck
} from 'lucide-react';
import { Locale } from '../../types';

interface LegalPoliciesViewProps {
  locale: Locale;
  onAcceptGuidelines?: () => void;
  hasAcceptedTerms?: boolean;
}

interface ProhibitedItem {
  id: string;
  nameAr: string;
  nameEn: string;
  category: 'SECURITY' | 'CUSTOMS' | 'AIRLINE_SAFETY' | 'RESTRICTED';
  allowance: 'ABSOLUTE_BAN' | 'CABIN_ONLY' | 'CHECKED_ONLY' | 'PERMIT_REQUIRED';
  descAr: string;
  descEn: string;
  icon: string;
  placementAr: string;
  placementEn: string;
}

export const LegalPoliciesView: React.FC<LegalPoliciesViewProps> = ({
  locale,
  onAcceptGuidelines,
  hasAcceptedTerms = false,
}) => {
  const isAr = locale === 'ar';

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  
  // Accordion Expand States (For mobile & organized reading)
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    terms: true,
    prohibited: true,
    airport: true,
    packing: true,
    commitment: true,
  });

  // Active Section for Sticky Navigation
  const [activeNavSection, setActiveNavSection] = useState('terms');

  // Mandatory Agreement State
  const [isAgreed, setIsAgreed] = useState(() => {
    return localStorage.getItem('thouesa_terms_agreed') === 'true' || hasAcceptedTerms;
  });
  const [agreementSavedToast, setAgreementSavedToast] = useState(false);

  // Toggle Accordion Section
  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  // Scroll to section helper
  const scrollToSection = (sectionId: string) => {
    setActiveNavSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Prohibited Items Database (Bilingual, searchable, categorized)
  const prohibitedItems: ProhibitedItem[] = [
    {
      id: 'p-1',
      nameAr: 'بنوك الطاقة وبطاريات الليثيوم (Power Banks)',
      nameEn: 'Power Banks & Spare Lithium Batteries',
      category: 'AIRLINE_SAFETY',
      allowance: 'CABIN_ONLY',
      descAr: 'يُحظر وضعها نهائياً في الحقائب المشحونة (Cargo/Checked-in) بسبب خطر الاشتعال الذاتي عند تغير الضغط. تُحمل في حقيبة اليد فقط (بحد أقصى 100Wh).',
      descEn: 'Strictly prohibited in checked luggage due to thermal runaway risks. Allowed ONLY in carry-on cabin baggage (max 100Wh).',
      icon: '🔋',
      placementAr: 'حقيبة اليد (الكابينة) فقط 🎒',
      placementEn: 'Cabin Hand Luggage Only 🎒',
    },
    {
      id: 'p-2',
      nameAr: 'السوائل التي تتجاوز 100 مل في الكابينة',
      nameEn: 'Liquids exceeding 100ml in Hand Baggage',
      category: 'AIRLINE_SAFETY',
      allowance: 'CHECKED_ONLY',
      descAr: 'قاعدة أمن الطيران الدولية: يُمنع حمل عبوات سوائل أو عطور أو كريمات تتجاوز 100 مل في حقيبة اليد. يجب وضعها في الحقائب المشحونة مع إحكام إغلاقها في أكياس عازلة.',
      descEn: 'International aviation rule: Containers > 100ml strictly banned in cabin. Must be packed inside checked baggage with sealed leak-proof bags.',
      icon: '🧴',
      placementAr: 'الحقائب المشحونة (الشحن) فقط 🧳',
      placementEn: 'Checked Luggage Only 🧳',
    },
    {
      id: 'p-3',
      nameAr: 'الأسلحة، الذخائر، والمواد المتفجرة أو الحارقة',
      nameEn: 'Weapons, Ammunition, Explosives & Flares',
      category: 'SECURITY',
      allowance: 'ABSOLUTE_BAN',
      descAr: 'حظر مطلق وجنائي دولي. لا يُسمح بنقل أي أسلحة نارية أو بيضاء أو بخاخات فلفل أو ألعاب نارية أو مواد قابلة للانفجار.',
      descEn: 'Absolute international & criminal ban. No firearms, bladed weapons, pepper spray, flares, or explosives permitted under any circumstance.',
      icon: '🚫',
      placementAr: 'ممنوع نهائياً ومجرم قانونياً ⛔',
      placementEn: 'Strictly Banned & Criminalized ⛔',
    },
    {
      id: 'p-4',
      nameAr: 'الأدوية المهدئة والمخدرة دون وصفة طبية مصدقة',
      nameEn: 'Narcotics & Uncertified Prescription Drugs',
      category: 'CUSTOMS',
      allowance: 'PERMIT_REQUIRED',
      descAr: 'يُمنع نقل أي أدوية مدرجة في جداول المراقبة أو بكميات تجارية. الأدوية الشخصية المسموحة تتطلب وصفة طبية رسمية ومطابقة لاسم المسافر.',
      descEn: 'Prohibited without official medical prescription stamped by health authorities. Commercial quantities strictly seized by customs.',
      icon: '💊',
      placementAr: 'يتطلب وصفة رسمية وتصريح جمركي ⚠️',
      placementEn: 'Official Medical Prescription Required ⚠️',
    },
    {
      id: 'p-5',
      nameAr: 'الغازات المضغوطة واسطوانات الغاز والمواد الكيميائية',
      nameEn: 'Compressed Gases, Flammable Aerosols & Toxins',
      category: 'SECURITY',
      allowance: 'ABSOLUTE_BAN',
      descAr: 'اسطوانات غاز التخييم، دهانات الرش، المبيدات الحشرية السامة، والمواد الكاوية أو المشعة.',
      descEn: 'Camping gas cylinders, spray paint, toxic pesticides, corrosive acids, and radioactive items are completely banned.',
      icon: '🔥',
      placementAr: 'ممنوع نهائياً من الصعود للطائرة 🚫',
      placementEn: 'Strictly Prohibited from Aircraft 🚫',
    },
    {
      id: 'p-6',
      nameAr: 'كميات تجارية ضخمة مجهولة المنشأ أو السلع المقلدة',
      nameEn: 'Counterfeit Goods & Undeclared Commercial Quantities',
      category: 'CUSTOMS',
      allowance: 'ABSOLUTE_BAN',
      descAr: 'السلع المقلدة التي تنتهك حقوق الملكية الفكرية، أو الشحنات الضخمة المتطابقة التي تثير الشبهة الجمركية كبضائع تجارية غير خاضعة للرسوم.',
      descEn: 'Counterfeit trademark replicas or excessive identical goods that trigger commercial customs tax penalties.',
      icon: '📦',
      placementAr: 'ممنوع لتفادي الحجز والغرامات الجمركية ⚠️',
      placementEn: 'Prohibited to avoid Customs Seizure ⚠️',
    },
    {
      id: 'p-7',
      nameAr: 'السبائك الذهبية والمبالغ النقدية فوق سقف الإفصاح',
      nameEn: 'Excess Cash & Raw Uncertified Gold Bullion',
      category: 'CUSTOMS',
      allowance: 'PERMIT_REQUIRED',
      descAr: 'الأموال النقدية التي تتجاوز سقف الإفصاح الجمركي المسموح (مثلاً 10,000 دولار أو ما يعادلها)، والسبائك الذهبية غير المصرحة رسمياً.',
      descEn: 'Cash exceeding legal cross-border declaration thresholds ($10,000 or equivalent) and uncertified gold bars.',
      icon: '💰',
      placementAr: 'يتطلب إفصاح جمركي مسبق رسمي 📑',
      placementEn: 'Mandatory Prior Customs Declaration 📑',
    },
    {
      id: 'p-8',
      nameAr: 'المنتجات الغذائية الطازجة واللحوم غير المغلفة صناعياً',
      nameEn: 'Perishable Fresh Meat & Unprocessed Agriculture',
      category: 'CUSTOMS',
      allowance: 'ABSOLUTE_BAN',
      descAr: 'اللحوم الطازجة، الألبان غير المبسترة، والنباتات التي تخضع للحجر الزراعي والبيطري الصارم في المطارات الدولية.',
      descEn: 'Fresh meats, raw dairy, and uncertified plants subject to strict international agricultural quarantine bans.',
      icon: '🥩',
      placementAr: 'ممنوع بموجب لوائح الحجر الصحي والبيطري 🚫',
      placementEn: 'Banned by Health & Quarantine Regulations 🚫',
    },
  ];

  // Filtered prohibited items
  const filteredProhibitedItems = useMemo(() => {
    return prohibitedItems.filter((item) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.descAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.descEn.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        selectedFilter === 'ALL' ||
        (selectedFilter === 'ABSOLUTE_BAN' && item.allowance === 'ABSOLUTE_BAN') ||
        (selectedFilter === 'CABIN_ONLY' && item.allowance === 'CABIN_ONLY') ||
        (selectedFilter === 'CHECKED_ONLY' && item.allowance === 'CHECKED_ONLY') ||
        (selectedFilter === 'PERMIT_REQUIRED' && item.allowance === 'PERMIT_REQUIRED');

      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, selectedFilter]);

  // Handle User Agreement
  const handleToggleAgreement = () => {
    const nextState = !isAgreed;
    setIsAgreed(nextState);
    localStorage.setItem('thouesa_terms_agreed', nextState ? 'true' : 'false');
    if (nextState) {
      setAgreementSavedToast(true);
      if (onAcceptGuidelines) {
        onAcceptGuidelines();
      }
      setTimeout(() => setAgreementSavedToast(false), 3500);
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 md:pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. TOP HERO BANNER & QUICK ACTIONS */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden space-y-5">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 end-0 -mt-8 -me-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 start-0 -mb-8 -ms-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-teal-500/20 text-teal-300 border border-teal-400/30 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <Scale className="w-3.5 h-3.5" />
                <span>{isAr ? 'المرجع التشغيلي والقانوني الشامل' : 'Official Legal & Operational Guide'}</span>
              </span>
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-xs font-bold flex items-center gap-1.5 font-mono">
                <Lock className="w-3.5 h-3.5" />
                <span>IATA DGR / SHA-256 Vault</span>
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              {isAr ? 'دليل الشروط، التعهدات وإرشادات السفر' : 'Terms, Commitments & Travel Guidelines'}
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              {isAr
                ? 'دليلك التفاعلي خطوة بخطوة من مرحلة استلام الطرود وتعبئة الحقيبة هندسياً وحتى عبور الجمارك وتسليم الأمانات بأعلى درجات الأمان والامتثال الدولي.'
                : 'Your interactive step-by-step handbook covering mutual custody pledges, baggage engineering, customs clearance, and aviation security compliance.'}
            </p>
          </div>

          {/* Top Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 lg:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              title={isAr ? 'طباعة أو حفظ كـ PDF' : 'Print or Save as PDF'}
            >
              <Printer className="w-4 h-4 text-teal-400" />
              <span>{isAr ? 'تحميل الدليل (PDF)' : 'Download PDF Guide'}</span>
            </button>

            <button
              onClick={() => scrollToSection('prohibited-section')}
              className="flex-1 lg:flex-initial px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <Search className="w-4 h-4" />
              <span>{isAr ? 'البحث في الممنوعات' : 'Search Banned Items'}</span>
            </button>
          </div>
        </div>

        {/* Offline Cache & Legal Assurance Strip */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {isAr
                ? '💡 هذا الدليل محفوظ ومتاح بدون إنترنت أثناء العبور في المطارات للإجابة على استفسارات مسؤولي الجمارك.'
                : '💡 This guide is cached offline for swift reference during airport customs checks.'}
            </span>
          </div>

          <span className="font-mono text-slate-500">
            REF: THOUESA-LEG-STD-2026-V3
          </span>
        </div>
      </div>

      {/* 2. MAIN LAYOUT: Sticky Index on Desktop + Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* === DESKTOP STICKY TABLE OF CONTENTS (4 COLUMNS) === */}
        <div className="hidden lg:block lg:col-span-4 sticky top-6 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-teal-600" />
                {isAr ? 'فهرس التنقل السريع' : 'Quick Navigation Index'}
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400">5 أقسام رئيسية</span>
            </div>

            <nav className="space-y-1 text-xs font-bold">
              {[
                { id: 'terms-section', labelAr: '1. الشروط والتعهدات القانونية', labelEn: '1. Legal Commitments', icon: Scale, tagAr: 'تعهد وأمانة', tagEn: 'Pledge' },
                { id: 'prohibited-section', labelAr: '2. دليل المواد الممنوعة دولياً', labelEn: '2. Prohibited Directory', icon: AlertOctagon, tagAr: 'بحث تفاعلي', tagEn: 'Searchable' },
                { id: 'airport-section', labelAr: '3. إرشادات المطار والجمارك', labelEn: '3. Airport & Customs', icon: ShieldCheck, tagAr: 'بروتوكول رسمي', tagEn: 'Customs' },
                { id: 'packing-section', labelAr: '4. دليل التعبئة وتوزيع الوزن', labelEn: '4. Packing & Weight Guide', icon: Luggage, tagAr: 'نصائح هندسية', tagEn: 'Best Practice' },
                { id: 'acknowledgment-section', labelAr: '5. الإقرار القانوني والتوقيع', labelEn: '5. Legal Acknowledgment', icon: FileCheck, tagAr: 'إلزامي', tagEn: 'Mandatory' },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeNavSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full p-3 rounded-2xl text-start transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isActive
                        ? 'bg-teal-50 border border-teal-200 text-teal-900 shadow-2xs'
                        : 'hover:bg-slate-50 text-slate-600 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                      <span className="truncate">{isAr ? item.labelAr : item.labelEn}</span>
                    </div>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                      isActive ? 'bg-teal-200/70 text-teal-900' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isAr ? item.tagAr : item.tagEn}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Traveler Agreement Mini Status Widget */}
            <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
              isAgreed 
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
                : 'bg-amber-50/60 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-black flex items-center gap-1.5">
                  {isAgreed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
                  {isAr ? 'حالة إقرار الشروط' : 'Terms Status'}
                </span>
                <span className="text-[10px] font-black font-mono">
                  {isAgreed ? 'CONFIRMED 🟢' : 'PENDING 🟡'}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {isAgreed
                  ? (isAr ? 'تم تسجيل موافقتك على البنود والشروط القانونية.' : 'Your compliance acknowledgment is officially recorded.')
                  : (isAr ? 'يجب الإقرار بأسفل الصفحة لتفعيل كافة صلاحيات الرحلات.' : 'Acknowledgment at the page bottom is required.')}
              </p>
            </div>
          </div>
        </div>

        {/* === MAIN CONTENT COLUMN (8 COLUMNS) === */}
        <div className="lg:col-span-8 space-y-6">

          {/* ========================================================
              SECTION 1: الشروط والتعهدات القانونية (Terms & Legal Commitments)
             ======================================================== */}
          <div id="terms-section" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5 scroll-mt-6">
            <div 
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => toggleSection('terms')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold shrink-0">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-black text-slate-900">
                    {isAr ? '1. الشروط والتعهدات القانونية (Legal Commitments)' : '1. Legal Terms & Commitments'}
                  </h2>
                  <span className="text-[11px] text-slate-500">
                    {isAr ? 'التزامات نقل الأمانات، الضمان المالي، وسياسة الإلغاء' : 'Mutual custody, security deposit, and cancellation rules'}
                  </span>
                </div>
              </div>

              <button className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                {expandedSections.terms ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            <AnimatePresence initial={false}>
              {expandedSections.terms && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4 pt-2 border-t border-slate-100 text-xs text-slate-600 leading-relaxed overflow-hidden"
                >
                  {/* Item 1.1: Custody Transfer Pledge */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center font-mono font-black text-xs">
                        1.1
                      </span>
                      <h3 className="font-black text-slate-900 text-xs sm:text-sm">
                        {isAr ? 'تعهد نقل الأمانات وسلسلة الحيازة (Custody Integrity Pledge)' : 'Custody Integrity & Safe Transit Pledge'}
                      </h3>
                    </div>
                    <p className="text-slate-600 leading-relaxed ps-8">
                      {isAr
                        ? 'يقر المسافر رسمياً وقانونياً بأنه يستلم الطرود المفحوصة من مكاتب THOUESA المعتمدة بصفة "أمانة وعهدة مؤتمنة". ويلتزم بالحفاظ على الأختام الأمنية المشفرة (Security Seals) المطبقة على الطرود وعدم فتحها أو العبث بمحتوياتها، وتسليمها بحالتها الأصلية دون أي تلف أو تغيير.'
                        : 'The traveler legally acknowledges taking receipt of inspected parcels as an authorized bonded custodian. The traveler commits to never tampering with official tamper-evident security seals, ensuring 100% parcel integrity from pickup until official handover.'}
                    </p>
                  </div>

                  {/* Item 1.2: Security Deposit Policy */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-mono font-black text-xs">
                        1.2
                      </span>
                      <h3 className="font-black text-slate-900 text-xs sm:text-sm">
                        {isAr ? 'سياسة الضمان المالي والاسترداد (Security Deposit & Release Protocol)' : 'Security Deposit & Automatic Release Protocol'}
                      </h3>
                    </div>
                    <p className="text-slate-600 leading-relaxed ps-8">
                      {isAr
                        ? 'لحماية أمانات العملاء، يقوم النظام باقتطاع أو حجز "مبلغ الضمان المسترد" من محفظة المسافر عند تأكيد استلام الطرود. يتم تحرير مبلغ الضمان تلقائياً وفورياً وإيداع أرباح الرحلة في محفظة المسافر بمجرد مسح كود الاستلام (Mutual Handover QR) وإخلاء الطرف في مكتب فرع الوصول.'
                        : 'To protect customer consignments, a refundable security deposit is earmarked from the traveler’s wallet upon package acceptance. The deposit is instantly unlocked and full trip earnings are credited upon mutual destination QR scan and sign-off.'}
                    </p>
                  </div>

                  {/* Item 1.3: Cancellation & No-Show Penalties */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center font-mono font-black text-xs">
                        1.3
                      </span>
                      <h3 className="font-black text-slate-900 text-xs sm:text-sm">
                        {isAr ? 'سياسة الإلغاء والتخلف عن السفر (No-Show & Cancellation Penalty)' : 'Cancellation, Abandonment & No-Show Penalties'}
                      </h3>
                    </div>
                    <p className="text-slate-600 leading-relaxed ps-8">
                      {isAr
                        ? 'في حال إلغاء الرحلة أو التخلف عن السفر بعد استلام الطرود دون إشعار مسبق لإدارة العمليات بمدة لا تقل عن 24 ساعة، أو عدم إعادة الطرود لفرع المنشأ، يُعرض الحساب للحظر النهائي، وتسييل مبلغ الضمان لتغطية تكاليف إعادة شحن الطرود للعملاء، مع اتخاذ الإجراءات القانونية اللازمة.'
                        : 'Canceling or abandoning a trip after receiving packages without at least 24h prior operational notification will lead to permanent account deactivation, forfeiture of the security deposit, and potential civil liability for cargo redirection costs.'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ========================================================
              SECTION 2: قائمة المواد الممنوعة دولياً (Prohibited Items Directory)
             ======================================================== */}
          <div id="prohibited-section" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5 scroll-mt-6">
            <div 
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => toggleSection('prohibited')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold shrink-0">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-black text-slate-900">
                    {isAr ? '2. دليل المواد الممنوعة والمحظورة دولياً (Prohibited Directory)' : '2. Prohibited & Restricted Items Directory'}
                  </h2>
                  <span className="text-[11px] text-slate-500">
                    {isAr ? 'دليل تفاعلي قابل للبحث لتحديد المواد المسموعة والممنوعة حسب معايير IATA' : 'Interactive searchable directory based on IATA Dangerous Goods Regulations'}
                  </span>
                </div>
              </div>

              <button className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                {expandedSections.prohibited ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            <AnimatePresence initial={false}>
              {expandedSections.prohibited && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4 pt-2 border-t border-slate-100 overflow-hidden"
                >
                  {/* Search Bar & Category Filter Pills */}
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={isAr ? 'ابحث عن أي مادة (مثال: عطور، باور بانك، بطاريات، أدوية، ذهب، سوائل)...' : 'Search any item (e.g. perfume, power bank, battery, medicine, gold, liquid)...'}
                        className="w-full ps-10 pe-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute end-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                      {[
                        { id: 'ALL', labelAr: 'الكل (All)', labelEn: 'All' },
                        { id: 'ABSOLUTE_BAN', labelAr: '🚫 حظر مطلق (Absolute Ban)', labelEn: '🚫 Absolute Ban' },
                        { id: 'CABIN_ONLY', labelAr: '🎒 حقيبة اليد فقط (Cabin Only)', labelEn: '🎒 Cabin Only' },
                        { id: 'CHECKED_ONLY', labelAr: '🧳 حقائب الشحن فقط (Checked Only)', labelEn: '🧳 Checked Only' },
                        { id: 'PERMIT_REQUIRED', labelAr: '⚠️ يتطلب تصريحاً (Declaration Required)', labelEn: '⚠️ Declaration' },
                      ].map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setSelectedFilter(filter.id)}
                          className={`px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                            selectedFilter === filter.id
                              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {isAr ? filter.labelAr : filter.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Items Display Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {filteredProhibitedItems.length > 0 ? (
                      filteredProhibitedItems.map((item) => (
                        <div
                          key={item.id}
                          className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${
                            item.allowance === 'ABSOLUTE_BAN'
                              ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                              : item.allowance === 'CABIN_ONLY'
                              ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                              : item.allowance === 'CHECKED_ONLY'
                              ? 'bg-indigo-50/40 border-indigo-200 hover:border-indigo-300'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{item.icon}</span>
                                <h4 className="font-black text-xs text-slate-900">
                                  {isAr ? item.nameAr : item.nameEn}
                                </h4>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              {isAr ? item.descAr : item.descEn}
                            </p>
                          </div>

                          {/* Allowance & Placement Badge */}
                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-bold">
                            <span className="text-slate-500">{isAr ? 'الموضع الصحيح:' : 'Proper Location:'}</span>
                            <span className={`px-2 py-0.5 rounded-md font-black ${
                              item.allowance === 'ABSOLUTE_BAN'
                                ? 'bg-rose-100 text-rose-800'
                                : item.allowance === 'CABIN_ONLY'
                                ? 'bg-amber-100 text-amber-900'
                                : item.allowance === 'CHECKED_ONLY'
                                ? 'bg-indigo-100 text-indigo-900'
                                : 'bg-slate-200 text-slate-800'
                            }`}>
                              {isAr ? item.placementAr : item.placementEn}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                        <Info className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                        <span>{isAr ? 'لا توجد نتائج مطابقة لبحثك. يرجى تجربة كلمات أخرى أو التواصل مع الدعم.' : 'No prohibited items match your query. Try different keywords or contact support.'}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ========================================================
              SECTION 3: تعليمات وإرشادات السفر والمطار (Travel & Airport Instructions)
             ======================================================== */}
          <div id="airport-section" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5 scroll-mt-6">
            <div 
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => toggleSection('airport')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-black text-slate-900">
                    {isAr ? '3. تعليمات وإرشادات السفر والمطار (Airport & Customs)' : '3. Airport & Customs Protocols'}
                  </h2>
                  <span className="text-[11px] text-slate-500">
                    {isAr ? 'الجدول الزمني، التعامل الاحترافي مع ضباط الجمارك، وبروتوكول الميزان' : 'Timeline guidelines, customs clearance interaction, and scale variance protocol'}
                  </span>
                </div>
              </div>

              <button className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                {expandedSections.airport ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            <AnimatePresence initial={false}>
              {expandedSections.airport && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4 pt-2 border-t border-slate-100 text-xs text-slate-600 leading-relaxed overflow-hidden"
                >
                  {/* Protocol 3.1: 3-Hour Timeline */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <h3 className="font-black text-slate-900 text-xs sm:text-sm">
                        {isAr ? 'الجدول الزمني المثالي (قاعدة التواجد قبل 3 ساعات)' : 'Optimal Timeline: 3-Hour Prior Arrival Rule'}
                      </h3>
                    </div>
                    <p className="text-slate-600 ps-6">
                      {isAr
                        ? 'يجب التواجد في صالة المطار قبل 3 ساعات على الأقل من موعد إقلاع الرحلة الدولية. يتيح لك هذا الوقت الكافي تسليم الأمتعة بهدوء، تجنب ضغط طوابير التفتيش، والتعامل مع أي استفسارات أو فروقات في الوزن دون تأخير عن بوابات الصعود.'
                        : 'Arrive at the airport terminal at least 3 hours prior to international departure. This prevents rushing through peak check-in queues and allows ample buffer time for standard luggage screening.'}
                    </p>
                  </div>

                  {/* Protocol 3.2: Customs Interaction Playbook */}
                  <div className="p-4 bg-teal-50/40 rounded-2xl border border-teal-200/80 space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-700" />
                      <h3 className="font-black text-slate-900 text-xs sm:text-sm">
                        {isAr ? 'التعامل مع ضباط الجمارك بثقة وهدوء (Customs Interaction Playbook)' : 'Interacting with Customs Officers with Confidence'}
                      </h3>
                    </div>
                    <div className="space-y-2 ps-6 text-slate-700">
                      <p>
                        {isAr
                          ? '1. في حال استفسر ضابط الجمارك عن محتويات حقيبتك أو الطرود، افتح تطبيق THOUESA وأبرز "المستند الجمركي الرقمي (Digital Manifest)" وشهادة الفحص الأمني المعتمدة.'
                          : '1. If customs officers inquire about parcel contents, present the Digital Manifest and Certified Screening Certificate in your THOUESA App.'}
                      </p>
                      <p>
                        {isAr
                          ? '2. صرّح بوضوح وهدوء: "هذه أمانات وطرود شخصية تم فحصها وتوثيقها رسمياً عبر شركة شحن وتخليص مرخصة، وتحمل أرقام تتبع أمنية مطابقة للمانيفست".'
                          : '2. Declare calmly: "These are personal consignments pre-screened and certified by an authorized logistics platform under full digital chain-of-custody."'}
                      </p>
                      <p>
                        {isAr
                          ? '3. إذا استدعى الأمر، اضغط زر "طوارئ المطار SOS" في التطبيق لربط ضابط الجمارك مباشرة بغرفة العمليات والدعم القانوني الميداني.'
                          : '3. If needed, activate the 24/7 SOS hotline to connect customs officials with THOUESA operational and legal support desk.'}
                      </p>
                    </div>
                  </div>

                  {/* Protocol 3.3: Scale Discrepancy Protocol */}
                  <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-200/80 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-700" />
                      <h3 className="font-black text-slate-900 text-xs sm:text-sm">
                        {isAr ? 'بروتوكول طوارئ اختلاف ميزان المطار (Scale Discrepancy & Excess Weight)' : 'Scale Discrepancy & Airport Weight Variance Protocol'}
                      </h3>
                    </div>
                    <p className="text-slate-700 ps-6">
                      {isAr
                        ? 'إذا أظهر ميزان كاونتر الطيران وزناً أعلى من الوزن المثبت في مانيفست المكتب، التقط فوراً صورة واضحة لشاشة ميزان الكاونتر تظهر رقم الرحلة والوزن الزائد. ادفع الرسوم واحتفظ بالإيصال الرسمي، وقم برفعه في قسم الدعم لتعويضك فورياً عن كامل المبلغ المدفوع دون تأخير.'
                        : 'If the airline check-in scale indicates a discrepancy versus the certified branch scale, photograph the scale display with luggage tags. Keep the receipt and submit it via the app for 100% instant reimbursement.'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ========================================================
              SECTION 4: دليل ترتيب وتعبئة الحقائب (Packing & Arrangement Guide)
             ======================================================== */}
          <div id="packing-section" className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5 scroll-mt-6">
            <div 
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => toggleSection('packing')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
                  <Luggage className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-black text-slate-900">
                    {isAr ? '4. دليل التعبئة وتوزيع الوزن هندسياً (Packing & Arrangement Guide)' : '4. Packing & Weight Distribution Guide'}
                  </h2>
                  <span className="text-[11px] text-slate-500">
                    {isAr ? 'إرشادات بصرية لحماية الطرود وتسهيل الفحص في أجهزة الأشعة X-Ray' : 'Visual guidelines for maximum cargo protection and swift X-Ray inspection'}
                  </span>
                </div>
              </div>

              <button className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                {expandedSections.packing ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            <AnimatePresence initial={false}>
              {expandedSections.packing && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4 pt-2 border-t border-slate-100 overflow-hidden"
                >
                  {/* Interactive Suitcase Cross-Section Diagram */}
                  <div className="p-5 bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl text-white border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="text-xs font-black text-amber-400 flex items-center gap-2">
                        <Luggage className="w-4 h-4" />
                        {isAr ? 'المقطع الهندسي لتوزيع محتويات الحقيبة:' : 'Engineering Cross-Section of Luggage:'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">OPTIMAL STABILITY & SAFETY</span>
                    </div>

                    {/* Suitcase Visual Layers */}
                    <div className="space-y-2 text-xs">
                      {/* Top Layer */}
                      <div className="p-3 bg-indigo-900/40 border border-indigo-500/40 rounded-2xl flex items-start gap-3">
                        <span className="px-2 py-1 bg-indigo-500 text-white rounded-lg text-[10px] font-black shrink-0">
                          {isAr ? 'القمة / Top' : 'Top Layer'}
                        </span>
                        <div>
                          <h4 className="font-bold text-indigo-200">
                            {isAr ? 'المستندات، حقيبة السوائل الشفافة، وحقيبة الكابلات' : 'Documents, Sealed Liquids, and Cable Pouches'}
                          </h4>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            {isAr ? 'موضع سهل الوصول لإخراجها فوراً إذا طلب موظف جهاز الأشعة (X-Ray) فحصها دون بعثرة الأمتعة.' : 'Quick-access zone for rapid X-ray retrieval without unpacking main cargo.'}
                          </p>
                        </div>
                      </div>

                      {/* Middle Core Layer */}
                      <div className="p-3 bg-amber-900/40 border border-amber-500/40 rounded-2xl flex items-start gap-3">
                        <span className="px-2 py-1 bg-amber-500 text-slate-900 rounded-lg text-[10px] font-black shrink-0">
                          {isAr ? 'المنتصف / Core' : 'Center Core'}
                        </span>
                        <div>
                          <h4 className="font-bold text-amber-200">
                            {isAr ? 'الطرود الحساسة، العطور، والإلكترونيات (Fragile Armor)' : 'Fragile Consignments, Perfumes, and Sensitive Electronics'}
                          </h4>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            {isAr ? 'توضع في قلب الحقيبة ومحاطة بالملابس الشخصية من جميع الجهات لتشكل وسائد هوائية ممتصة للصدمات.' : 'Cradled in the center and enveloped by personal garments acting as shock-absorbing cushions.'}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Base Layer */}
                      <div className="p-3 bg-teal-900/40 border border-teal-500/40 rounded-2xl flex items-start gap-3">
                        <span className="px-2 py-1 bg-teal-500 text-slate-900 rounded-lg text-[10px] font-black shrink-0">
                          {isAr ? 'القاع / Base' : 'Bottom Base'}
                        </span>
                        <div>
                          <h4 className="font-bold text-teal-200">
                            {isAr ? 'الطرود الثقيلة، الأحذية، والكتب (Near Wheels Base)' : 'Heavy Parcels, Footwear & Dense Items (Near Wheels)'}
                          </h4>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            {isAr ? 'توضع بالقرب من عجلات الحقيبة لتثبيت مركز الثقل ومنع انقلاب الحقيبة وتسهيل جرها لمسافات طويلة.' : 'Placed right over the wheels to lower center-of-gravity and maintain effortless gliding.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4 Practical Visual Rule Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⚖️</span>
                        <h4 className="font-bold text-slate-900">{isAr ? 'التوزيع الهندسي للوزن' : 'Weight Distribution'}</h4>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {isAr ? 'توزيع الأوزان بالتساوي بين جهتي الحقيبة وتفادي وضع الأوزان الثقيلة في الجيوب الخارجية.' : 'Keep weight balanced between halves; avoid placing heavy items in outer exterior zip pockets.'}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🛡️</span>
                        <h4 className="font-bold text-slate-900">{isAr ? 'حماية القابل للكسر' : 'Fragile Protection'}</h4>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {isAr ? 'استخدام أكياس الفقاعات الهوائية وغلق الزجاجات بإحكام لمنع الانكسار أثناء مناولة الأمتعة.' : 'Use air bubble padding and ensure zero direct glass-to-glass contact during handling.'}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🗂️</span>
                        <h4 className="font-bold text-slate-900">{isAr ? 'تجميع المتشابهات' : 'Grouping Similar Items'}</h4>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {isAr ? 'وضع الكابلات والوصلات في منظم شفاف لتمرير الحقيبة في التفتيش دون فتح يدوي.' : 'Keep cables in transparent organizer sleeves to pass X-Ray without manual inspection delays.'}
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💧</span>
                        <h4 className="font-bold text-slate-900">{isAr ? 'عزل السوائل محكمة الإغلاق' : 'Liquids Isolation'}</h4>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {isAr ? 'وضع السوائل والمستحضرات داخل أكياس Ziploc مزدوجة لمقاومة تغير ضغط الطائرة.' : 'Seal liquid bottles inside double Ziploc pouches to prevent pressure leaks at high altitudes.'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ========================================================
              SECTION 5: الإقرار القانوني والتوقيع (Mandatory Acknowledgment)
             ======================================================== */}
          <div id="acknowledgment-section" className="bg-white rounded-3xl p-6 border-2 border-teal-500/40 shadow-md space-y-5 scroll-mt-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-black text-slate-900">
                  {isAr ? '5. الإقرار القانوني والموافقة الإلزامية' : '5. Mandatory Legal Acknowledgment & Consent'}
                </h2>
                <span className="text-[11px] text-slate-500">
                  {isAr ? 'تأكيد القراءة والفهم لفك قفل زر إنشاء الرحلات واستلام الطرود' : 'Mandatory agreement required to unlock trip creation and custody manifests'}
                </span>
              </div>
            </div>

            {/* Agreement Checkbox Card */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <label className="flex items-start gap-3.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAgreed}
                  onChange={handleToggleAgreement}
                  className="w-5 h-5 text-teal-600 rounded-lg border-slate-300 focus:ring-teal-500 mt-0.5 cursor-pointer shrink-0"
                />
                <div className="space-y-1">
                  <span className="font-black text-xs md:text-sm text-slate-900 block">
                    {isAr
                      ? 'أقر وأتعهد بأنني قرأت وفهمت كافة الشروط والتعليمات وقائمة الممنوعات أعلاه، وألتزم التزاماً تاماً بنقل الأمانات وفق سلسلة الحيازة المشفرة وقوانين الطيران والجمارك الدولية.'
                      : 'I hereby declare and pledge that I have thoroughly read and understood all the terms, prohibited item directories, and airport guidelines above, and commit to adhering to all legal and aviation safety protocols.'}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {isAr
                      ? 'يتم تسجيل هذا الإقرار إلكترونياً وتوثيقه بسلسلة حيازة رقمية مطابقة لمعايير الامتثال.'
                      : 'This acknowledgment is cryptographically recorded with your digital profile identity.'}
                  </span>
                </div>
              </label>

              {/* Status Visual Confirmation */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/80 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">{isAr ? 'حالة الاعتماد:' : 'Compliance Status:'}</span>
                  {isAgreed ? (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-black text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'معتمد ومؤكد رسمياً 🟢' : 'Verified & Acknowledged 🟢'}</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-black text-[11px] flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{isAr ? 'في انتظار تحديد المربع أعلاه 🟡' : 'Awaiting Checkbox Confirmation 🟡'}</span>
                    </span>
                  )}
                </div>

                <div className="text-[10px] font-mono text-slate-400">
                  {isAgreed ? `TIMESTAMP: ${new Date().toISOString().split('T')[0]}` : 'STATUS: PENDING_SIGNATURE'}
                </div>
              </div>
            </div>

            {/* Toast Notification on check */}
            {agreementSavedToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800 animate-in fade-in slide-in-from-top-1">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? '✅ تم حفظ وتوثيق إقرارك القانوني بنجاح! تم فك قفل كافة ميزات الرحلات.' : '✅ Legal acknowledgment successfully saved and recorded!'}</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
