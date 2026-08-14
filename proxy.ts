import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';
import {
  checkProxyRateLimit,
  getClientIpFromRequest,
  isLikelyBotUserAgent,
  proxyRateLimitHeaders,
} from '@/lib/proxy-security';

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

function enforceProxyApiProtection(request: NextRequest, pathname: string): NextResponse | null {
  if (!pathname.startsWith('/api/')) return null;

  const isInternalApi = pathname.startsWith('/api/internal');
  if (isInternalApi) return null;

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
    return apiProtectionBlock;
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

  if (!isProtectedRoute && !isLoginRoute) {
    return response;
  }

  const supabase = createClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isRegularSimulatorRoute && !user) {
    return response;
  }

  if (isLoginRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
