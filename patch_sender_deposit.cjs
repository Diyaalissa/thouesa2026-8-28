const fs = require('fs');
let content = fs.readFileSync('src/components/sender/SenderPortal.tsx', 'utf8');

// 1. Add state for amount
if (!content.includes('const [depositAmount, setDepositAmount] = useState<number>(100);')) {
  content = content.replace("const [activeTab, setActiveTab] = useState", "const [depositAmount, setDepositAmount] = useState<number>(100);\n  const [isDepositing, setIsDepositing] = useState(false);\n  const [activeTab, setActiveTab] = useState");
}

// 2. Add handleDeposit method
const handleDepositStr = `
  const handleDeposit = async () => {
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
  };
`;

if (!content.includes('const handleDeposit = async ()')) {
  content = content.replace("const isAr = locale === 'ar';", "const isAr = locale === 'ar';\n" + handleDepositStr);
}

// 3. Connect UI
content = content.replace(
  `<input type="number" min="10" placeholder="100" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />`,
  `<input type="number" min="10" value={depositAmount} onChange={(e) => setDepositAmount(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />`
);

content = content.replace(
  `<button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-indigo-600/20 w-full md:w-auto">
                      {isAr ? 'متابعة الدفع' : 'Proceed to Payment'}
                    </button>`,
  `<button onClick={handleDeposit} disabled={isDepositing} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-indigo-600/20 w-full md:w-auto">
                      {isDepositing ? '...' : (isAr ? 'متابعة الدفع' : 'Proceed to Payment')}
                    </button>`
);

fs.writeFileSync('src/components/sender/SenderPortal.tsx', content);
