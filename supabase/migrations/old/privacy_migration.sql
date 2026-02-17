-- Add privacy_setting enum type if not exists (or just check constraints)
-- For simplicity, we'll use text with check constraints or just text if flexible

-- 1. Updates to USERS table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS privacy_setting text DEFAULT 'public' CHECK (privacy_setting IN ('public', 'private'));

-- 2. Updates to PROPERTIES table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS privacy_setting text DEFAULT 'public' CHECK (privacy_setting IN ('public', 'private'));

-- 3. Create PROPERTY_INTERESTS table
CREATE TABLE IF NOT EXISTS property_interests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  seeker_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(property_id, seeker_id)
);

-- 4. RLS Policies (Examples - adjust based on actual RLS setup)
-- Enable RLS on interests
ALTER TABLE property_interests ENABLE ROW LEVEL SECURITY;

-- Landlords can see interests for their properties
CREATE POLICY "Landlords can view interests for their properties" ON property_interests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_interests.property_id 
      AND properties.listed_by_user_id = auth.uid()
    )
  );

-- Landlords can update interests for their properties
CREATE POLICY "Landlords can update interests for their properties" ON property_interests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_interests.property_id 
      AND properties.listed_by_user_id = auth.uid()
    )
  );

-- Seekers can see their own interests
CREATE POLICY "Seekers can view their own interests" ON property_interests
  FOR SELECT
  USING (seeker_id = auth.uid());

-- Seekers can create interests
CREATE POLICY "Seekers can create interests" ON property_interests
  FOR INSERT
  WITH CHECK (seeker_id = auth.uid());
