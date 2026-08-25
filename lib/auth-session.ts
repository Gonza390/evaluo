import 'server-only';

import { cache } from 'react';
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
