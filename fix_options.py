import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

prefix_pattern = r"(.*?)\{/\* 3\. OPTION 2 WIZARD: BUY FROM INTERNATIONAL STORES \*/\}"
prefix_match = re.search(prefix_pattern, content, re.DOTALL)
prefix = prefix_match.group(1) if prefix_match else ""

suffix_pattern = r"(\{/\* 5\. TAB: RECEIVED ORDERS & ACTIVE SHIPMENTS WITH ITEM DETAILS, QUANTITIES & PRICES \*/\}.*)"
suffix_match = re.search(suffix_pattern, content, re.DOTALL)
suffix = suffix_match.group(1) if suffix_match else ""

middle = """{/* 3. OPTION 2 WIZARD: BUY FROM INTERNATIONAL STORES */}
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
                <option value="Amazon USA">Amazon (USA)</option>
                <option value="Amazon UK">Amazon (UK)</option>
                <option value="eBay USA">eBay (USA)</option>
                <option value="Shein">Shein (Global)</option>
                <option value="Temu">Temu (Global)</option>
                <option value="Aliexpress">AliExpress</option>
                <option value="Other">متاجر أخرى / Other...</option>
              </select>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-brand-400 uppercase tracking-wide">
                {isAr ? 'قائمة المنتجات المطلوبة:' : 'Requested Items & Quantities:'}
              </label>
              <button
                type="button"
                onClick={() => {
                  setStoreItems([
                    ...storeItems,
                    {
                      id: `item-${Date.now()}`,
                      name: '',
                      quantity: 1,
                      unitPrice: 0,
                      totalCost: 0,
                      storeUrl: '',
                    },
                  ]);
                }}
                className="text-xs flex items-center gap-1 text-brand-300 hover:text-brand-100 bg-brand-950/40 px-2.5 py-1.5 rounded-lg border border-brand-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة منتج آخر' : 'Add Item'}</span>
              </button>
            </div>

            {storeItems.map((item, idx) => (
              <div key={item.id} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3 relative group transition-colors hover:border-brand-500/30">
                {storeItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setStoreItems(storeItems.filter((_, i) => i !== idx));
                    }}
                    className="absolute top-3 right-3 text-red-400/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      required
                      value={item.name}
                      onChange={(e) => updateStoreItem(idx, 'name', e.target.value)}
                      placeholder={isAr ? 'اسم المنتج أو الرمز' : 'Product Name or ID'}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <input
                      type="url"
                      required
                      value={item.storeUrl || ''}
                      onChange={(e) => updateStoreItem(idx, 'storeUrl', e.target.value)}
                      placeholder={isAr ? 'رابط المنتج (URL)' : 'Product URL'}
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
                    <label className="block text-[10px] text-slate-400 mb-1">{isAr ? 'سعر الوحدة التقديري ($)' : 'Est Unit Price ($)'}</label>
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
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <input
                      type="url"
                      value={item.imageUrl || ''}
                      onChange={(e) => updateStoreItem(idx, 'imageUrl', e.target.value)}
                      placeholder={isAr ? 'رابط صورة المنتج (اختياري)' : 'Product Image URL (Optional)'}
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

            {/* Pro-forma Invoice Breakdown Option 2 */}
            <div className="p-5 bg-brand-950/40 border border-brand-500/30 rounded-2xl flex flex-col gap-3 text-xs">
              <h4 className="font-bold text-brand-300 mb-2 border-b border-brand-500/20 pb-2">
                {isAr ? 'الفاتورة التقديرية (Pro-forma Invoice)' : 'Pro-forma Invoice Breakdown'}
              </h4>
              <div className="flex items-center justify-between text-slate-300">
                <span>{isAr ? 'إجمالي قيمة المنتجات التقديري:' : 'Est Items Total Cost:'}</span>
                <span className="font-semibold">${storeItems.reduce((sum, item) => sum + (item.totalCost || 0), 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>{isAr ? 'عمولة التسوق (5%):' : 'Shopper Fee (5%):'}</span>
                <span className="font-semibold">${(storeItems.reduce((sum, item) => sum + (item.totalCost || 0), 0) * 0.05).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-brand-200 pt-3 border-t border-brand-500/20">
                <span className="font-bold">{isAr ? 'إجمالي التكلفة التقريبي:' : 'Approximate Total Cost:'}</span>
                <span className="text-sm font-bold text-slate-300 line-through opacity-70">
                  ${(storeItems.reduce((sum, item) => sum + (item.totalCost || 0), 0) * 1.05).toFixed(2)} USD
                </span>
              </div>
              <div className="flex items-center justify-between text-emerald-300 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 mt-1">
                <span className="font-black">{isAr ? 'عربون تأكيد الطلب المطلوب دفعه الآن (50%):' : 'Required Confirmation Deposit (50%):'}</span>
                <span className="text-lg font-black text-emerald-400">
                  ${((storeItems.reduce((sum, item) => sum + (item.totalCost || 0), 0) * 1.05) / 2).toFixed(2)} USD
                </span>
              </div>
              <p className="text-[10px] text-brand-400/70 mt-1">
                {isAr ? '*يتم دفع الـ 50% المتبقية وأي رسوم جمركية أو شحن محتملة عند وصول واستلام الطلب.' : '*The remaining 50% and any potential customs/shipping duties are paid upon arrival and delivery.'}
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
              <input
                type="checkbox"
                className="w-5 h-5 text-brand-500 rounded-md cursor-pointer"
                id="packagingCheckboxIntl"
                checked={packagingRequested}
                onChange={(e) => setPackagingRequested(e.target.checked)}
              />
              <label htmlFor="packagingCheckboxIntl" className="text-xs font-semibold text-slate-300 cursor-pointer">
                {isAr ? 'تغليف آمن ومحكم (رسوم إضافية)' : 'Secure Packaging (Extra Fee)'}
              </label>
            </div>
            <div>
              <select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white">
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
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-brand-600/30 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? (isAr ? 'جاري الإرسال...' : 'Submitting...') : (isAr ? 'دفع العربون وتأكيد الطلب' : 'Pay Deposit & Confirm')}</span>
            </button>
          </div>
        </form>
      )}

      {/* 4. OPTION 3 WIZARD: BUY FROM SPECIFIC COUNTRY & SHIP */}
      {activeTab === 'SPECIFIC_COUNTRY_BUY' && (
        <form onSubmit={handleCountryBuySubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white shadow-xl max-w-4xl mx-auto space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <span>{isAr ? 'الخيار الثالث: الشراء من دولة محددة والشحن' : 'Option 3: Buy from Specific Country & Ship'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isAr
                ? 'اطلب منتجات مميزة من أسواق الأردن، الجزائر، مصر، سلطنة عُمان، أو السعودية ويقوم كادرنا أو المسافرون بشرائها وتوصيلها'
                : 'Request regional products from verified local markets & travelers'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'الدولة المستهدفة للشراء' : 'Source Country'}</label>
              <select
                value={targetCountry}
                onChange={(e) => setTargetCountry(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              >
                {uniqueCountries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {isAr ? c.nameAr : c.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'السوق أو المتجر المحلي' : 'Market / Merchant Name'}</label>
              <input
                type="text"
                required
                value={localMarketName}
                onChange={(e) => setLocalMarketName(e.target.value)}
                placeholder={isAr ? 'مثال: سوق مطرح (مسقط) / سوق البخارية (عمان)' : 'e.g. Mutrah Souq (Muscat)'}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                {isAr ? 'قائمة المنتجات والكميات المطلوبة:' : 'Requested Regional Items & Quantities:'}
              </label>
              <button
                type="button"
                onClick={() => {
                  setCountryBuyItems([
                    ...countryBuyItems,
                    {
                      id: `c-item-${Date.now()}`,
                      name: '',
                      quantity: 1,
                      unitPrice: 0,
                      totalCost: 0,
                      sourceCountry: targetCountry,
                    },
                  ]);
                }}
                className="text-xs flex items-center gap-1 text-emerald-300 hover:text-emerald-100 bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAr ? 'إضافة منتج آخر' : 'Add Item'}</span>
              </button>
            </div>

            {countryBuyItems.map((item, idx) => (
              <div key={item.id} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3 relative group transition-colors hover:border-emerald-500/30">
                {countryBuyItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCountryBuyItems(countryBuyItems.filter((_, i) => i !== idx));
                    }}
                    className="absolute top-3 right-3 text-red-400/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      required
                      value={item.name}
                      onChange={(e) => updateCountryBuyItem(idx, 'name', e.target.value)}
                      placeholder={isAr ? 'اسم المنتج التفصيلي (مثال: زعتر ملوكي 1 كغ)' : 'Item Name (e.g. Royal Zaatar 1kg)'}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={item.sizeVolume || ''}
                      onChange={(e) => updateCountryBuyItem(idx, 'sizeVolume', e.target.value)}
                      placeholder={isAr ? 'الحجم / الوزن التقديري (مثل: 2 كجم، صندوق صغير)' : 'Est. Size/Weight (e.g., 2kg, small box)'}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
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
                      onChange={(e) => updateCountryBuyItem(idx, 'quantity', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-center font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">{isAr ? 'سعر الوحدة التقديري ($)' : 'Est Unit Price ($)'}</label>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={item.unitPrice}
                      onChange={(e) => updateCountryBuyItem(idx, 'unitPrice', Number(e.target.value))}
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

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <input
                      type="url"
                      value={item.imageUrl || ''}
                      onChange={(e) => updateCountryBuyItem(idx, 'imageUrl', e.target.value)}
                      placeholder={isAr ? 'رابط صورة المنتج (اختياري)' : 'Product Image URL (Optional)'}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <textarea
                    rows={4}
                    value={item.specsOrVariants || ''}
                    onChange={(e) => updateCountryBuyItem(idx, 'specsOrVariants', e.target.value)}
                    placeholder={isAr ? 'المقاس / اللون / الملاحظات الخاصة التفصيلية...' : 'Detailed Size, Color, Specs...'}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white resize-y"
                  />
                </div>
              </div>
            ))}

            {/* Pro-forma Invoice Breakdown Option 3 */}
            <div className="p-5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex flex-col gap-3 text-xs">
              <h4 className="font-bold text-emerald-400 mb-2 border-b border-emerald-500/20 pb-2">
                {isAr ? 'الفاتورة التقديرية (Pro-forma Invoice)' : 'Pro-forma Invoice Breakdown'}
              </h4>
              <div className="flex items-center justify-between text-slate-300">
                <span>{isAr ? 'إجمالي قيمة المنتجات المقدرة:' : 'Est Items Total Cost:'}</span>
                <span className="font-semibold">${countryBuyItems.reduce((sum, item) => sum + (item.totalCost || 0), 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>{isAr ? 'عمولة التسوق (5%):' : 'Shopper Fee (5%):'}</span>
                <span className="font-semibold">${(countryBuyItems.reduce((sum, item) => sum + (item.totalCost || 0), 0) * 0.05).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-200 pt-3 border-t border-emerald-500/20">
                <span className="font-bold">{isAr ? 'الإجمالي التقديري للتكلفة:' : 'Total Estimated Cost:'}</span>
                <span className="text-sm font-bold text-slate-300 line-through opacity-70">
                  ${(countryBuyItems.reduce((sum, item) => sum + (item.totalCost || 0), 0) * 1.05).toFixed(2)} USD
                </span>
              </div>
              <div className="flex items-center justify-between text-emerald-300 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 mt-1">
                <span className="font-black">{isAr ? 'عربون تأكيد الطلب المطلوب دفعه الآن (50%):' : 'Required Confirmation Deposit (50%):'}</span>
                <span className="text-lg font-black text-emerald-400">
                  ${((countryBuyItems.reduce((sum, item) => sum + (item.totalCost || 0), 0) * 1.05) / 2).toFixed(2)} USD
                </span>
              </div>
              <p className="text-[10px] text-emerald-400/70 mt-1">
                {isAr ? '*يتم دفع الـ 50% المتبقية وأي رسوم جمركية أو شحن محتملة عند وصول واستلام الطلب.' : '*The remaining 50% and any potential customs/shipping duties are paid upon arrival and delivery.'}
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
              <input
                type="checkbox"
                className="w-5 h-5 text-emerald-500 rounded-md cursor-pointer"
                id="packagingCheckboxOpt3"
                checked={packagingRequested}
                onChange={(e) => setPackagingRequested(e.target.checked)}
              />
              <label htmlFor="packagingCheckboxOpt3" className="text-xs font-semibold text-slate-300 cursor-pointer">
                {isAr ? 'تغليف آمن ومحكم (رسوم إضافية)' : 'Secure Packaging (Extra Fee)'}
              </label>
            </div>
            <div>
              <select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white">
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

      """

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(prefix + middle + suffix)

print("Fix applied successfully!")
