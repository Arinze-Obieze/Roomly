-- 1. Create a new storage bucket for buddy group attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('buddy_attachments', 'buddy_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Update the check constraint on buddy_messages
-- First, drop the old constraint
ALTER TABLE public.buddy_messages 
DROP CONSTRAINT IF EXISTS buddy_messages_attachment_type_check;

-- Add the new constraint allowing 'file' and 'document'
ALTER TABLE public.buddy_messages 
ADD CONSTRAINT buddy_messages_attachment_type_check 
CHECK (attachment_type IN ('property', 'image', 'text', 'file', 'document', 'video'));

-- 3. Set up Storage Policies for buddy_attachments bucket
-- Policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to buddy_attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK ( bucket_id = 'buddy_attachments' );

-- Policy to allow anyone to read files from buddy_attachments
CREATE POLICY "Allow public read from buddy_attachments"
ON storage.objects FOR SELECT TO public
USING ( bucket_id = 'buddy_attachments' );
