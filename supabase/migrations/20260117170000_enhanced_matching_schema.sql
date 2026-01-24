-- 1. Updates to match_preferences
ALTER TABLE "public"."match_preferences" 
ADD COLUMN IF NOT EXISTS "move_in_window" text, -- 'immediately', '1-month', '2-months', 'flexible'
ADD COLUMN IF NOT EXISTS "occupation_preference" text[]; -- ['Professional', 'Student', etc]

-- 2. Updates to user_lifestyles
ALTER TABLE "public"."user_lifestyles" 
ADD COLUMN IF NOT EXISTS "occupation" text; -- 'Professional', 'Student', etc

COMMENT ON COLUMN "public"."match_preferences"."location_areas" IS 'Array of target cities/locations';

-- 3. The Matching Function
-- This function calculates the match score for a given seeker (user) against all active properties.
-- It returns a table of property_id and match_score.

CREATE OR REPLACE FUNCTION get_property_matches(seeker_id UUID)
RETURNS TABLE (
    property_id UUID,
    match_score NUMERIC,
    details JSONB
) LANGUAGE plpgsql STABLE security definer AS $$
DECLARE
    seeker_prefs record;
    seeker_lifestyle record;
BEGIN
    -- Fetch Seeker's Preferences and Lifestyle
    SELECT * INTO seeker_prefs FROM match_preferences WHERE user_id = seeker_id;
    SELECT * INTO seeker_lifestyle FROM user_lifestyles WHERE user_id = seeker_id;

    -- If no preferences found, return all properties with 0 score (or handle gracefully)
    IF seeker_prefs IS NULL THEN
        RETURN QUERY SELECT id, 0::numeric, '{}'::jsonb FROM properties WHERE is_active = true;
        RETURN;
    END IF;

    RETURN QUERY
    WITH scored_properties AS (
        SELECT 
            p.id,
            p.created_at,
            -- Join with Host's info
            h_life.user_id as host_id,
            
            -- 1. HARD CONSTRAINTS (Result in 0 score if failed)
            -- Budget Check
            CASE 
                WHEN seeker_prefs.budget_max IS NOT NULL AND p.price_per_month > (seeker_prefs.budget_max * 1.1) THEN 0
                ELSE 1
            END as budget_pass,
            
            -- Location Check (If user has locations, property city must match one of them)
            CASE 
                WHEN seeker_prefs.location_areas IS NOT NULL AND array_length(seeker_prefs.location_areas, 1) > 0 THEN
                    CASE WHEN p.city = ANY(seeker_prefs.location_areas) THEN 1 ELSE 0 END
                ELSE 1
            END as location_pass,

            -- Move-in Check (Simplified logic for now)
            -- 'immediately' = < 7 days, '1-month' = < 30 days, etc.
            -- Using a simple check: if property available date is way in future compared to expectation
            CASE 
                WHEN seeker_prefs.move_in_window = 'immediately' AND p.available_from > (CURRENT_DATE + INTERVAL '14 days') THEN 0.5 -- Penalty
                WHEN seeker_prefs.move_in_window = '1-month' AND p.available_from > (CURRENT_DATE + INTERVAL '45 days') THEN 0.5
                ELSE 1
            END as move_in_score,

            -- 2. PROPERTY SCORE (40% Weight)
            -- Price Score: Closer to min budget is better? Or just below max?
            -- Let's say: if price is within budget, full points.
            100 as property_component_score,

            -- 3. LIFESTYLE COMPATIBILITY (30% Weight - Seeker Satisfaction)
            -- Compare Seeker Prefs vs Host Lifestyle
            (
                -- Smoking
                (CASE 
                    WHEN 'no' = ANY(seeker_prefs.accepted_smoking) AND h_life.smoking_status = 'no' THEN 100
                    WHEN 'outside' = ANY(seeker_prefs.accepted_smoking) AND h_life.smoking_status = 'outside' THEN 100
                    WHEN 'inside' = ANY(seeker_prefs.accepted_smoking) THEN 100
                    WHEN h_life.smoking_status = 'no' THEN 100 -- Always good if host doesn't smoke
                    ELSE 0
                END) * 0.25 + 
                
                -- Pets match
                (CASE 
                    WHEN seeker_prefs.accepted_pets = false AND (h_life.pets->>'has_pets')::boolean = true THEN 0
                    ELSE 100
                END) * 0.25 +

                -- Cleanliness (Close match is better)
                (100 - ABS(COALESCE(seeker_lifestyle.cleanliness_level, 3) - COALESCE(h_life.cleanliness_level, 3)) * 25) * 0.25 +

                -- Social (Close match is better)
                (100 - ABS(COALESCE(seeker_lifestyle.social_level, 3) - COALESCE(h_life.social_level, 3)) * 25) * 0.25

            )::numeric as seeker_satisfaction_score,

            -- 4. HOST SATISFACTION (30% Weight - Reciprocal)
            -- Compare Host Prefs vs Seeker Lifestyle
            (
                -- Occupation Match
                (CASE 
                    WHEN h_prefs.occupation_preference IS NOT NULL AND array_length(h_prefs.occupation_preference, 1) > 0 THEN
                        CASE WHEN seeker_lifestyle.occupation = ANY(h_prefs.occupation_preference) THEN 100 ELSE 0 END
                    ELSE 100 -- No preference
                END) * 0.5 +

                -- Gender Match (If host specifies)
                (CASE
                   WHEN h_prefs.gender_preference IS NOT NULL AND h_prefs.gender_preference != 'any' THEN
                      -- Assuming we have gender in users table or lifestyle, sadly not in user_lifestyles yet properly. 
                      -- Skipping for now to avoid error, defaulting to 100
                      100
                   ELSE 100
                END) * 0.5
            )::numeric as host_satisfaction_score

        FROM properties p
        LEFT JOIN user_lifestyles h_life ON p.listed_by_user_id = h_life.user_id
        LEFT JOIN match_preferences h_prefs ON p.listed_by_user_id = h_prefs.user_id
        WHERE p.is_active = true
          AND p.listed_by_user_id != seeker_id -- Don't show own properties
    )
    SELECT 
        id,
        (
            (CASE WHEN budget_pass = 0 OR location_pass = 0 THEN 0 ELSE 1 END) *
            (
                (property_component_score * move_in_score * 0.4) + 
                (seeker_satisfaction_score * 0.3) + 
                (host_satisfaction_score * 0.3)
            )
        )::numeric as match_score,
        jsonb_build_object(
            'budget_pass', budget_pass,
            'location_pass', location_pass,
            'seeker_sat', seeker_satisfaction_score,
            'host_sat', host_satisfaction_score
        ) as details
    FROM scored_properties
    ORDER BY match_score DESC;
END;
$$;
