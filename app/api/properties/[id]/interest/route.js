import { createClient } from '@/core/utils/supabase/server';
import { NextResponse } from 'next/server';
import { invalidatePattern } from '@/core/utils/redis';

export async function POST(request, { params }) {
  try {
    const supabase = await createClient();
    const { id: propertyId } = await params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // 1. Check if interest already exists
    const { data: existing } = await supabase
      .from('property_interests')
      .select('id, status')
      .eq('property_id', propertyId)
      .eq('seeker_id', user.id)
      .maybeSingle();

    if (existing) {
      await invalidatePattern('property:*');
      await invalidatePattern(`seeker:interests:*`);
      await invalidatePattern(`landlord:interests:*`);
      return NextResponse.json({ 
        success: true, 
        message: 'Interest already recorded',
        status: existing.status 
      });
    }

    // 2. Insert new interest record
    const { data, error } = await supabase
      .from('property_interests')
      .insert({
        property_id: propertyId,
        seeker_id: user.id,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    await invalidatePattern('property:*');
    await invalidatePattern(`seeker:interests:*`);
    await invalidatePattern(`landlord:interests:*`);

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error showing interest:', error);
    return NextResponse.json(
      { error: 'Failed to record interest' },
      { status: 500 }
    );
  }
}

// Optional: DELETE to remove interest (un-like)
export async function DELETE(request, { params }) {
    try {
        const supabase = await createClient();
        const { id: propertyId } = await params;
    
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
        const { error } = await supabase
          .from('property_interests')
          .delete()
          .eq('property_id', propertyId)
          .eq('seeker_id', user.id);
    
        if (error) throw error;

        await invalidatePattern('property:*');
        await invalidatePattern(`seeker:interests:*`);
        await invalidatePattern(`landlord:interests:*`);
    
        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Error removing interest:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
}
