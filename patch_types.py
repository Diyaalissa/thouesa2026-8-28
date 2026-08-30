import sys

with open('src/types/index.ts', 'r') as f:
    content = f.read()

content = content.replace("export type ShipmentStatus =\\n  | 'DRAFT'\\n  | 'PENDING_HUB_DROPOFF'", "export type ShipmentStatus =\\n  | 'DRAFT'\\n  | 'PENDING'\\n  | 'PENDING_REVIEW'\\n  | 'PENDING_HUB_DROPOFF'")

with open('src/types/index.ts', 'w') as f:
    f.write(content)
