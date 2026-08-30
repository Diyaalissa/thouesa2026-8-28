import sys

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()
    
# Find the mess and replace it
import re
content = re.sub(r"\{\['PENDING', 'PENDING_REVIEW'\].includes.*\(", "{['PENDING', 'PENDING_REVIEW'].includes(selectedShipment.currentStatus) && (", content)

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
