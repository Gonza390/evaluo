import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';
import {
  checkProxyRateLimit,
  getClientIpFromRequest,
  isLikelyBotUserAgent,
  proxyRateLimitHeaders,
} from '@/lib/proxy-security';
import {
  normalizeReferralCode,
  REFERRAL_COOKIE_MAX_AGE_SECONDS,
  REFERRAL_COOKIE_NAME,
} from '@/lib/referrals';

function createClient(request: NextRequest, response: NextResponse) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options as CookieOptions);
          });
        },
      },
    }
  );
}

function persistReferralCookie(request: NextRequest, response: NextResponse) {
  const code = normalizeReferralCode(request.nextUrl.searchParams.get('ref'));
  if (!code) return response;

  response.cookies.set(REFERRAL_COOKIE_NAME, code, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: REFERRAL_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}

function enforceProxyApiProtection(request: NextRequest, pathname: string): NextResponse | null {
  if (!pathname.startsWith('/api/')) return null;

  const isInternalApi = pathname.startsWith('/api/internal');
  if (isInternalApi) return null;

  // Mercado Pago autentica este endpoint mediante x-signature. No debe pasar
  // por el filtro de user-agent destinado a navegadores y bots publicos.
  if (pathname === '/api/webhooks/mercadopago') return null;

  const userAgent = request.headers.get('user-agent') ?? '';
  if (isLikelyBotUserAgent(userAgent)) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const clientKey = getClientIpFromRequest(request);
  const rateLimit = checkProxyRateLimit(`proxy:${clientKey}`, 600, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: proxyRateLimitHeaders(rateLimit) }
    );
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  const apiProtectionBlock = enforceProxyApiProtection(request, pathname);
  if (apiProtectionBlock) {
    return persistReferralCookie(request, apiProtectionBlock);
  }

  const isRegularSimulatorRoute =
    pathname === '/simulador' || /^\/simulador\/[^/]+\/\d+$/.test(pathname);
  const isProtectedSimulatorRoute =
    pathname.startsWith('/simulador/premium') ||
    pathname.startsWith('/simulador/errores') ||
    pathname.startsWith('/simulador/ultimo-intento');

  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/calendario') ||
    pathname.startsWith('/configuracion') ||
    pathname.startsWith('/completar-perfil') ||
    isProtectedSimulatorRoute ||
    pathname.startsWith('/administrador');

  const isLoginRoute = pathname.startsWith('/login');

  if (
    isLoginRoute &&
    request.nextUrl.searchParams.get('mode') === 'signup' &&
    !request.nextUrl.searchParams.get('next') &&
    !request.nextUrl.searchParams.get('redirectTo')
  ) {
    const signupUrl = request.nextUrl.clone();
    signupUrl.searchParams.set('next', '/dashboard?openUpload=1');
    signupUrl.searchParams.set('reason', 'prepare-material');
    return persistReferralCookie(request, NextResponse.redirect(signupUrl));
  }

  if (!isProtectedRoute && !isLoginRoute) {
    return persistReferralCookie(request, response);
  }

  const supabase = createClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const referralCode =
      normalizeReferralCode(request.nextUrl.searchParams.get('ref')) ??
      normalizeReferralCode(request.cookies.get(REFERRAL_COOKIE_NAME)?.value);

    if (referralCode) {
      const rpcClient = supabase as unknown as SupabaseClient;
      try {
        await rpcClient.rpc('claim_my_referral_attribution', {
          p_code: referralCode,
          p_source: 'link',
        });
      } catch {
        // La atribución es best effort y nunca debe bloquear navegación o auth.
      }
    }
  }

  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
    return persistReferralCookie(request, NextResponse.redirect(loginUrl));
  }

  if (isRegularSimulatorRoute && !user) {
    return persistReferralCookie(request, response);
  }

  if (isLoginRoute && user) {
    return persistReferralCookie(request, NextResponse.redirect(new URL('/dashboard', request.url)));
  }

  return persistReferralCookie(request, response);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
