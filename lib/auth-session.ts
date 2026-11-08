import 'server-only';

import { cache } from 'react';
import type { UserAppMetadata, UserMetadata } from '@supabase/supabase-js';
import { createClientServer } from '@/lib/supabase-server';

/**
 * Valida la sesión una sola vez por render de servidor. No reemplaza los
 * controles de autorización de cada acción o endpoint.
 */
export const getRequestUser = cache(async () => {
  const supabase = await createClientServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
});

export type SessionUser = {
  id: string;
  email?: string;
  app_metadata: UserAppMetadata;
  user_metadata: UserMetadata;
  is_anonymous: boolean;
};

/**
 * Usuario del request leído de los claims del JWT con `getClaims()`.
 *
 * - Con claves de firma asimétricas (ES256/RS256) la firma se verifica en el
 *   servidor con el JWKS en memoria: no hay viaje al servidor de Auth.
 * - Con el secreto compartido (HS256), supabase-js cae solo a `getUser()`:
 *   mismo costo que antes, nunca peor.
 * - `cache()` lo resuelve una sola vez por request aunque lo pidan varios
 *   componentes.
 *
 * Límite: no detecta un usuario borrado o una sesión revocada hasta que vence
 * el JWT (1 h por defecto). Para pagos, cambios de cuenta y `/administrador`
 * seguir usando `supabase.auth.getUser()`.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClientServer();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  return {
    id: claims.sub,
    email: claims.email,
    app_metadata: claims.app_metadata ?? {},
    user_metadata: claims.user_metadata ?? {},
    is_anonymous: claims.is_anonymous === true,
  };
});
