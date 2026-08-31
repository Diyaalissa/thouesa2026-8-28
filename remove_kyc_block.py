import re

with open('src/components/traveler/TravelerPortal.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r"  if \(localKycStatus === 'UNVERIFIED' \|\| localKycStatus === 'PENDING'\) \{.*?  \}",
    "",
    content,
    flags=re.DOTALL
)

with open('src/components/traveler/TravelerPortal.tsx', 'w') as f:
    f.write(content)
