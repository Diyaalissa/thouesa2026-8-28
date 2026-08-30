import sys

with open('src/components/sender/SenderPortal.tsx', 'r') as f:
    content = f.read()

props_def = """  onCreateShipment: (payload: any) => Promise<boolean>;
  onCancelShipment: (shipmentId: string) => Promise<boolean>;
  onApproveWeightDiscrepancy: (shipmentId: string, action: 'APPROVE' | 'REJECT') => Promise<void>;"""
content = content.replace("  onCreateShipment: (payload: any) => Promise<boolean>;\n  onApproveWeightDiscrepancy: (shipmentId: string, action: 'APPROVE' | 'REJECT') => Promise<void>;", props_def)

destruct = """  onRefreshShipments,
  onCreateShipment,
  onCancelShipment,
  onApproveWeightDiscrepancy,"""
content = content.replace("  onRefreshShipments,\n  onCreateShipment,\n  onApproveWeightDiscrepancy,", destruct)

with open('src/components/sender/SenderPortal.tsx', 'w') as f:
    f.write(content)
