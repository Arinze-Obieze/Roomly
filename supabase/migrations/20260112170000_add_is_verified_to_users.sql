-- Add is_verified column to users table
ALTER TABLE "public"."users" 
ADD COLUMN IF NOT EXISTS "is_verified" boolean DEFAULT false;

-- Comment for documentation
COMMENT ON COLUMN "public"."users"."is_verified" IS 'Whether the user has verified their identity';
