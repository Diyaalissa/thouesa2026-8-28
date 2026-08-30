import sys

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# Replace PaymentGateway type if not done correctly, or add CASH_AT_HUB in UI

cash_button = """              <button
                type="button"
                onClick={() => setSelectedPaymentGateway('CASH_AT_HUB')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  selectedPaymentGateway === 'CASH_AT_HUB'
                    ? 'bg-blue-600/30 border-blue-500 text-white ring-1 ring-blue-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>💵 {isAr ? 'نقداً في المستودع' : 'Cash at Hub'}</span>
              </button>"""

content = content.replace("<span>🛡️ محفظة الضمان</span>\n              </button>", "<span>🛡️ محفظة الضمان</span>\n              </button>\n" + cash_button)

# Add Photo URL & Insurance fields
photo_insurance_fields = """          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">{isAr ? 'صورة للطرد (اختياري / رابط)' : 'Parcel Photo URL (Optional)'}</label>
              <input
                type="text"
                placeholder="https://example.com/photo.jpg"
                value={parcelPhotoUrl}
                onChange={(e) => setParcelPhotoUrl(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
            <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
              <input
                type="checkbox"
                checked={insuranceRequested}
                onChange={(e) => setInsuranceRequested(e.target.checked)}
                className="w-5 h-5 text-brand-500 rounded-md cursor-pointer"
                id="insuranceCheckbox"
              />
              <label htmlFor="insuranceCheckbox" className="text-xs font-semibold text-slate-300 cursor-pointer">
                {isAr ? 'أرغب في تأمين الشحنة (رسوم إضافية)' : 'Request Insurance (Extra Fee)'}
              </label>
            </div>
          </div>"""

content = content.replace("            />\n          </div>\n\n          {/* Live Quote Breakdown Card */}", "            />\n          </div>\n\n" + photo_insurance_fields + "\n\n          {/* Live Quote Breakdown Card */}")

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
