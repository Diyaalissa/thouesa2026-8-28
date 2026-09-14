import { Router, Request, Response } from 'express';
import { DEFAULT_CUSTOMS_RULES, ROUTE_PRICING } from '../../src/lib/constants';
import { CustomsDutyRule } from '../../src/types';
import { db } from '../store';
import { broadcastNotification } from './notifications';

export const ratesRouter = Router();

// In-Memory Cache Store with TTL for live exchange rates and corridor locks
interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttlMs: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

function getFromCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > entry.ttlMs) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setToCache<T>(key: string, data: T, ttlMs: number = 300000): void {
  memoryCache.set(key, {
    data,
    cachedAt: Date.now(),
    ttlMs,
  });
}

function clearRatesCache(): void {
  memoryCache.delete('RATES_AND_CORRIDORS');
}

/**
 * GET /api/rates
 * Returns live multi-currency exchange rates and corridors pricing
 */
ratesRouter.get('/', (req: Request, res: Response) => {
  const cacheKey = 'RATES_AND_CORRIDORS';
  const cached = getFromCache<any>(cacheKey);

  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json({
      success: true,
      source: 'MEMORY_CACHE',
      ...cached,
    });
  }

  const currenciesList = Array.from(db.exchangeRateDetails.values());

  const payload = {
    baseCurrency: 'USD',
    rates: db.exchangeRates,
    corridors: ROUTE_PRICING,
    rateLockExpiry: new Date(Date.now() + 300000).toISOString(),
    supportedCurrencies: currenciesList,
    timestamp: new Date().toISOString(),
  };

  setToCache(cacheKey, payload, 300000); // 5 mins cache

  res.setHeader('X-Cache', 'MISS');
  res.json({
    success: true,
    source: 'DATABASE_LIVE',
    ...payload,
  });
});

/**
 * PUT /api/rates or POST /api/rates/update
 * Updates live exchange rate(s) with full audit trail
 */
const handleUpdateRates = (req: Request, res: Response) => {
  const { currency, rateToUsd, rates, adminId, adminName } = req.body;

  if (rates && typeof rates === 'object') {
    // Batch update
    Object.entries(rates).forEach(([curr, rate]) => {
      const numericRate = Number(rate);
      if (!isNaN(numericRate) && numericRate > 0) {
        db.exchangeRates[curr] = numericRate;
        if (curr === 'DZA') db.exchangeRates['DZD'] = numericRate;
        if (curr === 'DZD') db.exchangeRates['DZA'] = numericRate;

        const detail = db.exchangeRateDetails.get(curr);
        if (detail) {
          detail.rateToUsd = numericRate;
          detail.lastUpdated = new Date().toISOString();
          detail.updatedBy = adminName || 'Master Admin';
          detail.isManualOverride = true;
          db.exchangeRateDetails.set(curr, detail);
        }
      }
    });

    clearRatesCache();

    db.logAudit({
      actorId: adminId || 'usr-admin-001',
      actorName: adminName || 'Master Admin',
      actorRole: 'MASTER_ADMIN',
      domain: 'ExchangeRates',
      action: 'BATCH_UPDATE_EXCHANGE_RATES',
      resourceType: 'ExchangeRate',
      resourceId: 'ALL_CURRENCIES',
      details: { newRates: rates },
    });

    return res.json({
      success: true,
      message: 'تم تحديث كافة أسعار الصرف بنجاح وتثبيت الهامش المالي.',
      rates: db.exchangeRates,
      supportedCurrencies: Array.from(db.exchangeRateDetails.values()),
    });
  }

  if (!currency || rateToUsd === undefined || isNaN(Number(rateToUsd)) || Number(rateToUsd) <= 0) {
    return res.status(400).json({
      success: false,
      error: 'رمز العملة وسعر الصرف الإيجابي مطلوبان (Currency and valid positive rate required).',
    });
  }

  const numericRate = Number(rateToUsd);
  const currCode = String(currency).toUpperCase();
  const oldRate = db.exchangeRates[currCode] || 1.0;

  db.exchangeRates[currCode] = numericRate;
  if (currCode === 'DZA') db.exchangeRates['DZD'] = numericRate;
  if (currCode === 'DZD') db.exchangeRates['DZA'] = numericRate;

  let detail = db.exchangeRateDetails.get(currCode);
  if (!detail) {
    detail = {
      code: currCode,
      nameAr: currCode,
      nameEn: currCode,
      symbol: currCode,
      rateToUsd: numericRate,
      lastUpdated: new Date().toISOString(),
      updatedBy: adminName || 'Master Admin',
      isManualOverride: true,
    };
  } else {
    detail.rateToUsd = numericRate;
    detail.lastUpdated = new Date().toISOString();
    detail.updatedBy = adminName || 'Master Admin';
    detail.isManualOverride = true;
  }
  db.exchangeRateDetails.set(currCode, detail);

  clearRatesCache();

  db.logAudit({
    actorId: adminId || 'usr-admin-001',
    actorName: adminName || 'Master Admin',
    actorRole: 'MASTER_ADMIN',
    domain: 'ExchangeRates',
    action: 'UPDATE_EXCHANGE_RATE',
    resourceType: 'ExchangeRate',
    resourceId: currCode,
    details: { currency: currCode, oldRate, newRate: numericRate },
  });

  const notif = db.pushNotification({
    type: 'ORDER_CREATED',
    titleAr: 'تحديث سعر صرف العملة',
    titleEn: 'Exchange Rate Updated',
    messageAr: `قام المسؤول بتحديث سعر صرف ${detail.nameAr} إلى ${numericRate} مقابل الدولار.`,
    messageEn: `Master Admin updated ${currCode} exchange rate to ${numericRate} / USD.`,
    targetRole: 'MASTER_ADMIN',
    priority: 'NORMAL',
  });
  broadcastNotification(notif);

  res.json({
    success: true,
    message: `تم تحديث سعر صرف ${detail.nameAr} (${currCode}) بنجاح إلى ${numericRate}.`,
    rate: detail,
    rates: db.exchangeRates,
    supportedCurrencies: Array.from(db.exchangeRateDetails.values()),
  });
};

ratesRouter.put('/', handleUpdateRates);
ratesRouter.post('/update', handleUpdateRates);

/**
 * POST /api/rates/reset
 * Resets rates to official baseline
 */
ratesRouter.post('/reset', (req: Request, res: Response) => {
  const { adminId, adminName } = req.body;

  const baseline = [
    { code: 'USD', nameAr: 'دولار أمريكي', nameEn: 'US Dollar', symbol: '$', rateToUsd: 1.0 },
    { code: 'JOD', nameAr: 'دينار أردني', nameEn: 'Jordanian Dinar', symbol: 'JD', rateToUsd: 0.709 },
    { code: 'DZD', nameAr: 'دينار جزائري', nameEn: 'Algerian Dinar', symbol: 'DA', rateToUsd: 134.5 },
    { code: 'EGP', nameAr: 'جنيه مصري', nameEn: 'Egyptian Pound', symbol: 'E£', rateToUsd: 48.85 },
    { code: 'SAR', nameAr: 'ريال سعودي', nameEn: 'Saudi Riyal', symbol: 'SR', rateToUsd: 3.75 },
    { code: 'OMR', nameAr: 'ريال عُماني', nameEn: 'Omani Rial', symbol: 'OMR', rateToUsd: 0.385 },
    { code: 'AED', nameAr: 'درهم إماراتي', nameEn: 'UAE Dirham', symbol: 'AED', rateToUsd: 3.67 },
  ];

  baseline.forEach((c) => {
    db.exchangeRateDetails.set(c.code, {
      ...c,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'System Reset',
      isManualOverride: false,
    });
    db.exchangeRates[c.code] = c.rateToUsd;
  });
  db.exchangeRates['DZA'] = 134.5;

  clearRatesCache();

  db.logAudit({
    actorId: adminId || 'usr-admin-001',
    actorName: adminName || 'Master Admin',
    actorRole: 'MASTER_ADMIN',
    domain: 'ExchangeRates',
    action: 'RESET_EXCHANGE_RATES_BASELINE',
    resourceType: 'ExchangeRate',
    resourceId: 'ALL_CURRENCIES',
    details: { baselineCount: baseline.length },
  });

  res.json({
    success: true,
    message: 'تم إعادة تعيين كافة أسعار الصرف إلى القيم المرجعية للنظام.',
    rates: db.exchangeRates,
    supportedCurrencies: Array.from(db.exchangeRateDetails.values()),
  });
});

/**
 * GET /api/rates/customs or GET /api/rates/customs/rules
 * Returns all country customs duty rules
 */
ratesRouter.get('/customs', (req: Request, res: Response) => {
  const rules = Array.from(db.customsRules.values());
  res.json({
    success: true,
    rules,
    totalCountries: rules.length,
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/rates/customs/update
 * Updates or adds a country customs duty rule
 */
ratesRouter.post('/customs/update', (req: Request, res: Response) => {
  const {
    countryCode,
    countryNameAr,
    countryNameEn,
    standardDutyPercent,
    newPersonalGoodsDutyPercent,
    commercialNewDutyPercent,
    usedPersonalExempt = true,
    minExemptValueUsd = 50,
    categoryOverrides,
    notesAr,
    notesEn,
    adminId,
    adminName,
  } = req.body;

  if (!countryCode || standardDutyPercent === undefined) {
    return res.status(400).json({
      success: false,
      error: 'رمز الدولة ونسبة الجمرك الأساسية مطلوبان (Country code and standard duty percent required).',
    });
  }

  const code = String(countryCode).toUpperCase().trim();
  const existing = db.customsRules.get(code);

  const updatedRule: CustomsDutyRule = {
    countryCode: code,
    countryNameAr: countryNameAr || existing?.countryNameAr || code,
    countryNameEn: countryNameEn || existing?.countryNameEn || code,
    standardDutyPercent: Number(standardDutyPercent) || 0,
    newPersonalGoodsDutyPercent: newPersonalGoodsDutyPercent !== undefined ? Number(newPersonalGoodsDutyPercent) : Number(standardDutyPercent),
    commercialNewDutyPercent: commercialNewDutyPercent !== undefined ? Number(commercialNewDutyPercent) : Number(standardDutyPercent),
    usedPersonalExempt: usedPersonalExempt !== false,
    minExemptValueUsd: Number(minExemptValueUsd) || 0,
    categoryOverrides: categoryOverrides || existing?.categoryOverrides || {},
    notesAr: notesAr || existing?.notesAr || '',
    notesEn: notesEn || existing?.notesEn || '',
    lastUpdated: new Date().toISOString(),
    updatedBy: adminName || 'Master Admin',
  };

  db.customsRules.set(code, updatedRule);

  db.logAudit({
    actorId: adminId || 'usr-admin-001',
    actorName: adminName || 'Master Admin',
    actorRole: 'MASTER_ADMIN',
    domain: 'CustomsTariffs',
    action: 'UPDATE_CUSTOMS_RULE',
    resourceType: 'CustomsDutyRule',
    resourceId: code,
    details: {
      oldRule: existing,
      newRule: updatedRule,
    },
  });

  const notif = db.pushNotification({
    type: 'SYSTEM_ALERT',
    titleAr: 'تحديث التعريفة الجمركية لدولة',
    titleEn: 'Customs Tariff Updated',
    messageAr: `تم تحديث نسبة الجمرك لدولة ${updatedRule.countryNameAr} (${code}) بنجاح.`,
    messageEn: `Customs duty rule updated for ${updatedRule.countryNameEn} (${code}).`,
    targetRole: 'MASTER_ADMIN',
    priority: 'NORMAL',
  });
  broadcastNotification(notif);

  res.json({
    success: true,
    message: `تم تحديث وحفظ التعريفة الجمركية لدولة ${updatedRule.countryNameAr} بنجاح.`,
    rule: updatedRule,
    allRules: Array.from(db.customsRules.values()),
  });
});

/**
 * POST /api/rates/customs/reset
 * Resets customs rules to official baseline
 */
ratesRouter.post('/customs/reset', (req: Request, res: Response) => {
  const { adminId, adminName } = req.body;

  db.customsRules.clear();
  DEFAULT_CUSTOMS_RULES.forEach((rule) => {
    db.customsRules.set(rule.countryCode, { ...rule });
  });

  db.logAudit({
    actorId: adminId || 'usr-admin-001',
    actorName: adminName || 'Master Admin',
    actorRole: 'MASTER_ADMIN',
    domain: 'CustomsTariffs',
    action: 'RESET_CUSTOMS_BASELINE',
    resourceType: 'CustomsDutyRule',
    resourceId: 'ALL_COUNTRIES',
    details: { count: DEFAULT_CUSTOMS_RULES.length },
  });

  res.json({
    success: true,
    message: 'تم إعادة تعيين كافة التعريفات الجمركية للقيم المرجعية للنظام.',
    rules: Array.from(db.customsRules.values()),
  });
});

/**
 * POST /api/rates/calculate
 * Calculate shipping quote and customs duty on server
 */
ratesRouter.post('/calculate', (req: Request, res: Response) => {
  const {
    originCountry,
    destinationCountry,
    weightKg,
    declaredValueUsd,
    itemCondition = 'USED_PERSONAL',
    category,
    customRatePercent,
    isExpress,
  } = req.body;

  const foundCorridor = ROUTE_PRICING.find(
    (r) => r.originCountry === (originCountry || 'JOR') && r.destinationCountry === (destinationCountry || 'DZA')
  );

  const corridor = foundCorridor || {
    originCountry: originCountry || 'JOR',
    destinationCountry: destinationCountry || 'DZA',
    basePriceKg: 18.0,
    travelerShareKg: 12.0,
    hubFeeKg: 4.5,
    insuranceRatePercent: 2.5,
    averageFlightHours: 5.5,
  };

  const weight = Math.max(0.5, Number(weightKg) || 1.0);
  const baseCost = weight * corridor.basePriceKg;
  const declaredVal = Number(declaredValueUsd) || 0;
  const insuranceFee = declaredVal * (corridor.insuranceRatePercent / 100 || 0.025);

  // Customs Calculation
  const destCode = (destinationCountry || 'DZA').toUpperCase();
  const rule = db.customsRules.get(destCode) || {
    standardDutyPercent: 15.0,
    newPersonalGoodsDutyPercent: 12.0,
    commercialNewDutyPercent: 20.0,
    usedPersonalExempt: true,
  };

  let customsDutyUsd = 0;
  let customsRateApplied = 0;
  let isCustomsExempt = false;

  if (itemCondition === 'USED_PERSONAL') {
    isCustomsExempt = true;
    customsDutyUsd = 0;
    customsRateApplied = 0;
  } else {
    isCustomsExempt = false;
    if (customRatePercent !== undefined && !isNaN(Number(customRatePercent))) {
      customsRateApplied = Number(customRatePercent);
    } else if (category && (rule as any).categoryOverrides && (rule as any).categoryOverrides[category]) {
      customsRateApplied = (rule as any).categoryOverrides[category];
    } else if (itemCondition === 'NEW_PERSONAL') {
      customsRateApplied = rule.newPersonalGoodsDutyPercent || rule.standardDutyPercent || 12.0;
    } else {
      customsRateApplied = rule.commercialNewDutyPercent || rule.standardDutyPercent || 20.0;
    }
    customsDutyUsd = Number(((declaredVal * customsRateApplied) / 100).toFixed(2));
  }

  const totalUsd = Number((baseCost + insuranceFee + customsDutyUsd + (isExpress ? 10 : 0)).toFixed(2));

  res.json({
    success: true,
    breakdown: {
      corridor: `${originCountry || 'JOR'} -> ${destinationCountry || 'DZA'}`,
      weightKg: weight,
      baseCostUsd: baseCost,
      insuranceFeeUsd: insuranceFee,
      customsDutyUsd,
      customsRateApplied,
      isCustomsExempt,
      itemCondition,
      expressFeeUsd: isExpress ? 10 : 0,
      totalCostUsd: totalUsd,
      amountsInLocal: {
        JOD: Number((totalUsd * (db.exchangeRates['JOD'] || 0.709)).toFixed(2)),
        DZD: Number((totalUsd * (db.exchangeRates['DZD'] || 134.5)).toFixed(2)),
        EGP: Number((totalUsd * (db.exchangeRates['EGP'] || 48.85)).toFixed(2)),
        SAR: Number((totalUsd * (db.exchangeRates['SAR'] || 3.75)).toFixed(2)),
        OMR: Number((totalUsd * (db.exchangeRates['OMR'] || 0.385)).toFixed(2)),
        AED: Number((totalUsd * (db.exchangeRates['AED'] || 3.67)).toFixed(2)),
      },
    },
  });
});
