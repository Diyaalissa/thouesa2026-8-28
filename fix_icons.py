with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

content = content.replace("} from 'lucide-react';", "Globe, Receipt, Paperclip, } from 'lucide-react';")

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)

print("Icons fixed.")
