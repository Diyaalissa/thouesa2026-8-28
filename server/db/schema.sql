-- =========================================================================
-- THOUESA (ثويسا) - Cross-Border P2P Logistics & Escrow Platform
-- Database Schema for MariaDB / MySQL InnoDB (cPanel Compatible)
-- Fresh Install Baseline - Canonical Domain Schema
-- =========================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 0. Cleanup for Clean Installation
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS financial_transactions;
DROP TABLE IF EXISTS settlements;
DROP TABLE IF EXISTS operational_incidents;
DROP TABLE IF EXISTS disputes;
DROP TABLE IF EXISTS public_announcements;
DROP TABLE IF EXISTS daily_exchange_rates;
DROP TABLE IF EXISTS shipping_rate_tiers;
DROP TABLE IF EXISTS shipping_rates;
DROP TABLE IF EXISTS escrow_wallets;
DROP TABLE IF EXISTS manifest_items;
DROP TABLE IF EXISTS manifests;
DROP TABLE IF EXISTS shipments;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS hubs;
DROP TABLE IF EXISTS users;

-- -------------------------------------------------------------------------
-- 1. Users & Roles
-- -------------------------------------------------------------------------
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(191) UNIQUE NOT NULL,
    phone VARCHAR(30) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('SENDER', 'TRAVELER', 'HUB_AGENT', 'HUB_MANAGER', 'HUB_INSPECTOR', 'PRICING_MANAGER', 'FINANCIAL_OFFICER', 'MASTER_ADMIN') DEFAULT 'SENDER',
    kyc_status ENUM('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'UNVERIFIED',
    is_active BOOLEAN DEFAULT TRUE,
    preferred_locale ENUM('ar', 'en') DEFAULT 'ar',
    avatar_url VARCHAR(255),
    passport_number VARCHAR(50),
    national_id VARCHAR(50),
    rating DECIMAL(3, 2) DEFAULT 5.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_kyc (kyc_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 2. Country Hubs (Dynamic multi-country without hardcoded whitelist)
-- -------------------------------------------------------------------------
CREATE TABLE hubs (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL, -- e.g., AMM-01, ALG-01, CAI-01, RUH-01
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    country_code VARCHAR(3) NOT NULL, -- ISO Alpha-2/3 compatible: JOR/JO, DZA/DZ, EGY/EG, SAU/SA, FRA/FR
    country_name_ar VARCHAR(100) NOT NULL,
    country_name_en VARCHAR(100) NOT NULL,
    city_ar VARCHAR(100) NOT NULL,
    city_en VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    storage_capacity_kg DECIMAL(10, 2) DEFAULT 1000.00,
    current_used_kg DECIMAL(10, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 3. Traveler Trips
-- -------------------------------------------------------------------------
CREATE TABLE trips (
    id VARCHAR(36) PRIMARY KEY,
    traveler_id VARCHAR(36) NOT NULL,
    origin_hub_id VARCHAR(36) NOT NULL,
    destination_hub_id VARCHAR(36) NOT NULL,
    airline VARCHAR(100) NOT NULL,
    flight_number VARCHAR(20) NOT NULL,
    pnr_code VARCHAR(20) NOT NULL,
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    available_weight_kg DECIMAL(6, 2) NOT NULL,
    allocated_weight_kg DECIMAL(6, 2) DEFAULT 0.00,
    price_per_kg_earned DECIMAL(10, 2) NOT NULL,
    total_earnings_estimated DECIMAL(10, 2) DEFAULT 0.00,
    required_escrow_deposit DECIMAL(10, 2) DEFAULT 0.00,
    is_escrow_paid BOOLEAN DEFAULT FALSE,
    status ENUM(
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
    ) DEFAULT 'SUBMITTED',
    ticket_doc_url VARCHAR(255),
    manifest_id VARCHAR(36),
    emergency_reason TEXT,
    update_request_notes TEXT,
    verified_by_employee_id VARCHAR(36),
    verified_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (traveler_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (origin_hub_id) REFERENCES hubs(id) ON DELETE RESTRICT,
    FOREIGN KEY (destination_hub_id) REFERENCES hubs(id) ON DELETE RESTRICT,
    INDEX idx_trip_status (status),
    INDEX idx_trip_route (origin_hub_id, destination_hub_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 4. Shipments
-- -------------------------------------------------------------------------
CREATE TABLE shipments (
    id VARCHAR(36) PRIMARY KEY,
    tracking_number VARCHAR(35) UNIQUE NOT NULL, -- e.g. TH-JOR-ALG-202608-8841
    service_type ENUM('SEND_PARCEL', 'INTERNATIONAL_BUY', 'SPECIFIC_COUNTRY_BUY') DEFAULT 'SEND_PARCEL',
    sender_id VARCHAR(36) NOT NULL,
    origin_hub_id VARCHAR(36) NOT NULL,
    destination_hub_id VARCHAR(36) NOT NULL,
    recipient_name VARCHAR(150) NOT NULL,
    recipient_phone VARCHAR(30) NOT NULL,
    recipient_address TEXT NOT NULL,
    recipient_national_id VARCHAR(50),
    item_category VARCHAR(50) NOT NULL,
    item_description TEXT NOT NULL,
    item_photos JSON,
    inspection_photos JSON,
    declared_value DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    estimated_weight_kg DECIMAL(6, 2) NOT NULL,
    actual_weight_kg DECIMAL(6, 2),
    length_cm DECIMAL(6, 2) DEFAULT 20.00,
    width_cm DECIMAL(6, 2) DEFAULT 20.00,
    height_cm DECIMAL(6, 2) DEFAULT 20.00,
    security_seal_id VARCHAR(50), -- e.g. SEAL-AMM-98231
    shipping_cost DECIMAL(10, 2) NOT NULL,
    insurance_fee DECIMAL(10, 2) DEFAULT 0.00,
    customs_duty_estimated DECIMAL(10, 2) DEFAULT 0.00,
    escrow_deposit_required DECIMAL(10, 2) NOT NULL,
    current_status ENUM(
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
    ) DEFAULT 'PENDING_DROPOFF',
    sender_legal_waiver_signed BOOLEAN DEFAULT FALSE,
    sender_legal_waiver_timestamp DATETIME,
    payment_method VARCHAR(30) DEFAULT 'WALLET',
    payment_local_amount DECIMAL(12, 2) DEFAULT 0.00,
    preferred_delivery_window_id VARCHAR(50),
    preferred_dispatch_option_id VARCHAR(50),
    preferred_departure_date VARCHAR(20),
    assigned_trip_id VARCHAR(36),
    inspection_notes TEXT,
    inspected_by_agent_id VARCHAR(36),
    inspected_at DATETIME,
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    weight_discrepancy JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (origin_hub_id) REFERENCES hubs(id) ON DELETE RESTRICT,
    FOREIGN KEY (destination_hub_id) REFERENCES hubs(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_trip_id) REFERENCES trips(id) ON DELETE SET NULL,
    INDEX idx_shipment_tracking (tracking_number),
    INDEX idx_shipment_status (current_status),
    INDEX idx_shipment_sender (sender_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 5. Manifest Batches & Junction Table
-- -------------------------------------------------------------------------
CREATE TABLE manifests (
    id VARCHAR(36) PRIMARY KEY,
    manifest_code VARCHAR(30) UNIQUE NOT NULL,
    trip_id VARCHAR(36) NOT NULL,
    traveler_id VARCHAR(36) NOT NULL,
    origin_hub_id VARCHAR(36) NOT NULL,
    destination_hub_id VARCHAR(36) NOT NULL,
    dispatched_by_agent_id VARCHAR(36) NOT NULL,
    received_by_agent_id VARCHAR(36),
    total_packages INT DEFAULT 0,
    total_weight_kg DECIMAL(6, 2) DEFAULT 0.00,
    total_declared_value DECIMAL(12, 2) DEFAULT 0.00,
    handover_qr_secret VARCHAR(255) NOT NULL,
    dispatch_timestamp DATETIME,
    receipt_timestamp DATETIME,
    status ENUM(
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
    ) DEFAULT 'DRAFT',
    tamper_seal_ids JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE RESTRICT,
    FOREIGN KEY (traveler_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (dispatched_by_agent_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (received_by_agent_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE manifest_items (
    manifest_id VARCHAR(36) NOT NULL,
    shipment_id VARCHAR(36) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (manifest_id, shipment_id),
    FOREIGN KEY (manifest_id) REFERENCES manifests(id) ON DELETE CASCADE,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 6. Escrow Wallets
-- -------------------------------------------------------------------------
CREATE TABLE escrow_wallets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    balance DECIMAL(12, 2) DEFAULT 0.00,
    locked_escrow_deposit DECIMAL(12, 2) DEFAULT 0.00,
    pending_earnings DECIMAL(12, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 7. Shipping Rates & Tiers
-- -------------------------------------------------------------------------
CREATE TABLE shipping_rates (
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

CREATE TABLE shipping_rate_tiers (
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
-- 8. Daily Exchange Rates (Multi-Currency, Dual BUY & SELL with Versioning)
-- -------------------------------------------------------------------------
CREATE TABLE daily_exchange_rates (
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
-- 9. Public Announcements
-- -------------------------------------------------------------------------
CREATE TABLE public_announcements (
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
-- 10. Settlements Foundation
-- -------------------------------------------------------------------------
CREATE TABLE settlements (
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
-- 11. Operational Incidents (Distinct from Disputes)
-- -------------------------------------------------------------------------
CREATE TABLE operational_incidents (
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
-- 12. Disputes & Consumer Claims
-- -------------------------------------------------------------------------
CREATE TABLE disputes (
    id VARCHAR(36) PRIMARY KEY,
    shipment_id VARCHAR(36) NOT NULL,
    tracking_number VARCHAR(35) NOT NULL,
    claimant_id VARCHAR(36) NOT NULL,
    claimant_name VARCHAR(150) NOT NULL,
    respondent_id VARCHAR(36),
    reason ENUM('DAMAGED_ITEM', 'TAMPERED_SEAL', 'FLIGHT_DELAY_EXTREME', 'PROHIBITED_GOODS_DISCOVERED', 'MISSING_PACKAGE') NOT NULL,
    description TEXT NOT NULL,
    evidence_photos JSON,
    claim_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status ENUM('OPEN', 'UNDER_REVIEW', 'RESOLVED_REFUND', 'RESOLVED_ESCROW_RELEASE', 'REJECTED') DEFAULT 'OPEN',
    resolution_notes TEXT,
    resolved_by_admin_id VARCHAR(36),
    resolved_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE RESTRICT,
    FOREIGN KEY (claimant_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 13. Financial Transactions
-- -------------------------------------------------------------------------
CREATE TABLE financial_transactions (
    id VARCHAR(36) PRIMARY KEY,
    transaction_code VARCHAR(50) UNIQUE NOT NULL,
    wallet_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    trip_id VARCHAR(36),
    shipment_id VARCHAR(36),
    type ENUM('SHIPPING_PAYMENT', 'ESCROW_LOCK', 'ESCROW_RELEASE', 'TRAVELER_PAYOUT', 'REFUND', 'HUB_FEE', 'DISPUTE_FORFEIT', 'PRICE_ADJUSTMENT') NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    exchange_rate_to_usd DECIMAL(10, 4) DEFAULT 1.0000,
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    status ENUM('PENDING', 'COMMITTED', 'REVERTED', 'FAILED') DEFAULT 'COMMITTED',
    reference_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES escrow_wallets(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE SET NULL,
    INDEX idx_fin_tx_user (user_id),
    INDEX idx_fin_tx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- 14. Audit Logs
-- -------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_id VARCHAR(36) NOT NULL,
    actor_name VARCHAR(150) NOT NULL,
    actor_role VARCHAR(30) NOT NULL,
    domain VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(36) NOT NULL,
    ip_address VARCHAR(45),
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_domain (domain),
    INDEX idx_audit_actor (actor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
