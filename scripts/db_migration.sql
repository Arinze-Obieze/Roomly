-- ============================================================
-- Roomly Matching & Privacy System — Database Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. COMPATIBILITY SCORES CACHE TABLE
-- Stores pre-computed scores so feed queries are just a JOIN
CREATE TABLE IF NOT EXISTS compatibility_scores (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seeker_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id    uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  score          int2 NOT NULL CHECK (score >= 0 AND score <= 100),
  computed_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seeker_id, property_id)
);
CREATE INDEX IF NOT EXISTS idx_compat_scores_seeker ON compatibility_scores(seeker_id);
CREATE INDEX IF NOT EXISTS idx_compat_scores_property ON compatibility_scores(property_id);
CREATE INDEX IF NOT EXISTS idx_compat_scores_score ON compatibility_scores(score DESC);

-- RLS: Users can only see their own scores
ALTER TABLE compatibility_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Seekers can view own scores"
  ON compatibility_scores FOR SELECT
  USING (auth.uid() = seeker_id);

-- Service role can INSERT/UPDATE (used by recompute API)
CREATE POLICY "Service role full access on compat scores"
  ON compatibility_scores FOR ALL
  USING (true)
  WITH CHECK (true);


-- 2. ENHANCE PROPERTY_INTERESTS TABLE
-- Add missing columns (use IF NOT EXISTS to be safe)
ALTER TABLE property_interests
  ADD COLUMN IF NOT EXISTS seeker_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS property_id      uuid REFERENCES properties(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS status           text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS compatibility_score  int2,
  ADD COLUMN IF NOT EXISTS message          text,
  ADD COLUMN IF NOT EXISTS created_at       timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at       timestamptz DEFAULT now();

-- Add constraint to prevent duplicate interest records
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_interests_unique
  ON property_interests (seeker_id, property_id);

-- Index for fast landlord dashboard queries
CREATE INDEX IF NOT EXISTS idx_property_interests_property ON property_interests(property_id);
CREATE INDEX IF NOT EXISTS idx_property_interests_seeker   ON property_interests(seeker_id);
CREATE INDEX IF NOT EXISTS idx_property_interests_status   ON property_interests(status);

-- RLS
ALTER TABLE property_interests ENABLE ROW LEVEL SECURITY;

-- Seekers can see their own interests
CREATE POLICY "Seekers see own interests"
  ON property_interests FOR SELECT
  USING (auth.uid() = seeker_id);

-- Seekers can insert their own interests
CREATE POLICY "Seekers can insert interests"
  ON property_interests FOR INSERT
  WITH CHECK (auth.uid() = seeker_id);

-- Landlords can see interests in their properties
CREATE POLICY "Landlords see interests in their properties"
  ON property_interests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_interests.property_id
        AND p.listed_by_user_id = auth.uid()
    )
  );

-- Landlords can update status (accept/reject)
CREATE POLICY "Landlords can update interest status"
  ON property_interests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_interests.property_id
        AND p.listed_by_user_id = auth.uid()
    )
  );


-- 3. PROFILE VISIBILITY ON USERS TABLE
-- Adds a column to control if a seeker profile is public or private
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS profile_visibility text NOT NULL DEFAULT 'public'
  CHECK (profile_visibility IN ('public', 'private'));


-- 4. POSTGRES RPC: get_property_matches
-- Called by the find-people API route to get cached scores for a seeker
-- across all properties of a given landlord
DROP FUNCTION IF EXISTS get_property_matches(uuid);
CREATE OR REPLACE FUNCTION get_property_matches(p_seeker_id uuid)
RETURNS TABLE (
  property_id  uuid,
  match_score  int2
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    cs.property_id,
    cs.score AS match_score
  FROM compatibility_scores cs
  INNER JOIN properties p ON p.id = cs.property_id
  WHERE cs.seeker_id = p_seeker_id
    AND p.is_active = true
  ORDER BY cs.score DESC;
$$;
GRANT EXECUTE ON FUNCTION get_property_matches(uuid) TO authenticated, anon;


-- 5. FUNCTION: Invalidate seeker scores when their profile updates
-- Trigger fires on user_lifestyles and match_preferences changes
CREATE OR REPLACE FUNCTION invalidate_seeker_scores()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM compatibility_scores WHERE seeker_id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invalidate_on_lifestyle_update ON user_lifestyles;
CREATE TRIGGER trg_invalidate_on_lifestyle_update
  AFTER INSERT OR UPDATE ON user_lifestyles
  FOR EACH ROW EXECUTE FUNCTION invalidate_seeker_scores();

DROP TRIGGER IF EXISTS trg_invalidate_on_preferences_update ON match_preferences;
CREATE TRIGGER trg_invalidate_on_preferences_update
  AFTER INSERT OR UPDATE ON match_preferences
  FOR EACH ROW EXECUTE FUNCTION invalidate_seeker_scores();


-- 6. FUNCTION: Invalidate property scores when listing is updated
CREATE OR REPLACE FUNCTION invalidate_property_scores()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM compatibility_scores WHERE property_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invalidate_on_property_update ON properties;
CREATE TRIGGER trg_invalidate_on_property_update
  AFTER INSERT OR UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION invalidate_property_scores();


-- 7. FUNCTION: Create notification when interest is received
CREATE OR REPLACE FUNCTION notify_on_interest()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_landlord_id  uuid;
  v_property_title text;
BEGIN
  -- Get landlord id and property title
  SELECT listed_by_user_id, title
    INTO v_landlord_id, v_property_title
    FROM properties
    WHERE id = NEW.property_id;

  -- Insert a notification for the landlord
  INSERT INTO notifications (user_id, type, content, is_read, created_at)
  VALUES (
    v_landlord_id,
    'new_interest',
    jsonb_build_object(
      'interest_id', NEW.id,
      'property_id', NEW.property_id,
      'seeker_id', NEW.seeker_id,
      'property_title', v_property_title
    ),
    false,
    now()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_interest ON property_interests;
CREATE TRIGGER trg_notify_on_interest
  AFTER INSERT ON property_interests
  FOR EACH ROW EXECUTE FUNCTION notify_on_interest();
