import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'className={`shrink-0 flex flex-col bg-white',
    'className={`hidden md:flex shrink-0 flex-col bg-white'
)

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
