import sys

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

if "import { motion } from" not in content and "<motion." in content:
    print("MOTION IS USED BUT NOT IMPORTED IN SenderPortal")

with open('src/components/traveler/TravelerPortal.tsx', 'r') as f:
    content = f.read()

if "import { motion } from" not in content and "<motion." in content:
    print("MOTION IS USED BUT NOT IMPORTED IN TravelerPortal")

