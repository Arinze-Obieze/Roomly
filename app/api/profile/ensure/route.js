import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { ensureUserProfile } from '@/core/utils/auth/ensureUserProfile';

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await ensureUserProfile(user);

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error('[profile/ensure POST]', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to ensure profile' },
      { status: 500 }
    );
  }
}
