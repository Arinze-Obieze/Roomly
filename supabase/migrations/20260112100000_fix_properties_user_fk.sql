-- Fix the foreign key on properties table to reference public.users instead of auth.users
-- This allows PostgREST to detect the relationship between properties and users

-- First drop the existing constraint
ALTER TABLE "public"."properties" DROP CONSTRAINT IF EXISTS "fk_listed_by_user";

-- Add the new constraint referencing public.users
ALTER TABLE "public"."properties"
    ADD CONSTRAINT "fk_listed_by_user"
    FOREIGN KEY ("listed_by_user_id")
    REFERENCES "public"."users"("id")
    ON DELETE CASCADE;
