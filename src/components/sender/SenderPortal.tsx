import { UserProfile } from '../profile/UserProfile';
import { SenderOverview } from './SenderOverview';
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

  // Option 3: Buy from Specific Country State
  const [targetCountry, setTargetCountry] = useState(uniqueCountries[0]?.code || 'JOR');
  const [localMarketName, setLocalMarketName] = useState('سوق وسط البلد التراثي (عمان)');
  const [countryWizardStep, setCountryWizardStep] = useState(1);
  const [localMarketContact, setLocalMarketContact] = useState('');
  const [countryProductUrl, setCountryProductUrl] = useState('');
  const [countryCustomsAgreed, setCountryCustomsAgreed] = useState(false);
  const [countryBuyItems, setCountryBuyItems] = useState<OrderItem[]>([
    {
      id: 'c-item-1',
      name: 'زعتر أردني بلدي فاخر + زيت زيتون بكر عجلوني',
      quantity: 2,
      unitPrice: 35.0,
      totalCost: 70.0,
      sourceCountry: uniqueCountries[0]?.code || 'JOR',
      specsOrVariants: 'عبوة زجاجية 1 لتر محكمة الإغلاق',
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
  const handleSendParcelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prohibitedAgreed) {
      alert(isAr ? 'يرجى الموافقة على إقرار المواد المصرح بها للمتابعة' : 'Please agree to the Safety Declaration');
      return;
    }

    setIsSubmitting(true);
    const success = await onCreateShipment({
      serviceType: 'SEND_PARCEL',
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      senderPhone: currentUser.phone,
      originHubId,
      destinationHubId: destHubId,
      recipientName,
      recipientPhone,
      recipientAddress,
      recipientNationalId,
      itemCategory: parcelCategory,
      itemCondition: parcelCondition,
      isCustomsApplicable: !liveParcelQuote.isCustomsExempt,
      customsRatePercent: liveParcelQuote.customsRatePercent,
      customsExemptReason: liveParcelQuote.isCustomsExempt
        ? 'أمانات ومقتنيات شخصية مستعملة معفاة قانوناً (0%)'
        : undefined,
      itemDescription: parcelDescription,
      purpose: parcelPurpose,
      declaredValue: parcelDeclaredValue,
      estimatedWeightKg: parcelEstimatedWeightKg,
      dimensionsCm: { length: parcelLengthCm, width: parcelWidthCm, height: parcelHeightCm },
      prohibitedItemsAgreed: prohibitedAgreed,
      senderLegalWaiverSigned: true,
      paymentGateway: selectedPaymentGateway,
      lockedExchangeRate: originHubId === 'hub-amm' ? 0.709 : 220.0,
      orderItems: [
        {
          id: 'item-parcel-1',
          name: parcelDescription,
          quantity: 1,
          unitPrice: parcelDeclaredValue,
          totalCost: parcelDeclaredValue,
          itemCategory: parcelCategory,
        },
      ],
    });
    setIsSubmitting(false);

    if (success) {
      setActiveTab('MY_SHIPMENTS');
      onRefreshShipments();
      setOrderSuccessModalOpen(true);
    }
  };

  // Submit Handler for Option 2: International Stores
  const handleStoreBuySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalItemsCost = storeItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);

    setIsSubmitting(true);
    const success = await onCreateShipment({
      serviceType: 'INTERNATIONAL_BUY',
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      senderPhone: currentUser.phone,
      originHubId,
      destinationHubId: destHubId,
      recipientName,
      recipientPhone,
      recipientAddress,
      recipientNationalId,
      itemCategory: 'ELECTRONICS',
      itemDescription: `${storeName}: ${storeItems.map((i) => `${i.quantity}x ${i.name}`).join(', ')}`,
      declaredValue: totalItemsCost,
      estimatedWeightKg: 1.8,
      dimensionsCm: { length: 25, width: 20, height: 10 },
      prohibitedItemsAgreed: true,
      orderItems: storeItems,
    });
    setIsSubmitting(false);

    if (success) {
      setActiveTab('MY_SHIPMENTS');
      onRefreshShipments();
      setOrderSuccessModalOpen(true);
    }
  };

  // Submit Handler for Option 3: Specific Country Buy
  const handleCountryBuySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalItemsCost = countryBuyItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);

    setIsSubmitting(true);
    const success = await onCreateShipment({
      serviceType: 'SPECIFIC_COUNTRY_BUY',
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      senderPhone: currentUser.phone,
      originHubId,
      destinationHubId: destHubId,
      recipientName,
      recipientPhone,
      recipientAddress,
      recipientNationalId,
      itemCategory: 'GIFTS_COSMETICS',
      itemDescription: `شراء من ${localMarketName}: ${countryBuyItems.map((i) => `${i.quantity}x ${i.name}`).join(', ')}`,
      declaredValue: totalItemsCost,
      estimatedWeightKg: 2.5,
      dimensionsCm: { length: 30, width: 20, height: 15 },
      prohibitedItemsAgreed: true,
      orderItems: countryBuyItems,
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
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside
          className={`hidden md:flex shrink-0 flex-col bg-white border-${isAr ? 'l' : 'r'} border-slate-200 overflow-y-auto transition-all duration-300 z-20 ${
            isSidebarOpen ? 'w-64' : 'w-20'
          }`}
        >
          
          <div className={`p-4 flex items-center border-b border-slate-100 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
            {isSidebarOpen && (
              <span className="text-xs font-black text-slate-800 tracking-wider">
                {isAr ? 'الخدمات' : 'SERVICES'}
              </span>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors"
            >
              <Menu className="w-4 h-4" />
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
                onNavigate={(tab) => setActiveTab(tab as any)}
                isAr={isAr}
                shipments={shipments}
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

                {activeTab === 'SEND_PARCEL' && (
        <form onSubmit={handleSendParcelSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-8 text-white shadow-xl max-w-4xl mx-auto space-y-4 md:space-y-8">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-brand-400" />
              <span>{isAr ? 'الخيار الأول: إرسال طرد (شخصي / تجاري)' : 'Option 1: Send Parcel'}</span>
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {isAr ? 'حدد مسار الشحن ومواصفات الطرد وخيارات التوصيل' : 'Specify route, dimensions, and delivery options'}
            </p>
          </div>

          {/* Mobile Progress Bar */}
          <div className="md:hidden mb-2">
            <div className="flex items-center justify-between mb-2 px-2">
               {[1, 2, 3, 4].map(step => (
                  <div key={step} className="flex flex-col items-center flex-1 relative">
                     <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 ${sendWizardStep === step ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/40 ring-2 ring-brand-500/20' : sendWizardStep > step ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                        {sendWizardStep > step ? <CheckCircle2 className="w-4 h-4" /> : step}
                     </div>
                  </div>
               ))}
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden flex mx-4">
               <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${((sendWizardStep - 1) / 3) * 100}%` }}></div>
            </div>
          </div>

          {/* Step 1: Parcel Specs & Content */}
          <div className={`${sendWizardStep === 1 ? 'block' : 'hidden'} md:block space-y-4`}>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Box className="w-4 h-4 text-brand-400" />
              {isAr ? 'الخطوة 1: مواصفات ومحتوى الطرد' : 'Step 1: Parcel Specifications'}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'تصنيف الطرد' : 'Parcel Category'}</label>
                <select
                  value={parcelCategory}
                  onChange={(e) => setParcelCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
                >
                  <option value="ELECTRONICS">{isAr ? 'إلكترونيات (مسموح بشروط)' : 'Electronics'}</option>
                  <option value="CLOTHING">{isAr ? 'ملابس وأحذية (جديدة أو مستعملة)' : 'Clothing & Shoes'}</option>
                  <option value="DOCUMENTS">{isAr ? 'مستندات ووثائق رسمية' : 'Documents'}</option>
                  <option value="FOOD">{isAr ? 'مواد غذائية (مغلفة تجارياً فقط)' : 'Food (Commercially Packaged)'}</option>
                  <option value="COSMETICS">{isAr ? 'مستحضرات تجميل (غير سائلة)' : 'Cosmetics (Non-liquid)'}</option>
                  <option value="OTHER">{isAr ? 'أغراض شخصية أخرى / هدايا' : 'Other Personal Items'}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'الحالة' : 'Condition'}</label>
                <select
                  value={parcelCondition}
                  onChange={(e) => setParcelCondition(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
                >
                  <option value="USED_PERSONAL">{isAr ? 'أمانات/أغراض شخصية مستعملة' : 'Used / Personal Items'}</option>
                  <option value="NEW_PERSONAL">{isAr ? 'أغراض جديدة (هدايا / شخصي)' : 'New (Personal/Gifts)'}</option>
                  <option value="NEW_COMMERCIAL">{isAr ? 'بضاعة تجارية جديدة' : 'New Commercial Goods'}</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-950/50 p-3 md:p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-3xl"></div>
              <label className="block text-xs font-bold text-brand-300 mb-3">{isAr ? 'الأبعاد والوزن (يحسب التسعير تلقائياً)' : 'Dimensions & Weight'}</label>
              <div className="grid grid-cols-4 gap-2 md:gap-4 mb-4">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 text-center">{isAr ? 'الطول (سم)' : 'L (cm)'}</label>
                  <input type="number" min="1" value={parcelLengthCm} onChange={(e) => setParcelLengthCm(Number(e.target.value))} className="w-full px-1 md:px-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-center text-sm font-bold text-white" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 text-center">{isAr ? 'العرض (سم)' : 'W (cm)'}</label>
                  <input type="number" min="1" value={parcelWidthCm} onChange={(e) => setParcelWidthCm(Number(e.target.value))} className="w-full px-1 md:px-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-center text-sm font-bold text-white" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1 text-center">{isAr ? 'الارتفاع (سم)' : 'H (cm)'}</label>
                  <input type="number" min="1" value={parcelHeightCm} onChange={(e) => setParcelHeightCm(Number(e.target.value))} className="w-full px-1 md:px-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-center text-sm font-bold text-white" />
                </div>
                <div>
                  <label className="block text-[10px] text-brand-300 mb-1 text-center">{isAr ? 'الوزن (كغ)' : 'W (kg)'}</label>
                  <input type="number" min="0.1" step="0.1" value={parcelEstimatedWeightKg} onChange={(e) => setParcelEstimatedWeightKg(Number(e.target.value))} className="w-full px-1 md:px-2 py-2 bg-brand-900/30 border border-brand-500/50 rounded-lg text-center text-sm font-black text-brand-400" />
                </div>
              </div>
              
              {/* Dynamic Pricing Banner */}
              <div className="flex flex-col md:flex-row items-center justify-between bg-slate-900 border border-slate-700 p-3 rounded-xl gap-3">
                <div className="flex gap-2 md:gap-4 text-xs text-slate-300 w-full md:w-auto justify-around md:justify-start">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] md:text-[10px] text-slate-500">{isAr ? 'الوزن الحجمي' : 'Volumetric'}</span>
                    <span className="font-bold">{((parcelLengthCm * parcelWidthCm * parcelHeightCm) / 5000).toFixed(1)} kg</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] md:text-[10px] text-slate-500">{isAr ? 'الوزن المحتسب' : 'Chargeable'}</span>
                    <span className="font-black text-white">{Math.max(parcelEstimatedWeightKg, ((parcelLengthCm * parcelWidthCm * parcelHeightCm) / 5000)).toFixed(1)} kg</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] md:text-[10px] text-slate-500">{isAr ? 'سعر الكيلو' : 'Rate/kg'}</span>
                    <span className="font-bold text-emerald-400">$12.00</span>
                  </div>
                </div>
                <div className="text-right w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between border-t border-slate-800 pt-2 md:pt-0 md:border-0">
                  <span className="text-[10px] text-slate-400">{isAr ? 'تكلفة الشحن الأساسية' : 'Base Freight'}</span>
                  <span className="text-xl md:text-2xl font-black text-white">
                    ${(Math.max(parcelEstimatedWeightKg, ((parcelLengthCm * parcelWidthCm * parcelHeightCm) / 5000)) * 12).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'تفاصيل ومحتويات الطرد' : 'Parcel Contents & Description'}</label>
              <textarea
                required
                rows={2}
                value={parcelDescription}
                onChange={(e) => setParcelDescription(e.target.value)}
                placeholder={isAr ? 'يرجى كتابة التفاصيل الدقيقة (مثال: ملابس شتوية، حذاء رياضي، حقيبة يد)...' : 'Detailed description...'}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white resize-none"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">{isAr ? 'صورة الطرد / المحتويات' : 'Parcel / Contents Photo'}</label>
              <div className="border-2 border-dashed border-slate-700 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand-500/50 hover:bg-slate-800/50 transition-all">
                <Camera className="w-8 h-8 text-slate-500 mb-2" />
                <p className="text-xs md:text-sm font-bold text-slate-300">{isAr ? 'التقط صورة بكاميرا الهاتف أو ارفع من الاستديو' : 'Take a photo or upload from gallery'}</p>
                <button type="button" className="mt-3 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-[10px] md:text-xs font-bold rounded-lg transition-colors">
                  {isAr ? 'فتح الكاميرا / الاستديو' : 'Open Camera / Gallery'}
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Addresses & Scheduled Flights */}
          <div className={`${sendWizardStep === 2 ? 'block' : 'hidden'} md:block space-y-4 pt-2`}>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <MapPin className="w-4 h-4 text-brand-400" />
              {isAr ? 'الخطوة 2: العناوين والرحلات المتاحة' : 'Step 2: Addresses & Flights'}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'من: مركز الانطلاق' : 'From: Origin Hub'}</label>
                <select
                  value={originHubId}
                  onChange={(e) => setOriginHubId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-brand-400"
                >
                  {activeHubs.map((h) => (
                    <option key={h.id} value={h.id}>
                      {isAr ? h.nameAr : h.nameEn} ({h.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'إلى: بلد الوجهة' : 'To: Destination Country'}</label>
                <select
                  value={destHubId}
                  onChange={(e) => setDestHubId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-hidden focus:border-brand-400"
                >
                  {activeHubs.map((h) => (
                    <option key={h.id} value={h.id}>
                      {isAr ? h.nameAr : h.nameEn} ({h.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Smart Address Book */}
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
              <label className="text-xs font-bold text-brand-300 flex items-center gap-2 mb-3">
                <MapPinIcon className="w-4 h-4" />
                {isAr ? 'دفتر العناوين المحفوظة (المستلم)' : 'Saved Address Book (Recipient)'}
              </label>
              <select
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white mb-3"
                onChange={(e) => {
                  if (e.target.value === '1') {
                    setRecipientName('Ahmad Al-Saeed');
                    setRecipientPhone('+962 79 000 0000');
                    setRecipientAddress('Amman, 7th Circle');
                  } else if (e.target.value === '2') {
                    setRecipientName('Yassine Benali');
                    setRecipientPhone('+213 55 000 0000');
                    setRecipientAddress('Algiers, Hydra');
                  }
                }}
              >
                <option value="">{isAr ? '-- اختر مستلماً محفوظاً أو أدخل بيانات جديدة --' : '-- Choose a saved recipient --'}</option>
                <option value="1">Ahmad Al-Saeed (Amman, Jordan)</option>
                <option value="2">Yassine Benali (Algiers, Algeria)</option>
              </select>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" required placeholder={isAr ? 'اسم المستلم' : 'Recipient Name'} value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm" />
                <input type="tel" required placeholder={isAr ? 'رقم هاتف المستلم' : 'Recipient Phone'} value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-left" dir="ltr" />
              </div>
            </div>

            {/* Delivery Options */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 block">{isAr ? 'خيارات التوصيل للمستلم' : 'Delivery Options'}</label>
              <div className="flex bg-slate-800 p-1 rounded-xl">
                <button type="button" onClick={() => setDeliveryType('HOME')} className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${deliveryType === 'HOME' ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                  {isAr ? 'توصيل لباب البيت' : 'Home Delivery'}
                </button>
                <button type="button" onClick={() => setDeliveryType('HUB')} className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${deliveryType === 'HUB' ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                  {isAr ? 'استلام من المكتب (مجاني)' : 'Hub Pickup (Free)'}
                </button>
              </div>
              
              {deliveryType === 'HOME' && (
                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl animate-in slide-in-from-top-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'العنوان التفصيلي للتوصيل' : 'Detailed Delivery Address'}</label>
                  <textarea required rows={2} value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} placeholder={isAr ? 'المدينة، الحي، الشارع، رقم البناية...' : 'City, District, Street...'} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white" />
                </div>
              )}
            </div>

            {/* Scheduled Flights (Trips) */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <Plane className="w-4 h-4 text-brand-400" />
                {isAr ? 'الرحلات المجدولة المتاحة' : 'Available Scheduled Flights'}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { id: 'trip-1', date: '2026-09-05', remainingKg: 45, carrier: 'Royal Jordanian (RJ 503)' },
                  { id: 'trip-2', date: '2026-09-08', remainingKg: 12, carrier: 'Air Algerie (AH 4062)' }
                ].map(trip => (
                  <div 
                    key={trip.id} 
                    onClick={() => setSelectedTripId(trip.id)}
                    className={`p-3 md:p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedTripId === trip.id ? 'border-brand-500 bg-brand-500/10 shadow-md scale-[1.02]' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-sm">{trip.date}</span>
                      <span className={`text-[10px] md:text-xs font-bold px-2 py-1 rounded-md ${trip.remainingKg > 20 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {trip.remainingKg} kg {isAr ? 'متبقي' : 'left'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{trip.carrier}</p>
                  </div>
                ))}
              </div>
              {selectedTripId && (
                <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mt-2 animate-in slide-in-from-top-1">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                  <div className="text-xs text-amber-200">
                    <p className="font-bold mb-1">{isAr ? 'تنبيه زمني إلزامي:' : 'Mandatory Timeline Notice:'}</p>
                    <p>{isAr ? 'يجب تسليم الطرد للمكتب قبل 3 أيام على الأقل من تاريخ الرحلة المحددة.' : 'Parcel must be delivered to the hub at least 3 days before the flight date.'}</p>
                    <p className="mt-2 p-2 bg-amber-500/20 rounded-lg text-emerald-400 font-bold flex items-center justify-between">
                      <span>{isAr ? 'تاريخ التوصيل المتوقع (ETA):' : 'Estimated Delivery (ETA):'}</span>
                      <span>{selectedTripId === 'trip-1' ? '2026-09-08' : '2026-09-11'}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Protection & Legal */}
          <div className={`${sendWizardStep === 3 ? 'block' : 'hidden'} md:block space-y-4 pt-2`}>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              {isAr ? 'الخطوة 3: الحماية والإقرارات' : 'Step 3: Protection & Legal'}
            </h4>
            
            {/* Packaging & Insurance Upsell */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">{isAr ? 'خدمات التغليف (اختياري)' : 'Packaging Services (Optional)'}</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                  <div onClick={() => setPackagingRequested(false)} className={`p-2 md:p-3 rounded-xl border-2 cursor-pointer transition-all text-center md:text-left ${!packagingRequested ? 'border-brand-500 bg-brand-500/10' : 'border-slate-700 bg-slate-800/50'}`}>
                    <p className="font-bold text-xs md:text-sm text-white">{isAr ? 'بدون تغليف' : 'No Extra'}</p>
                    <p className="text-[10px] md:text-xs text-slate-400 mt-1">{isAr ? 'مجاني' : 'Free'}</p>
                  </div>
                  <div onClick={() => setPackagingRequested(true)} className={`p-2 md:p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between text-center md:text-left ${packagingRequested ? 'border-brand-500 bg-brand-500/10' : 'border-slate-700 bg-slate-800/50'}`}>
                    <div>
                      <p className="font-bold text-xs md:text-sm text-white">{isAr ? 'تغليف آمن فقاعي' : 'Bubble Wrap'}</p>
                    </div>
                    <p className="text-xs md:text-sm font-black text-emerald-400 mt-2">+$5.00</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div>
                  <p className="font-bold text-sm text-white">{isAr ? 'تأمين الطرد (1.5% من القيمة)' : 'Insurance (1.5% of value)'}</p>
                  <p className="text-xs text-slate-400 mt-1 hidden md:block">{isAr ? 'تغطية كاملة ضد الفقدان أو التلف' : 'Full coverage against loss or damage'}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={insuranceRequested} onChange={e => setInsuranceRequested(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                </label>
              </div>
              
              {insuranceRequested && (
                <div className="flex items-center gap-3 animate-in fade-in">
                  <label className="text-xs font-semibold text-slate-300 whitespace-nowrap">{isAr ? 'القيمة المصرّح بها ($):' : 'Declared Value ($):'}</label>
                  <input type="number" min="10" value={parcelDeclaredValue} onChange={e => setParcelDeclaredValue(Number(e.target.value))} className="w-32 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm font-bold text-brand-300 text-center" />
                </div>
              )}
            </div>

            {/* Legal Declarations */}
            <div className="space-y-3 pt-4 border-t border-slate-800/50">
              <div className="flex items-start gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <input type="checkbox" id="prohibitedCheck" required className="mt-1 w-5 h-5 accent-brand-500 cursor-pointer shrink-0" checked={prohibitedAgreed} onChange={e => setProhibitedAgreed(e.target.checked)} />
                <label htmlFor="prohibitedCheck" className="text-[11px] md:text-xs text-slate-300 cursor-pointer leading-relaxed">
                  {isAr ? (
                    <>أقر وأتعهد بأن الطرد لا يحتوي على أي <a href="#" className="text-brand-400 underline font-bold">مواد ممنوعة قانونياً أو خطرة</a>، وأتحمل المسؤولية القانونية الكاملة عن محتوياته.</>
                  ) : (
                    <>I declare that the parcel contains no <a href="#" className="text-brand-400 underline font-bold">prohibited or dangerous items</a>, and I bear full legal responsibility.</>
                  )}
                </label>
              </div>
              <div className="flex items-start gap-3 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] md:text-xs text-amber-200 leading-relaxed">
                  <span className="font-bold">{isAr ? 'تنبيه جمركي إلزامي: ' : 'Mandatory Customs Notice: '}</span>
                  {isAr ? 'التكلفة الإجمالية في الخطوة التالية تشمل أجور الشحن والخدمات فقط. الرسوم الجمركية (إن وُجدت) غير مشمولة، ولا تُدفع مسبقاً، بل تُضاف للفاتورة عند استلام الشحنة في بلد الوجهة بموجب وصل رسمي.' : 'The total cost below covers shipping and services only. Customs duties are not included upfront; they are added upon arrival with an official customs receipt.'}
                </p>
              </div>
            </div>
          </div>

          {/* Step 4: Checkout & Confirmation */}
          <div className={`${sendWizardStep === 4 ? 'block' : 'hidden'} md:block bg-slate-950 border border-slate-800 rounded-2xl p-4 md:p-5 overflow-hidden relative mt-6`}>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 border-b border-slate-800 pb-3 gap-3">
              <h4 className="text-lg font-black text-white">{isAr ? 'الخطوة 4: الملخص المالي والدفع' : 'Step 4: Checkout & Payment'}</h4>
              <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 w-fit">
                <button type="button" onClick={() => setPaymentCurrency('SENDER')} className={`px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-md transition-all ${paymentCurrency === 'SENDER' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                  {isAr ? 'الدفع بعملة المرسل (JOD)' : 'Sender Currency (JOD)'}
                </button>
                <button type="button" onClick={() => setPaymentCurrency('RECIPIENT')} className={`px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-md transition-all ${paymentCurrency === 'RECIPIENT' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                  {isAr ? 'عملة المستلم (DZD)' : 'Recipient (DZD)'}
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-slate-300 mb-6 px-1">
              <div className="flex justify-between">
                <span>{isAr ? 'تكلفة الشحن الأساسية' : 'Base Freight'}</span>
                <span className="font-semibold">${(Math.max(parcelEstimatedWeightKg, ((parcelLengthCm * parcelWidthCm * parcelHeightCm) / 5000)) * 12).toFixed(2)}</span>
              </div>
              {packagingRequested && (
                <div className="flex justify-between text-emerald-400">
                  <span>{isAr ? 'تغليف آمن إضافي' : 'Extra Secure Packaging'}</span>
                  <span className="font-semibold">$5.00</span>
                </div>
              )}
              {insuranceRequested && (
                <div className="flex justify-between text-emerald-400">
                  <span>{isAr ? 'رسوم التأمين' : 'Insurance Fee'}</span>
                  <span className="font-semibold">${(parcelDeclaredValue * 0.015).toFixed(2)}</span>
                </div>
              )}
              {deliveryType === 'HOME' && (
                <div className="flex justify-between text-emerald-400">
                  <span>{isAr ? 'رسوم التوصيل الداخلي' : 'Local Delivery Fee'}</span>
                  <span className="font-semibold">$10.00</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold text-white pt-4 mt-2 bg-slate-900/80 p-3 rounded-lg border border-slate-700 items-center">
                <span className="text-base">{isAr ? 'الإجمالي المطلوب الدفع:' : 'Total to Pay:'}</span>
                <span className="text-xl md:text-2xl font-black text-brand-400 flex items-center gap-2">
                  {paymentCurrency === 'RECIPIENT' ? (
                    <>
                      <span className="text-xs text-slate-500 line-through hidden md:inline-block">${(
                        (Math.max(parcelEstimatedWeightKg, ((parcelLengthCm * parcelWidthCm * parcelHeightCm) / 5000)) * 12) +
                        (packagingRequested ? 5 : 0) +
                        (insuranceRequested ? (parcelDeclaredValue * 0.015) : 0) +
                        (deliveryType === 'HOME' ? 10 : 0)
                      ).toFixed(2)}</span>
                      <span>{(
                        ((Math.max(parcelEstimatedWeightKg, ((parcelLengthCm * parcelWidthCm * parcelHeightCm) / 5000)) * 12) +
                        (packagingRequested ? 5 : 0) +
                        (insuranceRequested ? (parcelDeclaredValue * 0.015) : 0) +
                        (deliveryType === 'HOME' ? 10 : 0)) * 135
                      ).toFixed(2)} DZD</span>
                    </>
                  ) : (
                    <span>${(
                      (Math.max(parcelEstimatedWeightKg, ((parcelLengthCm * parcelWidthCm * parcelHeightCm) / 5000)) * 12) +
                      (packagingRequested ? 5 : 0) +
                      (insuranceRequested ? (parcelDeclaredValue * 0.015) : 0) +
                      (deliveryType === 'HOME' ? 10 : 0)
                    ).toFixed(2)} JOD</span>
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-300">{isAr ? 'اختر طريقة الدفع' : 'Select Payment Method'}</label>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div onClick={() => setSelectedPaymentGateway('CLIQ_JOR')} className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all ${selectedPaymentGateway === 'CLIQ_JOR' ? 'border-brand-500 bg-brand-500/10' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/e/e6/CliQ_logo.png" alt="CliQ" className="h-6 object-contain opacity-80" />
                  <span className="text-[10px] font-bold text-slate-300">{isAr ? 'كليك (الأردن)' : 'CliQ (JOR)'}</span>
                </div>
                <div onClick={() => setSelectedPaymentGateway('BANK_TRANSFER')} className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all ${selectedPaymentGateway === 'BANK_TRANSFER' ? 'border-brand-500 bg-brand-500/10' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}>
                  <Wallet className={`w-6 h-6 ${selectedPaymentGateway === 'BANK_TRANSFER' ? 'text-brand-400' : 'text-slate-500'}`} />
                  <span className="text-[10px] font-bold text-slate-300">{isAr ? 'تحويل بنكي' : 'Bank Transfer'}</span>
                </div>
                <div onClick={() => setSelectedPaymentGateway('ESCROW_WALLET')} className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all ${selectedPaymentGateway === 'ESCROW_WALLET' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}>
                  <ShieldCheck className={`w-6 h-6 ${selectedPaymentGateway === 'ESCROW_WALLET' ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="text-[10px] font-bold text-slate-300">{isAr ? 'محفظة الضمان' : 'Escrow Wallet'}</span>
                </div>
                <div onClick={() => setSelectedPaymentGateway('CASH_AT_HUB')} className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all ${selectedPaymentGateway === 'CASH_AT_HUB' ? 'border-brand-500 bg-brand-500/10' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}>
                  <DollarSign className={`w-6 h-6 ${selectedPaymentGateway === 'CASH_AT_HUB' ? 'text-brand-400' : 'text-slate-500'}`} />
                  <span className="text-[10px] font-bold text-slate-300">{isAr ? 'كاش في المكتب' : 'Cash at Hub'}</span>
                </div>
              </div>

              {selectedPaymentGateway === 'BANK_TRANSFER' && (
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl mt-3 space-y-3 animate-in slide-in-from-top-1">
                  <div className="text-xs text-slate-300 space-y-1">
                    <p>{isAr ? 'الرجاء تحويل المبلغ إلى الحساب التالي:' : 'Please transfer the amount to the following account:'}</p>
                    <p className="font-mono text-brand-300 font-bold bg-slate-950 px-2 py-1 rounded inline-block mt-1 border border-brand-500/20">IBAN: JO98 ABAB 0000 0000 1234 56</p>
                    <p>{isAr ? 'البنك العربي - شركة ثويسة اللوجستية' : 'Arab Bank - THOUESA Logistics'}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <label className="block text-[10px] md:text-xs font-bold text-slate-400 mb-1">{isAr ? 'إرفاق إيصال التحويل (ضروري لتأكيد الطلب)' : 'Upload Transfer Receipt (Required)'}</label>
                    <div className="flex items-center gap-2">
                      <input type="file" accept="image/*,.pdf" className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation Buttons */}
          <div className="md:hidden flex items-center justify-between pt-4 mt-6 border-t border-slate-800">
             {sendWizardStep > 1 ? (
                <button type="button" onClick={() => setSendWizardStep(sendWizardStep - 1)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold flex items-center gap-2">
                   <ChevronRight className="w-4 h-4" />
                   <span>{isAr ? 'السابق' : 'Back'}</span>
                </button>
             ) : <div />}
             
             {sendWizardStep < 4 ? (
                <button type="button" onClick={() => setSendWizardStep(sendWizardStep + 1)} className="px-6 py-2.5 bg-brand-500 hover:bg-brand-400 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20">
                   <span>{isAr ? 'التالي' : 'Next'}</span>
                   <ChevronLeft className="w-4 h-4" />
                </button>
             ) : (
                <button type="submit" disabled={isSubmitting || !prohibitedAgreed} className="flex-1 ml-4 flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-400 text-white font-black rounded-xl text-sm shadow-lg shadow-brand-500/30 disabled:opacity-50 transition-all">
                   <CheckCircle2 className="w-5 h-5" />
                   <span>{isSubmitting ? (isAr ? 'جاري...' : 'Processing...') : (isAr ? 'الدفع والتأكيد' : 'Pay & Confirm')}</span>
                </button>
             )}
          </div>

          {/* Desktop Navigation Button (Only Submit at bottom) */}
          <div className="hidden md:flex justify-end pt-4 mt-6 border-t border-slate-800">
            <button
              type="submit"
              disabled={isSubmitting || !prohibitedAgreed}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-brand-500 hover:bg-brand-400 text-white font-black rounded-xl text-sm shadow-lg shadow-brand-500/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isSubmitting ? (isAr ? 'جاري الإصدار...' : 'Processing...') : (isAr ? 'إتمام الدفع وتأكيد الطلب' : 'Complete Payment & Confirm')}</span>
            </button>
          </div>
        </form>
      )}{/* 3. OPTION 2 WIZARD: BUY FROM INTERNATIONAL STORES */}
      {activeTab === 'INTERNATIONAL_BUY' && (
        <form onSubmit={handleStoreBuySubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-8 text-white shadow-xl max-w-4xl mx-auto space-y-4 md:space-y-8">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Globe2 className="w-6 h-6 text-brand-400" />
              <span>{isAr ? 'الخيار الثاني: الشراء من المتاجر العالمية' : 'Option 2: Buy from Global Stores'}</span>
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {isAr
                ? 'أدخل روابط المنتجات وسيتولى فريقنا عملية الشراء والشحن لتصلك إلى باب منزلك.'
                : 'Enter product links, and our team will handle purchasing and shipping to your doorstep.'}
            </p>
          </div>

          {/* Mobile Progress Bar */}
          <div className="md:hidden mb-2">
            <div className="flex items-center justify-between mb-2 px-2">
               {[1, 2, 3, 4].map(step => (
                  <div key={step} className="flex flex-col items-center flex-1 relative">
                     <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 ${intlWizardStep === step ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/40 ring-2 ring-brand-500/20' : intlWizardStep > step ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                        {intlWizardStep > step ? <CheckCircle2 className="w-4 h-4" /> : step}
                     </div>
                  </div>
               ))}
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden flex mx-4">
               <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${((intlWizardStep - 1) / 3) * 100}%` }}></div>
            </div>
          </div>

          {/* Step 1: Store & Product Details */}
          <div className={`${intlWizardStep === 1 ? 'block' : 'hidden'} md:block space-y-4`}>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Store className="w-4 h-4 text-brand-400" />
              {isAr ? 'الخطوة 1: اختيار المتجر والمنتجات' : 'Step 1: Select Store & Products'}
            </h4>
            
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3 mb-6">
               {[
                  { id: 'Amazon', label: 'Amazon', bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
                  { id: 'Shein', label: 'Shein', bg: 'bg-zinc-800', border: 'border-zinc-700', text: 'text-white' },
                  { id: 'Temu', label: 'Temu', bg: 'bg-orange-600/10', border: 'border-orange-600/30', text: 'text-orange-500' },
                  { id: 'eBay', label: 'eBay', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
                  { id: 'AliExpress', label: 'AliExpress', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
                  { id: 'Other', label: isAr ? 'متجر آخر' : 'Other', bg: 'bg-slate-800', border: 'border-slate-700', text: 'text-slate-300' },
               ].map(s => (
                  <div
                    key={s.id}
                    onClick={() => setStoreName(s.id)}
                    className={`flex flex-col items-center justify-center p-2 md:p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      storeName === s.id ? `${s.border} ${s.bg} shadow-md scale-105` : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <span className={`text-[10px] md:text-xs font-black ${storeName === s.id ? s.text : 'text-slate-400'}`}>{s.label}</span>
                  </div>
               ))}
            </div>

            <div className="space-y-4">
              {storeItems.map((item, idx) => {
                const isRevealed = (item.storeUrl && item.storeUrl.length > 5);
                return (
                  <div key={item.id} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-4 relative group transition-all duration-500">
                    {storeItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setStoreItems(storeItems.filter((_, i) => i !== idx))}
                        className="absolute top-3 right-3 text-red-400/50 hover:text-red-400 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* Always visible: Link input */}
                    <div>
                      <label className="block text-xs font-bold text-brand-300 mb-2">{isAr ? 'رابط المنتج (URL) أو الرقم التسلسلي' : 'Product Link (URL) or Serial ID'}</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          required
                          value={item.storeUrl || ''}
                          onChange={(e) => updateStoreItem(idx, 'storeUrl', e.target.value)}
                          placeholder="https://..."
                          className="flex-1 px-4 py-3 bg-slate-900 border border-brand-500/30 rounded-xl text-sm text-white focus:outline-hidden focus:border-brand-500 transition-all min-w-0"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const text = await navigator.clipboard.readText();
                              updateStoreItem(idx, 'storeUrl', text);
                            } catch (err) {
                              alert(isAr ? 'تعذر الوصول للحافظة' : 'Clipboard access denied');
                            }
                          }}
                          className="px-3 md:px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-colors shrink-0"
                          title={isAr ? 'لصق سريع' : 'Quick Paste'}
                        >
                          <ClipboardPaste className="w-4 h-4" />
                          <span className="text-xs font-bold hidden sm:inline">{isAr ? 'لصق' : 'Paste'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Progressive Disclosure: Rest of the fields */}
                    {isRevealed && (
                      <div className="animate-in slide-in-from-top-2 fade-in duration-300 space-y-4 pt-3 border-t border-slate-800/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">{isAr ? 'اسم المنتج (تقريبي)' : 'Product Name (Approx)'}</label>
                            <input
                              type="text" required value={item.name} onChange={(e) => updateStoreItem(idx, 'name', e.target.value)}
                              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 mb-1">{isAr ? 'صورة المنتج (اختياري)' : 'Product Image (Optional)'}</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="url" value={item.imageUrl || ''} onChange={(e) => updateStoreItem(idx, 'imageUrl', e.target.value)} placeholder="URL..."
                                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"
                              />
                              <button type="button" className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 transition-colors shrink-0">
                                <Camera className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 md:gap-3">
                          <div>
                            <label className="block text-[10px] md:text-xs font-semibold text-slate-400 mb-1">{isAr ? 'الكمية' : 'Qty'}</label>
                            <input
                              type="number" min="1" value={item.quantity} onChange={(e) => updateStoreItem(idx, 'quantity', Number(e.target.value))}
                              className="w-full px-2 md:px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-center font-bold text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] md:text-xs font-semibold text-slate-400 mb-1">{isAr ? 'السعر التقريبي ($)' : 'Est Price ($)'}</label>
                            <input
                              type="number" min="0.1" step="0.1" value={item.unitPrice} onChange={(e) => updateStoreItem(idx, 'unitPrice', Number(e.target.value))}
                              className="w-full px-2 md:px-3 py-2.5 bg-brand-900/20 border border-brand-500/30 rounded-xl text-sm text-center font-bold text-brand-300"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] md:text-xs font-semibold text-brand-400 mb-1">{isAr ? 'الإجمالي ($)' : 'Total ($)'}</label>
                            <div className="w-full px-2 md:px-3 py-2.5 bg-slate-900 border border-brand-500/20 rounded-xl text-sm text-center font-black text-brand-400">
                              ${(item.totalCost || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">{isAr ? 'المقاس، اللون، وأي ملاحظات خاصة' : 'Size, Color, & Notes'}</label>
                          <textarea
                            rows={2} value={item.specsOrVariants || ''} onChange={(e) => updateStoreItem(idx, 'specsOrVariants', e.target.value)}
                            placeholder={isAr ? 'مثال: اللون أسود، مقاس L...' : 'e.g., Color Black, Size L...'}
                            className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white resize-y"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              <button
                type="button"
                onClick={() => {
                  setStoreItems([
                    ...storeItems,
                    { id: `item-${Date.now()}`, name: '', quantity: 1, unitPrice: 0, totalCost: 0, storeUrl: '' },
                  ]);
                }}
                className="w-full py-3 bg-slate-800/50 hover:bg-slate-800 text-brand-400 border border-brand-500/20 border-dashed rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'إضافة منتج آخر للطلب' : 'Add Another Product'}</span>
              </button>
            </div>
          </div>

          {/* Step 2: Delivery & Address */}
          <div className={`${intlWizardStep === 2 ? 'block' : 'hidden'} md:block space-y-4 pt-2`}>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <MapPin className="w-4 h-4 text-brand-400" />
              {isAr ? 'الخطوة 2: خيارات التوصيل والعناوين' : 'Step 2: Delivery & Address'}
            </h4>

            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
              <label className="text-xs font-bold text-brand-300 flex items-center gap-2 mb-3">
                <MapPinIcon className="w-4 h-4" />
                {isAr ? 'دفتر العناوين الذكي (المستلم)' : 'Smart Address Book (Recipient)'}
              </label>
              <select
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white mb-4"
                onChange={(e) => {
                  if (e.target.value === '1') {
                    setRecipientName('Ahmad Al-Saeed'); setRecipientPhone('+962 79 000 0000'); setRecipientAddress('Amman, 7th Circle');
                  } else if (e.target.value === '2') {
                    setRecipientName('Yassine Benali'); setRecipientPhone('+213 55 000 0000'); setRecipientAddress('Algiers, Hydra');
                  }
                }}
              >
                <option value="">{isAr ? '-- اختر مستلماً محفوظاً أو أدخل بيانات جديدة --' : '-- Choose a saved recipient --'}</option>
                <option value="1">Ahmad Al-Saeed (Amman, Jordan)</option>
                <option value="2">Yassine Benali (Algiers, Algeria)</option>
              </select>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" required placeholder={isAr ? 'اسم المستلم' : 'Recipient Name'} value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm" />
                <input type="tel" required placeholder={isAr ? 'رقم هاتف المستلم' : 'Recipient Phone'} value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-left" dir="ltr" />
              </div>
            </div>

            <div className="flex bg-slate-800 p-1 rounded-xl">
              <button type="button" onClick={() => setDeliveryType('HOME')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${deliveryType === 'HOME' ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                {isAr ? 'توصيل لباب البيت' : 'Home Delivery'}
              </button>
              <button type="button" onClick={() => setDeliveryType('HUB')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${deliveryType === 'HUB' ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                {isAr ? 'استلام من المكتب (مجاني)' : 'Hub Pickup (Free)'}
              </button>
            </div>
            
            {deliveryType === 'HOME' && (
              <div className="animate-in slide-in-from-top-1 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'العنوان التفصيلي للتوصيل' : 'Detailed Delivery Address'}</label>
                <textarea required rows={2} value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} placeholder={isAr ? 'المدينة، الحي، الشارع، رقم البناية...' : 'City, District, Street...'} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white" />
              </div>
            )}
          </div>

          {/* Step 3: Customs & Guarantees */}
          <div className={`${intlWizardStep === 3 ? 'block' : 'hidden'} md:block space-y-4 pt-2`}>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              {isAr ? 'الخطوة 3: سياسة الجمارك والضمانات' : 'Step 3: Customs & Guarantees'}
            </h4>
            
            <div className="flex items-start gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <input type="checkbox" id="intlCustomsCheck" required checked={intlCustomsAgreed} onChange={e => setIntlCustomsAgreed(e.target.checked)} className="mt-1 w-5 h-5 accent-brand-500 cursor-pointer shrink-0" />
              <label htmlFor="intlCustomsCheck" className="text-sm text-slate-300 cursor-pointer leading-relaxed">
                <span className="font-bold text-amber-500">{isAr ? 'تنبيه جمركي إلزامي: ' : 'Mandatory Customs Notice: '}</span>
                {isAr ? 'أقر بعلمي أن الرسوم الجمركية ورسوم التوصيل الداخلي (إن وجدت) غير مشمولة في السعر التقريبي أدناه، وتُضاف للمبلغ المتبقي بعد وصول الشحنة بموجب وصل الجمارك الرسمي.' : 'I acknowledge that customs and local delivery fees are not included in the estimated price below, and will be added to the remaining balance upon arrival with an official receipt.'}
              </label>
            </div>

            <div className="flex items-center gap-3 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-xs font-bold text-emerald-300 leading-snug">
                {isAr ? 'وسم الأمان المالي: يُسترد المبلغ (العربون) بالكامل فوراً لمحفظتك في حال عدم توفر المنتج لدى البائع، دون أي خصومات.' : 'Financial Security: Deposit is fully refunded to your wallet instantly if the item is unavailable from the seller.'}
              </p>
            </div>
          </div>

          {/* Step 4: Checkout (50% Deposit) */}
          <div className={`${intlWizardStep === 4 ? 'block' : 'hidden'} md:block bg-slate-950 border border-slate-800 rounded-2xl p-4 md:p-5 overflow-hidden relative mt-6`}>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 border-b border-slate-800 pb-3 gap-3">
              <h4 className="text-lg font-black text-white">{isAr ? 'الخطوة 4: الملخص المالي والدفع' : 'Step 4: Financial Summary & Payment'}</h4>
              <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 w-fit">
                <button type="button" onClick={() => setPaymentCurrency('SENDER')} className={`px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-md transition-all ${paymentCurrency === 'SENDER' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                  {isAr ? 'الدفع بعملة المرسل (JOD)' : 'Sender Currency (JOD)'}
                </button>
                <button type="button" onClick={() => setPaymentCurrency('RECIPIENT')} className={`px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-md transition-all ${paymentCurrency === 'RECIPIENT' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                  {isAr ? 'عملة المستلم (DZD)' : 'Recipient (DZD)'}
                </button>
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-slate-300 mb-6">
              <div className="flex justify-between">
                <span>{isAr ? 'إجمالي قيمة المنتجات التقريبي:' : 'Est. Items Total:'}</span>
                <span className="font-semibold">${storeItems.reduce((sum, item) => sum + (item.totalCost || 0), 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>{isAr ? 'رسوم التسوق ومعالجة الطلب (5%):' : 'Shopping & Processing Fee (5%):'}</span>
                <span className="font-semibold">${(storeItems.reduce((sum, item) => sum + (item.totalCost || 0), 0) * 0.05).toFixed(2)}</span>
              </div>
              {deliveryType === 'HOME' && (
                <div className="flex justify-between">
                  <span>{isAr ? 'رسوم التوصيل الداخلي التقريبية:' : 'Est. Local Delivery:'}</span>
                  <span className="font-semibold">$10.00</span>
                </div>
              )}
              
              <div className="bg-slate-900/80 rounded-xl p-3 md:p-4 border border-slate-800 mt-4">
                <div className="flex justify-between font-bold text-white text-sm md:text-base border-b border-slate-700 pb-3 mb-3">
                  <span>{isAr ? 'إجمالي الطلب التقريبي:' : 'Est. Total Order:'}</span>
                  <span className="text-slate-400 line-through text-xs md:text-sm flex items-center">
                    ${(storeItems.reduce((sum, item) => sum + (item.totalCost || 0), 0) * 1.05 + (deliveryType === 'HOME' ? 10 : 0)).toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center bg-brand-500/10 p-3 rounded-lg border border-brand-500/20 gap-2">
                  <span className="font-black text-brand-300 text-xs md:text-sm">{isAr ? 'المطلوب دفعه الآن (عربون 50% لتأكيد الطلب):' : 'Required Now (50% Deposit):'}</span>
                  <span className="text-lg md:text-xl font-black text-brand-400 flex items-center gap-2">
                    {paymentCurrency === 'RECIPIENT' ? (
                      <span>{(((storeItems.reduce((sum, item) => sum + (item.totalCost || 0), 0) * 1.05 + (deliveryType === 'HOME' ? 10 : 0)) / 2) * 135).toFixed(2)} DZD</span>
                    ) : (
                      <span>${(((storeItems.reduce((sum, item) => sum + (item.totalCost || 0), 0) * 1.05 + (deliveryType === 'HOME' ? 10 : 0)) / 2)).toFixed(2)} JOD</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] md:text-xs text-slate-400 mt-3 px-2">
                  <span>{isAr ? 'المتبقي عند الاستلام (50%):' : 'Remaining on Delivery (50%):'}</span>
                  <span>
                    {paymentCurrency === 'RECIPIENT' ? (
                      `${(((storeItems.reduce((sum, item) => sum + (item.totalCost || 0), 0) * 1.05 + (deliveryType === 'HOME' ? 10 : 0)) / 2) * 135).toFixed(2)} DZD + الجمرك`
                    ) : (
                      `$${(((storeItems.reduce((sum, item) => sum + (item.totalCost || 0), 0) * 1.05 + (deliveryType === 'HOME' ? 10 : 0)) / 2)).toFixed(2)} JOD + Customs`
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-300">{isAr ? 'اختر طريقة دفع العربون' : 'Select Deposit Payment Method'}</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div onClick={() => setSelectedPaymentGateway('CLIQ_JOR')} className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all ${selectedPaymentGateway === 'CLIQ_JOR' ? 'border-brand-500 bg-brand-500/10' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/e/e6/CliQ_logo.png" alt="CliQ" className="h-6 object-contain opacity-80" />
                  <span className="text-[10px] font-bold text-slate-300">{isAr ? 'كليك (الأردن)' : 'CliQ (JOR)'}</span>
                </div>
                <div onClick={() => setSelectedPaymentGateway('BANK_TRANSFER')} className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all ${selectedPaymentGateway === 'BANK_TRANSFER' ? 'border-brand-500 bg-brand-500/10' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}>
                  <Wallet className={`w-6 h-6 ${selectedPaymentGateway === 'BANK_TRANSFER' ? 'text-brand-400' : 'text-slate-500'}`} />
                  <span className="text-[10px] font-bold text-slate-300">{isAr ? 'تحويل بنكي' : 'Bank Transfer'}</span>
                </div>
                <div onClick={() => setSelectedPaymentGateway('ESCROW_WALLET')} className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all ${selectedPaymentGateway === 'ESCROW_WALLET' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}>
                  <ShieldCheck className={`w-6 h-6 ${selectedPaymentGateway === 'ESCROW_WALLET' ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="text-[10px] font-bold text-slate-300">{isAr ? 'محفظة الضمان' : 'Escrow Wallet'}</span>
                </div>
                <div onClick={() => setSelectedPaymentGateway('CASH_AT_HUB')} className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all ${selectedPaymentGateway === 'CASH_AT_HUB' ? 'border-brand-500 bg-brand-500/10' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}>
                  <DollarSign className={`w-6 h-6 ${selectedPaymentGateway === 'CASH_AT_HUB' ? 'text-brand-400' : 'text-slate-500'}`} />
                  <span className="text-[10px] font-bold text-slate-300">{isAr ? 'كاش في المكتب' : 'Cash at Hub'}</span>
                </div>
              </div>

              {selectedPaymentGateway === 'BANK_TRANSFER' && (
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl mt-3 space-y-3">
                  <div className="text-xs text-slate-300 space-y-1">
                    <p>{isAr ? 'الرجاء تحويل المبلغ إلى الحساب التالي:' : 'Please transfer the amount to the following account:'}</p>
                    <p className="font-mono text-brand-300 font-bold bg-slate-950 px-2 py-1 rounded inline-block mt-1">IBAN: JO98 ABAB 0000 0000 1234 56</p>
                    <p>{isAr ? 'البنك العربي - شركة ثويسة اللوجستية' : 'Arab Bank - THOUESA Logistics'}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">{isAr ? 'إرفاق إيصال التحويل' : 'Upload Transfer Receipt'}</label>
                    <div className="flex items-center gap-2">
                      <input type="file" accept="image/*,.pdf" className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation Buttons */}
          <div className="md:hidden flex items-center justify-between pt-4 mt-6 border-t border-slate-800">
             {intlWizardStep > 1 ? (
                <button type="button" onClick={() => setIntlWizardStep(intlWizardStep - 1)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold flex items-center gap-2">
                   <ChevronRight className="w-4 h-4" />
                   <span>{isAr ? 'السابق' : 'Back'}</span>
                </button>
             ) : <div />}
             
             {intlWizardStep < 4 ? (
                <button type="button" onClick={() => setIntlWizardStep(intlWizardStep + 1)} className="px-6 py-2.5 bg-brand-500 hover:bg-brand-400 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20">
                   <span>{isAr ? 'التالي' : 'Next'}</span>
                   <ChevronLeft className="w-4 h-4" />
                </button>
             ) : (
                <button type="submit" disabled={isSubmitting || !intlCustomsAgreed} className="flex-1 ml-4 flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-400 text-white font-black rounded-xl text-sm shadow-lg shadow-brand-500/30 disabled:opacity-50">
                   <CheckCircle2 className="w-5 h-5" />
                   <span>{isSubmitting ? (isAr ? 'جاري...' : 'Processing...') : (isAr ? 'تأكيد' : 'Confirm')}</span>
                </button>
             )}
          </div>

          {/* Desktop Navigation Button (Only Submit at bottom) */}
          <div className="hidden md:flex justify-end pt-4 mt-6 border-t border-slate-800">
            <button
              type="submit"
              disabled={isSubmitting || !intlCustomsAgreed}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-brand-500 hover:bg-brand-400 text-white font-black rounded-xl text-sm shadow-lg shadow-brand-500/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isSubmitting ? (isAr ? 'جاري الاعتماد...' : 'Processing...') : (isAr ? 'دفع العربون وتأكيد الطلب' : 'Pay Deposit & Confirm')}</span>
            </button>
          </div>

        </form>
      )}

{/* 4. OPTION 3 WIZARD: BUY FROM SPECIFIC COUNTRY & SHIP */}
      {activeTab === 'SPECIFIC_COUNTRY_BUY' && (
        <form onSubmit={handleCountryBuySubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-8 text-white shadow-xl max-w-4xl mx-auto space-y-4 md:space-y-8">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-emerald-400" />
              <span>{isAr ? 'الخيار الثالث: الشراء من متجر محلي' : 'Option 3: Buy from Local Store'}</span>
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {isAr ? 'نوفر لك أي منتج من المتاجر المحلية في الدول التي نعمل بها' : 'We buy any product from local markets in our operating countries'}
            </p>
          </div>

          {/* Mobile Progress Bar */}
          <div className="md:hidden mb-2">
            <div className="flex items-center justify-between mb-2 px-2">
               {[1, 2, 3, 4].map(step => (
                  <div key={step} className="flex flex-col items-center flex-1 relative">
                     <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 ${countryWizardStep === step ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/40 ring-2 ring-brand-500/20' : countryWizardStep > step ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                        {countryWizardStep > step ? <CheckCircle2 className="w-4 h-4" /> : step}
                     </div>
                  </div>
               ))}
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden flex mx-4">
               <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${((countryWizardStep - 1) / 3) * 100}%` }}></div>
            </div>
          </div>

          {/* Step 1: Source & Product Details */}
          <div className={`${countryWizardStep === 1 ? 'block' : 'hidden'} md:block space-y-4`}>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Store className="w-4 h-4 text-emerald-400" />
              {isAr ? 'الخطوة 1: بيانات المصدر وتفاصيل المنتج' : 'Step 1: Source & Product Details'}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'الدولة المراد الشراء منها' : 'Purchase Country'}</label>
                <select
                  value={targetCountry}
                  onChange={(e) => setTargetCountry(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:border-emerald-400 focus:outline-none"
                >
                  {uniqueCountries.map((c) => (
                    <option key={c.code} value={c.code}>{isAr ? c.nameAr : c.nameEn}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'اسم المتجر / المدينة' : 'Store Name / City'}</label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: سوق وسط البلد، عمان' : 'e.g. Local Market, Amman'}
                  value={localMarketName}
                  onChange={(e) => setLocalMarketName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'طريقة التواصل مع البائع (رابط حساب أو رقم هاتف)' : 'Seller Contact (Social URL or Phone)'}</label>
              <input
                type="text"
                required
                placeholder={isAr ? 'رابط صفحة الانستغرام، فيسبوك، أو رقم الواتساب' : 'Instagram, Facebook link or Phone'}
                value={localMarketContact}
                onChange={(e) => setLocalMarketContact(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
                dir="ltr"
              />
            </div>

            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 mt-4 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <label className="block text-xs font-bold text-emerald-300 border-b border-slate-800 pb-2 mb-3">{isAr ? 'تفاصيل المنتج' : 'Product Details'}</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[10px] text-slate-400 mb-1">{isAr ? 'وصف المنتج' : 'Product Description'}</label>
                  <textarea
                    required
                    rows={2}
                    value={countryBuyItems[0].name}
                    onChange={(e) => {
                      const newItems = [...countryBuyItems];
                      newItems[0].name = e.target.value;
                      setCountryBuyItems(newItems);
                    }}
                    placeholder={isAr ? 'ما هو المنتج الذي تريد شراءه بالتحديد؟' : 'What exactly do you want to buy?'}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white resize-none focus:outline-none focus:border-emerald-400"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-[10px] text-slate-400 mb-1">{isAr ? 'رابط المنتج (إن وجد)' : 'Product Link (Optional)'}</label>
                  <input
                    type="url"
                    value={countryProductUrl}
                    onChange={(e) => setCountryProductUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-400"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">{isAr ? 'مواصفات إضافية (اللون، المقاس...)' : 'Specs (Color, Size...)'}</label>
                  <input
                    type="text"
                    value={countryBuyItems[0].specsOrVariants || ''}
                    onChange={(e) => {
                      const newItems = [...countryBuyItems];
                      newItems[0].specsOrVariants = e.target.value;
                      setCountryBuyItems(newItems);
                    }}
                    placeholder={isAr ? 'مثال: أسود، XL' : 'e.g. Black, XL'}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-emerald-300 mb-1">{isAr ? 'السعر التقريبي للمنتج ($)' : 'Approximate Price ($)'}</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={countryBuyItems[0].unitPrice}
                    onChange={(e) => {
                      const newItems = [...countryBuyItems];
                      newItems[0].unitPrice = Number(e.target.value);
                      newItems[0].totalCost = newItems[0].unitPrice * newItems[0].quantity;
                      setCountryBuyItems(newItems);
                    }}
                    className="w-full px-3 py-2 bg-emerald-900/20 border border-emerald-500/50 rounded-lg text-sm font-bold text-emerald-400 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">{isAr ? 'إرفاق صورة للمنتج أو لقطة شاشة (أساسي)' : 'Attach Product Photo/Screenshot (Required)'}</label>
                <div className="border-2 border-dashed border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all">
                  <Camera className="w-6 h-6 text-slate-500 mb-2" />
                  <p className="text-xs md:text-sm font-bold text-slate-300">{isAr ? 'اضغط لرفع لقطة شاشة للمحادثة أو صورة للمنتج' : 'Upload screenshot of chat or product photo'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Delivery & Addresses */}
          <div className={`${countryWizardStep === 2 ? 'block' : 'hidden'} md:block space-y-4 pt-2`}>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              {isAr ? 'الخطوة 2: خيارات التوصيل والعناوين' : 'Step 2: Delivery & Address'}
            </h4>

            {/* Smart Address Book */}
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
              <label className="text-xs font-bold text-emerald-300 flex items-center gap-2 mb-3">
                <MapPinIcon className="w-4 h-4" />
                {isAr ? 'دفتر العناوين المحفوظة (المستلم)' : 'Saved Address Book (Recipient)'}
              </label>
              <select
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white mb-3 focus:outline-none focus:border-emerald-400"
                onChange={(e) => {
                  if (e.target.value === '1') {
                    setRecipientName('Ahmad Al-Saeed');
                    setRecipientPhone('+962 79 000 0000');
                    setRecipientAddress('Amman, 7th Circle');
                  } else if (e.target.value === '2') {
                    setRecipientName('Yassine Benali');
                    setRecipientPhone('+213 55 000 0000');
                    setRecipientAddress('Algiers, Hydra');
                  }
                }}
              >
                <option value="">{isAr ? '-- اختر مستلماً محفوظاً أو أدخل بيانات جديدة --' : '-- Choose a saved recipient --'}</option>
                <option value="1">Ahmad Al-Saeed (Amman, Jordan)</option>
                <option value="2">Yassine Benali (Algiers, Algeria)</option>
              </select>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" required placeholder={isAr ? 'اسم المستلم' : 'Recipient Name'} value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-400" />
                <input type="tel" required placeholder={isAr ? 'رقم هاتف المستلم' : 'Recipient Phone'} value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-left focus:outline-none focus:border-emerald-400" dir="ltr" />
              </div>
            </div>

            {/* Delivery Options */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 block">{isAr ? 'طريقة التسليم النهائية' : 'Final Delivery Method'}</label>
              <div className="flex bg-slate-800 p-1 rounded-xl">
                <button type="button" onClick={() => setDeliveryType('HOME')} className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${deliveryType === 'HOME' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                  {isAr ? 'توصيل لباب البيت' : 'Home Delivery'}
                </button>
                <button type="button" onClick={() => setDeliveryType('HUB')} className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${deliveryType === 'HUB' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
                  {isAr ? 'استلام من المكتب (مجاني)' : 'Hub Pickup (Free)'}
                </button>
              </div>
              
              {deliveryType === 'HOME' ? (
                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl animate-in slide-in-from-top-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'العنوان التفصيلي للتوصيل' : 'Detailed Delivery Address'}</label>
                  <textarea required rows={2} value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} placeholder={isAr ? 'المدينة، الحي، الشارع، رقم البناية...' : 'City, District, Street...'} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400" />
                </div>
              ) : (
                <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl animate-in slide-in-from-top-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'اختر مكتب الاستلام' : 'Choose Pickup Hub'}</label>
                  <select className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400">
                    <option value="ALG">{isAr ? 'الجزائر العاصمة (المكتب الرئيسي)' : 'Algiers (Main Hub)'}</option>
                    <option value="AMM">{isAr ? 'عمان (الدوار السابع)' : 'Amman (7th Circle)'}</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Customs & Protection */}
          <div className={`${countryWizardStep === 3 ? 'block' : 'hidden'} md:block space-y-4 pt-2`}>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {isAr ? 'الخطوة 3: سياسة الجمارك والضمانات' : 'Step 3: Customs & Guarantees'}
            </h4>
            
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <input type="checkbox" id="countryCustomsCheck" required className="mt-1 w-5 h-5 accent-emerald-500 cursor-pointer shrink-0" checked={countryCustomsAgreed} onChange={e => setCountryCustomsAgreed(e.target.checked)} />
                <label htmlFor="countryCustomsCheck" className="text-[11px] md:text-xs text-slate-300 cursor-pointer leading-relaxed">
                  <span className="font-bold text-white">{isAr ? 'تنبيه جمركي إلزامي: ' : 'Mandatory Customs Notice: '}</span>
                  {isAr ? 'الرسوم الجمركية غير مشمولة في السعر التقريبي، وتُضاف للمبلغ المتبقي بعد وصول الشحنة بموجب وصل الجمارك الرسمي.' : 'Customs duties are not included in the estimated price and will be added to the remaining balance upon arrival via official receipt.'}
                </label>
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 animate-shimmer"></div>
                <ShieldCheck className="w-8 h-8 text-emerald-400 mb-2" />
                <p className="text-xs md:text-sm font-black text-emerald-300">
                  {isAr ? 'يُسترد المبلغ فوراً لمحفظتك في حال عدم توفر المنتج لدى البائع' : 'Deposit instantly refunded to wallet if product is unavailable'}
                </p>
              </div>
            </div>
          </div>

          {/* Step 4: Checkout & Payment (50% Deposit) */}
          <div className={`${countryWizardStep === 4 ? 'block' : 'hidden'} md:block bg-slate-950 border border-slate-800 rounded-2xl p-4 md:p-5 overflow-hidden relative mt-6`}>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 border-b border-slate-800 pb-3 gap-3">
              <h4 className="text-lg font-black text-white">{isAr ? 'الخطوة 4: الملخص المالي (عربون 50%)' : 'Step 4: Financial Summary (50% Deposit)'}</h4>
              <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700 w-fit">
                <button type="button" onClick={() => setPaymentCurrency('SENDER')} className={`px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-md transition-all ${paymentCurrency === 'SENDER' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                  {isAr ? 'عملة المرسل (JOD)' : 'Sender (JOD)'}
                </button>
                <button type="button" onClick={() => setPaymentCurrency('RECIPIENT')} className={`px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-md transition-all ${paymentCurrency === 'RECIPIENT' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>
                  {isAr ? 'عملة المستلم (DZD)' : 'Recipient (DZD)'}
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-slate-300 mb-6 px-1">
              <div className="flex justify-between">
                <span>{isAr ? 'السعر التقريبي للمنتج' : 'Estimated Item Price'}</span>
                <span className="font-semibold">${countryBuyItems[0].totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>{isAr ? 'أجور الشحن التقريبية' : 'Estimated Shipping'}</span>
                <span className="font-semibold">${(15.0).toFixed(2)}</span>
              </div>
              {deliveryType === 'HOME' && (
                <div className="flex justify-between text-emerald-400">
                  <span>{isAr ? 'رسوم التوصيل الداخلي' : 'Local Delivery Fee'}</span>
                  <span className="font-semibold">$10.00</span>
                </div>
              )}
              
              <div className="pt-3 mt-3 border-t border-slate-800 flex justify-between text-slate-400 text-xs font-semibold">
                <span>{isAr ? 'الإجمالي التقريبي' : 'Total Estimated Cost'}</span>
                <span>${(countryBuyItems[0].totalCost + 15 + (deliveryType === 'HOME' ? 10 : 0)).toFixed(2)}</span>
              </div>
              
              <div className="flex flex-col gap-2 pt-4 mt-2 bg-slate-900/80 p-3 md:p-4 rounded-xl border border-slate-700 shadow-inner">
                <div className="flex justify-between font-bold text-white items-center">
                  <span className="text-sm md:text-base">{isAr ? 'المطلوب دفعه الآن (عربون 50%):' : 'Deposit to Pay Now (50%):'}</span>
                  <span className="text-xl md:text-2xl font-black text-emerald-400">
                    {paymentCurrency === 'RECIPIENT' ? (
                      <span>{(((countryBuyItems[0].totalCost + 15 + (deliveryType === 'HOME' ? 10 : 0)) * 0.5) * 135).toFixed(2)} DZD</span>
                    ) : (
                      <span>${((countryBuyItems[0].totalCost + 15 + (deliveryType === 'HOME' ? 10 : 0)) * 0.5).toFixed(2)} JOD</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-slate-400 items-center border-t border-slate-800/50 pt-2 mt-1">
                  <span className="text-xs">{isAr ? 'المتبقي عند الاستلام (50% + جمرك):' : 'Remaining on Delivery (50% + Customs):'}</span>
                  <span className="text-sm text-slate-300">
                    {paymentCurrency === 'RECIPIENT' ? (
                      <span>{(((countryBuyItems[0].totalCost + 15 + (deliveryType === 'HOME' ? 10 : 0)) * 0.5) * 135).toFixed(2)} DZD</span>
                    ) : (
                      <span>${((countryBuyItems[0].totalCost + 15 + (deliveryType === 'HOME' ? 10 : 0)) * 0.5).toFixed(2)} JOD</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-300">{isAr ? 'اختر طريقة الدفع للعربون' : 'Select Deposit Payment Method'}</label>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div onClick={() => setSelectedPaymentGateway('CLIQ_JOR')} className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all ${selectedPaymentGateway === 'CLIQ_JOR' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/e/e6/CliQ_logo.png" alt="CliQ" className="h-6 object-contain opacity-80" />
                  <span className="text-[10px] font-bold text-slate-300">{isAr ? 'كليك (الأردن)' : 'CliQ (JOR)'}</span>
                </div>
                <div onClick={() => setSelectedPaymentGateway('BANK_TRANSFER')} className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all ${selectedPaymentGateway === 'BANK_TRANSFER' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}>
                  <Wallet className={`w-6 h-6 ${selectedPaymentGateway === 'BANK_TRANSFER' ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="text-[10px] font-bold text-slate-300">{isAr ? 'تحويل بنكي' : 'Bank Transfer'}</span>
                </div>
                <div onClick={() => setSelectedPaymentGateway('ESCROW_WALLET')} className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all ${selectedPaymentGateway === 'ESCROW_WALLET' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}>
                  <ShieldCheck className={`w-6 h-6 ${selectedPaymentGateway === 'ESCROW_WALLET' ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="text-[10px] font-bold text-slate-300">{isAr ? 'محفظة الضمان' : 'Escrow Wallet'}</span>
                </div>
                <div onClick={() => setSelectedPaymentGateway('CASH_AT_HUB')} className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all ${selectedPaymentGateway === 'CASH_AT_HUB' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}>
                  <DollarSign className={`w-6 h-6 ${selectedPaymentGateway === 'CASH_AT_HUB' ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="text-[10px] font-bold text-slate-300">{isAr ? 'كاش في المكتب' : 'Cash at Hub'}</span>
                </div>
              </div>

              {selectedPaymentGateway === 'BANK_TRANSFER' && (
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl mt-3 space-y-3 animate-in slide-in-from-top-1">
                  <div className="text-xs text-slate-300 space-y-1">
                    <p>{isAr ? 'الرجاء تحويل مبلغ العربون إلى الحساب التالي:' : 'Please transfer the deposit amount to the following account:'}</p>
                    <p className="font-mono text-emerald-300 font-bold bg-slate-950 px-2 py-1 rounded inline-block mt-1 border border-emerald-500/20">IBAN: JO98 ABAB 0000 0000 1234 56</p>
                    <p>{isAr ? 'البنك العربي - شركة ثويسة اللوجستية' : 'Arab Bank - THOUESA Logistics'}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <label className="block text-[10px] md:text-xs font-bold text-slate-400 mb-1">{isAr ? 'إرفاق إيصال التحويل (ضروري لتأكيد الطلب)' : 'Upload Transfer Receipt (Required)'}</label>
                    <div className="flex items-center gap-2">
                      <input type="file" accept="image/*,.pdf" className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation Buttons */}
          <div className="md:hidden flex items-center justify-between pt-4 mt-6 border-t border-slate-800">
             {countryWizardStep > 1 ? (
                <button type="button" onClick={() => setCountryWizardStep(countryWizardStep - 1)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold flex items-center gap-2">
                   <ChevronRight className="w-4 h-4" />
                   <span>{isAr ? 'السابق' : 'Back'}</span>
                </button>
             ) : <div />}
             
             {countryWizardStep < 4 ? (
                <button type="button" onClick={() => setCountryWizardStep(countryWizardStep + 1)} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                   <span>{isAr ? 'التالي' : 'Next'}</span>
                   <ChevronLeft className="w-4 h-4" />
                </button>
             ) : (
                <button type="submit" disabled={isSubmitting || !countryCustomsAgreed} className="flex-1 ml-4 flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-sm shadow-lg shadow-emerald-500/30 disabled:opacity-50 transition-all">
                   <CheckCircle2 className="w-5 h-5" />
                   <span>{isSubmitting ? (isAr ? 'جاري...' : 'Processing...') : (isAr ? 'دفع العربون وتأكيد' : 'Pay Deposit & Confirm')}</span>
                </button>
             )}
          </div>

          {/* Desktop Navigation Button (Only Submit at bottom) */}
          <div className="hidden md:flex justify-end pt-4 mt-6 border-t border-slate-800">
            <button
              type="submit"
              disabled={isSubmitting || !countryCustomsAgreed}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-sm shadow-lg shadow-emerald-500/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{isSubmitting ? (isAr ? 'جاري الاعتماد...' : 'Processing...') : (isAr ? 'دفع العربون وتأكيد الطلب' : 'Pay Deposit & Confirm')}</span>
            </button>
          </div>
        </form>
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
                              #{s.trackingNumber.split('-').slice(-2).join('-') || s.trackingNumber}
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
