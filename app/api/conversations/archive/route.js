import { createClient } from '@/core/utils/supabase/server';
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

        const { conversationId, archive } = await request.json();

        if (!conversationId) {
            return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
        }

        // Verify the user is a participant in this conversation
        const { data: conv, error: convError } = await supabase
            .from('conversations')
            .select('id, archived_by, tenant_id, host_id')
            .eq('id', conversationId)
            .single();

        if (convError || !conv) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        if (conv.tenant_id !== user.id && conv.host_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // The archived_by column is an array of user IDs who have archived this chat
        const currentArchived = conv.archived_by || [];
        let newArchived;

        if (archive) {
            // Add user to archived_by if not already there
            newArchived = currentArchived.includes(user.id)
                ? currentArchived
                : [...currentArchived, user.id];
        } else {
            // Remove user from archived_by
            newArchived = currentArchived.filter(id => id !== user.id);
        }

        const { error: updateError } = await supabase
            .from('conversations')
            .update({ archived_by: newArchived })
            .eq('id', conversationId);

        if (updateError) throw updateError;

        await logActivityEvent({
            request,
            userId: user.id,
            service: 'messaging',
            action: archive ? 'archive_conversation' : 'unarchive_conversation',
            status: 'success',
            message: `${archive ? 'Archived' : 'Unarchived'} conversation ${conversationId}`,
            metadata: {
                conversation_id: conversationId,
                archived: !!archive,
            },
        });

        return NextResponse.json({ success: true, archived: archive });
    } catch (error) {
        console.error('Archive conversation error:', error);
        await logActivityEvent({
            request,
            service: 'messaging',
            action: 'archive_conversation',
            status: 'failed',
            level: 'error',
            message: `Failed to update conversation archive state: ${error.message || error}`,
            metadata: {},
        });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
