import { Hub } from '../types';
import { HUBS_DATA } from './constants';
import { normalizeCountryCode } from './statusNormalizer';

export interface ActiveCountry {
  code: string; // 2-letter canonical ISO code, e.g. "JO", "DZ", "EG", "SA", "OM"
  rawCode: string; // Original code from Hub (e.g. "JOR", "DZA", "EGY")
  nameAr: string;
  nameEn: string;
  activeHubsCount: number;
  hubs: Hub[];
}

/**
 * Derives unique, active countries purely from the list of active hubs.
 * If no hubs are provided, falls back to the default HUBS_DATA.
 * THOUESA operates dynamically wherever an active hub is configured.
 */
export function getActiveCountries(hubs?: Hub[]): ActiveCountry[] {
  const sourceHubs = (hubs && hubs.length > 0 ? hubs : HUBS_DATA).filter(
    (h) => h.isActive !== false
  );

  const countryMap = new Map<string, ActiveCountry>();

  sourceHubs.forEach((hub) => {
    const canonicalCode = normalizeCountryCode(hub.countryCode || hub.code);
    if (!countryMap.has(canonicalCode)) {
      countryMap.set(canonicalCode, {
        code: canonicalCode,
        rawCode: hub.countryCode || canonicalCode,
        nameAr: hub.countryNameAr || (canonicalCode === 'JO' ? 'الأردن' : canonicalCode === 'DZ' ? 'الجزائر' : hub.cityAr),
        nameEn: hub.countryNameEn || (canonicalCode === 'JO' ? 'Jordan' : canonicalCode === 'DZ' ? 'Algeria' : hub.cityEn),
        activeHubsCount: 1,
        hubs: [hub],
      });
    } else {
      const existing = countryMap.get(canonicalCode)!;
      existing.activeHubsCount += 1;
      existing.hubs.push(hub);
    }
  });

  return Array.from(countryMap.values());
}
