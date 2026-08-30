import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# Just put it at the very top of lucide-react imports if not there
if "ClipboardPaste" not in content:
    content = content.replace("import {", "import { ClipboardPaste,", 1) # replace ONLY FIRST occurrence

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
