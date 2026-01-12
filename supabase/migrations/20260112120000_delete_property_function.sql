-- Create a secure function to delete properties
-- This bypasses RLS issues with cascading deletes on property_media

CREATE OR REPLACE FUNCTION delete_property(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the current authenticated user
  v_user_id := auth.uid();

  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM properties 
    WHERE id = p_id AND listed_by_user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Not authorized to delete this property';
  END IF;

  -- Delete media first (bypassing RLS)
  DELETE FROM property_media WHERE property_id = p_id;

  -- Delete the property
  DELETE FROM properties WHERE id = p_id;
END;
$$;
