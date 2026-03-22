import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId');
    const path = searchParams.get('path');
    const expiresIn = Math.min(60 * 30, Math.max(30, Number(searchParams.get('expiresIn') || 600))); // 30s–30m

    if (!ticketId || !path) {
      return NextResponse.json({ error: 'ticketId and path are required' }, { status: 400 });
    }
    if (typeof path !== 'string' || path.length > 500) {
      return NextResponse.json({ error: 'Invalid attachment path' }, { status: 400 });
    }

    // Ticket access check: owner or superadmin
    const [{ data: profile }, { data: ticket }] = await Promise.all([
      supabase.from('users').select('is_superadmin').eq('id', user.id).maybeSingle(),
      supabase.from('support_tickets').select('id, user_id').eq('id', ticketId).maybeSingle(),
    ]);

    const isAdmin = !!profile?.is_superadmin;
    const isOwner = ticket?.user_id === user.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Ensure the requested path is actually referenced by a message on this ticket.
    const { data: msgRef } = await supabase
      .from('support_messages')
      .select('id')
      .eq('ticket_id', ticketId)
      .filter('attachment_data->>path', 'eq', path)
      .maybeSingle();

    if (!msgRef) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from('support_attachments')
      .createSignedUrl(path, expiresIn);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: 'Failed to sign attachment URL' }, { status: 500 });
    }

    return NextResponse.json({ url: data.signedUrl, expiresIn });
  } catch (error) {
    console.error('[Support Attachment URL] Error:', error);
    return NextResponse.json({ error: 'Failed to sign attachment URL' }, { status: 500 });
  }
}
