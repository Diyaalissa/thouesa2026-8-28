import re

with open('src/components/traveler/TravelerPortal.tsx', 'r') as f:
    content = f.read()

# Add import
import_pattern = "import { EditTripModal, CancelTripModal } from './TripEditCancelModals';"
if import_pattern in content:
    content = content.replace(import_pattern, import_pattern + "\nimport { TravelerOnboarding } from './TravelerOnboarding';")

# Add early return for KYC
render_pattern = """  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;"""

kyc_logic = """  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [localKycStatus, setLocalKycStatus] = useState(currentUser.kycStatus || 'UNVERIFIED');

  if (localKycStatus === 'UNVERIFIED' || localKycStatus === 'PENDING') {
    return (
      <TravelerOnboarding 
        currentUser={{...currentUser, kycStatus: localKycStatus}} 
        locale={locale} 
        onSubmit={async (data) => {
          setLocalKycStatus('PENDING');
          onRefreshData();
        }}
      />
    );
  }"""

content = content.replace(render_pattern, kyc_logic)

with open('src/components/traveler/TravelerPortal.tsx', 'w') as f:
    f.write(content)
