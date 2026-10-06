import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

// Ejecutar el proxy real con Auth controlado, sin credenciales ni peticiones remotas.
const authState = {
  user: null as { id: string } | null,
  calls: 0,
  cookies: [] as Array<{ name: string; value: string; options: Record<string, unknown> }>,
};
Reflect.set(globalThis, '__evaluoProxyAuthTest', authState);
const mockAuthModule = `
  export function createServerClient(_url, _key, options) {
    return {
      auth: {
        async getUser() {
          const state = Reflect.get(globalThis, '__evaluoProxyAuthTest');
          state.calls += 1;
          if (state.cookies.length) options.cookies.setAll(state.cookies);
          return { data: { user: state.user }, error: null };
        }
      },
      async rpc() { return { data: null, error: null }; }
    };
  }
`;
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'next/server') return nextResolve('next/server.js', context);
    if (specifier === '@supabase/ssr') {
      return {
        url: `data:text/javascript,${encodeURIComponent(mockAuthModule)}`,
        shortCircuit: true,
      };
    }
    return nextResolve(specifier, context);
  },
});

try {
  const { NextRequest } = await import('next/server.js');
  const { proxy } = await import('../proxy.ts');

  const guest = await proxy(new NextRequest('https://evaluo.com.ar/'));
  assert.equal(guest.status, 200);
  assert.equal(guest.headers.get('location'), null);
  assert.equal(authState.calls, 1, 'La decisión debe usar Auth, no la presencia de una cookie.');

  const invalidSession = await proxy(
    new NextRequest('https://evaluo.com.ar/', {
      headers: { cookie: 'sb-forged-auth-token=fake-user' },
    })
  );
  assert.equal(invalidSession.headers.get('location'), null);

  authState.user = { id: 'test-user' };
  authState.cookies = [
    {
      name: 'sb-test-auth-token.0',
      value: 'refreshed-test-session',
      options: { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 3600 },
    },
    {
      name: 'sb-test-auth-token.1',
      value: '',
      options: { path: '/', maxAge: 0 },
    },
  ];
  const member = await proxy(new NextRequest('https://evaluo.com.ar/?next=https://example.org'));
  assert.equal(member.status, 307);
  assert.equal(member.headers.get('location'), 'https://evaluo.com.ar/dashboard');
  assert.equal(member.headers.get('cache-control'), 'private, no-store');
  const session = member.cookies.get('sb-test-auth-token.0');
  assert.equal(session?.value, 'refreshed-test-session');
  assert.equal(session?.httpOnly, true);
  assert.equal(session?.secure, true);
  assert.equal(session?.sameSite, 'lax');
  assert.equal(member.cookies.get('sb-test-auth-token.1')?.maxAge, 0);

  const referral = await proxy(new NextRequest('https://evaluo.com.ar/?ref=TEST123'));
  assert.equal(referral.headers.get('location'), 'https://evaluo.com.ar/dashboard');
  assert.equal(referral.cookies.get('evaluo_ref')?.value, 'TEST123');

  const dashboard = await proxy(new NextRequest('https://evaluo.com.ar/dashboard'));
  assert.equal(dashboard.headers.get('location'), null, 'Mi espacio no debe redirigir a sí mismo.');

  authState.user = null;
  authState.cookies = [];
  const privateGuest = await proxy(new NextRequest('https://evaluo.com.ar/dashboard'));
  assert.equal(new URL(privateGuest.headers.get('location')!).pathname, '/login');

  const callsBeforePublicPage = authState.calls;
  const publicPage = await proxy(new NextRequest('https://evaluo.com.ar/pricing'));
  assert.equal(publicPage.headers.get('location'), null);
  assert.equal(authState.calls, callsBeforePublicPage, 'Las demás páginas públicas no cambian.');
} finally {
  hooks.deregister();
  Reflect.deleteProperty(globalThis, '__evaluoProxyAuthTest');
}

console.log('Authenticated home proxy smoke tests passed.');
