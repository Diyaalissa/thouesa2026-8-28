/**
 * THOUESA Operational Status Compatibility Normalizer
 * 
 * Maps legacy database aliases to canonical Employee UI statuses.
 * Legacy compatibility only - does not modify backend data silently.
 */

export const SHIPMENT_STATUS_MAP: Record<string, string> = {
  // Legacy aliases -> Canonical UI Statuses
  PENDING: 'PENDING_REVIEW',
  PENDING_HUB_DROPOFF: 'PENDING_DROPOFF',
  RECEIVED_AT_ORIGIN_HUB: 'RECEIVED_AT_ORIGIN',
  INSPECTED_AND_SEALED: 'INSPECTED_SEALED',
  WEIGHT_DISCREPANCY_PENDING: 'WEIGHT_ADJUSTMENT_PENDING',
  ASSIGNED_TO_TRAVELER: 'ASSIGNED_TO_TRIP',
  IN_TRANSIT_AIR: 'IN_TRANSIT',
  IN_FLIGHT: 'IN_TRANSIT',
  RECEIVED_AT_DEST_HUB: 'RECEIVED_AT_DEST',
  READY_FOR_DELIVERY: 'READY_FOR_PICKUP',
};

export const TRIP_STATUS_MAP: Record<string, string> = {
  // Legacy aliases -> Canonical UI Statuses
  SCHEDULED: 'SUBMITTED',
  CHECKED_IN: 'CONFIRMED',
  IN_TRANSIT: 'DISPATCHED',
  IN_FLIGHT: 'DISPATCHED',
};

export const MANIFEST_STATUS_MAP: Record<string, string> = {
  // Legacy aliases -> Canonical UI Statuses
  PREPARING: 'DRAFT',
  IN_FLIGHT: 'IN_TRANSIT',
  DELIVERED_TO_DEST_HUB: 'ARRIVED',
  DISCREPANCY_FLAGGED: 'DISCREPANCY',
};

/**
 * Normalizes any shipment status string to the canonical Employee UI status.
 */
export const normalizeShipmentStatus = (rawStatus?: string): string => {
  if (!rawStatus) return 'DRAFT';
  return SHIPMENT_STATUS_MAP[rawStatus] || rawStatus;
};

/**
 * Normalizes any traveler trip status string to the canonical Employee UI status.
 */
export const normalizeTripStatus = (rawStatus?: string): string => {
  if (!rawStatus) return 'SUBMITTED';
  return TRIP_STATUS_MAP[rawStatus] || rawStatus;
};

/**
 * Normalizes any manifest status string to the canonical Employee UI status.
 */
export const normalizeManifestStatus = (rawStatus?: string): string => {
  if (!rawStatus) return 'DRAFT';
  return MANIFEST_STATUS_MAP[rawStatus] || rawStatus;
};
