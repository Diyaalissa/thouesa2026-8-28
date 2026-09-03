import React, { useState } from 'react';
import {
  Hub,
  Locale,
  Manifest,
  Shipment,
  Trip,
  User as UserType,
  Dispute,
  EmployeeNavSection,
  ShippingRate,
  RateHistoryEntry,
  OperationalIncident,
  IncidentStatus,
  DailyExchangeRate,
  SettlementRecord,
} from '../../types';
import { QRScannerModal } from '../common/QRScannerModal';
import { EmployeeTopbar } from './layout/EmployeeTopbar';
import { EmployeeSidebar } from './layout/EmployeeSidebar';
import { OperationsDashboardView } from './views/OperationsDashboardView';
import { OriginHubIntakeView } from './views/OriginHubIntakeView';
import { InspectionWeightView } from './views/InspectionWeightView';
import { ReadyForTransportView } from './views/ReadyForTransportView';
import { TripVerificationView } from './views/TripVerificationView';
import { VerifiedTripsView } from './views/VerifiedTripsView';
import { MatchingView } from './views/MatchingView';
import { ManifestsView } from './views/ManifestsView';
import { TravelerHandoverView } from './views/TravelerHandoverView';
import { DestinationIntakeView } from './views/DestinationIntakeView';
import { PickupPreparationView } from './views/PickupPreparationView';
import { FinalDeliveryView } from './views/FinalDeliveryView';
import { PricingCalculatorView } from './views/PricingCalculatorView';
import { CurrencySettlementView } from './views/CurrencySettlementView';
import { IncidentsDisputesView } from './views/IncidentsDisputesView';
import { AuditLogsView } from './views/AuditLogsView';
import { ShippingRatesView } from './views/ShippingRatesView';
import { RateHistoryView } from './views/RateHistoryView';
import { OperationalIncidentsView } from './views/OperationalIncidentsView';
import { GlobalSearchView } from './views/GlobalSearchView';
import { CustomerPaymentsView } from './views/CustomerPaymentsView';
import { TravelerSettlementsView } from './views/TravelerSettlementsView';
import { ExchangeRatesView } from './views/ExchangeRatesView';
import { SettlementHistoryView } from './views/SettlementHistoryView';
import {
  INITIAL_SHIPPING_RATES,
  INITIAL_RATE_HISTORY,
  INITIAL_INCIDENTS,
  INITIAL_DAILY_EXCHANGE_RATES,
  INITIAL_SETTLEMENTS,
} from '../../lib/hubOperationsData';

export interface HubPortalProps {
  currentUser: UserType;
  currentHub: Hub;
  shipments: Shipment[];
  trips: Trip[];
  manifests: Manifest[];
  disputes?: Dispute[];
  locale: Locale;
  onSelectHub: (hubId: string) => void;
  onReceivePackage?: (shipmentId: string, notes?: string) => Promise<boolean>;
  onInspectShipment: (payload: any) => Promise<boolean>;
  onCreateManifest: (payload: any) => Promise<boolean>;
  onHandoverDispatch: (payload: any) => Promise<boolean>;
  onDestinationIntake: (payload: any) => Promise<boolean>;
  onDeliverToRecipient: (payload: any) => Promise<boolean>;
  onRefreshData: () => void;
}

export const HubPortal: React.FC<HubPortalProps> = ({
  currentUser,
  currentHub,
  shipments,
  trips,
  manifests,
  disputes = [],
  locale,
  onSelectHub,
  onReceivePackage,
  onInspectShipment,
  onCreateManifest,
  onHandoverDispatch,
  onDestinationIntake,
  onDeliverToRecipient,
  onRefreshData,
}) => {
  const [currentLocale, setCurrentLocale] = useState<Locale>(locale);
  const [activeSection, setActiveSection] = useState<EmployeeNavSection>('OPERATIONS_DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [searchQueryParam, setSearchQueryParam] = useState('');

  // Operational State
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>(INITIAL_SHIPPING_RATES);
  const [rateHistory, setRateHistory] = useState<RateHistoryEntry[]>(INITIAL_RATE_HISTORY);
  const [operationalIncidents, setOperationalIncidents] = useState<OperationalIncident[]>(INITIAL_INCIDENTS);
  const [exchangeRates, setExchangeRates] = useState<DailyExchangeRate[]>(INITIAL_DAILY_EXCHANGE_RATES);
  const [settlements, setSettlements] = useState<SettlementRecord[]>(INITIAL_SETTLEMENTS);

  // Compute operational badge counts for current hub
  const hubShipments = shipments.filter((s) => s.originHubId === currentHub.id || !s.originHubId);
  const awaitingIntakeCount = hubShipments.filter(
    (s) => s.currentStatus === 'SUBMITTED' || s.currentStatus === 'AWAITING_HUB_DROP'
  ).length;

  const needsInspectionCount = hubShipments.filter(
    (s) => s.currentStatus === 'RECEIVED_AT_ORIGIN_HUB' || s.currentStatus === 'VERIFIED'
  ).length;

  const readyForTransportCount = hubShipments.filter(
    (s) =>
      s.currentStatus === 'INSPECTED_AND_SEALED' ||
      s.currentStatus === 'INSPECTED_SEALED' ||
      s.currentStatus === 'ASSIGNED_TO_TRIP'
  ).length;

  const pendingTripsVerificationCount = trips.filter(
    (t) => (t.originHubId === currentHub.id || !t.originHubId) && (t.status === 'SUBMITTED' || t.status === 'PENDING')
  ).length;

  const incomingDestinationCount = shipments.filter(
    (s) =>
      s.destinationHubId === currentHub.id &&
      (s.currentStatus === 'IN_TRANSIT' ||
        s.currentStatus === 'IN_TRANSIT_AIR' ||
        s.currentStatus === 'IN_FLIGHT' ||
        s.currentStatus === 'CUSTOMS_CLEARANCE')
  ).length;

  const readyForPickupCount = shipments.filter(
    (s) => s.destinationHubId === currentHub.id && s.currentStatus === 'READY_FOR_PICKUP'
  ).length;

  const activeIncidentsCount = operationalIncidents.filter(
    (i) => i.status === 'OPEN' || i.status === 'ACTION_REQUIRED'
  ).length;

  const handleQuickSearch = (query: string) => {
    setSearchQueryParam(query);
    setActiveSection('GLOBAL_SEARCH');
  };

  const handleScanResult = (token: string) => {
    setScannerOpen(false);
    handleQuickSearch(token);
  };

  const toggleLanguage = () => {
    setCurrentLocale((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const handleSaveRate = (newRateData: Partial<ShippingRate>) => {
    const newRate: ShippingRate = {
      id: `RATE-${Date.now().toString().slice(-4)}`,
      originCountry: newRateData.originCountry || 'JO',
      destinationCountry: newRateData.destinationCountry || 'DZ',
      serviceType: newRateData.serviceType || 'SEND_PARCEL',
      rateType: 'CUSTOMER_SHIPPING',
      pricingModel: newRateData.pricingModel || 'PER_KG',
      currency: newRateData.currency || 'JOD',
      ratePerKg: newRateData.ratePerKg || 7.5,
      minimumCharge: newRateData.minimumCharge || 5,
      minimumBillableWeightKg: newRateData.minimumBillableWeightKg || 0.5,
      tiers: newRateData.tiers,
      effectiveFrom: newRateData.effectiveFrom || new Date().toISOString(),
      status: 'ACTIVE',
      version: 1,
      reason: newRateData.reason,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
    };

    setShippingRates((prev) => [newRate, ...prev]);

    // Append to rate audit history
    const historyEntry: RateHistoryEntry = {
      id: `RH-${Date.now().toString().slice(-4)}`,
      rateId: newRate.id,
      routeAr: `${newRate.originCountry === 'JO' ? 'الأردن' : 'الجزائر'} ← ${newRate.destinationCountry === 'JO' ? 'الأردن' : 'الجزائر'}`,
      routeEn: `${newRate.originCountry} → ${newRate.destinationCountry}`,
      originCountry: newRate.originCountry,
      destinationCountry: newRate.destinationCountry,
      serviceType: newRate.serviceType,
      pricingModel: newRate.pricingModel,
      oldRateText: 'New Tariff',
      newRateText: `${newRate.ratePerKg} ${newRate.currency} / KG`,
      changedBy: currentUser.id,
      changedByName: currentUser.fullName || 'Authorized Employee',
      date: new Date().toISOString().split('T')[0],
      versionText: 'v1',
      reason: newRate.reason || 'إصدار تعرفة جديدة',
    };
    setRateHistory((prev) => [historyEntry, ...prev]);
  };

  const handleCreateIncident = (incidentData: Partial<OperationalIncident>) => {
    const newInc: OperationalIncident = {
      id: `INC-${Date.now().toString().slice(-4)}`,
      incidentNumber: incidentData.incidentNumber || `INC-${Date.now().toString().slice(-4)}`,
      category: incidentData.category || 'OTHER',
      priority: incidentData.priority || 'MEDIUM',
      status: 'OPEN',
      hubId: currentHub.id,
      hubName: currentLocale === 'ar' ? currentHub.nameAr : currentHub.nameEn,
      trackingNumber: incidentData.trackingNumber,
      flightNumber: incidentData.flightNumber,
      relatedManifestId: incidentData.relatedManifestId,
      description: incidentData.description || '',
      evidencePhotos: [],
      assignedEmployeeId: currentUser.id,
      assignedEmployeeName: currentUser.fullName || 'Operational Agent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setOperationalIncidents((prev) => [newInc, ...prev]);
  };

  const handleUpdateIncidentStatus = (incidentId: string, status: IncidentStatus, note?: string) => {
    setOperationalIncidents((prev) =>
      prev.map((i) =>
        i.id === incidentId
          ? {
              ...i,
              status,
              resolutionNotes: note || i.resolutionNotes,
              updatedAt: new Date().toISOString(),
            }
          : i
      )
    );
  };

  const handleRecordSettlement = (record: SettlementRecord) => {
    setSettlements((prev) => [record, ...prev]);
  };

  const handleSaveExchangeRate = (newRateData: Omit<DailyExchangeRate, 'id' | 'createdAt'>) => {
    const newRate: DailyExchangeRate = {
      ...newRateData,
      id: `FX-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
    };
    setExchangeRates((prev) => [newRate, ...prev]);
  };

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans" dir={currentLocale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Topbar */}
      <EmployeeTopbar
        currentHub={currentHub}
        currentUser={currentUser}
        locale={currentLocale}
        onSelectHub={onSelectHub}
        onToggleSidebar={handleToggleSidebar}
        onOpenScanner={() => setScannerOpen(true)}
        onQuickSearch={handleQuickSearch}
        onToggleLanguage={toggleLanguage}
      />

      {/* Main Layout Area with Flexbox Anchoring */}
      <div className="flex-1 flex w-full min-h-0 relative items-start">
        {/* Navigation Sidebar */}
        <EmployeeSidebar
          activeSection={activeSection}
          onSelectSection={(section) => {
            setActiveSection(section);
            setIsSidebarOpen(false);
          }}
          locale={currentLocale}
          currentUser={currentUser}
          currentHub={currentHub}
          currentUserRole={currentUser?.role || 'HUB_AGENT'}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          badgeCounts={{
            intake: awaitingIntakeCount,
            inspection: needsInspectionCount,
            readyForTransport: readyForTransportCount,
            tripsPending: pendingTripsVerificationCount,
            destinationIntake: incomingDestinationCount,
            readyForDelivery: readyForPickupCount,
            pendingPayouts: trips.filter((t) => t.status === 'VERIFIED' || t.status === 'COMPLETED' || t.status === 'ARRIVED').length,
            incidents: activeIncidentsCount,
          }}
        />

        {/* View Content Canvas */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 max-w-[1600px] mx-auto w-full">
          {activeSection === 'OPERATIONS_DASHBOARD' && (
            <OperationsDashboardView
              currentHub={currentHub}
              shipments={shipments}
              trips={trips}
              manifests={manifests}
              locale={currentLocale}
              onNavigate={setActiveSection}
            />
          )}

          {activeSection === 'ORIGIN_INTAKE' && (
            <OriginHubIntakeView
              currentHub={currentHub}
              shipments={shipments}
              locale={currentLocale}
              onReceivePackage={onReceivePackage}
              onNavigate={setActiveSection}
              onRefreshData={onRefreshData}
            />
          )}

          {activeSection === 'INSPECTION_WEIGHT' && (
            <InspectionWeightView
              currentHub={currentHub}
              shipments={shipments}
              locale={currentLocale}
              onInspectShipment={onInspectShipment}
              onNavigate={setActiveSection}
              onRefreshData={onRefreshData}
            />
          )}

          {activeSection === 'READY_FOR_TRANSPORT' && (
            <ReadyForTransportView
              currentHub={currentHub}
              shipments={shipments}
              locale={currentLocale}
              onNavigate={setActiveSection}
            />
          )}

          {activeSection === 'TRIP_VERIFICATION' && (
            <TripVerificationView
              currentHub={currentHub}
              trips={trips}
              locale={currentLocale}
              onNavigate={setActiveSection}
              onRefreshData={onRefreshData}
            />
          )}

          {activeSection === 'VERIFIED_TRIPS' && (
            <VerifiedTripsView
              currentHub={currentHub}
              trips={trips}
              locale={currentLocale}
              onNavigate={setActiveSection}
            />
          )}

          {activeSection === 'MATCHING' && (
            <MatchingView
              currentHub={currentHub}
              shipments={shipments}
              trips={trips}
              locale={currentLocale}
              onNavigate={setActiveSection}
              onRefreshData={onRefreshData}
            />
          )}

          {activeSection === 'MANIFESTS' && (
            <ManifestsView
              currentHub={currentHub}
              manifests={manifests}
              shipments={shipments}
              trips={trips}
              locale={currentLocale}
              onCreateManifest={onCreateManifest}
              onNavigate={setActiveSection}
              onRefreshData={onRefreshData}
            />
          )}

          {activeSection === 'TRAVELER_HANDOVER' && (
            <TravelerHandoverView
              currentHub={currentHub}
              manifests={manifests}
              shipments={shipments}
              locale={currentLocale}
              onHandoverDispatch={onHandoverDispatch}
              onNavigate={setActiveSection}
              onRefreshData={onRefreshData}
            />
          )}

          {activeSection === 'DESTINATION_INTAKE' && (
            <DestinationIntakeView
              currentHub={currentHub}
              shipments={shipments}
              manifests={manifests}
              locale={currentLocale}
              onDestinationIntake={onDestinationIntake}
              onNavigate={setActiveSection}
              onRefreshData={onRefreshData}
            />
          )}

          {activeSection === 'PICKUP_PREPARATION' && (
            <PickupPreparationView
              currentHub={currentHub}
              shipments={shipments}
              locale={currentLocale}
              onNavigate={setActiveSection}
              onRefreshData={onRefreshData}
            />
          )}

          {activeSection === 'FINAL_DELIVERY' && (
            <FinalDeliveryView
              currentHub={currentHub}
              shipments={shipments}
              locale={currentLocale}
              onDeliverToRecipient={onDeliverToRecipient}
              onNavigate={setActiveSection}
              onRefreshData={onRefreshData}
            />
          )}

          {activeSection === 'SHIPPING_RATES' && (
            <ShippingRatesView
              rates={shippingRates}
              currentHub={currentHub}
              currentUser={currentUser}
              locale={currentLocale}
              onSaveRate={handleSaveRate}
            />
          )}

          {activeSection === 'RATE_HISTORY' && (
            <RateHistoryView
              history={rateHistory}
              locale={currentLocale}
            />
          )}

          {activeSection === 'OPERATIONAL_INCIDENTS' && (
            <OperationalIncidentsView
              incidents={operationalIncidents}
              currentHub={currentHub}
              currentUser={currentUser}
              locale={currentLocale}
              onCreateIncident={handleCreateIncident}
              onUpdateIncidentStatus={handleUpdateIncidentStatus}
            />
          )}

          {activeSection === 'GLOBAL_SEARCH' && (
            <GlobalSearchView
              shipments={shipments}
              trips={trips as any}
              manifests={manifests}
              incidents={operationalIncidents}
              currentHub={currentHub}
              currentUser={currentUser}
              locale={currentLocale}
              initialQuery={searchQueryParam}
              onNavigateToSection={setActiveSection}
            />
          )}

          {activeSection === 'PRICING_CALCULATOR' && (
            <PricingCalculatorView
              currentHub={currentHub}
              shippingRates={shippingRates}
              exchangeRates={exchangeRates}
              locale={currentLocale}
              onNavigate={setActiveSection}
            />
          )}

          {activeSection === 'CUSTOMER_PAYMENTS' && (
            <CustomerPaymentsView
              shipments={shipments}
              exchangeRates={exchangeRates}
              shippingRates={shippingRates}
              currentHub={currentHub}
              currentUser={currentUser}
              locale={currentLocale}
              onRecordSettlement={handleRecordSettlement}
            />
          )}

          {activeSection === 'TRAVELER_SETTLEMENTS' && (
            <TravelerSettlementsView
              trips={trips}
              manifests={manifests}
              exchangeRates={exchangeRates}
              shippingRates={shippingRates}
              currentHub={currentHub}
              currentUser={currentUser}
              locale={currentLocale}
              onRecordSettlement={handleRecordSettlement}
            />
          )}

          {activeSection === 'EXCHANGE_RATES' && (
            <ExchangeRatesView
              rates={exchangeRates}
              currentHub={currentHub}
              currentUser={currentUser}
              locale={currentLocale}
              onSaveRate={handleSaveExchangeRate}
            />
          )}

          {activeSection === 'SETTLEMENT_HISTORY' && (
            <SettlementHistoryView
              settlements={settlements}
              currentHub={currentHub}
              locale={currentLocale}
            />
          )}

          {/* Legacy compatibility only */}
          {activeSection === 'CURRENCY_SETTLEMENT' && (
            <CurrencySettlementView
              currentHub={currentHub}
              locale={currentLocale}
              onNavigate={setActiveSection}
            />
          )}

          {/* Legacy compatibility only */}
          {activeSection === 'INCIDENTS_DISPUTES' && (
            <IncidentsDisputesView
              currentHub={currentHub}
              locale={currentLocale}
              onNavigate={setActiveSection}
            />
          )}

          {activeSection === 'AUDIT_LOGS' && (
            <AuditLogsView
              currentHub={currentHub}
              locale={currentLocale}
              onNavigate={setActiveSection}
            />
          )}
        </main>
      </div>

      {/* Global Barcode / QR Scanner Modal */}
      {scannerOpen && (
        <QRScannerModal
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScanSuccess={handleScanResult}
          locale={currentLocale}
          title={currentLocale === 'ar' ? 'المسح السريع للباركود والـ QR' : 'Fast Barcode & QR Scanner'}
        />
      )}
    </div>
  );
};
