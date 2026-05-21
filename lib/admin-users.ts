import type { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase-admin';
import { isAdminRole, isAdminUserSession } from '@/lib/roles';

export async function isAdminActor(user: User | null | undefined) {
  if (!user?.id) {
    return false;
  }

  if (isAdminUserSession(user)) {
    return true;
  }

  const admin = createAdminClient();
  const { data } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
  return isAdminRole(data?.role ?? null);
}

export async function listAdminUserIds() {
  const admin = createAdminClient();
  const { data } = await admin.from('profiles').select('id').eq('role', 'admin').limit(500);
  return (data ?? []).map((row) => row.id);
}
