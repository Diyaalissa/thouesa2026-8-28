import re

with open('src/components/profile/UserProfile.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "export function UserProfile({ currentUser, locale, isAr }: UserProfileProps) {",
    "export function UserProfile({ currentUser, locale, isAr, onNavigate }: UserProfileProps) {\n  const hasPendingDispute = true;"
)

if "ChevronRight," not in content:
    content = content.replace("ShieldAlert, FileWarning, ExternalLink,", "ShieldAlert, FileWarning, ExternalLink, ChevronRight,")

with open('src/components/profile/UserProfile.tsx', 'w') as f:
    f.write(content)
