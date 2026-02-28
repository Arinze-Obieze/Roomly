-- Add preferred stay durations to user_lifestyles table
ALTER TABLE "public"."user_lifestyles" 
    ADD COLUMN IF NOT EXISTS "min_stay" integer DEFAULT 6,
    ADD COLUMN IF NOT EXISTS "max_stay" integer DEFAULT 12;

COMMENT ON COLUMN "public"."user_lifestyles"."min_stay" IS 'Minimum intended stay duration in months';
COMMENT ON COLUMN "public"."user_lifestyles"."max_stay" IS 'Maximum intended stay duration in months';
