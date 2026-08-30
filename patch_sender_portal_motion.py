import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# Add framer-motion import if not present
if "from 'motion/react'" not in content:
    content = content.replace("import React, { useState", "import React, { useState, useEffect } from 'react';\nimport { motion, AnimatePresence } from 'motion/react';\n//")
    # need to clean up double imports if React was imported

# Replace main tab rendering
# Find:
#           <div className="p-4 md:p-8 max-w-7xl mx-auto">
#             {activeTab === 'OVERVIEW' && (
#
# Replace with AnimatePresence and motion.div

old_tabs = """          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {activeTab === 'OVERVIEW' && ("""

new_tabs = """          <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'OVERVIEW' && ("""

content = content.replace(old_tabs, new_tabs)

# Also need to close it. Find:
#       {waybillModalShipment && (
# And inject `</motion.div>\n            </AnimatePresence>` before closing divs of main.
# actually, the closing tags for main content look like this:
#             {activeTab === 'PROFILE' && (
#               <div className="bg-white p-6 rounded-3xl border border-slate-200">
#                 <h2 className="text-xl font-bold mb-4">{isAr ? 'الملف الشخصي' : 'Profile'}</h2>
#                 <p className="text-slate-500">{isAr ? 'قريباً...' : 'Coming soon...'}</p>
#               </div>
#             )}
#           </div>
#         </main>

content = content.replace(
"""              </div>
            )}
          </div>
        </main>""",
"""              </div>
            )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>"""
)

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
