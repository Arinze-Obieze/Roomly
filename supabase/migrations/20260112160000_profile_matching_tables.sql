-- Create user_lifestyles table
CREATE TABLE IF NOT EXISTS "public"."user_lifestyles" (
    "user_id" "uuid" NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "cleanliness_level" integer CHECK (cleanliness_level BETWEEN 1 AND 5), -- 1: Messy, 5: Sparkling
    "schedule_type" text, -- '9-5', 'shift', 'student', 'wfh', 'mixed'
    "smoking_status" text, -- 'no', 'outside', 'inside'
    "drinking_habits" text, -- 'non-drinker', 'social', 'frequent'
    "cannabis_friendly" boolean DEFAULT false,
    "dietary_preference" text, -- 'omnivore', 'vegetarian', 'vegan', etc.
    "social_level" integer CHECK (social_level BETWEEN 1 AND 5),
    "noise_tolerance" integer CHECK (noise_tolerance BETWEEN 1 AND 5),
    "pets" jsonb DEFAULT '{"has_pets": false, "accepts_pets": false, "description": ""}'::jsonb,
    "interests" text[],
    "overnight_guests" text, -- 'never', 'rarely', 'occasionally', 'frequently'
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    PRIMARY KEY ("user_id")
);

-- Create match_preferences table
CREATE TABLE IF NOT EXISTS "public"."match_preferences" (
    "user_id" "uuid" NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "age_min" integer DEFAULT 18,
    "age_max" integer DEFAULT 99,
    "gender_preference" text, -- 'any', 'male', 'female', 'non-binary'
    "accepted_smoking" text[], -- Array of acceptable statuses
    "accepted_pets" boolean DEFAULT true,
    "budget_min" numeric,
    "budget_max" numeric,
    "stay_duration_min" integer, -- in months
    "stay_duration_max" integer, -- in months
    "location_areas" text[],
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    PRIMARY KEY ("user_id")
);

-- Enable RLS
ALTER TABLE "public"."user_lifestyles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."match_preferences" ENABLE ROW LEVEL SECURITY;

-- Policies for user_lifestyles
CREATE POLICY "Public profiles are viewable by everyone" 
ON "public"."user_lifestyles" FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own lifestyle" 
ON "public"."user_lifestyles" FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lifestyle" 
ON "public"."user_lifestyles" FOR UPDATE 
USING (auth.uid() = user_id);

-- Policies for match_preferences
CREATE POLICY "Match preferences are viewable by everyone" 
ON "public"."match_preferences" FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own preferences" 
ON "public"."match_preferences" FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON "public"."match_preferences" FOR UPDATE 
USING (auth.uid() = user_id);

-- Grants
GRANT ALL ON TABLE "public"."user_lifestyles" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."match_preferences" TO "anon", "authenticated", "service_role";
