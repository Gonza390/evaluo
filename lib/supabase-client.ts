import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

let singletonClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

function createClientSingleton() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return createBrowserClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    global: {
      fetch: (...args) => fetch(...args),
    },
    realtime: {
      params: {
        eventsPerSecond: 1,
      },
    },
  });
}

export function getSupabaseBrowserClient() {
  if (typeof window === 'undefined') {
    return createClientSingleton();
  }

  if (!singletonClient) {
    singletonClient = createClientSingleton();
  }

  return singletonClient;
}

export const supabase = getSupabaseBrowserClient();
