
const ZOPTOMAIL_API_URL = "https://api.zoptomail.com/v1/sendMail";
// Ensure you have these in your .env
// ZOPTOMAIL_API_KEY
// FROM_EMAIL
// FROM_NAME

export async function sendEmail({ to, subject, html, text }) {
    const apiKey = process.env.ZOPTOMAIL_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || 'noreply@roomfind.iecom';
    const fromName = process.env.FROM_NAME || 'Roomly';

    if (!apiKey) {
        console.warn('ZOPTOMAIL_API_KEY not found. Email simulation:', { to, subject });
        return { success: true, simulated: true };
    }

    try {
        const response = await fetch(ZOPTOMAIL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiKey
            },
            body: JSON.stringify({
                from: { 
                    address: fromEmail, 
                    name: fromName 
                },
                to: [{ 
                    email_address: { 
                        address: to, 
                        name: to 
                    } 
                }],
                subject: subject,
                htmlbody: html,
                textbody: text
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error('Zoptomail Error:', data);
            throw new Error(data.message || 'Failed to send email');
        }

        return { success: true, data };
    } catch (error) {
        console.error('Send Email Error:', error);
        throw error;
    }
}

export async function sendBuddyInvite({ to, inviteLink, inviterName, groupName }) {
    const subject = `${inviterName} invited you to join their Roomly group!`;
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
