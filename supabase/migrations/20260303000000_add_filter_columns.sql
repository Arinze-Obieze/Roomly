-- Add filter-related columns to properties table for advanced search filters

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS room_type TEXT CHECK (room_type IN ('single', 'double', 'ensuite')),
  ADD COLUMN IF NOT EXISTS bills_included BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS house_rules TEXT[] DEFAULT '{}';

-- Add an index on bills_included for fast filtering
CREATE INDEX IF NOT EXISTS idx_properties_bills_included ON properties(bills_included);

-- Add indexes for room_type
CREATE INDEX IF NOT EXISTS idx_properties_room_type ON properties(room_type);

-- Add a GIN index on house_rules array for fast containment queries
CREATE INDEX IF NOT EXISTS idx_properties_house_rules ON properties USING GIN(house_rules);

COMMENT ON COLUMN properties.room_type IS 'Type of room offered: single, double, or ensuite';
COMMENT ON COLUMN properties.bills_included IS 'Whether bills are included in the monthly rent';
COMMENT ON COLUMN properties.house_rules IS 'Array of house rules: no_smoking, pets_allowed, couples_welcome, students_welcome';
