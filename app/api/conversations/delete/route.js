import { createClient } from '@/core/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
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

        const { error: deleteError } = await supabase
            .from('conversations')
            .delete()
            .eq('id', conversationId);

        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete conversation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
