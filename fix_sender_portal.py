import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# Pass shipments down
content = content.replace("<WalletDashboard currentUser={currentUser} wallet={wallet} locale={locale} />", "<WalletDashboard currentUser={currentUser} wallet={wallet} locale={locale} shipments={senderShipments} />")

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)

print("Updated SenderPortal.tsx")
