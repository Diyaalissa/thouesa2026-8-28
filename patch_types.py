import re

with open('src/types/index.ts', 'r') as f:
    content = f.read()

old_status = """export type TripStatus =
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'ESCROW_LOCKED'
  | 'ESCROW_PAID'
  | 'DISPATCHED'
  | 'IN_FLIGHT'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DELAYED'
  | 'EMERGENCY_UNASSIGNED';"""

new_status = """export type TripStatus =
  | 'SCHEDULED'
  | 'CHECKED_IN'
  | 'PACKAGES_LINKED'
  | 'ESCROW_LOCKED'
  | 'IN_TRANSIT'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EMERGENCY_UNASSIGNED'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'ESCROW_PAID'
  | 'DISPATCHED'
  | 'IN_FLIGHT'
  | 'ARRIVED'
  | 'DELAYED';"""

content = content.replace(old_status, new_status)

# Let's also add priorityLevel to User interface if it isn't there
if 'priorityLevel?:' not in content:
    content = content.replace(
        "role: UserRole;",
        "role: UserRole;\n  priorityLevel?: 'NEW' | 'SILVER' | 'GOLD';"
    )

with open('src/types/index.ts', 'w') as f:
    f.write(content)

