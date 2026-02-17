
import { SendMailClient } from "zeptomail";

const url = "https://api.zeptomail.com/v1.1/email";
const token = process.env.ZEPTOMAIL_TOKEN;

let client = new SendMailClient({url, token});

export async function sendEmail({ to, subject, html, text }) {
    const fromEmail = process.env.FROM_EMAIL || 'noreply@roomfind.ie';
    const fromName = process.env.FROM_NAME || 'RoomFind';

    if (!token) {
        console.warn('ZEPTOMAIL_TOKEN not found. Email simulation:', { to, subject });
        return { success: true, simulated: true };
    }

    try {
        const response = await client.sendMail({
            "from": 
            {
                "address": fromEmail,
                "name": fromName
            },
            "to": 
            [
                {
                "email_address": 
                    {
                        "address": to,
                        "name": to
                    }
                }
            ],
            "subject": subject,
            "htmlbody": html,
        });
        
        console.log("Email sent successfully");
        return { success: true, data: response };
    } catch (error) {
        console.error('Send Email Error:', error);
        throw error;
    }
}

export async function sendBuddyInvite({ to, inviteLink, inviterName, groupName }) {
    const subject = `${inviterName} invited you to join their RoomFind group!`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0891b2;">You're invited to buddy up!</h2>
            <p style="font-size: 16px; color: #334155;">
                <strong>${inviterName}</strong> has invited you to join the group <strong>"${groupName}"</strong> on roomfind.ie
            </p>
            <p style="font-size: 16px; color: #334155;">
                Searching together is faster, easier, and more fun. Click the button below to join the group.
            </p>
            <div style="margin: 30px 0;">
                <a href="${inviteLink}" style="background-color: #0891b2; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                    Join "${groupName}"
                </a>
            </div>
            <p style="font-size: 14px; color: #64748b;">
                Or copy this link: <br>
                <a href="${inviteLink}" style="color: #0891b2;">${inviteLink}</a>
            </p>
        </div>
    `;
    const text = `${inviterName} invited you to join group "${groupName}". Join here: ${inviteLink}`;

    return sendEmail({ to, subject, html, text });
}
