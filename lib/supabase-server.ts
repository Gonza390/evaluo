import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { ServerDatabase } from '@/types/supabase-server';

type MutableCookie = {
  name: string;
  value: string;
  options?: Parameters<(typeof cookies extends (...args: never[]) => infer T ? Awaited<T> : never)['set']>[2];
};

// Server-only usage
export async function createClientServer() {
  const cookieStore = await cookies();

  return createServerClient<ServerDatabase>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: MutableCookie[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // This can be ignored if the component is a Server Component
          }
        },
      },
    }
  );
}
