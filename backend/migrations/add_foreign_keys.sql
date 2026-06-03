-- ============================================================
-- Migration: Add Foreign Key Constraints
-- Run once on findhome_db to enforce referential integrity.
-- Each block drops the FK first (idempotent) then re-adds it.
-- ============================================================

USE findhome_db;

-- ── agents.user_id → users.id ─────────────────────────────────────────────
ALTER TABLE agents
  DROP FOREIGN KEY IF EXISTS fk_agents_user,
  ADD CONSTRAINT fk_agents_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ── properties.agent_id → agents.id ──────────────────────────────────────
ALTER TABLE properties
  DROP FOREIGN KEY IF EXISTS fk_properties_agent,
  ADD CONSTRAINT fk_properties_agent
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL;

-- ── properties.neighborhood_id → neighborhoods.id ────────────────────────
ALTER TABLE properties
  DROP FOREIGN KEY IF EXISTS fk_properties_neighborhood,
  ADD CONSTRAINT fk_properties_neighborhood
    FOREIGN KEY (neighborhood_id) REFERENCES neighborhoods(id) ON DELETE SET NULL;

-- ── propertyimages.property_id → properties.id ───────────────────────────
ALTER TABLE propertyimages
  DROP FOREIGN KEY IF EXISTS fk_images_property,
  ADD CONSTRAINT fk_images_property
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

-- ── visits.property_id → properties.id ───────────────────────────────────
ALTER TABLE visits
  DROP FOREIGN KEY IF EXISTS fk_visits_property,
  ADD CONSTRAINT fk_visits_property
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

-- ── visits.user_id → users.id ─────────────────────────────────────────────
ALTER TABLE visits
  DROP FOREIGN KEY IF EXISTS fk_visits_user,
  ADD CONSTRAINT fk_visits_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- ── visits.agent_id → agents.id ──────────────────────────────────────────
ALTER TABLE visits
  DROP FOREIGN KEY IF EXISTS fk_visits_agent,
  ADD CONSTRAINT fk_visits_agent
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL;

-- ── favorites.property_id → properties.id ────────────────────────────────
ALTER TABLE favorites
  DROP FOREIGN KEY IF EXISTS fk_favorites_property,
  ADD CONSTRAINT fk_favorites_property
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

-- ── contracts.user_id → users.id ─────────────────────────────────────────
ALTER TABLE contracts
  DROP FOREIGN KEY IF EXISTS fk_contracts_user,
  ADD CONSTRAINT fk_contracts_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ── contracts.property_id → properties.id ────────────────────────────────
ALTER TABLE contracts
  DROP FOREIGN KEY IF EXISTS fk_contracts_property,
  ADD CONSTRAINT fk_contracts_property
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

-- ── contracts.agent_id → agents.id ───────────────────────────────────────
ALTER TABLE contracts
  DROP FOREIGN KEY IF EXISTS fk_contracts_agent,
  ADD CONSTRAINT fk_contracts_agent
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL;

-- ── transactions.contract_id → contracts.id ──────────────────────────────
ALTER TABLE transactions
  DROP FOREIGN KEY IF EXISTS fk_transactions_contract,
  ADD CONSTRAINT fk_transactions_contract
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE;

-- ── notifications.user_id → users.id ─────────────────────────────────────
ALTER TABLE notifications
  DROP FOREIGN KEY IF EXISTS fk_notifications_user,
  ADD CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ── certifications.agent_id → agents.id ──────────────────────────────────
ALTER TABLE certifications
  DROP FOREIGN KEY IF EXISTS fk_certifications_agent,
  ADD CONSTRAINT fk_certifications_agent
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- ── tickets.user_id → users.id ───────────────────────────────────────────
ALTER TABLE tickets
  DROP FOREIGN KEY IF EXISTS fk_tickets_user,
  ADD CONSTRAINT fk_tickets_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ── maintenance_requests.user_id → users.id ──────────────────────────────
ALTER TABLE maintenance_requests
  DROP FOREIGN KEY IF EXISTS fk_maintenance_user,
  ADD CONSTRAINT fk_maintenance_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- ── maintenance_requests.property_id → properties.id ─────────────────────
ALTER TABLE maintenance_requests
  DROP FOREIGN KEY IF EXISTS fk_maintenance_property,
  ADD CONSTRAINT fk_maintenance_property
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL;

-- ── property_reviews.user_id → users.id ──────────────────────────────────
ALTER TABLE property_reviews
  DROP FOREIGN KEY IF EXISTS fk_prop_reviews_user,
  ADD CONSTRAINT fk_prop_reviews_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ── property_reviews.property_id → properties.id ─────────────────────────
ALTER TABLE property_reviews
  DROP FOREIGN KEY IF EXISTS fk_prop_reviews_property,
  ADD CONSTRAINT fk_prop_reviews_property
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;

-- ── Indexes on frequently-joined FK columns ───────────────────────────────
ALTER TABLE properties      ADD INDEX IF NOT EXISTS idx_prop_agent     (agent_id);
ALTER TABLE visits          ADD INDEX IF NOT EXISTS idx_visits_user    (user_id);
ALTER TABLE visits          ADD INDEX IF NOT EXISTS idx_visits_prop    (property_id);
ALTER TABLE contracts       ADD INDEX IF NOT EXISTS idx_contracts_user (user_id);
ALTER TABLE contracts       ADD INDEX IF NOT EXISTS idx_contracts_prop (property_id);
ALTER TABLE transactions    ADD INDEX IF NOT EXISTS idx_tx_contract    (contract_id);
ALTER TABLE notifications   ADD INDEX IF NOT EXISTS idx_notif_user     (user_id);
ALTER TABLE certifications  ADD INDEX IF NOT EXISTS idx_cert_agent     (agent_id);
ALTER TABLE favorites       ADD INDEX IF NOT EXISTS idx_fav_prop       (property_id);

SELECT 'Foreign key migration completed successfully.' AS result;
