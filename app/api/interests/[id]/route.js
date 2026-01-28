import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient();
    const { id: interestId } = await params;
    const { status } = await request.json();

    if (!['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Verify that the user owns the property associated with this interest
    const { data: interest, error: fetchError } = await supabase
      .from('property_interests')
      .select('*, properties(listed_by_user_id)')
      .eq('id', interestId)
      .single();

    if (fetchError || !interest) {
      return NextResponse.json({ error: 'Interest not found' }, { status: 404 });
    }

    if (interest.properties.listed_by_user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Update status
    const { data, error: updateError } = await supabase
      .from('property_interests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', interestId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error updating interest status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
