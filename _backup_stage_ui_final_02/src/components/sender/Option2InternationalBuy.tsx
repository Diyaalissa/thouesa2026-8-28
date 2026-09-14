import React, { useState, useMemo } from 'react';
import { 
  Globe2, 
  Store, 
  Package, 
  MapPin, 
  Building, 
  Truck, 
  ShieldCheck, 
  DollarSign, 
  Camera, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Wallet, 
  CreditCard,
  AlertCircle,
  Plus,
  Trash2,
  ClipboardPaste,
  Shield,
  HelpCircle,
  ExternalLink,
  Sparkles,
  Info,
  Layers,
  UploadCloud,
  X
} from 'lucide-react';
import { Hub, User, OrderItem } from '../../types';

interface Option2InternationalBuyProps {
  isAr: boolean;
  currentUser: User;
  activeHubs: Hub[];
  onSubmitOrder: (orderPayload: any) => Promise<void>;
  isSubmitting: boolean;
  onBack?: () => void;
}

interface StoreItemDraft {
  id: string;
  storeUrl: string;
  name: string;
  category: 'CLOTHING' | 'SHOES' | 'ELECTRONICS' | 'COSMETICS' | 'BAGS' | 'OTHER';
  quantity: number;
  unitPrice: number;
  totalCost: number;
  color?: string;
  hasSize?: boolean;
  size?: string;
  specsOrVariants?: string;
  notes?: string;
  imageUrl?: string;
  imageFile?: File | null;
}

const GLOBAL_STORES = [
  {
    id: 'Shein',
    name: 'Shein',
    nameAr: 'شي إن',
    tag: 'Fashion & Lifestyle',
    tagAr: 'أزياء وموضة',
    bg: 'bg-gradient-to-br from-zinc-900 to-black',
    border: 'border-zinc-700',
    accentColor: 'text-white',
    badgeBg: 'bg-zinc-800 text-white',
    popular: true,
  },
  {
    id: 'Amazon',
    name: 'Amazon',
    nameAr: 'أمازون',
    tag: 'Global Everything',
    tagAr: 'كل المنتجات عالمياً',
    bg: 'bg-gradient-to-br from-amber-950/40 to-slate-900',
    border: 'border-amber-500/40',
    accentColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/20 text-amber-300',
    popular: true,
  },
  {
    id: 'Temu',
    name: 'Temu',
    nameAr: 'تيمو',
    tag: 'Direct Deals',
    tagAr: 'صفقات مباشرة',
    bg: 'bg-gradient-to-br from-orange-950/40 to-slate-900',
    border: 'border-orange-500/40',
    accentColor: 'text-orange-400',
    badgeBg: 'bg-orange-500/20 text-orange-300',
    popular: true,
  },
  {
    id: 'AliExpress',
    name: 'AliExpress',
    nameAr: 'علي إكسبريس',
    tag: 'Direct Wholesale',
    tagAr: 'مستودعات وتجزئة',
    bg: 'bg-gradient-to-br from-red-950/40 to-slate-900',
    border: 'border-red-500/40',
    accentColor: 'text-red-400',
    badgeBg: 'bg-red-500/20 text-red-300',
    popular: true,
  },
  {
    id: 'eBay',
    name: 'eBay',
    nameAr: 'إيباي',
    tag: 'Auctions & Parts',
    tagAr: 'مزادات ومعدات',
    bg: 'bg-gradient-to-br from-blue-950/40 to-slate-900',
    border: 'border-blue-500/40',
    accentColor: 'text-blue-400',
    badgeBg: 'bg-blue-500/20 text-blue-300',
    popular: false,
  },
  {
    id: 'Zara',
    name: 'Zara',
    nameAr: 'زارا',
    tag: 'Apparel & Style',
    tagAr: 'أزياء عالمية',
    bg: 'bg-gradient-to-br from-slate-900 to-zinc-900',
    border: 'border-slate-700',
    accentColor: 'text-slate-200',
    badgeBg: 'bg-slate-800 text-slate-300',
    popular: false,
  },
  {
    id: 'iHerb',
    name: 'iHerb',
    nameAr: 'آي هيرب',
    tag: 'Supplements & Care',
    tagAr: 'مكملات وعناية',
    bg: 'bg-gradient-to-br from-emerald-950/40 to-slate-900',
    border: 'border-emerald-500/40',
    accentColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/20 text-emerald-300',
    popular: false,
  },
  {
    id: 'OTHER',
    name: 'Other Store',
    nameAr: 'متجر عالمي آخر',
    tag: 'Any Global Site',
    tagAr: 'أي موقع عالمي',
    bg: 'bg-slate-900',
    border: 'border-slate-700',
    accentColor: 'text-brand-300',
    badgeBg: 'bg-slate-800 text-slate-400',
    popular: false,
  }
];

export const Option2InternationalBuy: React.FC<Option2InternationalBuyProps> = ({
  isAr,
  currentUser,
  activeHubs,
  onSubmitOrder,
  isSubmitting,
  onBack
}) => {
  // Mobile Wizard Steps (1 to 4)
  const [wizardStep, setWizardStep] = useState<number>(1);

  // 1. Store & Product State
  const [selectedStore, setSelectedStore] = useState<string>('Shein');
  const [customStoreName, setCustomStoreName] = useState<string>('');
  const [storeItems, setStoreItems] = useState<StoreItemDraft[]>([
    {
      id: `item-${Date.now()}-1`,
      storeUrl: '',
      name: '',
      category: 'CLOTHING',
      quantity: 1,
      unitPrice: 35,
      totalCost: 35,
      color: '',
      hasSize: true,
      size: 'M',
      specsOrVariants: '',
      notes: '',
      imageUrl: '',
      imageFile: null
    }
  ]);

  // 2. Delivery & Address State
  const [originHubId, setOriginHubId] = useState<string>('hub-amm');
  const [destinationHubId, setDestinationHubId] = useState<string>('hub-alg');
  const [deliveryType, setDeliveryType] = useState<'HUB' | 'HOME'>('HUB');
  const [pickupHubId, setPickupHubId] = useState<string>('hub-alg');
  const [recipientName, setRecipientName] = useState<string>(currentUser?.fullName || '');
  const [recipientPhone, setRecipientPhone] = useState<string>(currentUser?.phone || '');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [recipientNationalId, setRecipientNationalId] = useState<string>('');

  // 3. Customs & Trust Guarantees
  const [customsNoticeAgreed, setCustomsNoticeAgreed] = useState<boolean>(true);

  // 4. Financial Summary & Checkout
  const [paymentCurrency, setPaymentCurrency] = useState<'SENDER' | 'RECIPIENT'>('SENDER');
  const [selectedPaymentGateway, setSelectedPaymentGateway] = useState<string>('CLIQ_JOR');
  const [transferReceiptUploaded, setTransferReceiptUploaded] = useState<boolean>(false);
  const [transferReceiptName, setTransferReceiptName] = useState<string>('');

  // Update a single item in drafts
  const updateStoreItem = (index: number, field: keyof StoreItemDraft, value: any) => {
    setStoreItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      
      // Auto-recalculate total cost
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = field === 'quantity' ? Number(value) : item.quantity;
        const price = field === 'unitPrice' ? Number(value) : item.unitPrice;
        item.totalCost = Math.max(0, qty * price);
      }

      // Auto-tune hasSize if category is changed
      if (field === 'category') {
        if (value === 'ELECTRONICS' || value === 'COSMETICS' || value === 'OTHER') {
          item.hasSize = false;
        } else {
          item.hasSize = true;
        }
      }

      updated[index] = item;
      return updated;
    });
  };

  // Add new item
  const handleAddItem = () => {
    setStoreItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}-${prev.length + 1}`,
        storeUrl: '',
        name: '',
        category: 'CLOTHING',
        quantity: 1,
        unitPrice: 25,
        totalCost: 25,
        color: '',
        hasSize: true,
        size: 'M',
        specsOrVariants: '',
        notes: '',
        imageUrl: '',
        imageFile: null
      }
    ]);
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    if (storeItems.length <= 1) return;
    setStoreItems(prev => prev.filter((_, i) => i !== index));
  };

  // Quick Paste from Clipboard
  const handleQuickPaste = async (index: number) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        updateStoreItem(index, 'storeUrl', text);
      }
    } catch (err) {
      const manualUrl = prompt(isAr ? 'الصق الرابط هنا:' : 'Paste link here:');
      if (manualUrl) {
        updateStoreItem(index, 'storeUrl', manualUrl);
      }
    }
  };

  // Calculations
  const rawItemsTotal = useMemo(() => {
    return storeItems.reduce((acc, item) => acc + (Number(item.totalCost) || 0), 0);
  }, [storeItems]);

  const procurementServiceFee = useMemo(() => {
    return rawItemsTotal * 0.05; // 5% handling & shopping service fee
  }, [rawItemsTotal]);

  const localDeliveryFee = useMemo(() => {
    return deliveryType === 'HOME' ? 10.0 : 0.0;
  }, [deliveryType]);

  const totalEstimatedOrderUsd = useMemo(() => {
    return rawItemsTotal + procurementServiceFee + localDeliveryFee;
  }, [rawItemsTotal, procurementServiceFee, localDeliveryFee]);

  // 50% Deposit
  const depositRequiredNowUsd = useMemo(() => {
    return totalEstimatedOrderUsd * 0.5;
  }, [totalEstimatedOrderUsd]);

  const remainingOnDeliveryUsd = useMemo(() => {
    return totalEstimatedOrderUsd * 0.5;
  }, [totalEstimatedOrderUsd]);

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customsNoticeAgreed) {
      alert(isAr ? 'يرجى الموافقة على إقرار وتنبيه الرسوم الجمركية' : 'Please accept the customs policy notice');
      return;
    }

    // Prepare orderItems payload
    const orderItemsPayload: OrderItem[] = storeItems.map(item => ({
      id: item.id,
      name: item.name || (selectedStore !== 'OTHER' ? `${selectedStore} Product` : 'Global Store Product'),
      storeUrl: item.storeUrl,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalCost: item.totalCost,
      specsOrVariants: [
        item.color ? `Color: ${item.color}` : '',
        item.hasSize && item.size ? `Size: ${item.size}` : '',
        item.specsOrVariants ? item.specsOrVariants : '',
        item.notes ? `Notes: ${item.notes}` : ''
      ].filter(Boolean).join(' | '),
      imageUrl: item.imageUrl
    }));

    const resolvedStoreName = selectedStore === 'OTHER' ? (customStoreName || 'Custom Global Store') : selectedStore;

    const payload = {
      serviceType: 'INTERNATIONAL_BUY',
      storeName: resolvedStoreName,
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      senderPhone: currentUser.phone,
      originHubId,
      destinationHubId: deliveryType === 'HUB' ? (pickupHubId || destinationHubId) : destinationHubId,
      deliveryType,
      recipientName,
      recipientPhone,
      recipientAddress: deliveryType === 'HOME' ? recipientAddress : `Pickup from Hub (${pickupHubId})`,
      recipientNationalId,
      itemCategory: 'INTERNATIONAL_SHOPPING',
      itemDescription: `${resolvedStoreName}: ${storeItems.map(i => `${i.quantity}x ${i.name || 'Product'}`).join(', ')}`,
      declaredValue: rawItemsTotal,
      estimatedWeightKg: Math.max(1.0, storeItems.length * 0.6),
      dimensionsCm: { length: 30, width: 25, height: 15 },
      prohibitedItemsAgreed: true,
      customsNoticeAgreed: true,
      totalEstimatedCost: totalEstimatedOrderUsd,
      depositAmountPaid: depositRequiredNowUsd,
      depositPercent: 50,
      remainingBalanceOnDelivery: remainingOnDeliveryUsd,
      paymentMethod: selectedPaymentGateway,
      paymentCurrency,
      orderItems: orderItemsPayload,
      transferReceiptUploaded,
      transferReceiptName: transferReceiptName || undefined
    };

    await onSubmitOrder(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-8 text-white shadow-2xl max-w-5xl mx-auto space-y-6 md:space-y-8">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl transition-colors cursor-pointer shrink-0"
                title={isAr ? 'العودة للرئيسية' : 'Back to Home'}
              >
                {isAr ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
            )}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-400 p-0.5 shadow-lg shadow-brand-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Globe2 className="w-6 h-6 text-brand-400" />
              </div>
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                <span>{isAr ? 'الخيار الثاني: الشراء من المتاجر العالمية' : 'Option 2: Buy from Global Stores'}</span>
              </h3>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                {isAr
                  ? 'اختر المتجر، الصق روابط المنتجات، وسيتولى فريقنا الشراء والشحن مع نظام دفع العربون 50%'
                  : 'Select a store, paste item links, and our team will handle buying & shipping with 50% deposit'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-emerald-300">
              {isAr ? 'شراء موثوق مع ضمان الاسترداد' : 'Guaranteed Purchase'}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Step Progress Indicator */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2 px-2">
          {[
            { step: 1, labelAr: 'المنتجات', labelEn: 'Items' },
            { step: 2, labelAr: 'التوصيل', labelEn: 'Delivery' },
            { step: 3, labelAr: 'الجمارك', labelEn: 'Customs' },
            { step: 4, labelAr: 'الدفع', labelEn: 'Checkout' }
          ].map(s => (
            <div key={s.step} className="flex flex-col items-center flex-1 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 z-10 ${
                wizardStep === s.step 
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/40 ring-4 ring-brand-500/20 scale-110' 
                  : wizardStep > s.step 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}>
                {wizardStep > s.step ? <CheckCircle2 className="w-4 h-4" /> : s.step}
              </div>
              <span className={`text-[10px] mt-1 font-semibold ${wizardStep === s.step ? 'text-brand-400 font-bold' : 'text-slate-500'}`}>
                {isAr ? s.labelAr : s.labelEn}
              </span>
            </div>
          ))}
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden flex mx-4 mt-2">
          <div 
            className="h-full bg-gradient-to-r from-brand-500 to-amber-400 transition-all duration-300"
            style={{ width: `${((wizardStep - 1) / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: SELECT STORE & PRODUCT SPECS (PROGRESSIVE DISCLOSURE)              */}
      {/* ========================================================================= */}
      <div className={`${wizardStep === 1 ? 'block' : 'hidden'} md:block space-y-6`}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <Store className="w-5 h-5 text-brand-400" />
            <span>{isAr ? '1. اختيار المتجر والمنتجات' : '1. Select Store & Products'}</span>
          </h4>
          <span className="text-xs text-slate-400">
            {isAr ? 'حدد المتجر العالمي المفضل' : 'Pick preferred global merchant'}
          </span>
        </div>

        {/* Global Stores Grid */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-3">
            {isAr ? 'المتاجر العالمية المدعومة (انقر للاختيار):' : 'Supported Global Stores (Tap to select):'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2.5 md:gap-3">
            {GLOBAL_STORES.map((store) => {
              const isSelected = selectedStore === store.id;
              return (
                <button
                  type="button"
                  key={store.id}
                  onClick={() => setSelectedStore(store.id)}
                  className={`relative flex flex-col p-3 rounded-2xl border-2 text-right transition-all duration-200 cursor-pointer overflow-hidden ${
                    isSelected
                      ? `border-brand-500 ${store.bg} shadow-lg shadow-brand-500/10 scale-[1.02] ring-2 ring-brand-500/20`
                      : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/90'
                  }`}
                >
                  {store.popular && (
                    <span className="absolute top-2 left-2 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-brand-500/20 text-brand-300 border border-brand-500/30">
                      POPULAR
                    </span>
                  )}
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-sm md:text-base font-black ${isSelected ? 'text-white' : store.accentColor}`}>
                      {store.name}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {isAr ? store.nameAr : store.name}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1">
                    {isAr ? store.tagAr : store.tag}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedStore === 'OTHER' && (
            <div className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-xl animate-in slide-in-from-top-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isAr ? 'اسم المتجر أو الموقع العالمي:' : 'Custom Store / Site Name:'}
              </label>
              <input
                type="text"
                required
                value={customStoreName}
                onChange={(e) => setCustomStoreName(e.target.value)}
                placeholder={isAr ? 'مثال: BestBuy, Target, Walmart...' : 'e.g. BestBuy, Target, Walmart...'}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:border-brand-500"
              />
            </div>
          )}
        </div>

        {/* Product Items List (Smart Progressive Disclosure) */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-brand-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>{isAr ? 'قائمة المنتجات المطلوبة:' : 'Requested Items List:'}</span>
            </label>
            <span className="text-[11px] text-slate-400">
              {storeItems.length} {isAr ? 'منتج مضاف' : 'items added'}
            </span>
          </div>

          {storeItems.map((item, idx) => {
            const hasUrl = item.storeUrl && item.storeUrl.trim().length > 3;

            return (
              <div 
                key={item.id}
                className={`bg-slate-950/70 border rounded-2xl p-4 md:p-5 transition-all duration-300 relative ${
                  hasUrl ? 'border-brand-500/30 shadow-lg shadow-black/40' : 'border-slate-800'
                }`}
              >
                {/* Remove button if multiple */}
                {storeItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="absolute top-3 left-3 md:top-4 md:left-4 text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                    title={isAr ? 'حذف هذا المنتج' : 'Delete item'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* Top Badge: Item Number */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 text-xs font-black flex items-center justify-center border border-brand-500/30">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-200">
                    {isAr ? `المنتج رقم ${idx + 1}` : `Item #${idx + 1}`}
                  </span>
                  {selectedStore && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                      {selectedStore === 'OTHER' ? (customStoreName || 'Global') : selectedStore}
                    </span>
                  )}
                </div>

                {/* 1. INITIAL FIELD: PRODUCT LINK / SERIAL NUMBER (Always Visible) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    {isAr ? 'رابط المنتج (URL) أو الرقم التسلسلي:' : 'Product URL or Serial / SKU:'}
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        required
                        value={item.storeUrl}
                        onChange={(e) => updateStoreItem(idx, 'storeUrl', e.target.value)}
                        placeholder={
                          selectedStore === 'Shein' 
                            ? 'https://shein.com/product/... or SKU 123456' 
                            : selectedStore === 'Amazon'
                            ? 'https://amazon.com/dp/... or ASIN B0...'
                            : 'https://store.com/item/...'
                        }
                        className="w-full pl-3 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-brand-500 placeholder-slate-500 transition-colors"
                        dir="ltr"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickPaste(idx)}
                      className="px-3.5 md:px-4 py-3 bg-slate-800 hover:bg-slate-700 text-brand-300 hover:text-white rounded-xl border border-slate-700 flex items-center gap-1.5 text-xs font-bold shrink-0 transition-colors cursor-pointer shadow-xs"
                      title={isAr ? 'لصق سريع من الحافظة' : 'Quick Paste from Clipboard'}
                    >
                      <ClipboardPaste className="w-4 h-4" />
                      <span className="hidden sm:inline">{isAr ? 'لصق سريع' : 'Quick Paste'}</span>
                    </button>
                  </div>
                  {!hasUrl && (
                    <p className="text-[11px] text-amber-400/90 flex items-center gap-1 mt-1">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>{isAr ? 'الصق الرابط لتنفتح باقي تفاصيل المنتج (السعر، المقاس، واللون) تلقائياً' : 'Paste the link to automatically unlock product specifications'}</span>
                    </p>
                  )}
                </div>

                {/* 2. PROGRESSIVE DISCLOSURE: APPEARS ONCE URL IS ENTERED */}
                {hasUrl && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
                    
                    {/* Name & Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          {isAr ? 'اسم المنتج أو الوصف المختصر' : 'Product Name or Title'}
                        </label>
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => updateStoreItem(idx, 'name', e.target.value)}
                          placeholder={isAr ? 'مثال: فستان صيفي مزين بالزهور...' : 'e.g. Summer floral dress...'}
                          className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          {isAr ? 'تصنيف السلعة' : 'Category'}
                        </label>
                        <select
                          value={item.category}
                          onChange={(e) => updateStoreItem(idx, 'category', e.target.value as any)}
                          className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:border-brand-500 cursor-pointer"
                        >
                          <option value="CLOTHING">{isAr ? 'ملابس وأزياء (يتطلب مقاس)' : 'Clothing & Fashion'}</option>
                          <option value="SHOES">{isAr ? 'أحذية ومقاسات قدم' : 'Shoes & Footwear'}</option>
                          <option value="BAGS">{isAr ? 'حقائب وإكسسوارات' : 'Bags & Accessories'}</option>
                          <option value="ELECTRONICS">{isAr ? 'إلكترونيات وأجهزة (بدون مقاس)' : 'Electronics (No size)'}</option>
                          <option value="COSMETICS">{isAr ? 'مستحضرات تجميل وعناية' : 'Cosmetics & Care'}</option>
                          <option value="OTHER">{isAr ? 'سلع ومنتجات أخرى' : 'Other Goods'}</option>
                        </select>
                      </div>
                    </div>

                    {/* Price, Qty, and Computed Item Total */}
                    <div className="grid grid-cols-3 gap-2 md:gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <div>
                        <label className="block text-[10px] md:text-xs font-semibold text-slate-400 mb-1">
                          {isAr ? 'السعر التقريبي ($)' : 'Est. Unit Price ($)'}
                        </label>
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          required
                          value={item.unitPrice}
                          onChange={(e) => updateStoreItem(idx, 'unitPrice', Number(e.target.value))}
                          className="w-full px-2 md:px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-center font-bold text-white focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] md:text-xs font-semibold text-slate-400 mb-1">
                          {isAr ? 'الكمية' : 'Quantity'}
                        </label>
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="1"
                            max="50"
                            required
                            value={item.quantity}
                            onChange={(e) => updateStoreItem(idx, 'quantity', Number(e.target.value))}
                            className="w-full px-2 md:px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-center font-bold text-white focus:border-brand-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] md:text-xs font-semibold text-brand-300 mb-1">
                          {isAr ? 'المجموع ($)' : 'Item Total ($)'}
                        </label>
                        <div className="w-full py-2 bg-brand-500/10 border border-brand-500/30 rounded-lg text-sm font-black text-brand-300 text-center flex items-center justify-center">
                          ${(item.totalCost || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Color & Size (Size toggles dynamically based on category) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          {isAr ? 'اللون المطلوب (أو كود اللون)' : 'Color / Color Code'}
                        </label>
                        <input
                          type="text"
                          value={item.color || ''}
                          onChange={(e) => updateStoreItem(idx, 'color', e.target.value)}
                          placeholder={isAr ? 'مثال: أسود، أزرق كحلي، بيج...' : 'e.g. Black, Navy, Beige...'}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:border-brand-500"
                        />
                      </div>

                      {/* Size Field: Smartly visible if hasSize is true */}
                      {item.hasSize ? (
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-semibold text-slate-300">
                              {isAr ? 'المقاس المطلوب' : 'Required Size'}
                            </label>
                            <button
                              type="button"
                              onClick={() => updateStoreItem(idx, 'hasSize', false)}
                              className="text-[10px] text-slate-400 hover:text-slate-200 underline"
                            >
                              {isAr ? 'لا يحتاج مقاس' : 'No size needed'}
                            </button>
                          </div>
                          <input
                            type="text"
                            value={item.size || ''}
                            onChange={(e) => updateStoreItem(idx, 'size', e.target.value)}
                            placeholder={
                              item.category === 'SHOES' 
                                ? (isAr ? 'مثال: 41, 42, 38...' : 'e.g. EU 41, US 8.5...') 
                                : (isAr ? 'مثال: S, M, L, XL, 32...' : 'e.g. S, M, L, XL...')
                            }
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:border-brand-500"
                          />
                        </div>
                      ) : (
                        <div className="flex items-end pb-1">
                          <button
                            type="button"
                            onClick={() => updateStoreItem(idx, 'hasSize', true)}
                            className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{isAr ? 'تحديد مقاس محدد لهذا المنتج' : 'Add specific size'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Special Notes / Coupon or SKU */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {isAr ? 'ملاحظات خاصة لفريق الشراء (كوبون، خيارات بديلة...)' : 'Special Buying Notes (Coupons, variants...)'}
                      </label>
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => updateStoreItem(idx, 'notes', e.target.value)}
                        placeholder={isAr ? 'مثال: استخدم كود الخصم SAVE20 إذا كان متاحاً...' : 'e.g. Apply discount code SAVE20 if available...'}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:border-brand-500"
                      />
                    </div>

                    {/* Screenshot / Image Attachment */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>{isAr ? 'صورة المنتج أو لقطة شاشة (Screenshot)' : 'Product Screenshot / Photo (Optional)'}</span>
                        <span className="text-[10px] text-slate-400">{isAr ? 'لتأكيد التطابق 100%' : 'Ensures 100% item match'}</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.imageUrl || ''}
                          onChange={(e) => updateStoreItem(idx, 'imageUrl', e.target.value)}
                          placeholder={isAr ? 'رابط الصورة (Image URL) أو ارفع ملف...' : 'Image URL or upload...'}
                          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                        />
                        <label className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 cursor-pointer transition-colors flex items-center gap-1 text-xs shrink-0">
                          <UploadCloud className="w-4 h-4 text-brand-400" />
                          <span className="hidden sm:inline">{isAr ? 'رفع صورة' : 'Upload'}</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                updateStoreItem(idx, 'imageFile', file);
                                updateStoreItem(idx, 'imageUrl', URL.createObjectURL(file));
                              }
                            }}
                          />
                        </label>
                      </div>
                      {item.imageUrl && (
                        <div className="mt-2 flex items-center gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <img src={item.imageUrl} alt="preview" className="w-10 h-10 object-cover rounded-md border border-slate-700" />
                          <span className="text-[11px] text-emerald-400 font-semibold">{isAr ? 'تم إرفاق صورة المنتج بنجاح' : 'Product photo attached'}</span>
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })}

          {/* Add Another Item Button */}
          <button
            type="button"
            onClick={handleAddItem}
            className="w-full py-3.5 bg-slate-950/80 hover:bg-slate-800 text-brand-400 hover:text-brand-300 border-2 border-dashed border-brand-500/30 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:border-brand-500/50"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? '+ إضافة منتج آخر إلى سلة الشراء' : '+ Add Another Item to Order'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 2: DELIVERY OPTIONS & ADDRESSES                                      */}
      {/* ========================================================================= */}
      <div className={`${wizardStep === 2 ? 'block' : 'hidden'} md:block space-y-5 pt-2`}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-400" />
            <span>{isAr ? '2. خيارات التوصيل وعنوان المستلم' : '2. Delivery Options & Recipient'}</span>
          </h4>
          <span className="text-xs text-slate-400">
            {isAr ? 'حدد طريقة الاستلام والعنوان' : 'Choose destination & delivery mode'}
          </span>
        </div>

        {/* Hub Destination & Delivery Mode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isAr ? 'بلد ومركز الوصول الرئيسي' : 'Destination Country / Main Hub'}
            </label>
            <select
              value={destinationHubId}
              onChange={(e) => setDestinationHubId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:border-brand-500 cursor-pointer"
            >
              {activeHubs.map(hub => (
                <option key={hub.id} value={hub.id}>
                  {isAr ? hub.nameAr : hub.nameEn} ({hub.code}) - {isAr ? hub.countryNameAr : hub.countryNameEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isAr ? 'طريقة الاستلام والتوصيل' : 'Delivery Method'}
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setDeliveryType('HUB')}
                className={`py-2 px-3 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  deliveryType === 'HUB'
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>{isAr ? 'استلام من المكتب (مجاني)' : 'Hub Pickup (Free)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType('HOME')}
                className={`py-2 px-3 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  deliveryType === 'HOME'
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>{isAr ? 'توصيل للبيت (+$10)' : 'Home Delivery (+$10)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hub Pickup Branch Selection (If HUB is selected) */}
        {deliveryType === 'HUB' && (
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2 animate-in slide-in-from-top-1">
            <label className="block text-xs font-bold text-brand-300 flex items-center gap-2">
              <Building className="w-4 h-4" />
              <span>{isAr ? 'اختر فرع الاستلام (مجاناً وبدون رسوم توصيل داخلي):' : 'Select Pickup Branch (Free of charge):'}</span>
            </label>
            <select
              value={pickupHubId}
              onChange={(e) => setPickupHubId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:border-brand-500 cursor-pointer"
            >
              <option value="hub-alg">{isAr ? 'فرع الجزائر العاصمة الرئيسي (حيدرة / ديدوش مراد)' : 'Algiers Central Hub (Hydra)'}</option>
              <option value="hub-orn">{isAr ? 'فرع وهران (وسط المدينة)' : 'Oran Hub (City Center)'}</option>
              <option value="hub-amm">{isAr ? 'فرع عمّان - الأردن (الدوار السابع)' : 'Amman Hub - Jordan (7th Circle)'}</option>
            </select>
            <p className="text-[11px] text-slate-400">
              {isAr ? 'سيصلك إشعار فوري وتأكيد عند وصول شحنتك للمكتب مع كود الاستلام السريع.' : 'You will receive an instant pickup code as soon as your items arrive at the hub.'}
            </p>
          </div>
        )}

        {/* Smart Address Book & Contact Details */}
        <div className="bg-slate-950/70 p-4 md:p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-brand-300 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{isAr ? 'دفتر العناوين المحفوظة (المستلم):' : 'Saved Recipient Address Book:'}</span>
            </label>
            
            <select
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white cursor-pointer"
              onChange={(e) => {
                if (e.target.value === '1') {
                  setRecipientName(currentUser.fullName);
                  setRecipientPhone(currentUser.phone);
                  setRecipientNationalId(currentUser.nationalId || '199088123456');
                  setRecipientAddress('Algiers, Hydra, Boulevard 12, Apt 4');
                } else if (e.target.value === '2') {
                  setRecipientName('Ahmad Al-Saeed');
                  setRecipientPhone('+962 79 123 4567');
                  setRecipientNationalId('9901020304');
                  setRecipientAddress('Amman, 7th Circle, Zahran St, Bldg 42');
                }
              }}
            >
              <option value="">{isAr ? '-- اختر مستلماً سريعاً --' : '-- Quick Select Saved Recipient --'}</option>
              <option value="1">{currentUser.fullName} ({isAr ? 'حسابي الحالي' : 'My Account'})</option>
              <option value="2">Ahmad Al-Saeed (Jordan / Amman)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                {isAr ? 'اسم المستلم الثلاثي' : 'Recipient Full Name'}
              </label>
              <input
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder={isAr ? 'الاسم الكامل...' : 'Full name...'}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                {isAr ? 'رقم هاتف المستلم (واتساب)' : 'Phone Number (WhatsApp)'}
              </label>
              <input
                type="tel"
                required
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="+213 / +962..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                {isAr ? 'رقم الهوية الوطنية / جواز السفر' : 'National ID / Passport'}
              </label>
              <input
                type="text"
                value={recipientNationalId}
                onChange={(e) => setRecipientNationalId(e.target.value)}
                placeholder={isAr ? 'للتخليص الجمركي...' : 'For customs clearance...'}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white"
              />
            </div>
          </div>

          {/* Detailed Home Address (Only if HOME delivery is selected) */}
          {deliveryType === 'HOME' && (
            <div className="pt-2 animate-in slide-in-from-top-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isAr ? 'العنوان التفصيلي للتوصيل لباب البيت:' : 'Detailed Home Delivery Address:'}
              </label>
              <textarea
                required
                rows={2}
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder={isAr ? 'الولاية / المحافظة، المدينة، اسم الشارع، رقم العمارة والطابق...' : 'State/City, Street name, building number, floor/apt...'}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:border-brand-500 resize-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 3: CUSTOMS POLICY & FINANCIAL GUARANTEES                             */}
      {/* ========================================================================= */}
      <div className={`${wizardStep === 3 ? 'block' : 'hidden'} md:block space-y-4 pt-2`}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-400" />
            <span>{isAr ? '3. سياسة الجمارك والضمانات المالية' : '3. Customs Policy & Guarantees'}</span>
          </h4>
          <span className="text-xs text-slate-400">
            {isAr ? 'شفافية وأمان كامل' : 'Transparent & secure'}
          </span>
        </div>

        {/* Mandatory Customs Policy Checkbox */}
        <div className="bg-slate-950/80 p-4 md:p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="customsNoticeAgree"
              required
              checked={customsNoticeAgreed}
              onChange={(e) => setCustomsNoticeAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 accent-brand-500 cursor-pointer shrink-0 rounded"
            />
            <label htmlFor="customsNoticeAgree" className="text-xs md:text-sm text-slate-300 leading-relaxed cursor-pointer">
              <span className="font-black text-amber-400 block mb-1">
                {isAr ? 'تنبيه جمركي إلزامي وشفاف:' : 'Mandatory Customs Transparency Notice:'}
              </span>
              {isAr ? (
                <>
                  أقر بعلمي التام بأن <strong>الرسوم الجمركية غير مشمولة في السعر التقريبي</strong>، وتُضاف للمبلغ المتبقي بعد وصول الشحنة إلى بلد الوجهة بموجب <strong>وصل الجمارك الرسمي الصادر من إدارة الجمارك</strong> دون أي مبالغ إضافية مخفية.
                </>
              ) : (
                <>
                  I acknowledge that <strong>customs duties are not included in the upfront estimated price</strong> and will be added to the remaining balance upon arrival based strictly on the <strong>official customs receipt</strong>.
                </>
              )}
            </label>
          </div>
        </div>

        {/* Financial Trust Badge (وسم الأمان المالي) */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-950/50 to-slate-900 border border-emerald-500/30 p-4 rounded-2xl shadow-md">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Shield className="w-5 h-5" />
          </div>
          <div className="text-xs md:text-sm text-emerald-300 font-bold leading-snug">
            <span className="text-emerald-400 block text-xs font-black uppercase mb-0.5">
              {isAr ? 'وسم الأمان المالي (Trust Badge):' : 'Financial Security Guarantee:'}
            </span>
            {isAr
              ? 'يُسترد المبلغ (العربون) فوراً لمحفظتك بالكامل في حال نفاد الكمية أو عدم توفر المنتج لدى البائع، دون أي خصومات.'
              : 'The deposit is 100% instantly refunded to your wallet if the item becomes unavailable or out of stock with the seller.'}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 4: FINANCIAL SUMMARY & CHECKOUT (50% DEPOSIT SYSTEM)                  */}
      {/* ========================================================================= */}
      <div className={`${wizardStep === 4 ? 'block' : 'hidden'} md:block bg-slate-950 border border-slate-800 rounded-3xl p-4 md:p-6 space-y-6 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header & Currency Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h4 className="text-base md:text-lg font-black text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-brand-400" />
              <span>{isAr ? '4. الحسبة المالية والدفع (نظام العربون 50%)' : '4. Financial Summary & 50% Deposit'}</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr ? 'ادفع 50% لتأكيد الطلب وبدء الشراء، و50% عند الاستلام' : 'Pay 50% deposit now to initiate purchase, 50% upon delivery'}
            </p>
          </div>

          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setPaymentCurrency('SENDER')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                paymentCurrency === 'SENDER' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'عملة المرسل (JOD / USD)' : 'Sender Currency (JOD)'}
            </button>
            <button
              type="button"
              onClick={() => setPaymentCurrency('RECIPIENT')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                paymentCurrency === 'RECIPIENT' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'عملة المستلم (DZD)' : 'Recipient (DZD)'}
            </button>
          </div>
        </div>

        {/* Detailed Transparent Financial Calculation Breakdown */}
        <div className="bg-slate-900/90 rounded-2xl p-4 md:p-5 border border-slate-800 space-y-3">
          <div className="flex justify-between text-xs md:text-sm text-slate-300">
            <span>{isAr ? 'إجمالي قيمة المنتجات التقريبي:' : 'Est. Items Total Cost:'}</span>
            <span className="font-bold text-white">${rawItemsTotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-xs md:text-sm text-slate-300">
            <span>{isAr ? 'رسوم التسوق ومعالجة الطلب (5%):' : 'Procurement & Shopping Fee (5%):'}</span>
            <span className="font-semibold text-emerald-400">+${procurementServiceFee.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-xs md:text-sm text-slate-300">
            <span>{isAr ? 'رسوم التوصيل الداخلي:' : 'Domestic Delivery:'}</span>
            <span className="font-semibold text-white">
              {deliveryType === 'HOME' ? '+$10.00' : (isAr ? '0.00$ (استلام من المكتب)' : '$0.00 (Hub Pickup)')}
            </span>
          </div>

          <div className="border-t border-slate-800 pt-3 flex justify-between text-xs md:text-sm font-bold text-slate-400">
            <span>{isAr ? 'إجمالي الطلب التقديري بالكامل:' : 'Total Estimated Order:'}</span>
            <span className="line-through">${totalEstimatedOrderUsd.toFixed(2)}</span>
          </div>

          {/* Prominent Split Cards: 50% NOW vs 50% LATER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            
            {/* Card 1: 50% Deposit Required Now */}
            <div className="bg-gradient-to-br from-brand-950/40 to-slate-900 border-2 border-brand-500/50 p-3.5 md:p-4 rounded-2xl space-y-1">
              <span className="text-[11px] font-black uppercase text-brand-300 block">
                {isAr ? 'المطلوب دفعه الآن (عربون 50%):' : 'Pay Now (50% Deposit):'}
              </span>
              <div className="text-xl md:text-2xl font-black text-brand-400 flex items-baseline gap-1.5">
                {paymentCurrency === 'RECIPIENT' ? (
                  <span>{(depositRequiredNowUsd * 135).toFixed(2)} DZD</span>
                ) : (
                  <span>${(depositRequiredNowUsd * 0.709).toFixed(2)} JOD</span>
                )}
                <span className="text-xs font-medium text-slate-400">(${depositRequiredNowUsd.toFixed(2)} USD)</span>
              </div>
              <p className="text-[10px] text-slate-400">
                {isAr ? 'لتأكيد الشراء وبدء حجز وتجهيز المنتجات فوراً' : 'To confirm order and initiate procurement'}
              </p>
            </div>

            {/* Card 2: 50% Remaining on Delivery */}
            <div className="bg-slate-900 border border-slate-800 p-3.5 md:p-4 rounded-2xl space-y-1">
              <span className="text-[11px] font-black uppercase text-slate-400 block">
                {isAr ? 'المتبقي عند الاستلام (50%):' : 'Remaining on Delivery (50%):'}
              </span>
              <div className="text-lg md:text-xl font-black text-slate-200 flex items-baseline gap-1.5">
                {paymentCurrency === 'RECIPIENT' ? (
                  <span>{(remainingOnDeliveryUsd * 135).toFixed(2)} DZD</span>
                ) : (
                  <span>${(remainingOnDeliveryUsd * 0.709).toFixed(2)} JOD</span>
                )}
                <span className="text-[11px] font-bold text-amber-400">
                  {isAr ? '+ الجمرك (بوصل رسمي)' : '+ Customs (Official Receipt)'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                {isAr ? 'يُسدد عند استلام الشحنة من المكتب أو من مندوب التوصيل' : 'Paid upon package arrival & receipt'}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Gateways / Methods */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-300">
            {isAr ? 'اختر طريقة دفع العربون المتاحة لدولتك:' : 'Select Geo-targeted Payment Gateway:'}
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* CliQ (JOR) */}
            <button
              type="button"
              onClick={() => setSelectedPaymentGateway('CLIQ_JOR')}
              className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer ${
                selectedPaymentGateway === 'CLIQ_JOR'
                  ? 'border-brand-500 bg-brand-500/10 shadow-md'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/e/e6/CliQ_logo.png" alt="CliQ" className="h-6 object-contain opacity-90" />
              <span className="text-xs font-bold text-slate-200">{isAr ? 'كليك (الأردن)' : 'CliQ (Jordan)'}</span>
            </button>

            {/* Escrow Wallet */}
            <button
              type="button"
              onClick={() => setSelectedPaymentGateway('ESCROW_WALLET')}
              className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer ${
                selectedPaymentGateway === 'ESCROW_WALLET'
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-md'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <Wallet className="w-6 h-6 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">{isAr ? 'محفظة الضمان' : 'Escrow Wallet'}</span>
            </button>

            {/* Bank Transfer */}
            <button
              type="button"
              onClick={() => setSelectedPaymentGateway('BANK_TRANSFER')}
              className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer ${
                selectedPaymentGateway === 'BANK_TRANSFER'
                  ? 'border-brand-500 bg-brand-500/10 shadow-md'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <CreditCard className="w-6 h-6 text-brand-400" />
              <span className="text-xs font-bold text-slate-200">{isAr ? 'تحويل بنكي' : 'Bank Transfer'}</span>
            </button>

            {/* Cash at Hub */}
            <button
              type="button"
              onClick={() => setSelectedPaymentGateway('CASH_AT_HUB')}
              className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer ${
                selectedPaymentGateway === 'CASH_AT_HUB'
                  ? 'border-brand-500 bg-brand-500/10 shadow-md'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <DollarSign className="w-6 h-6 text-brand-400" />
              <span className="text-xs font-bold text-slate-200">{isAr ? 'كاش في المكتب' : 'Cash at Hub'}</span>
            </button>
          </div>

          {/* Bank Transfer Interactive Card */}
          {selectedPaymentGateway === 'BANK_TRANSFER' && (
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl space-y-3 animate-in slide-in-from-top-1">
              <div className="text-xs text-slate-300 space-y-1">
                <p className="font-bold text-brand-300">{isAr ? 'بيانات حساب الشركة للتحويل البنكي:' : 'Company Bank Details for Transfer:'}</p>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-xs text-brand-300">
                  <p>IBAN: JO98 ABAB 0000 0000 1234 5678</p>
                  <p>Bank: Arab Bank - Amman Branch / البنك العربي</p>
                  <p>Beneficiary: THOUESA Logistics Ltd / شركة ثويسة اللوجستية</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isAr ? 'إرفاق إشعار / صورة التحويل (لتأكيد الطلب فوراً):' : 'Upload Transfer Receipt (Optional for instant approval):'}
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl text-xs text-slate-300 flex items-center justify-between cursor-pointer transition-colors">
                    <span>{transferReceiptName || (isAr ? 'اختر صورة الوصل أو PDF...' : 'Choose receipt image or PDF...')}</span>
                    <UploadCloud className="w-4 h-4 text-brand-400" />
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setTransferReceiptUploaded(true);
                          setTransferReceiptName(e.target.files[0].name);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* CliQ Info Card */}
          {selectedPaymentGateway === 'CLIQ_JOR' && (
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl space-y-2 animate-in slide-in-from-top-1">
              <p className="text-xs text-slate-300">
                {isAr ? 'اسم المستفيد في كليك (Alias):' : 'CliQ Alias:'}
              </p>
              <p className="font-mono text-sm font-black text-brand-300 bg-slate-950 px-3 py-1.5 rounded-lg inline-block border border-brand-500/20">
                THOUESA
              </p>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'حول مبلغ العربون مع كتابة اسمك في ملاحظة الحوالة.' : 'Transfer the deposit amount and put your name in the transfer notes.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NAVIGATION CONTROLS (MOBILE WIZARD BUTTONS + DESKTOP SUBMIT)              */}
      {/* ========================================================================= */}
      
      {/* Mobile Wizard Nav Buttons */}
      <div className="md:hidden flex items-center justify-between pt-4 border-t border-slate-800">
        {wizardStep > 1 ? (
          <button
            type="button"
            onClick={() => setWizardStep(prev => prev - 1)}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
            <span>{isAr ? 'السابق' : 'Back'}</span>
          </button>
        ) : <div />}

        {wizardStep < 4 ? (
          <button
            type="button"
            onClick={() => setWizardStep(prev => prev + 1)}
            className="px-6 py-2.5 bg-brand-500 hover:bg-brand-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-brand-500/20 transition-all cursor-pointer"
          >
            <span>{isAr ? 'التالي' : 'Next'}</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting || !customsNoticeAgreed}
            className="flex-1 ml-3 px-6 py-3 bg-brand-500 hover:bg-brand-400 text-white font-black rounded-xl text-sm shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{isSubmitting ? (isAr ? 'جاري الاعتماد...' : 'Processing...') : (isAr ? 'دفع العربون وتأكيد الطلب' : 'Pay Deposit & Confirm')}</span>
          </button>
        )}
      </div>

      {/* Desktop Submit Button */}
      <div className="hidden md:flex items-center justify-between pt-4 border-t border-slate-800">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{isAr ? 'تأكيد فوري للشراء مع ضمان الاسترداد وحماية الخصوصية' : 'Instant confirmation with full refund guarantee'}</span>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !customsNoticeAgreed}
          className="flex items-center justify-center gap-2.5 px-8 py-3.5 bg-brand-500 hover:bg-brand-400 text-white font-black rounded-2xl text-base shadow-xl shadow-brand-500/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>
            {isSubmitting 
              ? (isAr ? 'جاري إرسال الطلب...' : 'Submitting Order...') 
              : (isAr ? 'دفع العربون (50%) وتأكيد الطلب' : 'Pay Deposit (50%) & Confirm Order')}
          </span>
        </button>
      </div>

    </form>
  );
};
