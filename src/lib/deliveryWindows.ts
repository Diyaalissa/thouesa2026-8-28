import { Currency, DailyExchangeRate, ServiceType, ShippingRate, Trip } from '../types';
import { normalizeCountryCode, normalizeTripStatus } from './statusNormalizer';

export interface CustomerDeliveryWindow {
  id: string; // Window identifier, e.g. "dw-trip-1"
  tripId: string; // Associated verified operational trip (not directly exposed to customer as flight assignment)
  originCountry: string; // e.g. "JO"
  destinationCountry: string; // e.g. "DZ"
  originHubId?: string;
  destinationHubId?: string;
  departureDate: string; // YYYY-MM-DD
  departureTime: string; // ISO string or time string
  departureDisplay: string; // Formatted date for UI
  etaDate: string; // YYYY-MM-DD
  etaDisplay: string; // Formatted ETA for UI
  cutoffDate: string; // YYYY-MM-DD cutoff
  cutoffDisplay: string; // Formatted cutoff for UI
  airline?: string; // Public airline reference
  flightNumber?: string; // Public flight reference
  totalCapacityKg: number;
  allocatedCapacityKg: number;
  remainingCapacityKg: number;
  status: 'AVAILABLE' | 'FILLING_FAST' | 'FULL';
  serviceLabel: string;
}

/**
 * Filter shared trips state to return strictly publicly eligible trips:
 * 1. Status is strictly VERIFIED or CONFIRMED
 * 2. Departure is strictly in the future (departureTime > now)
 * 3. Remaining capacity > 0 (availableWeightKg - allocatedWeightKg > 0)
 * 4. Exclude all other statuses (SUBMITTED, NEEDS_UPDATE, REJECTED, CANCELLED, COMPLETED, DISPATCHED, ARRIVED)
 */
export function getEligiblePublicTrips(trips: Trip[]): Trip[] {
  if (!trips || !Array.isArray(trips) || trips.length === 0) return [];
  const now = Date.now();
  const ALLOWED_STATUSES = ['VERIFIED', 'CONFIRMED'];

  return trips
    .filter((trip) => {
      // 1. Strict status check
      const normalizedStatus = normalizeTripStatus(trip.status);
      if (!ALLOWED_STATUSES.includes(normalizedStatus)) return false;

      // 2. Future departure time check
      const depDateStr = trip.departureTime || (trip as any).flightDate || (trip as any).departureDate;
      if (!depDateStr) return false;
      const depTime = new Date(depDateStr).getTime();
      if (isNaN(depTime) || depTime <= now) return false;

      // 3. Positive remaining capacity check
      const available = Number(trip.availableWeightKg) || 0;
      const allocated = Number(trip.allocatedWeightKg) || 0;
      const remaining = Math.max(0, available - allocated);

      return remaining > 0;
    })
    .sort((a, b) => {
      const timeA = new Date(a.departureTime || (a as any).flightDate || (a as any).departureDate).getTime();
      const timeB = new Date(b.departureTime || (b as any).flightDate || (b as any).departureDate).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return a.id.localeCompare(b.id);
    });
}

function resolveTripCountry(hubId?: string, explicitCountry?: string): string {
  if (explicitCountry) return normalizeCountryCode(explicitCountry);
  if (!hubId) return '';
  const lower = hubId.toLowerCase();
  if (lower.includes('amm') || lower.includes('jo')) return 'JO';
  if (lower.includes('alg') || lower.includes('orn') || lower.includes('dz')) return 'DZ';
  return '';
}

/**
 * Derives clean, traveler-anonymous Customer Delivery Windows for a specific route.
 * Filters out opposite directions and checks capacity.
 */
export function getCustomerDeliveryWindows(params: {
  trips: Trip[];
  originCountry: string;
  destinationCountry: string;
  requiredWeightKg?: number;
  isAr?: boolean;
}): CustomerDeliveryWindow[] {
  const { trips, originCountry, destinationCountry, requiredWeightKg, isAr = true } = params;
  const eligibleTrips = getEligiblePublicTrips(trips);

  const targetOrigin = normalizeCountryCode(originCountry);
  const targetDest = normalizeCountryCode(destinationCountry);

  return eligibleTrips
    .filter((trip) => {
      const tripOrig = resolveTripCountry(trip.originHubId, (trip as any).originCountry);
      const tripDest = resolveTripCountry(trip.destinationHubId, (trip as any).destinationCountry);
      return tripOrig === targetOrigin && tripDest === targetDest;
    })
    .map((trip) => {
      const depDateStr = trip.departureTime || (trip as any).flightDate || (trip as any).departureDate;
      const depDate = new Date(depDateStr);
      const arrDate = trip.arrivalTime ? new Date(trip.arrivalTime) : new Date(depDate.getTime() + 24 * 60 * 60 * 1000);
      
      // Cutoff is 3 days prior to departure (or 24h prior if close)
      const cutoffTime = new Date(depDate.getTime() - 3 * 24 * 60 * 60 * 1000);

      const available = Number(trip.availableWeightKg) || 0;
      const allocated = Number(trip.allocatedWeightKg) || 0;
      const remaining = Math.max(0, available - allocated);

      const departureIsoDate = depDate.toISOString().split('T')[0];
      const etaIsoDate = arrDate.toISOString().split('T')[0];
      const cutoffIsoDate = cutoffTime.toISOString().split('T')[0];

      const departureDisplay = depDate.toLocaleDateString(isAr ? 'ar-JO' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      const etaDisplay = arrDate.toLocaleDateString(isAr ? 'ar-JO' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      const cutoffDisplay = cutoffTime.toLocaleDateString(isAr ? 'ar-JO' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      let status: 'AVAILABLE' | 'FILLING_FAST' | 'FULL' = 'AVAILABLE';
      if (remaining <= 0) {
        status = 'FULL';
      } else if (remaining <= 5 || (requiredWeightKg && remaining < requiredWeightKg)) {
        status = 'FILLING_FAST';
      }

      return {
        id: `window-${trip.id}`,
        tripId: trip.id,
        originCountry: targetOrigin,
        destinationCountry: targetDest,
        originHubId: trip.originHubId,
        destinationHubId: trip.destinationHubId,
        departureDate: departureIsoDate,
        departureTime: trip.departureTime || depDate.toISOString(),
        departureDisplay,
        etaDate: etaIsoDate,
        etaDisplay,
        cutoffDate: cutoffIsoDate,
        cutoffDisplay,
        airline: trip.airline,
        flightNumber: trip.flightNumber,
        totalCapacityKg: available,
        allocatedCapacityKg: allocated,
        remainingCapacityKg: remaining,
        status,
        serviceLabel: isAr
          ? `نافذة إرسال: ${departureDisplay} (وصول متوقع: ${etaDisplay})`
          : `Dispatch Window: ${departureDisplay} (Est. Arrival: ${etaDisplay})`,
      };
    });
}

export interface CustomerQuoteResult {
  available: boolean;
  error?: string;
  rateId?: string;
  rateVersion?: number;
  pricingModel?: string;
  baseCurrency?: Currency;
  ratePerKg?: number;
  billingWeightKg?: number;
  baseShippingCost?: number;
  packagingFee?: number;
  insuranceFee?: number;
  localDeliveryFee?: number;
  totalBaseAmount?: number;
  paymentCurrency?: Currency;
  paymentAmount?: number;
  appliedFxRate?: number;
  fxSide?: 'BUY' | 'SELL' | 'NONE';
  fxRateId?: string;
  fxRateVersion?: string | number;
}

/**
 * Calculates official Customer Shipping Quote strictly from CUSTOMER_SHIPPING rates
 * and converts to payment currency using shared DailyExchangeRate.
 * NO hardcoded fallback values permitted (Rules 25, 31, 32, 36, 42, 43, 44, 45).
 */
export function calculateCustomerShippingQuote(params: {
  shippingRates: ShippingRate[];
  exchangeRates: DailyExchangeRate[];
  originCountry: string;
  destinationCountry: string;
  serviceType?: ServiceType;
  billingWeightKg: number;
  paymentCurrency?: Currency;
  declaredValueUsd?: number;
  insuranceRequested?: boolean;
  packagingType?: 'NONE' | 'SECURE_BUBBLE' | 'LUXURY_GIFT';
  deliveryType?: 'HUB' | 'HOME';
}): CustomerQuoteResult {
  const {
    shippingRates = [],
    exchangeRates = [],
    originCountry,
    destinationCountry,
    serviceType = 'SEND_PARCEL',
    billingWeightKg,
    paymentCurrency,
    declaredValueUsd = 0,
    insuranceRequested = false,
    packagingType = 'NONE',
    deliveryType = 'HUB',
  } = params;

  const origNorm = normalizeCountryCode(originCountry);
  const destNorm = normalizeCountryCode(destinationCountry);

  // 1. Strict Lookup of ACTIVE CUSTOMER_SHIPPING rate for the specific directional route
  const activeRate = shippingRates.find((r) => {
    if (r.status !== 'ACTIVE') return false;
    if (r.rateType !== 'CUSTOMER_SHIPPING') return false; // Strictly CUSTOMER_SHIPPING, never TRAVELER_COMPENSATION
    const rOrig = normalizeCountryCode(r.originCountry);
    const rDest = normalizeCountryCode(r.destinationCountry);
    if (rOrig !== origNorm || rDest !== destNorm) return false;
    if (r.serviceType && r.serviceType !== serviceType) return false;
    return true;
  });

  if (!activeRate) {
    return {
      available: false,
      error: `تعرفة الشحن المعتمدة غير متوفرة حالياً لمسار ${origNorm} ➔ ${destNorm}`,
    };
  }

  // 2. Pricing Model Calculation
  let baseShippingCost = 0;
  const safeWeight = Math.max(billingWeightKg, activeRate.minimumBillableWeightKg || 0.1);

  if (activeRate.pricingModel === 'PER_KG') {
    const rawCost = safeWeight * activeRate.ratePerKg;
    baseShippingCost = Math.max(activeRate.minimumCharge || 0, rawCost);
  } else if (activeRate.pricingModel === 'FLAT_RATE') {
    baseShippingCost = activeRate.minimumCharge || activeRate.ratePerKg || 0;
  } else if (activeRate.pricingModel === 'WEIGHT_TIERS') {
    if (!activeRate.tiers || activeRate.tiers.length === 0) {
      return {
        available: false,
        error: 'شرائح الوزن للتعرفة غير مهيأة',
      };
    }
    const matchingTier = activeRate.tiers.find(
      (t) => safeWeight >= t.fromKg && safeWeight <= t.toKg
    );
    if (!matchingTier) {
      return {
        available: false,
        error: `لا توجد شريحة سعرية مطابقة للوزن (${safeWeight} كغم)`,
      };
    }
    baseShippingCost = Math.max(
      activeRate.minimumCharge || 0,
      safeWeight * matchingTier.ratePerKg
    );
  } else {
    baseShippingCost = safeWeight * (activeRate.ratePerKg || 0);
  }

  // Round to 2 decimal places
  baseShippingCost = Number(baseShippingCost.toFixed(2));

  // 3. Ancillary Fees
  const packagingFee =
    packagingType === 'SECURE_BUBBLE' ? 5.0 : packagingType === 'LUXURY_GIFT' ? 8.0 : 0.0;
  const insuranceFee = insuranceRequested
    ? Number(Math.max(3.0, (declaredValueUsd || 0) * 0.015).toFixed(2))
    : 0.0;
  const localDeliveryFee = deliveryType === 'HOME' ? 10.0 : 0.0;

  const totalBaseAmount = Number(
    (baseShippingCost + packagingFee + insuranceFee + localDeliveryFee).toFixed(2)
  );

  const baseCurrency = activeRate.currency;
  const targetCurrency = paymentCurrency || baseCurrency;

  // 4. Currency / FX Conversion Rules (Rules 26, 27, 42, 43, 44, 45)
  // Same currency: rate = 1, fxSide = NONE
  if (baseCurrency === targetCurrency) {
    return {
      available: true,
      rateId: activeRate.id,
      rateVersion: activeRate.version,
      pricingModel: activeRate.pricingModel,
      baseCurrency,
      ratePerKg: activeRate.ratePerKg,
      billingWeightKg: safeWeight,
      baseShippingCost,
      packagingFee,
      insuranceFee,
      localDeliveryFee,
      totalBaseAmount,
      paymentCurrency: targetCurrency,
      paymentAmount: totalBaseAmount,
      appliedFxRate: 1.0,
      fxSide: 'NONE',
    };
  }

  // Cross-Currency: Lookup active DailyExchangeRate
  // Direct pair: baseCurrency is FX base, targetCurrency is FX quote -> Customer uses SELL side
  const directFx = exchangeRates.find(
    (fx) =>
      fx.status === 'ACTIVE' &&
      fx.baseCurrency === baseCurrency &&
      fx.quoteCurrency === targetCurrency
  );

  if (directFx) {
    const sellRate = directFx.sellRate;
    if (!sellRate || sellRate <= 0) {
      return {
        available: false,
        error: `سعر الصرف (بيع) غير صالح لزوج ${baseCurrency}/${targetCurrency}`,
      };
    }
    const paymentAmount = Number((totalBaseAmount * sellRate).toFixed(2));
    return {
      available: true,
      rateId: activeRate.id,
      rateVersion: activeRate.version,
      pricingModel: activeRate.pricingModel,
      baseCurrency,
      ratePerKg: activeRate.ratePerKg,
      billingWeightKg: safeWeight,
      baseShippingCost,
      packagingFee,
      insuranceFee,
      localDeliveryFee,
      totalBaseAmount,
      paymentCurrency: targetCurrency,
      paymentAmount,
      appliedFxRate: sellRate,
      fxSide: 'SELL',
      fxRateId: directFx.id,
      fxRateVersion: directFx.version,
    };
  }

  // Reverse pair: targetCurrency is FX base, baseCurrency is FX quote -> Customer uses BUY side
  const reverseFx = exchangeRates.find(
    (fx) =>
      fx.status === 'ACTIVE' &&
      fx.baseCurrency === targetCurrency &&
      fx.quoteCurrency === baseCurrency
  );

  if (reverseFx) {
    const buyRate = reverseFx.buyRate;
    if (!buyRate || buyRate <= 0) {
      return {
        available: false,
        error: `سعر الصرف (شراء) غير صالح لزوج ${targetCurrency}/${baseCurrency}`,
      };
    }
    const paymentAmount = Number((totalBaseAmount / buyRate).toFixed(2));
    return {
      available: true,
      rateId: activeRate.id,
      rateVersion: activeRate.version,
      pricingModel: activeRate.pricingModel,
      baseCurrency,
      ratePerKg: activeRate.ratePerKg,
      billingWeightKg: safeWeight,
      baseShippingCost,
      packagingFee,
      insuranceFee,
      localDeliveryFee,
      totalBaseAmount,
      paymentCurrency: targetCurrency,
      paymentAmount,
      appliedFxRate: buyRate,
      fxSide: 'BUY',
      fxRateId: reverseFx.id,
      fxRateVersion: reverseFx.version,
    };
  }

  // Missing FX: Block conversion strictly, NO fallback
  return {
    available: false,
    error: `سعر الصرف بين ${baseCurrency} و ${targetCurrency} غير متاح في النظام المالي`,
  };
}
