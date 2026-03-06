-- Add unread count columns to conversations
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS unread_count_tenant INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unread_count_host INTEGER DEFAULT 0;

-- Function to update unread counts
CREATE OR REPLACE FUNCTION public.update_conversation_unread_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Only increment if the message is NOT read (usually new messages)
        IF NEW.is_read = false THEN
            UPDATE public.conversations
            SET 
                unread_count_tenant = CASE WHEN NEW.sender_id = host_id THEN unread_count_tenant + 1 ELSE unread_count_tenant END,
                unread_count_host = CASE WHEN NEW.sender_id = tenant_id THEN unread_count_host + 1 ELSE unread_count_host END
            WHERE id = NEW.conversation_id;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- If is_read changed from false to true, decrement the appropriate count
        IF OLD.is_read = false AND NEW.is_read = true THEN
            UPDATE public.conversations
            SET 
                unread_count_tenant = CASE WHEN NEW.sender_id = host_id THEN GREATEST(0, unread_count_tenant - 1) ELSE unread_count_tenant END,
                unread_count_host = CASE WHEN NEW.sender_id = tenant_id THEN GREATEST(0, unread_count_host - 1) ELSE unread_count_host END
            WHERE id = NEW.conversation_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        -- If an unread message is deleted, decrement
        IF OLD.is_read = false THEN
             UPDATE public.conversations
            SET 
                unread_count_tenant = CASE WHEN OLD.sender_id = host_id THEN GREATEST(0, unread_count_tenant - 1) ELSE unread_count_tenant END,
                unread_count_host = CASE WHEN OLD.sender_id = tenant_id THEN GREATEST(0, unread_count_host - 1) ELSE unread_count_host END
            WHERE id = OLD.conversation_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS tr_update_conversation_unread_count ON public.messages;
CREATE TRIGGER tr_update_conversation_unread_count
AFTER INSERT OR UPDATE OR DELETE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.update_conversation_unread_count();

-- Initialize existing counts
UPDATE public.conversations c
SET 
    unread_count_tenant = (
        SELECT count(*) FROM public.messages m 
        WHERE m.conversation_id = c.id 
        AND m.sender_id = c.host_id 
        AND m.is_read = false
    ),
    unread_count_host = (
        SELECT count(*) FROM public.messages m 
        WHERE m.conversation_id = c.id 
        AND m.sender_id = c.tenant_id 
        AND m.is_read = false
    );
