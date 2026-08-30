import sys
import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# Add paymentMethod state
if "const [paymentMethod, setPaymentMethod]" not in content:
    content = content.replace("const [depositAmount, setDepositAmount] = useState<number>(100);", "const [depositAmount, setDepositAmount] = useState<number>(100);\n  const [paymentMethod, setPaymentMethod] = useState('CARD');")

# Add currency logic
currency_logic = """  const isJordanian = currentUser.phone?.startsWith('+962');
  const isAlgerian = currentUser.phone?.startsWith('+213');
  const userCurrency = isJordanian ? 'JOD' : isAlgerian ? 'DZD' : 'USD';
  const currencySymbol = userCurrency === 'JOD' ? 'د.أ' : userCurrency === 'DZD' ? 'د.ج' : '$';
  
  const handleDeposit"""

if "const userCurrency =" not in content:
    content = content.replace("  const handleDeposit", currency_logic)

# Replace handleDeposit
old_handleDeposit = """  const handleDeposit = async () => {
    if (depositAmount <= 0) return;
    setIsDepositing(true);
    try {
      const res = await fetch('/api/wallets/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, employeeId: 'emp-amm-101', amount: depositAmount, currency: 'USD' })
      });
      if (res.ok) {
        alert(isAr ? 'تم شحن المحفظة بنجاح!' : 'Wallet topped up successfully!');
        // Refresh by reloading for now or calling a passed refresh method
        window.location.reload();
      }
    } catch(err) {
      console.error(err);
    }
    setIsDepositing(false);
  };"""

new_handleDeposit = """  const handleDeposit = async () => {
    if (depositAmount <= 0) return;
    setIsDepositing(true);
    const rateToUsd = userCurrency === 'JOD' ? (1 / 0.71) : userCurrency === 'DZD' ? (1 / 140) : 1;
    const amountInUsd = Number((depositAmount * rateToUsd).toFixed(2));
    try {
      const res = await fetch('/api/wallets/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, employeeId: 'emp-amm-101', amount: amountInUsd, currency: 'USD' })
      });
      if (res.ok) {
        alert(isAr ? `تم شحن المحفظة بنجاح بمبلغ ${depositAmount} ${currencySymbol} (ما يعادل ${amountInUsd} $)` : `Wallet topped up successfully with ${depositAmount} ${currencySymbol} (~$${amountInUsd})`);
        window.location.reload();
      }
    } catch(err) {
      console.error(err);
    }
    setIsDepositing(false);
  };"""
content = content.replace(old_handleDeposit, new_handleDeposit)


# Replace the Top Up section in UI
old_topup_ui = """                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">{isAr ? 'المبلغ ($)' : 'Amount ($)'}</label>
                      <input type="number" min="10" value={depositAmount} onChange={(e) => setDepositAmount(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">{isAr ? 'طريقة الدفع' : 'Payment Method'}</label>
                      <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm">
                        <option>{isAr ? 'بطاقة بنكية (Stripe)' : 'Credit Card (Stripe)'}</option>
                        <option>{isAr ? 'البطاقة الذهبية (الجزائر)' : 'Edahabia (Algeria)'}</option>
                        <option>{isAr ? 'إي فواتيركم (الأردن)' : 'eFawateerCom (Jordan)'}</option>
                      </select>
                    </div>
                  </div>"""

new_topup_ui = """                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">{isAr ? `المبلغ (${currencySymbol})` : `Amount (${currencySymbol})`}</label>
                      <input type="number" min="1" value={depositAmount} onChange={(e) => setDepositAmount(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">{isAr ? 'طريقة الدفع' : 'Payment Method'}</label>
                      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-brand-500">
                        <option value="CARD">{isAr ? 'البطاقة البنكية (Credit/Debit Card)' : 'Bank Card'}</option>
                        {isJordanian && (
                          <option value="INSTANT_TRANSFER">{isAr ? 'تحويل فوري (إي فواتيركم / كليك)' : 'Instant Transfer (CliQ / eFawateerCom)'}</option>
                        )}
                        {isAlgerian && (
                          <option value="INSTANT_TRANSFER">{isAr ? 'تحويل فوري (البطاقة الذهبية / بريدي موب)' : 'Instant Transfer (Edahabia / BaridiMob)'}</option>
                        )}
                        {!isJordanian && !isAlgerian && (
                          <option value="INSTANT_TRANSFER">{isAr ? 'تحويل فوري (Instant Transfer)' : 'Instant Transfer'}</option>
                        )}
                      </select>
                    </div>
                  </div>"""
content = content.replace(old_topup_ui, new_topup_ui)

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
