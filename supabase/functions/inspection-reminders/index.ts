import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const zeptoToken = Deno.env.get("ZEPTOMAIL_TOKEN");
const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_KEY");

const zeptoUrl = "https://api.zeptomail.com/v1.1/email";

async function sendEmail({ to, subject, text, html }) {
    if (!zeptoToken) {
        console.log("ZeptoMail token not configured, skipping email to:", to);
        return;
    }

    const response = await fetch(zeptoUrl, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": zeptoToken,
        },
        body: JSON.stringify({
            "from": {
                "address": "noreply@roomfind.ie",
                "name": "RoomFind"
            },
            "to": [{
                "email_address": {
                    "address": to,
                    "name": to
                }
            }],
            "subject": subject,
            "textbody": text,
            "htmlbody": html
        })
    });

    if (!response.ok) {
        console.error("ZeptoMail Error:", await response.text());
    } else {
        console.log("Email sent successfully to:", to);
    }
}

function formatDate(dateStr, timeStr) {
    return new Date(`${dateStr}T${timeStr}`).toLocaleString('en-IE', {
        weekday: 'long', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit'
    });
}

serve(async (req) => {
    try {
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Missing Supabase configuration");
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const now = new Date();
        
        // Target time 1: Exactly 24 hours from now (Reminder)
        const targetReminder = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const reminderDate = targetReminder.toISOString().split('T')[0];
        
        // Target time 2: Exactly 24 hours ago (Post check-in)
        const targetFollowup = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const followupDate = targetFollowup.toISOString().split('T')[0];

        // 1. Fetch upcoming confirmed inspections (for reminder)
        const { data: upcomingMsg, error: upcomingErr } = await supabase
            .from("messages")
            .select(`
                attachment_data,
                conversation:conversations (
                    id, property_id,
                    host:users!host_id (id, email, full_name),
                    tenant:users!tenant_id (id, email, full_name),
                    property:properties(title)
                )
            `)
            .eq("attachment_type", "inspection_request")
            .contains("attachment_data", { status: "confirmed", date: reminderDate });

        if (upcomingErr) throw upcomingErr;

        // Process upcoming reminders
        for (const msg of upcomingMsg || []) {
            const data = msg.attachment_data;
            const conv = msg.conversation;
            if (!conv || !data || !data.time) continue;
            
            // Basic matching of time (checking if hour matches, ignoring exact minutes for cron flexibility)
            const inspectionHour = parseInt(data.time.split(':')[0], 10);
            if (inspectionHour !== targetReminder.getHours()) continue;

            const formattedTime = formatDate(data.date, data.time);
            const propTitle = conv.property?.title || "Property";

            // Send to Host
            if (conv.host?.email) {
                await sendEmail({
                    to: conv.host.email,
                    subject: `Reminder: Upcoming Inspection for ${propTitle}`,
                    text: `Reminder: You have an inspection scheduled for ${propTitle} tomorrow at ${formattedTime}.`,
                    html: `<p>Reminder: You have an inspection scheduled for <strong>${propTitle}</strong> tomorrow at <strong>${formattedTime}</strong>.</p>`
                });
            }

            // Send to Tenant
            if (conv.tenant?.email) {
                await sendEmail({
                    to: conv.tenant.email,
                    subject: `Reminder: Upcoming Inspection for ${propTitle}`,
                    text: `Reminder: You have an inspection scheduled for ${propTitle} tomorrow at ${formattedTime}.`,
                    html: `<p>Reminder: You have an inspection scheduled for <strong>${propTitle}</strong> tomorrow at <strong>${formattedTime}</strong>.</p>`
                });
            }
            
            // Optionally, inject a system chat message here
             await supabase.from('messages').insert({
                 conversation_id: conv.id,
                 sender_id: conv.host.id, // Or a system UUID
                 content: `System Reminder: You have an inspection scheduled for tomorrow at ${data.time}.`,
                 is_read: false
             });
        }


        // 2. Fetch past confirmed inspections (for follow-up)
        const { data: pastMsg, error: pastErr } = await supabase
            .from("messages")
            .select(`
                id, attachment_data,
                conversation:conversations (
                    id, tenant:users!tenant_id (email, full_name),
                    property:properties(title)
                )
            `)
            .eq("attachment_type", "inspection_request")
            .contains("attachment_data", { status: "confirmed", date: followupDate });

        if (pastErr) throw pastErr;

        // Process past follow-ups
        for (const msg of pastMsg || []) {
            const data = msg.attachment_data;
            const conv = msg.conversation;
            if (!conv || !data || !data.time || data.followup_sent) continue;

            const inspectionHour = parseInt(data.time.split(':')[0], 10);
            if (inspectionHour !== targetFollowup.getHours()) continue;

            const propTitle = conv.property?.title || "Property";

            // Send to Tenant
            if (conv.tenant?.email) {
                await sendEmail({
                    to: conv.tenant.email,
                    subject: `How was your inspection for ${propTitle}?`,
                    text: `How did your inspection for ${propTitle} go? Let us know if you're ready to proceed!`,
                    html: `
                        <p>How did your inspection for <strong>${propTitle}</strong> go?</p>
                        <p>Check your messages on RoomFind to continue the conversation!</p>
                    `
                });
            }

            // Mark as follow up sent
            await supabase.from('messages').update({
                attachment_data: { ...data, followup_sent: true }
            }).eq('id', msg.id);
        }

        return new Response(JSON.stringify({ success: true, message: "Reminders processed" }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
