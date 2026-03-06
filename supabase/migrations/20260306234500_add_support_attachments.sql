-- Add attachment columns to support_messages
ALTER TABLE "public"."support_messages" 
ADD COLUMN "attachment_type" text CHECK (attachment_type IN ('image', 'file')),
ADD COLUMN "attachment_data" jsonb;

-- Create support_attachments bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('support_attachments', 'support_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for support_attachments

-- Allow users to upload attachments to their own tickets
CREATE POLICY "Users can upload support attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'support_attachments' 
    AND (
        -- User part of the ticket (id is first part of path: ticket_id/filename)
        EXISTS (
            SELECT 1 FROM public.support_tickets
            WHERE id::text = (storage.foldername(name))[1]
            AND user_id = auth.uid()
        )
        OR
        -- Or user is superadmin
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_superadmin = true
        )
    )
);

-- Allow users to view attachments for their own tickets
CREATE POLICY "Users can view support attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'support_attachments'
    AND (
        EXISTS (
            SELECT 1 FROM public.support_tickets
            WHERE id::text = (storage.foldername(name))[1]
            AND user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_superadmin = true
        )
    )
);

-- Allow deletion by owner or admin
CREATE POLICY "Users can delete their own support attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'support_attachments'
    AND (
        EXISTS (
            SELECT 1 FROM public.support_tickets
            WHERE id::text = (storage.foldername(name))[1]
            AND user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND is_superadmin = true
        )
    )
);
