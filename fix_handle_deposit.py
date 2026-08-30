import re

with open('src/components/wallet/WalletDashboard.tsx', 'r') as f:
    content = f.read()

old_func = """  const handleDeposit = async () => {
    if (depositAmount <= 0) return;
    setIsDepositing(true);
    
    setTimeout(() => {
      if (paymentMethod === 'BANK_TRANSFER') {
        alert(isAr ? 'تم إرسال إيصال التحويل للمراجعة.' : 'Transfer receipt submitted for review.');
      } else {
        alert(isAr ? 'تم شحن المحفظة بنجاح.' : 'Wallet topped up successfully.');
      }
      setIsDepositing(false);
      setDepositAmount(100);
    }, 1500);
  };"""

new_func = """  const handleDeposit = async () => {
    if (depositAmount <= 0) return;
    setIsDepositing(true);
    
    setTimeout(() => {
      if (paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'INSTANT_TRANSFER') {
        alert(isAr ? 'تم إرسال طلب الشحن وهو قيد المراجعة من الإدارة.' : 'Top-up request sent and is pending review by admin.');
      } else if (paymentMethod === 'CASH_OFFICE') {
        // Handled by UI instructions only
      } else {
        alert(isAr ? 'تم شحن المحفظة بنجاح.' : 'Wallet topped up successfully.');
      }
      setIsDepositing(false);
      setDepositAmount(100);
      setUploadingReceipt(false);
    }, 1500);
  };"""

content = content.replace(old_func, new_func)

with open('src/components/wallet/WalletDashboard.tsx', 'w') as f:
    f.write(content)

print("Updated handleDeposit.")
