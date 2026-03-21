import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. You must be logged in to report content.' }, { status: 401 });
    }

    // Parse body payload
    const body = await request.json();
    const { reported_item_type, reported_item_id, reason } = body;

    // Validate payloads
    if (!reported_item_type || !['post', 'property', 'user', 'message'].includes(reported_item_type)) {
      return NextResponse.json({ error: 'Invalid or missing reported_item_type' }, { status: 400 });
    }
    if (!reported_item_id) {
      return NextResponse.json({ error: 'Missing reported_item_id' }, { status: 400 });
    }
    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return NextResponse.json({ error: 'Please provide a valid reason (minimum 5 characters)' }, { status: 400 });
    }

    // Insert the report
    const { data: report, error: reportError } = await admin
      .from('reports')
      .insert({
        reporter_id: user.id,
        reported_item_type,
        reported_item_id,
        reason: reason.trim(),
        status: 'pending' // Default status for Superadmins to review
      })
      .select('id')
      .single();

    if (reportError) {
      console.error("[POST /api/reports] DB Insert Error:", reportError);
      return NextResponse.json(
        { error: reportError?.message || 'Failed to submit report. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, report_id: report.id }, { status: 201 });

  } catch (err) {
    console.error("[POST /api/reports] Unhandled Exception:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
