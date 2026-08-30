import re

with open('src/components/profile/UserProfile.tsx', 'r') as f:
    content = f.read()

# Add onNavigate to props
content = content.replace(
    "interface UserProfileProps {\n  currentUser: User;\n  locale: 'en' | 'ar';\n  isAr: boolean;\n}",
    "interface UserProfileProps {\n  currentUser: User;\n  locale: 'en' | 'ar';\n  isAr: boolean;\n  onNavigate?: (tab: string) => void;\n}"
)

# Also replace in the component signature
content = content.replace(
    "export const UserProfile = ({ currentUser, locale, isAr }: UserProfileProps) => {",
    "export const UserProfile = ({ currentUser, locale, isAr, onNavigate }: UserProfileProps) => {\n  const hasPendingDispute = true; // For UI display"
)

# I want to add the Disputes button inside the Security & Privacy or Support & Legal section, or create a new section.
# The user said: "قائمة أنيقة تحتوي على: النزاعات والشكاوى (مركز إدارة التذاكر)."
# Let's add it right before Support & Legal

disputes_section = """
      {/* 6.5. Disputes & Complaints */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          {isAr ? 'النزاعات والشكاوى' : 'Disputes & Complaints'}
        </h3>
        
        <button
          onClick={() => onNavigate?.('DISPUTES')}
          className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group relative overflow-hidden"
        >
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center relative">
              <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400" />
              {hasPendingDispute && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full animate-pulse"></span>
              )}
            </div>
            <div className="text-start">
              <span className="text-base font-bold text-slate-800 dark:text-white block">{isAr ? 'مركز إدارة التذاكر' : 'Ticket Management Center'}</span>
              <span className="text-xs text-slate-500 mt-1 block">{isAr ? 'متابعة الشكاوى والنزاعات المفتوحة' : 'Track open complaints and disputes'}</span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 rtl:rotate-180 relative z-10" />
        </button>
      </div>

      {/* 7. Support & Legal */}
"""

content = content.replace("{/* 7. Support & Legal */}", disputes_section)

# Ensure icons are imported
if "AlertTriangle" not in content:
    content = content.replace("ShieldAlert,", "ShieldAlert, AlertTriangle, ChevronRight,")

with open('src/components/profile/UserProfile.tsx', 'w') as f:
    f.write(content)
