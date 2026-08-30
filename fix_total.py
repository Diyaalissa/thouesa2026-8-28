import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

old_total = """<div className="flex justify-between font-bold text-white pt-3 border-t border-slate-800 text-base mt-2">
                <span>{isAr ? 'الإجمالي المطلوب الدفع:' : 'Total to Pay:'}</span>
                <span className="text-brand-400">
                  ${(
                    (Math.max(parcelEstimatedWeightKg, ((parcelLengthCm * parcelWidthCm * parcelHeightCm) / 5000)) * 12) +
                    (packagingRequested ? 5 : 0) +
                    (insuranceRequested ? (parcelDeclaredValue * 0.015) : 0) +
                    (deliveryType === 'HOME' ? 10 : 0)
                  ).toFixed(2)}
                </span>
              </div>"""

new_total = """<div className="flex justify-between font-bold text-white pt-3 border-t border-slate-800 text-base mt-2">
                <span>{isAr ? 'الإجمالي المطلوب الدفع:' : 'Total to Pay:'}</span>
                <span className="text-brand-400 flex items-center gap-2">
                  {paymentCurrency === 'RECIPIENT' ? (
                    <>
                      <span className="text-xs text-slate-500 line-through">${(
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
              </div>"""

content = content.replace(old_total, new_total)

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)

print("Patch applied for total currency")
