import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

// Ejecutar el proxy real con Auth controlado, sin credenciales ni peticiones remotas.
const authState = {
  user: null as { id: string } | null,
  calls: 0,
  clients: 0,
  cookies: [] as Array<{ name: string; value: string; options: Record<string, unknown> }>,
};
Reflect.set(globalThis, '__evaluoProxyAuthTest', authState);
const mockAuthModule = `
  export function createServerClient(_url, _key, options) {
    Reflect.get(globalThis, '__evaluoProxyAuthTest').clients += 1;
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
  assert.equal(authState.calls, 0, 'La portada sin sesión no debe consultar Auth.');
  assert.equal(authState.clients, 0, 'La portada sin sesión no debe inicializar Supabase.');

  for (const cookie of [
    'theme=dark; evaluo_ref=TEST123',
    'sb-test-auth-token-code-verifier=oauth-state',
    'sb-test-auth-token=; sb-test-auth-token.0=',
  ]) {
    const publicGuest = await proxy(
      new NextRequest('https://evaluo.com.ar/', {
        headers: { cookie },
      })
    );
    assert.equal(publicGuest.headers.get('location'), null);
    assert.equal(authState.clients, 0, 'Una cookie ajena, vacía o de PKCE no indica sesión.');
  }

  const guestReferral = await proxy(new NextRequest('https://evaluo.com.ar/?ref=TEST123'));
  assert.equal(guestReferral.cookies.get('evaluo_ref')?.value, 'TEST123');
  assert.equal(authState.calls, 0, 'Los referidos sin sesión no necesitan Auth.');

  const invalidSession = await proxy(
    new NextRequest('https://evaluo.com.ar/', {
      headers: { cookie: 'sb-forged-auth-token=fake-user' },
    })
  );
  assert.equal(invalidSession.headers.get('location'), null);
  assert.equal(authState.calls, 1, 'Una cookie no prueba identidad: debe validarse en Auth.');
  assert.equal(invalidSession.headers.get('cache-control'), 'private, no-store');

  const invalidChunk = await proxy(
    new NextRequest('https://evaluo.com.ar/', {
      headers: { cookie: 'sb-test-auth-token.0=expired-session' },
    })
  );
  assert.equal(invalidChunk.headers.get('location'), null);
  assert.equal(authState.calls, 2, 'También se validan las sesiones en cookies divididas.');

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
  const member = await proxy(
    new NextRequest('https://evaluo.com.ar/?next=https://example.org', {
      headers: { cookie: 'sb-test-auth-token=valid-session' },
    })
  );
  assert.equal(member.status, 307);
  assert.equal(member.headers.get('location'), 'https://evaluo.com.ar/dashboard');
  assert.equal(member.headers.get('cache-control'), 'private, no-store');
  const session = member.cookies.get('sb-test-auth-token.0');
  assert.equal(session?.value, 'refreshed-test-session');
  assert.equal(session?.httpOnly, true);
  assert.equal(session?.secure, true);
  assert.equal(session?.sameSite, 'lax');
  assert.equal(member.cookies.get('sb-test-auth-token.1')?.maxAge, 0);

  for (const cookie of [
    'sb-test-auth-token.0=part-one; sb-test-auth-token.1=part-two',
    'sb-test-auth-token.1=remaining-part',
  ]) {
    const callsBefore = authState.calls;
    const chunkedMember = await proxy(
      new NextRequest('https://evaluo.com.ar/', {
        headers: { cookie },
      })
    );
    assert.equal(chunkedMember.headers.get('location'), 'https://evaluo.com.ar/dashboard');
    assert.equal(authState.calls, callsBefore + 1, 'La redirección necesita Auth válido.');
    assert.equal(
      chunkedMember.cookies.get('sb-test-auth-token.0')?.value,
      'refreshed-test-session'
    );
  }

  const referral = await proxy(
    new NextRequest('https://evaluo.com.ar/?ref=TEST123', {
      headers: { cookie: 'sb-test-auth-token=valid-session' },
    })
  );
  assert.equal(referral.headers.get('location'), 'https://evaluo.com.ar/dashboard');
  assert.equal(referral.cookies.get('evaluo_ref')?.value, 'TEST123');

  const dashboard = await proxy(new NextRequest('https://evaluo.com.ar/dashboard'));
  assert.equal(dashboard.headers.get('location'), null, 'Mi espacio no debe redirigir a sí mismo.');

  authState.user = null;
  authState.cookies = [];
  const callsBeforePrivate = authState.calls;
  const privateGuest = await proxy(new NextRequest('https://evaluo.com.ar/dashboard'));
  assert.equal(new URL(privateGuest.headers.get('location')!).pathname, '/login');
  assert.equal(
    authState.calls,
    callsBeforePrivate + 1,
    'Las rutas privadas mantienen Auth obligatorio.'
  );

  const callsBeforeLogin = authState.calls;
  const loginGuest = await proxy(new NextRequest('https://evaluo.com.ar/login'));
  assert.equal(loginGuest.headers.get('location'), null);
  assert.equal(authState.calls, callsBeforeLogin + 1, 'La optimización se limita a la portada.');

  const callsBeforePublicPage = authState.calls;
  const publicPage = await proxy(new NextRequest('https://evaluo.com.ar/pricing'));
  assert.equal(publicPage.headers.get('location'), null);
  assert.equal(authState.calls, callsBeforePublicPage, 'Las demás páginas públicas no cambian.');
} finally {
  hooks.deregister();
  Reflect.deleteProperty(globalThis, '__evaluoProxyAuthTest');
}

console.log('Authenticated home proxy smoke tests passed.');
