import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# Add import if missing
if "import { SenderOverview } from './SenderOverview';" not in content:
    content = content.replace("import { UserProfile } from '../profile/UserProfile';", "import { UserProfile } from '../profile/UserProfile';\nimport { SenderOverview } from './SenderOverview';")

# Find the main tag
main_tag = '<main className="flex-1 min-w-0 overflow-y-auto bg-slate-50/50 p-6 space-y-6">'

overview_render = """
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'OVERVIEW' && (
              <SenderOverview 
                currentUser={currentUser} 
                walletBalance={wallet?.balance || 0}
                activeShipmentsCount={shipments.filter(s => s.currentStatus !== 'DELIVERED' && s.currentStatus !== 'CANCELLED').length}
                onNavigate={(tab) => setActiveTab(tab as any)}
                isAr={isAr}
                shipments={shipments}
              />
            )}
"""

if "activeTab === 'OVERVIEW'" not in content[content.find(main_tag):]:
    content = content.replace(main_tag, main_tag + overview_render)
    
    # We also need to close the AnimatePresence and motion.div at the end of the tabs.
    # The last tab seems to be MY_SHIPMENTS or similar. Let's just find the end of the <main> block.
    # The end of the main block is `</main>`
    
    content = content.replace("</main>", "          </motion.div>\n        </AnimatePresence>\n      </main>")

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
