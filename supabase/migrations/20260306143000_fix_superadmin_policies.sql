-- Avoid recursive RLS checks for superadmin and ensure superadmins can read full admin datasets.

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_superadmin FROM public.users WHERE id = auth.uid()),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO anon;

DROP POLICY IF EXISTS "Superadmins can view all users" ON public.users;
CREATE POLICY "Superadmins can view all users"
ON public.users
FOR SELECT
USING ((auth.uid() = id) OR public.is_superadmin());

DROP POLICY IF EXISTS "Superadmins can update any user" ON public.users;
CREATE POLICY "Superadmins can update any user"
ON public.users
FOR UPDATE
USING (public.is_superadmin())
WITH CHECK (public.is_superadmin());

DROP POLICY IF EXISTS "Superadmins can view all reports" ON public.reports;
CREATE POLICY "Superadmins can view all reports"
ON public.reports
FOR SELECT
USING (public.is_superadmin());

DROP POLICY IF EXISTS "Superadmins can update reports" ON public.reports;
CREATE POLICY "Superadmins can update reports"
ON public.reports
FOR UPDATE
USING (public.is_superadmin())
WITH CHECK (public.is_superadmin());

DROP POLICY IF EXISTS "Superadmins can view all properties" ON public.properties;
CREATE POLICY "Superadmins can view all properties"
ON public.properties
FOR SELECT
USING (public.is_superadmin());

DROP POLICY IF EXISTS "Superadmins can update any property" ON public.properties;
CREATE POLICY "Superadmins can update any property"
ON public.properties
FOR UPDATE
USING (public.is_superadmin())
WITH CHECK (public.is_superadmin());

DROP POLICY IF EXISTS "Superadmins can delete any property" ON public.properties;
CREATE POLICY "Superadmins can delete any property"
ON public.properties
FOR DELETE
USING (public.is_superadmin());
