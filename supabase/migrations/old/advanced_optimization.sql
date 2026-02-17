-- Advanced Optimization: Trigram Indexes and Composite Sorting
-- Run this in Supabase SQL Editor

-- 1. Enable Trigram Extension for fast text search (ILIKE %query%)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Add Trigram Indexes for Location Search
CREATE INDEX IF NOT EXISTS trgm_idx_properties_city ON public.properties USING gin (city gin_trgm_ops);
CREATE INDEX IF NOT EXISTS trgm_idx_properties_state ON public.properties USING gin (state gin_trgm_ops);
CREATE INDEX IF NOT EXISTS trgm_idx_properties_street ON public.properties USING gin (street gin_trgm_ops);

-- 3. Add Composite Indexes for Sorting + Filtering
-- These enable the DB to "fetch 12 already sorted rows" instead of "fetch all matches, then sort"

-- For default view (All Active, Sorted by Date)
CREATE INDEX IF NOT EXISTS idx_properties_active_created ON public.properties(is_active, created_at DESC);

-- For filtered views (Active + Type + Date)
CREATE INDEX IF NOT EXISTS idx_properties_type_created ON public.properties(property_type, is_active, created_at DESC);

-- For filtered views (Active + Bedrooms + Date)
CREATE INDEX IF NOT EXISTS idx_properties_bedrooms_created ON public.properties(bedrooms, is_active, created_at DESC);

-- For filtered views (Active + Price + Date)
CREATE INDEX IF NOT EXISTS idx_properties_price_created ON public.properties(price_per_month, is_active, created_at DESC);

-- For filtered views (Active + Location + Date) - Composite might help, but Trigram is main hero there.
