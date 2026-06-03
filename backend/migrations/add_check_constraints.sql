-- ============================================================
-- CHECK Constraints & Score Validations
-- MariaDB 10.4+ enforces CHECK constraints (MDEV-10872)
-- Run once: mysql -u root findhome_db < add_check_constraints.sql
-- ============================================================

-- properties.price must be positive
ALTER TABLE properties
  ADD CONSTRAINT chk_price_positive CHECK (price >= 0);

-- properties.rooms / bathrooms / area must be non-negative when provided
ALTER TABLE properties
  ADD CONSTRAINT chk_rooms_positive      CHECK (rooms      IS NULL OR rooms      >= 0),
  ADD CONSTRAINT chk_bathrooms_positive  CHECK (bathrooms  IS NULL OR bathrooms  >= 0),
  ADD CONSTRAINT chk_area_positive       CHECK (area       IS NULL OR area       >= 0);

-- agent commission must be between 0 and 100 %
ALTER TABLE agents
  ADD CONSTRAINT chk_commission CHECK (
    commission_percentage IS NULL OR
    (commission_percentage >= 0 AND commission_percentage <= 100)
  );

-- neighborhood scores must be 0–10
ALTER TABLE neighborhoods
  ADD CONSTRAINT chk_safety_score     CHECK (safety_score     IS NULL OR (safety_score     BETWEEN 0 AND 10)),
  ADD CONSTRAINT chk_schools_score    CHECK (schools_score    IS NULL OR (schools_score    BETWEEN 0 AND 10)),
  ADD CONSTRAINT chk_transport_score  CHECK (transport_score  IS NULL OR (transport_score  BETWEEN 0 AND 10)),
  ADD CONSTRAINT chk_walk_score       CHECK (walk_score       IS NULL OR (walk_score       BETWEEN 0 AND 10));

-- reviews / ratings must be 1–5
ALTER TABLE reviews
  ADD CONSTRAINT chk_review_rating CHECK (
    vleresimi IS NULL OR (vleresimi BETWEEN 1 AND 5)
  );

-- agent_ratings must be 1–5
ALTER TABLE agent_ratings
  ADD CONSTRAINT chk_agent_rating CHECK (rating BETWEEN 1 AND 5);

-- contact_inquiries status enum-like check
ALTER TABLE contact_inquiries
  ADD CONSTRAINT chk_inquiry_status CHECK (
    status IN ('new', 'read', 'replied', 'closed')
  );

SELECT 'CHECK constraints applied successfully.' AS result;
