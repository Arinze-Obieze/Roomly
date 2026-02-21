-- Add preferred property types to user_lifestyles table
ALTER TABLE public.user_lifestyles ADD COLUMN IF NOT EXISTS preferred_property_types text[] DEFAULT ARRAY['apartment'];

-- Create index for filtering by property type preferences
CREATE INDEX IF NOT EXISTS user_lifestyles_property_types_idx ON public.user_lifestyles USING GIN (preferred_property_types);
