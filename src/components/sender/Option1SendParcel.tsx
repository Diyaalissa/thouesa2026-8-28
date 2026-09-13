import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, 
  Box, 
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
  Plane,
  AlertTriangle,
  Gift,
  Shield,
  HelpCircle,
  X,
  FileText,
  Calendar
} from 'lucide-react';
import { Currency, DailyExchangeRate, Hub, ShippingRate, Trip, User } from '../../types';
import { 
  CustomerDeliveryWindow, 
  calculateCustomerShippingQuote, 
  getCustomerDeliveryWindows 
} from '../../lib/deliveryWindows';

interface Option1SendParcelProps {
  isAr: boolean;
  currentUser: User;
  activeHubs: Hub[];
  trips?: Trip[];
  shippingRates?: ShippingRate[];
  exchangeRates?: DailyExchangeRate[];
  onSubmitShipment: (shipmentData: any) => Promise<void>;
  isSubmitting: boolean;
  onBack?: () => void;
}

export const Option1SendParcel: React.FC<Option1SendParcelProps> = ({
  isAr,
  currentUser,
  activeHubs,
  trips = [],
  shippingRates = [],
  exchangeRates = [],
  onSubmitShipment,
  isSubmitting,
  onBack
}) => {
  // Wizard Step for Mobile (1 to 4)
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [formValidationError, setFormValidationError] = useState<string | null>(null);

  // 1. Parcel Core Specifications
  const [parcelCategory, setParcelCategory] = useState<string>('CLOTHING');
  const [parcelType, setParcelType] = useState<'PERSONAL_TRUST' | 'NEW_GIFTS' | 'COMMERCIAL'>('PERSONAL_TRUST');
  const [parcelLengthCm, setParcelLengthCm] = useState<number>(30);
  const [parcelWidthCm, setParcelWidthCm] = useState<number>(25);
  const [parcelHeightCm, setParcelHeightCm] = useState<number>(15);
  const [parcelActualWeightKg, setParcelActualWeightKg] = useState<number>(2.5);
  const [parcelDescription, setParcelDescription] = useState<string>('');
  const [parcelImage, setParcelImage] = useState<string | null>(null);

  // 2. Routing, Addresses & Delivery Windows
  const [originHubId, setOriginHubId] = useState<string>(() => {
    const ammanHub = activeHubs.find(h => h.code === 'AMM' || h.countryCode === 'JO');
    return ammanHub ? ammanHub.id : (activeHubs[0]?.id || 'hub-amm');
  });
  
  const [destHubId, setDestHubId] = useState<string>(() => {
    const algiersHub = activeHubs.find(h => h.code === 'ALG' || h.countryCode === 'DZ');
    return algiersHub ? algiersHub.id : (activeHubs[1]?.id || 'hub-alg');
  });

  const [deliveryType, setDeliveryType] = useState<'HUB' | 'HOME'>('HUB');
  const [pickupHubId, setPickupHubId] = useState<string>('hub-alg');
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [recipientNationalId, setRecipientNationalId] = useState<string>('');

  // Volumetric & Chargeable Weight Calculations
  const volumetricWeightKg = useMemo(() => {
    return Number(((parcelLengthCm * parcelWidthCm * parcelHeightCm) / 5000).toFixed(2));
  }, [parcelLengthCm, parcelWidthCm, parcelHeightCm]);

  const chargeableWeightKg = useMemo(() => {
    return Math.max(parcelActualWeightKg, volumetricWeightKg);
  }, [parcelActualWeightKg, volumetricWeightKg]);

  // Derive Eligible Customer Delivery Windows strictly from shared Trips
  const originHub = activeHubs.find(h => h.id === originHubId) || activeHubs[0];
  const destHub = activeHubs.find(h => h.id === destHubId) || activeHubs[1];
  const originCountry = originHub?.countryCode || 'JO';
  const destinationCountry = destHub?.countryCode || 'DZ';

  const deliveryWindows: CustomerDeliveryWindow[] = useMemo(() => {
    return getCustomerDeliveryWindows({
      trips,
      originCountry,
      destinationCountry,
      requiredWeightKg: chargeableWeightKg,
      isAr,
    });
  }, [trips, originCountry, destinationCountry, chargeableWeightKg, isAr]);

  const [selectedWindowId, setSelectedWindowId] = useState<string>('');

  // Auto-select first available window if not selected or invalid
  useEffect(() => {
    if (deliveryWindows.length > 0) {
      const exists = deliveryWindows.some(w => w.id === selectedWindowId);
      if (!exists || !selectedWindowId) {
        setSelectedWindowId(deliveryWindows[0].id);
      }
    } else {
      setSelectedWindowId('');
    }
  }, [deliveryWindows, selectedWindowId]);

  const selectedWindow = deliveryWindows.find(w => w.id === selectedWindowId) || deliveryWindows[0];

  // 3. Upselling & Protection
  const [packagingType, setPackagingType] = useState<'NONE' | 'SECURE_BUBBLE' | 'LUXURY_GIFT'>('NONE');
  const [insuranceRequested, setInsuranceRequested] = useState<boolean>(false);
  const [declaredValueUSD, setDeclaredValueUSD] = useState<number>(100);
  const [prohibitedAgreed, setProhibitedAgreed] = useState<boolean>(false);
  const [customsAgreed, setCustomsAgreed] = useState<boolean>(false);
  const [showProhibitedModal, setShowProhibitedModal] = useState<boolean>(false);

  // 4. Financial & Payment
  const [selectedCurrencyPreference, setSelectedCurrencyPreference] = useState<'ORIGIN' | 'DESTINATION'>('ORIGIN');
  const [paymentGateway, setPaymentGateway] = useState<'CLIQ_JOR' | 'EDAHABIA_DZA' | 'ESCROW_WALLET' | 'BANK_TRANSFER' | 'CASH_AT_HUB'>('CLIQ_JOR');
  const [transferReceipt, setTransferReceipt] = useState<string | null>(null);

  // Determine target payment currency based on user toggle
  const paymentCurrency: Currency = useMemo(() => {
    if (selectedCurrencyPreference === 'DESTINATION') {
      return destinationCountry === 'DZ' ? 'DZD' : destinationCountry === 'JO' ? 'JOD' : 'USD';
    }
    return originCountry === 'JO' ? 'JOD' : originCountry === 'DZ' ? 'DZD' : 'USD';
  }, [selectedCurrencyPreference, originCountry, destinationCountry]);

  // Calculate official Customer Quote strictly from CUSTOMER_SHIPPING rates & shared FX
  const quoteResult = useMemo(() => {
    return calculateCustomerShippingQuote({
      shippingRates,
      exchangeRates,
      originCountry,
      destinationCountry,
      serviceType: 'SEND_PARCEL',
      billingWeightKg: chargeableWeightKg,
      paymentCurrency,
      declaredValueUsd: declaredValueUSD,
      insuranceRequested,
      packagingType,
      deliveryType,
    });
  }, [
    shippingRates,
    exchangeRates,
    originCountry,
    destinationCountry,
    chargeableWeightKg,
    paymentCurrency,
    declaredValueUSD,
    insuranceRequested,
    packagingType,
    deliveryType,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError(null);

    if (!prohibitedAgreed) {
      setFormValidationError(isAr ? 'يرجى الإقرار بعدم احتواء الطرد على أي مواد ممنوعة قانونياً للمتابعة.' : 'Please acknowledge that the parcel contains no prohibited items to proceed.');
      return;
    }
    if (!customsAgreed) {
      setFormValidationError(isAr ? 'يرجى الموافقة على التنبيه الجمركي الإلزامي للمتابعة.' : 'Please acknowledge the customs disclaimer to proceed.');
      return;
    }
    if (!quoteResult.available) {
      setFormValidationError(quoteResult.error || (isAr ? 'تعرفة الشحن غير متوفرة لهذا المسار' : 'Shipping quote unavailable for this route'));
      return;
    }

    const shipmentPayload = {
      serviceType: 'SEND_PARCEL',
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      senderPhone: currentUser.phone,
      originHubId,
      destinationHubId: deliveryType === 'HUB' ? (pickupHubId || destHubId) : destHubId,
      recipientName,
      recipientPhone,
      recipientAddress: deliveryType === 'HOME' ? recipientAddress : `استلام من فرع: ${activeHubs.find(h => h.id === (pickupHubId || destHubId))?.nameAr || 'الفرع الرئيسي'}`,
      recipientNationalId,
      itemCategory: parcelCategory,
      itemCondition: parcelType === 'PERSONAL_TRUST' ? 'USED_PERSONAL' : parcelType === 'NEW_GIFTS' ? 'NEW_PERSONAL' : 'NEW_COMMERCIAL',
      itemDescription: parcelDescription || `${parcelType} - ${parcelCategory}`,
      declaredValue: declaredValueUSD,
      estimatedWeightKg: chargeableWeightKg,
      dimensionsCm: { length: parcelLengthCm, width: parcelWidthCm, height: parcelHeightCm },
      prohibitedItemsAgreed: prohibitedAgreed,
      customsAgreed,
      packagingType,
      packagingCost: quoteResult.packagingFee || 0,
      insuranceRequested,
      insuranceCost: quoteResult.insuranceFee || 0,
      shippingCost: (quoteResult.baseShippingCost || 0) + (quoteResult.localDeliveryFee || 0),
      totalCostUSD: quoteResult.totalBaseAmount || 0,
      
      // Stage 05 Specification: Customer selects preferred delivery window (preference only)
      // Strictly NO assignedTravelerId, assignedTripId, or manifestId saved at customer stage.
      preferredDispatchOptionId: selectedWindow?.id || undefined,
      preferredDepartureDate: selectedWindow?.departureDate || undefined,
      preferredDeliveryWindow: selectedWindow ? {
        id: selectedWindow.id,
        departureDate: selectedWindow.departureDate,
        departureDisplay: selectedWindow.departureDisplay,
        etaDate: selectedWindow.etaDate,
        etaDisplay: selectedWindow.etaDisplay,
        cutoffDate: selectedWindow.cutoffDate,
        cutoffDisplay: selectedWindow.cutoffDisplay,
        remainingCapacityKg: selectedWindow.remainingCapacityKg,
        airline: selectedWindow.airline,
        flightNumber: selectedWindow.flightNumber,
      } : undefined,

      // Financial Snapshot (Rules 31, 32, 35)
      appliedRateId: quoteResult.rateId,
      appliedRateVersion: quoteResult.rateVersion,
      baseCurrency: quoteResult.baseCurrency,
      paymentCurrency: quoteResult.paymentCurrency,
      paymentAmount: quoteResult.paymentAmount,
      appliedFxRate: quoteResult.appliedFxRate,
      fxSide: quoteResult.fxSide,
      fxRateId: quoteResult.fxRateId,
      fxRateVersion: quoteResult.fxRateVersion,

      paymentMethod: paymentGateway,
      parcelImage,
      transferReceipt,
      orderItems: [
        {
          id: `parcel-item-${Date.now()}`,
          name: parcelDescription || `${parcelCategory} (${parcelType})`,
          quantity: 1,
          unitPrice: declaredValueUSD,
          totalCost: declaredValueUSD,
          itemCategory: parcelCategory,
        }
      ]
    };

    await onSubmitShipment(shipmentPayload);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-8 text-white shadow-2xl max-w-5xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-300">
        
        {/* Header Banner */}
        <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-500/10 border border-brand-500/30 rounded-2xl text-brand-400">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-black text-white">
                  {isAr ? 'مسار إرسال طرد (شحن سريع ومجدول)' : 'Send Parcel Service (Scheduled & Express)'}
                </h3>
                <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                  {isAr 
                    ? 'شحن آمن للأمانات والمقتنيات الشخصية والهدايا بين الأردن والجزائر وفق مواعيد تسليم معتمدة' 
                    : 'Secure shipping for personal items and gifts with verified delivery windows'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-950/80 px-3.5 py-2 rounded-2xl border border-slate-800 self-start md:self-auto">
            <Plane className="w-4 h-4 text-brand-400 shrink-0" />
            <span className="text-xs font-bold text-brand-300">
              {isAr ? 'رحلات طيران مجدولة أسبوعياً' : 'Weekly Scheduled Flights'}
            </span>
          </div>
        </div>

        {formValidationError && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm flex items-center gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{formValidationError}</span>
          </div>
        )}

        {/* Mobile Progress Bar (Visible only on mobile) */}
        <div className="md:hidden bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-3 px-1">
            {[
              { step: 1, label: isAr ? 'المواصفات' : 'Specs' },
              { step: 2, label: isAr ? 'مواعيد التوصيل' : 'Windows' },
              { step: 3, label: isAr ? 'الحماية' : 'Protection' },
              { step: 4, label: isAr ? 'الدفع' : 'Payment' },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  wizardStep === s.step 
                    ? 'bg-brand-500 text-white ring-4 ring-brand-500/20 shadow-lg shadow-brand-500/40' 
                    : wizardStep > s.step 
                      ? 'bg-brand-600 text-white' 
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}>
                  {wizardStep > s.step ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                </div>
                <span className={`text-[10px] mt-1 font-bold ${wizardStep === s.step ? 'text-brand-400' : 'text-slate-500'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mx-2">
            <div 
              className="h-full bg-brand-500 transition-all duration-300 rounded-full" 
              style={{ width: `${((wizardStep - 1) / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: PARCEL SPECIFICATIONS & REAL-TIME PRICING (بيانات الطرد والتسعير) */}
        {/* ========================================================================= */}
        <div className={`${wizardStep === 1 ? 'block' : 'hidden'} md:block bg-slate-950/70 border border-slate-800 rounded-2xl p-4 md:p-6 space-y-5`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
              <Box className="w-4 h-4 text-brand-400" />
              <span>{isAr ? '1. بيانات الطرد الأساسية والتسعير المعتمد' : '1. Parcel Specifications & Certified Rates'}</span>
            </h4>
            <span className="text-[11px] font-semibold text-brand-400/90 bg-brand-500/10 px-2.5 py-1 rounded-full border border-brand-500/20">
              {isAr ? 'حساب الوزن الحجمي تلقائياً' : 'Automatic Volumetric Math'}
            </span>
          </div>

          {/* Type & Classification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isAr ? 'طبيعة ونوع الطرد *' : 'Parcel Nature & Purpose *'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'PERSONAL_TRUST', label: isAr ? 'أمانات وشخصي' : 'Personal/Trust' },
                  { id: 'NEW_GIFTS', label: isAr ? 'هدايا وجديد' : 'Gifts / New' },
                  { id: 'COMMERCIAL', label: isAr ? 'بضاعة تجارية' : 'Commercial' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setParcelType(type.id as any)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      parcelType === type.id
                        ? 'bg-brand-500/20 border-brand-500 text-brand-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isAr ? 'تصنيف المحتوى بالتفصيل *' : 'Detailed Content Category *'}
              </label>
              <select
                value={parcelCategory}
                onChange={(e) => setParcelCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:border-brand-400 focus:outline-none transition-all"
              >
                <option value="CLOTHING">{isAr ? '👔 ملابس، أحذية ومصنوعات جلدية' : '👔 Clothing & Footwear'}</option>
                <option value="ELECTRONICS">{isAr ? '💻 أجهزة إلكترونية، هواتف وملحقات' : '💻 Electronics & Gadgets'}</option>
                <option value="DOCUMENTS">{isAr ? '📄 مستندات ووثائق رسمية وأوراق قانونية' : '📄 Official Documents'}</option>
                <option value="COSMETICS">{isAr ? '✨ عطور، مستحضرات تجميل وعناية' : '✨ Perfumes & Cosmetics'}</option>
                <option value="GIFTS">{isAr ? '🎁 هدايا ومقتنيات متنوعة وتذكارات' : '🎁 Gifts & Souvenirs'}</option>
                <option value="FOOD">{isAr ? '🍫 مواد غذائية ومعلبات تجارية محكمة الإغلاق' : '🍫 Packaged Food Goods'}</option>
                <option value="OTHER">{isAr ? '📦 أغراض وأمانات شخصية أخرى' : '📦 Other Goods'}</option>
              </select>
            </div>
          </div>

          {/* Physical Dimensions, Weight & Live Pricing UX */}
          <div className="bg-slate-900/90 p-4 md:p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <span className="text-xs font-bold text-slate-200">
                {isAr ? 'الأبعاد والوزن (حساب مباشر ودقيق للتكلفة)' : 'Dimensions & Weight (Direct Cost Calculator)'}
              </span>
              {quoteResult.available && quoteResult.ratePerKg ? (
                <span className="text-[11px] font-mono font-bold text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded-md border border-brand-500/20">
                  {isAr 
                    ? `سعر الكيلو المعتمد: ${quoteResult.ratePerKg.toFixed(2)} ${quoteResult.baseCurrency}` 
                    : `Rate: ${quoteResult.ratePerKg.toFixed(2)} ${quoteResult.baseCurrency} / kg`}
                </span>
              ) : (
                <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  {isAr ? 'بانتظار تحديد المسار' : 'Pending route'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 text-center font-medium">
                  {isAr ? 'الطول (سم)' : 'Length (cm)'}
                </label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  required
                  value={parcelLengthCm}
                  onChange={(e) => setParcelLengthCm(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-center text-sm font-bold text-white focus:outline-none focus:border-brand-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 text-center font-medium">
                  {isAr ? 'العرض (سم)' : 'Width (cm)'}
                </label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  required
                  value={parcelWidthCm}
                  onChange={(e) => setParcelWidthCm(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-center text-sm font-bold text-white focus:outline-none focus:border-brand-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 text-center font-medium">
                  {isAr ? 'الارتفاع (سم)' : 'Height (cm)'}
                </label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  required
                  value={parcelHeightCm}
                  onChange={(e) => setParcelHeightCm(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-center text-sm font-bold text-white focus:outline-none focus:border-brand-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 text-center font-medium">
                  {isAr ? 'الوزن الفعلي (كغ) *' : 'Actual Weight (kg) *'}
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  required
                  value={parcelActualWeightKg}
                  onChange={(e) => setParcelActualWeightKg(Math.max(0.1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-950 border border-brand-500/50 rounded-xl text-center text-sm font-bold text-brand-300 focus:outline-none focus:border-brand-400"
                />
              </div>
            </div>

            {/* Calculated Weight Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">{isAr ? 'الوزن الحجمي التقديري (L×W×H/5000):' : 'Volumetric Weight:'}</span>
                <span className="font-mono font-bold text-white">{volumetricWeightKg} kg</span>
              </div>
              <div className="bg-brand-500/10 p-3 rounded-xl border border-brand-500/30 flex items-center justify-between text-xs">
                <span className="text-brand-300 font-bold">{isAr ? 'الوزن المعتمد للاحتساب (الأعلى):' : 'Chargeable Billing Weight:'}</span>
                <span className="font-mono font-black text-brand-300 text-sm">{chargeableWeightKg} kg</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isAr ? 'وصف تفصيلي لمحتويات الطرد *' : 'Detailed Content Description *'}
            </label>
            <input
              type="text"
              required
              placeholder={isAr ? 'مثال: ملابس شخصية مستعملة، هدايا عائلية، عطور شخصية...' : 'e.g. Used personal clothing, gifts, personal perfumes...'}
              value={parcelDescription}
              onChange={(e) => setParcelDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-brand-400 transition-all"
            />
          </div>

          {/* Parcel Photo / Camera Uploader */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isAr ? 'تصوير الطرد: التقاط صورة فعلية بالكاميرا أو إرفاقها من الجهاز (اختياري وموصى به)' : 'Parcel Photography: Live Camera Capture or Upload Photo (Recommended)'}
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-brand-500/60 bg-slate-900/50 rounded-2xl p-4 transition-all flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {parcelImage ? (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-brand-500/50 shrink-0">
                    <img src={parcelImage} alt="Parcel preview" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setParcelImage(null)} 
                      className="absolute top-0 right-0 bg-red-600/90 text-white p-0.5 rounded-bl hover:bg-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                    <Camera className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-white">
                    {parcelImage ? (isAr ? 'تم إرفاق صورة الطرد بنجاح' : 'Parcel photo attached') : (isAr ? 'التقط صورة الطرد بالكاميرا أو اختر ملفاً' : 'Snap photo with camera or browse')}
                  </p>
                  <p className="text-[11px] text-slate-400">JPG, PNG, WebP (تساعد في تسريع الفحص والتوثيق)</p>
                </div>
              </div>

              <label className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 border border-slate-700 flex items-center gap-2">
                <Camera className="w-4 h-4 text-brand-400" />
                <span>{isAr ? 'فتح الكاميرا / الاستديو' : 'Camera / Gallery'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setParcelImage(ev.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
              </label>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: ROUTING, ADDRESSES & DELIVERY WINDOWS (العناوين ومواعيد التوصيل) */}
        {/* ========================================================================= */}
        <div className={`${wizardStep === 2 ? 'block' : 'hidden'} md:block bg-slate-950/70 border border-slate-800 rounded-2xl p-4 md:p-6 space-y-5`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-3 gap-2">
            <h4 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-400" />
              <span>{isAr ? '2. العناوين ومسار الشحن ونوافذ التوصيل المتاحة' : '2. Addresses, Routing & Available Delivery Windows'}</span>
            </h4>

            {/* Smart Address Book */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">{isAr ? 'دفتر العناوين:' : 'Saved Contacts:'}</span>
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'addr-1') {
                    setRecipientName('أحمد الجزائري');
                    setRecipientPhone('+213 555 123 456');
                    setRecipientAddress('الجزائر العاصمة، حي حيدرة، شارع ديدوش مراد عمارة 14');
                    setRecipientNationalId('123456789012');
                  } else if (val === 'addr-2') {
                    setRecipientName('سارة محمود');
                    setRecipientPhone('+213 770 987 654');
                    setRecipientAddress('وهران، حي العقيد لطفي، إقامة النخيل');
                    setRecipientNationalId('987654321098');
                  } else if (val === 'addr-3') {
                    setRecipientName('محمد طارق');
                    setRecipientPhone('+962 7 9123 4567');
                    setRecipientAddress('عمان، الدوار السابع، شارع زهران');
                    setRecipientNationalId('9901020304');
                  }
                }}
                className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-brand-300 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="">{isAr ? '⚡ اختيار سريع من العناوين المحفوظة' : '⚡ Quick select saved recipient'}</option>
                <option value="addr-1">{isAr ? 'أحمد الجزائري (الجزائر العاصمة)' : 'Ahmad (Algiers)'}</option>
                <option value="addr-2">{isAr ? 'سارة محمود (وهران)' : 'Sarah (Oran)'}</option>
                <option value="addr-3">{isAr ? 'محمد طارق (عمان)' : 'Mohammad (Amman)'}</option>
              </select>
            </div>
          </div>

          {/* Hub Routing Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isAr ? 'مركز انطلاق الشحنة (من) *' : 'Origin Hub (From) *'}
              </label>
              <select
                value={originHubId}
                onChange={(e) => setOriginHubId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:border-brand-400 focus:outline-none transition-all"
              >
                {activeHubs.map((h) => (
                  <option key={h.id} value={h.id}>
                    {isAr ? h.nameAr : h.nameEn} ({h.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isAr ? 'بلد ومركز الوجهة (إلى) *' : 'Destination Hub (To) *'}
              </label>
              <select
                value={destHubId}
                onChange={(e) => setDestHubId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:border-brand-400 focus:outline-none transition-all"
              >
                {activeHubs.map((h) => (
                  <option key={h.id} value={h.id}>
                    {isAr ? h.nameAr : h.nameEn} ({h.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Delivery Type Selector: Hub vs Home */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div
              onClick={() => setDeliveryType('HUB')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                deliveryType === 'HUB'
                  ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/10'
                  : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
              }`}
            >
              <div className={`p-2.5 rounded-xl mt-0.5 ${deliveryType === 'HUB' ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <Building className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs md:text-sm font-bold text-white">{isAr ? 'استلام من مكتب الشركة (Hub)' : 'Pickup from Hub Branch'}</h5>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {isAr ? 'مجاني $0.00' : 'FREE $0.00'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isAr ? 'يستلم المستلم الشحنة فور وصولها من الفرع الأقرب إليه' : 'Recipient picks up package upon flight arrival at local branch'}
                </p>
              </div>
            </div>

            <div
              onClick={() => setDeliveryType('HOME')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                deliveryType === 'HOME'
                  ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/10'
                  : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
              }`}
            >
              <div className={`p-2.5 rounded-xl mt-0.5 ${deliveryType === 'HOME' ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <Truck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs md:text-sm font-bold text-white">{isAr ? 'توصيل لباب البيت (Home Delivery)' : 'Direct Doorstep Delivery'}</h5>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    +$10.00
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isAr ? 'مندوب التوصيل يوصل الشحنة إلى العنوان النهائي للمستلم' : 'Courier delivers the package right to recipient doorstep'}
                </p>
              </div>
            </div>
          </div>

          {/* Recipient Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">{isAr ? 'اسم المستلم الثلاثي *' : 'Recipient Full Name *'}</label>
              <input
                type="text"
                required
                placeholder={isAr ? 'مثال: أحمد الجزائري' : 'e.g. John Doe'}
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-brand-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">{isAr ? 'رقم هاتف المستلم (واتساب) *' : 'Recipient Phone Number *'}</label>
              <input
                type="tel"
                required
                placeholder="+213 555 000 000"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-brand-400 transition-all"
                dir="ltr"
              />
            </div>

            {deliveryType === 'HOME' ? (
              <div className="md:col-span-2 animate-in fade-in slide-in-from-top-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">{isAr ? 'العنوان التفصيلي للتوصيل المنزلي *' : 'Detailed Doorstep Address *'}</label>
                <input
                  type="text"
                  required={deliveryType === 'HOME'}
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder={isAr ? 'المدينة، الحي، اسم الشارع، رقم البناية أو الشقة' : 'City, District, Street, Building Number'}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-brand-400 transition-all"
                />
              </div>
            ) : (
              <div className="md:col-span-2 animate-in fade-in slide-in-from-top-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">{isAr ? 'اختر مكتب أو فرع الاستلام المعتمد *' : 'Select Pickup Hub Branch *'}</label>
                <select
                  value={pickupHubId}
                  onChange={(e) => setPickupHubId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-brand-400 transition-all"
                >
                  <option value="hub-alg">{isAr ? '🏢 مكتب الجزائر العاصمة (الفرع الرئيسي - حيدرة)' : '🏢 Algiers Main Hub (Hydra)'}</option>
                  <option value="hub-orn">{isAr ? '🏢 مكتب وهران (فرع العقيد لطفي)' : '🏢 Oran Hub (Akid Lotfi)'}</option>
                  <option value="hub-amm">{isAr ? '🏢 مكتب عمان (الدوار السابع - الأردن)' : '🏢 Amman Hub (7th Circle)'}</option>
                </select>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2.B: CUSTOMER DELIVERY WINDOW SELECTION (Stage 05 Core) */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-800 pt-3 gap-1">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-400" />
                <span>{isAr ? 'اختر نافذة التوصيل وموعد الإرسال المفضل *' : 'Select Preferred Delivery Window *'}</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {isAr ? 'مواعيد مستمدة من الرحلات المعتمدة تشغيلياً' : 'Derived from verified operational schedules'}
              </span>
            </div>

            {deliveryWindows.length === 0 ? (
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl text-center space-y-2">
                <p className="text-xs font-bold text-amber-300">
                  {isAr 
                    ? `لا توجد نوافذ توصيل معتمدة متاحة حالياً لمسار (${originCountry} ➔ ${destinationCountry})` 
                    : `No verified delivery windows available for (${originCountry} ➔ ${destinationCountry})`}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isAr 
                    ? 'يمكنك تسجيل الطرد وسيقوم فريق العمليات بمطابقته فور اعتماد أقرب رحلة مناسبة.' 
                    : 'You can still submit your parcel and hub operations will match it upon the next verified flight.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {deliveryWindows.map((win) => {
                  const isSelected = selectedWindowId === win.id;
                  return (
                    <div
                      key={win.id}
                      onClick={() => setSelectedWindowId(win.id)}
                      className={`p-3.5 md:p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/10'
                          : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-black text-xs md:text-sm text-white">
                          {win.flightNumber || 'FLIGHT'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          win.remainingCapacityKg > 20 
                            ? 'bg-emerald-500/20 text-emerald-300' 
                            : win.remainingCapacityKg > 0 
                            ? 'bg-amber-500/20 text-amber-300' 
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {win.remainingCapacityKg} kg {isAr ? 'متبقي' : 'left'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 font-semibold">{win.airline || (isAr ? 'رحلة طيران معتمدة' : 'Verified Flight')}</p>
                      
                      <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span>{isAr ? 'تاريخ الإقلاع:' : 'Departure:'}</span>
                          <span className="font-bold text-slate-200">{win.departureDisplay}</span>
                        </div>
                        <div className="flex justify-between text-brand-400 font-semibold">
                          <span>{isAr ? 'التسليم قبل:' : 'Cut-off:'}</span>
                          <span>{win.cutoffDisplay}</span>
                        </div>
                        <div className="flex justify-between text-emerald-400 font-semibold">
                          <span>{isAr ? 'وصول متوقع:' : 'ETA:'}</span>
                          <span>{win.etaDisplay}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Selected Window Notice */}
            {selectedWindow && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-200 leading-relaxed">
                    <p className="font-black text-amber-300 mb-0.5">
                      {isAr ? 'تنبيه الالتزام الزمني الإلزامي:' : 'Mandatory Timeline Commitment Notice:'}
                    </p>
                    <p>
                      {isAr 
                        ? `يجب تسليم الطرد لمكتب الشركة قبل تاريخ (${selectedWindow.cutoffDisplay}) لإنهاء الفحص الأمني والوزن قبل موعد الإقلاع المحدد (${selectedWindow.departureDisplay}).` 
                        : `Parcel must be handed over to the hub prior to (${selectedWindow.cutoffDisplay}) for screening and weighing.`}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-emerald-400 bg-slate-950/60 p-2.5 rounded-xl">
                  <span>{isAr ? 'تاريخ التوصيل المتوقع للمستلم (ETA):' : 'Estimated Delivery Date (ETA):'}</span>
                  <span className="text-sm font-black text-white bg-emerald-500/20 px-3 py-1 rounded-lg border border-emerald-500/30">
                    {selectedWindow.etaDisplay} ({isAr ? 'خلال 3 أيام عمل من الرحلة' : 'Within 3 business days'})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: UPSELLING, PACKAGING & LEGAL PROTECTION (الإضافات والحماية) */}
        {/* ========================================================================= */}
        <div className={`${wizardStep === 3 ? 'block' : 'hidden'} md:block bg-slate-950/70 border border-slate-800 rounded-2xl p-4 md:p-6 space-y-5`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span>{isAr ? '3. الإضافات، التغليف والحماية القانونية' : '3. Add-ons, Packaging & Legal Guarantees'}</span>
            </h4>
            <span className="text-[11px] font-black text-brand-400 uppercase tracking-wider">{isAr ? 'أمان وحماية' : 'Safety First'}</span>
          </div>

          {/* Packaging Services Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-300">
              {isAr ? 'خيارات التغليف الإضافي (تسعير ديناميكي)' : 'Packaging Options (Dynamic Pricing)'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setPackagingType('NONE')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all text-center flex flex-col justify-between ${
                  packagingType === 'NONE'
                    ? 'border-brand-500 bg-brand-500/10 shadow-sm'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <h6 className="text-xs md:text-sm font-bold text-white">{isAr ? 'بدون تغليف إضافي' : 'Standard Packaging'}</h6>
                  <p className="text-[11px] text-slate-400 mt-1">{isAr ? 'تغليف الطرد الأساسي كما هو' : 'As provided by sender'}</p>
                </div>
                <span className="text-xs font-black text-slate-300 mt-3">{isAr ? 'مجاني $0.00' : 'FREE $0.00'}</span>
              </div>

              <div
                onClick={() => setPackagingType('SECURE_BUBBLE')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all text-center flex flex-col justify-between ${
                  packagingType === 'SECURE_BUBBLE'
                    ? 'border-brand-500 bg-brand-500/10 shadow-sm'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <h6 className="text-xs md:text-sm font-bold text-white flex items-center justify-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-brand-400" />
                    <span>{isAr ? 'تغليف آمن فقاعي' : 'Bubble Wrap & Corner Guard'}</span>
                  </h6>
                  <p className="text-[11px] text-slate-400 mt-1">{isAr ? 'حماية إضافية ضد الصدمات والكسر' : 'Extra impact protection'}</p>
                </div>
                <span className="text-xs font-black text-brand-300 mt-3">+$5.00</span>
              </div>

              <div
                onClick={() => setPackagingType('LUXURY_GIFT')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all text-center flex flex-col justify-between ${
                  packagingType === 'LUXURY_GIFT'
                    ? 'border-brand-500 bg-brand-500/10 shadow-sm'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <h6 className="text-xs md:text-sm font-bold text-white flex items-center justify-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-pink-400" />
                    <span>{isAr ? 'تغليف هدايا فاخر' : 'Luxury Gift Wrapping'}</span>
                  </h6>
                  <p className="text-[11px] text-slate-400 mt-1">{isAr ? 'ورق هدايا فاخر مع شريطة أنيقة' : 'Premium gift paper & ribbons'}</p>
                </div>
                <span className="text-xs font-black text-pink-400 mt-3">+$8.00</span>
              </div>
            </div>
          </div>

          {/* Insurance Toggle & Declared Value */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-xs md:text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{isAr ? 'تأمين شامل على الطرد (1.5% من القيمة المصرح بها)' : 'Full Coverage Insurance (1.5% of Declared Value)'}</span>
                </h5>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isAr ? 'تغطية مالية كاملة واسترداد 100% في حال فقدان أو تلف الطرد' : '100% full financial refund in the rare event of damage or loss'}
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={insuranceRequested}
                  onChange={(e) => setInsuranceRequested(e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
              </label>
            </div>

            {insuranceRequested && (
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-slate-300 whitespace-nowrap">
                    {isAr ? 'القيمة الإجمالية المصرّح بها للمحتويات ($):' : 'Declared Parcel Value ($):'}
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={declaredValueUSD}
                    onChange={(e) => setDeclaredValueUSD(Math.max(10, Number(e.target.value)))}
                    className="w-32 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-center text-sm font-bold text-brand-300 focus:outline-none focus:border-brand-400"
                  />
                </div>
                <span className="text-xs font-black text-emerald-400">
                  {isAr 
                    ? `رسوم التأمين المحتسبة: $${(quoteResult.insuranceFee || 0).toFixed(2)}` 
                    : `Calculated Insurance: $${(quoteResult.insuranceFee || 0).toFixed(2)}`}
                </span>
              </div>
            )}
          </div>

          {/* Legal Declarations & Customs Checkboxes */}
          <div className="space-y-3 pt-2">
            {/* Prohibited Items Checkbox */}
            <div className="flex items-start gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
              <input
                type="checkbox"
                id="prohibitedItemsCheck"
                required
                checked={prohibitedAgreed}
                onChange={(e) => setProhibitedAgreed(e.target.checked)}
                className="mt-1 w-5 h-5 accent-brand-500 cursor-pointer shrink-0 rounded"
              />
              <label htmlFor="prohibitedItemsCheck" className="text-xs md:text-sm text-slate-300 cursor-pointer leading-relaxed select-none">
                <span className="font-black text-white">{isAr ? 'إقرار السلامة والمواد المحظورة: ' : 'Safety & Prohibited Items Declaration: '}</span>
                {isAr 
                  ? 'أقر وأتعهد بأن الطرد خالٍ تماماً من أي مواد ممنوعة قانونياً أو خطرة، وأتحمل المسؤولية القانونية الكاملة عن صحة المحتويات.' 
                  : 'I declare and warrant that the parcel contains no prohibited or dangerous items, and I assume full legal responsibility.'}
                <button
                  type="button"
                  onClick={() => setShowProhibitedModal(true)}
                  className="text-brand-400 underline font-bold mr-1 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>{isAr ? '(عرض قائمة المواد الممنوعة)' : '(View Prohibited Items List)'}</span>
                </button>
              </label>
            </div>

            {/* Mandatory Customs Disclaimer */}
            <div className="flex items-start gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
              <input
                type="checkbox"
                id="customsDutyNoticeCheck"
                required
                checked={customsAgreed}
                onChange={(e) => setCustomsAgreed(e.target.checked)}
                className="mt-1 w-5 h-5 accent-brand-500 cursor-pointer shrink-0 rounded"
              />
              <label htmlFor="customsDutyNoticeCheck" className="text-xs md:text-sm text-slate-300 cursor-pointer leading-relaxed select-none">
                <span className="font-black text-white">{isAr ? 'تنبيه جمركي إلزامي: ' : 'Mandatory Customs Notice: '}</span>
                {isAr 
                  ? 'الرسوم الجمركية الرسمية غير مشمولة في تكلفة الشحن المبدئية، وتُسدد بدقة عند استلام الشحنة في بلد الوجهة بموجب وصل جمركي رسمي معتمد.' 
                  : 'Official customs duties are not included upfront in shipping fees and will be settled upon arrival via official customs receipt.'}
              </label>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: FINANCIAL SUMMARY & PAYMENT CHECKOUT (الملخص المالي والدفع) */}
        {/* ========================================================================= */}
        <div className={`${wizardStep === 4 ? 'block' : 'hidden'} md:block bg-slate-950 border border-slate-800 rounded-3xl p-5 md:p-7 space-y-6 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none"></div>

          {/* Title & Multi-Currency Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h4 className="text-base md:text-lg font-black text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-brand-400" />
                <span>{isAr ? '4. الفاتورة الشفافة وبوابة الدفع' : '4. Transparent Invoice & Payment Checkout'}</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr ? 'تسعير رسمي معتمد من جدول أسعار الشحن وأسعار الصرف اليومية' : 'Official rates derived from shipping and FX tables'}
              </p>
            </div>

            {/* Currency Selector */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700 w-fit">
              <button
                type="button"
                onClick={() => setSelectedCurrencyPreference('ORIGIN')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedCurrencyPreference === 'ORIGIN' 
                    ? 'bg-brand-500 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {originCountry === 'JO' ? (isAr ? 'دينار أردني (JOD)' : 'JOD') : (isAr ? 'دينار جزائري (DZD)' : 'DZD')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedCurrencyPreference('DESTINATION')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedCurrencyPreference === 'DESTINATION' 
                    ? 'bg-brand-500 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {destinationCountry === 'DZ' ? (isAr ? 'دينار جزائري (DZD)' : 'DZD') : (isAr ? 'دينار أردني (JOD)' : 'JOD')}
              </button>
            </div>
          </div>

          {/* Calculations Breakdown */}
          <div className="space-y-4">
            {!quoteResult.available ? (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{quoteResult.error || (isAr ? 'تعرفة الشحن غير متوفرة لهذا المسار' : 'Shipping quote unavailable')}</span>
              </div>
            ) : (
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs md:text-sm text-slate-300">
                <div className="flex justify-between items-center">
                  <span>
                    {isAr 
                      ? `أجور الشحن الأساسية (${quoteResult.billingWeightKg} كغ × ${quoteResult.ratePerKg?.toFixed(2)} ${quoteResult.baseCurrency})` 
                      : `Base Freight (${quoteResult.billingWeightKg} kg × ${quoteResult.ratePerKg?.toFixed(2)} ${quoteResult.baseCurrency})`}
                  </span>
                  <span className="font-semibold text-white">
                    {quoteResult.baseShippingCost?.toFixed(2)} {quoteResult.baseCurrency}
                  </span>
                </div>
                
                {quoteResult.packagingFee ? (
                  <div className="flex justify-between items-center text-brand-300">
                    <span>{isAr ? `رسوم التغليف الإضافي (${packagingType === 'SECURE_BUBBLE' ? 'تغليف آمن فقاعي' : 'تغليف هدايا فاخر'})` : 'Packaging Fee'}</span>
                    <span className="font-semibold">{quoteResult.packagingFee.toFixed(2)} {quoteResult.baseCurrency}</span>
                  </div>
                ) : null}

                {quoteResult.insuranceFee ? (
                  <div className="flex justify-between items-center text-emerald-400">
                    <span>{isAr ? `رسوم التأمين الشامل (1.5% من $${declaredValueUSD})` : 'Insurance Coverage Fee'}</span>
                    <span className="font-semibold">{quoteResult.insuranceFee.toFixed(2)} {quoteResult.baseCurrency}</span>
                  </div>
                ) : null}

                {quoteResult.localDeliveryFee ? (
                  <div className="flex justify-between items-center text-blue-400">
                    <span>{isAr ? 'أجور التوصيل المنزلي المحلي (Home Delivery)' : 'Doorstep Courier Delivery'}</span>
                    <span className="font-semibold">{quoteResult.localDeliveryFee.toFixed(2)} {quoteResult.baseCurrency}</span>
                  </div>
                ) : null}

                {/* Currency Conversion note if applied */}
                {quoteResult.appliedFxRate && quoteResult.fxSide && quoteResult.fxSide !== 'NONE' && (
                  <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[11px] text-slate-400">
                    <span>{isAr ? `سعر الصرف المعتمد (${quoteResult.fxSide}):` : `Applied FX Rate (${quoteResult.fxSide}):`}</span>
                    <span className="font-mono text-slate-300">
                      1 {quoteResult.baseCurrency} = {quoteResult.appliedFxRate} {quoteResult.paymentCurrency}
                    </span>
                  </div>
                )}

                <div className="pt-3 mt-2 border-t border-slate-800 flex justify-between items-center text-slate-300 font-bold text-sm md:text-base">
                  <span className="text-white">{isAr ? 'المبلغ الإجمالي المطلوب دفعه:' : 'Total Amount to Pay:'}</span>
                  <div className="text-end">
                    <span className="text-xl md:text-2xl font-black text-brand-400">
                      {quoteResult.paymentAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {quoteResult.paymentCurrency}
                    </span>
                    {quoteResult.paymentCurrency !== quoteResult.baseCurrency && (
                      <div className="text-[11px] text-slate-400 font-normal">
                        ({quoteResult.totalBaseAmount?.toFixed(2)} {quoteResult.baseCurrency})
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payment Gateway Grid */}
            <div className="pt-2 space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                {isAr ? 'اختر طريقة الدفع المناسبة *' : 'Select Preferred Payment Gateway *'}
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {/* CliQ Jordan */}
                <div
                  onClick={() => setPaymentGateway('CLIQ_JOR')}
                  className={`p-3 rounded-2xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all ${
                    paymentGateway === 'CLIQ_JOR' 
                      ? 'border-brand-500 bg-brand-500/10 shadow-md' 
                      : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                  }`}
                >
                  <div className="h-6 flex items-center justify-center">
                    <span className="font-black text-sm text-brand-400">CliQ</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-200">{isAr ? 'كليك (الأردن)' : 'CliQ (Jordan)'}</span>
                </div>

                {/* Edahabia / CIB Algeria */}
                <div
                  onClick={() => setPaymentGateway('EDAHABIA_DZA')}
                  className={`p-3 rounded-2xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all ${
                    paymentGateway === 'EDAHABIA_DZA' 
                      ? 'border-brand-500 bg-brand-500/10 shadow-md' 
                      : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                  }`}
                >
                  <CreditCard className={`w-5 h-5 ${paymentGateway === 'EDAHABIA_DZA' ? 'text-brand-400' : 'text-slate-400'}`} />
                  <span className="text-[11px] font-bold text-slate-200">{isAr ? 'الذهبية / CIB' : 'Edahabia / CIB'}</span>
                </div>

                {/* Escrow Wallet */}
                <div
                  onClick={() => setPaymentGateway('ESCROW_WALLET')}
                  className={`p-3 rounded-2xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all ${
                    paymentGateway === 'ESCROW_WALLET' 
                      ? 'border-brand-500 bg-brand-500/10 shadow-md' 
                      : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                  }`}
                >
                  <ShieldCheck className={`w-5 h-5 ${paymentGateway === 'ESCROW_WALLET' ? 'text-brand-400' : 'text-slate-400'}`} />
                  <span className="text-[11px] font-bold text-slate-200">{isAr ? 'محفظة الضمان' : 'Escrow Wallet'}</span>
                </div>

                {/* Bank Transfer */}
                <div
                  onClick={() => setPaymentGateway('BANK_TRANSFER')}
                  className={`p-3 rounded-2xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all ${
                    paymentGateway === 'BANK_TRANSFER' 
                      ? 'border-brand-500 bg-brand-500/10 shadow-md' 
                      : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                  }`}
                >
                  <Wallet className={`w-5 h-5 ${paymentGateway === 'BANK_TRANSFER' ? 'text-brand-400' : 'text-slate-400'}`} />
                  <span className="text-[11px] font-bold text-slate-200">{isAr ? 'تحويل بنكي' : 'Bank Transfer'}</span>
                </div>

                {/* Cash at Hub */}
                <div
                  onClick={() => setPaymentGateway('CASH_AT_HUB')}
                  className={`p-3 rounded-2xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all col-span-2 sm:col-span-1 ${
                    paymentGateway === 'CASH_AT_HUB' 
                      ? 'border-brand-500 bg-brand-500/10 shadow-md' 
                      : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                  }`}
                >
                  <DollarSign className={`w-5 h-5 ${paymentGateway === 'CASH_AT_HUB' ? 'text-brand-400' : 'text-slate-400'}`} />
                  <span className="text-[11px] font-bold text-slate-200">{isAr ? 'كاش بالفرع' : 'Cash at Hub'}</span>
                </div>
              </div>

              {/* Bank Transfer Receipt Uploader */}
              {paymentGateway === 'BANK_TRANSFER' && (
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl mt-3 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-white">{isAr ? 'بيانات الحساب البنكي للإيداع:' : 'Bank Account Information:'}</span>
                    <span className="text-[11px] font-mono text-brand-400">THOUESA LOGISTICS LLC</span>
                  </div>
                  <div className="text-xs text-slate-300 space-y-1 font-mono">
                    <p>IBAN: JO94 ARAB 1234 5678 9012 3456</p>
                    <p>BANK: Arab Bank - Amman Main Branch</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {isAr ? 'إرفاق صورة إشعار التحويل البنكي (اختياري لتسريع التأكيد):' : 'Attach Bank Transfer Receipt (Optional):'}
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setTransferReceipt(ev.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Controls */}
        <div className="md:hidden flex items-center justify-between gap-3 pt-2">
          {wizardStep > 1 && (
            <button
              type="button"
              onClick={() => setWizardStep(prev => Math.max(1, prev - 1))}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span>{isAr ? 'السابق' : 'Previous'}</span>
            </button>
          )}

          {wizardStep < 4 ? (
            <button
              type="button"
              onClick={() => {
                setFormValidationError(null);
                if (wizardStep === 1 && !parcelDescription) {
                  setFormValidationError(isAr ? 'يرجى كتابة وصف محتويات الطرد للمتابعة.' : 'Please enter parcel description.');
                  return;
                }
                setWizardStep(prev => Math.min(4, prev + 1));
              }}
              className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-brand-500/20"
            >
              <span>{isAr ? 'التالي' : 'Next'}</span>
              {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || !prohibitedAgreed || !customsAgreed || !quoteResult.available}
              className="flex-1 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-brand-500/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? (isAr ? 'جاري الإصدار...' : 'Processing...') : (isAr ? 'تأكيد الحجز والدفع' : 'Confirm & Pay')}</span>
            </button>
          )}
        </div>

        {/* Desktop Navigation Button (Unified Submit at bottom) */}
        <div className="hidden md:flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={isSubmitting || !prohibitedAgreed || !customsAgreed || !quoteResult.available}
            className="flex items-center justify-center gap-2.5 px-8 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-xl text-sm md:text-base shadow-xl shadow-brand-500/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{isSubmitting ? (isAr ? 'جاري إنشاء البوليصة وتأكيد الحجز...' : 'Processing...') : (isAr ? 'إتمام الدفع وتأكيد شحن الطرد' : 'Complete Payment & Confirm Shipping')}</span>
          </button>
        </div>
      </form>

      {/* Prohibited Items Modal */}
      {showProhibitedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-lg w-full text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-red-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{isAr ? 'قائمة المواد المحظورة دولياً وجمركياً' : 'Prohibited & Hazardous Items List'}</span>
              </h4>
              <button 
                type="button" 
                onClick={() => setShowProhibitedModal(false)} 
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2.5 max-h-80 overflow-y-auto pr-1">
              <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-xl space-y-1">
                <p className="font-bold text-red-300">{isAr ? 'المواد الممنوع شحنها تماماً:' : 'Strictly Prohibited Goods:'}</p>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>{isAr ? 'المواد القابلة للاشتعال، الغازات المضغوطة والألعاب النارية' : 'Flammable materials, compressed gases, fireworks'}</li>
                  <li>{isAr ? 'الأسلحة والذخائر والسكاكين الحادة والأدوات القتالية' : 'Weapons, ammunition, and combat equipment'}</li>
                  <li>{isAr ? 'المواد المخدرة والأدوية غير المصرح بها طبياً' : 'Narcotics and unauthorized pharmaceuticals'}</li>
                  <li>{isAr ? 'العملات النقدية السائلة، الذهب الخالص غير المرخص' : 'Cash banknotes, untaxed raw bullion'}</li>
                  <li>{isAr ? 'الأغذية الطازجة القابلة للتلف السريع دون تبريد' : 'Unsealed perishable fresh produce'}</li>
                </ul>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {isAr 
                  ? 'يخضع كل طرد لفحص أمني وفيزيائي دقيق في مركز التجميع (Hub) قبل الإقلاع، وتتم مصادرة أي مواد مخالفة مع إبلاغ السلطات المختصة.' 
                  : 'Every parcel undergoes physical and security screening at the hub prior to departure.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setProhibitedAgreed(true);
                setShowProhibitedModal(false);
              }}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              {isAr ? 'فهمت وأتعهد بالالتزام بالقائمة' : 'I Understand & Agree to Comply'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
