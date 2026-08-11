import { cache } from 'react';
import type { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase-admin';
import { createClientServer } from '@/lib/supabase-server';
import { ADMIN_ROLE, isAdminRole, isAdminUserSession } from '@/lib/roles';
import type { AppRole } from '@/types/supabase';

export const getCachedProfileRole = cache(async (userId: string): Promise<AppRole | null> => {
  const supabase = await createClientServer();
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
  return data?.role ?? null;
});

const getCachedProfileRoleAdmin = cache(async (userId: string): Promise<AppRole | null> => {
  const admin = createAdminClient();
  const { data } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle();
  return data?.role ?? null;
});

export async function resolveUserRole(user: User | null | undefined): Promise<AppRole | null> {
  if (!user?.id) return null;
  if (isAdminUserSession(user)) return ADMIN_ROLE;
  return getCachedProfileRole(user.id);
}

export async function resolveAdminActor(user: User | null | undefined): Promise<boolean> {
  if (!user?.id) return false;
  if (isAdminUserSession(user)) return true;
  return isAdminRole(await getCachedProfileRoleAdmin(user.id));
}

type AdminAccessContextSuccess = {
  ok: true;
  supabase: Awaited<ReturnType<typeof createClientServer>>;
  user: User;
  role: AppRole;
};

type AdminAccessContextFailure = {
  ok: false;
  reason: 'session_error' | 'unauthenticated' | 'forbidden';
  message: string;
};

export type AdminAccessContextResult = AdminAccessContextSuccess | AdminAccessContextFailure;

export async function getAdminAccessContext(): Promise<AdminAccessContextResult> {
  const supabase = await createClientServer();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return {
      ok: false,
      reason: 'session_error',
      message: 'No pudimos validar tu sesion de usuario.',
    };
  }

  if (!user) {
    return {
      ok: false,
      reason: 'unauthenticated',
      message: 'Necesitas iniciar sesion para acceder al panel de administracion.',
    };
  }

  const role = await resolveUserRole(user);
  if (!isAdminRole(role)) {
    return {
      ok: false,
      reason: 'forbidden',
      message: 'Tu usuario no tiene permisos de administrador.',
    };
  }

  return { ok: true, supabase, user, role: role ?? ADMIN_ROLE };
}

export async function requireAdminAccessContext() {
  const access = await getAdminAccessContext();
  if (!access.ok) {
    throw new Error(access.message);
  }

  return access;
}
