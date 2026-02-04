import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // Use global variable to preserve instance during HMR (Hot Module Replacement)
  if (typeof window !== 'undefined' && window.__supabaseClient) {
    return window.__supabaseClient;
  }

  // POLYFILL: Monkey-patch navigator.locks to prevent AbortError
  // The default Web Locks API implementation in some browsers/contexts causes 
  // signals to abort unexpectedly during heavy reloading or multiple tab usage.
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      try {
          const mockLocks = {
              request: async (name, options, callback) => {
                  const cb = callback || options;
                  return await cb({ name });
              },
              query: async () => ({ held: [], pending: [] })
          };
          
          // Force override navigator.locks
          Object.defineProperty(navigator, 'locks', {
              value: mockLocks,
              configurable: true,
              writable: true
          });
      } catch (e) {
          console.warn('Failed to patch navigator.locks:', e);
      }
  }

  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        lock: false, // Explicitly tell Supabase to not use locks (though we patched it anyway)
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        debug: false,
      },
      global: {
        headers: {
           'x-my-custom-header': 'roomly-client',
        }
      }
    }
  );

  if (typeof window !== 'undefined') {
    window.__supabaseClient = client;
  }

  return client;
}
