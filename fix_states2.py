import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

states_to_add = """  const [intlCustomsAgreed, setIntlCustomsAgreed] = useState(false);
  const [intlWizardStep, setIntlWizardStep] = useState(1);
"""

if 'const [intlWizardStep, setIntlWizardStep]' not in content:
    content = content.replace("  const [isSubmitting, setIsSubmitting] = useState(false);", "  const [isSubmitting, setIsSubmitting] = useState(false);\n" + states_to_add)

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
