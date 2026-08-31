import re

with open('src/components/traveler/TravelerPortal.tsx', 'r') as f:
    content = f.read()

my_trips_header = """      {activeTab === 'MY_TRIPS' && !activeTripId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'قائمة رحلات الطيران وسعات الأمتعة المسجلة' : 'Registered Flights & Allocated Luggage'}
            </h3>
            <button 
              onClick={() => setIsNewTripModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isAr ? 'إضافة رحلة' : 'Add Flight'}</span>
            </button>
          </div>"""

content = re.sub(
    r"\{\s*activeTab === 'MY_TRIPS' && !activeTripId && \(\s*<div className=\"space-y-4\">\s*<h3 className=\"text-xs font-bold text-slate-500 uppercase tracking-wider\">\s*\{isAr \? 'قائمة رحلات الطيران وسعات الأمتعة المسجلة' : 'Registered Flights & Allocated Luggage'\}\s*<\/h3>",
    my_trips_header,
    content,
    flags=re.DOTALL
)

with open('src/components/traveler/TravelerPortal.tsx', 'w') as f:
    f.write(content)
