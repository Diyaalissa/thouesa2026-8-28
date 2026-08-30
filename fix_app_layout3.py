import sys
with open('src/App.tsx', 'r') as f:
    content = f.read()
import re
new_content = re.sub(r"<main className=\{\`flex-1 w-full mx-auto flex flex-col \$\{\['PUBLIC', 'LEGAL'\]\.includes\(currentRole\) \? 'max-w-7xl px-4 py-6' : 'p-0'\}\`\}>", r"<main className={`flex-1 w-full mx-auto flex flex-col min-h-0 ${['PUBLIC', 'LEGAL'].includes(currentRole) ? 'max-w-7xl px-4 py-6 overflow-visible' : 'p-0 overflow-hidden'}`}>", content)
with open('src/App.tsx', 'w') as f:
    f.write(new_content)
