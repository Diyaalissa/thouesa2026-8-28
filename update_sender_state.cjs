const fs = require('fs');

let content = fs.readFileSync('src/components/sender/SenderPortal.tsx', 'utf8');

const stateInjection = `  const [disputeReason, setDisputeReason] = useState<'DAMAGED_ITEM' | 'TAMPERED_SEAL' | 'MISSING_PACKAGE' | 'FLIGHT_DELAY_EXTREME' | 'PROHIBITED_GOODS_DISCOVERED'>('DAMAGED_ITEM');
  const [disputeClaimAmount, setDisputeClaimAmount] = useState<number>(0);
  const [disputeDescription, setDisputeDescription] = useState('');
  const [disputePhotoUrl, setDisputePhotoUrl] = useState('');
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);

  const handleInlineDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;
    setDisputeError(null);
    setDisputeSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(locale === 'ar' ? 'تم تسجيل النزاع بنجاح وتجميد الضمان.' : 'Dispute filed successfully and escrow locked.');
      // Reset form or update shipment state
      setDisputeDescription('');
      setDisputePhotoUrl('');
    } catch (err) {
      setDisputeError(locale === 'ar' ? 'فشل تسجيل النزاع.' : 'Failed to file dispute.');
    } finally {
      setDisputeSubmitting(false);
    }
  };
`;

if (!content.includes('const [disputeReason, setDisputeReason]')) {
    content = content.replace('const [disputeModalOpen, setDisputeModalOpen] = useState(false);', 'const [disputeModalOpen, setDisputeModalOpen] = useState(false);\n' + stateInjection);
}

if (!content.includes('Camera,')) {
    content = content.replace('AlertTriangle,', 'AlertTriangle, Camera,');
} else if (!content.includes('Camera') && content.includes('lucide-react')) {
    content = content.replace('AlertTriangle }', 'AlertTriangle, Camera }');
}

fs.writeFileSync('src/components/sender/SenderPortal.tsx', content);
