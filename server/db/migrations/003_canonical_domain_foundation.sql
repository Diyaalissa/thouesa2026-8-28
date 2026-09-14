-- =========================================================================
-- MIGRATION: 003_canonical_domain_foundation.sql
-- TARGET: MariaDB / MySQL InnoDB (cPanel Compatible)
-- ENVIRONMENT: THOUESA Logistics & Escrow Platform
-- OBJECTIVE: Additive Canonical Domain Foundation (PROD 01A)
-- SAFETY: Non-destructive, additive only, strict DECIMAL precision for money/weight,
--         dynamic multi-country support without hardcoded whitelist constraints.
-- =========================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------------------------------------
-- 1. SHIPPING RATES (Dual Rates: CUSTOMER_SHIPPING vs TRAVELER_COMPENSATION)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipping_rates (
    id VARCHAR(36) PRIMARY KEY,
    origin_country_code VARCHAR(3) NOT NULL,
    destination_country_code VARCHAR(3) NOT NULL,
    origin_hub_id VARCHAR(36) NULL,
    destination_hub_id VARCHAR(36) NULL,
    service_type ENUM('SEND_PARCEL', 'INTERNATIONAL_BUY', 'SPECIFIC_COUNTRY_BUY') DEFAULT 'SEND_PARCEL',
    rate_type ENUM('CUSTOMER_SHIPPING', 'TRAVELER_COMPENSATION') NOT NULL,
    pricing_model ENUM('PER_KG', 'FLAT_RATE', 'WEIGHT_TIERS') NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    rate_per_kg DECIMAL(10, 4) NULL,
    flat_amount DECIMAL(10, 2) NULL,
    minimum_charge DECIMAL(10, 2) DEFAULT 0.00,
    minimum_billable_weight_kg DECIMAL(6, 2) DEFAULT 1.00,
    version INT NOT NULL DEFAULT 1,
    status ENUM('DRAFT', 'SCHEDULED', 'ACTIVE', 'EXPIRED', 'DISABLED', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    effective_from DATETIME NOT NULL,
    effective_to DATETIME NULL,
    reason TEXT NULL,
    created_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rate_lookup (rate_type, origin_country_code, destination_country_code, status),
    INDEX idx_rate_effective (effective_from, effective_to),
    INDEX idx_rate_version (origin_country_code, destination_country_code, version),
    FOREIGN KEY (origin_hub_id) REFERENCES hubs(id) ON DELETE SET NULL,
    FOREIGN KEY (destination_hub_id) REFERENCES hubs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 2. SHIPPING RATE TIERS (For WEIGHT_TIERS pricing models)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipping_rate_tiers (
    id VARCHAR(36) PRIMARY KEY,
    shipping_rate_id VARCHAR(36) NOT NULL,
    min_weight_kg DECIMAL(6, 2) NOT NULL,
    max_weight_kg DECIMAL(6, 2) NULL,
    amount DECIMAL(10, 2) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shipping_rate_id) REFERENCES shipping_rates(id) ON DELETE CASCADE,
    INDEX idx_tier_rate_lookup (shipping_rate_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 3. DAILY EXCHANGE RATES (Dual BUY & SELL with Rate Versioning)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_exchange_rates (
    id VARCHAR(36) PRIMARY KEY,
    base_currency VARCHAR(3) NOT NULL,
    quote_currency VARCHAR(3) NOT NULL,
    buy_rate DECIMAL(14, 6) NOT NULL,
    sell_rate DECIMAL(14, 6) NOT NULL,
    country_scope VARCHAR(10) NOT NULL DEFAULT 'GLOBAL',
    source VARCHAR(50) NOT NULL DEFAULT 'CENTRAL_BANK_OF_JORDAN',
    version VARCHAR(36) NOT NULL DEFAULT '1',
    status ENUM('DRAFT', 'SCHEDULED', 'ACTIVE', 'EXPIRED', 'DISABLED', 'CLOSED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    effective_from DATETIME NOT NULL,
    effective_to DATETIME NULL,
    notes TEXT NULL,
    created_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_fx_pair (base_currency, quote_currency, status),
    INDEX idx_fx_effective (effective_from, effective_to),
    INDEX idx_fx_version (base_currency, quote_currency, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 4. PUBLIC ANNOUNCEMENTS (Landing & Portal Dynamic Banners)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public_announcements (
    id VARCHAR(36) PRIMARY KEY,
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    body_ar TEXT NOT NULL,
    body_en TEXT NOT NULL,
    badge_ar VARCHAR(50) NULL,
    badge_en VARCHAR(50) NULL,
    image_url VARCHAR(255) NULL,
    cta_label_ar VARCHAR(100) NULL,
    cta_label_en VARCHAR(100) NULL,
    cta_target VARCHAR(100) NULL,
    placement ENUM('TOP_BANNER', 'HOME_FEATURED', 'BELOW_SCHEDULE') NOT NULL DEFAULT 'TOP_BANNER',
    priority INT NOT NULL DEFAULT 1,
    start_at DATETIME NOT NULL,
    end_at DATETIME NULL,
    status ENUM('DRAFT', 'SCHEDULED', 'ACTIVE', 'EXPIRED', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
    is_dismissible BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_announcement_lookup (placement, status, start_at, end_at),
    INDEX idx_announcement_priority (priority DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 5. SETTLEMENTS FOUNDATION (Customer Payment, Traveler Payout, Refunds)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settlements (
    id VARCHAR(36) PRIMARY KEY,
    settlement_number VARCHAR(50) UNIQUE NOT NULL,
    type ENUM('CUSTOMER_PAYMENT', 'TRAVELER_PAYOUT', 'REFUND') NOT NULL,
    status ENUM('DRAFT', 'QUOTED', 'PENDING_PAYMENT', 'PAID', 'PENDING_PAYOUT', 'SETTLED', 'FAILED', 'CANCELLED', 'REVERSED') NOT NULL DEFAULT 'DRAFT',
    
    -- Actor references
    related_user_id VARCHAR(36) NOT NULL,
    related_user_name VARCHAR(150) NOT NULL,
    shipment_id VARCHAR(36) NULL,
    tracking_number VARCHAR(35) NULL,
    trip_id VARCHAR(36) NULL,
    flight_number VARCHAR(20) NULL,
    manifest_id VARCHAR(36) NULL,
    hub_id VARCHAR(36) NOT NULL,
    hub_code VARCHAR(10) NOT NULL,
    
    -- Pricing Snapshots
    shipping_rate_id VARCHAR(36) NULL,
    shipping_rate_version VARCHAR(36) NULL,
    traveler_compensation_rate_id VARCHAR(36) NULL,
    traveler_compensation_rate_version VARCHAR(36) NULL,
    rate_type VARCHAR(50) NULL,
    pricing_model VARCHAR(50) NULL,
    applied_shipping_rate DECIMAL(10, 4) NULL,
    applied_traveler_rate DECIMAL(10, 4) NULL,
    billing_weight_kg DECIMAL(6, 2) NULL,
    transported_weight_kg DECIMAL(6, 2) NULL,
    
    -- Monetary amounts
    base_amount DECIMAL(12, 2) NOT NULL,
    base_currency VARCHAR(3) NOT NULL,
    settlement_currency VARCHAR(3) NOT NULL,
    exchange_rate_id VARCHAR(36) NULL,
    exchange_rate_version VARCHAR(36) NULL,
    fx_side ENUM('BUY', 'SELL', 'NONE') NOT NULL DEFAULT 'NONE',
    applied_fx_rate DECIMAL(14, 6) NOT NULL DEFAULT 1.000000,
    converted_amount DECIMAL(12, 2) NOT NULL,
    fees DECIMAL(12, 2) DEFAULT 0.00,
    adjustments DECIMAL(12, 2) DEFAULT 0.00,
    final_amount DECIMAL(12, 2) NOT NULL,
    
    -- Transaction & Receipt
    payment_method VARCHAR(50) NULL,
    receipt_number VARCHAR(100) NULL,
    reference VARCHAR(100) NULL,
    idempotency_key VARCHAR(100) NULL,
    notes TEXT NULL,
    
    -- Reversals
    original_settlement_id VARCHAR(36) NULL,
    reversal_reference VARCHAR(100) NULL,
    refund_reason TEXT NULL,
    failure_reason TEXT NULL,
    
    -- Auditing & Timestamps
    processed_by VARCHAR(36) NOT NULL,
    processed_by_name VARCHAR(150) NOT NULL,
    processed_at DATETIME NOT NULL,
    settled_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_settlement_user (related_user_id),
    INDEX idx_settlement_shipment (shipment_id),
    INDEX idx_settlement_trip (trip_id),
    INDEX idx_settlement_status (status),
    INDEX idx_settlement_idempotency (idempotency_key),
    FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (hub_id) REFERENCES hubs(id) ON DELETE RESTRICT,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE SET NULL,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
    FOREIGN KEY (manifest_id) REFERENCES manifests(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 6. OPERATIONAL INCIDENTS (Distinct from Consumer Legal Disputes)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS operational_incidents (
    id VARCHAR(36) PRIMARY KEY,
    incident_number VARCHAR(50) UNIQUE NOT NULL,
    category ENUM('WEIGHT_DIFFERENCE', 'PROHIBITED_ITEM', 'DAMAGED_PACKAGE', 'SEAL_MISMATCH', 'MISSING_PACKAGE', 'TRAVELER_CANCELLATION', 'TRAVELER_DELAY', 'MANIFEST_DIFFERENCE', 'CUSTOMS_HOLD', 'IDENTITY_ISSUE', 'OTHER') NOT NULL,
    entity_type ENUM('MANIFEST', 'SHIPMENT', 'TRIP', 'TRAVELER', 'CUSTOMS', 'SYSTEM') NOT NULL DEFAULT 'SHIPMENT',
    reference_number VARCHAR(50) NULL,
    priority ENUM('HIGH', 'MEDIUM', 'LOW') NOT NULL DEFAULT 'MEDIUM',
    status ENUM('OPEN', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'RESOLVED', 'CLOSED', 'ESCALATED') NOT NULL DEFAULT 'OPEN',
    is_blocking BOOLEAN DEFAULT FALSE,
    hub_id VARCHAR(36) NOT NULL,
    hub_name VARCHAR(150) NOT NULL,
    related_shipment_id VARCHAR(36) NULL,
    tracking_number VARCHAR(35) NULL,
    related_trip_id VARCHAR(36) NULL,
    flight_number VARCHAR(20) NULL,
    related_manifest_id VARCHAR(36) NULL,
    title VARCHAR(255) NULL,
    description TEXT NOT NULL,
    evidence_photos JSON NULL,
    assigned_employee_id VARCHAR(36) NOT NULL,
    assigned_employee_name VARCHAR(150) NOT NULL,
    assigned_role VARCHAR(50) NULL,
    resolution_notes TEXT NULL,
    resolved_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_incident_hub (hub_id),
    INDEX idx_incident_status (status),
    INDEX idx_incident_shipment (related_shipment_id),
    INDEX idx_incident_trip (related_trip_id),
    INDEX idx_incident_manifest (related_manifest_id),
    FOREIGN KEY (hub_id) REFERENCES hubs(id) ON DELETE RESTRICT,
    FOREIGN KEY (related_shipment_id) REFERENCES shipments(id) ON DELETE SET NULL,
    FOREIGN KEY (related_trip_id) REFERENCES trips(id) ON DELETE SET NULL,
    FOREIGN KEY (related_manifest_id) REFERENCES manifests(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 7. SHIPMENTS ADDITIVE ENHANCEMENTS & CANONICAL STATUS ALIGNMENT
-- -------------------------------------------------------------------------
ALTER TABLE shipments 
MODIFY COLUMN current_status ENUM(
    'DRAFT', 
    'PENDING',
    'PENDING_REVIEW',
    'PENDING_DROPOFF', 
    'PENDING_HUB_DROPOFF', 
    'RECEIVED_AT_ORIGIN', 
    'RECEIVED_AT_ORIGIN_HUB',
    'INSPECTED_SEALED', 
    'INSPECTED_AND_SEALED',
    'WEIGHT_ADJUSTMENT_PENDING', 
    'WEIGHT_DISCREPANCY_PENDING',
    'ASSIGNED_TO_TRIP', 
    'ASSIGNED_TO_TRAVELER',
    'IN_TRANSIT', 
    'IN_TRANSIT_AIR',
    'IN_FLIGHT',
    'CUSTOMS_CLEARANCE',
    'CUSTOMS_HELD',
    'RECEIVED_AT_DEST', 
    'RECEIVED_AT_DEST_HUB',
    'READY_FOR_PICKUP', 
    'READY_FOR_DELIVERY',
    'OUT_FOR_DELIVERY',
    'DELIVERED', 
    'COMPLETED',
    'CANCELLED', 
    'REJECTED_PROHIBITED', 
    'DISPUTED'
) DEFAULT 'PENDING_DROPOFF';

-- Add preferred delivery window and customer departure selections without breaking existing rows
ALTER TABLE shipments 
ADD COLUMN IF NOT EXISTS preferred_delivery_window_id VARCHAR(50) NULL AFTER payment_local_amount,
ADD COLUMN IF NOT EXISTS preferred_dispatch_option_id VARCHAR(50) NULL AFTER preferred_delivery_window_id,
ADD COLUMN IF NOT EXISTS preferred_departure_date VARCHAR(20) NULL AFTER preferred_dispatch_option_id,
ADD COLUMN IF NOT EXISTS service_type ENUM('SEND_PARCEL', 'INTERNATIONAL_BUY', 'SPECIFIC_COUNTRY_BUY') DEFAULT 'SEND_PARCEL' AFTER tracking_number;

-- -------------------------------------------------------------------------
-- 8. TRIPS ADDITIVE ENHANCEMENTS & CANONICAL STATUS ALIGNMENT
-- -------------------------------------------------------------------------
ALTER TABLE trips 
MODIFY COLUMN status ENUM(
    'SUBMITTED', 
    'NEEDS_UPDATE',
    'VERIFIED', 
    'CONFIRMED',
    'PACKAGES_LINKED',
    'ESCROW_LOCKED', 
    'ESCROW_PAID',
    'DISPATCHED', 
    'IN_TRANSIT',
    'IN_FLIGHT', 
    'ARRIVED', 
    'COMPLETED', 
    'CANCELLED', 
    'DELAYED',
    'REJECTED',
    'EMERGENCY_UNASSIGNED'
) DEFAULT 'SUBMITTED';

ALTER TABLE trips
ADD COLUMN IF NOT EXISTS manifest_id VARCHAR(36) NULL AFTER ticket_doc_url,
ADD COLUMN IF NOT EXISTS update_request_notes TEXT NULL AFTER emergency_reason,
ADD COLUMN IF NOT EXISTS verified_by_employee_id VARCHAR(36) NULL AFTER update_request_notes,
ADD COLUMN IF NOT EXISTS verified_at DATETIME NULL AFTER verified_by_employee_id;

-- -------------------------------------------------------------------------
-- 9. MANIFESTS ADDITIVE ENHANCEMENTS & CANONICAL STATUS ALIGNMENT
-- -------------------------------------------------------------------------
ALTER TABLE manifests 
MODIFY COLUMN status ENUM(
    'DRAFT', 
    'READY',
    'PREPARING',
    'HANDED_OVER', 
    'IN_TRANSIT',
    'IN_FLIGHT', 
    'ARRIVED', 
    'DELIVERED_TO_DEST_HUB',
    'CLOSED',
    'DISCREPANCY',
    'DISCREPANCY_FLAGGED',
    'CANCELLED'
) DEFAULT 'DRAFT';

-- Junction table for normalized Manifest <-> Shipments Many-to-Many
CREATE TABLE IF NOT EXISTS manifest_items (
    manifest_id VARCHAR(36) NOT NULL,
    shipment_id VARCHAR(36) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (manifest_id, shipment_id),
    FOREIGN KEY (manifest_id) REFERENCES manifests(id) ON DELETE CASCADE,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
