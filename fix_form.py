import re

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

prefix_pattern = r"(.*?)\{\/\*\s*Option 1:\s*Send Personal Parcel\s*\*\/\}"
prefix_match = re.search(r"(.*?)\{activeTab === 'SEND_PARCEL' && \(", content, re.DOTALL)
prefix = prefix_match.group(1) if prefix_match else ""

suffix_pattern = r"(\{/\* 3\. OPTION 2 WIZARD: BUY FROM INTERNATIONAL STORES \*/\}.*)"
suffix_match = re.search(suffix_pattern, content, re.DOTALL)
suffix = suffix_match.group(1) if suffix_match else ""

with open('/tmp/new_send_parcel.tsx', 'r') as f:
    middle = f.read()

if prefix and suffix and middle:
    with open('src/components/sender/SenderPortal.tsx', 'w') as f:
        f.write(prefix + middle + suffix)
    print("Fix applied successfully!")
else:
    print("Error finding boundaries.")
    if not prefix: print("prefix missing")
    if not suffix: print("suffix missing")
    if not middle: print("middle missing")
