import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

content = content.replace("import {", "import { ClipboardPaste,")

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
