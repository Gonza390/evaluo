import type { User } from '@supabase/supabase-js';
import type { AppRole } from '@/types/supabase';

export const ADMIN_ROLE: AppRole = 'admin';

function normalizeRole(role: unknown): string | null {
  if (typeof role !== 'string') {
    return null;
  }

  const normalized = role.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export function isAdminRole(role: AppRole | null | undefined) {
  return normalizeRole(role) === ADMIN_ROLE;
}

export function isAdminUserSession(user: User | null | undefined) {
  const appMetadataRole = normalizeRole(user?.app_metadata?.role);
  const userMetadataRole = normalizeRole(user?.user_metadata?.role);
  return appMetadataRole === ADMIN_ROLE || userMetadataRole === ADMIN_ROLE;
}
