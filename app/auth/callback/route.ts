import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextPathRaw = requestUrl.searchParams.get('next');
  // Solo redirigir a rutas internas: rechaza URLs absolutas (https://), scheme
  // relativo (//host) y rutas que no empiecen con '/'.
  const nextPath =
    nextPathRaw &&
    nextPathRaw.startsWith('/') &&
    !nextPathRaw.startsWith('//') &&
    !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(nextPathRaw)
      ? nextPathRaw
      : '/dashboard';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set(name, value, options) {
            cookieStore.set(name, value, options);
          },
          remove(name, options) {
            cookieStore.set(name, '', options);
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session?.user) {
      await supabase.from('profiles').upsert({
        id: data.session.user.id,
        updated_at: new Date().toISOString(),
      });

      const { data: profile } = await supabase
        .from('profiles')
        .select('universidad_id, carrera_id')
        .eq('id', data.session.user.id)
        .maybeSingle();

      const universidadId = String(profile?.universidad_id ?? '').trim();
      const carreraId = String(profile?.carrera_id ?? '').trim();

      if (!universidadId || !carreraId) {
        return NextResponse.redirect(
          `${requestUrl.origin}/completar-perfil?next=${encodeURIComponent(nextPath)}`
        );
      }
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}${nextPath}`);
}
