import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';
import { createAdminClient, isAdminClientConfigured } from '@/lib/supabase-admin';
import { isQaAccount } from '@/lib/qa-account';

type SessionCookie = { name: string; value: string; options?: CookieOptions };
function redirectWithSessionCookies(url: string, sessionCookies: SessionCookie[]) {
  const response = NextResponse.redirect(url);
  for (const cookie of sessionCookies) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

function normalizeAnalyticsSessionKey(value: string | null) {
  const normalized = String(value ?? '').trim();
  if (!normalized || normalized.length > 120) return null;
  return /^[a-zA-Z0-9_.:-]+$/.test(normalized) ? normalized : null;
}

function detectDeviceType(userAgent: string) {
  return /mobile|android|iphone|ipad|ipod/i.test(userAgent) ? 'mobile' : 'desktop';
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const analyticsSessionKey = normalizeAnalyticsSessionKey(
    requestUrl.searchParams.get('analytics_session')
  );
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

  if (!code) {
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('next', nextPath);
    loginUrl.searchParams.set('reason', 'auth-expired');
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    const cookieStore = await cookies();
    const sessionCookies: SessionCookie[] = [];
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            // El callback debe devolver los Set-Cookie en la redirección real.
            for (const cookie of cookiesToSet) {
              cookieStore.set(cookie.name, cookie.value, cookie.options);
              sessionCookies.push(cookie);
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session?.user) {
      const user = data.session.user;
      const createdAt = new Date(user.created_at).getTime();
      const ageMs = Date.now() - createdAt;
      const isNewUser = Number.isFinite(createdAt) && ageMs >= 0 && ageMs < 10 * 60 * 1000;
      const provider =
        String(user.app_metadata?.provider ?? user.user_metadata?.provider ?? '').trim() ||
        'google';
      const qaAccount = isQaAccount(user);
      const deviceType = detectDeviceType(request.headers.get('user-agent') ?? '');

      // QA no inserta eventos de autenticación. Tampoco borra sesiones: la clave
      // analytics_session proviene de una URL y no acredita propiedad sobre registros.
      if (analyticsSessionKey && isAdminClientConfigured() && !qaAccount) {
        try {
          const admin = createAdminClient();

          await admin.from('analytics_events').insert([
            {
              event_name: 'auth_completed',
              user_id: user.id,
              session_key: analyticsSessionKey,
              path: nextPath,
              device_type: deviceType,
              metadata: {
                provider,
                auth_kind: isNewUser ? 'signup' : 'login',
                location: 'auth_callback',
                destination: nextPath,
              },
            },
            {
              event_name: isNewUser ? 'signup_completed' : 'login_success',
              user_id: user.id,
              session_key: analyticsSessionKey,
              path: nextPath,
              device_type: deviceType,
              metadata: isNewUser
                ? { provider, location: 'auth_callback', destination: nextPath }
                : { source_path: nextPath },
            },
          ]);
        } catch {
          // La analítica nunca debe bloquear el callback de autenticación.
        }
      }

      await supabase.from('profiles').upsert({
        id: user.id,
        updated_at: new Date().toISOString(),
      });

      return redirectWithSessionCookies(`${requestUrl.origin}${nextPath}`, sessionCookies);
    }

    // Código OAuth expirado, reutilizado o inválido: solicitar nuevo inicio de sesión.
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('next', nextPath);
    loginUrl.searchParams.set('reason', 'auth-expired');
    return redirectWithSessionCookies(loginUrl.toString(), sessionCookies);
  }
}
