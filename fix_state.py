import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# Fix X duplicate
content = content.replace("X, } from 'lucide-react';", "} from 'lucide-react';")

# Fix line 257 filter
old_filter = ".filter((s) => selectedServiceFilter === 'ALL' || (s.serviceType || 'SEND_PARCEL') === selectedServiceFilter);"
new_filter = ";"
content = content.replace(old_filter, new_filter)

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)

print("Fixed state and imports.")
