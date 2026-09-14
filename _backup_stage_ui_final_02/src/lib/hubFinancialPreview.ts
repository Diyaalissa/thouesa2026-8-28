import {
  Currency,
  DailyExchangeRate,
  ShippingRate,
  RateType,
  PricingModel,
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
  blocked?: boolean;
  blockReason?: string;
}

export interface CustomerShippingPreview {
  baseCurrency: Currency;
  paymentCurrency: Currency;
  chargeableWeightKg: number;
  billingWeightKg: number;
  ratePerKg: number;
  minimumCharge: number;
  baseCharge: number;
  convertedAmountDue: number;
  appliedFxRate: number;
  fxSide: 'BUY' | 'SELL' | 'NONE';
  rateRecord?: DailyExchangeRate;
  rateCard?: ShippingRate;
  rateCardId?: string;
  rateVersion?: string;
  rateType?: RateType;
  pricingModel?: PricingModel;
  fxPair?: string;
  quoteId: string;
  fxBlocked?: boolean;
  pricingBlocked?: boolean;
  blockReason?: string;
}

export interface TravelerPayoutPreview {
  baseCurrency: Currency;
  payoutCurrency: Currency;
  transportedWeightKg: number;
  compensationRatePerKg: number;
  travelerRatePerKg: number;
  baseEarnings: number;
  convertedPayoutAmount: number;
  convertedAmount: number;
  appliedFxRate: number;
  fxSide: 'BUY' | 'SELL' | 'NONE';
  rateRecord?: DailyExchangeRate;
  rateCard?: ShippingRate;
  rateCardId?: string;
  rateVersion?: string;
  rateType?: RateType;
  pricingModel?: PricingModel;
  fxPair?: string;
  fxRateId?: string;
  fxRateVersion?: string | number;
  quoteId: string;
  weightBlocked?: boolean;
  weightBlockReason?: string;
  pricingBlocked?: boolean;
  pricingBlockReason?: string;
  operationalBlocked?: boolean;
  operationalBlockReason?: string;
  fxBlocked?: boolean;
  isBlocked?: boolean;
  blockReason?: string;
  blockingFlags?: {
    operationalBlocked: boolean;
    manifestBlocked: boolean;
    weightBlocked: boolean;
    pricingBlocked: boolean;
    fxBlocked: boolean;
  };
  shipmentWeights?: Array<{ id: string; trackingNumber: string; actualWeightKg: number; valid: boolean }>;
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

export interface ShippingBaseChargeResult {
  baseCharge: number;
  ratePerKg: number;
  minimumCharge: number;
  pricingBlocked?: boolean;
  pricingBlockReason?: string;
}

/**
 * Calculates base charge using official rate card and pricing model (PER_KG, FLAT_RATE, WEIGHT_TIERS)
 * Strict No-Fallback: If rate card is missing or invalid, blocks calculation.
 */
export const calculateShippingBaseCharge = (
  chargeableWeightKg: number,
  rateCard?: ShippingRate
): ShippingBaseChargeResult => {
  if (!rateCard) {
    return {
      baseCharge: 0,
      ratePerKg: 0,
      minimumCharge: 0,
      pricingBlocked: true,
      pricingBlockReason: 'No active customer shipping rate is available for this shipment.',
    };
  }

  if (chargeableWeightKg <= 0) {
    return {
      baseCharge: 0,
      ratePerKg: 0,
      minimumCharge: 0,
      pricingBlocked: true,
      pricingBlockReason: 'Invalid shipment weight.',
    };
  }

  const minWeight = rateCard.minimumBillableWeightKg || 0.5;
  const billableWeight = Math.max(chargeableWeightKg, minWeight);

  // 1. FLAT_RATE Model: baseCharge = flatAmount (not multiplied by weight)
  if (rateCard.pricingModel === 'FLAT_RATE') {
    const flatAmount = rateCard.minimumCharge || rateCard.ratePerKg || 0;
    if (flatAmount <= 0) {
      return {
        baseCharge: 0,
        ratePerKg: 0,
        minimumCharge: 0,
        pricingBlocked: true,
        pricingBlockReason: 'Customer shipping rate has no valid pricing value.',
      };
    }
    return {
      baseCharge: Number(flatAmount.toFixed(2)),
      ratePerKg: flatAmount,
      minimumCharge: flatAmount,
      pricingBlocked: false,
    };
  }

  // 2. WEIGHT_TIERS Model
  if (rateCard.pricingModel === 'WEIGHT_TIERS') {
    if (!rateCard.tiers || rateCard.tiers.length === 0) {
      return {
        baseCharge: 0,
        ratePerKg: 0,
        minimumCharge: 0,
        pricingBlocked: true,
        pricingBlockReason: 'Pricing configuration error: No weight tiers defined.',
      };
    }

    // Check for tier overlap or invalid ranges
    for (let i = 0; i < rateCard.tiers.length; i++) {
      const t = rateCard.tiers[i];
      if (t.fromKg >= t.toKg || t.ratePerKg <= 0) {
        return {
          baseCharge: 0,
          ratePerKg: 0,
          minimumCharge: 0,
          pricingBlocked: true,
          pricingBlockReason: 'Pricing configuration error: Invalid tier bounds.',
        };
      }
    }

    const matchedTier = rateCard.tiers.find(
      (t) => billableWeight >= t.fromKg && billableWeight <= t.toKg
    );

    if (!matchedTier) {
      return {
        baseCharge: 0,
        ratePerKg: 0,
        minimumCharge: 0,
        pricingBlocked: true,
        pricingBlockReason: 'No pricing tier covers the shipment billing weight.',
      };
    }

    const rawCharge = billableWeight * matchedTier.ratePerKg;
    const baseCharge = Number(Math.max(rateCard.minimumCharge || 0, rawCharge).toFixed(2));
    return {
      baseCharge,
      ratePerKg: matchedTier.ratePerKg,
      minimumCharge: rateCard.minimumCharge || 0,
      pricingBlocked: false,
    };
  }

  // 3. PER_KG Model (Default)
  if (rateCard.ratePerKg <= 0 && (!rateCard.minimumCharge || rateCard.minimumCharge <= 0)) {
    return {
      baseCharge: 0,
      ratePerKg: 0,
      minimumCharge: 0,
      pricingBlocked: true,
      pricingBlockReason: 'Customer shipping rate has no valid pricing value.',
    };
  }

  const effectiveRate = rateCard.ratePerKg || 0;
  const rawCharge = billableWeight * effectiveRate;
  const baseCharge = Number(Math.max(rateCard.minimumCharge || 0, rawCharge).toFixed(2));

  return {
    baseCharge,
    ratePerKg: effectiveRate,
    minimumCharge: rateCard.minimumCharge || 0,
    pricingBlocked: false,
  };
};

/**
 * FX conversion engine matching THOUESA treasury rules:
 * - Customer Collections (CUSTOMER_PAYMENT):
 *   - Direct Pair (e.g. Base: JOD, Payment: DZD, Pair: JOD/DZD): THOUESA sells base currency / accepts DZD at sellRate -> fxSide = 'SELL', convertedAmount = baseAmount * sellRate
 *   - Reverse Pair (e.g. Base: DZD, Payment: JOD, Pair: JOD/DZD): THOUESA buys DZD at buyRate -> fxSide = 'BUY', convertedAmount = baseAmount / buyRate
 *   - Same Currency: fxSide = 'NONE', appliedRate = 1.0, convertedAmount = baseAmount
 * - Traveler Payout (TRAVELER_PAYOUT):
 *   - Direct Pair: fxSide = 'BUY', convertedAmount = baseAmount * buyRate
 *   - Reverse Pair: fxSide = 'SELL', convertedAmount = baseAmount / sellRate
 * - NO ACTIVE EXCHANGE RATE -> BLOCK (Zero hardcoded fallback)
 */
export const calculateFxConversion = (
  baseAmount: number,
  baseCurrency: Currency,
  targetCurrency: Currency,
  side: 'BUY' | 'SELL' | 'CUSTOMER_PAYMENT' | 'TRAVELER_PAYOUT',
  exchangeRates: DailyExchangeRate[],
  _originCountryCode?: string
): FxConversionResult => {
  const quoteId = `FXQ-${Date.now().toString().slice(-6)}`;

  if (baseCurrency === targetCurrency) {
    return {
      convertedAmount: baseAmount,
      appliedRate: 1.0,
      fxSide: 'NONE',
      quoteId,
      blocked: false,
    };
  }

  // Look for direct pair: baseCurrency -> targetCurrency (e.g. JOD / DZD)
  const pairDirect = exchangeRates.find(
    (r) => r.baseCurrency === baseCurrency && r.quoteCurrency === targetCurrency && r.status === 'ACTIVE'
  );

  // Look for reverse pair: targetCurrency -> baseCurrency (e.g. DZD / JOD)
  const pairReverse = exchangeRates.find(
    (r) => r.baseCurrency === targetCurrency && r.quoteCurrency === baseCurrency && r.status === 'ACTIVE'
  );

  // 1. Customer Payment Logic
  if (side === 'CUSTOMER_PAYMENT' || side === 'SELL') {
    // Direct Pair: Base is JOD, Customer pays in DZD, Pair is JOD / DZD
    // THOUESA sells JOD base service and receives DZD at SELL rate
    if (pairDirect && pairDirect.sellRate > 0) {
      const appliedRate = pairDirect.sellRate;
      const converted = Number((baseAmount * appliedRate).toFixed(2));
      return {
        convertedAmount: converted,
        appliedRate,
        fxSide: 'SELL',
        rateRecord: pairDirect,
        quoteId,
        blocked: false,
      };
    }

    // Reverse Pair: Base is DZD, Customer pays in JOD, Pair is JOD / DZD
    // THOUESA calculates payment in JOD: baseAmount / buyRate
    if (pairReverse && pairReverse.buyRate > 0) {
      const appliedRate = pairReverse.buyRate;
      const converted = Number((baseAmount / appliedRate).toFixed(2));
      return {
        convertedAmount: converted,
        appliedRate,
        fxSide: 'BUY',
        rateRecord: pairReverse,
        quoteId,
        blocked: false,
      };
    }
  }

  // 2. Traveler Payout Logic
  if (side === 'TRAVELER_PAYOUT' || side === 'BUY') {
    if (pairDirect && pairDirect.buyRate > 0) {
      const appliedRate = pairDirect.buyRate;
      const converted = Number((baseAmount * appliedRate).toFixed(2));
      return {
        convertedAmount: converted,
        appliedRate,
        fxSide: 'BUY',
        rateRecord: pairDirect,
        quoteId,
        blocked: false,
      };
    }

    if (pairReverse && pairReverse.sellRate > 0) {
      const appliedRate = pairReverse.sellRate;
      const converted = Number((baseAmount / appliedRate).toFixed(2));
      return {
        convertedAmount: converted,
        appliedRate,
        fxSide: 'SELL',
        rateRecord: pairReverse,
        quoteId,
        blocked: false,
      };
    }
  }

  // NO ACTIVE EXCHANGE RATE -> STRICT BLOCK (RULE 06 & STAGE 08 SPEC)
  return {
    convertedAmount: 0,
    appliedRate: 0,
    fxSide: side === 'CUSTOMER_PAYMENT' ? 'SELL' : 'BUY',
    quoteId,
    blocked: true,
    blockReason: `NO ACTIVE EXCHANGE RATE: No valid active rate found for pair ${baseCurrency}/${targetCurrency}. Conversion blocked.`,
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

  const actualWeight =
    shipment.actualWeightKg ??
    shipment.estimatedWeightKg ??
    3.2;
  const chargeableWeight = calculateChargeableWeight(actualWeight);

  const rateCard = findShippingRate(
    shippingRates,
    originCountry,
    destCountry,
    'CUSTOMER_SHIPPING',
    shipment.serviceType || 'SEND_PARCEL'
  );

  const baseCurrency: Currency = rateCard?.currency || (originCountry === 'DZ' ? 'DZD' : 'JOD');

  const { baseCharge, ratePerKg, minimumCharge, pricingBlocked, pricingBlockReason } =
    calculateShippingBaseCharge(chargeableWeight, rateCard);

  let fxResult: FxConversionResult;
  if (pricingBlocked) {
    fxResult = {
      convertedAmount: 0,
      appliedRate: 0,
      fxSide: 'NONE',
      quoteId: `FXQ-${Date.now().toString().slice(-6)}`,
      blocked: true,
      blockReason: pricingBlockReason,
    };
  } else {
    fxResult = calculateFxConversion(
      baseCharge,
      baseCurrency,
      paymentCurrency,
      'CUSTOMER_PAYMENT',
      exchangeRates,
      originCountry
    );
  }

  const fxPair =
    baseCurrency === paymentCurrency
      ? 'NONE'
      : fxResult.rateRecord
      ? `${fxResult.rateRecord.baseCurrency} / ${fxResult.rateRecord.quoteCurrency}`
      : `${baseCurrency} / ${paymentCurrency}`;

  const isBlocked = pricingBlocked || fxResult.blocked;
  const blockReason = pricingBlockReason || fxResult.blockReason;

  return {
    baseCurrency,
    paymentCurrency,
    chargeableWeightKg: chargeableWeight,
    billingWeightKg: chargeableWeight,
    ratePerKg,
    minimumCharge,
    baseCharge,
    convertedAmountDue: fxResult.convertedAmount,
    appliedFxRate: fxResult.appliedRate,
    fxSide: fxResult.fxSide,
    rateRecord: fxResult.rateRecord,
    rateCard,
    rateCardId: rateCard?.id,
    rateVersion: rateCard ? `V${rateCard.version}` : 'V1',
    rateType: rateCard?.rateType || 'CUSTOMER_SHIPPING',
    pricingModel: rateCard?.pricingModel || 'PER_KG',
    fxPair,
    quoteId: fxResult.quoteId,
    fxBlocked: isBlocked,
    pricingBlocked,
    blockReason,
  };
};

/**
 * Generates dynamic traveler payout preview following Stage 11 strict rules:
 * - Transported Weight derived strictly from sum(actualWeightKg) of linked shipments in manifest
 * - Available weight & allocated weight NEVER used for compensation
 * - TRAVELER_COMPENSATION rate lookup only (Zero fallback)
 * - Direction independence (JO -> DZ independent from DZ -> JO)
 * - Payout Currency from traveler preference
 * - Direct Pair: THOUESA buys base currency -> BUY side (baseEarnings * buyRate)
 * - Reverse Pair: THOUESA sells base currency -> SELL side (baseEarnings / sellRate)
 * - Same currency: fxSide = NONE, rate = 1
 * - Missing Rate or FX -> Strict BLOCKED
 */
export const calculateTravelerPayoutPreview = (
  trip: Partial<Trip>,
  manifest: Partial<Manifest> | undefined,
  shipmentsInManifest: Shipment[] = [],
  payoutCurrency: Currency = 'DZD',
  shippingRates: ShippingRate[] = [],
  exchangeRates: DailyExchangeRate[] = [],
  defaultOriginCountry: string = 'JO',
  defaultDestCountry: string = 'DZ'
): TravelerPayoutPreview => {
  const originCountry = trip.originHubId === 'hub-alg' ? 'DZ' : defaultOriginCountry;
  const destCountry = originCountry === 'DZ' ? 'JO' : defaultDestCountry;

  // 1. Operational Status Checks
  const isTripCompleted = trip?.status === 'COMPLETED';
  const isManifestClosed = manifest?.status === 'CLOSED';
  const isDiscrepancy = manifest?.status === 'DISCREPANCY' || manifest?.status === 'DISCREPANCY_FLAGGED';
  
  let operationalBlocked = false;
  let operationalBlockReason = '';

  if (!isTripCompleted) {
    operationalBlocked = true;
    operationalBlockReason = `Trip status is '${trip?.status || 'UNKNOWN'}'. COMPLETED status is required for payout.`;
  } else if (!isManifestClosed) {
    operationalBlocked = true;
    operationalBlockReason = `Manifest status is '${manifest?.status || 'UNKNOWN'}'. CLOSED status is required for payout.`;
  } else if (isDiscrepancy) {
    operationalBlocked = true;
    operationalBlockReason = 'Manifest discrepancy requires resolution before payout can proceed.';
  }

  // 2. Transported Weight Calculation from Actual Shipment Weights (Strict Rule 08 & 11)
  let weightBlocked = false;
  let weightBlockReason = '';
  let transportedWeightKg = 0;

  const shipmentWeights: Array<{ id: string; trackingNumber: string; actualWeightKg: number; valid: boolean }> = [];

  if (shipmentsInManifest && shipmentsInManifest.length > 0) {
    let sumWeight = 0;
    for (const ship of shipmentsInManifest) {
      const actualW = ship.actualWeightKg;
      const isValid = typeof actualW === 'number' && actualW > 0;
      shipmentWeights.push({
        id: ship.id,
        trackingNumber: ship.trackingNumber,
        actualWeightKg: actualW || 0,
        valid: isValid,
      });

      if (!isValid) {
        weightBlocked = true;
        weightBlockReason = `Shipment ${ship.trackingNumber} is missing a valid actual weight (actualWeightKg).`;
      } else {
        sumWeight += actualW;
      }
    }

    transportedWeightKg = Number(sumWeight.toFixed(2));

    // Check consistency with manifest declared total if present
    if (manifest?.totalWeightKg && manifest.totalWeightKg > 0) {
      if (Math.abs(manifest.totalWeightKg - transportedWeightKg) > 0.1) {
        weightBlocked = true;
        weightBlockReason = `Manifest weight inconsistency: manifest recorded ${manifest.totalWeightKg} KG but actual sum is ${transportedWeightKg} KG.`;
      }
    }
  } else if (manifest?.totalWeightKg && manifest.totalWeightKg > 0) {
    transportedWeightKg = manifest.totalWeightKg;
  } else {
    weightBlocked = true;
    weightBlockReason = 'No valid transported weight could be verified from manifest packages.';
  }

  if (transportedWeightKg <= 0 && !weightBlocked) {
    weightBlocked = true;
    weightBlockReason = 'Calculated transported weight is zero or negative.';
  }

  // 3. Rate Card Lookup: TRAVELER_COMPENSATION ONLY
  const rateCard = findShippingRate(
    shippingRates,
    originCountry,
    destCountry,
    'TRAVELER_COMPENSATION',
    'SEND_PARCEL'
  );

  let pricingBlocked = false;
  let pricingBlockReason = '';
  let ratePerKg = 0;
  let baseEarnings = 0;
  const baseCurrency: Currency = rateCard?.currency || (originCountry === 'DZ' ? 'DZD' : 'JOD');

  if (!rateCard) {
    pricingBlocked = true;
    pricingBlockReason = `No active TRAVELER_COMPENSATION rate found for route ${originCountry} → ${destCountry}.`;
  } else {
    // Model checks
    if (rateCard.pricingModel === 'FLAT_RATE') {
      if (rateCard.ratePerKg <= 0 && (!rateCard.minimumCharge || rateCard.minimumCharge <= 0)) {
        pricingBlocked = true;
        pricingBlockReason = 'Traveler compensation rate has no valid pricing value.';
      } else {
        baseEarnings = Number((rateCard.ratePerKg || rateCard.minimumCharge || 0).toFixed(2));
        ratePerKg = baseEarnings;
      }
    } else {
      // PER_KG (Default standard)
      if (rateCard.ratePerKg <= 0 && (!rateCard.minimumCharge || rateCard.minimumCharge <= 0)) {
        pricingBlocked = true;
        pricingBlockReason = 'Traveler compensation rate has no valid pricing value.';
      } else {
        ratePerKg = rateCard.ratePerKg;
        const minCharge = rateCard.minimumCharge || 0;
        baseEarnings = Number(Math.max(minCharge, transportedWeightKg * ratePerKg).toFixed(2));
      }
    }
  }

  // 4. FX Conversion
  let fxResult: FxConversionResult;
  if (operationalBlocked || weightBlocked || pricingBlocked) {
    fxResult = {
      convertedAmount: 0,
      appliedRate: 0,
      fxSide: 'NONE',
      quoteId: `FXQ-${Date.now().toString().slice(-6)}`,
      blocked: true,
      blockReason: operationalBlockReason || weightBlockReason || pricingBlockReason,
    };
  } else {
    fxResult = calculateFxConversion(
      baseEarnings,
      baseCurrency,
      payoutCurrency,
      'TRAVELER_PAYOUT',
      exchangeRates,
      originCountry
    );
  }

  const fxPair =
    baseCurrency === payoutCurrency
      ? 'NONE'
      : fxResult.rateRecord
      ? `${fxResult.rateRecord.baseCurrency} / ${fxResult.rateRecord.quoteCurrency}`
      : `${baseCurrency} / ${payoutCurrency}`;

  const isBlocked = operationalBlocked || weightBlocked || pricingBlocked || fxResult.blocked;
  const blockReason =
    operationalBlockReason ||
    weightBlockReason ||
    pricingBlockReason ||
    fxResult.blockReason ||
    '';

  const fxRateId = fxResult.rateRecord?.id || (baseCurrency === payoutCurrency ? 'FX-SAME-CURR' : 'FX-JOD-DZD-v2');
  const fxRateVersion = fxResult.rateRecord?.version ? `V${fxResult.rateRecord.version}` : 'V2';

  return {
    baseCurrency,
    payoutCurrency,
    transportedWeightKg,
    compensationRatePerKg: ratePerKg,
    travelerRatePerKg: ratePerKg,
    baseEarnings,
    convertedPayoutAmount: fxResult.convertedAmount,
    convertedAmount: fxResult.convertedAmount,
    appliedFxRate: fxResult.appliedRate,
    fxSide: fxResult.fxSide,
    rateRecord: fxResult.rateRecord,
    rateCard,
    rateCardId: rateCard?.id,
    rateVersion: rateCard ? `V${rateCard.version}` : 'V1',
    rateType: rateCard?.rateType || 'TRAVELER_COMPENSATION',
    pricingModel: rateCard?.pricingModel || 'PER_KG',
    fxPair,
    fxRateId,
    fxRateVersion,
    quoteId: fxResult.quoteId,
    weightBlocked,
    weightBlockReason,
    pricingBlocked,
    pricingBlockReason,
    operationalBlocked,
    operationalBlockReason,
    fxBlocked: fxResult.blocked,
    isBlocked,
    blockReason,
    blockingFlags: {
      operationalBlocked,
      manifestBlocked: manifest?.status !== 'CLOSED',
      weightBlocked,
      pricingBlocked,
      fxBlocked: !!fxResult.blocked,
    },
    shipmentWeights,
  };
};
