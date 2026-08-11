import { getCachedProfileRole, requireAdminAccessContext } from '@/lib/access-control';

export async function getProfileRole(userId: string) {
  return getCachedProfileRole(userId);
}

export async function requireAdminAccess() {
  return requireAdminAccessContext();
}
