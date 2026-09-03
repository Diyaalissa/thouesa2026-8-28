import { UserProfile } from '../profile/UserProfile';
import { SenderOverview } from './SenderOverview';
import { Option1SendParcel } from './Option1SendParcel';
import { Option2InternationalBuy } from './Option2InternationalBuy';
import { Option3SpecificCountryBuy } from './Option3SpecificCountryBuy';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus,  Trash2, ClipboardPaste,
  Menu,
  X,
  Box,
  Package, Home,
  PlusCircle,
  Clock,
  ShieldCheck,
  Plane,
  AlertTriangle, Camera,
  FileText,
  MessageSquare,
  ChevronRight, ChevronDown,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Upload,

  ArrowRight,
  ArrowLeft,
  Lock,
  Globe2,
  ShoppingBag,
  PackagePlus, 
  DollarSign,
  Tag,
  ListOrdered,
  Store,
  Layers,
  MapPin, MapPinIcon, LayoutDashboard,
  FileCheck,
  BadgePercent, User as UserIcon,
  Percent,
  ShieldAlert, Wallet, Sparkles,
Globe, Receipt, Paperclip, } from 'lucide-react';
import { EscrowWallet, Hub, ItemCategory, ItemCondition, Locale, OrderItem, ServiceType, Shipment, User } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { WaybillModal } from '../common/WaybillModal';
import { AgentChatModal } from '../common/AgentChatModal';
import { WalletDashboard } from '../wallet/WalletDashboard';
import { DisputesDashboard } from '../disputes/DisputesDashboard';
import { ComplianceModal } from '../legal/ComplianceModal';
import { CreateDisputeModal } from '../common/CreateDisputeModal';
import { TrackingTimeline } from '../tracking/TrackingTimeline';
import { calculateCustomsDuty, calculateShippingQuote, formatCurrency } from '../../lib/crypto';
import { DEFAULT_CUSTOMS_RULES, HUBS_DATA } from '../../lib/constants';

interface SenderPortalProps {
  currentUser: User;
  wallet?: EscrowWallet | null;
  shipments: Shipment[];
  locale: Locale;
  hubs?: Hub[];
  onRefreshShipments: () => void;
  onCreateShipment: (payload: any) => Promise<boolean>;
  onCancelShipment: (shipmentId: string) => Promise<boolean>;
  onApproveWeightDiscrepancy: (shipmentId: string, action: 'APPROVE' | 'REJECT') => Promise<void>;
}

export const SenderPortal: React.FC<SenderPortalProps> = ({
  currentUser,
  wallet,
  shipments,
  locale,
  hubs,
  onRefreshShipments,
  onCreateShipment,
  onCancelShipment,
  onApproveWeightDiscrepancy,
}) => {
  const isAr = locale === 'ar';
  const hasPendingDispute = true;

  
  
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const activeHubs = React.useMemo(
    () => (hubs && hubs.length > 0 ? hubs : HUBS_DATA).filter((h) => h.isActive !== false),
    [hubs]
  );

  const uniqueCountries = React.useMemo(() => {
    const countries = new Map<string, { code: string; nameAr: string; nameEn: string }>();
    activeHubs.forEach((h) => {
      if (!countries.has(h.countryCode)) {
        countries.set(h.countryCode, {
          code: h.countryCode,
          nameAr: h.countryNameAr,
          nameEn: h.countryNameEn,
        });
      }
    });
    return Array.from(countries.values());
  }, [activeHubs]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreateOrderMenuOpen, setIsCreateOrderMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'MY_SHIPMENTS' | 'SEND_PARCEL' | 'INTERNATIONAL_BUY' | 'SPECIFIC_COUNTRY_BUY' | 'DISPUTES' | 'PROFILE' | 'WALLET'
  >('OVERVIEW');

  const [shipmentStatusTab, setShipmentStatusTab] = useState<'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ACTIVE');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [waybillModalShipment, setWaybillModalShipment] = useState<Shipment | null>(null);
  const [customsReceiptUrl, setCustomsReceiptUrl] = useState<string | null>(null);
  const [orderSuccessModalOpen, setOrderSuccessModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [complianceModalOpen, setComplianceModalOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState<'DAMAGED_ITEM' | 'TAMPERED_SEAL' | 'MISSING_PACKAGE' | 'FLIGHT_DELAY_EXTREME' | 'PROHIBITED_GOODS_DISCOVERED'>('DAMAGED_ITEM');
  const [disputeClaimAmount, setDisputeClaimAmount] = useState<number>(0);
  const [disputeDescription, setDisputeDescription] = useState('');
  const [disputePhotoUrl, setDisputePhotoUrl] = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);

  const handleInlineDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;
    setDisputeError(null);
    setDisputeSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(locale === 'ar' ? 'تم تسجيل النزاع بنجاح وتجميد الضمان.' : 'Dispute filed successfully and escrow locked.');
      // Reset form or update shipment state
      setDisputeDescription('');
      setDisputePhotoUrl('');
    } catch (err) {
      setDisputeError(locale === 'ar' ? 'فشل تسجيل النزاع.' : 'Failed to file dispute.');
    } finally {
      setDisputeSubmitting(false);
    }
  };

  const [complianceInitialTab, setComplianceInitialTab] = useState<'TERMS' | 'CUSTOMS' | 'PROHIBITED'>('CUSTOMS');

  // Payment Gateway selection state
  const [selectedPaymentGateway, setSelectedPaymentGateway] = useState<'CLIQ_JOR' | 'EDAHABIA_DZA' | 'CIB_DZA' | 'ESCROW_WALLET' | 'STRIPE_CARD' | 'CASH_AT_HUB' | 'BANK_TRANSFER'>('CLIQ_JOR');

  // Common Recipient State
  const [originHubId, setOriginHubId] = useState(activeHubs[0]?.id || 'hub-amm');
  const [destHubId, setDestHubId] = useState(activeHubs[1]?.id || activeHubs[0]?.id || 'hub-alg');

  // Auto-sync origin and dest if previously selected branch was deactivated
  React.useEffect(() => {
    if (activeHubs.length > 0) {
      if (!activeHubs.some((h) => h.id === originHubId)) {
        setOriginHubId(activeHubs[0].id);
      }
      if (!activeHubs.some((h) => h.id === destHubId)) {
        setDestHubId(activeHubs[1]?.id || activeHubs[0].id);
      }
    }
  }, [activeHubs, originHubId, destHubId]);
  const [recipientName, setRecipientName] = useState(currentUser.fullName || 'أمين بلحاج');
  const [recipientPhone, setRecipientPhone] = useState(currentUser.phone || '+213 77 441 9922');
  const [recipientAddress, setRecipientAddress] = useState('حي حيدرة، نهج الإخوة بوعدو، الجزائر العاصمة');
  const [recipientNationalId, setRecipientNationalId] = useState('DZ-09812441');

  // Option 1: Send Personal Parcel State
  const [parcelCategory, setParcelCategory] = useState<ItemCategory>('ELECTRONICS');
  const [parcelCondition, setParcelCondition] = useState<ItemCondition>('USED_PERSONAL');
  const [customsRateOverride, setCustomsRateOverride] = useState<number | undefined>(undefined);
  const [parcelPurpose, setParcelPurpose] = useState('استخدام شخصي / هدية عائلية');
  const [parcelDescription, setParcelDescription] = useState('جهاز لوحي وحافظة إلكترونية وملحقاتها');
  const [parcelPhotoUrl, setParcelPhotoUrl] = useState('');
  const [insuranceRequested, setInsuranceRequested] = useState(false);
  const [parcelDeclaredValue, setParcelDeclaredValue] = useState(400);
  const [parcelEstimatedWeightKg, setParcelEstimatedWeightKg] = useState(2.0);
  const [deliveryType, setDeliveryType] = useState('HUB');
  const [paymentCurrency, setPaymentCurrency] = useState<'SENDER' | 'RECIPIENT'>('SENDER');
  const [selectedTripId, setSelectedTripId] = useState('trip-1');
  const [packagingRequested, setPackagingRequested] = useState(false);
  const [parcelLengthCm, setParcelLengthCm] = useState(25);
  const [parcelWidthCm, setParcelWidthCm] = useState(20);
  const [parcelHeightCm, setParcelHeightCm] = useState(8);
  const [prohibitedAgreed, setProhibitedAgreed] = useState(false);
  const [sendWizardStep, setSendWizardStep] = useState(1);

  // Live Shipping & Customs Calculation
  const selectedOriginHub = activeHubs.find((h) => h.id === originHubId) || activeHubs[0];
  const selectedDestHub = activeHubs.find((h) => h.id === destHubId) || activeHubs[1] || activeHubs[0];

  const liveParcelQuote = React.useMemo(() => {
    const origCode = selectedOriginHub?.countryCode || 'JOR';
    const destCode = selectedDestHub?.countryCode || 'DZA';
    return calculateShippingQuote({
      originCountry: origCode,
      destinationCountry: destCode,
      weightKg: Math.max(0.1, parcelEstimatedWeightKg),
      lengthCm: Math.max(5, parcelLengthCm),
      widthCm: Math.max(5, parcelWidthCm),
      heightCm: Math.max(5, parcelHeightCm),
      declaredValueUsd: Math.max(0, parcelDeclaredValue),
      category: parcelCategory,
      itemCondition: parcelCondition,
      customRatePercent: customsRateOverride,
    });
  }, [selectedOriginHub, selectedDestHub, parcelEstimatedWeightKg, parcelLengthCm, parcelWidthCm, parcelHeightCm, parcelDeclaredValue, parcelCategory, parcelCondition, customsRateOverride]);

  // Option 2: Buy from International Stores State
  const [storeName, setStoreName] = useState('Amazon USA');
  const [storeProductUrl, setStoreProductUrl] = useState('https://www.amazon.com/dp/B09V3HN1KC');
  const [storeItems, setStoreItems] = useState<OrderItem[]>([
    {
      id: 'item-1',
      name: 'Sony WH-1000XM5 Wireless Headphones',
      quantity: 1,
      unitPrice: 348.0,
      totalCost: 348.0,
      storeUrl: 'https://www.amazon.com/dp/B09V3HN1KC',
      specsOrVariants: 'Color: Silver, Noise Canceling',
    },
  ]);

  // Option 3: Buy from Specific Country / Local Store State
  const [targetCountry, setTargetCountry] = useState(uniqueCountries[0]?.code || 'JOR');
  const [buySourceCity, setBuySourceCity] = useState('عمان');
  const [localMarketName, setLocalMarketName] = useState('سوق وسط البلد التراثي / متجر زارا');
  const [localMarketContact, setLocalMarketContact] = useState('@zara_jordan / +962 7 9123 4567');
  const [countryProductUrl, setCountryProductUrl] = useState('');
  const [buyProductName, setBuyProductName] = useState('طقم ملابس شتوي كلاسيكي أو زعتر أردني فاخر');
  const [buyProductColor, setBuyProductColor] = useState('كحلي / Navy Blue');
  const [buyHasSize, setBuyHasSize] = useState(true);
  const [buyProductSize, setBuyProductSize] = useState('XL (42-44)');
  const [buySpecialNotes, setBuySpecialNotes] = useState('يرجى التأكد من أن المنتج أصلي ومغلف تغليف هدايا');
  const [buyApproxPrice, setBuyApproxPrice] = useState<number>(65);
  const [buyQuantity, setBuyQuantity] = useState<number>(1);
  const [buyProductImage, setBuyProductImage] = useState<string | null>('https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=400');
  const [buyDeliveryType, setBuyDeliveryType] = useState<'HOME' | 'HUB'>('HUB');
  const [buyPickupHubId, setBuyPickupHubId] = useState<string>('hub-alg');
  const [countryCustomsAgreed, setCountryCustomsAgreed] = useState(false);
  const [buyCurrency, setBuyCurrency] = useState<'SENDER' | 'RECIPIENT'>('SENDER');
  const [buyPaymentGateway, setBuyPaymentGateway] = useState<'CLIQ_JOR' | 'EDAHABIA_DZA' | 'CIB_DZA' | 'ESCROW_WALLET' | 'STRIPE_CARD' | 'CASH_AT_HUB' | 'BANK_TRANSFER'>('CLIQ_JOR');
  const [buyTransferReceipt, setBuyTransferReceipt] = useState<string | null>(null);
  const [countryWizardStep, setCountryWizardStep] = useState(1);
  const [countryBuyItems, setCountryBuyItems] = useState<OrderItem[]>([
    {
      id: 'c-item-1',
      name: 'طقم ملابس شتوي كلاسيكي أو زعتر أردني فاخر',
      quantity: 1,
      unitPrice: 65.0,
      totalCost: 65.0,
      sourceCountry: uniqueCountries[0]?.code || 'JOR',
      specsOrVariants: 'اللون: كحلي | المقاس: XL',
      imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=400'
    },
  ]);

  useEffect(() => {
    if (uniqueCountries.length > 0) {
      if (!uniqueCountries.some((c) => c.code === targetCountry)) {
        setTargetCountry(uniqueCountries[0].code);
      }
    }
  }, [uniqueCountries, targetCountry]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [intlCustomsAgreed, setIntlCustomsAgreed] = useState(false);
  const [intlWizardStep, setIntlWizardStep] = useState(1);


  // Filter sender's shipments
  const senderShipments = shipments
    .filter((s) => s.senderId === currentUser.id || s.recipientPhone === currentUser.phone)
    ;

  // Submit Handler for Option 1: Send Personal Parcel
  const handleSendParcelSubmit = async (payload: any) => {
    setIsSubmitting(true);
    const success = await onCreateShipment({
      serviceType: 'SEND_PARCEL',
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      senderPhone: currentUser.phone,
      originHubId: payload.originHubId,
      destinationHubId: payload.destinationHubId,
      recipientName: payload.recipientName,
      recipientPhone: payload.recipientPhone,
      recipientAddress: payload.recipientAddress,
      recipientNationalId: payload.recipientNationalId,
      itemCategory: payload.itemCategory,
      itemCondition: payload.itemCondition,
      itemDescription: payload.itemDescription,
      declaredValue: payload.declaredValue,
      estimatedWeightKg: payload.estimatedWeightKg,
      dimensionsCm: payload.dimensionsCm,
      prohibitedItemsAgreed: payload.prohibitedItemsAgreed,
      senderLegalWaiverSigned: true,
      paymentGateway: payload.paymentMethod,
      lockedExchangeRate: payload.originHubId === 'hub-amm' ? 0.709 : 220.0,
      orderItems: payload.orderItems,
      ...payload
    });
    setIsSubmitting(false);

    if (success) {
      setActiveTab('MY_SHIPMENTS');
      onRefreshShipments();
      setOrderSuccessModalOpen(true);
    }
  };

  // Submit Handler for Option 2: International Stores
  const handleStoreBuySubmit = async (payload: any) => {
    setIsSubmitting(true);
    const success = await onCreateShipment(payload);
    setIsSubmitting(false);

    if (success) {
      setActiveTab('MY_SHIPMENTS');
      onRefreshShipments();
      setOrderSuccessModalOpen(true);
    }
  };

  // Submit Handler for Option 3: Specific Country / Local Store Buy
  const handleCountryBuyOrderSubmit = async (payload: any) => {
    setIsSubmitting(true);
    const success = await onCreateShipment({
      serviceType: 'SPECIFIC_COUNTRY_BUY',
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      senderPhone: currentUser.phone,
      originHubId: originHubId || 'hub-amm',
      destinationHubId: payload.deliveryType === 'HUB' ? (payload.pickupHubId || destHubId) : destHubId,
      recipientName: payload.recipientName || recipientName,
      recipientPhone: payload.recipientPhone || recipientPhone,
      recipientAddress: payload.deliveryType === 'HOME' 
        ? payload.recipientAddress 
        : `استلام من فرع: ${activeHubs.find(h => h.id === (payload.pickupHubId || destHubId))?.nameAr || 'الفرع الرئيسي'}`,
      recipientNationalId: payload.recipientNationalId || recipientNationalId,
      itemCategory: 'GIFTS_COSMETICS',
      itemDescription: `شراء من ${payload.storeName || 'المتجر'} (${payload.sourceCity || ''}، ${payload.targetCountry}): ${payload.productName} ${payload.productColor ? `| اللون: ${payload.productColor}` : ''} ${payload.hasSize && payload.productSize ? `| المقاس: ${payload.productSize}` : ''}`,
      declaredValue: payload.pricing?.itemTotalUSD || 50,
      shippingCost: (payload.pricing?.shippingCostUSD || 15) + (payload.pricing?.localDeliveryUSD || 0),
      estimatedWeightKg: 2.0,
      dimensionsCm: { length: 25, width: 20, height: 12 },
      prohibitedItemsAgreed: true,
      paymentMethod: payload.paymentGateway || 'CLIQ_JOR',
      paymentCurrency: payload.pricing?.currency || 'SENDER',
      orderItems: [
        {
          id: `c-item-${Date.now()}`,
          name: payload.productName,
          quantity: payload.quantity || 1,
          unitPrice: payload.approxPrice || 50,
          totalCost: payload.pricing?.itemTotalUSD || 50,
          storeUrl: payload.productUrl || payload.sellerContact,
          specsOrVariants: `${payload.productColor ? `اللون: ${payload.productColor}` : ''} ${payload.hasSize && payload.productSize ? `| المقاس: ${payload.productSize}` : ''} ${payload.specialNotes ? `| ملاحظات: ${payload.specialNotes}` : ''}`.trim(),
          sourceCountry: payload.targetCountry,
          imageUrl: payload.productImage || undefined,
        }
      ],
    });
    setIsSubmitting(false);

    if (success) {
      setActiveTab('MY_SHIPMENTS');
      onRefreshShipments();
      setOrderSuccessModalOpen(true);
    }
  };

  // Item list helper for Option 2
  const addStoreItem = () => {
    setStoreItems([
      ...storeItems,
      {
        id: `item-${Date.now()}`,
        name: '',
        quantity: 1,
        unitPrice: 50,
        totalCost: 50,
        storeUrl: '',
        specsOrVariants: '',
      },
    ]);
  };

  const updateStoreItem = (index: number, field: keyof OrderItem, val: any) => {
    const updated = [...storeItems];
    const target = { ...updated[index], [field]: val };
    if (field === 'quantity' || field === 'unitPrice') {
      target.totalCost = Number(target.quantity || 1) * Number(target.unitPrice || 0);
    }
    updated[index] = target;
    setStoreItems(updated);
  };

  const removeStoreItem = (index: number) => {
    if (storeItems.length > 1) {
      setStoreItems(storeItems.filter((_, i) => i !== index));
    }
  };

  // Item list helper for Option 3
  const addCountryItem = () => {
    setCountryBuyItems([
      ...countryBuyItems,
      {
        id: `c-item-${Date.now()}`,
        name: '',
        quantity: 1,
        unitPrice: 20,
        totalCost: 20,
        sourceCountry: targetCountry,
        specsOrVariants: '',
      },
    ]);
  };

  const updateCountryItem = (index: number, field: keyof OrderItem, val: any) => {
    const updated = [...countryBuyItems];
    const target = { ...updated[index], [field]: val };
    if (field === 'quantity' || field === 'unitPrice') {
      target.totalCost = Number(target.quantity || 1) * Number(target.unitPrice || 0);
    }
    updated[index] = target;
    setCountryBuyItems(updated);
  };

  const removeCountryItem = (index: number) => {
    if (countryBuyItems.length > 1) {
      setCountryBuyItems(countryBuyItems.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full bg-slate-50" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex-1 flex overflow-hidden relative">
        {/* Toggle Button to Re-open Sidebar when Closed */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className={`hidden md:flex items-center gap-2 absolute top-3 ${
              isAr ? 'right-3' : 'left-3'
            } z-30 px-3.5 py-2 bg-white/95 backdrop-blur-sm hover:bg-slate-50 text-slate-700 hover:text-brand-600 border border-slate-200 rounded-xl shadow-sm text-xs font-bold transition-all cursor-pointer hover:shadow-md`}
            title={isAr ? 'فتح القائمة الجانبية' : 'Open Sidebar'}
          >
            <Menu className="w-4 h-4 text-brand-500" />
            <span>{isAr ? 'القائمة' : 'Menu'}</span>
          </button>
        )}

        {/* Sidebar Navigation */}
        <aside
          className={`hidden md:flex shrink-0 flex-col bg-white ${
            isAr ? 'border-l' : 'border-r'
          } border-slate-200 overflow-y-auto transition-all duration-300 z-20 ${
            isSidebarOpen
              ? 'w-64 opacity-100'
              : 'w-0 opacity-0 pointer-events-none p-0 overflow-hidden border-none'
          }`}
        >
          <div className="p-4 flex items-center justify-between border-b border-slate-100 shrink-0">
            <span className="text-xs font-black text-slate-800 tracking-wider">
              {isAr ? 'الخدمات' : 'SERVICES'}
            </span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              title={isAr ? 'إغلاق القائمة الجانبية' : 'Close Sidebar'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-2 flex-1">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'OVERVIEW' ? 'bg-brand-500 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'نظرة عامة' : 'Overview') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'OVERVIEW' ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-600'}`}>
                <LayoutDashboard className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'اللوحة الرئيسية' : 'Dashboard'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'OVERVIEW' ? 'text-brand-100' : 'text-slate-400'}`}>
                    {isAr ? 'نظرة عامة' : 'Overview'}
                  </div>
                </div>
              )}
            </button>
            <div>
              <button
                onClick={() => {
                  if (!isSidebarOpen) setIsSidebarOpen(true);
                  setIsCreateOrderMenuOpen(!isCreateOrderMenuOpen);
                }}
                className={`w-full flex items-center justify-between ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start text-slate-700 hover:bg-slate-50 hover:text-slate-900`}
                title={!isSidebarOpen ? (isAr ? 'إنشاء طلب جديد' : 'Create New Order') : undefined}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-brand-100 text-brand-600">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  {isSidebarOpen && (
                    <div className="truncate">
                      <div className="text-xs font-bold truncate">{isAr ? 'إنشاء طلب جديد' : 'Create New Order'}</div>
                    </div>
                  )}
                </div>
                {isSidebarOpen && (
                  <div className="text-slate-400">
                    {isCreateOrderMenuOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                )}
              </button>
              
              {isSidebarOpen && isCreateOrderMenuOpen && (
                <div className="pl-11 pr-2 py-2 space-y-1 mt-1 border-l-2 border-brand-100 ml-5">
                  <button
                    onClick={() => setActiveTab('SEND_PARCEL')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer text-start ${
                      activeTab === 'SEND_PARCEL' ? 'bg-brand-50 text-brand-600 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Box className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs truncate">{isAr ? 'إرسال طرد' : 'Send Parcel'}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('INTERNATIONAL_BUY')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer text-start ${
                      activeTab === 'INTERNATIONAL_BUY' ? 'bg-brand-50 text-brand-600 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Globe2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs truncate">{isAr ? 'شراء من متجر عالمي' : 'Global Store'}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('SPECIFIC_COUNTRY_BUY')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer text-start ${
                      activeTab === 'SPECIFIC_COUNTRY_BUY' ? 'bg-brand-50 text-brand-600 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs truncate">{isAr ? 'شراء محلي' : 'Local Buy'}</span>
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setActiveTab('MY_SHIPMENTS')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'MY_SHIPMENTS' ? 'bg-brand-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'طلباتي وشحناتي' : 'My Shipments') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'MY_SHIPMENTS' ? 'bg-brand-700 text-white' : 'bg-brand-100 text-brand-700'}`}>
                <ListOrdered className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'طلباتي وشحناتي' : 'My Shipments'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'MY_SHIPMENTS' ? 'text-brand-100' : 'text-slate-400'}`}>
                    {senderShipments.length} {isAr ? 'طلبات' : 'orders'}
                  </div>
                </div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('WALLET')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'WALLET' ? 'bg-brand-500 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'المحفظة المالية' : 'Wallet') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'WALLET' ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-600'}`}>
                <Wallet className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'المحفظة المالية' : 'Wallet'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'WALLET' ? 'text-brand-100' : 'text-slate-400'}`}>
                    {isAr ? 'الرصيد والمدفوعات' : 'Balance & Payments'}
                  </div>
                </div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('PROFILE')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'PROFILE' ? 'bg-brand-500 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'الملف الشخصي' : 'Profile') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'PROFILE' ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-600'}`}>
                <UserIcon className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'الملف الشخصي' : 'Profile'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'PROFILE' ? 'text-brand-100' : 'text-slate-400'}`}>
                    {isAr ? 'الإعدادات والهوية' : 'Settings & ID'}
                  </div>
                </div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('DISPUTES')}
              className={`w-full flex items-center ${isSidebarOpen ? 'gap-3 px-3.5 py-3' : 'justify-center p-3'} rounded-xl transition-all cursor-pointer text-start ${
                activeTab === 'DISPUTES' ? 'bg-red-600 text-white shadow-md font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={!isSidebarOpen ? (isAr ? 'النزاعات والشكاوى' : 'Disputes') : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'DISPUTES' ? 'bg-red-700 text-white' : 'bg-red-100 text-red-700'}`}>
                <ShieldAlert className="w-4 h-4" />
              </div>
              {isSidebarOpen && (
                <div className="truncate">
                  <div className="text-xs font-bold truncate">{isAr ? 'النزاعات والشكاوى' : 'Disputes'}</div>
                  <div className={`text-[10px] truncate ${activeTab === 'DISPUTES' ? 'text-red-100' : 'text-slate-400'}`}>
                    {isAr ? 'تقديم شكوى' : 'File a complaint'}
                  </div>
                </div>
              )}
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50/50 p-4 md:p-6 pb-24 md:pb-6 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'OVERVIEW' && (
              <SenderOverview 
                currentUser={currentUser} 
                walletBalance={wallet?.balance || 0}
                activeShipmentsCount={(shipments || []).filter(s => s?.currentStatus !== 'DELIVERED' && s?.currentStatus !== 'CANCELLED').length}
                onNavigate={(tab, extraData) => {
                  if (extraData?.prefillQuote) {
                    if (extraData.prefillQuote.originHubId) setOriginHubId(extraData.prefillQuote.originHubId);
                    if (extraData.prefillQuote.destHubId) setDestHubId(extraData.prefillQuote.destHubId);
                    if (extraData.prefillQuote.weightKg) setParcelEstimatedWeightKg(extraData.prefillQuote.weightKg);
                  }
                  setActiveTab(tab as any);
                }}
                isAr={isAr}
                shipments={shipments}
                locale={locale}
                onRefreshData={onRefreshShipments}
              />
            )}

          
          
      
      {activeTab === 'WALLET' && (
        <WalletDashboard currentUser={currentUser} wallet={wallet} locale={locale} shipments={senderShipments} />
      )}

      {activeTab === 'PROFILE' && (
        <UserProfile currentUser={currentUser} locale={locale} isAr={isAr} onNavigate={(tab) => setActiveTab(tab as any)} />
      )}
      {activeTab === 'DISPUTES' && (
        <DisputesDashboard 
          currentUser={currentUser} 
          isAr={isAr}
          onNavigateToShipment={(shipmentId) => {
            const shp = senderShipments.find(s => s.id === shipmentId || s.trackingNumber === shipmentId);
            if (shp) setSelectedShipment(shp);
            setActiveTab('MY_SHIPMENTS');
          }}
          onNavigateToWallet={() => setActiveTab('WALLET')}
        />
      )}

      {/* 1. OPTION 1: SEND PARCEL (SHIPPING SERVICE) */}
      {activeTab === 'SEND_PARCEL' && (
        <Option1SendParcel
          isAr={isAr}
          currentUser={currentUser}
          activeHubs={activeHubs}
          onSubmitShipment={handleSendParcelSubmit}
          isSubmitting={isSubmitting}
          onBack={() => setActiveTab('OVERVIEW')}
        />
      )}

      {/* 3. OPTION 2: BUY FROM INTERNATIONAL STORES */}
      {activeTab === 'INTERNATIONAL_BUY' && (
        <Option2InternationalBuy
          isAr={isAr}
          currentUser={currentUser}
          activeHubs={activeHubs}
          onSubmitOrder={handleStoreBuySubmit}
          isSubmitting={isSubmitting}
          onBack={() => setActiveTab('OVERVIEW')}
        />
      )}

      {/* 4. OPTION 3: BUY FROM SPECIFIC COUNTRY & SHIP */}
      {activeTab === 'SPECIFIC_COUNTRY_BUY' && (
        <Option3SpecificCountryBuy
          isAr={isAr}
          currentUser={currentUser}
          onSubmitOrder={handleCountryBuyOrderSubmit}
          isSubmitting={isSubmitting}
          onBack={() => setActiveTab('OVERVIEW')}
        />
      )}

      {/* 5. TAB: RECEIVED ORDERS & ACTIVE SHIPMENTS WITH ITEM DETAILS, QUANTITIES & PRICES */}
      {activeTab === 'MY_SHIPMENTS' && (() => {
        const activeShipments = senderShipments.filter(s => !['DELIVERED', 'CANCELLED'].includes(s.currentStatus));
        const completedShipments = senderShipments.filter(s => s.currentStatus === 'DELIVERED');
        const cancelledShipments = senderShipments.filter(s => s.currentStatus === 'CANCELLED');

        const filteredList = shipmentStatusTab === 'ACTIVE' 
          ? activeShipments 
          : shipmentStatusTab === 'COMPLETED' 
          ? completedShipments 
          : cancelledShipments;

        return (
          <div className="space-y-6">
            {/* Status Filters Bar with Real Counts (Active, Completed, Cancelled) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-2.5 sm:p-3.5 rounded-2xl">
              <div className="flex items-center gap-2 overflow-x-auto text-xs w-full sm:w-auto">
                <button
                  onClick={() => {
                    setShipmentStatusTab('ACTIVE');
                    if (activeShipments.length > 0) setSelectedShipment(activeShipments[0]);
                  }}
                  className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    shipmentStatusTab === 'ACTIVE'
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{isAr ? 'طلبات نشطة' : 'Active Orders'}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    shipmentStatusTab === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {activeShipments.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShipmentStatusTab('COMPLETED');
                    if (completedShipments.length > 0) setSelectedShipment(completedShipments[0]);
                  }}
                  className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    shipmentStatusTab === 'COMPLETED'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{isAr ? 'طلبات مكتملة' : 'Completed'}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    shipmentStatusTab === 'COMPLETED' ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {completedShipments.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShipmentStatusTab('CANCELLED');
                    if (cancelledShipments.length > 0) setSelectedShipment(cancelledShipments[0]);
                  }}
                  className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    shipmentStatusTab === 'CANCELLED'
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{isAr ? 'طلبات ملغاة' : 'Cancelled'}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    shipmentStatusTab === 'CANCELLED' ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {cancelledShipments.length}
                  </span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                <span>{isAr ? 'إجمالي الطلبات المسجلة:' : 'Total Registered:'}</span>
                <strong className="text-white font-mono">{senderShipments.length}</strong>
              </div>
            </div>

            {/* Master-Detail Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Orders List (Hidden on mobile if order selected) */}
              <div className={`lg:col-span-5 space-y-3 ${selectedShipment ? 'hidden lg:block' : 'block'}`}>
                {filteredList.length === 0 ? (
                  <div className="p-10 bg-slate-900/80 border border-slate-800 rounded-3xl text-center text-slate-400 text-xs space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                      <Box className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-slate-300">
                      {isAr ? 'لا توجد طلبات في هذا التصنيف حالياً' : 'No orders found in this category'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {isAr ? 'يمكنك بدء إرسال طرد جديد أو طلب شراء فوري من القائمة الجانبية.' : 'You can create a new parcel or buy request from the side navigation.'}
                    </p>
                  </div>
                ) : (
                  filteredList.map((s) => {
                    const isSelected = selectedShipment?.id === s.id;
                    const origHub = HUBS_DATA.find(h => h.id === s.originHubId) || HUBS_DATA[0];
                    const destHub = HUBS_DATA.find(h => h.id === s.destinationHubId) || HUBS_DATA[1];
                    
                    // Payment Tag Logic
                    const isFullyPaid = s.currentStatus === 'DELIVERED' || s.paymentMethod === 'WALLET' || (s.serviceType === 'SEND_PARCEL' && s.currentStatus !== 'PENDING');
                    const paymentTagClass = isFullyPaid 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                    const paymentTagText = isFullyPaid 
                      ? (isAr ? 'مكتمل الدفع' : 'Fully Paid')
                      : (isAr ? 'بانتظار الدفع عند الاستلام' : 'Pending Payment on Delivery');

                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedShipment(s)}
                        className={`p-4 sm:p-5 rounded-3xl border cursor-pointer transition-all duration-300 relative overflow-hidden ${
                          isSelected
                            ? 'bg-slate-900 border-brand-500 shadow-xl shadow-brand-500/10 ring-1 ring-brand-500/30'
                            : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-0 start-0 w-1.5 h-full bg-brand-500" />
                        )}

                        {/* Top Line: Order # + Date + Service Type */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-white tracking-wide">
                              #{s.trackingNumber ? s.trackingNumber.split('-').slice(-2).join('-') : s.id}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(s.createdAt || Date.now()).toLocaleDateString(isAr ? 'ar-JO' : 'en-US', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>

                          {/* Service Type Icon/Badge */}
                          <div className="flex items-center gap-1.5">
                            {s.serviceType === 'INTERNATIONAL_BUY' && (
                              <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-400 text-[10px] font-bold flex items-center gap-1 border border-blue-500/20">
                                <Globe className="w-3 h-3" />
                                {isAr ? 'شراء عالمي' : 'Global Buy'}
                              </span>
                            )}
                            {s.serviceType === 'SPECIFIC_COUNTRY_BUY' && (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-[10px] font-bold flex items-center gap-1 border border-emerald-500/20">
                                <Store className="w-3 h-3" />
                                {isAr ? 'شراء محلي' : 'Local Buy'}
                              </span>
                            )}
                            {(!s.serviceType || s.serviceType === 'SEND_PARCEL') && (
                              <span className="px-2.5 py-1 rounded-lg bg-brand-500/15 text-brand-400 text-[10px] font-bold flex items-center gap-1 border border-brand-500/20">
                                <Package className="w-3 h-3" />
                                {isAr ? 'إرسال طرد' : 'Send Parcel'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description Summary */}
                        <p className="text-xs font-semibold text-slate-300 mb-3 line-clamp-1">
                          {s.itemDescription}
                        </p>

                        {/* Route (من: الأردن ⬅️ إلى: الجزائر) */}
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/70">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-slate-400">{isAr ? 'من:' : 'From:'}</span>
                            <span className="text-white">{isAr ? origHub.cityAr : origHub.cityEn}</span>
                            <span className="text-slate-500 text-[10px]">({origHub.countryCode})</span>
                          </div>

                          <ArrowRight className="w-3.5 h-3.5 text-brand-500 shrink-0 rtl:rotate-180" />

                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-slate-400">{isAr ? 'إلى:' : 'To:'}</span>
                            <span className="text-white">{isAr ? destHub.cityAr : destHub.cityEn}</span>
                            <span className="text-slate-500 text-[10px]">({destHub.countryCode})</span>
                          </div>
                        </div>
                        
                        {/* Bottom Row: Payment Tag + Status Badge */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${paymentTagClass}`}>
                            {paymentTagText}
                          </span>
                          <StatusBadge status={s.currentStatus} locale={locale} size="sm" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right: Selected Order Detail (Full View on Mobile when tapped) */}
              <div className={`lg:col-span-7 space-y-4 ${selectedShipment ? 'block' : 'hidden lg:block'}`}>
                {selectedShipment ? (
                  <div className="bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-800 text-white shadow-2xl relative overflow-hidden space-y-6">
                    {/* Subtle Background Accent */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/5 blur-[120px] rounded-full pointer-events-none" />
                    
                    {/* Mobile Back Button */}
                    <div className="lg:hidden">
                      <button 
                        onClick={() => setSelectedShipment(null)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer border border-slate-700 w-full justify-center"
                      >
                        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                        {isAr ? 'العودة لجميع الطلبات' : 'Back to All Orders'}
                      </button>
                    </div>

                    {/* Order Top Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800/80 relative z-10">
                      <div>
                        <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                          <h3 className="text-lg sm:text-xl font-black font-mono text-white tracking-tight">
                            {selectedShipment.trackingNumber}
                          </h3>
                          <StatusBadge status={selectedShipment.currentStatus} locale={locale} size="sm" />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                            {isAr ? 'المستلم:' : 'Recipient:'} <strong className="text-slate-200">{selectedShipment.recipientName}</strong>
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="font-mono text-slate-400">{selectedShipment.recipientPhone}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setChatModalOpen(true)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-700"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-brand-400" />
                          <span>{isAr ? 'محادثة الدعم' : 'Support Chat'}</span>
                        </button>
                        <button
                          onClick={() => setDisputeModalOpen(true)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-red-500/20"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{isAr ? 'فتح نزاع' : 'Open Dispute'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Weight Discrepancy Approval Banner if Pending */}
                    {selectedShipment.weightDiscrepancy?.status === 'PENDING_CUSTOMER_APPROVAL' && (
                      <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 text-xs space-y-3 relative z-10">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-bold text-amber-300">
                              {isAr ? 'تنبيه فارق الوزن الفعلي (+فارق التكلفة)' : 'Weight Discrepancy Detected'}
                            </h4>
                            <p className="text-amber-200/80 mt-1 leading-relaxed">
                              {isAr 
                                ? `تم وزن الطرد عند الاستلام في المركز: الوزن الفعلي (${selectedShipment.weightDiscrepancy.actualKg} كغ) مقابل المقدر (${selectedShipment.weightDiscrepancy.originalKg} كغ). الفارق المالي المطلوب اعتماده: +${formatCurrency(selectedShipment.weightDiscrepancy.priceDelta, 'USD')}`
                                : `Actual weight measured at hub is (${selectedShipment.weightDiscrepancy.actualKg} kg) vs estimated (${selectedShipment.weightDiscrepancy.originalKg} kg). Delta fee: +${formatCurrency(selectedShipment.weightDiscrepancy.priceDelta, 'USD')}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={() => onApproveWeightDiscrepancy(selectedShipment.id, 'APPROVE')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            {isAr ? 'موافقة وسداد الفارق' : 'Approve & Pay Delta'}
                          </button>
                          <button
                            onClick={() => onApproveWeightDiscrepancy(selectedShipment.id, 'REJECT')}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors cursor-pointer border border-slate-700"
                          >
                            {isAr ? 'طلب استرجاع الطرد' : 'Reject & Return'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Order Items Breakdown if orderItems present */}
                    {selectedShipment.orderItems && selectedShipment.orderItems.length > 0 && (
                      <div className="space-y-3 relative z-10">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <Package className="w-4 h-4 text-brand-400" />
                          {isAr ? 'محتويات وأصناف الشحنة' : 'Package & Item Contents'}
                        </h4>
                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl divide-y divide-slate-800/60 overflow-hidden">
                          {selectedShipment.orderItems.map((item, idx) => (
                            <div key={item.id || idx} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                              <div className="space-y-1">
                                <p className="font-bold text-white flex items-center gap-2">
                                  <span>{item.name}</span>
                                  {item.quantity && item.quantity > 1 && (
                                    <span className="px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 font-mono text-[10px]">
                                      x{item.quantity}
                                    </span>
                                  )}
                                </p>
                                {item.notes && <p className="text-[11px] text-slate-400">{item.notes}</p>}
                              </div>
                              <div className="text-end font-mono font-bold text-white shrink-0">
                                {formatCurrency(item.totalCost || (item.unitPrice * (item.quantity || 1)), 'USD')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Visual Tracking Timeline (Vertical with 6 Steps) */}
                    <div className="relative z-10">
                      <TrackingTimeline 
                        shipment={selectedShipment} 
                        locale={locale} 
                        onOpenWaybill={(s) => setWaybillModalShipment(s)}
                        onOpenCustomsReceipt={() => setCustomsReceiptUrl(selectedShipment.customsDutyRecord?.receiptPhotoUrl || 'https://images.unsplash.com/photo-1621844781423-f327702e861c?auto=format&fit=crop&q=80&w=600')} 
                      />
                    </div>

                    {/* Financial Transparency & Customs Section */}
                    <div className="pt-2 relative z-10 space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-emerald-500" />
                        {isAr ? 'الفاتورة والشفافية المالية' : 'Financial Transparency & Breakdown'}
                      </h4>

                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 text-xs">
                        {/* Base cost / Declared Deposit */}
                        <div className="flex items-center justify-between text-slate-300">
                          <span>{isAr ? 'قيمة المنتجات (عربون مدفوع)' : 'Items Value (Deposit Paid)'}</span>
                          <span className="font-bold text-white font-mono">{formatCurrency(selectedShipment.declaredValue || 0, 'USD')}</span>
                        </div>
                        
                        {/* Shipping Cost */}
                        <div className="flex items-center justify-between text-slate-300">
                          <span>{isAr ? 'تكلفة الشحن الجوي' : 'Air Freight Shipping Fee'}</span>
                          <span className="font-bold text-white font-mono">{formatCurrency(selectedShipment.shippingCost || 18, 'USD')}</span>
                        </div>

                        {/* Insurance Fee if applied */}
                        {selectedShipment.insuranceFee && selectedShipment.insuranceFee > 0 ? (
                          <div className="flex items-center justify-between text-slate-300">
                            <span>{isAr ? 'رسوم التأمين الشامل' : 'Full Insurance Fee'}</span>
                            <span className="font-bold text-white font-mono">{formatCurrency(selectedShipment.insuranceFee, 'USD')}</span>
                          </div>
                        ) : null}

                        {/* Customs Receipt dynamic row */}
                        {(selectedShipment.customsDutyRecord || ['CUSTOMS_CLEARANCE', 'CUSTOMS_HELD', 'READY_FOR_DELIVERY', 'DELIVERED'].includes(selectedShipment.currentStatus)) && (
                          <div className="flex items-center justify-between text-amber-200 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                            <div className="flex items-center gap-2">
                              <span>{isAr ? 'رسوم جمركية رسمية (موثقة)' : 'Official Customs Fees'}</span>
                              <button 
                                onClick={() => setCustomsReceiptUrl(selectedShipment.customsDutyRecord?.receiptPhotoUrl || 'https://images.unsplash.com/photo-1621844781423-f327702e861c?auto=format&fit=crop&q=80&w=600')}
                                className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                              >
                                <Paperclip className="w-3 h-3" />
                                <span>{isAr ? 'عرض الوصل' : 'View Receipt'}</span>
                              </button>
                            </div>
                            <span className="font-bold text-amber-400 font-mono">
                              {formatCurrency(selectedShipment.customsDutyRecord?.dutyAmountPaid || selectedShipment.customsDutyEstimated || 35, 'USD')}
                            </span>
                          </div>
                        )}

                        {/* Remaining balance on delivery calculation */}
                        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-sm">
                          <div>
                            <span className="font-bold text-slate-200 block">{isAr ? 'المبلغ المتبقي عند الاستلام' : 'Remaining on Delivery'}</span>
                            <span className="text-[10px] text-slate-400">
                              {selectedShipment.currentStatus === 'DELIVERED' 
                                ? (isAr ? 'تم استيفاء الحساب بالكامل' : 'Account fully settled')
                                : (isAr ? 'يتم الدفع كاش بالمكتب أو عبر المحفظة' : 'Payable in cash at hub or via wallet')
                              }
                            </span>
                          </div>
                          <span className={`font-black font-mono text-lg ${
                            selectedShipment.currentStatus === 'DELIVERED' ? 'text-emerald-400' : 'text-brand-400'
                          }`}>
                            {selectedShipment.currentStatus === 'DELIVERED' 
                              ? formatCurrency(0, 'USD')
                              : formatCurrency(
                                  (selectedShipment.shippingCost || 18) +
                                  (selectedShipment.customsDutyRecord?.dutyAmountPaid || (['CUSTOMS_CLEARANCE', 'CUSTOMS_HELD', 'READY_FOR_DELIVERY'].includes(selectedShipment.currentStatus) ? 35 : 0)),
                                  'USD'
                                )
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="hidden lg:flex flex-col items-center justify-center h-full min-h-[450px] bg-slate-900/40 border border-slate-800/60 rounded-3xl text-slate-500 p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
                      <Box className="w-8 h-8 opacity-40" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-300">{isAr ? 'اختر طلباً لعرض التفاصيل' : 'Select an order to view details'}</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        {isAr ? 'انقر على أي شحنة من القائمة للاطلاع على مسار التتبع الزمني والفاتورة والوصل الجمركي.' : 'Click any shipment in the list to inspect timeline progress, receipts and invoice details.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Printable Waybill Modal */}
      <WaybillModal
        isOpen={!!waybillModalShipment}
        onClose={() => setWaybillModalShipment(null)}
        shipment={waybillModalShipment}
        locale={locale}
      />


      {/* Customs Receipt Modal (Bottom Sheet style on Mobile, Modal on Desktop) */}
      <AnimatePresence>
        {customsReceiptUrl && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setCustomsReceiptUrl(null)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full sm:w-[540px] bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10"
            >
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{isAr ? 'الوصل الجمركي الرسمي والموثق' : 'Official Customs Duty Receipt'}</h3>
                    <p className="text-[11px] text-slate-400">{isAr ? 'تم السداد والتخليص من قبل إدارة المحطة' : 'Paid and cleared by Station Management'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setCustomsReceiptUrl(null)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
                {/* Official Receipt Image Container */}
                <div className="w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative group">
                  <img 
                    src={customsReceiptUrl} 
                    alt="Customs Official Receipt" 
                    className="w-full h-80 object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-white font-mono font-bold text-[11px] bg-slate-900/90 px-3 py-1 rounded-lg backdrop-blur-md border border-slate-700">
                      REC: DZ-DGD-2026-99042
                    </span>
                    <span className="text-emerald-400 font-bold text-[11px] bg-emerald-950/80 px-3 py-1 rounded-lg backdrop-blur-md border border-emerald-700/50">
                      ✓ {isAr ? 'معتمد رسمياً' : 'Verified'}
                    </span>
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-2.5">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">{isAr ? 'الجهة المصدرة:' : 'Issuing Authority:'}</span>
                    <strong className="text-white">{isAr ? 'مفتشية الجمارك بالمطار الدولي' : 'Customs Inspectorate'}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">{isAr ? 'قيمة الرسوم المدفوعة:' : 'Amount Paid:'}</span>
                    <strong className="text-amber-400 font-mono font-bold">{formatCurrency(35, 'USD')}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">{isAr ? 'تاريخ المعاملة:' : 'Transaction Date:'}</span>
                    <span className="text-slate-300 font-mono">{new Date().toLocaleDateString(isAr ? 'ar-JO' : 'en-US')}</span>
                  </div>
                </div>

                <button
                  onClick={() => setCustomsReceiptUrl(null)}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs transition-colors cursor-pointer border border-slate-700"
                >
                  {isAr ? 'إغلاق المعاينة' : 'Close Receipt'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hub Agent Chat Modal */}
      <AgentChatModal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        trackingNumber={selectedShipment?.trackingNumber}
        locale={locale}
      />

      {/* Legal, Customs & Prohibited Items Compliance Modal */}
      <ComplianceModal
        isOpen={complianceModalOpen}
        onClose={() => setComplianceModalOpen(false)}
        initialTab={complianceInitialTab}
        locale={locale}
        onAcceptTerms={() => {
          setProhibitedAgreed(true);
        }}
      />

      {/* Official Dispute & Arbitration Modal */}
      <CreateDisputeModal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        shipment={selectedShipment}
        currentUser={currentUser}
        locale={locale}
        onSuccess={() => {
          onRefreshShipments();
        }}
      />
                  </motion.div>
        </AnimatePresence>
      </main>
      </div>

      {/* Order Success Confirmation & AWB Generation */}
      {orderSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-brand-500/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-emerald-500"></div>
            <div className="w-20 h-20 bg-brand-500/20 text-brand-400 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-brand-500/10">
              <FileCheck className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">
              {isAr ? 'تم تأكيد طلبك بنجاح!' : 'Order Confirmed Successfully!'}
            </h2>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed">
              {isAr 
                ? 'لقد تم تسجيل شحنتك وإصدار بوليصة الشحن المبدئية (AWB). يمكنك متابعة التحديثات من لوحة التحكم.' 
                : 'Your shipment has been recorded and an initial Air Waybill (AWB) has been generated. Track updates from your dashboard.'}
            </p>
            
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-8">
              <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">{isAr ? 'رقم التتبع' : 'Tracking Number'}</div>
              <div className="text-xl font-mono font-black text-brand-300">
                TH-AWB-{Math.floor(100000 + Math.random() * 900000)}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setOrderSuccessModalOpen(false)}
                className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-colors"
              >
                {isAr ? 'المتابعة للطلبات' : 'Go to Orders'}
              </button>
            </div>
          </div>
        </div>
      )}
    
      {/* Mobile Bottom Bar (Smart Navigation Architecture) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 flex items-center justify-around z-40 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {/* 1. Home Dashboard */}
        <motion.button 
          whileTap={{ scale: 0.92 }}
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex flex-col items-center justify-center py-1 flex-1 transition-all cursor-pointer ${
            activeTab === 'OVERVIEW' ? 'text-brand-600 font-black' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home className={`w-5 h-5 transition-transform ${activeTab === 'OVERVIEW' ? 'scale-110' : ''}`} />
          <span className="text-[10px] mt-1 font-bold tracking-tight">{isAr ? 'الرئيسية' : 'Home'}</span>
        </motion.button>

        {/* 2. My Orders (Direct access to order timeline & dispute trigger) */}
        <motion.button 
          whileTap={{ scale: 0.92 }}
          onClick={() => setActiveTab('MY_SHIPMENTS')}
          className={`flex flex-col items-center justify-center py-1 flex-1 transition-all cursor-pointer ${
            activeTab === 'MY_SHIPMENTS' ? 'text-brand-600 font-black' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Package className={`w-5 h-5 transition-transform ${activeTab === 'MY_SHIPMENTS' ? 'scale-110' : ''}`} />
          <span className="text-[10px] mt-1 font-bold tracking-tight">{isAr ? 'طلباتي' : 'Orders'}</span>
        </motion.button>
        
        {/* 3. Central Action: Create Order (FAB) */}
        <div className="relative -top-4 flex items-center justify-center px-1">
          <motion.button 
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsCreateOrderMenuOpen(!isCreateOrderMenuOpen)}
            className="w-13 h-13 bg-gradient-to-tr from-brand-600 to-brand-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-brand-500/40 ring-4 ring-white cursor-pointer"
            aria-label={isAr ? 'إنشاء طلب جديد' : 'Create Order'}
          >
            <Plus className={`w-6 h-6 transition-transform duration-200 ${isCreateOrderMenuOpen ? 'rotate-45' : ''}`} />
          </motion.button>
        </div>

        {/* 4. Wallet Dashboard */}
        <motion.button 
          whileTap={{ scale: 0.92 }}
          onClick={() => setActiveTab('WALLET')}
          className={`flex flex-col items-center justify-center py-1 flex-1 transition-all cursor-pointer ${
            activeTab === 'WALLET' ? 'text-brand-600 font-black' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Wallet className={`w-5 h-5 transition-transform ${activeTab === 'WALLET' ? 'scale-110' : ''}`} />
          <span className="text-[10px] mt-1 font-bold tracking-tight">{isAr ? 'المحفظة' : 'Wallet'}</span>
        </motion.button>

        {/* 5. Profile & More (Dynamic Badge on active dispute updates) */}
        <motion.button 
          whileTap={{ scale: 0.92 }}
          onClick={() => setActiveTab('PROFILE')}
          className={`relative flex flex-col items-center justify-center py-1 flex-1 transition-all cursor-pointer ${
            activeTab === 'PROFILE' || activeTab === 'DISPUTES' ? 'text-brand-600 font-black' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="relative">
            <UserIcon className={`w-5 h-5 transition-transform ${activeTab === 'PROFILE' ? 'scale-110' : ''}`} />
            {hasPendingDispute && (
              <span className="absolute -top-1 -end-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse shadow-sm" />
            )}
          </div>
          <span className="text-[10px] mt-1 font-bold tracking-tight">{isAr ? 'حسابي' : 'Profile'}</span>
        </motion.button>
      </div>

      {/* Mobile Create Order Bottom Sheet */}
      <AnimatePresence>
        {isCreateOrderMenuOpen && (
          <div className="md:hidden">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateOrderMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-20 left-4 right-4 bg-white rounded-3xl p-4 z-50 shadow-2xl"
            >
              <h3 className="text-center font-bold text-slate-800 mb-4">{isAr ? 'ماذا تريد أن تفعل؟' : 'What would you like to do?'}</h3>
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => { setActiveTab('SEND_PARCEL'); setIsCreateOrderMenuOpen(false); }}
                  className="flex flex-col items-center gap-2 p-3 bg-brand-50 rounded-2xl text-brand-700 hover:bg-brand-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Box className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-center">{isAr ? 'إرسال طرد' : 'Send Parcel'}</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('INTERNATIONAL_BUY'); setIsCreateOrderMenuOpen(false); }}
                  className="flex flex-col items-center gap-2 p-3 bg-indigo-50 rounded-2xl text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Globe2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-center">{isAr ? 'شراء عالمي' : 'Global Buy'}</span>
                </button>
                <button 
                  onClick={() => { setActiveTab('SPECIFIC_COUNTRY_BUY'); setIsCreateOrderMenuOpen(false); }}
                  className="flex flex-col items-center gap-2 p-3 bg-emerald-50 rounded-2xl text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Store className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-center">{isAr ? 'شراء محلي' : 'Local Buy'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
</div>
  );
};
