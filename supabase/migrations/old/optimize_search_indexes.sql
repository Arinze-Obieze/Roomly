-- Optimization: Add indexes for frequently filtered columns
-- This should significantly improve filtering performance

CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties USING btree (city);
CREATE INDEX IF NOT EXISTS idx_properties_state ON public.properties USING btree (state);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties USING btree (price_per_month);
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms ON public.properties USING btree (bedrooms);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON public.properties USING btree (property_type);

-- Composite index for location search (city/state)
CREATE INDEX IF NOT EXISTS idx_properties_location_composite ON public.properties(city, state);
