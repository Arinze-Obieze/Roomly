-- Migration: Sync OAuth Users to public.users and backfill avatars/names

-- 1. Create a function to handle new auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    profile_picture, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Unknown User'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(public.users.full_name, EXCLUDED.full_name),
    profile_picture = COALESCE(public.users.profile_picture, EXCLUDED.profile_picture);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on auth.users for new signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Backfill any existing users who signed up via OAuth but have no public.users row
INSERT INTO public.users (id, email, full_name, profile_picture, created_at, updated_at)
SELECT 
  au.id, 
  au.email, 
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', 'Unknown User'),
  COALESCE(au.raw_user_meta_data->>'avatar_url', au.raw_user_meta_data->>'picture'),
  NOW(),
  NOW()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

-- 4. Backfill existing public.users where profile_picture or full_name is null but auth metadata has it
UPDATE public.users pu
SET 
  full_name = COALESCE(pu.full_name, au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name'),
  profile_picture = COALESCE(pu.profile_picture, au.raw_user_meta_data->>'avatar_url', au.raw_user_meta_data->>'picture'),
  updated_at = NOW()
FROM auth.users au
WHERE pu.id = au.id
  AND (
    (pu.profile_picture IS NULL AND (au.raw_user_meta_data->>'avatar_url' IS NOT NULL OR au.raw_user_meta_data->>'picture' IS NOT NULL))
    OR 
    (pu.full_name IS NULL AND (au.raw_user_meta_data->>'full_name' IS NOT NULL OR au.raw_user_meta_data->>'name' IS NOT NULL))
  );
