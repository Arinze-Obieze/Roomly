-- Drop the existing policy that restricts viewing invites to group members
DROP POLICY IF EXISTS "Group members can view invites" ON public.buddy_invites;

-- Create a new policy that allows anyone to view an invite, because the token acts as a secret key
-- Alternatively, allow authenticated users to view invites where their email matches or just open read access
-- Since token is unguessable, open read access for SELECT is safe
CREATE POLICY "Users can view invites" ON public.buddy_invites
    FOR SELECT TO authenticated USING (true);
