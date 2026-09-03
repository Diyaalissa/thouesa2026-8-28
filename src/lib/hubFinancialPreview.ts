import {
  Currency,
  DailyExchangeRate,
  ShippingRate,
  RateType,
  ServiceType,
  Shipment,
  Trip,
  Manifest,
} from '../types';

export interface FxConversionResult {
  convertedAmount: number;
  appliedRate: number;
  fxSide: 'BUY' | 'SELL' | 'NONE';
  rateRecord?: DailyExchangeRate;
  quoteId: string;
}

export interface CustomerShippingPreview {
  baseCurrency: Currency;
  paymentCurrency: Currency;
  chargeableWeightKg: number;
  ratePerKg: number;
  minimumCharge: number;
  baseCharge: number;
  convertedAmountDue: number;
  appliedFxRate: number;
  fxSide: 'BUY' | 'SELL' | 'NONE';
  rateRecord?: DailyExchangeRate;
  quoteId: string;
}

export interface TravelerPayoutPreview {
  baseCurrency: Currency;
  payoutCurrency: Currency;
  transportedWeightKg: number;
  compensationRatePerKg: number;
  travelerRatePerKg?: number;
  baseEarnings: number;
  convertedPayoutAmount: number;
  convertedAmount?: number;
  appliedFxRate: number;
  fxSide: 'BUY' | 'SELL' | 'NONE';
  rateRecord?: DailyExchangeRate;
  quoteId: string;
}

/**
 * Standard IATA volumetric weight: (L × W × H) ÷ 5000
 */
export const calculateVolumetricWeight = (
  lengthCm: number,
  widthCm: number,
  heightCm: number
): number => {
  if (!lengthCm || !widthCm || !heightCm) return 0;
  return Number(((lengthCm * widthCm * heightCm) / 5000).toFixed(2));
};

/**
 * Chargeable weight is the higher of actual weight and volumetric weight
 */
export const calculateChargeableWeight = (
  actualWeightKg: number,
  lengthCm?: number,
  widthCm?: number,
  heightCm?: number
): number => {
  const vol = lengthCm && widthCm && heightCm ? calculateVolumetricWeight(lengthCm, widthCm, heightCm) : 0;
  return Math.max(actualWeightKg || 0.5, vol);
};

/**
 * Finds applicable shipping rate card from the central rates list
 */
export const findShippingRate = (
  rates: ShippingRate[],
  originCountry: string,
  destinationCountry: string,
  rateType: RateType,
  serviceType: ServiceType = 'SEND_PARCEL'
): ShippingRate | undefined => {
  // Normalize country codes e.g. JOR -> JO, DZA -> DZ
  const normOrig = originCountry === 'JOR' ? 'JO' : originCountry === 'DZA' ? 'DZ' : originCountry;
  const normDest = destinationCountry === 'JOR' ? 'JO' : destinationCountry === 'DZA' ? 'DZ' : destinationCountry;

  return rates.find(
    (r) =>
      r.status === 'ACTIVE' &&
      r.rateType === rateType &&
      r.serviceType === serviceType &&
      (r.originCountry === normOrig || r.originCountry === originCountry) &&
      (r.destinationCountry === normDest || r.destinationCountry === destinationCountry)
  );
};

/**
 * Calculates base charge using official rate card and weight tiers if defined
 */
export const calculateShippingBaseCharge = (
  chargeableWeightKg: number,
  rateCard?: ShippingRate
): { baseCharge: number; ratePerKg: number; minimumCharge: number } => {
  if (!rateCard) {
    return { baseCharge: 15.0, ratePerKg: 7.5, minimumCharge: 5.0 };
  }

  const minWeight = rateCard.minimumBillableWeightKg || 0.5;
  const billableWeight = Math.max(chargeableWeightKg, minWeight);

  let effectiveRate = rateCard.ratePerKg;

  // If using tiered pricing model
  if (rateCard.pricingModel === 'WEIGHT_TIERS' && rateCard.tiers && rateCard.tiers.length > 0) {
    const matchedTier = rateCard.tiers.find(
      (t) => billableWeight >= t.fromKg && billableWeight <= t.toKg
    );
    if (matchedTier) {
      effectiveRate = matchedTier.ratePerKg;
    } else {
      const highestTier = rateCard.tiers[rateCard.tiers.length - 1];
      if (highestTier && billableWeight > highestTier.toKg) {
        effectiveRate = highestTier.ratePerKg;
      }
    }
  }

  const rawCharge = billableWeight * effectiveRate;
  const baseCharge = Number(Math.max(rateCard.minimumCharge || 0, rawCharge).toFixed(2));

  return {
    baseCharge,
    ratePerKg: effectiveRate,
    minimumCharge: rateCard.minimumCharge || 0,
  };
};

/**
 * FX conversion engine matching THOUESA treasury rules:
 * - Customer paying foreign currency: THOUESA buys foreign currency -> fxSide = 'BUY'
 * - Traveler receiving foreign currency: THOUESA sells foreign currency -> fxSide = 'SELL'
 */
export const calculateFxConversion = (
  baseAmount: number,
  baseCurrency: Currency,
  targetCurrency: Currency,
  side: 'BUY' | 'SELL',
  exchangeRates: DailyExchangeRate[]
): FxConversionResult => {
  const quoteId = `FXQ-${Date.now().toString().slice(-6)}`;

  if (baseCurrency === targetCurrency) {
    return {
      convertedAmount: baseAmount,
      appliedRate: 1.0,
      fxSide: 'NONE',
      quoteId,
    };
  }

  // Look for pair: targetCurrency -> baseCurrency
  const pairDirect = exchangeRates.find(
    (r) => r.baseCurrency === targetCurrency && r.quoteCurrency === baseCurrency && r.status === 'ACTIVE'
  );

  // Look for pair: baseCurrency -> targetCurrency
  const pairReverse = exchangeRates.find(
    (r) => r.baseCurrency === baseCurrency && r.quoteCurrency === targetCurrency && r.status === 'ACTIVE'
  );

  let appliedRate = 1.0;
  let rateRecord: DailyExchangeRate | undefined;

  if (side === 'BUY') {
    // Customer pays in targetCurrency, THOUESA buys targetCurrency from customer
    if (pairDirect) {
      // e.g. baseCurrency = JOD, targetCurrency = DZD, pairDirect = DZD/JOD (buyRate = 0.00515)
      // Customer needs to pay: baseAmount / buyRate
      rateRecord = pairDirect;
      appliedRate = pairDirect.buyRate;
      const converted = appliedRate > 0 ? Number((baseAmount / appliedRate).toFixed(2)) : baseAmount;
      return {
        convertedAmount: converted,
        appliedRate,
        fxSide: 'BUY',
        rateRecord,
        quoteId,
      };
    } else if (pairReverse) {
      // e.g. baseCurrency = DZD, targetCurrency = JOD, pairReverse = DZD/JOD (buyRate = 0.00515)
      // Customer needs to pay: baseAmount * buyRate
      rateRecord = pairReverse;
      appliedRate = pairReverse.buyRate;
      const converted = Number((baseAmount * appliedRate).toFixed(2));
      return {
        convertedAmount: converted,
        appliedRate,
        fxSide: 'BUY',
        rateRecord,
        quoteId,
      };
    }
  } else if (side === 'SELL') {
    // Traveler receives targetCurrency, THOUESA sells targetCurrency to traveler
    if (pairDirect) {
      // e.g. baseCurrency = DZD, targetCurrency = JOD, pairDirect = JOD/DZD (sellRate = 186)
      // Or pairDirect = targetCurrency/baseCurrency
      rateRecord = pairDirect;
      appliedRate = pairDirect.sellRate;
      const converted = appliedRate > 0 ? Number((baseAmount / appliedRate).toFixed(2)) : baseAmount;
      return {
        convertedAmount: converted,
        appliedRate,
        fxSide: 'SELL',
        rateRecord,
        quoteId,
      };
    } else if (pairReverse) {
      // e.g. baseCurrency = DZD, targetCurrency = JOD, pairReverse = DZD/JOD (sellRate = 0.00538)
      // Traveler gets: baseAmount * sellRate
      rateRecord = pairReverse;
      appliedRate = pairReverse.sellRate;
      const converted = Number((baseAmount * appliedRate).toFixed(2));
      return {
        convertedAmount: converted,
        appliedRate,
        fxSide: 'SELL',
        rateRecord,
        quoteId,
      };
    }
  }

  // Fallback if no specific pair found in live table
  return {
    convertedAmount: baseAmount,
    appliedRate: 1.0,
    fxSide: side,
    quoteId,
  };
};

/**
 * Generates dynamic customer shipping cost preview
 */
export const calculateCustomerShippingPreview = (
  shipment: Partial<Shipment>,
  paymentCurrency: Currency,
  shippingRates: ShippingRate[],
  exchangeRates: DailyExchangeRate[],
  defaultOriginCountry: string = 'JO',
  defaultDestCountry: string = 'DZ'
): CustomerShippingPreview => {
  const originCountry = shipment.originHubId === 'hub-alg' ? 'DZ' : defaultOriginCountry;
  const destCountry = originCountry === 'DZ' ? 'JO' : defaultDestCountry;

  const baseCurrency: Currency = originCountry === 'DZ' ? 'DZD' : 'JOD';

  const actualWeight = shipment.actualWeightKg || shipment.estimatedWeightKg || (shipment as any).finalWeight || (shipment as any).declaredWeight || 2.0;
  const chargeableWeight = calculateChargeableWeight(actualWeight);

  const rateCard = findShippingRate(
    shippingRates,
    originCountry,
    destCountry,
    'CUSTOMER_SHIPPING',
    shipment.serviceType || 'SEND_PARCEL'
  );

  const { baseCharge, ratePerKg, minimumCharge } = calculateShippingBaseCharge(chargeableWeight, rateCard);

  const fxResult = calculateFxConversion(
    baseCharge,
    baseCurrency,
    paymentCurrency,
    'BUY',
    exchangeRates
  );

  return {
    baseCurrency,
    paymentCurrency,
    chargeableWeightKg: chargeableWeight,
    ratePerKg,
    minimumCharge,
    baseCharge,
    convertedAmountDue: fxResult.convertedAmount,
    appliedFxRate: fxResult.appliedRate,
    fxSide: fxResult.fxSide,
    rateRecord: fxResult.rateRecord,
    quoteId: fxResult.quoteId,
  };
};

/**
 * Generates dynamic traveler payout preview
 */
export const calculateTravelerPayoutPreview = (
  trip: Partial<Trip>,
  manifest: Partial<Manifest> | undefined,
  payoutCurrency: Currency,
  shippingRates: ShippingRate[],
  exchangeRates: DailyExchangeRate[],
  defaultOriginCountry: string = 'JO',
  defaultDestCountry: string = 'DZ'
): TravelerPayoutPreview => {
  const originCountry = trip.originHubId === 'hub-alg' ? 'DZ' : defaultOriginCountry;
  const destCountry = originCountry === 'DZ' ? 'JO' : defaultDestCountry;

  const baseCurrency: Currency = originCountry === 'DZ' ? 'DZD' : 'JOD';

  const transportedWeight = manifest?.totalWeightKg || trip.allocatedWeightKg || trip.availableWeightKg || (trip as any)?.availableKilos || 10.0;

  const rateCard = findShippingRate(
    shippingRates,
    originCountry,
    destCountry,
    'TRAVELER_COMPENSATION',
    'SEND_PARCEL'
  );

  const compRatePerKg = rateCard ? rateCard.ratePerKg : (originCountry === 'DZ' ? 1200 : 5.0);
  const minEarnings = rateCard ? rateCard.minimumCharge : (originCountry === 'DZ' ? 1200 : 5.0);
  const baseEarnings = Number(Math.max(minEarnings, transportedWeight * compRatePerKg).toFixed(2));

  const fxResult = calculateFxConversion(
    baseEarnings,
    baseCurrency,
    payoutCurrency,
    'SELL',
    exchangeRates
  );

  return {
    baseCurrency,
    payoutCurrency,
    transportedWeightKg: transportedWeight,
    compensationRatePerKg: compRatePerKg,
    travelerRatePerKg: compRatePerKg,
    baseEarnings,
    convertedPayoutAmount: fxResult.convertedAmount,
    convertedAmount: fxResult.convertedAmount,
    appliedFxRate: fxResult.appliedRate,
    fxSide: fxResult.fxSide,
    rateRecord: fxResult.rateRecord,
    quoteId: fxResult.quoteId,
  };
};
