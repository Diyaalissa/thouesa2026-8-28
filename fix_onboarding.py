import re

with open('src/components/traveler/TravelerOnboarding.tsx', 'r') as f:
    content = f.read()

content = content.replace('min-h-screen', '')
content = content.replace('flex-1 flex flex-col items-center p-4 md:p-6 bg-slate-50', 'w-full flex flex-col items-center bg-transparent')

with open('src/components/traveler/TravelerOnboarding.tsx', 'w') as f:
    f.write(content)
