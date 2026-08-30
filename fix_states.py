import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

states_to_add = """  const [intlCustomsAgreed, setIntlCustomsAgreed] = useState(false);
  const [intlWizardStep, setIntlWizardStep] = useState(1);
"""

if 'intlCustomsAgreed' not in content:
    content = content.replace("  const [prohibitedAgreed, setProhibitedAgreed] = useState(false);", "  const [prohibitedAgreed, setProhibitedAgreed] = useState(false);\n" + states_to_add)

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
