-- Create support tickets table
CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "subject" "text" NOT NULL,
    "category" "text" NOT NULL CHECK (category IN ('general', 'technical', 'billing', 'safety', 'other')),
    "priority" "text" DEFAULT 'medium'::"text" CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    "status" "text" DEFAULT 'open'::"text" CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE
);

-- Create support messages table for conversation threads
CREATE TABLE IF NOT EXISTS "public"."support_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "sender_role" "text" NOT NULL CHECK (sender_role IN ('user', 'admin')),
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "fk_ticket" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_sender" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."support_messages" ENABLE ROW LEVEL SECURITY;

-- RLS for support_tickets
CREATE POLICY "Users can view their own tickets" ON "public"."support_tickets"
    FOR SELECT USING ("auth"."uid"() = "user_id");

CREATE POLICY "Users can insert their own tickets" ON "public"."support_tickets"
    FOR INSERT WITH CHECK ("auth"."uid"() = "user_id");

CREATE POLICY "Superadmins can view all tickets" ON "public"."support_tickets"
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM "public"."users" 
        WHERE id = "auth"."uid"() AND is_superadmin = true
    ));

CREATE POLICY "Superadmins can update any ticket" ON "public"."support_tickets"
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM "public"."users" 
        WHERE id = "auth"."uid"() AND is_superadmin = true
    ));

-- RLS for support_messages
CREATE POLICY "Users can view messages for their own tickets" ON "public"."support_messages"
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM "public"."support_tickets"
        WHERE id = "ticket_id" AND user_id = "auth"."uid"()
    ));

CREATE POLICY "Users can insert messages for their own tickets" ON "public"."support_messages"
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM "public"."support_tickets"
        WHERE id = "ticket_id" AND user_id = "auth"."uid"()
    ));

CREATE POLICY "Superadmins can view all messages" ON "public"."support_messages"
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM "public"."users" 
        WHERE id = "auth"."uid"() AND is_superadmin = true
    ));

CREATE POLICY "Superadmins can insert messages" ON "public"."support_messages"
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM "public"."users" 
        WHERE id = "auth"."uid"() AND is_superadmin = true
    ));
