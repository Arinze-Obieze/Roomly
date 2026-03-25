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

  const adminClient = createAdminClient();
  const { data: roleRow, error: roleError } = await adminClient
    .from('users')
    .select('is_superadmin, account_status')
    .eq('id', user.id)
    .maybeSingle();

  if (roleError || roleRow?.account_status === 'suspended' || !roleRow?.is_superadmin) {
    return {
      errorResponse: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { user, supabase, adminClient };
}
