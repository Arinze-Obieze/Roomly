-- Fix infinite recursion in users RLS policy
-- The issue is that checking "is_admin" on the users table triggers the RLS policy again recursively

-- Create a secure function to check admin status without triggering RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users WHERE id = auth.uid()),
    false
  );
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all users" ON "public"."users";

-- Recreate the policy using the secure function
CREATE POLICY "Admins can view all users"
ON "public"."users"
FOR SELECT
USING (
  (auth.uid() = id) OR (public.is_admin() = true)
);

-- Ensure the function is accessible
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
