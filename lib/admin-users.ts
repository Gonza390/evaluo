import type { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase-admin';
import { resolveAdminActor } from '@/lib/access-control';

export async function isAdminActor(user: User | null | undefined) {
  return resolveAdminActor(user);
}

export async function listAdminUserIds() {
  const admin = createAdminClient();
  const { data } = await admin.from('profiles').select('id').eq('role', 'admin').limit(500);
  return (data ?? []).map((row) => row.id);
}
