import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# Make sure intlWizardStep state is defined
if 'const [intlWizardStep, setIntlWizardStep] = useState(1);' not in content:
    content = content.replace('const [intlCustomsAgreed, setIntlCustomsAgreed] = useState(false);', 
                              'const [intlCustomsAgreed, setIntlCustomsAgreed] = useState(false);\n  const [intlWizardStep, setIntlWizardStep] = useState(1);')

start_marker = r"\{\/\* 3\. OPTION 2 WIZARD: BUY FROM INTERNATIONAL STORES \*\/\}"
end_marker = r"\{\/\* 4\. OPTION 3 WIZARD: BUY FROM SPECIFIC COUNTRY & SHIP \*\/\}"

prefix_match = re.search(f"(.*?){start_marker}", content, re.DOTALL)
suffix_match = re.search(f"({end_marker}.*)", content, re.DOTALL)

if not prefix_match or not suffix_match:
    print("Markers not found!")
    exit(1)

prefix = prefix_match.group(1)
suffix = suffix_match.group(1)

middle = """{/* 3. OPTION 2 WIZARD: BUY FROM INTERNATIONAL STORES */}
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
"""

new_content = prefix + "\n" + middle + "\n" + suffix

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(new_content)
    
print("Successfully replaced content.")
