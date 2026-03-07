-- Add feature_events table for granular usage tracking

CREATE TABLE IF NOT EXISTS public.feature_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    feature_name TEXT NOT NULL,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_events ENABLE ROW LEVEL SECURITY;

-- Policies
-- Superadmins can read all events
CREATE POLICY "Superadmins can read all feature events"
    ON public.feature_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_superadmin = true
        )
    );

-- Everyone can insert (anonymously or authenticated)
CREATE POLICY "Anyone can insert feature events"
    ON public.feature_events
    FOR INSERT
    WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feature_events_feature_name ON public.feature_events(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_events_created_at ON public.feature_events(created_at);
CREATE INDEX IF NOT EXISTS idx_feature_events_user_id ON public.feature_events(user_id);
