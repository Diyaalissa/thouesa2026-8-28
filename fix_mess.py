import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# Revert all "import { ClipboardPaste," back to "import {"
content = content.replace("import { ClipboardPaste,", "import {")

# Add it safely to lucide-react ONLY
content = re.sub(r'(import \{.*?)(?= \} from \x27lucide-react\x27)', r'\1, ClipboardPaste', content, flags=re.DOTALL)

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
