import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';
import { createAdminClient, isAdminClientConfigured } from '@/lib/supabase-admin';
import {
  getPdfFirstActivationHref,
  hasCompleteAcademicProfile,
  isPdfFirstActivationPath,
} from '@/lib/profile-completion';

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
      if (analyticsSessionKey && isAdminClientConfigured()) {
        try {
          const user = data.session.user;
          const createdAt = new Date(user.created_at).getTime();
          const ageMs = Date.now() - createdAt;
          const isNewUser = Number.isFinite(createdAt) && ageMs >= 0 && ageMs < 10 * 60 * 1000;
          const provider =
            String(user.app_metadata?.provider ?? user.user_metadata?.provider ?? '').trim() ||
            'google';
          const deviceType = detectDeviceType(request.headers.get('user-agent') ?? '');
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
        id: data.session.user.id,
        updated_at: new Date().toISOString(),
      });

      const { data: profile } = await supabase
        .from('profiles')
        .select('universidad_id, carrera_id, active_subjects')
        .eq('id', data.session.user.id)
        .maybeSingle();

      if (
        !hasCompleteAcademicProfile({
          universidadId: profile?.universidad_id,
          carreraId: profile?.carrera_id,
          activeSubjects: profile?.active_subjects,
        })
      ) {
        // Ship B.1: no bloquear activación PDF-first con el gate de perfil académico.
        if (isPdfFirstActivationPath(nextPath)) {
          return NextResponse.redirect(`${requestUrl.origin}${nextPath}`);
        }
        if (nextPath === '/dashboard') {
          return NextResponse.redirect(`${requestUrl.origin}${getPdfFirstActivationHref()}`);
        }
        return NextResponse.redirect(
          `${requestUrl.origin}/completar-perfil?next=${encodeURIComponent(nextPath)}`
        );
      }
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}${nextPath}`);
}
