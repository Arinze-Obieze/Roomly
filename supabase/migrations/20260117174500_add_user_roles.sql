-- Add new columns to user_lifestyles for Role and Logistics
ALTER TABLE "public"."user_lifestyles" 
ADD COLUMN IF NOT EXISTS "primary_role" text DEFAULT 'seeker' CHECK (primary_role IN ('host', 'seeker')),
ADD COLUMN IF NOT EXISTS "current_city" text,
ADD COLUMN IF NOT EXISTS "move_in_urgency" text; -- 'immediately', '1-month', '2-months', 'flexible'
