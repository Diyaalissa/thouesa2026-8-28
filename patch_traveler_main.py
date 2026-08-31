import re

with open('src/components/traveler/TravelerPortal.tsx', 'r') as f:
    content = f.read()

# Add a Nudge banner and Dashboard tab
nudge_and_dashboard = """
        {/* Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-50/50 p-4 md:p-6 pb-24 md:pb-6 space-y-6">
          {currentUser.kycStatus !== 'VERIFIED' && currentUser.kycStatus !== 'PENDING' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">{isAr ? 'حسابك غير موثق' : 'Unverified Account'}</h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {isAr ? 'استكمل بياناتك ووثائقك لتتمكن من إضافة رحلاتك والبدء بكسب الأرباح' : 'Complete your KYC documents to add flights and start earning'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('PROFILE')}
                className="hidden md:flex px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
              >
                {isAr ? 'توثيق الحساب' : 'Verify Now'}
              </button>
            </div>
          )}

          {activeTab === 'DASHBOARD' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-slate-500 mb-4">
                    <Plane className="w-4 h-4" />
                    <span className="text-xs font-bold">{isAr ? 'الرحلة القادمة' : 'Upcoming Trip'}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{travelerTrips.find(t => t.status === 'SCHEDULED' || t.status === 'PENDING')?.originHubId || '---'} ➔ {travelerTrips.find(t => t.status === 'SCHEDULED' || t.status === 'PENDING')?.destinationHubId || '---'}</h3>
                    <p className="text-xs text-brand-600 font-bold mt-1">{travelerTrips.find(t => t.status === 'SCHEDULED' || t.status === 'PENDING')?.departureTime.split('T')[0] || (isAr ? 'لا توجد رحلات مجدولة' : 'No scheduled trips')}</p>
                  </div>
                </div>
                
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-slate-500 mb-4">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold">{isAr ? 'الوزن المتاح المتبقي' : 'Remaining Capacity'}</span>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900">{travelerTrips.reduce((acc, t) => acc + (t.status === 'SCHEDULED' || t.status === 'PENDING' ? (t.availableWeightKg - t.allocatedWeightKg) : 0), 0)} <span className="text-sm text-slate-500">kg</span></h3>
                  </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between text-white">
                  <div className="flex items-center gap-2 text-slate-400 mb-4">
                    <Wallet className="w-4 h-4" />
                    <span className="text-xs font-bold">{isAr ? 'إجمالي الأرباح المتوقعة' : 'Total Expected Earnings'}</span>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-emerald-400">{formatCurrency(travelerTrips.reduce((acc, t) => acc + (t.status === 'SCHEDULED' || t.status === 'PENDING' || t.status === 'IN_TRANSIT' ? t.totalEarningsEstimated : 0), 0), 'USD')}</h3>
                  </div>
                </div>
              </div>
            </div>
          )}
"""

content = re.sub(
    r'\{\/\* Content Area \*\/\}\s*<main className="flex-1 min-w-0 overflow-y-auto bg-slate-50/50 p-4 md:p-6 pb-24 md:pb-6 space-y-6">',
    nudge_and_dashboard,
    content
)

with open('src/components/traveler/TravelerPortal.tsx', 'w') as f:
    f.write(content)
