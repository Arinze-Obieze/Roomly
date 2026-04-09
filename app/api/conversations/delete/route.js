import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';
import { NextResponse } from 'next/server';
import { validateCSRFRequest } from '@/core/utils/csrf';
import { logActivityEvent } from '@/core/services/observability/activity-log';

export async function POST(request) {
    try {
        const csrfValidation = await validateCSRFRequest(request);
        if (!csrfValidation.valid) {
            return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
        }

        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { conversationId } = await request.json();

        if (!conversationId) {
            return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
        }

        const { data: conv, error: convError } = await supabase
            .from('conversations')
            .select('id, tenant_id, host_id')
            .eq('id', conversationId)
            .single();

        if (convError || !conv) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        if (conv.tenant_id !== user.id && conv.host_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const supabaseAdmin = createAdminClient();
        const { error: deleteError } = await supabaseAdmin
            .from('conversations')
            .delete()
            .eq('id', conversationId);

        if (deleteError) throw deleteError;

        await logActivityEvent({
            adminClient: supabaseAdmin,
            request,
            userId: user.id,
            service: 'messaging',
            action: 'delete_conversation',
            status: 'success',
            message: `Deleted conversation ${conversationId}`,
            metadata: {
                conversation_id: conversationId,
                tenant_id: conv.tenant_id,
                host_id: conv.host_id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete conversation error:', error);
        await logActivityEvent({
            request,
            service: 'messaging',
            action: 'delete_conversation',
            status: 'failed',
            level: 'error',
            message: `Failed to delete conversation: ${error.message || error}`,
            metadata: {},
        });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
