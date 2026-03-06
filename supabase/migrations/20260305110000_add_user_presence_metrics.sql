-- Add last_seen and average_response_time tracking to users table

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS average_response_time_ms BIGINT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS response_count INTEGER DEFAULT 0;

-- Create function to track average response time on message replies
CREATE OR REPLACE FUNCTION update_average_response_time()
RETURNS TRIGGER AS $$
DECLARE
    v_first_msg_sender UUID;
    v_first_msg_time TIMESTAMP WITH TIME ZONE;
    v_user_response_count INTEGER;
    v_time_diff_ms BIGINT;
    v_current_avg BIGINT;
    v_current_count INTEGER;
BEGIN
    -- 1. Get the first message of this conversation
    SELECT sender_id, created_at
    INTO v_first_msg_sender, v_first_msg_time
    FROM public.messages
    WHERE conversation_id = NEW.conversation_id
    ORDER BY created_at ASC
    LIMIT 1;

    -- If this is the very first message in the conversation, v_first_msg_sender will be NEW.sender_id
    -- We only want to track replies, so if v_first_msg_sender = NEW.sender_id, we do nothing.
    IF v_first_msg_sender IS NULL OR v_first_msg_sender = NEW.sender_id THEN
        RETURN NEW;
    END IF;

    -- 2. Check if this is the FIRST reply by this sender in this conversation
    -- We count messages by this sender in this conversation that were created BEFORE this new message
    SELECT count(*)
    INTO v_user_response_count
    FROM public.messages
    WHERE conversation_id = NEW.conversation_id
      AND sender_id = NEW.sender_id
      AND id != NEW.id; -- EXCLUDE the current message

    IF v_user_response_count > 0 THEN
        -- The user has answered before in this thread
        RETURN NEW;
    END IF;

    -- 3. Calculate time difference in milliseconds
    v_time_diff_ms := EXTRACT(EPOCH FROM (COALESCE(NEW.created_at, now()) - v_first_msg_time)) * 1000;

    -- 4. Update the user's average
    SELECT average_response_time_ms, response_count
    INTO v_current_avg, v_current_count
    FROM public.users
    WHERE id = NEW.sender_id;

    IF v_current_avg IS NULL THEN
        v_current_avg := v_time_diff_ms;
        v_current_count := 1;
    ELSE
        -- Moving average formula
        v_current_avg := ((v_current_avg * v_current_count) + v_time_diff_ms) / (v_current_count + 1);
        v_current_count := v_current_count + 1;
    END IF;

    UPDATE public.users
    SET average_response_time_ms = v_current_avg,
        response_count = v_current_count
    WHERE id = NEW.sender_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_message_reply_update_average_response_time ON public.messages;

-- Create the trigger
CREATE TRIGGER on_message_reply_update_average_response_time
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_average_response_time();

-- Create RPC function to update last_seen (used by heartbeat)
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS void AS $$
BEGIN
    UPDATE public.users
    SET last_seen = timezone('utc'::text, now())
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
