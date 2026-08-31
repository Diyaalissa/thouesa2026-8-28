import re

with open('src/components/traveler/TripManager.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "import { EditTripModal, CancelTripModal } from './TripEditCancelModals';",
    "import { EditTripModal, CancelTripModal, EmergencyCancelTripModal } from './TripEditCancelModals';"
)

state_declaration = """
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DOCUMENTS' | 'PACKAGES'>('OVERVIEW');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isPackingGuideOpen, setIsPackingGuideOpen] = useState(false);"""

new_state_declaration = """
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DOCUMENTS' | 'PACKAGES'>('OVERVIEW');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isEmergencyCancelOpen, setIsEmergencyCancelOpen] = useState(false);
  const [isPackingGuideOpen, setIsPackingGuideOpen] = useState(false);"""

content = content.replace(state_declaration, new_state_declaration)

old_emergency_button = """<button onClick={() => alert('Opening Emergency Support...')} className="flex items-center gap-2 px-3 py-1.5 text-rose-600 bg-rose-50 border border-rose-200 rounded-lg transition-colors text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>{isAr ? 'طلب إلغاء طارئ' : 'Emergency Cancel'}</span>
            </button>"""

new_emergency_button = """<button onClick={() => setIsEmergencyCancelOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-rose-600 bg-rose-50 border border-rose-200 rounded-lg transition-colors text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>{isAr ? 'طلب إلغاء طارئ' : 'Emergency Cancel'}</span>
            </button>"""

content = content.replace(old_emergency_button, new_emergency_button)


old_modals = """{isEditOpen && <EditTripModal trip={trip} isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} locale={locale} activeHubs={activeHubs} onSuccess={() => { setIsEditOpen(false); if(onRefreshData) onRefreshData(); }} />}
      {isCancelOpen && <CancelTripModal trip={trip} isOpen={isCancelOpen} onClose={() => setIsCancelOpen(false)} locale={locale} onSuccess={() => { setIsCancelOpen(false); onBack(); if(onRefreshData) onRefreshData(); }} />}
    </div>
  );
};"""

new_modals = """{isEditOpen && <EditTripModal trip={trip} isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} locale={locale} activeHubs={activeHubs} onSuccess={() => { setIsEditOpen(false); if(onRefreshData) onRefreshData(); }} />}
      {isCancelOpen && <CancelTripModal trip={trip} isOpen={isCancelOpen} onClose={() => setIsCancelOpen(false)} locale={locale} onSuccess={() => { setIsCancelOpen(false); onBack(); if(onRefreshData) onRefreshData(); }} />}
      {isEmergencyCancelOpen && <EmergencyCancelTripModal trip={trip} isOpen={isEmergencyCancelOpen} onClose={() => setIsEmergencyCancelOpen(false)} locale={locale} onSuccess={() => { setIsEmergencyCancelOpen(false); if(onRefreshData) onRefreshData(); }} />}
    </div>
  );
};"""

content = content.replace(old_modals, new_modals)

with open('src/components/traveler/TripManager.tsx', 'w') as f:
    f.write(content)

