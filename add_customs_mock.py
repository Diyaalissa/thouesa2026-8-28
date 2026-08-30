import re

with open('src/components/wallet/WalletDashboard.tsx', 'r') as f:
    content = f.read()

mock_tx_start = """        {
          id: 'tx-3',"""

new_tx = """        {
          id: 'tx-4',
          transactionCode: 'TXN-9985-CUS',
          walletId: wallet?.id || 'w-1',
          userId: currentUser.id,
          type: 'CUSTOMS_FEE',
          amount: -45.50,
          currency: 'USD',
          status: 'COMMITTED',
          createdAt: new Date(Date.now() - 43200000).toISOString(),
          relatedShipmentId: 'SHP-2024-8891',
          note: isAr ? 'رسوم التخليص الجمركي الرسمية' : 'Official Customs Clearance Fee',
          receiptUrl: 'https://example.com/receipt.jpg'
        },
"""

content = content.replace(mock_tx_start, new_tx + mock_tx_start)

with open('src/components/wallet/WalletDashboard.tsx', 'w') as f:
    f.write(content)

print("Added Customs Fee Mock")
