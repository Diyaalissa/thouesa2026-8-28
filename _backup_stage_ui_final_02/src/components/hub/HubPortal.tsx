import React, { useState, useEffect } from 'react';
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
import {
  INTAKE_SEED_MANIFEST,
  INTAKE_SEED_SHIPMENTS,
  INTAKE_SEED_TRIP,
  INTAKE_SEED_COMPLETED_MANIFEST,
  INTAKE_SEED_DISCREPANCY_MANIFEST,
  INTAKE_SEED_TRIP_0142,
  INTAKE_SEED_MANIFEST_0142,
  INTAKE_SEED_SHIPMENTS_0142,
} from '../../lib/destinationIntakeSeedData';

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
  shippingRates?: ShippingRate[];
  exchangeRates?: DailyExchangeRate[];
  onSaveShippingRate?: (newRate: ShippingRate, updatedRates: ShippingRate[]) => void;
  onSaveExchangeRate?: (newRate: DailyExchangeRate, updatedRates: DailyExchangeRate[]) => void;
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
  shippingRates: propShippingRates,
  exchangeRates: propExchangeRates,
  onSaveShippingRate,
  onSaveExchangeRate,
}) => {
  const [currentLocale, setCurrentLocale] = useState<Locale>(locale);
  const [activeSection, setActiveSection] = useState<EmployeeNavSection>('OPERATIONS_DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [searchQueryParam, setSearchQueryParam] = useState('');
  const [preselectedMatchingShipmentId, setPreselectedMatchingShipmentId] = useState<string | undefined>(undefined);
  const [preselectedMatchingTripId, setPreselectedMatchingTripId] = useState<string | undefined>(undefined);
  const [preselectedManifestTripId, setPreselectedManifestTripId] = useState<string | undefined>(undefined);
  const [preselectedHandoverManifestId, setPreselectedHandoverManifestId] = useState<string | undefined>(undefined);
  const [preselectedIntakeManifestId, setPreselectedIntakeManifestId] = useState<string | undefined>(undefined);

  // Local state for instantaneous UI reactive transitions (Stages 02, 03 & 04)
  const [localManifests, setLocalManifests] = useState<Manifest[]>(() => {
    const map = new Map<string, Manifest>();
    (manifests || []).forEach((m) => map.set(m.id, m));
    if (!map.has(INTAKE_SEED_MANIFEST.id)) {
      map.set(INTAKE_SEED_MANIFEST.id, INTAKE_SEED_MANIFEST);
    }
    if (!map.has(INTAKE_SEED_COMPLETED_MANIFEST.id)) {
      map.set(INTAKE_SEED_COMPLETED_MANIFEST.id, INTAKE_SEED_COMPLETED_MANIFEST);
    }
    if (!map.has(INTAKE_SEED_DISCREPANCY_MANIFEST.id)) {
      map.set(INTAKE_SEED_DISCREPANCY_MANIFEST.id, INTAKE_SEED_DISCREPANCY_MANIFEST);
    }
    if (!map.has(INTAKE_SEED_MANIFEST_0142.id)) {
      map.set(INTAKE_SEED_MANIFEST_0142.id, INTAKE_SEED_MANIFEST_0142);
    }
    return Array.from(map.values());
  });

  const [localShipments, setLocalShipments] = useState<Shipment[]>(() => {
    const map = new Map<string, Shipment>();
    (shipments || []).forEach((s) => map.set(s.id, s));
    INTAKE_SEED_SHIPMENTS.forEach((s) => {
      if (!map.has(s.id)) map.set(s.id, s);
    });
    INTAKE_SEED_SHIPMENTS_0142.forEach((s) => {
      if (!map.has(s.id)) map.set(s.id, s);
    });
    return Array.from(map.values());
  });

  const [localTrips, setLocalTrips] = useState<Trip[]>(() => {
    const map = new Map<string, Trip>();
    (trips || []).forEach((t) => map.set(t.id, t));
    if (!map.has(INTAKE_SEED_TRIP.id)) map.set(INTAKE_SEED_TRIP.id, INTAKE_SEED_TRIP);
    if (!map.has(INTAKE_SEED_TRIP_0142.id)) map.set(INTAKE_SEED_TRIP_0142.id, INTAKE_SEED_TRIP_0142);
    return Array.from(map.values());
  });

  useEffect(() => {
    if (manifests) {
      setLocalManifests((prev) => {
        const map = new Map<string, Manifest>();
        manifests.forEach((m) => map.set(m.id, m));
        prev.forEach((m) => {
          if (
            !map.has(m.id) ||
            (m.status === 'READY' && map.get(m.id)?.status === 'DRAFT') ||
            (m.status === 'HANDED_OVER' && map.get(m.id)?.status === 'READY')
          ) {
            map.set(m.id, m);
          }
        });
        return Array.from(map.values());
      });
    }
  }, [manifests]);

  useEffect(() => {
    if (shipments) {
      setLocalShipments((prev) => {
        const map = new Map<string, Shipment>();
        shipments.forEach((s) => map.set(s.id, s));
        prev.forEach((s) => {
          if (s.currentStatus === 'IN_TRANSIT' && map.get(s.id)?.currentStatus === 'ASSIGNED_TO_TRIP') {
            map.set(s.id, s);
          }
        });
        return Array.from(map.values());
      });
    }
  }, [shipments]);

  useEffect(() => {
    if (trips) {
      setLocalTrips((prev) => {
        const map = new Map<string, Trip>();
        trips.forEach((t) => map.set(t.id, t));
        prev.forEach((t) => {
          if (t.status === 'DISPATCHED' && map.get(t.id)?.status === 'PACKAGES_LINKED') {
            map.set(t.id, t);
          }
        });
        return Array.from(map.values());
      });
    }
  }, [trips]);

  const handleUpdateManifest = (updated: Manifest) => {
    setLocalManifests((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  };

  const handleCreateManifestDirect = async (newManifest: Manifest): Promise<boolean> => {
    setLocalManifests((prev) => [newManifest, ...prev]);
    if (onCreateManifest) {
      try {
        await onCreateManifest(newManifest);
      } catch (e) {
        console.warn('Backend create manifest error:', e);
      }
    }
    return true;
  };

  // Stage 03: Atomic Handover Completion Handler
  // Strict Transition:
  // Shipment: IN_TRANSIT
  // Trip: DISPATCHED
  // Manifest: HANDED_OVER
  // Custody: TRAVELER
  const handleHandoverComplete = async (payload: {
    manifestId: string;
    tripId: string;
    shipmentIds: string[];
    travelerId: string;
    token: string;
  }): Promise<boolean> => {
    const now = new Date().toISOString();

    // 1. Update Manifest
    setLocalManifests((prev) =>
      prev.map((m) =>
        m.id === payload.manifestId
          ? {
              ...m,
              status: 'HANDED_OVER',
              currentStatus: 'HANDED_OVER',
              custody: 'TRAVELER',
              dispatchedByAgentId: currentUser?.id || 'usr-agent-303',
              dispatchTimestamp: now,
              handoverToken: payload.token,
              updatedAt: now,
            }
          : m
      )
    );

    // 2. Update Trip
    setLocalTrips((prev) =>
      prev.map((t) => (t.id === payload.tripId ? { ...t, status: 'DISPATCHED' } : t))
    );

    // 3. Update Shipments
    setLocalShipments((prev) =>
      prev.map((s) =>
        payload.shipmentIds.includes(s.id)
          ? {
              ...s,
              currentStatus: 'IN_TRANSIT',
              updatedAt: now,
            }
          : s
      )
    );

    // 4. Backend handover dispatch call
    if (onHandoverDispatch) {
      try {
        await onHandoverDispatch({
          manifestId: payload.manifestId,
          hubId: currentHub.id,
          travelerId: payload.travelerId,
          agentId: currentUser?.id || 'usr-agent-303',
          agentName: currentUser?.name || 'Hub Agent',
          dispatchedAt: now,
        });
      } catch (err) {
        console.warn('Backend handover dispatch call warning:', err);
      }
    }

    return true;
  };

  // Stage 04: Atomic Destination Intake Completion Handler
  // Strict Transitions:
  // IF SUCCESSFUL (status === 'CLOSED'):
  //   Shipment: RECEIVED_AT_DEST
  //   Trip: COMPLETED
  //   Manifest: CLOSED
  //   Custody: DESTINATION_HUB
  // IF DISCREPANCY (status === 'DISCREPANCY'):
  //   Manifest: DISCREPANCY
  //   Trip: NOT COMPLETED (remains DISPATCHED or ARRIVED)
  //   Affected Shipment: NOT blindly changed to RECEIVED_AT_DEST (remains IN_TRANSIT)
  //   Custody: explicit according to actually received package state
  const handleDestinationIntakeComplete = async (payload: {
    manifestId: string;
    tripId: string;
    verifiedShipmentIds: string[];
    missingShipmentIds: string[];
    sealMismatchIds: string[];
    damagedShipmentIds: string[];
    custodyFrom: string;
    custodyTo: string;
    status: 'CLOSED' | 'DISCREPANCY';
    notes?: string;
  }): Promise<boolean> => {
    const now = new Date().toISOString();

    if (payload.status === 'CLOSED') {
      // 1. Update Manifest -> CLOSED, Custody -> DESTINATION_HUB
      setLocalManifests((prev) =>
        prev.map((m) =>
          m.id === payload.manifestId
            ? {
                ...m,
                status: 'CLOSED',
                currentStatus: 'CLOSED',
                custody: 'DESTINATION_HUB',
                receivedByAgentId: currentUser?.id || 'emp-alg-201',
                receiptTimestamp: now,
                updatedAt: now,
                intakeNotes: payload.notes,
              }
            : m
        )
      );

      // 2. Update Trip -> COMPLETED
      setLocalTrips((prev) =>
        prev.map((t) => (t.id === payload.tripId ? { ...t, status: 'COMPLETED' } : t))
      );

      // 3. Update Shipments -> RECEIVED_AT_DEST
      setLocalShipments((prev) =>
        prev.map((s) =>
          payload.verifiedShipmentIds.includes(s.id)
            ? {
                ...s,
                currentStatus: 'RECEIVED_AT_DEST',
                updatedAt: now,
              }
            : s
        )
      );
    } else {
      // DISCREPANCY CASE
      // 1. Update Manifest -> DISCREPANCY
      setLocalManifests((prev) =>
        prev.map((m) =>
          m.id === payload.manifestId
            ? {
                ...m,
                status: 'DISCREPANCY',
                currentStatus: 'DISCREPANCY',
                updatedAt: now,
                intakeNotes: payload.notes,
              }
            : m
        )
      );

      // 2. Trip -> NOT COMPLETED (remains DISPATCHED or ARRIVED)
      // 3. Shipments:
      // Missing shipments remain IN_TRANSIT
      setLocalShipments((prev) =>
        prev.map((s) => {
          if (payload.missingShipmentIds.includes(s.id)) {
            return s; // Remains IN_TRANSIT
          }
          if (payload.verifiedShipmentIds.includes(s.id)) {
            return {
              ...s,
              currentStatus: 'RECEIVED_AT_DEST',
              updatedAt: now,
            };
          }
          return s;
        })
      );
    }

    // Call backend onDestinationIntake if provided
    if (onDestinationIntake) {
      try {
        await onDestinationIntake({
          manifestId: payload.manifestId,
          hubId: currentHub.id,
          agentId: currentUser?.id || 'emp-alg-201',
          status: payload.status,
          verifiedShipmentIds: payload.verifiedShipmentIds,
          missingShipmentIds: payload.missingShipmentIds,
          notes: payload.notes,
        });
      } catch (e) {
        console.warn('Backend destination intake call error:', e);
      }
    }

    return true;
  };

  // Stage 05: Atomic Pickup Preparation Completion Handler
  // Strict Transitions:
  // Shipment: RECEIVED_AT_DEST -> READY_FOR_PICKUP
  // Custody: Remains DESTINATION_HUB (Custody does NOT transfer to recipient until Stage 06 Final Delivery)
  // Storage Location: Saved to shipment metadata
  const handlePickupPreparationComplete = async (payload: {
    shipmentId: string;
    storageLocation: string;
    storageZone?: string;
    storageRack?: string;
    storageShelf?: string;
    storageBin?: string;
    preparedBy: string;
  }): Promise<boolean> => {
    const now = new Date().toISOString();
    setLocalShipments((prev) =>
      prev.map((s) =>
        s.id === payload.shipmentId
          ? {
              ...s,
              currentStatus: 'READY_FOR_PICKUP',
              custody: 'DESTINATION_HUB',
              storageLocation: payload.storageLocation,
              storageZone: payload.storageZone,
              storageRack: payload.storageRack,
              storageShelf: payload.storageShelf,
              storageBin: payload.storageBin,
              preparedForPickupAt: now,
              preparedForPickupBy: payload.preparedBy,
              updatedAt: now,
            }
          : s
      )
    );
    return true;
  };

  // Stage 06: Atomic Final Delivery Completion Handler
  // Strict Transitions:
  // Shipment: READY_FOR_PICKUP -> DELIVERED
  // Custody: DESTINATION_HUB -> RECIPIENT
  // Storage Location: Vacated / Stored in lastStorageLocation
  // Recipient Verification: VERIFIED
  // OTP Verification: VERIFIED
  // Delivered Metadata: deliveredAt, deliveredBy, etc. recorded atomically
  const handleFinalDeliveryComplete = async (payload: {
    shipmentId: string;
    recipientName: string;
    recipientNationalIdPresented?: string;
    deliveredBy: string;
    deliveredByEmployeeId?: string;
    deliveredAtHubId: string;
    otpCode: string;
    paymentStatusAtDelivery?: string;
  }): Promise<boolean> => {
    const now = new Date().toISOString();

    setLocalShipments((prev) =>
      prev.map((s) => {
        if (s.id !== payload.shipmentId) return s;
        return {
          ...s,
          currentStatus: 'DELIVERED',
          custody: 'RECIPIENT',
          deliveredAt: now,
          deliveredBy: payload.deliveredBy,
          deliveredByEmployeeId: payload.deliveredByEmployeeId,
          deliveredAtHubId: payload.deliveredAtHubId,
          recipientVerified: true,
          recipientVerificationMethod: 'GOVERNMENT_ID_MATCH',
          recipientNationalIdPresented: payload.recipientNationalIdPresented,
          otpVerified: true,
          otpVerifiedAt: now,
          paymentStatus: (payload.paymentStatusAtDelivery as any) || (s.paymentPolicy === 'NOT_REQUIRED' ? s.paymentStatus : 'FULLY_PAID'),
          paymentStatusAtDelivery: payload.paymentStatusAtDelivery || 'FULLY_PAID',
          lastStorageLocation: s.storageLocation,
          storageLocation: undefined,
          storageZone: undefined,
          storageRack: undefined,
          storageShelf: undefined,
          storageBin: undefined,
          updatedAt: now,
        };
      })
    );

    // Also call backend delivery endpoint if prop provided
    if (onDeliverToRecipient) {
      try {
        await onDeliverToRecipient({
          shipmentId: payload.shipmentId,
          recipientNationalId: payload.recipientNationalIdPresented || 'ID-VERIFIED-COUNTER',
          otpCode: payload.otpCode,
          deliveredByHubId: payload.deliveredAtHubId,
          deliveredAt: now,
        });
      } catch (e) {
        console.warn('Backend deliver to recipient call warning:', e);
      }
    }

    return true;
  };

  // Operational State
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>(
    propShippingRates && propShippingRates.length > 0 ? propShippingRates : INITIAL_SHIPPING_RATES
  );
  const [rateHistory, setRateHistory] = useState<RateHistoryEntry[]>(INITIAL_RATE_HISTORY);
  const [operationalIncidents, setOperationalIncidents] = useState<OperationalIncident[]>(INITIAL_INCIDENTS);
  const [exchangeRates, setExchangeRates] = useState<DailyExchangeRate[]>(
    propExchangeRates && propExchangeRates.length > 0 ? propExchangeRates : INITIAL_DAILY_EXCHANGE_RATES
  );
  const [settlements, setSettlements] = useState<SettlementRecord[]>(INITIAL_SETTLEMENTS);

  // Synchronize internal state if parent props update
  useEffect(() => {
    if (propShippingRates && propShippingRates.length > 0) {
      setShippingRates(propShippingRates);
    }
  }, [propShippingRates]);

  useEffect(() => {
    if (propExchangeRates && propExchangeRates.length > 0) {
      setExchangeRates(propExchangeRates);
    }
  }, [propExchangeRates]);

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

  const incomingDestinationCount = localManifests.filter(
    (m) => m.destinationHubId === currentHub.id && (m.status === 'HANDED_OVER' || m.status === 'IN_TRANSIT')
  ).length;

  const readyForPickupCount = localShipments.filter(
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
    const orig = newRateData.originCountry || 'JO';
    const dest = newRateData.destinationCountry || 'DZ';
    const rateType = newRateData.rateType || 'CUSTOMER_SHIPPING';
    const service = newRateData.serviceType || 'SEND_PARCEL';

    // Find the latest existing rate version for this specific independent pricing chain:
    // (RateType + Origin + Destination + ServiceType)
    const existingChainRates = shippingRates.filter(
      (r) =>
        r.originCountry === orig &&
        r.destinationCountry === dest &&
        r.rateType === rateType &&
        r.serviceType === service
    );

    // Sort to find highest version number
    const maxVersion = existingChainRates.reduce((max, r) => (r.version > max ? r.version : max), 0);
    const newVersion = maxVersion > 0 ? maxVersion + 1 : 1;

    // Determine lifecycle status:
    // DRAFT -> stays DRAFT
    // If effectiveFrom is future -> SCHEDULED
    // Otherwise -> ACTIVE
    const now = new Date();
    const effFromDate = newRateData.effectiveFrom ? new Date(newRateData.effectiveFrom) : now;
    let initialStatus = newRateData.status || 'ACTIVE';
    if (initialStatus !== 'DRAFT') {
      initialStatus = effFromDate > now ? 'SCHEDULED' : 'ACTIVE';
    }

    const newRate: ShippingRate = {
      id: `RATE-${orig}-${dest}-${rateType === 'CUSTOMER_SHIPPING' ? 'CUST' : 'TRAV'}-v${newVersion}-${Date.now().toString().slice(-4)}`,
      originCountry: orig,
      destinationCountry: dest,
      serviceType: service,
      rateType: rateType,
      pricingModel: newRateData.pricingModel || 'PER_KG',
      currency: newRateData.currency || (orig === 'JO' ? 'JOD' : 'DZD'),
      ratePerKg: newRateData.ratePerKg ?? (orig === 'JO' ? 7.5 : 1800),
      minimumCharge: newRateData.minimumCharge ?? (orig === 'JO' ? 5 : 1500),
      minimumBillableWeightKg: newRateData.minimumBillableWeightKg ?? 0.5,
      tiers: newRateData.tiers,
      effectiveFrom: newRateData.effectiveFrom || now.toISOString(),
      effectiveUntil: newRateData.effectiveUntil,
      status: initialStatus,
      version: newVersion,
      reason: newRateData.reason,
      createdBy: currentUser.id,
      createdAt: now.toISOString(),
    };

    // If the new rate is ACTIVE immediately, retire/expire previous ACTIVE rates in THIS chain ONLY
    // Crucial: The other 3 chains remain untouched!
    setShippingRates((prev) => {
      let nextRates: ShippingRate[];
      if (initialStatus === 'ACTIVE') {
        const updatedChain = prev.map((r) => {
          if (
            r.originCountry === orig &&
            r.destinationCountry === dest &&
            r.rateType === rateType &&
            r.serviceType === service &&
            r.status === 'ACTIVE'
          ) {
            // Close active period and mark EXPIRED/ARCHIVED (Never permanently deleted!)
            return {
              ...r,
              status: 'EXPIRED' as const,
              effectiveUntil: now.toISOString(),
            };
          }
          return r;
        });
        nextRates = [newRate, ...updatedChain];
      } else {
        nextRates = [newRate, ...prev];
      }
      if (onSaveShippingRate) {
        onSaveShippingRate(newRate, nextRates);
      }
      return nextRates;
    });

    // Append to rate audit history
    const historyEntry: RateHistoryEntry = {
      id: `RH-${Date.now().toString().slice(-4)}`,
      rateId: newRate.id,
      routeAr: `${orig === 'JO' ? 'الأردن' : 'الجزائر'} ← ${dest === 'JO' ? 'الأردن' : 'الجزائر'} (${rateType === 'CUSTOMER_SHIPPING' ? 'سعر العميل' : 'تعويض المسافر'})`,
      routeEn: `${orig} → ${dest} (${rateType})`,
      originCountry: orig,
      destinationCountry: dest,
      serviceType: service,
      pricingModel: newRate.pricingModel,
      oldRateText: maxVersion > 0 ? `v${maxVersion}` : 'New Chain',
      newRateText: newRate.pricingModel === 'WEIGHT_TIERS' 
        ? `${newRate.tiers?.length || 0} Tiers` 
        : newRate.pricingModel === 'FLAT_RATE'
        ? `${newRate.minimumCharge} ${newRate.currency} (FLAT)`
        : `${newRate.ratePerKg} ${newRate.currency} / KG`,
      changedBy: currentUser.id,
      changedByName: currentUser.fullName || 'Authorized Employee',
      date: now.toISOString().split('T')[0],
      versionText: `v${newVersion}`,
      reason: newRate.reason || (maxVersion > 0 ? `إصدار نسخة جديدة v${newVersion}` : 'إصدار تعرفة جديدة'),
    };
    setRateHistory((prev) => [historyEntry, ...prev]);
  };

  const handleDisableRate = (rateId: string, reason?: string) => {
    const now = new Date();
    setShippingRates((prev) => {
      const nextRates = prev.map((r) =>
        r.id === rateId
          ? {
              ...r,
              status: 'DISABLED' as const,
              effectiveUntil: now.toISOString(),
              reason: reason ? `${r.reason ? r.reason + ' | ' : ''}تعطيل: ${reason}` : r.reason,
            }
          : r
      );
      if (onSaveShippingRate) {
        const disabled = nextRates.find((r) => r.id === rateId);
        if (disabled) onSaveShippingRate(disabled, nextRates);
      }
      return nextRates;
    });

    const targetRate = shippingRates.find((r) => r.id === rateId);
    if (targetRate) {
      const historyEntry: RateHistoryEntry = {
        id: `RH-DIS-${Date.now().toString().slice(-4)}`,
        rateId: targetRate.id,
        routeAr: `${targetRate.originCountry === 'JO' ? 'الأردن' : 'الجزائر'} ← ${targetRate.destinationCountry === 'JO' ? 'الأردن' : 'الجزائر'}`,
        routeEn: `${targetRate.originCountry} → ${targetRate.destinationCountry}`,
        originCountry: targetRate.originCountry,
        destinationCountry: targetRate.destinationCountry,
        serviceType: targetRate.serviceType,
        pricingModel: targetRate.pricingModel,
        oldRateText: `v${targetRate.version} (ACTIVE)`,
        newRateText: 'DISABLED',
        changedBy: currentUser.id,
        changedByName: currentUser.fullName || 'Authorized Employee',
        date: now.toISOString().split('T')[0],
        versionText: `v${targetRate.version}`,
        reason: reason || 'تعطيل إداري للتعرفة',
      };
      setRateHistory((prev) => [historyEntry, ...prev]);
    }
  };

  const handleCreateIncident = (incidentData: Partial<OperationalIncident>) => {
    const generatedId = incidentData.id || incidentData.incidentNumber || `INC-${Date.now().toString().slice(-4)}`;
    const newInc: OperationalIncident = {
      id: generatedId,
      incidentNumber: incidentData.incidentNumber || generatedId,
      type: incidentData.type || incidentData.category || 'OTHER',
      category: incidentData.category || 'OTHER',
      entityType: incidentData.entityType || (incidentData.relatedManifestId ? 'MANIFEST' : incidentData.trackingNumber ? 'SHIPMENT' : 'MANIFEST'),
      referenceNumber: incidentData.referenceNumber || incidentData.relatedManifestId || incidentData.trackingNumber || '-',
      priority: incidentData.priority || 'MEDIUM',
      status: incidentData.status || 'OPEN',
      isBlocking: incidentData.isBlocking !== undefined ? incidentData.isBlocking : true,
      hubId: currentHub.id,
      hubName: currentLocale === 'ar' ? currentHub.nameAr : currentHub.nameEn,
      trackingNumber: incidentData.trackingNumber,
      flightNumber: incidentData.flightNumber,
      relatedManifestId: incidentData.relatedManifestId,
      description: incidentData.description || '',
      evidencePhotos: [],
      assignedEmployeeId: currentUser.id,
      assignedEmployeeName: currentUser.fullName || 'Operational Agent',
      assignedRole: incidentData.assignedRole || 'Hub Manager',
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
    if (record.shipmentId) {
      setLocalShipments((prev) =>
        prev.map((s) =>
          s.id === record.shipmentId || s.trackingNumber === record.trackingNumber
            ? {
                ...s,
                paymentStatus: 'PAID',
              }
            : s
        )
      );
    }
  };

  const handleSaveExchangeRate = (newRateData: Omit<DailyExchangeRate, 'id' | 'createdAt'>) => {
    const now = new Date();
    const newRate: DailyExchangeRate = {
      ...newRateData,
      id: `FX-${newRateData.baseCurrency}-${newRateData.quoteCurrency}-v${newRateData.version}-${Date.now().toString().slice(-4)}`,
      createdAt: now.toISOString(),
    };

    setExchangeRates((prev) => {
      let nextRates: DailyExchangeRate[];
      // If new rate is ACTIVE immediately, retire/expire any previous ACTIVE rate for this pair and scope
      if (newRate.status === 'ACTIVE') {
        const updated = prev.map((r) => {
          if (
            r.baseCurrency === newRate.baseCurrency &&
            r.quoteCurrency === newRate.quoteCurrency &&
            r.countryScope === newRate.countryScope &&
            r.status === 'ACTIVE'
          ) {
            return {
              ...r,
              status: 'EXPIRED' as const,
              effectiveUntil: now.toISOString(),
            };
          }
          return r;
        });
        nextRates = [newRate, ...updated];
      } else {
        nextRates = [newRate, ...prev];
      }
      if (onSaveExchangeRate) {
        onSaveExchangeRate(newRate, nextRates);
      }
      return nextRates;
    });
  };

  const handleDisableExchangeRate = (rateId: string, reason?: string) => {
    const now = new Date();
    setExchangeRates((prev) => {
      const nextRates = prev.map((r) =>
        r.id === rateId
          ? {
              ...r,
              status: 'DISABLED' as const,
              effectiveUntil: now.toISOString(),
              notes: reason ? `${r.notes ? r.notes + ' | ' : ''}تعطيل: ${reason}` : r.notes,
            }
          : r
      );
      if (onSaveExchangeRate) {
        const disabled = nextRates.find((r) => r.id === rateId);
        if (disabled) onSaveExchangeRate(disabled, nextRates);
      }
      return nextRates;
    });
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
              currentUser={currentUser}
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
              trips={trips}
              locale={currentLocale}
              onNavigate={(section, extra) => {
                if (section === 'MATCHING' && extra?.shipmentId) {
                  setPreselectedMatchingShipmentId(extra.shipmentId);
                }
                setActiveSection(section);
              }}
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
              shipments={shipments}
              locale={currentLocale}
              onNavigate={(section, extra) => {
                if (section === 'MATCHING' && extra?.tripId) {
                  setPreselectedMatchingTripId(extra.tripId);
                }
                setActiveSection(section);
              }}
              onRefreshData={onRefreshData}
            />
          )}

          {activeSection === 'MATCHING' && (
            <MatchingView
              currentUser={currentUser}
              currentHub={currentHub}
              shipments={shipments}
              trips={trips}
              locale={currentLocale}
              preselectedShipmentId={preselectedMatchingShipmentId}
              preselectedTripId={preselectedMatchingTripId}
              onNavigate={(section, extra) => {
                if (section === 'MANIFESTS' && extra?.tripId) {
                  setPreselectedManifestTripId(extra.tripId);
                }
                setActiveSection(section);
              }}
              onRefreshData={onRefreshData}
            />
          )}

          {activeSection === 'MANIFESTS' && (
            <ManifestsView
              currentHub={currentHub}
              currentUser={currentUser}
              manifests={localManifests}
              shipments={localShipments}
              trips={localTrips}
              operationalIncidents={operationalIncidents}
              locale={currentLocale}
              preselectedTripId={preselectedManifestTripId}
              onCreateManifest={handleCreateManifestDirect}
              onUpdateManifest={handleUpdateManifest}
              onNavigate={(section, extra) => {
                if (section === 'MATCHING' && extra?.tripId) {
                  setPreselectedMatchingTripId(extra.tripId);
                }
                if (section === 'TRAVELER_HANDOVER' && extra?.manifestId) {
                  setPreselectedHandoverManifestId(extra.manifestId);
                }
                setActiveSection(section);
              }}
              onRefreshData={onRefreshData}
            />
          )}

          {activeSection === 'TRAVELER_HANDOVER' && (
            <TravelerHandoverView
              currentHub={currentHub}
              currentUser={currentUser}
              manifests={localManifests}
              shipments={localShipments}
              trips={localTrips}
              operationalIncidents={operationalIncidents}
              locale={currentLocale}
              preselectedManifestId={preselectedHandoverManifestId}
              onHandoverComplete={handleHandoverComplete}
              onNavigate={(section, extra) => {
                if (section === 'MANIFESTS' && extra?.manifestId) {
                  // Navigate to manifests
                }
                setActiveSection(section);
              }}
              onRefreshData={onRefreshData}
            />
          )}

          {activeSection === 'DESTINATION_INTAKE' && (
            <DestinationIntakeView
              currentHub={currentHub}
              currentUser={currentUser}
              manifests={localManifests}
              shipments={localShipments}
              trips={localTrips}
              operationalIncidents={operationalIncidents}
              locale={currentLocale}
              preselectedManifestId={preselectedIntakeManifestId}
              onDestinationIntakeComplete={handleDestinationIntakeComplete}
              onNavigate={(section, extra) => {
                if (section === 'DESTINATION_INTAKE' && extra?.manifestId) {
                  setPreselectedIntakeManifestId(extra.manifestId);
                }
                setActiveSection(section);
              }}
              onRefreshData={onRefreshData}
            />
          )}

          {activeSection === 'PICKUP_PREPARATION' && (
            <PickupPreparationView
              currentHub={currentHub}
              currentUser={currentUser}
              shipments={localShipments}
              operationalIncidents={operationalIncidents}
              disputes={disputes}
              locale={currentLocale}
              onPickupPreparationComplete={handlePickupPreparationComplete}
              onNavigate={setActiveSection}
              onRefreshData={onRefreshData}
            />
          )}

          {activeSection === 'FINAL_DELIVERY' && (
            <FinalDeliveryView
              currentHub={currentHub}
              currentUser={currentUser}
              shipments={localShipments}
              operationalIncidents={operationalIncidents}
              disputes={disputes}
              locale={currentLocale}
              onDeliverToRecipient={onDeliverToRecipient}
              onFinalDeliveryComplete={handleFinalDeliveryComplete}
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
              onDisableRate={handleDisableRate}
            />
          )}

          {activeSection === 'RATE_HISTORY' && (
            <RateHistoryView
              shippingRates={shippingRates}
              exchangeRates={exchangeRates}
              rateHistory={rateHistory}
              currentHub={currentHub}
              currentUser={currentUser}
              locale={currentLocale}
              onNavigate={setActiveSection}
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
              shipments={localShipments}
              trips={localTrips}
              manifests={localManifests}
              incidents={operationalIncidents}
              settlements={settlements}
              shippingRates={shippingRates}
              exchangeRates={exchangeRates}
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
              shipments={localShipments}
              exchangeRates={exchangeRates}
              shippingRates={shippingRates}
              settlements={settlements}
              currentHub={currentHub}
              currentUser={currentUser}
              locale={currentLocale}
              onRecordSettlement={handleRecordSettlement}
            />
          )}

          {activeSection === 'TRAVELER_SETTLEMENTS' && (
            <TravelerSettlementsView
              trips={localTrips}
              manifests={localManifests}
              shipments={localShipments}
              exchangeRates={exchangeRates}
              shippingRates={shippingRates}
              settlements={settlements}
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
              onDisableRate={handleDisableExchangeRate}
            />
          )}

          {activeSection === 'SETTLEMENT_HISTORY' && (
            <SettlementHistoryView
              settlements={settlements}
              currentHub={currentHub}
              currentUser={currentUser}
              locale={currentLocale}
              onNavigate={setActiveSection}
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
