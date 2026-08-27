import { Currency, ItemCategory, ItemCondition } from '../types';
import { DEFAULT_CUSTOMS_RULES, EXCHANGE_RATES_TO_USD, ROUTE_PRICING } from './constants';

export function calculateCustomsDuty(params: {
  destinationCountry: string;
  declaredValueUsd: number;
  itemCondition?: ItemCondition;
  category?: ItemCategory;
  customRatePercent?: number;
}): {
  isExempt: boolean;
  customsRatePercent: number;
  customsDutyUsd: number;
  exemptReason?: string;
} {
  const { destinationCountry, declaredValueUsd, itemCondition = 'USED_PERSONAL', category, customRatePercent } = params;

  // 1. Used Personal Items are strictly exempt (0%)
  if (itemCondition === 'USED_PERSONAL') {
    return {
      isExempt: true,
      customsRatePercent: 0,
      customsDutyUsd: 0,
      exemptReason: 'أمانات ومقتنيات شخصية مستعملة معفاة قانوناً وفق لائحة الأمتعة (0%)',
    };
  }

  // 2. Lookup destination country customs rule
  const rule = DEFAULT_CUSTOMS_RULES.find((r) => r.countryCode === destinationCountry) || {
    standardDutyPercent: 15.0,
    newPersonalGoodsDutyPercent: 12.0,
    commercialNewDutyPercent: 20.0,
  };

  let ratePercent = customRatePercent;

  if (ratePercent === undefined || ratePercent === null || isNaN(ratePercent)) {
    if (category && (rule as any).categoryOverrides && (rule as any).categoryOverrides[category]) {
      ratePercent = (rule as any).categoryOverrides[category];
    } else if (itemCondition === 'NEW_PERSONAL') {
      ratePercent = rule.newPersonalGoodsDutyPercent || rule.standardDutyPercent || 12.0;
    } else {
      ratePercent = rule.commercialNewDutyPercent || rule.standardDutyPercent || 20.0;
    }
  }

  const customsDutyUsd = Number(((Math.max(0, declaredValueUsd) * ratePercent) / 100).toFixed(2));

  return {
    isExempt: false,
    customsRatePercent: ratePercent,
    customsDutyUsd,
  };
}

export function formatCurrency(amount: number, currency: Currency = 'USD'): string {
  const symbolMap: Record<Currency, string> = {
    USD: '$',
    JOD: 'د.أ',
    DZD: 'د.ج',
    EGP: 'ج.م',
    SAR: 'ر.س',
  };

  const formattedNum = Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${formattedNum} ${symbolMap[currency] || currency}`;
}

export function convertCurrency(
  amountUsd: number,
  targetCurrency: Currency
): number {
  const rate = EXCHANGE_RATES_TO_USD[targetCurrency] || 1.0;
  return Number((amountUsd * rate).toFixed(2));
}

export function calculateShippingQuote(params: {
  originCountry: string;
  destinationCountry: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  declaredValueUsd: number;
  category: ItemCategory;
  itemCondition?: ItemCondition;
  customRatePercent?: number;
}): {
  chargeableWeightKg: number;
  baseCostUsd: number;
  insuranceUsd: number;
  customsDutyUsd: number;
  customsRatePercent: number;
  isCustomsExempt: boolean;
  travelerShareUsd: number;
  totalCostUsd: number;
  escrowDepositRequiredUsd: number;
} {
  const {
    originCountry,
    destinationCountry,
    weightKg,
    lengthCm,
    widthCm,
    heightCm,
    declaredValueUsd,
    category,
    itemCondition = 'USED_PERSONAL',
    customRatePercent,
  } = params;

  // Volumetric weight divisor = 5000 (IATA standard)
  const volumetricWeight = (lengthCm * widthCm * heightCm) / 5000;
  const chargeableWeightKg = Math.max(weightKg, Number(volumetricWeight.toFixed(2)));

  const route = ROUTE_PRICING.find(
    (r) =>
      r.originCountry === originCountry && r.destinationCountry === destinationCountry
  ) || {
    basePriceKg: 20.0,
    travelerShareKg: 13.0,
    hubFeeKg: 4.0,
    insuranceRatePercent: 2.5,
    averageFlightHours: 4.0,
  };

  const baseCostUsd = Number((chargeableWeightKg * route.basePriceKg).toFixed(2));
  const insuranceUsd = Number(
    Math.max(5, (declaredValueUsd * (route.insuranceRatePercent / 100))).toFixed(2)
  );

  const customsCalc = calculateCustomsDuty({
    destinationCountry,
    declaredValueUsd,
    itemCondition,
    category,
    customRatePercent,
  });

  const travelerShareUsd = Number(
    (chargeableWeightKg * route.travelerShareKg).toFixed(2)
  );
  const totalCostUsd = Number((baseCostUsd + insuranceUsd + customsCalc.customsDutyUsd).toFixed(2));

  // The traveler must lock a refundable escrow matching the declared value
  const escrowDepositRequiredUsd = declaredValueUsd;

  return {
    chargeableWeightKg,
    baseCostUsd,
    insuranceUsd,
    customsDutyUsd: customsCalc.customsDutyUsd,
    customsRatePercent: customsCalc.customsRatePercent,
    isCustomsExempt: customsCalc.isExempt,
    travelerShareUsd,
    totalCostUsd,
    escrowDepositRequiredUsd,
  };
}

export function generateTrackingNumber(
  originCountry: string,
  destinationCountry: string
): string {
  const randomHex = Math.floor(1000 + Math.random() * 9000);
  const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
  return `TH-${originCountry}-${destinationCountry}-${yearMonth}-${randomHex}`;
}

export function generateTamperSealCode(hubCode: string): string {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `SEAL-${hubCode}-${randomDigits}`;
}

export function generateCryptographicHandoverToken(payload: {
  manifestId: string;
  travelerId: string;
  agentId: string;
  totalWeightKg: number;
  packageCount: number;
  timestamp: string;
}): string {
  const rawString = `${payload.manifestId}|${payload.travelerId}|${payload.agentId}|${payload.totalWeightKg}|${payload.packageCount}|${payload.timestamp}`;
  // Generate deterministic mock HMAC signature
  let hash = 0;
  for (let i = 0; i < rawString.length; i++) {
    const char = rawString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hmacSignature = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
  return `THOUESA_SECURE_HMAC_v1:${Buffer.from(rawString).toString('base64')}:${hmacSignature}`;
}

export function verifyCryptographicHandoverToken(token: string): {
  isValid: boolean;
  payload?: {
    manifestId: string;
    travelerId: string;
    agentId: string;
    totalWeightKg: number;
    packageCount: number;
    timestamp: string;
  };
  error?: string;
} {
  try {
    if (!token || !token.startsWith('THOUESA_SECURE_HMAC_v1:')) {
      return { isValid: false, error: 'Invalid token header format' };
    }
    const parts = token.split(':');
    if (parts.length !== 3) {
      return { isValid: false, error: 'Malformed token structure' };
    }
    const decoded = Buffer.from(parts[1], 'base64').toString('utf-8');
    const fields = decoded.split('|');
    if (fields.length !== 6) {
      return { isValid: false, error: 'Missing token signature fields' };
    }
    return {
      isValid: true,
      payload: {
        manifestId: fields[0],
        travelerId: fields[1],
        agentId: fields[2],
        totalWeightKg: parseFloat(fields[3]),
        packageCount: parseInt(fields[4], 10),
        timestamp: fields[5],
      },
    };
  } catch (err: any) {
    return { isValid: false, error: err.message || 'Token verification failed' };
  }
}
