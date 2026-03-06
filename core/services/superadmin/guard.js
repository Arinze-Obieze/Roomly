import { NextResponse } from 'next/server';
import { createClient } from '@/core/utils/supabase/server';
import { createAdminClient } from '@/core/utils/supabase/admin';

export async function requireSuperadmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const metadataRole = user?.user_metadata?.is_superadmin || user?.app_metadata?.is_superadmin;
  if (metadataRole) {
    return { user, supabase, adminClient: createAdminClient() };
  }

  const { data: roleRow, error: roleError } = await supabase
    .from('users')
    .select('is_superadmin')
    .eq('id', user.id)
    .maybeSingle();

  if (roleError || !roleRow?.is_superadmin) {
    return {
      errorResponse: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { user, supabase, adminClient: createAdminClient() };
}
