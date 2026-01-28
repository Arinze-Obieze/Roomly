-- Create buddy_groups table
CREATE TABLE IF NOT EXISTS public.buddy_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    preferences JSONB DEFAULT '{}'::jsonb
);

-- Create buddy_group_members table
CREATE TABLE IF NOT EXISTS public.buddy_group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.buddy_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    status TEXT NOT NULL CHECK (status IN ('active', 'left')) DEFAULT 'active',
    UNIQUE(group_id, user_id)
);

-- Create buddy_invites table
CREATE TABLE IF NOT EXISTS public.buddy_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.buddy_groups(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create buddy_messages table
CREATE TABLE IF NOT EXISTS public.buddy_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.buddy_groups(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT,
    attachment_type TEXT CHECK (attachment_type IN ('property', 'image', 'text')) DEFAULT 'text',
    attachment_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.buddy_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_messages ENABLE ROW LEVEL SECURITY;

-- Policies for buddy_groups
CREATE POLICY "Groups visible to members" ON public.buddy_groups
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.buddy_group_members 
            WHERE group_id = id AND status = 'active'
        )
    );

CREATE POLICY "Admin can update group" ON public.buddy_groups
    FOR UPDATE USING (auth.uid() = admin_id);

CREATE POLICY "Users can create groups" ON public.buddy_groups
    FOR INSERT WITH CHECK (auth.uid() = admin_id);

-- Policies for buddy_group_members
CREATE POLICY "Members visible to group" ON public.buddy_group_members
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM public.buddy_group_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Admins can add members (join)" ON public.buddy_group_members
    FOR INSERT WITH CHECK (
        -- Either user adding themselves (join) or admin adding (if we support that)
        -- For now, usually invites handle this, effectively insertion is done by the user joining or system.
        -- Let's allow authenticated users to insert themselves if they have a token valid (API side check often, but for RLS:)
        auth.uid() = user_id
    );

CREATE POLICY "Members can leave (update status)" ON public.buddy_group_members
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies for buddy_invites
CREATE POLICY "Group members can view invites" ON public.buddy_invites
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM public.buddy_group_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Admins can create invites" ON public.buddy_invites
    FOR INSERT WITH CHECK (
        group_id IN (
            SELECT id FROM public.buddy_groups WHERE admin_id = auth.uid()
        )
    );

-- Policies for buddy_messages
CREATE POLICY "Group members can view messages" ON public.buddy_messages
    FOR SELECT USING (
        group_id IN (
            SELECT group_id FROM public.buddy_group_members 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Group members can insert messages" ON public.buddy_messages
    FOR INSERT WITH CHECK (
        group_id IN (
            SELECT group_id FROM public.buddy_group_members 
            WHERE user_id = auth.uid() AND status = 'active'
        ) AND auth.uid() = sender_id
    );

-- Indexes for performance
CREATE INDEX idx_buddy_group_members_user ON public.buddy_group_members(user_id);
CREATE INDEX idx_buddy_group_members_group ON public.buddy_group_members(group_id);
CREATE INDEX idx_buddy_messages_group ON public.buddy_messages(group_id);
CREATE INDEX idx_buddy_invites_token ON public.buddy_invites(token);
