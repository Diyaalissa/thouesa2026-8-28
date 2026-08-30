import sys

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

# 1. Add the import
if "import { WalletDashboard } from '../wallet/WalletDashboard';" not in content:
    content = content.replace("import { AgentChatModal } from '../common/AgentChatModal';", "import { AgentChatModal } from '../common/AgentChatModal';\nimport { WalletDashboard } from '../wallet/WalletDashboard';")

# 2. Replace the wallet section
# Search for `{activeTab === 'WALLET' && (` and its closing tag.
# It starts at around 658 and ends around 780.
import re

start_str = "{activeTab === 'WALLET' && ("
end_str = "               </div>\n            </div>\n          </div>\n        </div>\n      )}"

# A bit risky with regex, let's just find indices
start_idx = content.find(start_str)
# The block ends after the history map. 
# In the original, the block ends with "      )}" before `{activeTab === 'PROFILE' && (`
end_idx = content.find("{activeTab === 'PROFILE' && (")

if start_idx != -1 and end_idx != -1:
    wallet_block = content[start_idx:end_idx]
    
    new_wallet_block = """{activeTab === 'WALLET' && (
        <WalletDashboard currentUser={currentUser} wallet={wallet} locale={locale} />
      )}

      """
    content = content[:start_idx] + new_wallet_block + content[end_idx:]
    
with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
