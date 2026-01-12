-- Create Community Forum Tables

-- 1. POSTS TABLE
CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  city text NOT NULL,
  category text NOT NULL, -- 'scam_alert', 'event', 'tip', 'general', 'news'
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  upvotes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for filtering
CREATE INDEX IF NOT EXISTS community_posts_city_idx ON public.community_posts(city);
CREATE INDEX IF NOT EXISTS community_posts_category_idx ON public.community_posts(category);

-- 2. VOTES TABLE
CREATE TABLE IF NOT EXISTS public.community_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  vote_type integer NOT NULL CHECK (vote_type IN (1, -1)), -- 1 for upvote
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- 3. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.community_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS POLICIES

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

-- Posts: Everyone can view, authenticated can create, owner can update/delete
CREATE POLICY "Public can view posts" ON public.community_posts 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can create posts" ON public.community_posts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.community_posts 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON public.community_posts 
  FOR DELETE USING (auth.uid() = user_id);

-- Votes: Everyone can view, authenticated can vote, owner can delete own vote
CREATE POLICY "Public can view votes" ON public.community_votes 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can vote" ON public.community_votes 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vote" ON public.community_votes 
  FOR DELETE USING (auth.uid() = user_id);

-- Comments: Everyone can view, authenticated can comment
CREATE POLICY "Public can view comments" ON public.community_comments 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can comment" ON public.community_comments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.community_comments 
  FOR DELETE USING (auth.uid() = user_id);

-- Helper function to increment counters (optional but recommended for atomicity)
-- For now, we'll handle counts via API/Select or Triggers. 
-- Let's stick to standard RLS and handle counts in application layer or basic triggers if needed.

-- Grant access
GRANT ALL ON TABLE public.community_posts TO authenticated;
GRANT ALL ON TABLE public.community_posts TO anon;
GRANT ALL ON TABLE public.community_votes TO authenticated;
GRANT ALL ON TABLE public.community_votes TO anon;
GRANT ALL ON TABLE public.community_comments TO authenticated;
GRANT ALL ON TABLE public.community_comments TO anon;
