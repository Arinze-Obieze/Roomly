-- Create saved_properties table
CREATE TABLE IF NOT EXISTS "public"."saved_properties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "property_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

-- Enable RLS
ALTER TABLE "public"."saved_properties" ENABLE ROW LEVEL SECURITY;

-- Set primary key
ALTER TABLE ONLY "public"."saved_properties"
    ADD CONSTRAINT "saved_properties_pkey" PRIMARY KEY ("id");

-- Foreign Keys
ALTER TABLE ONLY "public"."saved_properties"
    ADD CONSTRAINT "saved_properties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."saved_properties"
    ADD CONSTRAINT "saved_properties_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;

-- Unique constraint to prevent duplicate saves
ALTER TABLE ONLY "public"."saved_properties"
    ADD CONSTRAINT "saved_properties_user_property_unique" UNIQUE ("user_id", "property_id");

-- Policies
-- Users can view their own saved properties
CREATE POLICY "Users can view own saved properties" ON "public"."saved_properties"
    FOR SELECT USING (("auth"."uid"() = "user_id"));

-- Users can insert (save) properties for themselves
CREATE POLICY "Users can save properties" ON "public"."saved_properties"
    FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));

-- Users can delete (unsave) their own properties
CREATE POLICY "Users can unsave properties" ON "public"."saved_properties"
    FOR DELETE USING (("auth"."uid"() = "user_id"));

-- Grant permissions needed
GRANT ALL ON TABLE "public"."saved_properties" TO "anon";
GRANT ALL ON TABLE "public"."saved_properties" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_properties" TO "service_role";
