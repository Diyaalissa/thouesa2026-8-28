import re

with open('src/components/traveler/TripManager.tsx', 'r') as f:
    content = f.read()

reminder_banner = """      {/* 48h Pre-trip Reminder */}
      {trip.status === 'SCHEDULED' && (
        <div className="mx-4 md:mx-6 mt-4 mb-2 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="bg-amber-100 text-amber-600 w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-amber-900 text-sm">{isAr ? 'تذكير ما قبل الرحلة' : 'Pre-trip Reminder'}</h4>
            <p className="text-amber-700 text-xs mt-1 leading-relaxed">
              {isAr 
                ? 'يرجى التوجه إلى مكتبنا قبل موعد رحلتك بـ 48 ساعة كحد أقصى لمعاينة الطرود واستلامها.' 
                : 'Please visit our office at least 48 hours before your flight to inspect and accept custody of your parcels.'}
            </p>
          </div>
        </div>
      )}"""

# We'll insert it right after `<div className="flex-1 flex flex-col min-h-0 bg-slate-50">`
# Wait, let's see what the structure is.
content = re.sub(
    r'(<div className="flex-1 flex flex-col min-h-0 bg-slate-50">)',
    r'\1\n' + reminder_banner,
    content
)

with open('src/components/traveler/TripManager.tsx', 'w') as f:
    f.write(content)
