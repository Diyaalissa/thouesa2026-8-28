import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# Try to remove handleDeposit block
pattern = r"const handleDeposit = async \(\) => \{.*?\n  \};\n"
content = re.sub(pattern, "", content, flags=re.DOTALL)

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
