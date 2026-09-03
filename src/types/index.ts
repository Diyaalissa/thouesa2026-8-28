export type UserRole = 'SENDER' | 'TRAVELER' | 'HUB_AGENT' | 'HUB_MANAGER' | 'HUB_INSPECTOR' | 'PRICING_MANAGER' | 'FINANCIAL_OFFICER' | 'MASTER_ADMIN' | 'EMPLOYEE';

export type KYCStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export type Locale = 'ar' | 'en';

export type ThemeMode = 'slate' | 'light' | 'emerald' | 'navy' | 'desert';

export type Currency = 'USD' | 'JOD' | 'DZD' | 'EGP' | 'SAR';

export type ServiceType = 'SEND_PARCEL' | 'INTERNATIONAL_BUY' | 'SPECIFIC_COUNTRY_BUY';

export interface OrderItem {
  id: string;
  name: string;
  url?: string;
  storeUrl?: string;
  specsOrVariants?: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  countryOrigin?: string;
  notes?: string;
  imageUrl?: string;
  sizeVolume?: string;
}

export interface Employee {
  id: string;
  staffCode: string;
  fullName: string;
  email: string;
  phone: string;
  assignedHubId: string;
  assignedHubName: string;
  role: 'HUB_AGENT' | 'HUB_MANAGER' | 'HUB_INSPECTOR';
  passwordPin: string;
  isActive: boolean;
  permissions: string[];
  createdAt: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  role: UserRole;
  priorityLevel?: 'NEW' | 'SILVER' | 'GOLD';
  kycStatus: KYCStatus;
  isActive: boolean;
  preferredLocale: Locale;
  avatarUrl?: string;
  passportNumber?: string;
  nationalId?: string;
  nationality?: string;
  idDocumentFrontUrl?: string;
  idDocumentBackUrl?: string;
  passportPhotoUrl?: string;
  selfieWithIdUrl?: string;
  rating?: number;
  totalTrips?: number;
  totalShipments?: number;
  assignedHubId?: string;
  staffCode?: string;
  createdAt: string;
}

export interface Hub {
  id: string;
  code: string; // e.g. AMM-01, ALG-01, CAI-01, RUH-01
  nameAr: string;
  nameEn: string;
  countryCode: string; // JOR, DZA, EGY, SAU
  countryNameAr: string;
  countryNameEn: string;
  cityAr: string;
  cityEn: string;
  address: string;
  phone: string;
  storageCapacityKg: number;
  currentUsedKg: number;
  isActive: boolean;
  managerName?: string;
  operatingHours: string;
}

export type ShipmentStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'PENDING_REVIEW'
  | 'PENDING_DROPOFF'
  | 'PENDING_HUB_DROPOFF'
  | 'RECEIVED_AT_ORIGIN'
  | 'RECEIVED_AT_ORIGIN_HUB'
  | 'INSPECTED_SEALED'
  | 'INSPECTED_AND_SEALED'
  | 'WEIGHT_ADJUSTMENT_PENDING'
  | 'WEIGHT_DISCREPANCY_PENDING'
  | 'ASSIGNED_TO_TRIP'
  | 'ASSIGNED_TO_TRAVELER'
  | 'IN_TRANSIT'
  | 'IN_TRANSIT_AIR'
  | 'IN_FLIGHT'
  | 'CUSTOMS_CLEARANCE'
  | 'CUSTOMS_HELD'
  | 'RECEIVED_AT_DEST'
  | 'RECEIVED_AT_DEST_HUB'
  | 'READY_FOR_PICKUP'
  | 'READY_FOR_DELIVERY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'REJECTED_PROHIBITED'
  | 'DISPUTED'
  | 'CANCELLED';

export type ItemCondition = 'USED_PERSONAL' | 'NEW_PERSONAL' | 'NEW_COMMERCIAL';

export interface CustomsDutyRule {
  countryCode: string; // e.g. JOR, DZA, SAU, EGY, OMN, ARE, QAT, KWT, TUN, MAR, TUR
  countryNameAr: string;
  countryNameEn: string;
  standardDutyPercent: number; // General default duty rate e.g. 15%
  newPersonalGoodsDutyPercent: number; // e.g. 12% for personal electronics/goods
  commercialNewDutyPercent: number; // e.g. 20% for commercial imports
  usedPersonalExempt: boolean; // Always true by default (0% for used personal luggage)
  minExemptValueUsd: number; // Minimum threshold below which no duty is charged
  categoryOverrides?: Record<string, number>;
  notesAr?: string;
  notesEn?: string;
  lastUpdated: string;
  updatedBy: string;
}

export type ItemCategory =
  | 'DOCUMENTS'
  | 'ELECTRONICS'
  | 'CLOTHING_TEXTILES'
  | 'MEDICATIONS_PERMITTED'
  | 'GIFTS_COSMETICS'
  | 'FOOD_COMMERCIAL_PACKED'
  | 'OTHER_SAFE_GOODS';

export interface CustomsDutyRecord {
  id: string;
  shipmentId: string;
  dutyAmountPaid: number;
  dutyCurrency: Currency | 'DZD' | 'JOD' | 'USD';
  receiptPhotoUrl: string;
  receiptNumber?: string;
  recordedAt: string;
  customsLocationAr?: string;
  customsLocationEn?: string;
  notes?: string;
  verificationStatus: 'PENDING_HUB_VERIFICATION' | 'VERIFIED_REIMBURSED' | 'REJECTED';
  reimbursedAt?: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string; // e.g., TH-JOR-ALG-202608-8841
  serviceType?: ServiceType;
  orderItems?: OrderItem[];
  senderId: string;
  senderName: string;
  senderPhone: string;
  originHubId: string;
  destinationHubId: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientNationalId?: string;
  itemCategory: ItemCategory;
  itemCondition?: ItemCondition; // 'USED_PERSONAL' | 'NEW_PERSONAL' | 'NEW_COMMERCIAL'
  isCustomsApplicable?: boolean;
  customsRatePercent?: number;
  customsExemptReason?: string;
  itemDescription: string;
  purpose?: string;
  itemPhotos: string[];
  invoicePhotos?: string[];
  inspectionPhotos?: string[]; // 360° photo URLs taken at Hub
  inspectionNotes?: string;
  inspectedByAgentId?: string;
  inspectedAt?: string;
  declaredValue: number;
  currency: Currency;
  estimatedWeightKg: number;
  actualWeightKg?: number;
  dimensionsCm: {
    length: number;
    width: number;
    height: number;
  };
  securitySealId?: string; // e.g. SEAL-AMM-98231
  shippingCost: number;
  insuranceFee?: number;
  customsDutyEstimated: number;
  escrowDepositRequired: number;
  currentStatus: ShipmentStatus;
  senderLegalWaiverSigned?: boolean;
  senderLegalWaiverTimestamp?: string;
  paymentMethod?: 'BARIDIMOB' | 'EDAHABIA' | 'CLIQ' | 'EFAWATEERCOM' | 'WALLET' | 'CARD';
  paymentLocalAmount?: number;
  paymentCurrency?: Currency;
  paymentStatus?: 'PENDING_PAYMENT' | 'DEPOSIT_PAID' | 'FULLY_PAID' | 'REFUNDED';
  preferredDispatchOptionId?: string;
  preferredDepartureDate?: string;
  assignedTripId?: string;
  assignedTravelerId?: string;
  assignedTravelerName?: string;
  flightNumber?: string;
  airline?: string;
  idempotencyKey: string;
  weightDiscrepancy?: {
    originalKg: number;
    actualKg: number;
    priceDelta: number;
    status: 'PENDING_CUSTOMER_APPROVAL' | 'APPROVED' | 'REJECTED';
  };
  handoverQRCodes?: {
    originHandoverToken?: string;
    destinationIntakeToken?: string;
  };
  deliveryProofSignature?: string;
  deliveredAt?: string;
  receivedAtOriginHubAt?: string;
  receivedByEmployeeId?: string;
  receivedAtHubId?: string;
  customsDutyRecord?: CustomsDutyRecord;
  createdAt: string;
  updatedAt: string;
}

export type TripStatus =
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'CONFIRMED'
  | 'PACKAGES_LINKED'
  | 'DISPATCHED'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'DELAYED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EMERGENCY_UNASSIGNED'
  | 'SCHEDULED'
  | 'CHECKED_IN'
  | 'ESCROW_LOCKED'
  | 'ESCROW_PAID'
  | 'IN_TRANSIT'
  | 'IN_FLIGHT';

export interface Trip {
  id: string;
  travelerId: string;
  travelerName: string;
  travelerPhone: string;
  travelerRating: number;
  originHubId: string;
  destinationHubId: string;
  airline: string;
  flightNumber: string;
  pnrCode: string;
  departureTime: string;
  arrivalTime: string;
  availableWeightKg: number;
  allocatedWeightKg: number;
  pricePerKgEarned: number;
  totalEarningsEstimated: number;
  requiredEscrowDeposit: number;
  isEscrowPaid: boolean;
  status: TripStatus;
  ticketDocUrl?: string;
  documents?: Record<string, { url: string; fileName: string; uploadedAt: string }>;
  manifestId?: string;
  emergencyReason?: string;
  emergencyCancelRequested?: boolean;
  checkedInAt?: string;
  priorityTier?: 'STANDARD' | 'SILVER' | 'GOLD';
  legalCommitmentSigned?: boolean;
  createdAt: string;
}

export type ManifestStatus =
  | 'PREPARING'
  | 'HANDED_OVER'
  | 'IN_FLIGHT'
  | 'DELIVERED_TO_DEST_HUB'
  | 'DISCREPANCY_FLAGGED';

export interface Manifest {
  id: string;
  manifestCode: string; // MAN-AMM-ALG-0824
  tripId: string;
  travelerId: string;
  originHubId: string;
  destinationHubId: string;
  dispatchedByAgentId: string;
  receivedByAgentId?: string;
  shipmentIds: string[];
  totalPackages: number;
  totalWeightKg: number;
  totalDeclaredValue: number;
  handoverQrSecret: string;
  dispatchTimestamp?: string;
  receiptTimestamp?: string;
  status: ManifestStatus;
  tamperSealIds: string[];
  createdAt: string;
}

export type TransactionType =
  | 'SHIPPING_PAYMENT'
  | 'ESCROW_LOCK'
  | 'ESCROW_RELEASE'
  | 'TRAVELER_PAYOUT'
  | 'REFUND'
  | 'HUB_FEE'
  | 'DISPUTE_FORFEIT'
  | 'PRICE_ADJUSTMENT';

export interface EscrowWallet {
  id: string;
  userId: string;
  balance: number;
  lockedEscrowDeposit: number;
  pendingEarnings: number;
  currency: Currency;
  updatedAt: string;
}

export interface FinancialTransaction {
  id: string;
  transactionCode: string; // TXN-ESC-2026-9021
  walletId: string;
  userId: string;
  userName: string;
  employeeId?: string; // The hub agent holding the local treasury
  employeeName?: string;
  tripId?: string;
  shipmentId?: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  exchangeRateToUsd: number;
  localCurrencyAmount?: number;
  paymentGateway?: string;
  idempotencyKey: string;
  status: 'PENDING' | 'COMMITTED' | 'REVERTED' | 'FAILED';
  referenceNote: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  domain: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress?: string;
  details?: Record<string, any>;
  createdAt: string;
}

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED_REFUND' | 'RESOLVED_ESCROW_RELEASE' | 'REJECTED';

export type DisputeApprovalDecision = 'PENDING' | 'APPROVED_REFUND' | 'APPROVED_ESCROW_RELEASE' | 'REJECTED';

export interface DisputePartyReview {
  employeeId: string;
  employeeName: string;
  employeeStaffCode?: string;
  hubId: string;
  hubName: string;
  hubCountryCode?: string;
  hubRole: 'ORIGIN' | 'DESTINATION'; // Origin branch (e.g. Jordan) or Destination branch (e.g. Algeria)
  decision: DisputeApprovalDecision;
  notes?: string;
  decidedAt?: string;
  digitalSignature?: string;
}

export interface Dispute {
  id: string;
  shipmentId: string;
  trackingNumber: string;
  claimantId: string;
  claimantName: string;
  claimantRole: UserRole;
  respondentId?: string;
  respondentName?: string;
  
  // Dual-Party Investigation Hubs
  originHubId?: string;
  originHubName?: string;
  originReview?: DisputePartyReview;

  destinationHubId?: string;
  destinationHubName?: string;
  destinationReview?: DisputePartyReview;

  // Legacy single assigned employee fallback
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: 'DAMAGED_ITEM' | 'TAMPERED_SEAL' | 'FLIGHT_DELAY_EXTREME' | 'PROHIBITED_GOODS_DISCOVERED' | 'MISSING_PACKAGE';
  description: string;
  evidencePhotos: string[];
  claimAmount: number;
  currency: Currency;
  status: DisputeStatus;
  consensusReached?: boolean;
  resolutionNotes?: string;
  resolvedByAdminId?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface ExchangeRate {
  currency: Currency;
  rateToUsd: number;
  lastUpdated: string;
}

export interface RoutePricing {
  originCountry: string;
  destinationCountry: string;
  basePriceKg: number;
  travelerShareKg: number;
  hubFeeKg: number;
  insuranceRatePercent: number;
  averageFlightHours: number;
}

export type NotificationType =
  | 'ORDER_CREATED'
  | 'KYC_SUBMITTED'
  | 'INSPECTION_COMPLETED'
  | 'ESCROW_LOCKED'
  | 'ESCROW_RELEASED'
  | 'SHIPMENT_ARRIVED'
  | 'SHIPMENT_UPDATED'
  | 'IN_TRANSIT'
  | 'READY_FOR_PICKUP'
  | 'DELIVERED_TO_DEST'
  | 'DISPUTE_RAISED'
  | 'TRIP_REGISTERED'
  | 'WEIGHT_DISCREPANCY'
  | 'SYSTEM_ALERT';

export interface SystemNotification {
  id: string;
  type: NotificationType;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  targetRole?: UserRole | 'ALL' | 'PUBLIC';
  targetUserId?: string;
  referenceId?: string;
  isRead: boolean;
  priority?: 'HIGH' | 'NORMAL' | 'LOW';
  createdAt: string;
}

// ----------------------------------------------------
// Employee Operations Portal V1 Types
// ----------------------------------------------------

export type EmployeeNavSection =
  // 1. Dashboard
  | 'OPERATIONS_DASHBOARD'
  // 2. Shipments
  | 'ORIGIN_INTAKE'
  | 'INSPECTION_WEIGHT'
  | 'READY_FOR_TRANSPORT'
  // 3. Travelers
  | 'TRIP_VERIFICATION'
  | 'VERIFIED_TRIPS'
  // 4. Transport
  | 'MATCHING'
  | 'MANIFESTS'
  | 'TRAVELER_HANDOVER'
  | 'DESTINATION_INTAKE'
  // 5. Delivery
  | 'PICKUP_PREPARATION'
  | 'FINAL_DELIVERY'
  // 6. Pricing & Calculator
  | 'PRICING_CALCULATOR'
  | 'SHIPPING_RATES'
  | 'EXCHANGE_RATES'
  | 'RATE_HISTORY'
  // 7. Settlements & FX
  | 'CURRENCY_SETTLEMENT'
  | 'CUSTOMER_PAYMENTS'
  | 'TRAVELER_SETTLEMENTS'
  | 'SETTLEMENT_HISTORY'
  // 8. Exceptions
  | 'INCIDENTS_DISPUTES'
  | 'OPERATIONAL_INCIDENTS'
  // 9. Audit & Search
  | 'AUDIT_LOGS'
  | 'GLOBAL_SEARCH';

export type RateType = 'CUSTOMER_SHIPPING' | 'TRAVELER_COMPENSATION';
export type PricingModel = 'PER_KG' | 'FLAT_RATE' | 'WEIGHT_TIERS';

export interface WeightTier {
  fromKg: number;
  toKg: number;
  ratePerKg: number;
}

export interface ShippingRate {
  id: string;
  originCountry: string; // 'JO' | 'DZ'
  destinationCountry: string; // 'DZ' | 'JO'
  originHubId?: string;
  destinationHubId?: string;
  serviceType: ServiceType;
  rateType: RateType;
  pricingModel: PricingModel;
  currency: Currency;
  ratePerKg: number;
  minimumCharge: number;
  minimumBillableWeightKg: number;
  tiers?: WeightTier[];
  effectiveFrom: string;
  effectiveUntil?: string;
  version: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdBy: string;
  createdAt: string;
  reason?: string;
}

export interface RateHistoryEntry {
  id: string;
  rateId: string;
  routeAr: string;
  routeEn: string;
  originCountry: string;
  destinationCountry: string;
  serviceType: ServiceType;
  pricingModel: PricingModel;
  oldRateText: string;
  newRateText: string;
  changedBy: string;
  changedByName: string;
  date: string;
  versionText: string;
  reason: string;
}

export interface DailyExchangeRate {
  id: string;
  baseCurrency: Currency; // e.g. 'DZD'
  quoteCurrency: Currency; // e.g. 'JOD'
  buyRate: number; // THOUESA buys baseCurrency
  sellRate: number; // THOUESA sells baseCurrency
  effectiveFrom: string;
  effectiveUntil?: string;
  countryScope: string; // 'JO' | 'DZ' | 'GLOBAL'
  source: string;
  version: string; // e.g. 'FX-2026-09-03-01'
  status: 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  createdBy: string;
  createdAt: string;
  notes?: string;
}

export interface FxQuoteLock {
  quoteId: string;
  exchangeRateId: string;
  baseCurrency: Currency;
  quoteCurrency: Currency;
  appliedSide: 'BUY' | 'SELL';
  lockedRate: number;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export type SettlementType = 'CUSTOMER_PAYMENT' | 'TRAVELER_PAYOUT' | 'REFUND';
export type SettlementStatus =
  | 'DRAFT'
  | 'QUOTED'
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PENDING_PAYOUT'
  | 'SETTLED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REVERSED';

export interface SettlementRecord {
  id: string;
  settlementNumber: string; // STL-2026-89214
  type: SettlementType;
  relatedUserId: string;
  relatedUserName: string;
  shipmentId?: string;
  trackingNumber?: string;
  tripId?: string;
  flightNumber?: string;
  manifestId?: string;
  hubId: string;
  hubCode: string;
  
  // Base amount
  baseAmount: number;
  baseCurrency: Currency;
  
  // Converted amount
  settlementCurrency: Currency;
  exchangeRateId?: string;
  rateVersion?: string;
  fxSide: 'BUY' | 'SELL' | 'NONE';
  appliedFxRate: number;
  convertedAmount: number;
  
  fees: number;
  adjustments: number;
  finalAmount: number;
  
  status: SettlementStatus;
  idempotencyKey: string;
  processedBy: string;
  processedByName: string;
  processedAt: string;
  receiptNumber?: string;
  notes?: string;
}

export type IncidentCategory =
  | 'WEIGHT_DIFFERENCE'
  | 'PROHIBITED_ITEM'
  | 'DAMAGED_PACKAGE'
  | 'SEAL_MISMATCH'
  | 'MISSING_PACKAGE'
  | 'TRAVELER_CANCELLATION'
  | 'TRAVELER_DELAY'
  | 'MANIFEST_DIFFERENCE'
  | 'CUSTOMS_HOLD'
  | 'IDENTITY_ISSUE'
  | 'OTHER';

export type IncidentPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type IncidentStatus = 'OPEN' | 'UNDER_REVIEW' | 'ACTION_REQUIRED' | 'RESOLVED' | 'ESCALATED';

export interface OperationalIncident {
  id: string;
  incidentNumber: string; // INC-2026-0041
  category: IncidentCategory;
  priority: IncidentPriority;
  status: IncidentStatus;
  hubId: string;
  hubName: string;
  relatedShipmentId?: string;
  trackingNumber?: string;
  relatedTripId?: string;
  flightNumber?: string;
  relatedManifestId?: string;
  description: string;
  evidencePhotos: string[];
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}
