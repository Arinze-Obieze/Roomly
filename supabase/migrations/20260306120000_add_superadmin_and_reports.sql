-- Add is_superadmin to users table
ALTER TABLE "public"."users" 
ADD COLUMN IF NOT EXISTS "is_superadmin" boolean DEFAULT false;

-- Create reports table to handle content moderation
CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reporter_id" "uuid" NOT NULL,
    "reported_item_id" "uuid" NOT NULL,
    "reported_item_type" "text" NOT NULL CHECK (reported_item_type IN ('property', 'user', 'message')),
    "reason" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reports_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "fk_reporter" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."reports" OWNER TO "postgres";
ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;

-- RLS policies for reports
CREATE POLICY "Users can insert their own reports" ON "public"."reports" FOR INSERT WITH CHECK (("reporter_id" = "auth"."uid"()));
CREATE POLICY "Superadmins can view all reports" ON "public"."reports" FOR SELECT USING ((EXISTS ( SELECT 1 FROM "public"."users" "users_1" WHERE (("users_1"."id" = "auth"."uid"()) AND ("users_1"."is_superadmin" = true)))));
CREATE POLICY "Superadmins can update reports" ON "public"."reports" FOR UPDATE USING ((EXISTS ( SELECT 1 FROM "public"."users" "users_1" WHERE (("users_1"."id" = "auth"."uid"()) AND ("users_1"."is_superadmin" = true)))));

-- RLS for superadmins on other tables (view/update/delete)
CREATE POLICY "Superadmins can view all users" ON "public"."users" FOR SELECT USING ((EXISTS ( SELECT 1 FROM "public"."users" "users_1" WHERE (("users_1"."id" = "auth"."uid"()) AND ("users_1"."is_superadmin" = true)))));
CREATE POLICY "Superadmins can update any user" ON "public"."users" FOR UPDATE USING ((EXISTS ( SELECT 1 FROM "public"."users" "users_1" WHERE (("users_1"."id" = "auth"."uid"()) AND ("users_1"."is_superadmin" = true)))));

CREATE POLICY "Superadmins can update any property" ON "public"."properties" FOR UPDATE USING ((EXISTS ( SELECT 1 FROM "public"."users" "users_1" WHERE (("users_1"."id" = "auth"."uid"()) AND ("users_1"."is_superadmin" = true)))));
CREATE POLICY "Superadmins can delete any property" ON "public"."properties" FOR DELETE USING ((EXISTS ( SELECT 1 FROM "public"."users" "users_1" WHERE (("users_1"."id" = "auth"."uid"()) AND ("users_1"."is_superadmin" = true)))));
