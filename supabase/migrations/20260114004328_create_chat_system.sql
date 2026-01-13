-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    host_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Prevent duplicate conversations for the same property/tenant pair
    UNIQUE(property_id, tenant_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_conversations_tenant ON public.conversations(tenant_id, last_message_at DESC);
CREATE INDEX idx_conversations_host ON public.conversations(host_id, last_message_at DESC);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at ASC);

-- RLS Policies for Conversations

-- Tenant can view their own conversations
CREATE POLICY "Tenants can view their conversations"
    ON public.conversations FOR SELECT
    USING (auth.uid() = tenant_id);

-- Host can view their own conversations
CREATE POLICY "Hosts can view their conversations"
    ON public.conversations FOR SELECT
    USING (auth.uid() = host_id);

-- Tenants can create conversations (only for themselves)
CREATE POLICY "Tenants can insert conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (auth.uid() = tenant_id);

-- Conversations can be updated (last_message) if user is participant
CREATE POLICY "Participants can update conversations"
    ON public.conversations FOR UPDATE
    USING (auth.uid() IN (tenant_id, host_id));

-- RLS Policies for Messages

-- Participants can view messages
CREATE POLICY "Participants can view messages"
    ON public.messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id
            AND (auth.uid() = c.tenant_id OR auth.uid() = c.host_id)
        )
    );

-- Participants can insert messages
CREATE POLICY "Participants can insert messages"
    ON public.messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id 
        AND EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id
            AND (auth.uid() = c.tenant_id OR auth.uid() = c.host_id)
        )
    );

-- Participants can update message (e.g. mark as read)
CREATE POLICY "Participants can update messages"
    ON public.messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id
            AND (auth.uid() = c.tenant_id OR auth.uid() = c.host_id)
        )
    );
