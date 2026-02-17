-- Optimization for Property Interests
-- Essential for fast lookups in both API and Dashboards

-- 1. Index for checking specific interest (seeker + property) - Used in Single Property API
CREATE INDEX IF NOT EXISTS idx_interests_seeker_property ON public.property_interests(seeker_id, property_id);

-- 2. Index for Landlord Dashboard (finding all interests for a property)
CREATE INDEX IF NOT EXISTS idx_interests_property_id ON public.property_interests(property_id);

-- 3. Index for Seeker Dashboard (finding all my interests)
CREATE INDEX IF NOT EXISTS idx_interests_seeker_id ON public.property_interests(seeker_id);
