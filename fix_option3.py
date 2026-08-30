import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# Add states if not exist
if 'const [countryWizardStep, setCountryWizardStep]' not in content:
    content = content.replace('const [localMarketName, setLocalMarketName] = useState(\'سوق وسط البلد التراثي (عمان)\');', 
                              'const [localMarketName, setLocalMarketName] = useState(\'سوق وسط البلد التراثي (عمان)\');\n  const [countryWizardStep, setCountryWizardStep] = useState(1);\n  const [localMarketContact, setLocalMarketContact] = useState(\'\');\n  const [countryProductUrl, setCountryProductUrl] = useState(\'\');\n  const [countryCustomsAgreed, setCountryCustomsAgreed] = useState(false);')

start_marker = r"\{\/\* 4\. OPTION 3 WIZARD: BUY FROM SPECIFIC COUNTRY \& SHIP \*\/\}"
end_marker = r"\{\/\* 5\. TAB: RECEIVED ORDERS \& ACTIVE SHIPMENTS"

match = re.search(f"({start_marker}.*?)({end_marker})", content, re.DOTALL)
if match:
    old_block = match.group(1)
    print("Found Option 3 block, length:", len(old_block))
    
    new_block = """{/* 4. OPTION 3 WIZARD: BUY FROM SPECIFIC COUNTRY & SHIP */}
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
\n      """
    
    content = content.replace(old_block, new_block)
    
    with open('src/components/sender/SenderPortal.tsx', 'w') as f:
        f.write(content)
    print("Done Option 3")
else:
    print("Match not found!")
