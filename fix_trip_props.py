import re

with open('src/components/traveler/TravelerPortal.tsx', 'r') as f:
    content = f.read()

# Replace the TripManager block in MY_TRIPS
old_trip_manager = """              <TripManager
                trip={travelerTrips.find(t => t.id === activeTripId)!}
                manifests={manifests}
                shipments={shipments}
                locale={locale}
                activeHubs={hubs}
                onBack={() => setActiveTripId(null)}
                onLockEscrow={async () => true}
                onEmergencyUnassign={async (tripId, reason) => {
                  console.log('Emergency unassign', tripId, reason);
                  return true;
                }}
              />"""

new_trip_manager = """              <TripManager
                trip={travelerTrips.find(t => t.id === activeTripId)!}
                manifests={manifests}
                shipments={shipments || []}
                locale={locale}
                activeHubs={hubs}
                onBack={() => setActiveTripId(null)}
                onLockEscrow={async (tripId) => {
                  await onLockEscrow(tripId);
                  return true;
                }}
                onEmergencyUnassign={async (tripId, reason) => {
                  setEmergencyTripId(tripId);
                  setEmergencyReason(reason);
                  return true;
                }}
                onOpenQR={(trip) => {
                  const m = manifests.find(m => m.tripId === trip.id);
                  if (m) {
                    setSelectedQRManifest(m);
                  }
                }}
                onViewInspection={(shipment) => {
                  setSelectedShipmentForProof(shipment);
                }}
              />"""

content = content.replace(old_trip_manager, new_trip_manager)

with open('src/components/traveler/TravelerPortal.tsx', 'w') as f:
    f.write(content)
