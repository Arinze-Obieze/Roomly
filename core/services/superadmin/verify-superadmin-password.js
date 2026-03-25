import { createClient } from '@supabase/supabase-js';

export async function verifySuperadminPassword(email, password) {
  if (!email || !password) {
    return { valid: false, error: 'Password confirmation is required.' };
  }

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const { error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { valid: false, error: 'Password confirmation failed.' };
  }

  await client.auth.signOut();
  return { valid: true };
}

