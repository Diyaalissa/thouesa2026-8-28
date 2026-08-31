import re

with open('src/components/traveler/TravelerPortal.tsx', 'r') as f:
    content = f.read()

# Replace the Add Flight button
old_btn = """            <button 
              onClick={() => setIsNewTripModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >"""
new_btn = """            <button 
              onClick={() => {
                if (currentUser.kycStatus === 'VERIFIED') {
                  setIsNewTripModalOpen(true);
                } else {
                  alert(isAr ? 'يرجى استكمال توثيق الحساب أولاً من صفحة حسابي.' : 'Please verify your account from the profile page first.');
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 text-white text-xs font-bold rounded-xl transition-colors shadow-sm ${currentUser.kycStatus === 'VERIFIED' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-400 cursor-not-allowed'}`}
            >"""

content = content.replace(old_btn, new_btn)

with open('src/components/traveler/TravelerPortal.tsx', 'w') as f:
    f.write(content)
