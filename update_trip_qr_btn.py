import re

with open('src/components/traveler/TripManager.tsx', 'r') as f:
    content = f.read()

qr_btn = """            {!trip.isEscrowPaid ? (
              <button
                onClick={() => onLockEscrow(trip.id)}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>{isAr ? 'حجز الضمان ($' + trip.requiredEscrowDeposit + ')' : 'Lock Escrow Hold ($' + trip.requiredEscrowDeposit + ')'}</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenQR(trip)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>{trip.status === 'SCHEDULED' || trip.status === 'PENDING' ? (isAr ? 'QR استلام الأمانات' : 'Accept Custody QR') : (isAr ? 'QR تسليم الطرود' : 'Handover QR')}</span>
              </button>
            )}"""

content = re.sub(
    r'\{\!trip\.isEscrowPaid \?\s*\(\s*<button.*?onClick=\{\(\) => onLockEscrow.*?<\/button>\s*\)\s*:\s*\(\s*<button.*?onClick=\{\(\) => onOpenQR.*?<\/button>\s*\)\}',
    qr_btn,
    content,
    flags=re.DOTALL
)

with open('src/components/traveler/TripManager.tsx', 'w') as f:
    f.write(content)
