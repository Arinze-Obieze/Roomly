-- Migration to update properties table with new fields from listing form

ALTER TABLE "public"."properties"
    ADD COLUMN IF NOT EXISTS "rental_type" text DEFAULT 'monthly',
    ADD COLUMN IF NOT EXISTS "offering_type" text DEFAULT 'private_room',
    ADD COLUMN IF NOT EXISTS "year_built" integer,
    ADD COLUMN IF NOT EXISTS "ber_rating" text,
    -- square_meters already exists
    ADD COLUMN IF NOT EXISTS "latitude" double precision,
    ADD COLUMN IF NOT EXISTS "longitude" double precision,
    ADD COLUMN IF NOT EXISTS "transport_options" jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS "is_gaeltacht" boolean DEFAULT false,
    
    ADD COLUMN IF NOT EXISTS "deposit" numeric,
    ADD COLUMN IF NOT EXISTS "bills_option" text DEFAULT 'some', -- included, excluded, some
    ADD COLUMN IF NOT EXISTS "custom_bills" jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS "couples_allowed" boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS "payment_methods" jsonb DEFAULT '[]'::jsonb,
    
    ADD COLUMN IF NOT EXISTS "occupation_preference" text DEFAULT 'any',
    ADD COLUMN IF NOT EXISTS "gender_preference" text DEFAULT 'any',
    ADD COLUMN IF NOT EXISTS "age_min" integer DEFAULT 18,
    ADD COLUMN IF NOT EXISTS "age_max" integer DEFAULT 99,
    ADD COLUMN IF NOT EXISTS "lifestyle_priorities" jsonb DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS "partner_description" text,
    
    ADD COLUMN IF NOT EXISTS "is_immediate" boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS "min_stay_months" integer DEFAULT 6,
    ADD COLUMN IF NOT EXISTS "accept_viewings" boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS "deal_breakers" jsonb DEFAULT '[]'::jsonb;

-- Add comments for clarity
COMMENT ON COLUMN "public"."properties"."rental_type" IS 'monthly, weekly, etc.';
COMMENT ON COLUMN "public"."properties"."offering_type" IS 'entire_place, private_room, shared_room';
COMMENT ON COLUMN "public"."properties"."bills_option" IS 'included, excluded, some';
