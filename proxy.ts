import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';

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

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  const isRegularSimulatorRoute =
    pathname === '/simulador' || /^\/simulador\/[^/]+\/\d+$/.test(pathname);
  const isProtectedSimulatorRoute =
    pathname.startsWith('/simulador/premium') ||
    pathname.startsWith('/simulador/errores') ||
    pathname.startsWith('/simulador/ultimo-intento');

  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
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
    loginUrl.searchParams.set('redirectTo', pathname);
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
