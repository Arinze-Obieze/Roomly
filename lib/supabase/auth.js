
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getSupabaseClient() {
  const cookieStore = await cookies();
  // Use the correct Supabase cookie name (update if needed)
  const accessTokenCookie = cookieStore.get('sb-aiovmhiokeisdizhcxvm-auth-token');
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore errors in server context
          }
        },
      },
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );
}

export async function getAuthenticatedUser(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}
