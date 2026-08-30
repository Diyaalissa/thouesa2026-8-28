import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "<UserProfile currentUser={currentUser} locale={locale} isAr={isAr} />",
    "<UserProfile currentUser={currentUser} locale={locale} isAr={isAr} onNavigate={(tab) => setActiveTab(tab as any)} />"
)

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
