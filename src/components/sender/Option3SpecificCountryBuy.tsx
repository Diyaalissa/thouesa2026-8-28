import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Store, 
  Package, 
  MapPin, 
  Building, 
  Truck, 
  ShieldCheck, 
  DollarSign, 
  Camera, 
  ExternalLink, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Wallet, 
  CreditCard,
  AlertCircle
} from 'lucide-react';

interface Option3SpecificCountryBuyProps {
  isAr: boolean;
  currentUser: any;
  onSubmitOrder: (orderData: any) => Promise<void>;
  isSubmitting: boolean;
}

export const Option3SpecificCountryBuy: React.FC<Option3SpecificCountryBuyProps> = ({
  isAr,
  currentUser,
  onSubmitOrder,
  isSubmitting
}) => {
  // Wizard Step for Mobile (1 to 5)
  const [wizardStep, setWizardStep] = useState<number>(1);

  // 1. Source & Contact State
  const [targetCountry, setTargetCountry] = useState<string>('JOR');
  const [sourceCity, setSourceCity] = useState<string>('');
  const [storeName, setStoreName] = useState<string>('');
  const [sellerContact, setSellerContact] = useState<string>('');

  // 2. Product Details & Attachments
  const [productName, setProductName] = useState<string>('');
  const [productColor, setProductColor] = useState<string>('');
  const [productUrl, setProductUrl] = useState<string>('');
  const [hasSize, setHasSize] = useState<boolean>(false);
  const [productSize, setProductSize] = useState<string>('');
  const [specialNotes, setSpecialNotes] = useState<string>('');
  const [approxPrice, setApproxPrice] = useState<number>(50);
  const [quantity, setQuantity] = useState<number>(1);
  const [productImage, setProductImage] = useState<string | null>(null);

  // 3. Delivery Options & Addresses
  const [deliveryType, setDeliveryType] = useState<'HUB' | 'HOME'>('HUB');
  const [recipientName, setRecipientName] = useState<string>(currentUser?.fullName || '');
  const [recipientPhone, setRecipientPhone] = useState<string>(currentUser?.phone || '');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [recipientNationalId, setRecipientNationalId] = useState<string>('');
  const [pickupHubId, setPickupHubId] = useState<string>('hub-alg');

  // 4. Customs Policy & Guarantees
  const [customsAgreed, setCustomsAgreed] = useState<boolean>(false);

  // 5. Financials & Payment
  const [selectedCurrency, setSelectedCurrency] = useState<'SENDER' | 'RECIPIENT'>('SENDER');
  const [paymentGateway, setPaymentGateway] = useState<'CLIQ_JOR' | 'EDAHABIA_DZA' | 'ESCROW_WALLET' | 'BANK_TRANSFER'>('CLIQ_JOR');
  const [transferReceipt, setTransferReceipt] = useState<string | null>(null);

  // Exchange Rates & Math
  const exchangeRateDZD = 135;
  const exchangeRateJOD = 0.71;

  const itemTotalUSD = (approxPrice || 0) * (quantity || 1);
  const shippingCostUSD = 15.0;
  const localDeliveryUSD = deliveryType === 'HOME' ? 10.0 : 0.0;
  const totalEstUSD = itemTotalUSD + shippingCostUSD + localDeliveryUSD;
  const depositDueUSD = totalEstUSD * 0.5;
  const remainingDueUSD = totalEstUSD * 0.5;

  const formatCurrency = (usdVal: number) => {
    if (selectedCurrency === 'RECIPIENT') {
      return `${(usdVal * exchangeRateDZD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DZD`;
    }
    return `${(usdVal * exchangeRateJOD).toFixed(2)} JOD ($${usdVal.toFixed(2)})`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customsAgreed) {
      alert(isAr ? 'يرجى الموافقة على التنبيه الجمركي الإلزامي للمتابعة.' : 'Please acknowledge the customs disclaimer to proceed.');
      return;
    }

    const orderPayload = {
      serviceType: 'SPECIFIC_COUNTRY_BUY',
      targetCountry,
      sourceCity,
      storeName,
      sellerContact,
      productName,
      productColor,
      productUrl,
      hasSize,
      productSize: hasSize ? productSize : undefined,
      specialNotes,
      approxPrice,
      quantity,
      productImage,
      deliveryType,
      recipientName,
      recipientPhone,
      recipientAddress: deliveryType === 'HOME' ? recipientAddress : undefined,
      recipientNationalId,
      pickupHubId: deliveryType === 'HUB' ? pickupHubId : undefined,
      customsAgreed,
      pricing: {
        itemTotalUSD,
        shippingCostUSD,
        localDeliveryUSD,
        totalEstUSD,
        depositDueUSD,
        remainingDueUSD,
        currency: selectedCurrency,
      },
      paymentGateway,
      transferReceipt
    };

    await onSubmitOrder(orderPayload);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-8 text-white shadow-2xl max-w-5xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black text-white">
                {isAr ? 'مسار الشراء من دولة أخرى أو متجر محلي' : 'Buy from Another Country / Local Store Path'}
              </h3>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                {isAr 
                  ? 'نوفر لك أي بضاعة أو منتج من المتاجر والأسواق المحلية بالدول التي نغطيها ونتكفل بالاستلام والشحن والتوصيل' 
                  : 'We procure any item from local stores & markets in our operating regions, handling buying, shipping & delivery'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-950/80 px-3.5 py-2 rounded-2xl border border-slate-800 self-start md:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-emerald-300">
            {isAr ? 'دفع آمن بنظام العربون 50%' : 'Secure 50% Deposit System'}
          </span>
        </div>
      </div>

      {/* Mobile Progress Bar (Visible only on mobile) */}
      <div className="md:hidden bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-3 px-1">
          {[
            { step: 1, label: isAr ? 'المصدر' : 'Source' },
            { step: 2, label: isAr ? 'المنتج' : 'Product' },
            { step: 3, label: isAr ? 'العنوان' : 'Address' },
            { step: 4, label: isAr ? 'الضمانات' : 'Customs' },
            { step: 5, label: isAr ? 'الدفع' : 'Payment' },
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                wizardStep === s.step 
                  ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/40' 
                  : wizardStep > s.step 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}>
                {wizardStep > s.step ? <CheckCircle2 className="w-4 h-4" /> : s.step}
              </div>
              <span className={`text-[10px] mt-1 font-bold ${wizardStep === s.step ? 'text-emerald-400' : 'text-slate-500'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mx-2">
          <div 
            className="h-full bg-emerald-500 transition-all duration-300 rounded-full" 
            style={{ width: `${((wizardStep - 1) / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: SOURCE & CONTACT (بيانات المصدر والتواصل) */}
      {/* ========================================================================= */}
      <div className={`${wizardStep === 1 ? 'block' : 'hidden'} md:block bg-slate-950/70 border border-slate-800 rounded-2xl p-4 md:p-6 space-y-4`}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? '1. بيانات المصدر والتواصل مع البائع' : '1. Source & Seller Contact Information'}</span>
          </h4>
          <span className="text-[11px] font-semibold text-emerald-400/90 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            {isAr ? 'المتجر أو السوق المستهدف' : 'Target Store / Market'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isAr ? 'الدولة المراد الشراء منها *' : 'Purchase Country *'}
            </label>
            <select
              value={targetCountry}
              onChange={(e) => setTargetCountry(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:border-emerald-400 focus:outline-none transition-all"
            >
              <option value="JOR">{isAr ? '🇯🇴 الأردن (عمان، إربد، الزرقاء)' : '🇯🇴 Jordan (Amman, Irbid)'}</option>
              <option value="DZA">{isAr ? '🇩🇿 الجزائر (الجزائر، وهران، قسنطينة)' : '🇩🇿 Algeria (Algiers, Oran)'}</option>
              <option value="ARE">{isAr ? '🇦🇪 الإمارات (دبي، أبوظبي)' : '🇦🇪 UAE (Dubai, Abu Dhabi)'}</option>
              <option value="TUR">{isAr ? '🇹🇷 تركيا (إسطنبول، أنقرة)' : '🇹🇷 Turkey (Istanbul)'}</option>
              <option value="SAU">{isAr ? '🇸🇦 السعودية (الرياض، جدة)' : '🇸🇦 Saudi Arabia (Riyadh)'}</option>
              <option value="USA">{isAr ? '🇺🇸 الولايات المتحدة الأمريكية' : '🇺🇸 United States'}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isAr ? 'المدينة المتواجد بها البائع *' : 'Seller City *'}
            </label>
            <input
              type="text"
              required
              placeholder={isAr ? 'مثال: عمان، الصويفية، وسط البلد' : 'e.g. Amman, Sweifieh'}
              value={sourceCity}
              onChange={(e) => setSourceCity(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isAr ? 'اسم المتجر أو البائع *' : 'Store or Seller Name *'}
            </label>
            <input
              type="text"
              required
              placeholder={isAr ? 'مثال: متجر زارا، محلات الهدى، سوق العطارين' : 'e.g. Zara Store, Al-Huda Shop'}
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            {isAr ? 'التواصل مع البائع (رابط حساب إنستغرام/فيسبوك/تيك توك أو رقم هاتف/واتساب) *' : 'Seller Contact (Social Media Link or WhatsApp / Phone Number) *'}
          </label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder={isAr ? 'مثال: https://instagram.com/seller_page أو +962 7 9000 0000' : 'e.g. https://instagram.com/seller_page or +962 7 9000 0000'}
              value={sellerContact}
              onChange={(e) => setSellerContact(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400 transition-all font-mono text-xs md:text-sm"
              dir="ltr"
            />
            <ExternalLink className="w-4 h-4 text-slate-500 absolute top-3.5 right-3.5 pointer-events-none" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isAr ? 'يستخدم فريقنا هذا الرابط أو الرقم للتواصل مع البائع، مطابقة المنتج وإتمام عملية الشراء فوراً.' : 'Our procurement team uses this contact to coordinate with the seller and verify the exact item.'}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: PRODUCT DETAILS & ATTACHMENTS (تفاصيل المنتج والمرفقات) */}
      {/* ========================================================================= */}
      <div className={`${wizardStep === 2 ? 'block' : 'hidden'} md:block bg-slate-950/70 border border-slate-800 rounded-2xl p-4 md:p-6 space-y-4`}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? '2. تفاصيل المنتج والمرفقات' : '2. Product Specifications & Visual Attachments'}</span>
          </h4>
          <span className="text-[11px] font-semibold text-slate-400">
            {isAr ? 'دقة التفاصيل تضمن مطابقة الطلب 100%' : 'Accurate details ensure exact match'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isAr ? 'وصف المنتج المطلوب بالتفصيل *' : 'Detailed Product Description *'}
            </label>
            <textarea
              required
              rows={2}
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder={isAr ? 'اذكر اسم المنتج ومواصفاته بالتفصيل (مثل: عطر شرقي أصلي، فستان سهرة، قطعة غيار)...' : 'Describe the item in detail (e.g. Perfume 100ml, Silk dress, Auto part)...'}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white resize-none focus:outline-none focus:border-emerald-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isAr ? 'اللون المطلوب' : 'Required Color'}
            </label>
            <input
              type="text"
              placeholder={isAr ? 'مثال: أسود، أزرق كحلي، بيج' : 'e.g. Black, Navy Blue, Beige'}
              value={productColor}
              onChange={(e) => setProductColor(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isAr ? 'رابط المنتج المباشر (اختياري)' : 'Direct Product Link (Optional)'}
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400 transition-all"
              dir="ltr"
            />
          </div>

          {/* Dynamic Size Section with Auto-Toggle */}
          <div className="md:col-span-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasSizeCheckbox"
                  checked={hasSize}
                  onChange={(e) => setHasSize(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
                <label htmlFor="hasSizeCheckbox" className="text-xs font-bold text-slate-200 cursor-pointer select-none">
                  {isAr ? 'هذا المنتج يتطلب تحديد مقاس (ملابس، أحذية، مجوهرات...)' : 'This item requires a specific size (Apparel, Shoes, Jewelry...)'}
                </label>
              </div>
              {hasSize && (
                <span className="text-[11px] text-emerald-400 font-semibold">{isAr ? 'حقل المقاس مفعّل' : 'Size enabled'}</span>
              )}
            </div>

            {hasSize && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {isAr ? 'المقاس المطلوب *' : 'Requested Size *'}
                </label>
                <input
                  type="text"
                  required={hasSize}
                  placeholder={isAr ? 'مثال: M, L, XL أو مقاس حذاء 42، أو مقاس خاتم 7' : 'e.g. M, L, XL, Shoe Size 42, Ring Size 7'}
                  value={productSize}
                  onChange={(e) => setProductSize(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
            )}
          </div>

          {/* Special Notes */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isAr ? 'ملاحظات خاصة للبائع أو فريق الشراء' : 'Special Notes for Seller / Purchasing Team'}
            </label>
            <input
              type="text"
              placeholder={isAr ? 'مثال: التأكد من سلامة التغليف، طلب فاتورة ضريبية، طلب عينات إضافية...' : 'e.g. Fragile item packaging, request tax invoice, extra gift wrapping...'}
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400 transition-all"
            />
          </div>

          {/* Price and Quantity */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isAr ? 'السعر التقريبي للمنتج ($ USD أو ما يعادله) *' : 'Estimated Product Price ($ USD) *'}
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="0.5"
                required
                value={approxPrice}
                onChange={(e) => setApproxPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400 font-bold"
              />
              <span className="absolute top-2.5 left-3 text-slate-500 font-bold text-xs">$ USD</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isAr ? 'الكمية المطلوبة *' : 'Quantity *'}
            </label>
            <input
              type="number"
              min="1"
              max="100"
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400 font-bold"
            />
          </div>

          {/* Image / Screenshot Uploader */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isAr ? 'مرفقات: صورة المنتج أو لقطة شاشة للمحادثة مع البائع (أساسي لمطابقة الطلب)' : 'Attachments: Product Image or Screenshot of Seller Post/Chat (Essential)'}
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-900/50 rounded-2xl p-4 transition-all flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {productImage ? (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-emerald-500/50 shrink-0">
                    <img src={productImage} alt="Product preview" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setProductImage(null)} 
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
                    {productImage ? (isAr ? 'تم إرفاق صورة المنتج بنجاح' : 'Product image attached') : (isAr ? 'اسحب الصورة هنا أو اختر من جهازك' : 'Drag & drop image or browse')}
                  </p>
                  <p className="text-[11px] text-slate-400">PNG, JPG, WebP أو لقطات شاشة (حتى 10MB)</p>
                </div>
              </div>

              <label className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 border border-slate-700">
                <span>{isAr ? 'اختيار صورة / لقطة' : 'Upload Image'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setProductImage(ev.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: DELIVERY OPTIONS & SMART ADDRESSES (خيارات التوصيل والعناوين) */}
      {/* ========================================================================= */}
      <div className={`${wizardStep === 3 ? 'block' : 'hidden'} md:block bg-slate-950/70 border border-slate-800 rounded-2xl p-4 md:p-6 space-y-4`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-3 gap-2">
          <h4 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? '3. خيارات التوصيل وعنوان المستلم' : '3. Delivery Options & Recipient Address'}</span>
          </h4>

          {/* Smart Address Book */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">{isAr ? 'دفتر العناوين المحفوظة:' : 'Saved Addresses:'}</span>
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'addr-1') {
                  setRecipientName(currentUser?.fullName || 'أحمد الجزائري');
                  setRecipientPhone(currentUser?.phone || '+213 555 123 456');
                  setRecipientAddress('الجزائر العاصمة، حي حيدرة، شارع ديدوش مراد عمارة 14');
                  setRecipientNationalId('123456789012');
                } else if (val === 'addr-2') {
                  setRecipientName('سارة محمود');
                  setRecipientPhone('+213 770 987 654');
                  setRecipientAddress('وهران، حي العقيد لطفي، إقامة النخيل');
                  setRecipientNationalId('987654321098');
                }
              }}
              className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-emerald-300 font-semibold focus:outline-none"
            >
              <option value="">{isAr ? '⚡ اختيار سريع من العناوين' : '⚡ Quick select address'}</option>
              <option value="addr-1">{isAr ? 'المنزل الرئيسي (الجزائر العاصمة)' : 'Main Home (Algiers)'}</option>
              <option value="addr-2">{isAr ? 'مكتب العمل (وهران)' : 'Work Office (Oran)'}</option>
            </select>
          </div>
        </div>

        {/* Delivery Type Selector: Hub vs Home */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div
            onClick={() => setDeliveryType('HUB')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
              deliveryType === 'HUB'
                ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
            }`}
          >
            <div className={`p-2.5 rounded-xl mt-0.5 ${deliveryType === 'HUB' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
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
                {isAr ? 'تستلم شحنتك فور وصولها من أقرب فرع لشركتنا في مدينتك' : 'Pick up your package upon arrival from the nearest local hub'}
              </p>
            </div>
          </div>

          <div
            onClick={() => setDeliveryType('HOME')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
              deliveryType === 'HOME'
                ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
            }`}
          >
            <div className={`p-2.5 rounded-xl mt-0.5 ${deliveryType === 'HOME' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
              <Truck className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h5 className="text-xs md:text-sm font-bold text-white">{isAr ? 'توصيل لباب البيت (Home Delivery)' : 'Direct Home Delivery'}</h5>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  +$10.00
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {isAr ? 'مندوب التوصيل يوصل الشحنة إلى عنوان منزلك أو عملك بدقة' : 'Courier delivers the package right to your doorstep'}
              </p>
            </div>
          </div>
        </div>

        {/* Recipient Details Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">{isAr ? 'اسم المستلم الثلاثي *' : 'Recipient Full Name *'}</label>
            <input
              type="text"
              required
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">{isAr ? 'رقم هاتف المستلم *' : 'Recipient Phone Number *'}</label>
            <input
              type="tel"
              required
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400 transition-all"
              dir="ltr"
            />
          </div>

          {deliveryType === 'HOME' ? (
            <div className="md:col-span-2 animate-in fade-in slide-in-from-top-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">{isAr ? 'العنوان التفصيلي للتوصيل المنزلي (المدينة، الحي، الشارع، رقم المبنى) *' : 'Detailed Home Address (City, District, Street, Building) *'}</label>
              <input
                type="text"
                required={deliveryType === 'HOME'}
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder={isAr ? 'الجزائر العاصمة، حي باب الواد، شارع العربي بن مهيدي، عمارة 12، طابق 3' : 'Algiers, Bab El Oued, Larbi Ben M\'hidi St, Bld 12, Floor 3'}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400 transition-all"
              />
            </div>
          ) : (
            <div className="md:col-span-2 animate-in fade-in slide-in-from-top-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">{isAr ? 'اختر مكتب أو فرع الاستلام *' : 'Select Pickup Hub Branch *'}</label>
              <select
                value={pickupHubId}
                onChange={(e) => setPickupHubId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400 transition-all"
              >
                <option value="hub-alg">{isAr ? '🏢 مكتب الجزائر العاصمة (الفرع الرئيسي - حيدرة)' : '🏢 Algiers Main Hub (Hydra)'}</option>
                <option value="hub-orn">{isAr ? '🏢 مكتب وهران (فرع العقيد لطفي)' : '🏢 Oran Hub (Akid Lotfi)'}</option>
                <option value="hub-amm">{isAr ? '🏢 مكتب عمان (الدوار السابع - الأردن)' : '🏢 Amman Hub (7th Circle)'}</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: CUSTOMS POLICY & GUARANTEES (سياسة الجمارك والضمانات) */}
      {/* ========================================================================= */}
      <div className={`${wizardStep === 4 ? 'block' : 'hidden'} md:block bg-slate-950/70 border border-slate-800 rounded-2xl p-4 md:p-6 space-y-4`}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? '4. سياسة الجمارك والضمان المالي' : '4. Customs Policy & Financial Guarantee'}</span>
          </h4>
          <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">{isAr ? 'شفافية وأمان' : 'Trust & Safety'}</span>
        </div>

        <div className="space-y-4 pt-1">
          {/* Mandatory Customs Disclaimer Checkbox */}
          <div className="flex items-start gap-3.5 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
            <input
              type="checkbox"
              id="customsPolicyCheckbox"
              required
              checked={customsAgreed}
              onChange={(e) => setCustomsAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 accent-emerald-500 cursor-pointer shrink-0 rounded"
            />
            <label htmlFor="customsPolicyCheckbox" className="text-xs md:text-sm text-slate-300 cursor-pointer leading-relaxed select-none">
              <span className="font-black text-white">{isAr ? 'تنبيه جمركي إلزامي: ' : 'Mandatory Customs Notice: '}</span>
              {isAr 
                ? 'أقر بأن الرسوم والضرائب الجمركية الرسمية غير مشمولة في السعر التقريبي الأولي، وتُضاف بدقة إلى المبلغ المتبقي عند وصول الشحنة بناءً على وصل الجمارك الرسمي الموثق.' 
                : 'I acknowledge that official customs duties and taxes are not included in the initial estimate, and will be added precisely to the remaining balance upon arrival based on the official customs receipt.'}
            </label>
          </div>

          {/* Prominent Financial Security Trust Badge */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 md:p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 relative overflow-hidden">
            <div className="p-3 bg-emerald-500/20 rounded-2xl shrink-0">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h5 className="text-sm md:text-base font-black text-emerald-300">
                {isAr ? 'ضمان الأمان المالي لاسترداد العربون' : 'Financial Security & Deposit Guarantee'}
              </h5>
              <p className="text-xs text-emerald-200/80 mt-0.5 leading-relaxed">
                {isAr 
                  ? 'يُسترد كامل مبلغ العربون فوراً وبشكل تلقائي إلى محفظتك الإلكترونية في حال عدم توفر المنتج لدى البائع، أو إلغاء الطلب قبل الشراء.' 
                  : 'Your 50% deposit is instantly and automatically refunded to your wallet if the item is unavailable or if the request is canceled prior to procurement.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: FINANCIAL SUMMARY & PAYMENT (نظام العربون 50%) */}
      {/* ========================================================================= */}
      <div className={`${wizardStep === 5 ? 'block' : 'hidden'} md:block bg-slate-950 border border-slate-800 rounded-3xl p-5 md:p-7 space-y-6 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Title & Multi-Currency Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h4 className="text-base md:text-lg font-black text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? '5. الملخص المالي وبوابة الدفع (عربون 50%)' : '5. Financial Summary & Deposit Checkout (50%)'}</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr ? 'تفصيل تكلفة الشراء والشحن مع خيار الدفع بعملة بلدك' : 'Transparent breakdown with multi-currency checkout'}
            </p>
          </div>

          {/* Currency Selector */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700 w-fit">
            <button
              type="button"
              onClick={() => setSelectedCurrency('SENDER')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedCurrency === 'SENDER' 
                  ? 'bg-emerald-500 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'دينار أردني (JOD)' : 'Sender (JOD / USD)'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedCurrency('RECIPIENT')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedCurrency === 'RECIPIENT' 
                  ? 'bg-emerald-500 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'دينار جزائري (DZD)' : 'Recipient (DZD)'}
            </button>
          </div>
        </div>

        {/* Calculations Breakdown */}
        <div className="space-y-4">
          {/* Detailed Line Items */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-xs md:text-sm text-slate-300">
            <div className="flex justify-between items-center">
              <span>{isAr ? `قيمة المنتج التقريبية (${quantity}x)` : `Estimated Product Value (${quantity}x)`}</span>
              <span className="font-semibold text-white">{formatCurrency(itemTotalUSD)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>{isAr ? 'أجور الشراء والشحن الدولي' : 'Procurement & International Shipping'}</span>
              <span className="font-semibold text-white">{formatCurrency(shippingCostUSD)}</span>
            </div>
            {deliveryType === 'HOME' && (
              <div className="flex justify-between items-center text-emerald-400">
                <span>{isAr ? 'أجور التوصيل المنزلي المحلي' : 'Local Doorstep Delivery'}</span>
                <span className="font-semibold">{formatCurrency(localDeliveryUSD)}</span>
              </div>
            )}
            <div className="pt-2.5 mt-2 border-t border-slate-800 flex justify-between items-center text-slate-400 text-xs font-semibold">
              <span>{isAr ? 'الإجمالي التقديري الكامل للطلب' : 'Total Estimated Order Cost'}</span>
              <span className="text-white">{formatCurrency(totalEstUSD)}</span>
            </div>
          </div>

          {/* 50% Deposit High-Impact Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-emerald-500/10 border-2 border-emerald-500/40 p-4 md:p-5 rounded-2xl shadow-inner">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-300">{isAr ? 'المطلوب دفعه الآن (عربون 50%)' : 'Due Now (50% Deposit)'}</span>
                <span className="text-[10px] bg-emerald-500 text-white font-black px-2 py-0.5 rounded-full">{isAr ? 'لتأكيد الشراء' : 'To Confirm'}</span>
              </div>
              <div className="text-2xl md:text-3xl font-black text-emerald-400">
                {formatCurrency(depositDueUSD)}
              </div>
              <p className="text-[11px] text-emerald-200/70 mt-1">
                {isAr ? 'يتم خصم المبلغ وتجميده كضمان حتى شراء المنتج' : 'Funds held securely until item is procured'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 md:p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-400">{isAr ? 'المتبقي عند الاستلام (50% + جمرك)' : 'Remaining on Delivery (50% + Customs)'}</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full">{isAr ? 'عند وصول الشحنة' : 'Upon Arrival'}</span>
              </div>
              <div className="text-xl md:text-2xl font-black text-slate-200">
                {formatCurrency(remainingDueUSD)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {isAr ? '+ الرسوم الجمركية الرسمية الموثقة بوصل' : '+ Official customs duties via receipt'}
              </p>
            </div>
          </div>

          {/* Payment Gateway Grid */}
          <div className="pt-2 space-y-3">
            <label className="block text-xs font-bold text-slate-300">
              {isAr ? 'اختر طريقة دفع العربون *' : 'Select Deposit Payment Method *'}
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* CliQ Jordan */}
              <div
                onClick={() => setPaymentGateway('CLIQ_JOR')}
                className={`p-3 rounded-2xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all ${
                  paymentGateway === 'CLIQ_JOR' 
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-md' 
                    : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                }`}
              >
                <div className="h-6 flex items-center justify-center">
                  <span className="font-black text-sm text-emerald-400">CliQ</span>
                </div>
                <span className="text-[11px] font-bold text-slate-200">{isAr ? 'كليك (الأردن)' : 'CliQ (Jordan)'}</span>
              </div>

              {/* Edahabia / CIB Algeria */}
              <div
                onClick={() => setPaymentGateway('EDAHABIA_DZA')}
                className={`p-3 rounded-2xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all ${
                  paymentGateway === 'EDAHABIA_DZA' 
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-md' 
                    : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                }`}
              >
                <CreditCard className={`w-5 h-5 ${paymentGateway === 'EDAHABIA_DZA' ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="text-[11px] font-bold text-slate-200">{isAr ? 'الذهبية / CIB (الجزائر)' : 'Edahabia / CIB'}</span>
              </div>

              {/* Escrow Wallet */}
              <div
                onClick={() => setPaymentGateway('ESCROW_WALLET')}
                className={`p-3 rounded-2xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all ${
                  paymentGateway === 'ESCROW_WALLET' 
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-md' 
                    : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                }`}
              >
                <ShieldCheck className={`w-5 h-5 ${paymentGateway === 'ESCROW_WALLET' ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="text-[11px] font-bold text-slate-200">{isAr ? 'محفظة الضمان' : 'Escrow Wallet'}</span>
              </div>

              {/* Integrated Bank Transfer */}
              <div
                onClick={() => setPaymentGateway('BANK_TRANSFER')}
                className={`p-3 rounded-2xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all ${
                  paymentGateway === 'BANK_TRANSFER' 
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-md' 
                    : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
                }`}
              >
                <Wallet className={`w-5 h-5 ${paymentGateway === 'BANK_TRANSFER' ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="text-[11px] font-bold text-slate-200">{isAr ? 'تحويل بنكي مدمج' : 'Bank Transfer'}</span>
              </div>
            </div>

            {/* Integrated Bank Transfer Details & Receipt Uploader */}
            {paymentGateway === 'BANK_TRANSFER' && (
              <div className="bg-slate-900 border border-slate-700 p-4 rounded-2xl mt-3 space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-white">{isAr ? 'بيانات الحساب البنكي المعتمد للشركة' : 'Official Corporate Bank Details'}</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{isAr ? 'تحويل مباشر' : 'Direct'}</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1.5">
                  <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400">{isAr ? 'اسم البنك والمستفيد:' : 'Bank & Beneficiary:'}</span>
                    <span className="font-bold text-white">{isAr ? 'البنك العربي - شركة ثويسة اللوجستية' : 'Arab Bank - THOUESA Logistics'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-xs">
                    <span className="text-slate-400">IBAN / RIB:</span>
                    <span className="font-bold text-emerald-300">JO98 ABAB 0000 0000 1234 56</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {isAr ? 'إرفاق إيصال التحويل (ضروري لتأكيد الطلب فوراً)' : 'Upload Transfer Receipt (Required to confirm)'}
                  </label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-emerald-300 hover:file:bg-slate-700 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setTransferReceipt(file.name);
                        }
                      }}
                    />
                    {transferReceipt && (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {transferReceipt}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NAVIGATION BUTTONS */}
      {/* ========================================================================= */}
      {/* Mobile Wizard Nav Buttons */}
      <div className="md:hidden flex items-center justify-between pt-4 border-t border-slate-800">
        {wizardStep > 1 ? (
          <button 
            type="button" 
            onClick={() => setWizardStep(wizardStep - 1)} 
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold flex items-center gap-2"
          >
            <ChevronRight className="w-4 h-4" />
            <span>{isAr ? 'السابق' : 'Back'}</span>
          </button>
        ) : <div />}

        {wizardStep < 5 ? (
          <button 
            type="button" 
            onClick={() => setWizardStep(wizardStep + 1)} 
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <span>{isAr ? 'التالي' : 'Next'}</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        ) : (
          <button 
            type="submit" 
            disabled={isSubmitting || !customsAgreed} 
            className="flex-1 ml-4 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-sm shadow-lg shadow-emerald-500/30 disabled:opacity-50 transition-all"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{isSubmitting ? (isAr ? 'جاري الاعتماد...' : 'Processing...') : (isAr ? 'دفع العربون وتأكيد الطلب' : 'Pay Deposit & Confirm')}</span>
          </button>
        )}
      </div>

      {/* Desktop Single-Page Submit Button */}
      <div className="hidden md:flex justify-end pt-4 border-t border-slate-800">
        <button
          type="submit"
          disabled={isSubmitting || !customsAgreed}
          className="w-full md:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-sm shadow-xl shadow-emerald-500/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>{isSubmitting ? (isAr ? 'جاري تسجيل الطلب...' : 'Processing...') : (isAr ? 'دفع العربون 50% وتأكيد الطلب' : 'Pay 50% Deposit & Confirm Order')}</span>
        </button>
      </div>
    </form>
  );
};
