import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# Add sendWizardStep state if not there
if 'const [sendWizardStep, setSendWizardStep]' not in content:
    content = content.replace('const [prohibitedAgreed, setProhibitedAgreed] = useState(false);', 
                              'const [prohibitedAgreed, setProhibitedAgreed] = useState(false);\n  const [sendWizardStep, setSendWizardStep] = useState(1);')

# We know SEND_PARCEL starts around line 898.
# The end is marked by {/* 3. OPTION 2 WIZARD
start_marker = r"\{activeTab === 'SEND_PARCEL' && \("
end_marker = r"\{\/\* 3\. OPTION 2 WIZARD"

match = re.search(f"({start_marker}.*?)({end_marker})", content, re.DOTALL)
if match:
    old_block = match.group(1)
    print("Found old block, length:", len(old_block))
    
    new_block = """{activeTab === 'SEND_PARCEL' && (
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
      )}"""
    
    content = content.replace(old_block, new_block)
    
    with open('src/components/sender/SenderPortal.tsx', 'w') as f:
        f.write(content)
    print("Done")
else:
    print("Match not found!")
