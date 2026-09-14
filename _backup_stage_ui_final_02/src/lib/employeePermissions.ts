import { UserRole, Locale, EmployeeNavSection } from '../types';

export interface RoleConfig {
  role: UserRole;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  allowedSections: EmployeeNavSection[];
  canEditFX: boolean;
  canEditShippingRates: boolean;
  canDisbursePayout: boolean;
  canCollectPayment: boolean;
  canApproveWeightAdjustment: boolean;
  canEscalateIncident: boolean;
  canSwitchAllHubs: boolean;
}

export const ROLE_PERMISSIONS: Record<string, RoleConfig> = {
  HUB_AGENT: {
    role: 'HUB_AGENT',
    nameAr: 'موظف الفرع الشامل (Hub Officer)',
    nameEn: 'Hub Branch Officer',
    descriptionAr: 'مسؤول العمليات والمالية والتسعير لفرع الدولة: الاستقبال، الفحص، التسليم، تحصيل العملاء، صرف مستحقات المسافرين، وأسعار الصرف',
    descriptionEn: 'Single country branch officer: intake, inspection, delivery, customer payments, traveler payouts, and exchange rates',
    allowedSections: [
      'OPERATIONS_DASHBOARD',
      'ORIGIN_INTAKE',
      'INSPECTION_WEIGHT',
      'READY_FOR_TRANSPORT',
      'TRIP_VERIFICATION',
      'VERIFIED_TRIPS',
      'MATCHING',
      'MANIFESTS',
      'TRAVELER_HANDOVER',
      'DESTINATION_INTAKE',
      'PICKUP_PREPARATION',
      'FINAL_DELIVERY',
      'CUSTOMER_PAYMENTS',
      'TRAVELER_SETTLEMENTS',
      'EXCHANGE_RATES',
      'SETTLEMENT_HISTORY',
      'PRICING_CALCULATOR',
      'SHIPPING_RATES',
      'RATE_HISTORY',
      'OPERATIONAL_INCIDENTS',
      'INCIDENTS_DISPUTES',
      'CURRENCY_SETTLEMENT',
      'AUDIT_LOGS',
      'GLOBAL_SEARCH',
    ],
    canEditFX: true,
    canEditShippingRates: true,
    canDisbursePayout: true,
    canCollectPayment: true,
    canApproveWeightAdjustment: true,
    canEscalateIncident: true,
    canSwitchAllHubs: true,
  },
  HUB_INSPECTOR: {
    role: 'HUB_INSPECTOR',
    nameAr: 'مفتش أمن وسلامة طرود (Hub Inspector)',
    nameEn: 'Security & Inspection Officer',
    descriptionAr: 'الفحص الأمني، الوزن الدقيق، وضع الأختام الأمنية، وتوثيق فروقات الوزن',
    descriptionEn: 'Security screening, precision weigh-in, security sealing, and discrepancy documentation',
    allowedSections: [
      'OPERATIONS_DASHBOARD',
      'ORIGIN_INTAKE',
      'INSPECTION_WEIGHT',
      'DESTINATION_INTAKE',
      'READY_FOR_TRANSPORT',
      'OPERATIONAL_INCIDENTS',
      'INCIDENTS_DISPUTES',
      'PRICING_CALCULATOR',
      'SHIPPING_RATES',
      'EXCHANGE_RATES',
      'GLOBAL_SEARCH',
    ],
    canEditFX: false,
    canEditShippingRates: false,
    canDisbursePayout: false,
    canCollectPayment: false,
    canApproveWeightAdjustment: false,
    canEscalateIncident: true,
    canSwitchAllHubs: false,
  },
  HUB_MANAGER: {
    role: 'HUB_MANAGER',
    nameAr: 'مدير فرع لوجستي (Hub Manager)',
    nameEn: 'Hub Logistics Manager',
    descriptionAr: 'إدارة عمليات الفرع بالكامل، التدقيق والاعتماد، صرف مستحقات المسافرين، ومتابعة النزاعات',
    descriptionEn: 'Full branch operations supervision, audit approvals, traveler payouts, and dispute resolution',
    allowedSections: [
      'OPERATIONS_DASHBOARD',
      'ORIGIN_INTAKE',
      'INSPECTION_WEIGHT',
      'READY_FOR_TRANSPORT',
      'TRIP_VERIFICATION',
      'VERIFIED_TRIPS',
      'MATCHING',
      'MANIFESTS',
      'TRAVELER_HANDOVER',
      'DESTINATION_INTAKE',
      'PICKUP_PREPARATION',
      'FINAL_DELIVERY',
      'CUSTOMER_PAYMENTS',
      'TRAVELER_SETTLEMENTS',
      'EXCHANGE_RATES',
      'SETTLEMENT_HISTORY',
      'PRICING_CALCULATOR',
      'SHIPPING_RATES',
      'RATE_HISTORY',
      'OPERATIONAL_INCIDENTS',
      'INCIDENTS_DISPUTES',
      'CURRENCY_SETTLEMENT',
      'AUDIT_LOGS',
      'GLOBAL_SEARCH',
    ],
    canEditFX: false,
    canEditShippingRates: false,
    canDisbursePayout: true,
    canCollectPayment: true,
    canApproveWeightAdjustment: true,
    canEscalateIncident: true,
    canSwitchAllHubs: true,
  },
  PRICING_MANAGER: {
    role: 'PRICING_MANAGER',
    nameAr: 'مدير التسعير والتعريفات (Pricing Manager)',
    nameEn: 'Pricing & Tariffs Manager',
    descriptionAr: 'تحديث وإدارة تعرفة الشحن الرسمية، الشرائح الوزنية، وسجل تاريخ الأسعار',
    descriptionEn: 'Official shipping tariffs administration, weight tiers, and audit history',
    allowedSections: [
      'OPERATIONS_DASHBOARD',
      'SHIPPING_RATES',
      'RATE_HISTORY',
      'PRICING_CALCULATOR',
      'EXCHANGE_RATES',
      'GLOBAL_SEARCH',
    ],
    canEditFX: true,
    canEditShippingRates: true,
    canDisbursePayout: false,
    canCollectPayment: false,
    canApproveWeightAdjustment: true,
    canEscalateIncident: false,
    canSwitchAllHubs: true,
  },
  FINANCIAL_OFFICER: {
    role: 'FINANCIAL_OFFICER',
    nameAr: 'مسؤول مالي ومقاصة (Financial Officer)',
    nameEn: 'Treasury & Settlements Officer',
    descriptionAr: 'إدارة أسعار الصرف اليومية، تحصيلات العملاء، صرف مستحقات المسافرين، والتدقيق المالي',
    descriptionEn: 'Daily FX publishing, customer collections, traveler settlements, and financial audits',
    allowedSections: [
      'OPERATIONS_DASHBOARD',
      'CUSTOMER_PAYMENTS',
      'TRAVELER_SETTLEMENTS',
      'EXCHANGE_RATES',
      'SETTLEMENT_HISTORY',
      'RATE_HISTORY',
      'PRICING_CALCULATOR',
      'SHIPPING_RATES',
      'CURRENCY_SETTLEMENT',
      'GLOBAL_SEARCH',
    ],
    canEditFX: true,
    canEditShippingRates: false,
    canDisbursePayout: true,
    canCollectPayment: true,
    canApproveWeightAdjustment: true,
    canEscalateIncident: true,
    canSwitchAllHubs: true,
  },
  MASTER_ADMIN: {
    role: 'MASTER_ADMIN',
    nameAr: 'مدير النظام الشامل (Master Admin)',
    nameEn: 'Master Administrator',
    descriptionAr: 'صلاحيات إدارية وتشغيلية ومالية كاملة لكافة فروع ثويسة',
    descriptionEn: 'Full system, operational, financial, and administrative oversight across all hubs',
    allowedSections: [
      'OPERATIONS_DASHBOARD',
      'ORIGIN_INTAKE',
      'INSPECTION_WEIGHT',
      'READY_FOR_TRANSPORT',
      'TRIP_VERIFICATION',
      'VERIFIED_TRIPS',
      'MATCHING',
      'MANIFESTS',
      'TRAVELER_HANDOVER',
      'DESTINATION_INTAKE',
      'PICKUP_PREPARATION',
      'FINAL_DELIVERY',
      'CUSTOMER_PAYMENTS',
      'TRAVELER_SETTLEMENTS',
      'EXCHANGE_RATES',
      'SETTLEMENT_HISTORY',
      'PRICING_CALCULATOR',
      'SHIPPING_RATES',
      'RATE_HISTORY',
      'OPERATIONAL_INCIDENTS',
      'INCIDENTS_DISPUTES',
      'CURRENCY_SETTLEMENT',
      'AUDIT_LOGS',
      'GLOBAL_SEARCH',
    ],
    canEditFX: true,
    canEditShippingRates: true,
    canDisbursePayout: true,
    canCollectPayment: true,
    canApproveWeightAdjustment: true,
    canEscalateIncident: true,
    canSwitchAllHubs: true,
  },
};

export const getRoleConfig = (role?: string): RoleConfig => {
  if (!role) return ROLE_PERMISSIONS.HUB_AGENT;
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.HUB_AGENT;
};

export const canAccessSection = (role: string | undefined, section: EmployeeNavSection): boolean => {
  const effectiveRole = role || 'HUB_AGENT';
  if (effectiveRole === 'MASTER_ADMIN') return true;
  const config = getRoleConfig(effectiveRole);
  return config.allowedSections.includes(section);
};

export const canEditFXRates = (role?: string): boolean => {
  return getRoleConfig(role).canEditFX;
};

export const canEditShippingRates = (role?: string): boolean => {
  return getRoleConfig(role).canEditShippingRates;
};

export const canDisburseTravelerPayout = (role?: string): boolean => {
  return getRoleConfig(role).canDisbursePayout;
};

export const canCollectCustomerPayment = (role?: string): boolean => {
  return getRoleConfig(role).canCollectPayment;
};

export const canApproveWeightAdjustment = (role?: string): boolean => {
  return getRoleConfig(role).canApproveWeightAdjustment;
};

export const canEscalateIncident = (role?: string): boolean => {
  return getRoleConfig(role).canEscalateIncident;
};

export const canSwitchAllHubs = (role?: string): boolean => {
  return getRoleConfig(role).canSwitchAllHubs;
};

export const getRoleDisplayName = (role: string | undefined, locale: Locale = 'ar'): string => {
  const config = getRoleConfig(role);
  return locale === 'ar' ? config.nameAr : config.nameEn;
};
