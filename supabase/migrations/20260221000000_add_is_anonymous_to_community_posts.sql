-- Add is_anonymous column to community_posts table
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false;

-- Create index for filtering by anonymous status
CREATE INDEX IF NOT EXISTS community_posts_is_anonymous_idx ON public.community_posts(is_anonymous);
