import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# Add ClipboardPaste to lucide-react imports if not there
if 'ClipboardPaste' not in content:
    content = re.sub(r'(import \{.*?)(?= \} from \x27lucide-react\x27)', r'\1, ClipboardPaste', content, flags=re.DOTALL)

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
