import React, { useState, useMemo } from 'react';
import {
  Search,
  Package,
  User,
  Plane,
  FileSpreadsheet,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Phone,
  Tag,
  Clock,
  CheckCircle2,
  Filter,
  DollarSign,
  TrendingUp,
  Receipt,
  Eye,
  X,
  ExternalLink,
  Layers,
  Sparkles,
  ChevronRight,
  Lock,
} from 'lucide-react';
import {
  Hub,
  Locale,
  Manifest,
  OperationalIncident,
  Shipment,
  Trip,
  User as UserType,
  SettlementRecord,
  ShippingRate,
  DailyExchangeRate,
  EmployeeNavSection,
} from '../../../types';
import { StatusBadge } from '../common/StatusBadge';
import { DetailsDrawer } from '../common/DetailsDrawer';

export type SearchableEntityType =
  | 'SHIPMENT'
  | 'TRIP'
  | 'MANIFEST'
  | 'TRAVELER'
  | 'CUSTOMER'
  | 'SETTLEMENT'
  | 'INCIDENT'
  | 'SHIPPING_RATE'
  | 'EXCHANGE_RATE';

export interface GlobalSearchResult {
  entityType: SearchableEntityType;
  entityId: string;
  primaryReference: string;
  primaryLabel: string;
  secondaryLabel?: string;
  status: string;
  matchedField: string;
  relevance: number; // 100 for exact ID match, 80 for exact code, 60 for prefix, 40 for substring
  rawReference: any;
  contextInfo?: {
    route?: string;
    weight?: number;
    amount?: number;
    currency?: string;
    phone?: string;
    sealId?: string;
    flightNumber?: string;
    date?: string;
    isBlocking?: boolean;
    serviceType?: string;
    pair?: string;
    buyRate?: number;
    sellRate?: number;
  };
}

export interface GlobalSearchViewProps {
  shipments: Shipment[];
  trips: Trip[];
  manifests: Manifest[];
  incidents: OperationalIncident[];
  settlements?: SettlementRecord[];
  shippingRates?: ShippingRate[];
  exchangeRates?: DailyExchangeRate[];
  currentHub: Hub;
  currentUser: UserType;
  locale: Locale;
  initialQuery?: string;
  onNavigateToSection?: (section: EmployeeNavSection, id?: string) => void;
}

// Normalizers
const normalizeText = (text?: string): string => {
  if (!text) return '';
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
};

const normalizePhone = (phone?: string): string => {
  if (!phone) return '';
  return phone.replace(/[\s\-\(\)\.\+]/g, '');
};

const normalizeId = (id?: string): string => {
  if (!id) return '';
  return id.trim().toLowerCase().replace(/[\s\-_]/g, '');
};

const countryMatches = (scopeA?: string, scopeB?: string): boolean => {
  if (!scopeA || !scopeB) return true;
  if (scopeA === 'GLOBAL' || scopeB === 'GLOBAL') return true;
  const map: Record<string, string> = {
    JOR: 'JO',
    JO: 'JO',
    DZA: 'DZ',
    DZ: 'DZ',
  };
  const normA = map[scopeA.toUpperCase()] || scopeA.toUpperCase();
  const normB = map[scopeB.toUpperCase()] || scopeB.toUpperCase();
  return normA === normB;
};

export const GlobalSearchView: React.FC<GlobalSearchViewProps> = ({
  shipments = [],
  trips = [],
  manifests = [],
  incidents = [],
  settlements = [],
  shippingRates = [],
  exchangeRates = [],
  currentHub,
  currentUser,
  locale,
  initialQuery = '',
  onNavigateToSection,
}) => {
  const isAr = locale === 'ar';
  const [query, setQuery] = useState(initialQuery);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    'ALL' | 'SHIPMENTS' | 'TRIPS' | 'MANIFESTS' | 'TRAVELERS' | 'CUSTOMERS' | 'SETTLEMENTS' | 'INCIDENTS' | 'RATES'
  >('ALL');

  // Selected item state for Read-Only DetailsDrawer
  const [selectedResult, setSelectedResult] = useState<GlobalSearchResult | null>(null);

  // User Role & Permissions Check (Authorization before search)
  const userRole = currentUser?.role || 'HUB_AGENT';
  const isMasterAdmin = userRole === 'MASTER_ADMIN';
  const isHubManager = userRole === 'HUB_MANAGER';
  const isFinancialOfficer = userRole === 'FINANCIAL_OFFICER';
  const isPricingManager = userRole === 'PRICING_MANAGER';
  const isInspector = userRole === 'HUB_INSPECTOR';

  const userCountry = currentHub?.countryCode || 'JO';

  // Permission Flags
  const canViewShipments = true; // All operational staff
  const canViewTrips = true;
  const canViewManifests = true;
  const canViewTravelers = true;
  const canViewCustomers = true;
  const canViewIncidents = true;

  // Financial Permissions: ONLY Financial Officers, Master Admin, and Hub Managers for local settlements
  const canViewCustomerPayments = isFinancialOfficer || isMasterAdmin || isHubManager;
  const canViewTravelerPayouts = isFinancialOfficer || isMasterAdmin || isHubManager;
  const canViewRefunds = isFinancialOfficer || isMasterAdmin || isHubManager;

  // Rates Permissions: Pricing Manager, Master Admin, Hub Manager, Financial Officer
  const canViewShippingRates = isPricingManager || isMasterAdmin || isHubManager || isFinancialOfficer;
  const canViewExchangeRates = isPricingManager || isMasterAdmin || isHubManager || isFinancialOfficer;

  // Normalized Query
  const rawClean = query.trim();
  const cleanQuery = normalizeText(rawClean);
  const cleanPhone = normalizePhone(rawClean);
  const cleanId = normalizeId(rawClean);

  // 1. Authorized & Scoped Shared Datasets (Scope before Search)
  const scopedShipments = useMemo(() => {
    if (!canViewShipments) return [];
    return shipments.filter((s) => {
      if (isMasterAdmin) return true;
      // Scoped to origin or destination hub or country
      return (
        s.originHubId === currentHub.id ||
        s.destinationHubId === currentHub.id ||
        !s.originHubId ||
        !s.destinationHubId
      );
    });
  }, [shipments, canViewShipments, isMasterAdmin, currentHub.id]);

  const scopedTrips = useMemo(() => {
    if (!canViewTrips) return [];
    return trips.filter((t) => {
      if (isMasterAdmin) return true;
      return (
        t.originHubId === currentHub.id ||
        t.destinationHubId === currentHub.id ||
        !t.originHubId ||
        !t.destinationHubId
      );
    });
  }, [trips, canViewTrips, isMasterAdmin, currentHub.id]);

  const scopedManifests = useMemo(() => {
    if (!canViewManifests) return [];
    return manifests.filter((m) => {
      if (isMasterAdmin) return true;
      return (
        m.originHubId === currentHub.id ||
        m.destinationHubId === currentHub.id ||
        !m.originHubId ||
        !m.destinationHubId
      );
    });
  }, [manifests, canViewManifests, isMasterAdmin, currentHub.id]);

  const scopedIncidents = useMemo(() => {
    if (!canViewIncidents) return [];
    return incidents.filter((inc) => {
      if (isMasterAdmin) return true;
      return inc.hubId === currentHub.id || !inc.hubId;
    });
  }, [incidents, canViewIncidents, isMasterAdmin, currentHub.id]);

  const scopedSettlements = useMemo(() => {
    return settlements.filter((stl) => {
      // Role & Permission Check
      if (stl.type === 'CUSTOMER_PAYMENT' && !canViewCustomerPayments) return false;
      if (stl.type === 'TRAVELER_PAYOUT' && !canViewTravelerPayouts) return false;
      if (stl.type === 'REFUND' && !canViewRefunds) return false;

      // Scope Check
      if (isMasterAdmin || isFinancialOfficer) return true;
      return stl.hubId === currentHub.id || !stl.hubId;
    });
  }, [settlements, canViewCustomerPayments, canViewTravelerPayouts, canViewRefunds, isMasterAdmin, isFinancialOfficer, currentHub.id]);

  const scopedShippingRates = useMemo(() => {
    if (!canViewShippingRates) return [];
    return shippingRates.filter((r) => {
      if (isMasterAdmin || isPricingManager) return true;
      return countryMatches(r.originCountry, userCountry) || countryMatches(r.destinationCountry, userCountry);
    });
  }, [shippingRates, canViewShippingRates, isMasterAdmin, isPricingManager, userCountry]);

  const scopedExchangeRates = useMemo(() => {
    if (!canViewExchangeRates) return [];
    return exchangeRates.filter((fx) => {
      if (isMasterAdmin || isPricingManager) return true;
      return (
        fx.countryScope === 'GLOBAL' ||
        countryMatches(fx.countryScope, userCountry) ||
        countryMatches(fx.baseCurrency, userCountry === 'JO' ? 'JOD' : 'DZD') ||
        countryMatches(fx.quoteCurrency, userCountry === 'JO' ? 'JOD' : 'DZD')
      );
    });
  }, [exchangeRates, canViewExchangeRates, isMasterAdmin, isPricingManager, userCountry]);

  // 2. Perform Explicit-Field Search with Ranking & Deduplication
  const groupedResults = useMemo(() => {
    if (!cleanQuery && !cleanPhone && !cleanId) {
      return {
        shipments: [],
        trips: [],
        manifests: [],
        travelers: [],
        customers: [],
        settlements: [],
        incidents: [],
        rates: [],
        totalCount: 0,
      };
    }

    const shipmentResults: GlobalSearchResult[] = [];
    const tripResults: GlobalSearchResult[] = [];
    const manifestResults: GlobalSearchResult[] = [];
    const travelerResults: GlobalSearchResult[] = [];
    const customerResults: GlobalSearchResult[] = [];
    const settlementResults: GlobalSearchResult[] = [];
    const incidentResults: GlobalSearchResult[] = [];
    const rateResults: GlobalSearchResult[] = [];

    // Deduplication sets
    const seenShipments = new Set<string>();
    const seenTrips = new Set<string>();
    const seenManifests = new Set<string>();
    const seenTravelers = new Set<string>();
    const seenCustomers = new Set<string>();
    const seenSettlements = new Set<string>();
    const seenIncidents = new Set<string>();
    const seenRates = new Set<string>();

    // --- Search in Shipments ---
    scopedShipments.forEach((s) => {
      const originCity = s.originHubId === 'hub-amm' ? (isAr ? 'عمّان' : 'Amman') : (isAr ? 'الجزائر' : 'Algiers');
      const destCity = s.destinationHubId === 'hub-alg' ? (isAr ? 'الجزائر' : 'Algiers') : (isAr ? 'عمّان' : 'Amman');

      if (seenShipments.has(s.id)) return;

      const normTracking = normalizeText(s.trackingNumber);
      const normShipId = normalizeText(s.id);
      const normSeal = normalizeText(s.securitySealId || s.securitySealNumber);
      const normSender = normalizeText(s.senderName);
      const normRecipient = normalizeText(s.recipientName);
      const normSenderPhone = normalizePhone(s.senderPhone);
      const normRecipientPhone = normalizePhone(s.recipientPhone);
      const normOrigin = normalizeText(s.originHubId);
      const normDest = normalizeText(s.destinationHubId);

      let matchedField = '';
      let relevance = 0;

      // Ranking logic: Exact ID > Exact Seal > Exact Phone > Prefix > Contains
      if (s.trackingNumber && (normalizeId(s.trackingNumber) === cleanId || normTracking === cleanQuery)) {
        matchedField = isAr ? 'رقم التتبع (مطابقة تامة)' : 'Tracking Number (Exact)';
        relevance = 100;
      } else if (normShipId === cleanQuery || normalizeId(s.id) === cleanId) {
        matchedField = isAr ? 'معرف الشحنة' : 'Shipment ID';
        relevance = 95;
      } else if (s.securitySealId && (normalizeId(s.securitySealId) === cleanId || normSeal.includes(cleanQuery))) {
        matchedField = isAr ? 'الختم الأمني (Seal ID)' : 'Seal ID';
        relevance = 90;
      } else if (s.securitySealNumber && (normalizeId(s.securitySealNumber) === cleanId || normSeal.includes(cleanQuery))) {
        matchedField = isAr ? 'الختم الأمني (Seal ID)' : 'Seal ID';
        relevance = 90;
      } else if (cleanPhone && (normRecipientPhone === cleanPhone || normRecipientPhone.endsWith(cleanPhone))) {
        matchedField = isAr ? 'هاتف المستلم' : 'Recipient Phone';
        relevance = 85;
      } else if (cleanPhone && (normSenderPhone === cleanPhone || normSenderPhone.endsWith(cleanPhone))) {
        matchedField = isAr ? 'هاتف المرسل' : 'Sender Phone';
        relevance = 85;
      } else if (normTracking.startsWith(cleanQuery)) {
        matchedField = isAr ? 'رقم التتبع' : 'Tracking Number';
        relevance = 70;
      } else if (normRecipient.includes(cleanQuery)) {
        matchedField = isAr ? 'اسم المستلم' : 'Recipient Name';
        relevance = 60;
      } else if (normSender.includes(cleanQuery)) {
        matchedField = isAr ? 'اسم المرسل' : 'Sender Name';
        relevance = 55;
      } else if (normTracking.includes(cleanQuery)) {
        matchedField = isAr ? 'رقم التتبع' : 'Tracking Number';
        relevance = 50;
      } else if (normOrigin.includes(cleanQuery) || normDest.includes(cleanQuery)) {
        matchedField = isAr ? 'المسار / الفرع' : 'Route / Hub';
        relevance = 30;
      }

      if (relevance > 0) {
        seenShipments.add(s.id);
        const originCity = s.originHubId === 'hub-amm' ? (isAr ? 'عمّان' : 'Amman') : (isAr ? 'الجزائر' : 'Algiers');
        const destCity = s.destinationHubId === 'hub-alg' ? (isAr ? 'الجزائر' : 'Algiers') : (isAr ? 'عمّان' : 'Amman');

        shipmentResults.push({
          entityType: 'SHIPMENT',
          entityId: s.id,
          primaryReference: s.trackingNumber || s.id,
          primaryLabel: `${s.senderName || 'Customer'} → ${s.recipientName || 'Recipient'}`,
          secondaryLabel: `${originCity} → ${destCity}`,
          status: s.currentStatus || s.status || 'PENDING',
          matchedField,
          relevance,
          rawReference: s,
          contextInfo: {
            route: `${originCity} → ${destCity}`,
            weight: s.actualWeightKg || s.declaredWeightKg || s.estimatedWeightKg || 0,
            sealId: s.securitySealId || s.securitySealNumber,
            phone: s.recipientPhone || s.senderPhone,
            flightNumber: s.flightNumber,
          },
        });
      }

      // Derive Customer Results from Permitted Shipments
      if (s.senderName && !seenCustomers.has(s.senderName)) {
        const normName = normalizeText(s.senderName);
        const normPhone = normalizePhone(s.senderPhone);
        let custMatch = '';
        let custRel = 0;

        if (normName === cleanQuery) {
          custMatch = isAr ? 'اسم العميل (مطابقة تامة)' : 'Customer Name (Exact)';
          custRel = 90;
        } else if (cleanPhone && normPhone === cleanPhone) {
          custMatch = isAr ? 'هاتف العميل' : 'Customer Phone';
          custRel = 85;
        } else if (normName.startsWith(cleanQuery)) {
          custMatch = isAr ? 'اسم العميل' : 'Customer Name';
          custRel = 65;
        } else if (normName.includes(cleanQuery)) {
          custMatch = isAr ? 'اسم العميل' : 'Customer Name';
          custRel = 45;
        }

        if (custRel > 0) {
          seenCustomers.add(s.senderName);
          customerResults.push({
            entityType: 'CUSTOMER',
            entityId: s.senderId || `cust-${s.senderName}`,
            primaryReference: s.senderId || `CUST-${s.id.slice(-4)}`,
            primaryLabel: s.senderName,
            secondaryLabel: isAr ? `مرسل الشحنة ${s.trackingNumber || s.id}` : `Sender of ${s.trackingNumber || s.id}`,
            status: 'ACTIVE',
            matchedField: custMatch,
            relevance: custRel,
            rawReference: s,
            contextInfo: {
              phone: s.senderPhone,
              route: `${originCity} → ${destCity}`,
            },
          });
        }
      }
    });

    // --- Search in Trips ---
    scopedTrips.forEach((t) => {
      if (seenTrips.has(t.id)) return;

      const normTripId = normalizeText(t.id);
      const normFlight = normalizeText(t.flightNumber);
      const normTraveler = normalizeText(t.travelerName);
      const normTravelerId = normalizeText(t.travelerId);
      const normAirline = normalizeText(t.airline);
      const normPnr = normalizeText(t.pnrCode);

      let matchedField = '';
      let relevance = 0;

      if (normalizeId(t.id) === cleanId || normTripId === cleanQuery) {
        matchedField = isAr ? 'رقم الرحلة (معرف النظام)' : 'Trip ID';
        relevance = 100;
      } else if (normFlight === cleanQuery || normalizeId(t.flightNumber) === cleanId) {
        matchedField = isAr ? 'رقم رحلة الطيران' : 'Flight Number';
        relevance = 95;
      } else if (t.travelerId && normalizeId(t.travelerId) === cleanId) {
        matchedField = isAr ? 'معرف المسافر' : 'Traveler ID';
        relevance = 90;
      } else if (normTraveler === cleanQuery) {
        matchedField = isAr ? 'اسم المسافر (مطابقة تامة)' : 'Traveler Name (Exact)';
        relevance = 85;
      } else if (normFlight.startsWith(cleanQuery)) {
        matchedField = isAr ? 'رقم رحلة الطيران' : 'Flight Number';
        relevance = 75;
      } else if (normTraveler.includes(cleanQuery)) {
        matchedField = isAr ? 'اسم المسافر' : 'Traveler Name';
        relevance = 60;
      } else if (normAirline.includes(cleanQuery) || normPnr.includes(cleanQuery)) {
        matchedField = isAr ? 'شركة الطيران / الحجز' : 'Airline / PNR';
        relevance = 40;
      }

      if (relevance > 0) {
        seenTrips.add(t.id);
        const originCity = t.originCityAr || (t.originHubId === 'hub-amm' ? 'AMM (عمّان)' : 'ALG (الجزائر)');
        const destCity = t.destCityAr || (t.destinationHubId === 'hub-alg' ? 'ALG (الجزائر)' : 'AMM (عمّان)');

        tripResults.push({
          entityType: 'TRIP',
          entityId: t.id,
          primaryReference: t.id,
          primaryLabel: `${t.flightNumber} — ${t.travelerName || 'Traveler'}`,
          secondaryLabel: `${originCity} → ${destCity} | ${t.departureTime?.slice(0, 10) || t.flightDate || '2026-09-12'}`,
          status: t.status,
          matchedField,
          relevance,
          rawReference: t,
          contextInfo: {
            flightNumber: t.flightNumber,
            route: `${originCity} → ${destCity}`,
            weight: t.allocatedWeightKg || t.availableWeightKg || 0,
            date: t.departureTime?.slice(0, 10) || t.flightDate || '2026-09-12',
          },
        });

        // Also index Traveler entity cleanly
        if (t.travelerName && !seenTravelers.has(t.travelerName)) {
          seenTravelers.add(t.travelerName);
          let travRel = 0;
          let travField = '';
          if (normTraveler === cleanQuery) {
            travField = isAr ? 'اسم المسافر' : 'Traveler Name';
            travRel = 90;
          } else if (t.travelerId && normalizeId(t.travelerId) === cleanId) {
            travField = isAr ? 'معرف المسافر' : 'Traveler ID';
            travRel = 95;
          } else if (normTraveler.includes(cleanQuery)) {
            travField = isAr ? 'اسم المسافر' : 'Traveler Name';
            travRel = 60;
          } else if (normFlight === cleanQuery) {
            travField = isAr ? 'رحلة المسافر' : 'Traveler Flight';
            travRel = 50;
          }

          if (travRel > 0) {
            travelerResults.push({
              entityType: 'TRAVELER',
              entityId: t.travelerId || `trav-${t.travelerName}`,
              primaryReference: t.travelerId || `TRAV-${t.id.slice(-4)}`,
              primaryLabel: t.travelerName,
              secondaryLabel: `${t.flightNumber} | ${originCity} → ${destCity}`,
              status: t.kycStatus || 'VERIFIED',
              matchedField: travField,
              relevance: travRel,
              rawReference: t,
              contextInfo: {
                flightNumber: t.flightNumber,
                phone: t.travelerPhone ? `${t.travelerPhone.slice(0, 7)}***` : undefined, // Masked phone for privacy
              },
            });
          }
        }
      }
    });

    // --- Search in Manifests ---
    scopedManifests.forEach((m) => {
      if (seenManifests.has(m.id)) return;

      const normManifestId = normalizeText(m.id || m.manifestCode || m.manifestNumber);
      const normFlight = normalizeText(m.flightNumber);
      const normTraveler = normalizeText(m.travelerName || m.assignedTravelerName);
      const normTripId = normalizeText(m.tripId);
      const normOriginCode = normalizeText(m.originHubCode || m.originHubId);
      const normDestCode = normalizeText(m.destHubCode || m.destinationHubId);

      let matchedField = '';
      let relevance = 0;

      if (normalizeId(m.id) === cleanId || normManifestId === cleanQuery) {
        matchedField = isAr ? 'رقم المانيفست (مطابقة تامة)' : 'Manifest ID (Exact)';
        relevance = 100;
      } else if (m.tripId && normalizeId(m.tripId) === cleanId) {
        matchedField = isAr ? 'معرف الرحلة التابع' : 'Related Trip ID';
        relevance = 85;
      } else if (normFlight === cleanQuery || normalizeId(m.flightNumber) === cleanId) {
        matchedField = isAr ? 'رقم رحلة المانيفست' : 'Manifest Flight';
        relevance = 80;
      } else if (normManifestId.startsWith(cleanQuery)) {
        matchedField = isAr ? 'رقم المانيفست' : 'Manifest ID';
        relevance = 75;
      } else if (normTraveler.includes(cleanQuery)) {
        matchedField = isAr ? 'مسافر المانيفست' : 'Manifest Traveler';
        relevance = 60;
      } else if (normFlight.includes(cleanQuery) || normOriginCode.includes(cleanQuery) || normDestCode.includes(cleanQuery)) {
        matchedField = isAr ? 'مسار أو رحلة المانيفست' : 'Route / Flight';
        relevance = 40;
      }

      if (relevance > 0) {
        seenManifests.add(m.id);
        const originCode = m.originHubCode || (m.originHubId === 'hub-amm' ? 'AMM' : 'ALG');
        const destCode = m.destHubCode || (m.destinationHubId === 'hub-alg' ? 'ALG' : 'AMM');

        manifestResults.push({
          entityType: 'MANIFEST',
          entityId: m.id,
          primaryReference: m.id,
          primaryLabel: `${m.travelerName || m.assignedTravelerName || 'Traveler'} • ${m.flightNumber || 'RJ517'}`,
          secondaryLabel: `${originCode} → ${destCode} | ${m.totalPackages || m.totalShipmentsCount || 0} ${isAr ? 'طرود' : 'pkgs'} (${m.totalWeightKg || 0} KG)`,
          status: m.status || m.currentStatus || 'READY',
          matchedField,
          relevance,
          rawReference: m,
          contextInfo: {
            flightNumber: m.flightNumber,
            route: `${originCode} → ${destCode}`,
            weight: m.totalWeightKg || 0,
            date: m.dispatchTimestamp?.slice(0, 10) || m.createdAt?.slice(0, 10),
          },
        });
      }
    });

    // --- Search in Incidents ---
    scopedIncidents.forEach((inc) => {
      if (seenIncidents.has(inc.id)) return;

      const normIncId = normalizeText(inc.id || inc.incidentNumber);
      const normTracking = normalizeText(inc.trackingNumber);
      const normRef = normalizeText(inc.referenceNumber);
      const normManifest = normalizeText(inc.relatedManifestId);
      const normTrip = normalizeText(inc.relatedTripId);
      const normFlight = normalizeText(inc.flightNumber);
      const normDesc = normalizeText(inc.description);
      const normType = normalizeText(inc.type || inc.category);

      let matchedField = '';
      let relevance = 0;

      if (normalizeId(inc.id) === cleanId || normIncId === cleanQuery) {
        matchedField = isAr ? 'رقم البلاغ (مطابقة تامة)' : 'Incident ID (Exact)';
        relevance = 100;
      } else if (inc.trackingNumber && (normalizeId(inc.trackingNumber) === cleanId || normTracking.includes(cleanQuery))) {
        matchedField = isAr ? 'رقم تتبع الشحنة المتأثرة' : 'Related Tracking Number';
        relevance = 90;
      } else if (inc.relatedManifestId && (normalizeId(inc.relatedManifestId) === cleanId || normManifest.includes(cleanQuery))) {
        matchedField = isAr ? 'رقم المانيفست المتأثر' : 'Related Manifest ID';
        relevance = 85;
      } else if (inc.referenceNumber && (normalizeId(inc.referenceNumber) === cleanId || normRef.includes(cleanQuery))) {
        matchedField = isAr ? 'المرجع التشغيلي للبلاغ' : 'Operational Reference';
        relevance = 80;
      } else if (normType.includes(cleanQuery)) {
        matchedField = isAr ? 'نوع البلاغ التشغيلي' : 'Incident Type';
        relevance = 65;
      } else if (normDesc.includes(cleanQuery) || normFlight.includes(cleanQuery) || normTrip.includes(cleanQuery)) {
        matchedField = isAr ? 'تفاصيل البلاغ' : 'Incident Description';
        relevance = 45;
      }

      if (relevance > 0) {
        seenIncidents.add(inc.id);
        incidentResults.push({
          entityType: 'INCIDENT',
          entityId: inc.id,
          primaryReference: inc.incidentNumber || inc.id,
          primaryLabel: inc.type || inc.category || 'OPERATIONAL_INCIDENT',
          secondaryLabel: `${isAr ? 'المرجع:' : 'Ref:'} ${inc.referenceNumber || inc.relatedManifestId || inc.trackingNumber || '-'} | ${inc.assignedRole || inc.assignedEmployeeName || 'Hub Manager'}`,
          status: inc.status,
          matchedField,
          relevance,
          rawReference: inc,
          contextInfo: {
            isBlocking: inc.isBlocking,
            date: inc.createdAt?.slice(0, 10),
          },
        });
      }
    });

    // --- Search in Settlements (Permissions Enforced) ---
    scopedSettlements.forEach((stl) => {
      if (seenSettlements.has(stl.id)) return;

      const normStlId = normalizeText(stl.id || stl.settlementNumber);
      const normTracking = normalizeText(stl.trackingNumber);
      const normTrip = normalizeText(stl.tripId);
      const normManifest = normalizeText(stl.manifestId);
      const normUser = normalizeText(stl.relatedUserName);
      const normType = normalizeText(stl.type);
      const normReceipt = normalizeText(stl.receiptNumber);

      let matchedField = '';
      let relevance = 0;

      if (normalizeId(stl.id) === cleanId || normStlId === cleanQuery) {
        matchedField = isAr ? 'رقم التسوية (مطابقة تامة)' : 'Settlement ID (Exact)';
        relevance = 100;
      } else if (stl.trackingNumber && (normalizeId(stl.trackingNumber) === cleanId || normTracking === cleanQuery)) {
        matchedField = isAr ? 'رقم التتبع المرتبط' : 'Related Tracking Number';
        relevance = 90;
      } else if (stl.tripId && (normalizeId(stl.tripId) === cleanId || normTrip === cleanQuery)) {
        matchedField = isAr ? 'معرف الرحلة المرتبط' : 'Related Trip ID';
        relevance = 85;
      } else if (stl.manifestId && (normalizeId(stl.manifestId) === cleanId || normManifest === cleanQuery)) {
        matchedField = isAr ? 'معرف المانيفست المرتبط' : 'Related Manifest ID';
        relevance = 85;
      } else if (normUser.includes(cleanQuery)) {
        matchedField = isAr ? 'اسم الطرف المالي' : 'Party Name';
        relevance = 65;
      } else if (normReceipt.includes(cleanQuery) || normType.includes(cleanQuery)) {
        matchedField = isAr ? 'رقم الإيصال / النوع' : 'Receipt / Type';
        relevance = 50;
      }

      if (relevance > 0) {
        seenSettlements.add(stl.id);
        const typeLabel =
          stl.type === 'CUSTOMER_PAYMENT'
            ? isAr ? 'تحصيل عميل' : 'Customer Payment'
            : stl.type === 'TRAVELER_PAYOUT'
            ? isAr ? 'صرف مستحقات مسافر' : 'Traveler Payout'
            : isAr ? 'استرداد مالي' : 'Refund';

        settlementResults.push({
          entityType: 'SETTLEMENT',
          entityId: stl.id,
          primaryReference: stl.settlementNumber || stl.id,
          primaryLabel: `${typeLabel} — ${stl.relatedUserName || 'Party'}`,
          secondaryLabel: `${stl.finalAmount?.toLocaleString()} ${stl.settlementCurrency || 'DZD'} | ${stl.route || 'JO → DZ'}`,
          status: stl.status,
          matchedField,
          relevance,
          rawReference: stl,
          contextInfo: {
            amount: stl.finalAmount,
            currency: stl.settlementCurrency,
            route: stl.route,
            date: stl.processedAt?.slice(0, 10),
          },
        });
      }
    });

    // --- Search in Shipping Rates ---
    scopedShippingRates.forEach((rate) => {
      if (seenRates.has(rate.id)) return;

      const normRateId = normalizeText(rate.id);
      const normRoute = normalizeText(`${rate.originCountry} ${rate.destinationCountry}`);
      const normService = normalizeText(rate.serviceType);
      const normType = normalizeText(rate.rateType);
      const normCur = normalizeText(rate.currency);

      let matchedField = '';
      let relevance = 0;

      if (normalizeId(rate.id) === cleanId || normRateId === cleanQuery) {
        matchedField = isAr ? 'معرف التعرفة (مطابقة تامة)' : 'Rate ID (Exact)';
        relevance = 100;
      } else if (cleanQuery === 'rate' || cleanQuery === 'pricing' || cleanQuery === 'تعرفة' || cleanQuery === 'سعر') {
        matchedField = isAr ? 'قائمة الأسعار' : 'Pricing Index';
        relevance = 70;
      } else if (normRoute.includes(cleanQuery) || normCur === cleanQuery) {
        matchedField = isAr ? 'المسار / العملة' : 'Route / Currency';
        relevance = 65;
      } else if (normService.includes(cleanQuery) || normType.includes(cleanQuery)) {
        matchedField = isAr ? 'نوع الخدمة' : 'Service Type';
        relevance = 50;
      }

      if (relevance > 0) {
        seenRates.add(rate.id);
        const originName = rate.originCountry === 'JO' ? (isAr ? 'الأردن' : 'Jordan') : (isAr ? 'الجزائر' : 'Algeria');
        const destName = rate.destinationCountry === 'DZ' ? (isAr ? 'الجزائر' : 'Algeria') : (isAr ? 'الأردن' : 'Jordan');

        rateResults.push({
          entityType: 'SHIPPING_RATE',
          entityId: rate.id,
          primaryReference: rate.id,
          primaryLabel: `${rate.rateType === 'CUSTOMER_SHIPPING' ? (isAr ? 'شحن عملاء' : 'Customer Shipping') : (isAr ? 'تعويض مسافرين' : 'Traveler Comp')} (${originName} → ${destName})`,
          secondaryLabel: `${rate.ratePerKg} ${rate.currency} / KG | v${rate.version}`,
          status: rate.status,
          matchedField,
          relevance,
          rawReference: rate,
          contextInfo: {
            route: `${originName} → ${destName}`,
            serviceType: rate.serviceType,
            currency: rate.currency,
          },
        });
      }
    });

    // --- Search in Exchange Rates ---
    scopedExchangeRates.forEach((fx) => {
      const pairKey = `${fx.baseCurrency}/${fx.quoteCurrency}`;
      if (seenRates.has(fx.id)) return;

      const normFxId = normalizeText(fx.id);
      const normBase = normalizeText(fx.baseCurrency);
      const normQuote = normalizeText(fx.quoteCurrency);
      const normPair1 = normalizeText(`${fx.baseCurrency} ${fx.quoteCurrency}`);
      const normPair2 = normalizeText(`${fx.baseCurrency}/${fx.quoteCurrency}`);
      const normPair3 = normalizeText(`${fx.baseCurrency}-${fx.quoteCurrency}`);

      let matchedField = '';
      let relevance = 0;

      if (normalizeId(fx.id) === cleanId || normFxId === cleanQuery) {
        matchedField = isAr ? 'معرف سعر الصرف' : 'FX Rate ID';
        relevance = 100;
      } else if (
        cleanQuery === normPair1 ||
        cleanQuery === normPair2 ||
        cleanQuery === normPair3 ||
        (cleanQuery.includes(normBase) && cleanQuery.includes(normQuote))
      ) {
        matchedField = isAr ? 'زوج العملات (مطابقة تامة)' : 'Currency Pair (Exact)';
        relevance = 95;
      } else if (cleanQuery === normBase || cleanQuery === normQuote || cleanQuery === 'jod' || cleanQuery === 'dzd') {
        matchedField = isAr ? 'رمز العملة' : 'Currency Code';
        relevance = 75;
      } else if (cleanQuery === 'fx' || cleanQuery === 'exchange' || cleanQuery === 'صرف' || cleanQuery === 'تحويل') {
        matchedField = isAr ? 'سعر الصرف اليومي' : 'Daily FX';
        relevance = 65;
      }

      if (relevance > 0) {
        seenRates.add(fx.id);
        rateResults.push({
          entityType: 'EXCHANGE_RATE',
          entityId: fx.id,
          primaryReference: fx.id,
          primaryLabel: `${pairKey} (FX Rate)`,
          secondaryLabel: `${isAr ? 'شراء:' : 'BUY:'} ${fx.buyRate} | ${isAr ? 'بيع:' : 'SELL:'} ${fx.sellRate} | v${fx.version}`,
          status: fx.status,
          matchedField,
          relevance,
          rawReference: fx,
          contextInfo: {
            pair: pairKey,
            buyRate: fx.buyRate,
            sellRate: fx.sellRate,
          },
        });
      }
    });

    // Sort by Relevance (Highest First)
    const sorter = (a: GlobalSearchResult, b: GlobalSearchResult) => b.relevance - a.relevance;

    shipmentResults.sort(sorter);
    tripResults.sort(sorter);
    manifestResults.sort(sorter);
    travelerResults.sort(sorter);
    customerResults.sort(sorter);
    settlementResults.sort(sorter);
    incidentResults.sort(sorter);
    rateResults.sort(sorter);

    const totalCount =
      shipmentResults.length +
      tripResults.length +
      manifestResults.length +
      travelerResults.length +
      customerResults.length +
      settlementResults.length +
      incidentResults.length +
      rateResults.length;

    return {
      shipments: shipmentResults,
      trips: tripResults,
      manifests: manifestResults,
      travelers: travelerResults,
      customers: customerResults,
      settlements: settlementResults,
      incidents: incidentResults,
      rates: rateResults,
      totalCount,
    };
  }, [
    cleanQuery,
    cleanPhone,
    cleanId,
    scopedShipments,
    scopedTrips,
    scopedManifests,
    scopedIncidents,
    scopedSettlements,
    scopedShippingRates,
    scopedExchangeRates,
    isAr,
  ]);

  // Combined Top Results for "ALL" View
  const allCombinedResults = useMemo(() => {
    const list = [
      ...groupedResults.shipments,
      ...groupedResults.trips,
      ...groupedResults.manifests,
      ...groupedResults.travelers,
      ...groupedResults.customers,
      ...groupedResults.settlements,
      ...groupedResults.incidents,
      ...groupedResults.rates,
    ];
    return list.sort((a, b) => b.relevance - a.relevance);
  }, [groupedResults]);

  // Handle Source Screen Navigation
  const handleNavigateToSource = (item: GlobalSearchResult) => {
    if (!onNavigateToSection) return;
    switch (item.entityType) {
      case 'MANIFEST':
        onNavigateToSection('MANIFESTS', item.entityId);
        break;
      case 'TRIP':
        onNavigateToSection('TRIPS', item.entityId);
        break;
      case 'INCIDENT':
        onNavigateToSection('OPERATIONAL_INCIDENTS', item.entityId);
        break;
      case 'SETTLEMENT':
        onNavigateToSection('SETTLEMENT_HISTORY', item.entityId);
        break;
      case 'SHIPPING_RATE':
        onNavigateToSection('SHIPPING_RATES', item.entityId);
        break;
      case 'EXCHANGE_RATE':
        onNavigateToSection('EXCHANGE_RATES', item.entityId);
        break;
      case 'SHIPMENT':
        // For shipments, navigate to suitable view based on status
        if (item.rawReference?.currentStatus === 'RECEIVED_AT_ORIGIN') {
          onNavigateToSection('PACKAGE_INSPECTION', item.entityId);
        } else if (item.rawReference?.currentStatus === 'INSPECTED_SEALED') {
          onNavigateToSection('MATCHING', item.entityId);
        } else if (item.rawReference?.currentStatus === 'READY_FOR_PICKUP') {
          onNavigateToSection('FINAL_DELIVERY', item.entityId);
        } else {
          onNavigateToSection('DESTINATION_INTAKE', item.entityId);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="max-w-3xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Search className="w-5 h-5 text-amber-500" />
                {isAr ? 'البحث الشامل' : 'Global Search'}
              </h1>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {isAr
                  ? 'البحث الموحد في بيانات الشحن والرحلات والمانيفست والمسافرين والتسويات والحالات التشغيلية والأسعار ضمن صلاحيات المستخدم الحالية.'
                  : 'Unified search across shipments, trips, manifests, travelers, settlements, operational incidents, and rates within current user permissions.'}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{userRole}</span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative mt-5">
            <input
              type="text"
              autoFocus
              placeholder={
                isAr
                  ? 'ابحث برقم التتبع، الرحلة، المانيفست، الاسم، الهاتف، التسوية أو الحالة...'
                  : 'Search by tracking #, trip ID, manifest, name, phone, settlement, or incident...'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-sm bg-slate-50 border border-slate-300 rounded-2xl ps-11 pe-20 py-3.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-400 transition-all font-medium shadow-inner"
            />
            <Search className="w-5 h-5 text-slate-400 absolute start-3.5 top-4 pointer-events-none" />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSelectedResult(null);
                }}
                className="absolute end-3 top-2.5 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 bg-slate-200/70 hover:bg-slate-200 rounded-xl font-bold transition-all flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                {isAr ? 'مسح' : 'Clear'}
              </button>
            )}
          </div>

          {/* Filter Chips (Only permitted categories displayed) */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('ALL')}
              className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategoryFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isAr ? 'الكل' : 'All'}
              <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full font-mono">
                {groupedResults.totalCount}
              </span>
            </button>

            {canViewShipments && (
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('SHIPMENTS')}
                className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCategoryFilter === 'SHIPMENTS'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                {isAr ? 'الشحنات' : 'Shipments'}
                <span className="text-[10px] px-1.5 py-0.2 bg-slate-200/80 rounded-full font-mono">
                  {groupedResults.shipments.length}
                </span>
              </button>
            )}

            {canViewTrips && (
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('TRIPS')}
                className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCategoryFilter === 'TRIPS'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Plane className="w-3.5 h-3.5" />
                {isAr ? 'الرحلات' : 'Trips'}
                <span className="text-[10px] px-1.5 py-0.2 bg-slate-200/80 rounded-full font-mono">
                  {groupedResults.trips.length}
                </span>
              </button>
            )}

            {canViewManifests && (
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('MANIFESTS')}
                className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCategoryFilter === 'MANIFESTS'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {isAr ? 'المانيفست' : 'Manifests'}
                <span className="text-[10px] px-1.5 py-0.2 bg-slate-200/80 rounded-full font-mono">
                  {groupedResults.manifests.length}
                </span>
              </button>
            )}

            {canViewTravelers && (
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('TRAVELERS')}
                className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCategoryFilter === 'TRAVELERS'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                {isAr ? 'المسافرون' : 'Travelers'}
                <span className="text-[10px] px-1.5 py-0.2 bg-slate-200/80 rounded-full font-mono">
                  {groupedResults.travelers.length}
                </span>
              </button>
            )}

            {canViewCustomers && (
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('CUSTOMERS')}
                className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCategoryFilter === 'CUSTOMERS'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                {isAr ? 'العملاء' : 'Customers'}
                <span className="text-[10px] px-1.5 py-0.2 bg-slate-200/80 rounded-full font-mono">
                  {groupedResults.customers.length}
                </span>
              </button>
            )}

            {(canViewCustomerPayments || canViewTravelerPayouts) && (
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('SETTLEMENTS')}
                className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCategoryFilter === 'SETTLEMENTS'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                {isAr ? 'التسويات المالية' : 'Settlements'}
                <span className="text-[10px] px-1.5 py-0.2 bg-slate-200/80 rounded-full font-mono">
                  {groupedResults.settlements.length}
                </span>
              </button>
            )}

            {canViewIncidents && (
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('INCIDENTS')}
                className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCategoryFilter === 'INCIDENTS'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {isAr ? 'البلاغات التشغيلية' : 'Incidents'}
                <span className="text-[10px] px-1.5 py-0.2 bg-slate-200/80 rounded-full font-mono">
                  {groupedResults.incidents.length}
                </span>
              </button>
            )}

            {(canViewShippingRates || canViewExchangeRates) && (
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('RATES')}
                className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCategoryFilter === 'RATES'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                {isAr ? 'الأسعار والعملات' : 'Rates & FX'}
                <span className="text-[10px] px-1.5 py-0.2 bg-slate-200/80 rounded-full font-mono">
                  {groupedResults.rates.length}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Results Container */}
      {!cleanQuery ? (
        /* Empty Query State (Rule 37 & 90) */
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
            <Search className="w-8 h-8" />
          </div>
          <div className="font-bold text-slate-800 text-base">
            {isAr ? 'ابحث في بيانات THOUESA التشغيلية والمالية من مكان واحد' : 'Search THOUESA operational and financial records from one place'}
          </div>
          <div className="text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
            {isAr
              ? 'أدخل رقم التتبع (مثل TH-0182)، رقم الرحلة (TRIP-0142)، المانيفست (MF-0142)، التسوية (STL-C-001)، أو زوج العملات (JOD / DZD).'
              : 'Enter tracking number (e.g. TH-0182), trip ID (TRIP-0142), manifest (MF-0142), settlement (STL-C-001), or currency pair (JOD / DZD).'}
          </div>

          <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
            <button
              type="button"
              onClick={() => setQuery('TH-0182')}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 font-bold transition-colors cursor-pointer"
            >
              TH-0182
            </button>
            <button
              type="button"
              onClick={() => setQuery('TRIP-0142')}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 font-bold transition-colors cursor-pointer"
            >
              TRIP-0142
            </button>
            <button
              type="button"
              onClick={() => setQuery('MF-0142')}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 font-bold transition-colors cursor-pointer"
            >
              MF-0142
            </button>
            <button
              type="button"
              onClick={() => setQuery('INC-0142')}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 font-bold transition-colors cursor-pointer"
            >
              INC-0142
            </button>
            <button
              type="button"
              onClick={() => setQuery('STL-C-00182')}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 font-bold transition-colors cursor-pointer"
            >
              STL-C-00182
            </button>
            <button
              type="button"
              onClick={() => setQuery('JOD DZD')}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 font-bold transition-colors cursor-pointer"
            >
              JOD / DZD
            </button>
          </div>
        </div>
      ) : groupedResults.totalCount === 0 ? (
        /* No Results State (Rule 91 & 92) */
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <div className="font-bold text-slate-700 text-sm">
            {isAr ? `لم يتم العثور على أي نتائج مطابقة لـ "${query}"` : `No matching results found for "${query}"`}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {isAr ? 'تأكد من كتابة الرقم بشكل صحيح أو جرب استخدام معرف آخر.' : 'Check query spelling or try another identifier.'}
          </div>
        </div>
      ) : (
        /* Results Content (Grouped & Filtered) */
        <div className="space-y-6">
          {/* Summary Header (Permitted Results Only - Rule 49 & 101) */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <div>
              {isAr ? 'تم العثور على' : 'Found'}{' '}
              <span className="font-black text-slate-900 font-mono">{groupedResults.totalCount}</span>{' '}
              {isAr ? 'نتيجة مصرح بها' : 'permitted result(s)'}
            </div>
            {activeCategoryFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('ALL')}
                className="text-amber-600 hover:underline font-bold cursor-pointer"
              >
                {isAr ? 'عرض كل المجموعات' : 'Show all groups'}
              </button>
            )}
          </div>

          {/* Render Result Card Helper */}
          {renderResultCards(
            activeCategoryFilter === 'ALL' ? allCombinedResults :
            activeCategoryFilter === 'SHIPMENTS' ? groupedResults.shipments :
            activeCategoryFilter === 'TRIPS' ? groupedResults.trips :
            activeCategoryFilter === 'MANIFESTS' ? groupedResults.manifests :
            activeCategoryFilter === 'TRAVELERS' ? groupedResults.travelers :
            activeCategoryFilter === 'CUSTOMERS' ? groupedResults.customers :
            activeCategoryFilter === 'SETTLEMENTS' ? groupedResults.settlements :
            activeCategoryFilter === 'INCIDENTS' ? groupedResults.incidents :
            groupedResults.rates,
            locale,
            setSelectedResult,
            handleNavigateToSource
          )}
        </div>
      )}

      {/* DetailsDrawer (Read-Only Preview - Rule 63 & 117) */}
      {selectedResult && (
        <DetailsDrawer
          isOpen={true}
          onClose={() => setSelectedResult(null)}
          title={
            selectedResult.entityType === 'SHIPMENT' ? (isAr ? 'تفاصيل الطرد (شحنة)' : 'Shipment Details') :
            selectedResult.entityType === 'TRIP' ? (isAr ? 'تفاصيل الرحلة' : 'Trip Details') :
            selectedResult.entityType === 'MANIFEST' ? (isAr ? 'تفاصيل المانيفست الرقمي' : 'Manifest Details') :
            selectedResult.entityType === 'TRAVELER' ? (isAr ? 'بيانات المسافر المعتمد' : 'Traveler Profile') :
            selectedResult.entityType === 'CUSTOMER' ? (isAr ? 'بيانات العميل' : 'Customer Details') :
            selectedResult.entityType === 'SETTLEMENT' ? (isAr ? 'تفاصيل التسوية المالية' : 'Settlement Details') :
            selectedResult.entityType === 'INCIDENT' ? (isAr ? 'تفاصيل البلاغ التشغيلي' : 'Incident Details') :
            (isAr ? 'تفاصيل التعرفة وسعر الصرف' : 'Rate / FX Details')
          }
          subtitle={selectedResult.primaryReference}
          locale={locale}
          badge={
            <StatusBadge
              domain={
                selectedResult.entityType === 'SHIPMENT' ? 'SHIPMENT' :
                selectedResult.entityType === 'TRIP' ? 'TRIP' :
                selectedResult.entityType === 'MANIFEST' ? 'MANIFEST' :
                selectedResult.entityType === 'INCIDENT' ? 'INCIDENT' :
                selectedResult.entityType === 'SETTLEMENT' ? 'SETTLEMENT' :
                'PRICING'
              }
              status={selectedResult.status}
              locale={locale}
              size="sm"
            />
          }
          icon={
            selectedResult.entityType === 'SHIPMENT' ? <Package className="w-5 h-5 text-amber-600" /> :
            selectedResult.entityType === 'TRIP' ? <Plane className="w-5 h-5 text-sky-600" /> :
            selectedResult.entityType === 'MANIFEST' ? <FileSpreadsheet className="w-5 h-5 text-indigo-600" /> :
            selectedResult.entityType === 'TRAVELER' || selectedResult.entityType === 'CUSTOMER' ? <User className="w-5 h-5 text-teal-600" /> :
            selectedResult.entityType === 'SETTLEMENT' ? <Receipt className="w-5 h-5 text-emerald-600" /> :
            selectedResult.entityType === 'INCIDENT' ? <AlertTriangle className="w-5 h-5 text-rose-600" /> :
            <TrendingUp className="w-5 h-5 text-purple-600" />
          }
          footerActions={
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => setSelectedResult(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
              {onNavigateToSection && (
                <button
                  type="button"
                  onClick={() => {
                    handleNavigateToSource(selectedResult);
                    setSelectedResult(null);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {isAr ? 'الانتقال للشاشة الأصلية' : 'Open Source Screen'}
                </button>
              )}
            </div>
          }
        >
          {renderDrawerContent(selectedResult, locale)}
        </DetailsDrawer>
      )}
    </div>
  );
};

// Helper: Render Result Cards
function renderResultCards(
  items: GlobalSearchResult[],
  locale: Locale,
  onSelect: (item: GlobalSearchResult) => void,
  onNavigate: (item: GlobalSearchResult) => void
) {
  const isAr = locale === 'ar';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      {items.map((res) => {
        const borderHover =
          res.entityType === 'SHIPMENT' ? 'hover:border-amber-400' :
          res.entityType === 'TRIP' ? 'hover:border-sky-400' :
          res.entityType === 'MANIFEST' ? 'hover:border-indigo-400' :
          res.entityType === 'TRAVELER' || res.entityType === 'CUSTOMER' ? 'hover:border-teal-400' :
          res.entityType === 'SETTLEMENT' ? 'hover:border-emerald-400' :
          res.entityType === 'INCIDENT' ? 'hover:border-rose-400' :
          'hover:border-purple-400';

        const tagColor =
          res.entityType === 'SHIPMENT' ? 'bg-amber-50 text-amber-800 border-amber-200' :
          res.entityType === 'TRIP' ? 'bg-sky-50 text-sky-800 border-sky-200' :
          res.entityType === 'MANIFEST' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
          res.entityType === 'TRAVELER' || res.entityType === 'CUSTOMER' ? 'bg-teal-50 text-teal-800 border-teal-200' :
          res.entityType === 'SETTLEMENT' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
          res.entityType === 'INCIDENT' ? 'bg-rose-50 text-rose-800 border-rose-200' :
          'bg-purple-50 text-purple-800 border-purple-200';

        return (
          <div
            key={`${res.entityType}-${res.entityId}`}
            onClick={() => onSelect(res)}
            className={`p-4 rounded-2xl border border-slate-200 bg-white ${borderHover} transition-all cursor-pointer flex flex-col justify-between shadow-2xs hover:shadow-xs group`}
          >
            <div>
              {/* Header: Entity Badge & Primary Reference & Status */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border font-mono ${tagColor}`}>
                    {res.entityType}
                  </span>
                  <span className="font-mono font-black text-xs text-slate-900 group-hover:text-amber-600 transition-colors">
                    {res.primaryReference}
                  </span>
                </div>
                <StatusBadge
                  domain={
                    res.entityType === 'SHIPMENT' ? 'SHIPMENT' :
                    res.entityType === 'TRIP' ? 'TRIP' :
                    res.entityType === 'MANIFEST' ? 'MANIFEST' :
                    res.entityType === 'INCIDENT' ? 'INCIDENT' :
                    res.entityType === 'SETTLEMENT' ? 'SETTLEMENT' :
                    'PRICING'
                  }
                  status={res.status}
                  locale={locale}
                  size="sm"
                />
              </div>

              {/* Main Labels */}
              <div className="font-bold text-xs text-slate-900 mb-1">
                {res.primaryLabel}
              </div>
              {res.secondaryLabel && (
                <div className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                  {res.secondaryLabel}
                </div>
              )}
            </div>

            {/* Bottom Meta & Matched Field */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-1 text-[10px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 font-mono">
                <span className="text-slate-400">{isAr ? 'مطابق عبر:' : 'Matched by:'}</span>
                <span className="font-bold text-slate-800">{res.matchedField}</span>
              </div>
              <span className="text-amber-600 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                {isAr ? 'عرض التفاصيل' : 'View'} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Helper: Render DetailsDrawer Content by Entity
function renderDrawerContent(item: GlobalSearchResult, locale: Locale) {
  const isAr = locale === 'ar';
  const data = item.rawReference;

  if (item.entityType === 'SHIPMENT') {
    return (
      <div className="space-y-4 text-xs">
        {/* Key Info Banner */}
        <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
          <div className="text-[11px] text-amber-700 font-bold">{isAr ? 'رقم التتبع المعتمد' : 'Tracking Number'}</div>
          <div className="font-mono font-black text-sm text-slate-900">{data.trackingNumber || data.id}</div>
          <div className="text-[11px] text-slate-600 mt-1">
            {data.originHubId === 'hub-amm' ? 'AMM (عمّان)' : 'ALG (الجزائر)'} → {data.destinationHubId === 'hub-alg' ? 'ALG (الجزائر)' : 'AMM (عمّان)'}
          </div>
        </div>

        {/* Sender & Recipient */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div>
            <div className="text-slate-400 text-[10px] font-bold">{isAr ? 'المرسل' : 'Sender'}</div>
            <div className="font-bold text-slate-900 mt-0.5">{data.senderName || '-'}</div>
            <div className="text-slate-500 font-mono text-[11px]">{data.senderPhone || '-'}</div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px] font-bold">{isAr ? 'المستلم' : 'Recipient'}</div>
            <div className="font-bold text-slate-900 mt-0.5">{data.recipientName || '-'}</div>
            <div className="text-slate-500 font-mono text-[11px]">{data.recipientPhone || '-'}</div>
          </div>
        </div>

        {/* Weight & Security */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]">
          <div>
            <span className="text-slate-400 block text-[10px]">{isAr ? 'الوزن الفعلي' : 'Actual Weight'}</span>
            <span className="font-bold text-slate-800">{data.actualWeightKg || data.declaredWeightKg || data.estimatedWeightKg || '-'} KG</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">{isAr ? 'الختم الأمني' : 'Security Seal'}</span>
            <span className="font-bold text-teal-700">{data.securitySealId || data.securitySealNumber || '-'}</span>
          </div>
        </div>

        {/* Storage Location if ready */}
        {data.storageLocation && (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl">
            <span className="text-[10px] font-bold text-teal-800 block">{isAr ? 'موقع التخزين الحالي بالفرع' : 'Current Storage Location'}</span>
            <span className="font-mono font-black text-xs text-teal-950">{data.storageLocation}</span>
          </div>
        )}

        {/* Assigned Flight */}
        {data.flightNumber && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between font-mono text-xs">
            <span className="text-slate-500">{isAr ? 'الرحلة المرتبطة:' : 'Linked Flight:'}</span>
            <span className="font-bold text-slate-900">{data.flightNumber} ({data.assignedTripId || '-'})</span>
          </div>
        )}
      </div>
    );
  }

  if (item.entityType === 'TRIP') {
    return (
      <div className="space-y-4 text-xs">
        <div className="p-3.5 bg-sky-50/60 border border-sky-200 rounded-xl space-y-1">
          <div className="text-[11px] text-sky-700 font-bold">{isAr ? 'معرف الرحلة ورقم الطيران' : 'Trip & Flight ID'}</div>
          <div className="font-mono font-black text-sm text-slate-900">{data.id} • {data.flightNumber}</div>
          <div className="text-[11px] text-slate-600 mt-1">
            {data.airline || 'Royal Jordanian'} | {data.originHubId === 'hub-amm' ? 'AMM' : 'ALG'} → {data.destinationHubId === 'hub-alg' ? 'ALG' : 'AMM'}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-bold">{isAr ? 'اسم المسافر' : 'Traveler'}</span>
            <span className="font-bold text-slate-900">{data.travelerName}</span>
          </div>
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-slate-400">{isAr ? 'السعة المتاحة' : 'Available Capacity'}</span>
            <span className="font-bold text-slate-800">{data.availableWeightKg} KG</span>
          </div>
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-slate-400">{isAr ? 'الوزن المخصص' : 'Allocated Weight'}</span>
            <span className="font-bold text-sky-700">{data.allocatedWeightKg || 0} KG</span>
          </div>
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-slate-400">{isAr ? 'تاريخ المغادرة' : 'Departure Date'}</span>
            <span className="text-slate-700">{data.departureTime || data.flightDate || '2026-09-12'}</span>
          </div>
        </div>
      </div>
    );
  }

  if (item.entityType === 'MANIFEST') {
    return (
      <div className="space-y-4 text-xs">
        <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-1">
          <div className="text-[11px] text-indigo-700 font-bold">{isAr ? 'المانيفست الرقمي المعتمد' : 'Digital Manifest'}</div>
          <div className="font-mono font-black text-sm text-slate-900">{data.id}</div>
          <div className="text-[11px] text-slate-600 mt-1">
            {data.flightNumber} • {data.travelerName || data.assignedTravelerName}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">{isAr ? 'عدد الطرود المعتمدة:' : 'Total Packages:'}</span>
            <span className="font-bold text-slate-900">{data.totalPackages || data.totalShipmentsCount || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">{isAr ? 'الوزن الإجمالي الصافي:' : 'Total Manifest Weight:'}</span>
            <span className="font-bold text-indigo-700">{data.totalWeightKg} KG</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">{isAr ? 'معرف الرحلة المرتبطة:' : 'Linked Trip ID:'}</span>
            <span className="font-bold text-slate-800">{data.tripId}</span>
          </div>
        </div>
      </div>
    );
  }

  if (item.entityType === 'INCIDENT') {
    return (
      <div className="space-y-4 text-xs">
        <div className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl space-y-1">
          <div className="text-[11px] text-rose-700 font-bold">{isAr ? 'رقم البلاغ والحالة' : 'Incident Number & Priority'}</div>
          <div className="font-mono font-black text-sm text-slate-900">{data.incidentNumber || data.id}</div>
          <div className="text-[11px] text-slate-600 mt-1">
            {data.type || data.category} | {isAr ? 'الأولوية:' : 'Priority:'} {data.priority}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div>
            <span className="text-slate-400 text-[10px] font-bold block">{isAr ? 'الوصف التشغيلي' : 'Description'}</span>
            <p className="text-slate-800 mt-1 leading-relaxed">{data.description}</p>
          </div>
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-mono text-[11px]">
            <span className="text-slate-500">{isAr ? 'الموظف المسؤول:' : 'Assigned To:'}</span>
            <span className="font-bold text-slate-900">{data.assignedRole || data.assignedEmployeeName}</span>
          </div>
          {data.isBlocking && (
            <div className="p-2 bg-rose-100 text-rose-800 rounded font-bold text-[11px]">
              {isAr ? '⚠️ هذا البلاغ يوقف الإجراءات التشغيلية المرتبطة (BLOCKING)' : '⚠️ Operational Blocking Active'}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (item.entityType === 'SETTLEMENT') {
    return (
      <div className="space-y-4 text-xs">
        <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
          <div className="text-[11px] text-emerald-700 font-bold">{isAr ? 'سجل التسوية المالية المعتمد' : 'Locked Settlement Snapshot'}</div>
          <div className="font-mono font-black text-sm text-slate-900">{data.settlementNumber || data.id}</div>
          <div className="text-[11px] text-slate-600 mt-1">
            {data.type} | {data.relatedUserName}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">{isAr ? 'المبلغ النهائي:' : 'Final Amount:'}</span>
            <span className="font-bold text-emerald-700 text-sm">
              {data.finalAmount?.toLocaleString()} {data.settlementCurrency || 'DZD'}
            </span>
          </div>
          {data.appliedFxRate && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{isAr ? 'سعر الصرف المقفل:' : 'Locked FX Rate:'}</span>
              <span className="font-bold text-slate-800">
                1 {data.baseCurrency} = {data.appliedFxRate} {data.settlementCurrency}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-slate-500">{isAr ? 'تاريخ المعالجة:' : 'Processed At:'}</span>
            <span className="text-slate-700">{data.processedAt}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">{isAr ? 'أمين الصندوق / المسؤول:' : 'Processed By:'}</span>
            <span className="text-slate-700">{data.processedByName || data.processedBy}</span>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for Rates & Travelers
  return (
    <div className="space-y-4 text-xs">
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
        <div className="text-[11px] text-slate-500 font-bold">{item.entityType}</div>
        <div className="font-mono font-black text-sm text-slate-900">{item.primaryReference}</div>
        <div className="text-[11px] text-slate-600 mt-1">{item.primaryLabel}</div>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-mono text-[11px]">
        {item.secondaryLabel && <div className="text-slate-700">{item.secondaryLabel}</div>}
      </div>
    </div>
  );
}
