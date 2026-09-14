# Canonical Status Migration & Compatibility Notes
**Version:** PROD 01A — Canonical Domain Migration
**Date:** 2026-09-14
**Target:** MariaDB / MySQL InnoDB (cPanel Compatible)

---

## 1. Shipment Status Mapping (Legacy → Canonical)

| Legacy / Stored Status | Canonical Domain Status | Action / Handling |
| :--- | :--- | :--- |
| `DRAFT` | `DRAFT` | Direct 1:1 match |
| `PENDING_REVIEW` | `PENDING_REVIEW` | Canonical order submission awaiting approval |
| `PENDING_HUB_DROPOFF` | `PENDING_DROPOFF` | Normalized to `PENDING_DROPOFF` (both supported in schema ENUM) |
| `PENDING_DROPOFF` | `PENDING_DROPOFF` | Direct 1:1 match |
| `RECEIVED_AT_ORIGIN` | `RECEIVED_AT_ORIGIN` | Direct 1:1 match (Origin Hub Intake complete) |
| `RECEIVED_AT_ORIGIN_HUB` | `RECEIVED_AT_ORIGIN` | Normalized to `RECEIVED_AT_ORIGIN` |
| `INSPECTED_AND_SEALED` | `INSPECTED_SEALED` | Normalized to `INSPECTED_SEALED` (both supported in schema ENUM) |
| `INSPECTED_SEALED` | `INSPECTED_SEALED` | Direct 1:1 match |
| `WEIGHT_ADJUSTMENT_PENDING` | `WEIGHT_ADJUSTMENT_PENDING` | Direct 1:1 match |
| `WEIGHT_DISCREPANCY_PENDING` | `WEIGHT_ADJUSTMENT_PENDING` | Legacy alias mapped to `WEIGHT_ADJUSTMENT_PENDING` |
| `ASSIGNED_TO_TRIP` | `ASSIGNED_TO_TRIP` | Direct 1:1 match (Package linked to verified flight) |
| `ASSIGNED_TO_TRAVELER` | `ASSIGNED_TO_TRIP` | Mapped to `ASSIGNED_TO_TRIP` |
| `IN_TRANSIT` | `IN_TRANSIT` | Direct 1:1 match (Handed over to traveler, flight active) |
| `IN_TRANSIT_AIR` / `IN_FLIGHT` | `IN_TRANSIT` | In-flight status mapped to `IN_TRANSIT` |
| `CUSTOMS_CLEARANCE` | `CUSTOMS_HELD` | Supported under customs domain tracking |
| `CUSTOMS_HELD` | `CUSTOMS_HELD` | Canonical exception state |
| `RECEIVED_AT_DEST` | `RECEIVED_AT_DEST` | Direct 1:1 match (Destination Hub intake confirmed) |
| `RECEIVED_AT_DEST_HUB` | `RECEIVED_AT_DEST` | Normalized to `RECEIVED_AT_DEST` |
| `READY_FOR_PICKUP` | `READY_FOR_PICKUP` | Direct 1:1 match (Ready for recipient pickup/delivery) |
| `READY_FOR_DELIVERY` | `READY_FOR_PICKUP` | Normalized to `READY_FOR_PICKUP` |
| `OUT_FOR_DELIVERY` | `READY_FOR_PICKUP` | Delivery leg active under Hub dispatch |
| `DELIVERED` | `DELIVERED` | Direct 1:1 match (OTP verified & handover finished) |
| `COMPLETED` | `DELIVERED` | Normalized to `DELIVERED` |
| `DISPUTED` | `DISPUTED` | Direct 1:1 match |
| `REJECTED_PROHIBITED` | `REJECTED_PROHIBITED` | Direct 1:1 match |
| `CANCELLED` | `CANCELLED` | Direct 1:1 match |
| *Unknown / custom legacy* | *N/A* | **MANUAL REVIEW REQUIRED** |

---

## 2. Trip Status Mapping (Legacy → Canonical)

| Legacy / Stored Status | Canonical Domain Status | Action / Handling |
| :--- | :--- | :--- |
| `SUBMITTED` | `SUBMITTED` | Initial traveler registration awaiting employee review |
| `NEEDS_UPDATE` | `NEEDS_UPDATE` | Employee requested passenger to adjust flight/weight details |
| `VERIFIED` | `VERIFIED` | Flight & ticket verified by hub employee |
| `CONFIRMED` | `CONFIRMED` | Traveler confirmed & available for matching |
| `PACKAGES_LINKED` | `PACKAGES_LINKED` | Shipments matched and allocated to trip |
| `ESCROW_LOCKED` | `PACKAGES_LINKED` | Legacy escrow state mapped to `PACKAGES_LINKED` |
| `ESCROW_PAID` | `CONFIRMED` | Legacy traveler deposit state mapped to `CONFIRMED` |
| `DISPATCHED` | `DISPATCHED` | Manifest handed over to traveler at origin airport/hub |
| `IN_TRANSIT` / `IN_FLIGHT`| `DISPATCHED` | Active flight transit mapped to `DISPATCHED` |
| `ARRIVED` | `ARRIVED` | Flight arrived at destination airport |
| `COMPLETED` | `COMPLETED` | Destination hub intake completed & traveler custody discharged |
| `DELAYED` | `DELAYED` | Flight delay flagged |
| `REJECTED` | `REJECTED` | Trip submission rejected by Hub |
| `CANCELLED` | `CANCELLED` | Traveler or Hub cancelled |
| `EMERGENCY_UNASSIGNED` | `EMERGENCY_UNASSIGNED` | Emergency re-routing/re-matching triggered |
| *Other / Ambiguous* | *N/A* | **MANUAL REVIEW REQUIRED** |

---

## 3. Manifest Status Mapping (Legacy → Canonical)

| Legacy / Stored Status | Canonical Domain Status | Action / Handling |
| :--- | :--- | :--- |
| `DRAFT` | `DRAFT` | Initial manifest draft created |
| `PREPARING` | `DRAFT` | Legacy status mapped to `DRAFT` (both preserved in ENUM) |
| `READY` | `READY` | Inspection & security seals locked, ready for traveler handover |
| `HANDED_OVER` | `HANDED_OVER` | QR handover scanned and traveler custody transferred |
| `IN_TRANSIT` | `IN_TRANSIT` | En route to destination |
| `IN_FLIGHT` | `IN_TRANSIT` | Legacy status mapped to `IN_TRANSIT` |
| `ARRIVED` | `ARRIVED` | Reached destination airport |
| `DELIVERED_TO_DEST_HUB`| `ARRIVED` | Destination intake scanned, mapped to `ARRIVED` |
| `CLOSED` | `CLOSED` | All packages safely received and accounted for |
| `DISCREPANCY` | `DISCREPANCY` | Missing/damaged package or seal mismatch flagged |
| `DISCREPANCY_FLAGGED` | `DISCREPANCY` | Normalized to `DISCREPANCY` |
| `CANCELLED` | `CANCELLED` | Flight cancelled or manifest voided |
| *Other / Ambiguous* | *N/A* | **MANUAL REVIEW REQUIRED** |

---

## 4. Operational Incidents vs Customer Disputes Isolation
- `disputes`: Legal/financial consumer claims directly submitted by Senders/Travelers with claim amounts, evidence photos, dual-party hub reviews, and refund/escrow release resolutions.
- `operational_incidents`: Internal operational exception tracking for Hub Agents and Logistics Managers (e.g. `WEIGHT_DIFFERENCE`, `SEAL_MISMATCH`, `MISSING_PACKAGE`, `MANIFEST_DIFFERENCE`, `CUSTOMS_HOLD`). Completely independent table with zero automatic side-effects on dispute resolution.
