import re

with open('src/components/traveler/TravelerPortal.tsx', 'r') as f:
    content = f.read()

# Add import
if "import { BoardingPassCard }" not in content:
    content = content.replace(
        "import { TripManager } from './TripManager';",
        "import { TripManager } from './TripManager';\nimport { BoardingPassCard } from './BoardingPassCard';"
    )

my_trips_section = """
          {activeTab === 'MY_TRIPS' && (
            activeTripId ? (
              <TripManager
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
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 p-1 bg-slate-200/50 rounded-xl overflow-x-auto">
                    <button 
                      onClick={() => setTripsFilter('ACTIVE')}
                      className={`py-2 px-4 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${tripsFilter === 'ACTIVE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {isAr ? 'نشطة وقادمة' : 'Active & Upcoming'}
                    </button>
                    <button 
                      onClick={() => setTripsFilter('HISTORY')}
                      className={`py-2 px-4 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${tripsFilter === 'HISTORY' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {isAr ? 'سجل الرحلات' : 'History'}
                    </button>
                  </div>
                  <button 
                    onClick={() => setIsNewTripModalOpen(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-colors"
                  >
                    <Plane className="w-4 h-4" />
                    <span>{isAr ? 'إضافة رحلة' : 'Add Flight'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {travelerTrips.filter(t => tripsFilter === 'ACTIVE' ? !['COMPLETED', 'CANCELLED'].includes(t.status) : ['COMPLETED', 'CANCELLED'].includes(t.status)).map((trip) => {
                    const originHub = hubs?.find((h) => h.id === trip.originHubId) || HUBS_DATA.find((h) => h.id === trip.originHubId);
                    const destHub = hubs?.find((h) => h.id === trip.destinationHubId) || HUBS_DATA.find((h) => h.id === trip.destinationHubId);

                    return (
                      <div
                        key={trip.id}
                        className="transition-transform hover:-translate-y-1 cursor-pointer"
                        onClick={() => setActiveTripId(trip.id)}
                      >
                        <BoardingPassCard 
                          trip={trip} 
                          originHub={originHub} 
                          destHub={destHub} 
                          locale={locale} 
                        />
                      </div>
                    );
                  })}
                  
                  {travelerTrips.filter(t => tripsFilter === 'ACTIVE' ? !['COMPLETED', 'CANCELLED'].includes(t.status) : ['COMPLETED', 'CANCELLED'].includes(t.status)).length === 0 && (
                    <div className="col-span-1 xl:col-span-2 py-12 text-center text-slate-400">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Plane className="w-8 h-8 text-slate-300" />
                      </div>
                      <p>{isAr ? 'لا توجد رحلات في هذا السجل.' : 'No trips in this record.'}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
"""

content = content.replace("{activeTab === 'WALLET' && (", my_trips_section + "\n          {activeTab === 'WALLET' && (")

with open('src/components/traveler/TravelerPortal.tsx', 'w') as f:
    f.write(content)
