import sys
import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

cancel_func = """  const handleCancelShipment = async (shipmentId: string) => {
    try {
      const res = await safeFetchJson(`/api/shipments/${shipmentId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res?.success) {
        await fetchData();
        return true;
      }
      if (res?.error) {
        alert(res.error);
      }
      return false;
    } catch (err) {
      console.error('Shipment cancellation error:', err);
      return false;
    }
  };

  const handleApproveWeightDiscrepancy"""

content = content.replace("  const handleApproveWeightDiscrepancy", cancel_func)

# Also pass it to SenderPortal
props = """            onCreateShipment={handleCreateShipment}
            onCancelShipment={handleCancelShipment}
            onApproveWeightDiscrepancy={handleApproveWeightDiscrepancy}"""
            
content = content.replace("            onCreateShipment={handleCreateShipment}\n            onApproveWeightDiscrepancy={handleApproveWeightDiscrepancy}", props)

with open('src/App.tsx', 'w') as f:
    f.write(content)
