import re

with open('src/components/traveler/TripManager.tsx', 'r') as f:
    content = f.read()

inspection_notice = """              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
                <div className="bg-indigo-100 text-indigo-600 w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-indigo-900 text-sm">{isAr ? 'حق التفتيش والشفافية' : 'Right to Inspect'}</h4>
                  <p className="text-indigo-700 text-xs mt-1 leading-relaxed">
                    {isAr 
                      ? 'لك الحق المطلق في معاينة وتفتيش محتويات كافة الطرود في مكتبنا قبل استلامها لضمان راحتك النفسية والمسؤولية القانونية في المطار.' 
                      : 'You have the absolute right to inspect all parcels contents at our office before accepting custody to ensure your peace of mind and legal responsibility at the airport.'}
                  </p>
                </div>
              </div>"""

content = re.sub(
    r'(<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">)',
    inspection_notice + r'\n\n              \1',
    content
)

with open('src/components/traveler/TripManager.tsx', 'w') as f:
    f.write(content)
