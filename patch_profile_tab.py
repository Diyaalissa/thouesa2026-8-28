import re

with open('src/components/traveler/TravelerPortal.tsx', 'r') as f:
    content = f.read()

profile_block = """      {activeTab === 'PROFILE' && (
        <div className="space-y-6">
          {(currentUser.kycStatus === 'UNVERIFIED' || currentUser.kycStatus === 'PENDING') && (
            <TravelerOnboarding 
              currentUser={currentUser} 
              locale={locale} 
              onSubmit={async (data) => {
                onRefreshData();
              }}
            />
          )}
          <UserProfile currentUser={currentUser} locale={locale} isAr={isAr} />
        </div>
      )}"""

content = re.sub(
    r"\{\s*activeTab === 'PROFILE' && \(\s*<UserProfile currentUser=\{currentUser\} locale=\{locale\} isAr=\{isAr\} \/>\s*\)\s*\}",
    profile_block,
    content
)

with open('src/components/traveler/TravelerPortal.tsx', 'w') as f:
    f.write(content)
