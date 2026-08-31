import re

with open('src/components/traveler/TravelerPortal.tsx', 'r') as f:
    content = f.read()

# Add import
if "import { MyBagWorkspace }" not in content:
    content = content.replace(
        "import { TripManager } from './TripManager';",
        "import { TripManager } from './TripManager';\nimport { MyBagWorkspace } from './MyBagWorkspace';"
    )

# The section starts with "{activeTab === 'MY_BAG' && (() => {"
# The section ends with "})()}" before "{activeTab === 'WALLET' && ("

start_str = "{activeTab === 'MY_BAG' && (() => {"
end_str = "{activeTab === 'WALLET' && ("

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    new_bag_section = """{activeTab === 'MY_BAG' && (() => {
            const activeTrip = travelerTrips.find(t => ['SCHEDULED', 'PENDING', 'PACKAGES_LINKED', 'ESCROW_LOCKED', 'IN_TRANSIT'].includes(t.status));
            if (!activeTrip) {
              return (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 text-center shadow-sm h-[60vh]">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-100">
                    <ShieldCheck className="w-12 h-12 text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-2">{isAr ? 'حقيبتك فارغة' : 'Your Bag is Empty'}</h3>
                  <p className="text-slate-500">{isAr ? 'لا توجد رحلات نشطة أو طرود مسندة إليك حالياً.' : 'You have no active trips or assigned parcels.'}</p>
                </div>
              );
            }

            // Real logic: We should filter by shipments linked to this trip.
            const manifest = manifests.find(m => m.tripId === activeTrip.id);
            const bagShipments = manifest ? shipments.filter(s => manifest.shipmentIds.includes(s.id)) : [];
            
            return (
              <MyBagWorkspace 
                trip={activeTrip} 
                shipments={bagShipments} 
                locale={locale} 
              />
            );
          })()}

          """
    content = content[:start_idx] + new_bag_section + content[end_idx:]

with open('src/components/traveler/TravelerPortal.tsx', 'w') as f:
    f.write(content)

