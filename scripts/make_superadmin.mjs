import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function makeSuperadmin() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: node make_superadmin.mjs <user-email>");
    process.exit(1);
  }

  console.log(`Setting is_superadmin for ${email}...`);

  // First check if user exists in the public.users table
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (fetchError || !user) {
    console.error("Error: Could not find user in public.users table. Have they signed up yet?", fetchError?.message || "");
    process.exit(1);
  }

  // Update public.users
  const { error: updateError } = await supabase
    .from('users')
    .update({ is_superadmin: true })
    .eq('id', user.id);

  if (updateError) {
    console.error("Failed to update public.users:", updateError.message);
    process.exit(1);
  }

  // Update auth.users metadata (for middleware fast-path)
  const { error: authUpdateError } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: { is_superadmin: true },
    app_metadata: { is_superadmin: true }
  });

  if (authUpdateError) {
    console.warn("User updated in DB, but failed to update auth metadata. Middleware fast-path won't work immediately.", authUpdateError.message);
  }

  console.log(`Successfully made ${email} a Superadmin!`);
}

makeSuperadmin();
