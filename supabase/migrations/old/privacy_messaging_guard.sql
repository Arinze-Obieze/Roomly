-- Privacy Messaging Guard Rails
-- This migration updates the RLS policy for inserting conversations to enforce privacy rules.

-- Drop the existing permissive policy
DROP POLICY IF EXISTS "Tenants can insert conversations" ON public.conversations;

-- Create a strict policy for conversation creation
CREATE POLICY "Tenants can insert conversations with privacy check"
ON public.conversations
FOR INSERT
WITH CHECK (
  auth.uid() = tenant_id 
  AND (
    -- 1. Property is active
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id 
      AND p.is_active = true
      AND (
        -- 2A. Property is PUBLIC: Allow
        p.privacy_setting = 'public'
        OR
        -- 2B. Property is PRIVATE: Require ACCEPTED interest
        (
          p.privacy_setting = 'private' 
          AND EXISTS (
            SELECT 1 FROM public.property_interests pi
            WHERE pi.property_id = p.id
            AND pi.seeker_id = auth.uid()
            AND pi.status = 'accepted'
          )
        )
      )
    )
  )
);
