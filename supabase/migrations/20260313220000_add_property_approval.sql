-- Add approval_status column to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending';

-- Update all existing properties to 'approved' so they don't suddenly disappear from the platform
UPDATE public.properties 
SET approval_status = 'approved' 
WHERE approval_status = 'pending';

-- Create an index to optimise the public feed queries
CREATE INDEX IF NOT EXISTS idx_properties_approval_status ON public.properties(approval_status);
