import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );

  // Retry getUser() up to 3 times on transient network failures.
  // This prevents intermittent Supabase fetch timeouts from incorrectly
  // redirecting authenticated users to /login.
  const MAX_RETRIES = 3;
  let user = null;
  let networkError = false;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { data } = await supabase.auth.getUser();
      user = data.user;
      networkError = false;
      break;
    } catch (error) {
      const isNetworkErr =
        error?.message?.includes('fetch failed') ||
        error?.cause?.code === 'ECONNRESET' ||
        error?.cause?.code === 'ENOTFOUND';

      console.error(
        `[middleware] getUser attempt ${attempt}/${MAX_RETRIES} failed:`,
        error?.message
      );

      if (isNetworkErr && attempt < MAX_RETRIES) {
        // Exponential backoff: 200ms, 400ms
        await sleep(200 * attempt);
        networkError = true;
        continue;
      }

      networkError = isNetworkErr;
      break;
    }
  }

  // If Supabase was completely unreachable on all retries, pass through
  // WITHOUT redirecting — avoids false logout of authenticated users.
  if (networkError) {
    console.warn(
      '[middleware] Supabase unreachable after all retries — allowing request through.'
    );
    return { supabaseResponse, user: null, networkError: true };
  }

  return { supabaseResponse, user };
}
