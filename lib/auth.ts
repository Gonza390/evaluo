import { createClientServer } from '@/lib/supabase-server';
import { ADMIN_ROLE, isAdminRole, isAdminUserSession } from '@/lib/roles';

export async function getProfileRole(userId: string) {
  const supabase = await createClientServer();
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
  return data?.role ?? null;
}

export async function requireAdminAccess() {
  const supabase = await createClientServer();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error('No pudimos validar tu sesión de usuario.');
  }

  if (!user) {
    throw new Error('Necesitas iniciar sesión para acceder al panel de administración.');
  }

  if (isAdminUserSession(user)) {
    return { supabase, user, role: ADMIN_ROLE };
  }

  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const profileRole = data?.role ?? null;
  if (!isAdminRole(profileRole)) {
    throw new Error('Tu usuario no tiene permisos de administrador.');
  }

  return { supabase, user, role: profileRole };
}
