import sys

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# Replace PaymentGateway type
content = content.replace(
    "useState<'CLIQ_JOR' | 'EDAHABIA_DZA' | 'CIB_DZA' | 'ESCROW_WALLET' | 'STRIPE_CARD'>('CLIQ_JOR');",
    "useState<'CLIQ_JOR' | 'EDAHABIA_DZA' | 'CIB_DZA' | 'ESCROW_WALLET' | 'STRIPE_CARD' | 'CASH_AT_HUB'>('CLIQ_JOR');"
)

# Add new states
state_insertion = """  const [parcelDescription, setParcelDescription] = useState('جهاز لوحي وحافظة إلكترونية وملحقاتها');
  const [parcelPhotoUrl, setParcelPhotoUrl] = useState('');
  const [insuranceRequested, setInsuranceRequested] = useState(false);"""
content = content.replace("  const [parcelDescription, setParcelDescription] = useState('جهاز لوحي وحافظة إلكترونية وملحقاتها');", state_insertion)

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
