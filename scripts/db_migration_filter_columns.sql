-- ============================================================
-- Supplemental Migration: Filter Columns for Properties
-- Run this in Supabase SQL Editor AFTER the main db_migration.sql
-- ============================================================

-- Adds the three filter columns that were referenced in code
-- but not yet present in the properties table.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS bills_included  boolean GENERATED ALWAYS AS (bills_option = 'all') STORED,
  ADD COLUMN IF NOT EXISTS room_type       text,      -- 'single' | 'double' | 'ensuite' | null
  ADD COLUMN IF NOT EXISTS house_rules     text[];    -- ['no_smoking', 'pets_allowed', 'couples_welcome', 'students_welcome']

-- Index for fast filter queries
CREATE INDEX IF NOT EXISTS idx_properties_room_type    ON properties(room_type);
CREATE INDEX IF NOT EXISTS idx_properties_bills        ON properties(bills_included) WHERE bills_included = true;
CREATE INDEX IF NOT EXISTS idx_properties_house_rules  ON properties USING GIN(house_rules);
