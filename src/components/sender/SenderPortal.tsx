import { UserProfile } from '../profile/UserProfile';
import { SenderOverview } from './SenderOverview';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  X,
  Box,
  Package,
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
} from 'lucide-react';
import { EscrowWallet, Hub, ItemCategory, ItemCondition, Locale, OrderItem, ServiceType, Shipment, User } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { WaybillModal } from '../common/WaybillModal';
import { AgentChatModal } from '../common/AgentChatModal';
import { WalletDashboard } from '../wallet/WalletDashboard';
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

  const [selectedServiceFilter, setSelectedServiceFilter] = useState<ServiceType | 'ALL'>('ALL');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(shipments[0] || null);
  const [waybillModalShipment, setWaybillModalShipment] = useState<Shipment | null>(null);
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
  const [selectedPaymentGateway, setSelectedPaymentGateway] = useState<'CLIQ_JOR' | 'EDAHABIA_DZA' | 'CIB_DZA' | 'ESCROW_WALLET' | 'STRIPE_CARD' | 'CASH_AT_HUB'>('CLIQ_JOR');

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
  const [selectedTripId, setSelectedTripId] = useState('trip-1');
  const [packagingRequested, setPackagingRequested] = useState(false);
  const [parcelLengthCm, setParcelLengthCm] = useState(25);
  const [parcelWidthCm, setParcelWidthCm] = useState(20);
  const [parcelHeightCm, setParcelHeightCm] = useState(8);
  const [prohibitedAgreed, setProhibitedAgreed] = useState(false);

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

  // Filter sender's shipments
  const senderShipments = shipments
    .filter((s) => s.senderId === currentUser.id || s.recipientPhone === currentUser.phone)
    .filter((s) => selectedServiceFilter === 'ALL' || (s.serviceType || 'SEND_PARCEL') === selectedServiceFilter);

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
        <WalletDashboard currentUser={currentUser} wallet={wallet} locale={locale} />
      )}

      {activeTab === 'PROFILE' && (
        <UserProfile currentUser={currentUser} locale={locale} isAr={isAr} />
      )}

      {activeTab === 'DISPUTES' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-white shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">
                  {isAr ? 'النزاعات والشكاوى الرسمية' : 'Disputes & Official Claims'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isAr ? 'قم بتقديم شكوى أو متابعة الشكاوى السابقة وتجميد الضمان المالي للمسافر' : 'File a new complaint or track existing claims to freeze traveler escrow'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Orders List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>{isAr ? 'الشحنات المؤهلة' : 'Eligible Shipments'}</span>
              </div>
              {senderShipments.filter(s => ['DELIVERED_TO_HUB', 'DELIVERED_TO_RECIPIENT', 'DISPUTED', 'IN_TRANSIT', 'WEIGHT_DISCREPANCY_PENDING', 'PENDING_PAYMENT'].includes(s?.currentStatus)).length === 0 ? (
                <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400 text-xs">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>{isAr ? 'لا توجد شحنات مؤهلة لفتح نزاع في الوقت الحالي' : 'No eligible shipments to dispute right now'}</p>
                </div>
              ) : (
                senderShipments.filter(s => ['DELIVERED_TO_HUB', 'DELIVERED_TO_RECIPIENT', 'DISPUTED', 'IN_TRANSIT', 'WEIGHT_DISCREPANCY_PENDING', 'PENDING_PAYMENT'].includes(s?.currentStatus)).map(s => {
                  const isSelected = selectedShipment?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedShipment(s)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-red-950/40 border-red-500/50 ring-2 ring-red-500/20 shadow-lg'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-xs text-slate-200">{s.trackingNumber}</span>
                        <StatusBadge status={s?.currentStatus} locale={locale} size="sm" />
                      </div>
                      <p className="text-xs font-semibold text-slate-400 truncate mb-2">{s.itemDescription}</p>
                      
                      {s?.currentStatus === 'DISPUTED' ? (
                        <div className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{isAr ? 'يوجد نزاع مفتوح' : 'Open Dispute'}</span>
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          <span>{isAr ? 'مؤهل لفتح نزاع' : 'Eligible for dispute'}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Right: Dispute Form */}
            <div className="lg:col-span-2 space-y-4">
              {selectedShipment ? (
                <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-white shadow-xl space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white">
                          {isAr ? 'نموذج النزاع والشكوى' : 'Dispute & Claim Form'}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {isAr ? `الشحنة المحددة: ${selectedShipment.trackingNumber}` : `Selected Shipment: ${selectedShipment.trackingNumber}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Weight Discrepancy Action Banner */}
                  {(selectedShipment.currentStatus === 'WEIGHT_DISCREPANCY_PENDING' ||
                    selectedShipment.currentStatus === 'WEIGHT_ADJUSTMENT_PENDING') &&
                    selectedShipment.weightDiscrepancy && (
                    <div className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-xs space-y-3 text-amber-200 animate-pulse">
                      <div className="flex items-center gap-2 font-bold text-amber-300">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{isAr ? 'تنبيه: فرق وزن بالميزان المعتمد في الفرع (بانتظار موافقتك)' : 'Scale Discrepancy Alert (Approval Pending)'}</span>
                      </div>
                      <p className="leading-relaxed text-slate-300">
                        {isAr
                          ? `تم وزن الطرد عند الاستلام في الفرع وتبين أن الوزن الفعلي (${selectedShipment.weightDiscrepancy.actualKg} كغم) يتجاوز الوزن المصرح به مبدئياً (${selectedShipment.weightDiscrepancy.originalKg} كغم). فرق تكلفة الشحن الإضافي هو: ${selectedShipment.weightDiscrepancy.priceDelta} USD.`
                          : `Actual certified weight is ${selectedShipment.weightDiscrepancy.actualKg} kg vs declared ${selectedShipment.weightDiscrepancy.originalKg} kg. Additional shipping charge: ${selectedShipment.weightDiscrepancy.priceDelta} USD.`}
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => onApproveWeightDiscrepancy(selectedShipment.id, 'APPROVE')}
                          className="px-4 py-2 bg-teal-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-teal-600/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isAr ? `موافقة وسداد الفرق (${selectedShipment.weightDiscrepancy.priceDelta})` : 'Approve & Pay Difference'}</span>
                        </button>
                        <button
                          onClick={() => onApproveWeightDiscrepancy(selectedShipment.id, 'REJECT')}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          {isAr ? 'رفض واسترجاع الطرد للفرع' : 'Reject & Return Package'}
                        </button>
                      </div>
                    </div>
                  )}
                  <form onSubmit={handleInlineDisputeSubmit} className="space-y-5">
                    {disputeError && (
                      <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{disputeError}</span>
                      </div>
                    )}

                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold text-amber-300">
                        <Lock className="w-4 h-4" />
                        <span>{isAr ? 'حماية التحكيم المالي المشدد (Escrow Guarantee):' : 'Escrow Arbitration Protection:'}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11px]">
                        {isAr
                          ? 'بمجرد تسجيل هذا النزاع، يتم تجميد أموال الضمان المالي المحجوزة للمسافر فوراً وعدم صرفها، ويتم إحالة الملف إلى ضابط الامتثال بالإدارة المركزية لمراجعة صور الفحص والختم الأمني واتخاذ القرار النهائي.'
                          : 'Filing this dispute immediately freezes the traveler security deposit (escrow) and routes the case to central compliance for evidence audit and financial resolution.'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">
                        {isAr ? 'سبب النزاع والمطالبة:' : 'Dispute Reason:'}
                      </label>
                      <select
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value as any)}
                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-red-400"
                      >
                        <option value="DAMAGED_ITEM">
                          {isAr ? 'تلف أو كسر في محتويات الطرد (Damaged Item)' : 'Damaged / Broken Goods'}
                        </option>
                        <option value="TAMPERED_SEAL">
                          {isAr ? 'عبث بالختم الأمني الإلكتروني أو فتح غير مصرح (Tampered Security Seal)' : 'Tampered Security Seal'}
                        </option>
                        <option value="MISSING_PACKAGE">
                          {isAr ? 'فقدان الطرد أو نقص في المحتويات المسلمة (Missing Package / Loss)' : 'Missing Package / Loss'}
                        </option>
                        <option value="FLIGHT_DELAY_EXTREME">
                          {isAr ? 'تأخر مفرط وإخلال بالموعد الزمني المحدد (Severe Delivery Delay)' : 'Severe Delivery Delay'}
                        </option>
                        <option value="PROHIBITED_GOODS_DISCOVERED">
                          {isAr ? 'اكتشاف مواد مخالفة أو غير مصرح بها (Prohibited Goods Issue)' : 'Prohibited Goods Discovered'}
                        </option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-300">
                          {isAr ? 'مبلغ التعويض المالي المطلوب ($ USD):' : 'Claim Compensation Amount ($ USD):'}
                        </label>
                        <span className="text-[11px] text-slate-400">
                          {isAr ? `القيمة المصرحة للطرد: $${selectedShipment.declaredValue}` : `Declared Value: $${selectedShipment.declaredValue}`}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          step="0.5"
                          required
                          value={disputeClaimAmount || selectedShipment.declaredValue}
                          onChange={(e) => setDisputeClaimAmount(Number(e.target.value))}
                          className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono font-bold focus:outline-hidden focus:border-red-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        {isAr ? 'شرح الشكوى والملاحظات التفصيلية للجنة التحكيم:' : 'Detailed Complaint Statement & Notes:'}
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={disputeDescription}
                        onChange={(e) => setDisputeDescription(e.target.value)}
                        placeholder={
                          isAr
                            ? 'يرجى توضيح حالة الطرد عند الاستلام، رقم الختم، وأي أضرار أو تفاصيل تدعم الشكوى...'
                            : 'Describe package condition at intake/handover, seal state, or any evidence...'
                        }
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-red-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-red-400" />
                        <span>{isAr ? 'صورة إثبات الضرر أو التلف (رابط الصورة):' : 'Evidence Photo URL:'}</span>
                      </label>
                      <input
                        type="url"
                        value={disputePhotoUrl}
                        onChange={(e) => setDisputePhotoUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-hidden focus:border-red-400"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                      <button
                        type="submit"
                        disabled={disputeSubmitting}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-600/30 transition-colors cursor-pointer disabled:opacity-50 w-full justify-center sm:w-auto"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        <span>{disputeSubmitting ? (isAr ? 'جاري التسجيل...' : 'Submitting...') : (isAr ? 'تأكيد تسجيل النزاع وتجميد الضمان' : 'Confirm Dispute & Lock Escrow')}</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-3xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
                  <ShieldAlert className="w-12 h-12 text-slate-600 mb-4" />
                  <h3 className="text-sm font-bold text-slate-300 mb-1">
                    {isAr ? 'لم يتم تحديد شحنة' : 'No Shipment Selected'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    {isAr ? 'الرجاء اختيار شحنة من القائمة الجانبية لعرض تفاصيلها وتقديم شكوى أو متابعة النزاع الخاص بها.' : 'Please select a shipment from the list to view its details and file a complaint.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

          {activeTab === 'SEND_PARCEL' && (
        <form onSubmit={handleSendParcelSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-xl max-w-4xl mx-auto space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Box className="w-5 h-5 text-brand-300" />
              <span>{isAr ? 'الخيار الأول: نموذج إرسال طرد شخصي وأمانات' : 'Option 1: Send Personal Parcel'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isAr ? 'حدد مسار الشحن ومواصفات الطرد ومعلومات المستلم' : 'Specify route, dimensions, declared value, and recipient'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'مركز الانطلاق (لتسليم الطرد)' : 'Origin Hub'}</label>
              <select
                value={originHubId}
                onChange={(e) => setOriginHubId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-brand-400"
              >
                {activeHubs.map((h) => (
                  <option key={h.id} value={h.id}>
                    {isAr ? h.nameAr : h.nameEn} ({h.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'مركز الاستلام في دولة الوجهة' : 'Destination Hub'}</label>
              <select
                value={destHubId}
                onChange={(e) => setDestHubId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-brand-400"
              >
                {activeHubs.map((h) => (
                  <option key={h.id} value={h.id}>
                    {isAr ? h.nameAr : h.nameEn} ({h.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50 mb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-brand-300 flex items-center gap-2">
                <MapPinIcon className="w-4 h-4" />
                {isAr ? 'دفتر العناوين المحفوظة' : 'Saved Address Book'}
              </label>
            </div>
            <select
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              onChange={(e) => {
                if (e.target.value === '1') {
                  setRecipientName('Ahmad Al-Saeed');
                  setRecipientPhone('+962790000000');
                  setRecipientAddress('Amman, Mecca St, Building 12');
                } else if (e.target.value === '2') {
                  setRecipientName('Fatima Zahra');
                  setRecipientPhone('+213550000000');
                  setRecipientAddress('Algiers, Didouche Mourad St, Appt 5');
                }
              }}
            >
              <option value="">{isAr ? '-- اختر من العناوين المحفوظة (اختياري) --' : '-- Select saved address (Optional) --'}</option>
              <option value="1">Ahmad Al-Saeed - Amman, JO</option>
              <option value="2">Fatima Zahra - Algiers, DZ</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'اسم المستلم الثلاثي' : 'Recipient Name'}</label>
              <input
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'هاتف المستلم' : 'Recipient Phone'}</label>
              <input
                type="text"
                required
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'عنوان المستلم بالتفصيل للتسليم النهائي' : 'Detailed Recipient Address'}</label>
            <input
              type="text"
              required
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'تصنيف المحتوى' : 'Item Category'}</label>
              <select
                value={parcelCategory}
                onChange={(e) => setParcelCategory(e.target.value as ItemCategory)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="ELECTRONICS">{isAr ? 'بضاعة' : 'Goods'}</option>
                <option value="DOCUMENTS">{isAr ? 'أمانات' : 'Personal Items / Trusts'}</option>
                <option value="GIFTS_COSMETICS">{isAr ? 'بضاعة جديدة' : 'New Goods'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isAr ? 'غرض الشحنة / طبيعة الاستخدام' : 'Shipment Purpose'}
              </label>
              <select
                value={parcelPurpose}
                onChange={(e) => setParcelPurpose(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="استخدام شخصي / هدية عائلية">{isAr ? 'استخدام شخصي / هدية عائلية' : 'Personal Use / Family Gift'}</option>
                <option value="شراء متجر دولي (تجارة شخصية)">{isAr ? 'شراء متجر دولي (تجارة شخصية)' : 'International Purchase'}</option>
                <option value="مستندات وأوراق دراسية أو قانونية">{isAr ? 'مستندات وأوراق دراسية أو قانونية' : 'Academic / Legal Documents'}</option>
                <option value="مستلزمات عمل ومعدات تقنية">{isAr ? 'مستلزمات عمل ومعدات تقنية' : 'Work / Tech Equipment'}</option>
                <option value="علاج ومستلزمات رعاية صحية">{isAr ? 'علاج ومستلزمات رعاية صحية' : 'Healthcare / Medical'}</option>
              </select>
            </div>
          </div>

          {/* Trip Selection & Warning */}
          <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-2xl space-y-3">
             <div className="flex items-center gap-2 text-amber-400 font-bold mb-2">
                <Plane className="w-5 h-5" />
                <span>{isAr ? 'اختيار الرحلة المتاحة للتوصيل' : 'Select Available Delivery Trip'}</span>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'الرحلة المقررة' : 'Scheduled Trip'}</label>
                    <select value={selectedTripId} onChange={(e) => setSelectedTripId(e.target.value)} className="w-full px-3 py-2.5 bg-slate-800 border border-amber-500/50 rounded-xl text-xs text-white">
                        <option>{isAr ? 'رحلة 15 أكتوبر - متاح 20 كغ' : 'Oct 15 Trip - 20kg Remaining'}</option>
                        <option>{isAr ? 'رحلة 20 أكتوبر - متاح 5 كغ' : 'Oct 20 Trip - 5kg Remaining'}</option>
                    </select>
                 </div>
                 <div className="flex flex-col justify-center">
                    <p className="text-xs text-amber-200 font-bold bg-amber-500/20 p-2 rounded-lg border border-amber-500/30 text-center">
                       ⚠️ {isAr ? 'تنبيه إلزامي: يجب تسليم الطلب للمكتب قبل 3 أيام من تاريخ الرحلة' : 'Mandatory Alert: Deliver to hub 3 days prior to trip date!'}
                    </p>
                    <p className="text-[10px] text-slate-400 text-center mt-2">
                       {isAr ? 'تاريخ التسليم المتوقع: بعد 3 أيام عمل من تاريخ الرحلة' : 'Expected Delivery: 3 business days after trip'}
                    </p>
                 </div>
             </div>
          </div>
          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
              <input
                type="checkbox"
                className="w-5 h-5 text-brand-500 rounded-md cursor-pointer"
                id="packagingCheckbox" checked={packagingRequested} onChange={(e) => setPackagingRequested(e.target.checked)}
              />
              <label htmlFor="packagingCheckbox" className="text-xs font-semibold text-slate-300 cursor-pointer">
                {isAr ? 'تغليف آمن ومحكم (رسوم إضافية)' : 'Secure Packaging (Extra Fee)'}
              </label>
            </div>
          </div>
          {/* Live Quote Breakdown Card */}
          <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-brand-400" />
                <span>{isAr ? 'تفصيل التكلفة والرسوم الجمركية للشحنة:' : 'Shipping Cost & Customs Breakdown:'}</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {isAr ? `الوزن الحجمي / الفعلي: ${liveParcelQuote.chargeableWeightKg} كغ` : `Chargeable Weight: ${liveParcelQuote.chargeableWeightKg} kg`}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">{isAr ? 'تكلفة الشحن الأساسية' : 'Base Freight'}</span>
                <span className="font-bold text-white text-sm">${liveParcelQuote.baseCostUsd}</span>
              </div>
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">{isAr ? 'رسوم التأمين والحماية' : 'Insurance Fee'}</span>
                <span className="font-bold text-white text-sm">${liveParcelQuote.insuranceUsd}</span>
              </div>

              <div className="bg-brand-950/60 p-2.5 rounded-xl border border-brand-500/50">
                <span className="text-brand-300 text-[11px] block font-bold">{isAr ? 'الإجمالي المطلوب' : 'Total Amount'}</span>
                <span className="font-black text-brand-300 text-base">${liveParcelQuote.totalCostUsd}</span>
              </div>
            </div>
          </div>

          {/* Local Payment Gateway & Currency Exchange Freeze */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'بوابة الدفع المحلية وتثبيت سعر الصرف:' : 'Local Payment Gateway & Locked FX:'}</span>
              </label>
              <span className="text-[11px] text-emerald-400 font-mono font-bold">
                {originHubId === 'hub-amm' ? '1 USD = 0.709 JOD' : '1 USD = 220.00 DZD'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
              {selectedOriginHub?.countryCode === 'JOR' && ( <button
                type="button"
                onClick={() => setSelectedPaymentGateway('CLIQ_JOR')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  selectedPaymentGateway === 'CLIQ_JOR'
                    ? 'bg-brand-500/30 border-brand-400 text-white ring-1 ring-brand-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>🇯🇴 CliQ Jordan</span>
              </button> )}
              {selectedOriginHub?.countryCode === 'DZA' && ( <button
                type="button"
                onClick={() => setSelectedPaymentGateway('EDAHABIA_DZA')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  selectedPaymentGateway === 'EDAHABIA_DZA'
                    ? 'bg-amber-600/30 border-amber-500 text-white ring-1 ring-amber-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>🇩🇿 بريدي موب / الذهبية</span>
              </button> )}
              {selectedOriginHub?.countryCode === 'DZA' && ( <button
                type="button"
                onClick={() => setSelectedPaymentGateway('CIB_DZA')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  selectedPaymentGateway === 'CIB_DZA'
                    ? 'bg-teal-600/30 border-emerald-500 text-white ring-1 ring-emerald-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>🇩🇿 بطاقة CIB البنكية</span>
              </button> )}
              <button
                type="button"
                onClick={() => setSelectedPaymentGateway('ESCROW_WALLET')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  selectedPaymentGateway === 'ESCROW_WALLET'
                    ? 'bg-purple-600/30 border-purple-500 text-white ring-1 ring-purple-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>🛡️ محفظة الضمان</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPaymentGateway('CASH_AT_HUB')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  selectedPaymentGateway === 'CASH_AT_HUB'
                    ? 'bg-blue-600/30 border-blue-500 text-white ring-1 ring-blue-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>💵 {isAr ? 'نقداً في المستودع' : 'Cash at Hub'}</span>
              </button>
            </div>
          </div>

          {/* Safety & Legal Customs Declaration */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prohibitedAgreed}
                onChange={(e) => setProhibitedAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-brand-500 rounded-sm"
              />
              <span className="text-xs text-slate-300 leading-relaxed">
                {isAr
                  ? 'أقر وأتعهد بأن هذا الطرد خاضع للمعاينة والفحص المباشر في مركز الفرع قبل التغليف بالختم الأمني، وخالٍ تماماً من أي مواد ممنوعة أو خطرة.'
                  : 'I certify that this package is subject to certified physical hub screening and contains no hazardous or prohibited materials.'}
              </span>
            </label>
            <div className="flex items-center gap-3 pt-1 text-[11px] text-brand-300">
              <button
                type="button"
                onClick={() => {
                  setComplianceInitialTab('CUSTOMS');
                  setComplianceModalOpen(true);
                }}
                className="hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isAr ? 'الإقرار الجمركي المعتمد' : 'Customs Declaration'}</span>
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setComplianceInitialTab('PROHIBITED');
                  setComplianceModalOpen(true);
                }}
                className="hover:underline flex items-center gap-1 text-red-400 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{isAr ? 'المواد المحظورة دولياً' : 'Prohibited Items'}</span>
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setComplianceInitialTab('TERMS');
                  setComplianceModalOpen(true);
                }}
                className="hover:underline flex items-center gap-1 text-emerald-400 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isAr ? 'شروط الضمان المالي' : 'Escrow Terms'}</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('MY_SHIPMENTS')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-400 text-white font-bold rounded-xl text-xs shadow-lg shadow-brand-500/30 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? (isAr ? 'جاري الإنشاء...' : 'Creating...') : (isAr ? 'إنشاء وإصدار بوليصة الطرد' : 'Create & Issue Waybill')}</span>
            </button>
          </div>
        </form>
      )}

      {/* 3. OPTION 2 WIZARD: BUY FROM INTERNATIONAL STORES */}
      {activeTab === 'INTERNATIONAL_BUY' && (
        <form onSubmit={handleStoreBuySubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-xl max-w-4xl mx-auto space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-brand-400" />
              <span>{isAr ? 'الخيار الثاني: الشراء من المتاجر العالمية (Amazon, Apple, eBay...)' : 'Option 2: Buy from Global Stores'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isAr
                ? 'أدخل روابط المنتجات والمتاجر، وسيتولى فريقنا أو مسافر معتمد استلامها وشحنها لعنوانك'
                : 'Enter global store links, quantities, and item specifications'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'المتجر العالمي المصدر' : 'Global Store'}</label>
              <select
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="Amazon USA">Amazon (USA / Europe)</option>
                <option value="Apple Store">Apple Official Store</option>
                <option value="AliExpress">AliExpress Official</option>
                <option value="eBay Global">eBay Global</option>
                <option value="ASOS Fashion">ASOS / Zara / Shein</option>
                <option value="Other International Store">متجر عالمي آخر</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'مركز الاستلام والتوصيل' : 'Delivery Destination Hub'}</label>
              <select
                value={destHubId}
                onChange={(e) => setDestHubId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              >
                {activeHubs.map((h) => (
                  <option key={h.id} value={h.id}>
                    {isAr ? h.nameAr : h.nameEn} ({h.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Items Table / Form */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-brand-400 uppercase tracking-wide">
                {isAr ? 'المنتجات والكميات والأسعار المطلوبة:' : 'Requested Items, Quantities & Prices:'}
              </label>
              <button
                type="button"
                onClick={addStoreItem}
                className="flex items-center gap-1 text-xs font-bold text-brand-400 hover:text-brand-300 bg-brand-500/10 px-3 py-1 rounded-lg border border-brand-500/30 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة منتج آخر' : 'Add Item'}</span>
              </button>
            </div>

            {storeItems.map((item, idx) => (
              <div key={item.id} className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>{isAr ? `المنتج رقم ${idx + 1}` : `Item #${idx + 1}`}</span>
                  {storeItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStoreItem(idx)}
                      className="text-red-400 hover:text-red-300 text-[11px]"
                    >
                      {isAr ? 'حذف' : 'Remove'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      required
                      value={item.name}
                      onChange={(e) => updateStoreItem(idx, 'name', e.target.value)}
                      placeholder={isAr ? 'اسم المنتج بالتفصيل (مثل: سماعات Sony XM5)' : 'Item name / model'}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <input
                      type="url"
                      value={item.storeUrl || ''}
                      onChange={(e) => updateStoreItem(idx, 'storeUrl', e.target.value)}
                      placeholder={isAr ? 'رابط صفحة المنتج (URL)' : 'Product URL'}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">{isAr ? 'الكمية' : 'Qty'}</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateStoreItem(idx, 'quantity', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-center font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">{isAr ? 'سعر الوحدة ($)' : 'Unit Price ($)'}</label>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={item.unitPrice}
                      onChange={(e) => updateStoreItem(idx, 'unitPrice', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-center font-bold text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">{isAr ? 'الإجمالي ($)' : 'Total ($)'}</label>
                    <div className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-center font-black text-emerald-400">
                      ${(item.totalCost || 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="url"
                      value={item.imageUrl || ''}
                      onChange={(e) => updateStoreItem(idx, 'imageUrl', e.target.value)}
                      placeholder={isAr ? 'رابط صورة المنتج (اختياري)' : 'Product Image URL (Optional)'}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={item.sizeVolume || ''}
                      onChange={(e) => updateStoreItem(idx, 'sizeVolume', e.target.value)}
                      placeholder={isAr ? 'الحجم / الوزن التقديري (مثل: 2 كجم، صندوق صغير)' : 'Est. Size/Weight (e.g., 2kg, small box)'}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <textarea
                    rows={4}
                    value={item.specsOrVariants || ''}
                    onChange={(e) => updateStoreItem(idx, 'specsOrVariants', e.target.value)}
                    placeholder={isAr ? 'المقاس / اللون / الملاحظات الخاصة التفصيلية...' : 'Detailed Size, Color, Specs...'}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white resize-y"
                  />
                </div>
              </div>
            ))}

            {/* Pro-forma Invoice Breakdown */}
            <div className="p-5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex flex-col gap-3 text-xs">
              <h4 className="font-bold text-emerald-400 mb-2 border-b border-emerald-500/20 pb-2">
                {isAr ? 'الفاتورة التقديرية (Pro-forma Invoice)' : 'Pro-forma Invoice Breakdown'}
              </h4>
              <div className="flex items-center justify-between text-slate-300">
                <span>{isAr ? 'إجمالي قيمة المنتجات المقدرة:' : 'Est. Items Total Cost:'}</span>
                <span className="font-semibold">${countryBuyItems.reduce((sum, item) => sum + (item.totalCost || 0), 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>{isAr ? 'عمولة التسوق (5%):' : 'Shopper Fee (5%):'}</span>
                <span className="font-semibold">${(countryBuyItems.reduce((sum, item) => sum + (item.totalCost || 0), 0) * 0.05).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>{isAr ? 'رسوم الشحن التقديرية (مبدئي):' : 'Est. Shipping (Initial):'}</span>
                <span className="font-semibold">$15.00</span>
              </div>
              <div className="flex items-center justify-between text-emerald-200 pt-3 border-t border-emerald-500/20">
                <span className="font-bold">{isAr ? 'الإجمالي التقديري للتكلفة:' : 'Total Estimated Cost:'}</span>
                <span className="text-sm font-bold text-slate-300 line-through opacity-70">
                  ${(countryBuyItems.reduce((sum, item) => sum + (item.totalCost || 0), 0) * 1.05 + 15).toFixed(2)} USD
                </span>
              </div>
              <div className="flex items-center justify-between text-emerald-300 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 mt-1">
                <span className="font-black">{isAr ? 'عربون تأكيد الطلب المطلوب دفعه الآن (50%):' : 'Required Confirmation Deposit (50%):'}</span>
                <span className="text-lg font-black text-emerald-400">
                  ${((countryBuyItems.reduce((sum, item) => sum + (item.totalCost || 0), 0) * 1.05 + 15) / 2).toFixed(2)} USD
                </span>
              </div>
              <p className="text-[10px] text-emerald-400/70 mt-1">
                {isAr ? '*يتم دفع الـ 50% المتبقية وأي رسوم جمركية محتملة عند وصول واستلام الطلب.' : '*The remaining 50% and any potential customs duties are paid upon arrival and delivery.'}
              </p>
            </div>
          </div>
          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
              <input
                type="checkbox"
                className="w-5 h-5 text-emerald-500 rounded-md cursor-pointer"
                id="packagingCheckboxOpt3" checked={packagingRequested} onChange={(e) => setPackagingRequested(e.target.checked)}
              />
              <label htmlFor="packagingCheckboxOpt3" className="text-xs font-semibold text-slate-300 cursor-pointer">
                {isAr ? 'تغليف آمن ومحكم (رسوم إضافية)' : 'Secure Packaging (Extra Fee)'}
              </label>
            </div>
            <div>
              <select className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white">
                <option value="HUB">{isAr ? 'الاستلام من المكتب' : 'Hub Pickup'}</option>
                <option value="HOME">{isAr ? 'توصيل لباب البيت' : 'Home Delivery'}</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('MY_SHIPMENTS')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-teal-600/30 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? (isAr ? 'جاري الإرسال...' : 'Submitting...') : (isAr ? 'دفع العربون وتأكيد الطلب' : 'Pay Deposit & Confirm')}</span>
            </button>
          </div>
        </form>
      )}
      {/* 5. TAB: RECEIVED ORDERS & ACTIVE SHIPMENTS WITH ITEM DETAILS, QUANTITIES & PRICES */}
      {activeTab === 'MY_SHIPMENTS' && (
        <div className="space-y-6">
          {/* Service Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="text-slate-400 font-semibold me-2 hidden sm:inline">
                {isAr ? 'تصفية حسب نوع الخدمة:' : 'Filter by Service:'}
              </span>
              <button
                onClick={() => setSelectedServiceFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  selectedServiceFilter === 'ALL'
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isAr ? 'جميع الطلبات' : 'All Orders'} ({shipments.length})
              </button>
              <button
                onClick={() => setSelectedServiceFilter('SEND_PARCEL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  selectedServiceFilter === 'SEND_PARCEL'
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isAr ? 'الطرود الشخصية' : 'Personal Parcels'}
              </button>
              <button
                onClick={() => setSelectedServiceFilter('INTERNATIONAL_BUY')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  selectedServiceFilter === 'INTERNATIONAL_BUY'
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isAr ? 'المتاجر العالمية' : 'Global Stores'}
              </button>
              <button
                onClick={() => setSelectedServiceFilter('SPECIFIC_COUNTRY_BUY')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  selectedServiceFilter === 'SPECIFIC_COUNTRY_BUY'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isAr ? 'شراء من دولة محددة' : 'Country Sourced'}
              </button>
            </div>
          </div>

          {/* Orders Master-Detail View */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Orders List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span>{isAr ? 'الطلبات المسجلة' : 'Recorded Orders'}</span>
                <span>{senderShipments.length} {isAr ? 'طلب' : 'orders'}</span>
              </div>

              {senderShipments.length === 0 ? (
                <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400 text-xs">
                  <Box className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>{isAr ? 'لا توجد طلبات في هذا التصنيف حالياً' : 'No orders found in this category'}</p>
                </div>
              ) : (
                senderShipments.map((s) => {
                  const isSelected = selectedShipment?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedShipment(s)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-brand-950/60 border-brand-400 ring-2 ring-brand-400/20 shadow-lg'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-xs text-brand-300">{s.trackingNumber}</span>
                        <StatusBadge status={s?.currentStatus} locale={locale} size="sm" />
                      </div>

                      <div className="flex items-center gap-1.5 mb-1.5">
                        {s.serviceType === 'INTERNATIONAL_BUY' && (
                          <span className="px-2 py-0.5 rounded-md bg-brand-500/20 text-brand-400 border border-brand-500/30 text-[10px] font-bold">
                            {isAr ? 'متجر عالمي' : 'Global Store'}
                          </span>
                        )}
                        {s.serviceType === 'SPECIFIC_COUNTRY_BUY' && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            {isAr ? 'شراء محلي' : 'Country Buy'}
                          </span>
                        )}
                        {(!s.serviceType || s.serviceType === 'SEND_PARCEL') && (
                          <span className="px-2 py-0.5 rounded-md bg-brand-400/20 text-brand-300 border border-brand-400/30 text-[10px] font-bold">
                            {isAr ? 'طرد شخصي' : 'Parcel'}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-white truncate mb-2">{s.itemDescription}</p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                        <span>
                          {s.orderItems && s.orderItems.length > 0
                            ? `${s.orderItems.length} ${isAr ? 'أصناف' : 'items'}`
                            : `${s.actualWeightKg || s.estimatedWeightKg} kg`}
                        </span>
                        <span className="font-black text-emerald-400">
                          {formatCurrency(s.declaredValue || s.shippingCost, s.currency)}
                        </span>
                      </div>

                      {s?.currentStatus === 'WEIGHT_DISCREPANCY_PENDING' && (
                        <div className="mt-2 p-2 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-xl text-[10px] font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{isAr ? 'مطلوب الموافقة على فرق الوزن' : 'Weight difference approval needed'}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Right: Selected Order Detailed Information, Quantities & Prices */}
            <div className="lg:col-span-2 space-y-4">
              {selectedShipment ? (
                <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-white shadow-xl space-y-6">
                  {/* Order Top Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black font-mono text-white">{selectedShipment.trackingNumber}</h3>
                        <StatusBadge status={selectedShipment.currentStatus} locale={locale} size="sm" />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {isAr ? 'المستلم:' : 'Recipient:'} <strong className="text-slate-200">{selectedShipment.recipientName}</strong> ({selectedShipment.recipientPhone})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setWaybillModalShipment(selectedShipment)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-brand-300" />
                        <span>{isAr ? 'عرض البوليصة' : 'Waybill'}</span>
                      </button>
                      <button
                        onClick={() => setChatModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-500 hover:bg-brand-400 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{isAr ? 'محادثة الفرع' : 'Chat Hub'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Active Dispute Warning Banner */}
                  {selectedShipment.currentStatus === 'DISPUTED' && (
                    <div className="p-4 bg-red-950/60 border border-red-500/50 text-red-200 rounded-2xl text-xs space-y-2 animate-pulse">
                      <div className="flex items-center justify-between font-bold text-red-300">
                        <span className="flex items-center gap-2 text-sm">
                          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                          <span>{isAr ? 'شحنة متنازع عليها — الضمان المالي مجمد حالياً' : 'Active Dispute — Escrow Frozen'}</span>
                        </span>
                        <span className="px-2.5 py-0.5 bg-red-500/20 text-red-300 border border-red-500/40 rounded-full text-[10px] font-bold">
                          {isAr ? 'قيد التحكيم المركزي' : 'Under Arbitration'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
                        {isAr
                          ? 'تم تسجيل شكوى رسمية بشأن هذه الشحنة وتجميد مستحقات المسافر في حساب الضمان المشفر (Escrow). يقوم فريق التحكيم المركزي بمراجعة الأدلة وصور المعاينة لحل النزاع أو استرداد الأموال.'
                          : 'A dispute claim has been filed for this shipment. The traveler payout is safely frozen in escrow. The admin arbitration team is currently investigating.'}
                      </p>
                    </div>
                  )}

                  {/* Visual Tracking Timeline (DHL/Aramex Stepper) */}
                  <TrackingTimeline
                    shipment={selectedShipment}
                    locale={locale}
                    onOpenWaybill={(s) => setWaybillModalShipment(s)}
                  />

                  {/* ITEM DETAILS, QUANTITIES, AND PRICES TABLE */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-brand-300" />
                        <span>{isAr ? 'تفاصيل المنتجات والكميات والأسعار المسجلة:' : 'Order Items, Quantities & Prices Breakdown:'}</span>
                      </h4>
                    </div>

                    {selectedShipment.orderItems && selectedShipment.orderItems.length > 0 ? (
                      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
                        <table className="w-full text-xs text-start">
                          <thead className="bg-slate-800/80 text-slate-400 text-[11px] font-bold border-b border-slate-800">
                            <tr>
                              <th className="p-3 text-start">{isAr ? 'المنتج / الصنف' : 'Item Name'}</th>
                              <th className="p-3 text-center">{isAr ? 'الكمية' : 'Quantity'}</th>
                              <th className="p-3 text-end">{isAr ? 'سعر الوحدة' : 'Unit Price'}</th>
                              <th className="p-3 text-end">{isAr ? 'الإجمالي' : 'Total Price'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-slate-200">
                            {selectedShipment.orderItems.map((item, idx) => (
                              <tr key={item.id || idx} className="hover:bg-slate-800/30">
                                <td className="p-3">
                                  <div className="font-bold text-white">{item.name}</div>
                                  {item.specsOrVariants && (
                                    <div className="text-[11px] text-slate-400">{item.specsOrVariants}</div>
                                  )}
                                  {item.storeUrl && (
                                    <a
                                      href={item.storeUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[10px] text-brand-300 hover:underline flex items-center gap-1 mt-0.5"
                                    >
                                      <span>{isAr ? 'رابط المتجر' : 'Store Link'}</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </td>
                                <td className="p-3 text-center font-bold text-white">{item.quantity}</td>
                                <td className="p-3 text-end font-semibold text-slate-300">
                                  {formatCurrency(item.unitPrice, selectedShipment.currency || 'USD')}
                                </td>
                                <td className="p-3 text-end font-black text-emerald-400">
                                  {formatCurrency(item.totalCost, selectedShipment.currency || 'USD')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-slate-900 border-t border-slate-800 font-bold text-xs">
                            <tr>
                              <td colSpan={3} className="p-3 text-end text-slate-300">
                                {isAr ? 'إجمالي قيمة المشتريات المصرح بها (Escrow):' : 'Total Items Declared Value:'}
                              </td>
                              <td className="p-3 text-end text-emerald-400 font-black text-sm">
                                {formatCurrency(selectedShipment.declaredValue, selectedShipment.currency || 'USD')}
                              </td>
                            </tr>
                            <tr>
                              <td colSpan={3} className="p-3 text-end text-slate-300">
                                {isAr ? 'أجرة الشحن والمناولة والفحص بالفرع:' : 'Shipping, Handling & Inspection Fee:'}
                              </td>
                              <td className="p-3 text-end text-brand-300 font-black text-sm">
                                {formatCurrency(selectedShipment.shippingCost, selectedShipment.currency || 'USD')}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-400 block">{isAr ? 'محتوى الطرد الشخصي:' : 'Parcel Description:'}</span>
                          <span className="font-bold text-white">{selectedShipment.itemDescription}</span>
                        </div>
                        <div className="text-end">
                          <span className="text-slate-400 block">{isAr ? 'القيمة المصرح بها:' : 'Declared Value:'}</span>
                          <span className="font-bold text-emerald-400">${selectedShipment.declaredValue} USD</span>
                        </div>
                      </div>
                    )}
                  </div>

                  

                  {/* 4-Stage Visual Custody & Security Tracking */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {isAr ? 'سلسلة العهدة والأمان المباشرة:' : 'Custody & Security Tracking:'}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                        <span className="text-slate-500 block text-[11px] mb-1">{isAr ? 'الختم الأمني المشفر' : 'Tamper-Evident Seal ID'}</span>
                        <span className="font-mono font-bold text-amber-400">
                          {selectedShipment.securitySealId || (isAr ? 'بانتظار الفحص والتغليف بالفرع' : 'Pending Hub Intake')}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                        <span className="text-slate-500 block text-[11px] mb-1">{isAr ? 'المسافر المعتمد المعين' : 'Assigned Traveler'}</span>
                        <span className="font-bold text-brand-300">
                          {selectedShipment.assignedTravelerName ? (
                            `${selectedShipment.assignedTravelerName} (${selectedShipment.airline || 'رحلة جوية'})`
                          ) : (
                            <span className="text-slate-500">{isAr ? 'بانتظار ربط المانيفست' : 'Pending Manifest'}</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                    {['PENDING', 'PENDING_REVIEW'].includes(selectedShipment.currentStatus) && (
                      <button
                        onClick={async () => {
                            if (window.confirm(isAr ? 'هل أنت متأكد من إلغاء الطلب؟ سيتم استرداد المبلغ إلى المحفظة بشكل تلقائي.' : 'Are you sure you want to cancel? Refund will be issued to your wallet automatically.')) {
                                const success = await onCancelShipment(selectedShipment.id);
                                if (success) {
                                  alert(isAr ? 'تم الإلغاء واسترداد المبلغ للمحفظة بنجاح.' : 'Order cancelled and amount refunded to wallet successfully.');
                                }
                            }
                        }}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-colors"
                      >
                        {isAr ? 'إلغاء الطلب واسترداد الرصيد' : 'Cancel Order (Refund to Wallet)'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 rounded-3xl p-12 border border-slate-800 text-center text-slate-500">
                  <Box className="w-12 h-12 mx-auto mb-3 opacity-30 text-brand-300" />
                  <p className="text-xs">{isAr ? 'اختر شحنة من القائمة لعرض تفاصيلها وأسعارها' : 'Select an order to view full details'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Printable Waybill Modal */}
      <WaybillModal
        isOpen={!!waybillModalShipment}
        onClose={() => setWaybillModalShipment(null)}
        shipment={waybillModalShipment}
        locale={locale}
      />

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
    
      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between z-40 pb-safe">
        <motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'OVERVIEW' ? 'text-brand-600 scale-110' : 'text-slate-400'}`}
        >
          <Box className="w-6 h-6" />
          <span className="text-[10px] font-bold">{isAr ? 'الرئيسية' : 'Home'}</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('SEND_PARCEL')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'SEND_PARCEL' ? 'text-brand-600 scale-110' : 'text-slate-400'}`}
        >
          <Package className="w-6 h-6" />
          <span className="text-[10px] font-bold">{isAr ? 'إرسال' : 'Send'}</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('WALLET')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'WALLET' ? 'text-brand-600 scale-110' : 'text-slate-400'}`}
        >
          <Wallet className="w-6 h-6" />
          <span className="text-[10px] font-bold">{isAr ? 'المحفظة' : 'Wallet'}</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9, y: 5 }}
          onClick={() => setActiveTab('PROFILE')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'PROFILE' ? 'text-brand-600 scale-110' : 'text-slate-400'}`}
        >
          <UserIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold">{isAr ? 'حسابي' : 'Profile'}</span>
        </motion.button>
      </div>
</div>
  );
};
