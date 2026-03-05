-- 1. Create a new storage bucket for direct message attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('message_attachments', 'message_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Alter messages table to add attachment columns
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS attachment_type TEXT,
ADD COLUMN IF NOT EXISTS attachment_data JSONB;

-- 3. Make content column nullable so messages can just be an attachment
ALTER TABLE public.messages
ALTER COLUMN content DROP NOT NULL;

-- 4. Add constraint for attachment types
ALTER TABLE public.messages 
ADD CONSTRAINT messages_attachment_type_check 
CHECK (attachment_type IN ('property', 'image', 'text', 'file', 'document', 'video'));

-- 5. Set up Storage Policies for message_attachments bucket
-- Policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to message_attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK ( bucket_id = 'message_attachments' );

-- Policy to allow anyone to read files from message_attachments
CREATE POLICY "Allow public read from message_attachments"
ON storage.objects FOR SELECT TO public
USING ( bucket_id = 'message_attachments' );
