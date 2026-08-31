import re

with open('src/components/traveler/TravelerPortal.tsx', 'r') as f:
    content = f.read()

# Add exchangeAmount state
content = content.replace(
    "const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'MY_TRIPS' | 'MY_BAG' | 'WALLET' | 'PROFILE'>('DASHBOARD');",
    "const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'MY_TRIPS' | 'MY_BAG' | 'WALLET' | 'PROFILE'>('DASHBOARD');\n  const [exchangeAmount, setExchangeAmount] = useState<number>(100);"
)

# Replace Dashboard content
old_dashboard = r"\{\s*activeTab === 'DASHBOARD' && \(\s*<div className=\"space-y-6\">\s*<div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">.*?<\/div>\s*<\/div>\s*\)\s*\}"

new_dashboard = """{activeTab === 'DASHBOARD' && (() => {
            const upcomingTrip = travelerTrips.find(t => t.status === 'SCHEDULED' || t.status === 'PENDING');
            const inTransitTrip = travelerTrips.find(t => t.status === 'IN_TRANSIT');
            const activeTrip = upcomingTrip || inTransitTrip;
            const totalTransportedWeight = 540;
            const loyaltyTierText = isAr ? 'مسافر ذهبي 🌟 - تم نقل 540 كغ بنجاح' : 'Gold Traveler 🌟 - 540 kg transported';

            return (
              <div className="space-y-6">
                {/* Greeting & Gamification */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                      {isAr ? `مرحباً يا ${currentUser.fullName.split(' ')[0]} ✈️` : `Welcome, ${currentUser.fullName.split(' ')[0]} ✈️`}
                    </h2>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                      <Sparkles className="w-3.5 h-3.5" />
                      {loyaltyTierText}
                    </div>
                  </div>
                  <button className="relative w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-50 shrink-0">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                  </button>
                </div>

                {/* Smart Nudges */}
                {activeTrip && activeTrip.status === 'SCHEDULED' && (
                  <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center gap-3">
                    <Info className="w-5 h-5 text-teal-600 shrink-0" />
                    <p className="text-sm font-bold text-teal-800">
                      {isAr ? 'لا تنسَ التوجه لمكتبنا غداً لدفع الضمان واستلام الطرود قبل موعد رحلتك.' : 'Don\\'t forget to visit our office tomorrow to pay escrow and receive your parcels.'}
                    </p>
                  </div>
                )}
                {activeTrip && activeTrip.status === 'IN_TRANSIT' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-sm font-bold text-emerald-800">
                      {isAr ? 'الحمدلله على السلامة! يرجى التوجه لمكتب الوصول لتسليم الطرود وتحرير أموالك.' : 'Welcome safely! Please visit the destination office to handover parcels and unlock your funds.'}
                    </p>
                  </div>
                )}
                {!activeTrip && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:bg-indigo-100 transition-colors" onClick={() => setIsNewTripModalOpen(true)}>
                    <PlusCircle className="w-5 h-5 text-indigo-600 shrink-0" />
                    <p className="text-sm font-bold text-indigo-800">
                      {isAr ? 'لا توجد رحلات مجدولة. هل تخطط للسفر قريباً؟ أضف رحلتك الآن.' : 'No scheduled trips. Planning to travel soon? Add your trip now.'}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Column */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Contextual Trip Card */}
                    {activeTrip ? (
                      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-900 p-6 text-white relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 blur-[80px] rounded-full" />
                          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                              <div className="flex items-center gap-3 text-slate-300 text-xs font-bold mb-2 uppercase tracking-wider">
                                <span>{activeTrip.departureTime.split('T')[0]}</span>
                                <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                                <span>{activeTrip.airline}</span>
                              </div>
                              <div className="flex items-center gap-4 text-2xl font-black">
                                <span>{activeTrip.originHubId.substring(0,3).toUpperCase()} 🇯🇴</span>
                                <Plane className="w-5 h-5 text-teal-400" />
                                <span>{activeTrip.destinationHubId.substring(0,3).toUpperCase()} 🇩🇿</span>
                              </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center min-w-[100px]">
                              <span className="block text-xs text-slate-300 mb-1">{isAr ? 'باقي للإقلاع' : 'Time left'}</span>
                              <span className="text-xl font-black text-emerald-400">48h</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-6 space-y-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl">
                              <span className="block text-xs text-slate-500 mb-1">{isAr ? 'الوزن المتاح' : 'Available'}</span>
                              <span className="font-black text-slate-900">{activeTrip.availableWeightKg} kg</span>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl">
                              <span className="block text-xs text-slate-500 mb-1">{isAr ? 'الوزن المحجوز' : 'Allocated'}</span>
                              <span className="font-black text-slate-900">{activeTrip.allocatedWeightKg} kg</span>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl">
                              <span className="block text-xs text-slate-500 mb-1">{isAr ? 'الطرود المسندة' : 'Parcels'}</span>
                              <span className="font-black text-slate-900">{activeTrip.allocatedWeightKg > 0 ? '3' : '0'}</span>
                            </div>
                            <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100">
                              <span className="block text-xs text-teal-700 mb-1">{isAr ? 'الأرباح المتوقعة' : 'Est. Earnings'}</span>
                              <span className="font-black text-teal-700">{formatCurrency(activeTrip.totalEarningsEstimated, 'USD')}</span>
                            </div>
                          </div>

                          {activeTrip.requiredEscrowDeposit > 0 && !activeTrip.isEscrowPaid && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <ShieldAlert className="w-5 h-5 text-amber-600" />
                                <div>
                                  <span className="block font-bold text-amber-900 text-sm">{isAr ? 'الضمان المالي المطلوب تجهيزه' : 'Required Escrow Deposit'}</span>
                                  <span className="block font-black text-amber-700 text-lg">{formatCurrency(activeTrip.requiredEscrowDeposit, 'USD')}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          <button
                            onClick={() => setActiveTab('MY_BAG')}
                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-colors flex items-center justify-center gap-2"
                          >
                            <ShieldCheck className="w-5 h-5" />
                            <span>{isAr ? 'عرض حقيبتي لمعاينة الطرود' : 'View My Bag & Manifest'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center h-64">
                        <Plane className="w-12 h-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-500">{isAr ? 'لا توجد رحلات قادمة' : 'No upcoming flights'}</h3>
                        <button 
                          onClick={() => setIsNewTripModalOpen(true)}
                          className="mt-4 px-6 py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors"
                        >
                          {isAr ? 'إضافة رحلة جديدة' : 'Add New Flight'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Sidebar Column (Financials, Currency, Actions) */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Financial Summary */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-slate-500" />
                        {isAr ? 'الملخص المالي' : 'Financials'}
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{isAr ? 'الرصيد المتاح للسحب' : 'Available Balance'}</span>
                          <div className="text-2xl font-black text-emerald-500 mt-1">
                            {wallet ? formatCurrency(wallet.balance, wallet.currency) : '$0.00'}
                          </div>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{isAr ? 'الرصيد المعلق (ضمان + أرباح)' : 'Pending / Escrow'}</span>
                          <div className="text-lg font-black text-amber-500 mt-1">
                            {wallet ? formatCurrency(wallet.lockedEscrowDeposit + wallet.pendingEarnings, 'USD') : '$0.00'}
                          </div>
                        </div>
                        <button onClick={() => setActiveTab('WALLET')} className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors">
                          {isAr ? 'إدارة المحفظة' : 'Manage Wallet'}
                        </button>
                      </div>
                    </div>

                    {/* Currency Converter */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-brand-500" />
                        {isAr ? 'محول العملات السريع' : 'Quick Exchange'}
                      </h3>
                      <div className="space-y-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold rtl:right-3 rtl:left-auto">$</span>
                          <input 
                            type="number" 
                            value={exchangeAmount} 
                            onChange={(e) => setExchangeAmount(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-8 pr-3 rtl:pr-8 rtl:pl-3 text-sm font-bold focus:outline-none focus:border-brand-500 text-slate-900" 
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <span className="text-xs font-bold text-slate-600">🇯🇴 JOD</span>
                          <span className="font-black text-slate-900">{(exchangeAmount * 0.71).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <span className="text-xs font-bold text-slate-600">🇩🇿 DZD</span>
                          <span className="font-black text-slate-900">{(exchangeAmount * 134.5).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        {isAr ? 'إجراءات سريعة' : 'Quick Actions'}
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => {
                            if (currentUser.kycStatus === 'VERIFIED') {
                              setIsNewTripModalOpen(true);
                            } else {
                              alert(isAr ? 'يرجى استكمال توثيق الحساب أولاً من صفحة حسابي.' : 'Please verify your account from the profile page first.');
                            }
                          }} className="flex flex-col items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors">
                          <PlusCircle className="w-5 h-5 text-teal-600" />
                          <span className="text-[10px] font-bold text-slate-700 text-center">{isAr ? 'إضافة رحلة' : 'Add Trip'}</span>
                        </button>
                        <button onClick={() => { setActiveTab('MY_BAG'); }} className="flex flex-col items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors">
                          <QrCode className="w-5 h-5 text-brand-600" />
                          <span className="text-[10px] font-bold text-slate-700 text-center">{isAr ? 'مسح باركود' : 'Scan QR'}</span>
                        </button>
                        <button className="flex flex-col items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-colors col-span-2">
                          <MessageCircle className="w-5 h-5 text-emerald-600" />
                          <span className="text-[10px] font-bold text-slate-700 text-center">{isAr ? 'الدعم المباشر' : 'Live Support'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}"""

content = re.sub(old_dashboard, new_dashboard, content, flags=re.DOTALL)

with open('src/components/traveler/TravelerPortal.tsx', 'w') as f:
    f.write(content)
