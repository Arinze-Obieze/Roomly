


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."insert_user_profile"("p_id" "uuid", "p_email" "text", "p_full_name" "text", "p_phone_number" "text" DEFAULT NULL::"text", "p_profile_picture" "text" DEFAULT NULL::"text", "p_bio" "text" DEFAULT NULL::"text", "p_date_of_birth" "date" DEFAULT NULL::"date", "p_is_admin" boolean DEFAULT false) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    phone_number,
    profile_picture,
    bio,
    date_of_birth,
    is_admin,
    created_at,
    updated_at
  ) VALUES (
    p_id,
    p_email,
    p_full_name,
    p_phone_number,
    p_profile_picture,
    p_bio,
    p_date_of_birth,
    p_is_admin,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone_number = EXCLUDED.phone_number,
    profile_picture = EXCLUDED.profile_picture,
    bio = EXCLUDED.bio,
    date_of_birth = EXCLUDED.date_of_birth,
    is_admin = EXCLUDED.is_admin,
    updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."insert_user_profile"("p_id" "uuid", "p_email" "text", "p_full_name" "text", "p_phone_number" "text", "p_profile_picture" "text", "p_bio" "text", "p_date_of_birth" "date", "p_is_admin" boolean) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."properties" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "property_type" "text" NOT NULL,
    "price_per_month" numeric NOT NULL,
    "state" "text" NOT NULL,
    "city" "text" NOT NULL,
    "street" "text" NOT NULL,
    "bedrooms" integer NOT NULL,
    "bathrooms" integer NOT NULL,
    "square_meters" numeric NOT NULL,
    "available_from" "date" NOT NULL,
    "amenities" "jsonb",
    "listed_by_user_id" "uuid" NOT NULL,
    "is_active" boolean DEFAULT true,
    "status" "text" DEFAULT 'available'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."properties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_media" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "property_id" "uuid",
    "url" "text" NOT NULL,
    "media_type" "text" NOT NULL,
    "is_primary" boolean DEFAULT false,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."property_media" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "phone_number" "text",
    "profile_picture" "text",
    "bio" "text",
    "date_of_birth" "date",
    "is_admin" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."property_media"
    ADD CONSTRAINT "property_media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."properties"
    ADD CONSTRAINT "fk_listed_by_user" FOREIGN KEY ("listed_by_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."property_media"
    ADD CONSTRAINT "property_media_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can view all users" ON "public"."users" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users" "users_1"
  WHERE (("users_1"."id" = "auth"."uid"()) AND ("users_1"."is_admin" = true)))));



CREATE POLICY "Allow insert for authenticated users" ON "public"."properties" FOR INSERT WITH CHECK (("listed_by_user_id" = "auth"."uid"()));



CREATE POLICY "Allow insert for authenticated users" ON "public"."property_media" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow insert via service role" ON "public"."users" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Users can update own data" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own data" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_media" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."insert_user_profile"("p_id" "uuid", "p_email" "text", "p_full_name" "text", "p_phone_number" "text", "p_profile_picture" "text", "p_bio" "text", "p_date_of_birth" "date", "p_is_admin" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."insert_user_profile"("p_id" "uuid", "p_email" "text", "p_full_name" "text", "p_phone_number" "text", "p_profile_picture" "text", "p_bio" "text", "p_date_of_birth" "date", "p_is_admin" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_user_profile"("p_id" "uuid", "p_email" "text", "p_full_name" "text", "p_phone_number" "text", "p_profile_picture" "text", "p_bio" "text", "p_date_of_birth" "date", "p_is_admin" boolean) TO "service_role";


















GRANT ALL ON TABLE "public"."properties" TO "anon";
GRANT ALL ON TABLE "public"."properties" TO "authenticated";
GRANT ALL ON TABLE "public"."properties" TO "service_role";



GRANT ALL ON TABLE "public"."property_media" TO "anon";
GRANT ALL ON TABLE "public"."property_media" TO "authenticated";
GRANT ALL ON TABLE "public"."property_media" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";


