import type { User } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'student';

export const ADMIN_ROLE: AppRole = 'admin';

function normalizeRole(role: unknown): string | null {
  if (typeof role !== 'string') {
    return null;
  }

  const normalized = role.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export function parseAppRole(role: unknown): AppRole | null {
  const normalized = normalizeRole(role);
  return normalized === 'admin' || normalized === 'student' ? normalized : null;
}

export function isAdminRole(role: AppRole | null | undefined) {
  return normalizeRole(role) === ADMIN_ROLE;
}

export function getTrustedSessionRole(user: User | null | undefined): AppRole | null {
  const appMetadataRole = normalizeRole(user?.app_metadata?.role);
  return appMetadataRole === ADMIN_ROLE ? ADMIN_ROLE : null;
}

export function isAdminUserSession(user: User | null | undefined) {
  return getTrustedSessionRole(user) === ADMIN_ROLE;
}
