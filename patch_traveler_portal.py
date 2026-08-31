import re

with open('src/components/traveler/TravelerPortal.tsx', 'r') as f:
    content = f.read()

# Add tripsFilter state
state_search = "const [activeTab, setActiveTab] = useState<'MY_TRIPS' | 'MY_BAG' | 'WALLET' | 'PROFILE'>('MY_TRIPS');"
state_replace = state_search + "\n  const [tripsFilter, setTripsFilter] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');"
content = content.replace(state_search, state_replace)

# Modify the trips list area
old_trips_header = """<div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'قائمة رحلات الطيران وسعات الأمتعة المسجلة' : 'Registered Flights & Allocated Luggage'}
            </h3>"""

new_trips_header = """<div className="flex items-center justify-between">
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
            </div>"""
content = content.replace(old_trips_header, new_trips_header)

old_map = "{travelerTrips.map((trip) => {"
new_map = """{travelerTrips.filter(t => tripsFilter === 'ACTIVE' ? !['COMPLETED', 'CANCELLED'].includes(t.status) : ['COMPLETED', 'CANCELLED'].includes(t.status)).map((trip) => {"""
content = content.replace(old_map, new_map)


with open('src/components/traveler/TravelerPortal.tsx', 'w') as f:
    f.write(content)

