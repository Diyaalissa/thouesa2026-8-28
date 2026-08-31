import re

with open('src/components/traveler/TravelerPortal.tsx', 'r') as f:
    content = f.read()

content = content.replace("  XCircle, User as UserIcon,", "  XCircle, User as UserIcon, Bell, Info, ShieldAlert, RefreshCw, Zap, MessageCircle,")

with open('src/components/traveler/TravelerPortal.tsx', 'w') as f:
    f.write(content)
